/**
 * @file src/app/api/auth/logout/route.ts
 * @description Rota BFF de Logout do Consultor. Expira a sessão e remove o cookie session_token.
 */

import { NextRequest, NextResponse } from 'next/server';
import { SECURITY_CONSTANTS, API_ENDPOINTS } from '@/lib/constants';
import { getBffBackendConfig, createBffHeaders } from '@/lib/bff-config';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { baseUrl } = getBffBackendConfig();
    const sessionCookie = request.cookies.get(SECURITY_CONSTANTS.SESSION_COOKIE_NAME);
    const backendUrl = `${baseUrl}${API_ENDPOINTS.AUTH_LOGOUT}`;
    const headers = createBffHeaders(sessionCookie?.value);

    try {
      await fetch(backendUrl, {
        method: 'POST',
        headers,
      });
    } catch {
      // Tolera falhas da API externa para garantir o logout local do usuário
    }

    const response = NextResponse.json({ message: 'Logout realizado com sucesso' }, { status: 200 });

    response.cookies.delete(SECURITY_CONSTANTS.SESSION_COOKIE_NAME);

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao processar encerramento de sessão' }, { status: 500 });
  }
}
