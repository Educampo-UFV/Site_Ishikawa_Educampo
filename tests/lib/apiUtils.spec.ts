/**
 * @file apiUtils.spec.ts
 * @description Suíte de testes unitários para as funções parseApiError e extractAiTelemetry em src/lib/apiUtils.ts.
 */

import { parseApiError, extractAiTelemetry, ApiErrorResult, AiTelemetry } from '../../src/lib/apiUtils';

// Polyfill para a classe Response no ambiente de testes Node/Jest se ausente
const createMockResponse = (body: any, status: number = 200, headersObj: Record<string, string> = {}) => {
  const headersMap = new Map(Object.entries(headersObj));
  return {
    status,
    headers: {
      get: (key: string) => headersMap.get(key) || null
    },
    json: async () => {
      if (typeof body === 'string') {
        try {
          return JSON.parse(body);
        } catch (e) {
          throw new Error('Invalid JSON');
        }
      }
      return body;
    }
  } as unknown as Response;
};

describe('apiUtils - Centralized Error Parsing & AI Telemetry Engine', () => {

  describe('parseApiError', () => {
    it('deve parsear erro de e-mail duplicado (HTTP 409 DUPLICATE_EMAIL)', async () => {
      // Arrange
      const mockResponseBody = {
        error_code: 'DUPLICATE_EMAIL',
        message: "O e-mail 'produtor.existente@fazenda.com.br' já está cadastrado no sistema.",
        details: { email: 'produtor.existente@fazenda.com.br' }
      };
      const mockResponse = createMockResponse(mockResponseBody, 409);

      // Act
      const result: ApiErrorResult = await parseApiError(mockResponse);

      // Assert
      expect(result.httpStatus).toBe(409);
      expect(result.errorCode).toBe('DUPLICATE_EMAIL');
      expect(result.userMessage).toBe("O e-mail 'produtor.existente@fazenda.com.br' já está cadastrado no sistema.");
      expect(result.fieldErrors.email).toBe("O e-mail 'produtor.existente@fazenda.com.br' já está cadastrado no sistema.");
    });

    it('deve parsear erro de regra de negócio para rebanho inválido (HTTP 400 INVALID_HERD_SIZE)', async () => {
      // Arrange
      const mockResponseBody = {
        error_code: 'INVALID_HERD_SIZE',
        message: 'O total do rebanho (50) não pode ser menor que o total de vacas (100).',
        details: { total_vacas: 100, total_rebanho: 50 }
      };
      const mockResponse = createMockResponse(mockResponseBody, 400);

      // Act
      const result: ApiErrorResult = await parseApiError(mockResponse);

      // Assert
      expect(result.httpStatus).toBe(400);
      expect(result.errorCode).toBe('INVALID_HERD_SIZE');
      expect(result.userMessage).toBe('O total do rebanho (50) não pode ser menor que o total de vacas (100).');
      expect(result.fieldErrors.total_rebanho).toBe('O total do rebanho (50) não pode ser menor que o total de vacas (100).');
    });

    it('deve parsear erro de validação Pydantic (HTTP 422 Unprocessable Entity)', async () => {
      // Arrange
      const mockResponseBody = {
        detail: [
          {
            loc: ['body', 'ccs'],
            msg: 'Input should be a valid integer, unable to parse string as an integer',
            type: 'int_parsing'
          },
          {
            loc: ['body', 'total_vacas'],
            msg: 'Input should be greater than 0',
            type: 'greater_than'
          }
        ]
      };
      const mockResponse = createMockResponse(mockResponseBody, 422);

      // Act
      const result: ApiErrorResult = await parseApiError(mockResponse);

      // Assert
      expect(result.httpStatus).toBe(422);
      expect(result.errorCode).toBe('VALIDATION_ERROR');
      expect(result.userMessage).toBe('Por favor, corrija os erros nos campos indicados.');
      expect(result.fieldErrors).toEqual({
        ccs: 'Input should be a valid integer, unable to parse string as an integer',
        total_vacas: 'Input should be greater than 0'
      });
    });

    it('deve parsear erro de credenciais inválidas (HTTP 401 INVALID_CREDENTIALS)', async () => {
      // Arrange
      const mockResponseBody = {
        error_code: 'INVALID_CREDENTIALS',
        message: 'E-mail ou senha incorretos.'
      };
      const mockResponse = createMockResponse(mockResponseBody, 401);

      // Act
      const result: ApiErrorResult = await parseApiError(mockResponse);

      // Assert
      expect(result.httpStatus).toBe(401);
      expect(result.errorCode).toBe('INVALID_CREDENTIALS');
      expect(result.userMessage).toBe('E-mail ou senha incorretos.');
    });

    it('deve parsear erro de serviço indisponível (HTTP 503 SERVICE_UNAVAILABLE)', async () => {
      // Arrange
      const mockResponseBody = {
        detail: 'API de Machine Learning em inicialização ou indisponível no momento.'
      };
      const mockResponse = createMockResponse(mockResponseBody, 503);

      // Act
      const result: ApiErrorResult = await parseApiError(mockResponse);

      // Assert
      expect(result.httpStatus).toBe(503);
      expect(result.errorCode).toBe('SERVICE_UNAVAILABLE');
      expect(result.userMessage).toBe('API de Machine Learning em inicialização ou indisponível no momento.');
    });

    it('deve retornar mensagem genérica de fallback se a resposta não for JSON (HTTP 500)', async () => {
      // Arrange
      const mockResponse = createMockResponse('Internal Server Error HTML', 500);

      // Act
      const result: ApiErrorResult = await parseApiError(mockResponse);

      // Assert
      expect(result.httpStatus).toBe(500);
      expect(result.errorCode).toBe('INTERNAL_SERVER_ERROR');
      expect(result.userMessage).toBe('Ocorreu um erro inesperado no servidor. Por favor, tente novamente.');
      expect(result.fieldErrors).toEqual({});
    });
  });

  describe('extractAiTelemetry', () => {
    it('deve extrair métricas de telemetria de IA a partir dos cabeçalhos HTTP (X-IA-*)', () => {
      // Arrange
      const headersMap = new Map([
        ['X-IA-Tokens', '1450'],
        ['X-IA-Reasoning-Tokens', '320'],
        ['X-IA-Custo-Dolar', '0.0042'],
        ['X-IA-Provider', 'openai/gpt-4o']
      ]);
      const mockHeaders = {
        get: (key: string) => headersMap.get(key) || null
      } as unknown as Headers;

      // Act
      const telemetry: AiTelemetry = extractAiTelemetry(mockHeaders);

      // Assert
      expect(telemetry.tokens).toBe(1450);
      expect(telemetry.reasoningTokens).toBe(320);
      expect(telemetry.costUsd).toBe(0.0042);
      expect(telemetry.provider).toBe('openai/gpt-4o');
    });

    it('deve retornar objeto com propriedades indefinidas se cabeçalhos de IA não estiverem presentes', () => {
      // Arrange
      const mockHeaders = {
        get: (_key: string) => null
      } as unknown as Headers;

      // Act
      const telemetry: AiTelemetry = extractAiTelemetry(mockHeaders);

      // Assert
      expect(telemetry.tokens).toBeUndefined();
      expect(telemetry.reasoningTokens).toBeUndefined();
      expect(telemetry.costUsd).toBeUndefined();
      expect(telemetry.provider).toBeUndefined();
    });
  });

});
