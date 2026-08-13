/**
 * @file src/proxy.ts
 * @description Proxy nativo do Next.js executado no Edge Runtime para segurança de rotas.
 * Intercepta requisições HTTP para validar a presença do cookie session_token e resguardar rotas privadas.
 */

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { SECURITY_CONSTANTS, ROUTES } from './lib/constants';

const SECRET_KEY = process.env.ENCRYPTION_SECRET_KEY
  ? new TextEncoder().encode(process.env.ENCRYPTION_SECRET_KEY)
  : null;

export const config = {
  matcher: [
    '/',
    '/login',
    '/formulario/:path*',
    '/carregando/:path*',
    '/selecao/:path*',
    '/dashboard/:path*',
    '/diagnostico/:path*',
    '/simulacao/:path*',
    '/configuracoes/:path*',
  ],
};

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const sessionCookie = request.cookies.get(SECURITY_CONSTANTS.SESSION_COOKIE_NAME);
  const pathname = request.nextUrl.pathname;

  const isAuthPage = pathname === ROUTES.LOGIN;
  const isRootPath = pathname === ROUTES.ROOT;

  if (!sessionCookie || !sessionCookie.value) {
    return isAuthPage ? NextResponse.next() : NextResponse.redirect(new URL(ROUTES.LOGIN, request.url));
  }

  try {
    // Se o token for um JWT assinado (formato header.payload.signature), executa a verificação
    if (SECRET_KEY && sessionCookie.value.split('.').length === 3) {
      await jwtVerify(sessionCookie.value, SECRET_KEY, { maxTokenAge: SECURITY_CONSTANTS.MAX_TOKEN_AGE });
    }

    if (isRootPath || isAuthPage) {
      return NextResponse.redirect(new URL(ROUTES.HOME, request.url));
    }
    return NextResponse.next();
  } catch (error) {
    const response = isAuthPage
      ? NextResponse.next()
      : NextResponse.redirect(new URL(ROUTES.LOGIN, request.url));

    response.cookies.delete(SECURITY_CONSTANTS.SESSION_COOKIE_NAME);
    return response;
  }
}
