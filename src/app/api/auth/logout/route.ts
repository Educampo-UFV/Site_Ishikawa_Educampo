/**
 * @file src/app/api/auth/logout/route.ts
 * @description Rota BFF de Logout do Consultor. Expira a sessão e remove o cookie session_token.
 */

import { NextRequest, NextResponse } from 'next/server';
import { SECURITY_CONSTANTS, API_ENDPOINTS, API_HEADERS } from '@/lib/constants';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:8000';
    const apiKey = process.env.API_KEY || process.env.API_TOKEN || '42';

    const sessionCookie = request.cookies.get(SECURITY_CONSTANTS.SESSION_COOKIE_NAME);
    const backendUrl = `${baseUrl}${API_ENDPOINTS.AUTH_LOGOUT}`;

    const headers: Record<string, string> = {
      [API_HEADERS.API_KEY]: apiKey,
    };

    if (sessionCookie?.value) {
      headers['Cookie'] = `${SECURITY_CONSTANTS.SESSION_COOKIE_NAME}=${sessionCookie.value}`;
    }

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
