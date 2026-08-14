/**
 * @file src/lib/constants.ts
 * @description Arquivo centralizador de constantes da aplicação.
 * Serve como "Single Source of Truth" (Única Fonte de Verdade) para regras de negócio e
 * configurações de segurança, evitando valores fixos (Magic Numbers/Strings) espalhados pelo código.
 */

export const SECURITY_CONSTANTS = {
  /** Tempo padrão de validade do token JWT de sessão (15 minutos) */
  MAX_TOKEN_AGE_SHORT: '15m',
  /** Tempo longo de validade do token JWT para "Lembrar de Mim" (7 dias) */
  MAX_TOKEN_AGE_LONG: '7d',
  /** Tempo máximo absoluto (hard limit) da sessão curta (8 horas em segundos) */
  ABSOLUTE_TIMEOUT_SHORT: 8 * 3600,
  /** Tempo máximo absoluto (hard limit) da sessão longa (7 dias em segundos) */
  ABSOLUTE_TIMEOUT_LONG: 7 * 24 * 3600,
  /** Tempo de expiração do cookie curto (em segundos: 900s = 15 minutos) */
  COOKIE_MAX_AGE_SHORT: 15 * 60,
  /** Tempo de expiração do cookie longo (em segundos: 604800s = 7 dias) */
  COOKIE_MAX_AGE_LONG: 7 * 24 * 60 * 60,
  /** Nome oficial do cookie de sessão utilizado em toda a aplicação */
  SESSION_COOKIE_NAME: 'session_token',
  /** (LEGADO) Tempo máximo de validade do token JWT de sessão (1 hora) */
  MAX_TOKEN_AGE: '1h',
  /** (LEGADO) Tempo de expiração do cookie no navegador (1 hora) */
  COOKIE_MAX_AGE: 3600 * 1,
} as const;

export const API_ENDPOINTS = {
  AUTH_LOGIN: '/api/auth/login',
  AUTH_LOGOUT: '/api/auth/logout',
  AUTH_ME: '/api/auth/me',
  RELOAD_CACHE: '/api/reload-cache',
} as const;

export const API_HEADERS = {
  API_KEY: 'X-API-KEY',
} as const;

export const ROUTES = {
  /** Rota raiz da aplicação */
  ROOT: '/',
  /** Rota pública de autenticação */
  LOGIN: '/login',
  /** Rota principal interna (Hub) para onde o usuário logado é redirecionado */
  HOME: '/selecao',
  /** Formulário de inserção/edição de dados da propriedade */
  FORMULARIO: '/formulario',
  /** Tela de feedback visual (Espera) e validação da API */
  CARREGANDO: '/carregando',
  /** Painel central unificado: Benchmarking, IA e Diagrama de Ishikawa */
  DIAGNOSTICO: '/diagnostico',
  /** Simulador iterativo de cenários zootécnicos */
  SIMULACAO: '/simulacao',
  /** Tela para ajustes de usuário e logout seguro */
  CONFIGURACOES: '/configuracoes',
} as const;

export const FAZENDA_LIMITS = {
  NOME_MAX_LENGTH: 100,
  VACAS_MAX: 50000,
  REBANHO_MAX: 100000,
  AREA_MIN: 0.1,
  AREA_MAX: 50000,
  MAO_DE_OBRA_MIN: 1,
  MAO_DE_OBRA_MAX: 1000,
  PRODUCAO_VACA_MAX: 100,
  PRECO_MAX: 15,
  PRECO_CONCENTRADO_MAX: 100,
  CCS_MAX: 9999,
} as const;