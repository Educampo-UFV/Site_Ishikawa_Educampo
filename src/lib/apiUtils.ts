/**
 * @file apiUtils.ts
 * @description Utilitários globais para comunicação de rede segura com a API (BFF),
 * tratamento estruturado de erros e telemetria de IA.
 */

export const HTTP_STATUS = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const DEFAULT_ERROR_MESSAGES = {
  GENERIC_SERVER_ERROR: "Ocorreu um erro inesperado no servidor. Por favor, tente novamente.",
  VALIDATION_ERROR: "Por favor, corrija os erros nos campos indicados.",
  EXPIRED_SESSION: "Sessão expirada ou credenciais inválidas.",
  UNAVAILABLE_SERVICE: "Serviço temporariamente indisponível.",
} as const;

export interface ApiErrorDetail {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface ApiErrorPayload {
  error_code?: string;
  message?: string;
  details?: Record<string, unknown>;
  detail?: ApiErrorDetail[] | string;
}

export interface ApiErrorResult {
  errorCode: string;
  userMessage: string;
  fieldErrors: Record<string, string>;
  httpStatus: number;
}

export interface AiTelemetry {
  tokens?: number;
  reasoningTokens?: number;
  costUsd?: number;
  provider?: string;
}

/**
 * @description Extrai dicionário de erros por campo a partir da lista de detalhes Pydantic (HTTP 422).
 */
function parsePydanticFieldErrors(detail: ApiErrorDetail[]): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const item of detail) {
    if (item.loc && item.loc.length > 0) {
      const fieldKey = String(item.loc[item.loc.length - 1]);
      fieldErrors[fieldKey] = item.msg;
    }
  }
  return fieldErrors;
}

/**
 * @description Map do código de erro baseado no status HTTP quando a API não retorna error_code explícito.
 */
function resolveErrorCodeByStatus(status: number): string {
  switch (status) {
    case HTTP_STATUS.UNAUTHORIZED: return "UNAUTHORIZED";
    case HTTP_STATUS.FORBIDDEN: return "FORBIDDEN";
    case HTTP_STATUS.NOT_FOUND: return "NOT_FOUND";
    case HTTP_STATUS.CONFLICT: return "CONFLICT";
    case HTTP_STATUS.TOO_MANY_REQUESTS: return "RATE_LIMIT_EXCEEDED";
    case HTTP_STATUS.SERVICE_UNAVAILABLE: return "SERVICE_UNAVAILABLE";
    case HTTP_STATUS.INTERNAL_SERVER_ERROR: return "INTERNAL_SERVER_ERROR";
    default: return "UNKNOWN_ERROR";
  }
}

/**
 * @description Parseia respostas HTTP de erro da API v2.0.0, desestruturando erros de negócio
 * (`EducampoBaseException`) e erros de validação do Pydantic (`HTTP 422`).
 */
export async function parseApiError(response: Response): Promise<ApiErrorResult> {
  const httpStatus = response.status;
  const fieldErrors: Record<string, string> = {};
  let errorCode = resolveErrorCodeByStatus(httpStatus);
  let userMessage: string = DEFAULT_ERROR_MESSAGES.GENERIC_SERVER_ERROR;

  try {
    const data: ApiErrorPayload = await response.json();

    if (httpStatus === HTTP_STATUS.UNPROCESSABLE_ENTITY && Array.isArray(data.detail)) {
      return {
        errorCode: "VALIDATION_ERROR",
        userMessage: DEFAULT_ERROR_MESSAGES.VALIDATION_ERROR,
        fieldErrors: parsePydanticFieldErrors(data.detail),
        httpStatus
      };
    }

    if (data.error_code || data.message || typeof data.detail === "string") {
      errorCode = data.error_code || (httpStatus === HTTP_STATUS.SERVICE_UNAVAILABLE ? "SERVICE_UNAVAILABLE" : "BUSINESS_ERROR");
      userMessage = data.message || (typeof data.detail === "string" ? data.detail : userMessage);

      if (data.details && typeof data.details === "object") {
        for (const [key, val] of Object.entries(data.details)) {
          if (typeof val === "string" || typeof val === "number") {
            fieldErrors[key] = String(userMessage);
          }
        }
      }
    }
  } catch (e) {
    if (httpStatus === HTTP_STATUS.UNAUTHORIZED) {
      userMessage = DEFAULT_ERROR_MESSAGES.EXPIRED_SESSION;
    } else if (httpStatus === HTTP_STATUS.SERVICE_UNAVAILABLE) {
      userMessage = DEFAULT_ERROR_MESSAGES.UNAVAILABLE_SERVICE;
    }
  }

  return {
    errorCode,
    userMessage,
    fieldErrors,
    httpStatus
  };
}

/**
 * @description Extrai os cabeçalhos de telemetria de IA (`X-IA-*`) retornados pela API.
 */
export function extractAiTelemetry(headers: Headers): AiTelemetry {
  const tokensStr = headers.get("X-IA-Tokens");
  const reasoningTokensStr = headers.get("X-IA-Reasoning-Tokens");
  const costUsdStr = headers.get("X-IA-Custo-Dolar");
  const provider = headers.get("X-IA-Provider") || undefined;

  return {
    tokens: tokensStr ? parseInt(tokensStr, 10) : undefined,
    reasoningTokens: reasoningTokensStr ? parseInt(reasoningTokensStr, 10) : undefined,
    costUsd: costUsdStr ? parseFloat(costUsdStr) : undefined,
    provider
  };
}

/**
 * @description Wrapper do `fetch` nativo que implementa os padrões arquiteturais de 
 * Circuit Breaker (Limite de Tentativas) e Exponential Backoff (Espera Progressiva).
 */
export async function fetchComResiliencia(
  url: string,
  options?: RequestInit,
  maxTentativas: number = 3,
  tempoBaseMs: number = 2000,
  capTempoMs: number = 10000,
  timeoutMs?: number
): Promise<Response> {
  let tentativaAtual = 1;

  while (tentativaAtual <= maxTentativas) {
    const controller = new AbortController();
    let timeoutId: NodeJS.Timeout | undefined;
    
    const fetchOptions: RequestInit = { ...options };
    if (timeoutMs) {
      timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      fetchOptions.signal = controller.signal;
    }

    try {
      const response = await fetch(url, fetchOptions);

      if (timeoutId) clearTimeout(timeoutId);

      if (!response.ok && [502, 503, 504].includes(response.status)) {
        throw new Error(`Falha transitória do servidor (Status: ${response.status})`);
      }

      return response;
    } catch (error: any) {
      if (timeoutId) clearTimeout(timeoutId);

      const isTimeout = error.name === "AbortError";
      const msgLog = isTimeout ? `Timeout atingido (${timeoutMs}ms)` : error.message;

      if (tentativaAtual >= maxTentativas) {
        console.error(`[Circuit Breaker] Rota ${url} falhou após ${maxTentativas} tentativas. Erro fatal: ${msgLog}. Abortando.`);
        throw error;
      }

      const tempoEspera = Math.min(tempoBaseMs * Math.pow(2, tentativaAtual - 1), capTempoMs);
      await new Promise(resolve => setTimeout(resolve, tempoEspera));
      tentativaAtual++;
    }
  }

  throw new Error(`Erro fatal em fetchComResiliencia para a rota ${url}`);
}