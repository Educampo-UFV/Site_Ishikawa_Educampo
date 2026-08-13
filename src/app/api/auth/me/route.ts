/**
 * @file src/app/api/auth/me/route.ts
 * @description Rota BFF para consulta do Perfil do Consultor autenticado.
 */

import { NextRequest, NextResponse } from 'next/server';
import { SECURITY_CONSTANTS, API_ENDPOINTS } from '@/lib/constants';
import { getBffBackendConfig, createBffHeaders } from '@/lib/bff-config';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get(SECURITY_CONSTANTS.SESSION_COOKIE_NAME);

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ error: 'Sessão não encontrada' }, { status: 401 });
    }

    const { baseUrl } = getBffBackendConfig();
    const backendUrl = `${baseUrl}${API_ENDPOINTS.AUTH_ME}`;

    const backendResponse = await fetch(backendUrl, {
      method: 'GET',
      headers: createBffHeaders(sessionCookie.value),
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
