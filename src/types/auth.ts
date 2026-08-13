/**
 * @file src/types/auth.ts
 * @description Contratos de tipos TypeScript para autenticação do consultor e integração BFF.
 */

export interface LoginPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface ConsultantProfile {
  id: string;
  email: string;
  producers_managed: string[];
}

export interface LoginSuccessResponse {
  message: string;
  consultant: ConsultantProfile;
}

export interface APIErrorResponse {
  error_code?: string;
  message?: string;
  detail?: string | Array<{ loc: string[]; msg: string }>;
}
