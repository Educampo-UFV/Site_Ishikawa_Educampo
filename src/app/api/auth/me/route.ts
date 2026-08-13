/**
 * @file src/app/api/auth/me/route.ts
 * @description Rota BFF para consulta do Perfil do Consultor autenticado.
 */

import { NextRequest, NextResponse } from 'next/server';
import { SECURITY_CONSTANTS, API_ENDPOINTS, API_HEADERS } from '@/lib/constants';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get(SECURITY_CONSTANTS.SESSION_COOKIE_NAME);

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 401 });
    }

    const baseUrl = process.env.API_BASE_URL || 'http://localhost:8000';
    const apiKey = process.env.API_KEY || process.env.API_TOKEN || '42';

    const backendUrl = `${baseUrl}${API_ENDPOINTS.AUTH_ME}`;

    const backendResponse = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        [API_HEADERS.API_KEY]: apiKey,
        Cookie: `${SECURITY_CONSTANTS.SESSION_COOKIE_NAME}=${sessionCookie.value}`,
      },
    });

    if (!backendResponse.ok) {
      if (backendResponse.status === 401) {
        return NextResponse.json({ error: 'Sessão expirada ou inválida' }, { status: 401 });
      }
      return NextResponse.json(
        { error: 'Falha ao consultar perfil do consultor na API backend' },
        { status: backendResponse.status || 502 }
      );
    }

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno ao consultar perfil' }, { status: 500 });
  }
}
