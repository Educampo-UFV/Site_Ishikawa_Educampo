/**
 * @file src/app/api/reload-cache/route.ts
 * @description Proxy BFF para recarregamento a quente de regras de negócio, tabelas SEBRAE e benchmarks na API backend.
 * Ref: Obsidian note [[health-admin-routes.md]]
 */

import { NextRequest, NextResponse } from 'next/server';
import { getBffBackendConfig, createBffHeaders } from '@/lib/bff-config';
import { API_ENDPOINTS, SECURITY_CONSTANTS } from '@/lib/constants';

export const runtime = 'edge';

const API_TIMEOUT_MS = 10000;

export async function POST(request: NextRequest) {
  try {
    const { baseUrl, apiKey } = getBffBackendConfig();

    if (!baseUrl || !apiKey) {
      console.error('[BFF POST /api/reload-cache] Configurações de API ausentes.');
      return NextResponse.json(
        { error: 'Configurações da API não encontradas no servidor' },
        { status: 500 }
      );
    }

    const sessionToken = request.cookies?.get?.(SECURITY_CONSTANTS.SESSION_COOKIE_NAME)?.value;
    const headers = createBffHeaders(sessionToken, {
      'Content-Type': 'application/json',
    });

    const targetUrl = `${baseUrl}${API_ENDPOINTS.RELOAD_CACHE}`;

    const backendResponse = await fetch(targetUrl, {
      method: 'POST',
      headers,
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
    });

    if (!backendResponse.ok) {
      const errorBody = await backendResponse.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorBody.detail || errorBody.message || 'Falha ao recarregar cache no servidor backend' },
        { status: backendResponse.status || 502 }
      );
    }

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Tempo limite excedido ao solicitar recarregamento de cache.' },
        { status: 504 }
      );
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error('[BFF POST /api/reload-cache] Falha:', message);
    return NextResponse.json(
      { error: 'Falha interna ao processar recarregamento de cache' },
      { status: 500 }
    );
  }
}
