/**
 * @file src/lib/bff-config.ts
 * @description Centralizador de configurações e utilitários para requisições BFF -> Backend.
 * Aplica SRP e DRY para resolução de URLs base, chaves de API e cabeçalhos de integração.
 */

import { API_HEADERS, SECURITY_CONSTANTS } from '@/lib/constants';

export interface BffBackendConfig {
  baseUrl: string;
  apiKey: string;
}

/**
 * Retorna as configurações do backend obtidas via variáveis de ambiente com fallbacks de desenvolvimento.
 */
export function getBffBackendConfig(): BffBackendConfig {
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:8000';
  const apiKey = process.env.API_KEY || process.env.API_TOKEN || '42';
  return { baseUrl, apiKey };
}

/**
 * Constrói os cabeçalhos padrão para chamadas do BFF ao backend, incluindo a chave da API
 * e, opcionalmente, o cookie de sessão do consultor.
 */
export function createBffHeaders(
  sessionToken?: string,
  extraHeaders?: Record<string, string>
): Record<string, string> {
  const { apiKey } = getBffBackendConfig();
  const headers: Record<string, string> = {
    [API_HEADERS.API_KEY]: apiKey,
    ...extraHeaders,
  };

  if (sessionToken) {
    headers['Cookie'] = `${SECURITY_CONSTANTS.SESSION_COOKIE_NAME}=${sessionToken}`;
  }

  return headers;
}
