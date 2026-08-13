/**
 * @file apiUtils.ts
 * @description Utilitários globais para comunicação de rede segura com a API (BFF),
 * tratamento estruturado de erros e telemetria de IA.
 */

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
 * @description Parseia respostas HTTP de erro da API v2.0.0, desestruturando erros de negócio
 * (`EducampoBaseException`) e erros de validação do Pydantic (`HTTP 422`).
 */
export async function parseApiError(response: Response): Promise<ApiErrorResult> {
  const httpStatus = response.status;
  const fieldErrors: Record<string, string> = {};
  let errorCode = "UNKNOWN_ERROR";
  let userMessage = "Ocorreu um erro inesperado no servidor. Por favor, tente novamente.";

  try {
    const data: ApiErrorPayload = await response.json();

    if (httpStatus === 422 && Array.isArray(data.detail)) {
      errorCode = "VALIDATION_ERROR";
      userMessage = "Por favor, corrija os erros nos campos indicados.";
      for (const item of data.detail) {
        if (item.loc && item.loc.length > 0) {
          const fieldKey = String(item.loc[item.loc.length - 1]);
          fieldErrors[fieldKey] = item.msg;
        }
      }
    } else if (data.error_code || data.message || typeof data.detail === "string") {
      errorCode = data.error_code || (httpStatus === 503 ? "SERVICE_UNAVAILABLE" : "BUSINESS_ERROR");
      userMessage = data.message || (typeof data.detail === "string" ? data.detail : userMessage);

      if (data.details && typeof data.details === "object") {
        for (const [key, val] of Object.entries(data.details)) {
          if (typeof val === "string" || typeof val === "number") {
            fieldErrors[key] = String(userMessage);
          }
        }
      }
    } else {
      if (httpStatus === 401) errorCode = "UNAUTHORIZED";
      else if (httpStatus === 403) errorCode = "FORBIDDEN";
      else if (httpStatus === 404) errorCode = "NOT_FOUND";
      else if (httpStatus === 409) errorCode = "CONFLICT";
      else if (httpStatus === 429) errorCode = "RATE_LIMIT_EXCEEDED";
      else if (httpStatus === 503) errorCode = "SERVICE_UNAVAILABLE";
      else if (httpStatus >= 500) errorCode = "INTERNAL_SERVER_ERROR";
    }
  } catch (e) {
    if (httpStatus === 401) {
      errorCode = "UNAUTHORIZED";
      userMessage = "Sessão expirada ou credenciais inválidas.";
    } else if (httpStatus === 503) {
      errorCode = "SERVICE_UNAVAILABLE";
      userMessage = "Serviço temporariamente indisponível.";
    } else if (httpStatus >= 500) {
      errorCode = "INTERNAL_SERVER_ERROR";
      userMessage = "Ocorreu um erro inesperado no servidor. Por favor, tente novamente.";
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