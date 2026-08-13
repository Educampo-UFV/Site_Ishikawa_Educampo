/**
 * @file tests/unit/constants.spec.ts
 * @description Testes unitários para validação de constantes e contratos de autenticação.
 */

import { SECURITY_CONSTANTS, API_ENDPOINTS, API_HEADERS } from '@/lib/constants';
import type { LoginPayload, ConsultantProfile, LoginSuccessResponse, APIErrorResponse } from '@/types';

describe('Constantes e Contratos de Autenticação (Batch 1)', () => {
  it('deve definir o nome oficial do cookie de sessão como session_token', () => {
    // Arrange & Act & Assert
    expect(SECURITY_CONSTANTS.SESSION_COOKIE_NAME).toBe('session_token');
  });

  it('deve exportar as rotas da API backend e o cabeçalho X-API-KEY', () => {
    // Arrange & Act & Assert
    expect(API_ENDPOINTS.AUTH_LOGIN).toBe('/api/auth/login');
    expect(API_ENDPOINTS.AUTH_LOGOUT).toBe('/api/auth/logout');
    expect(API_ENDPOINTS.AUTH_ME).toBe('/api/auth/me');
    expect(API_HEADERS.API_KEY).toBe('X-API-KEY');
  });

  it('deve possuir estrutura de tipos válida e compilável', () => {
    // Arrange
    const payload: LoginPayload = {
      email: 'consultor@educampo.com',
      password: 'admin123',
      rememberMe: true,
    };

    const profile: ConsultantProfile = {
      id: 'consultor-1',
      email: 'consultor@educampo.com',
      producers_managed: ['produtor-1', 'produtor-2'],
    };

    const successResponse: LoginSuccessResponse = {
      message: 'Login realizado com sucesso',
      consultant: profile,
    };

    const errorResponse: APIErrorResponse = {
      error_code: 'INVALID_CREDENTIALS',
      message: 'Credenciais inválidas',
    };

    // Assert
    expect(payload.email).toBe('consultor@educampo.com');
    expect(profile.producers_managed).toHaveLength(2);
    expect(successResponse.consultant.id).toBe('consultor-1');
    expect(errorResponse.message).toBe('Credenciais inválidas');
  });
});
