/**
 * @file src/app/api/auth/route.ts
 * @description Rota BFF (Backend-For-Frontend) de Login do Consultor.
 * Proxeia autenticação para a API Ishikawa Educampo backend v2.0.0.
 */

import { NextRequest, NextResponse } from 'next/server';
import { SECURITY_CONSTANTS, API_ENDPOINTS } from '@/lib/constants';
import { getBffBackendConfig, createBffHeaders } from '@/lib/bff-config';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, rememberMe } = body || {};

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: 'E-mail e senha são obrigatórios.' }, { status: 400 });
    }

    const { baseUrl } = getBffBackendConfig();
    const backendUrl = `${baseUrl}${API_ENDPOINTS.AUTH_LOGIN}`;

    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: createBffHeaders(undefined, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ email, password }),
    });

    if (!backendResponse.ok) {
      if (backendResponse.status === 401) {
        return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
      }
      const errorData = await backendResponse.json().catch(() => null);
      return NextResponse.json(
        { error: errorData?.detail || errorData?.message || 'Falha ao autenticar na API backend' },
        { status: backendResponse.status || 502 }
      );
    }

    const data = await backendResponse.json();

    // Extrai o token de sessão retornado pelo backend (ou via Set-Cookie header)
    const setCookieHeader = backendResponse.headers?.get?.('set-cookie') || '';
    const sessionTokenMatch = setCookieHeader.match(/session_token=([^;]+)/);
    const tokenValue = sessionTokenMatch
      ? sessionTokenMatch[1]
      : data.session_token || data.access_token || data.token || data.consultant_id || data.consultant?.id || 'session-valid';

    const consultantData = data.consultant || {
      id: data.consultant_id || 'consultant-default-uuid',
      email: data.email || email,
    };

    const isRememberMe = Boolean(rememberMe);
    const cookieMaxAge = isRememberMe
      ? SECURITY_CONSTANTS.COOKIE_MAX_AGE_LONG
      : SECURITY_CONSTANTS.COOKIE_MAX_AGE_SHORT;

    const response = NextResponse.json(
      { message: data.message || 'Login realizado com sucesso', consultant: consultantData },
      { status: 200 }
    );

    response.cookies.set({
      name: SECURITY_CONSTANTS.SESSION_COOKIE_NAME,
      value: tokenValue,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' && request.url.startsWith('https:'),
      sameSite: 'lax',
      path: '/',
      maxAge: cookieMaxAge,
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno ao processar autenticação' }, { status: 500 });
  }
}