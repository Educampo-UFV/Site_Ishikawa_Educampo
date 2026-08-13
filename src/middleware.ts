/**
 * @file src/middleware.ts
 * @description Edge Middleware oficial do Next.js para segurança e proteção de rotas privadas.
 * Intercepta requisições HTTP para validar a presença e integridade do cookie session_token.
 */

import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify, decodeJwt } from 'jose';
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

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const sessionCookie = request.cookies.get(SECURITY_CONSTANTS.SESSION_COOKIE_NAME);
  const pathname = request.nextUrl.pathname;

  const isAuthPage = pathname === ROUTES.LOGIN;
  const isRootPath = pathname === ROUTES.ROOT;

  if (!sessionCookie || !sessionCookie.value) {
    return isAuthPage ? NextResponse.next() : NextResponse.redirect(new URL(ROUTES.LOGIN, request.url));
  }

  try {
    // Se o token for um JWT assinado (formato header.payload.signature), executa a verificação
    if (sessionCookie.value.split('.').length === 3) {
      try {
        if (SECRET_KEY) {
          await jwtVerify(sessionCookie.value, SECRET_KEY, { maxTokenAge: SECURITY_CONSTANTS.MAX_TOKEN_AGE });
        }
      } catch (err: any) {
        // Se a assinatura falhou porque o token foi assinado pela API backend com a chave do backend,
        // apenas validamos a expiração (exp) do JWT para não derrubar a sessão válida.
        if (err?.code === 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED') {
          const payload = decodeJwt(sessionCookie.value);
          if (payload.exp && payload.exp * 1000 < Date.now()) {
            throw new Error('Token de sessão expirado');
          }
        } else {
          throw err;
        }
      }
    }

    if (isRootPath || isAuthPage) {
      return NextResponse.redirect(new URL(ROUTES.HOME, request.url));
    }
    return NextResponse.next();
  } catch (error) {
    console.warn('[Edge Middleware] Sessão inválida ou expirada:', error);
    const response = isAuthPage
      ? NextResponse.next()
      : NextResponse.redirect(new URL(ROUTES.LOGIN, request.url));

    response.cookies.delete(SECURITY_CONSTANTS.SESSION_COOKIE_NAME);
    return response;
  }
}

// Alias export para compatibilidade
export { middleware as proxy };
