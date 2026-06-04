/**
 * @file src/lib/constants.ts
 * @description Arquivo centralizador de constantes da aplicação.
 * Serve como "Single Source of Truth" (Única Fonte de Verdade) para regras de negócio e
 * configurações de segurança, evitando valores fixos (Magic Numbers/Strings) espalhados pelo código.
 */

export const SECURITY_CONSTANTS = {
  /** Tempo máximo de validade do token JWT de sessão para a biblioteca jose (1 hora) */
  MAX_TOKEN_AGE: '1h',
  /** Tempo de expiração do cookie no navegador (em segundos: 3600s = 1 hora) */
  COOKIE_MAX_AGE: 3600 * 1,
  /** Nome oficial do cookie de sessão utilizado em toda a aplicação */
  SESSION_COOKIE_NAME: 'educampo_session',
} as const;

export const ROUTES = {
  /** Rota raiz da aplicação */
  ROOT: '/',
  /** Rota pública de autenticação */
  LOGIN: '/login',
  /** Rota principal interna (Hub) para onde o usuário logado é redirecionado */
  HOME: '/selecao',
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