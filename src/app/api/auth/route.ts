/**
 * @file src/app/api/auth/route.ts
 * @description Rota BFF (Backend-For-Frontend) de Login do Consultor.
 * Proxeia autenticação para a API Ishikawa Educampo backend v2.0.0.
 */

import { NextRequest, NextResponse } from 'next/server';
import { SECURITY_CONSTANTS, API_ENDPOINTS, API_HEADERS } from '@/lib/constants';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, rememberMe } = body || {};

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: 'E-mail e senha são obrigatórios.' }, { status: 400 });
    }

    const baseUrl = process.env.API_BASE_URL || 'http://localhost:8000';
    const apiKey = process.env.API_KEY || process.env.API_TOKEN || '42';

    const backendUrl = `${baseUrl}${API_ENDPOINTS.AUTH_LOGIN}`;

    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [API_HEADERS.API_KEY]: apiKey,
      },
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
      : data.session_token || data.consultant?.id || 'session-valid';

    const isRememberMe = Boolean(rememberMe);
    const cookieMaxAge = isRememberMe
      ? SECURITY_CONSTANTS.COOKIE_MAX_AGE_LONG
      : SECURITY_CONSTANTS.COOKIE_MAX_AGE_SHORT;

    const response = NextResponse.json(
      { message: data.message || 'Login realizado com sucesso', consultant: data.consultant },
      { status: 200 }
    );

    response.cookies.set({
      name: SECURITY_CONSTANTS.SESSION_COOKIE_NAME,
      value: tokenValue,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: cookieMaxAge,
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno ao processar autenticação' }, { status: 500 });
  }
}