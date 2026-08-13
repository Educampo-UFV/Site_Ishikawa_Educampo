/**
 * @file src/app/api/produtores/route.ts
 * @description Proxy BFF para cadastro de novos produtores e fazendas (POST /api/produtores).
 * Injeta a chave de autenticação (X-API-KEY) e cookies de sessão no servidor.
 * Ref: Obsidian note [[sdd-cadastrar-fazenda.md]]
 */

import { NextRequest, NextResponse } from 'next/server';
import { cadastrarFazendaSchema } from '@/lib/schemas';
import { getBffBackendConfig, createBffHeaders } from '@/lib/bff-config';
import { SECURITY_CONSTANTS } from '@/lib/constants';

const API_TIMEOUT_MS = 8000;

export async function POST(request: NextRequest) {
  try {
    const baseUrl = process.env.API_BASE_URL;
    const apiKey = process.env.API_KEY || process.env.API_TOKEN;

    if (!baseUrl || !apiKey) {
      console.error('[BFF POST /api/produtores] Variáveis de ambiente API_BASE_URL ou API_KEY/API_TOKEN ausentes.');
      return NextResponse.json(
        { error: 'Configurações da API não encontradas no servidor' },
        { status: 500 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Corpo da requisição inválido' },
        { status: 400 }
      );
    }

    // Validação Client/Server-side com cadastrarFazendaSchema
    const validationResult = cadastrarFazendaSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Dados de cadastro inválidos',
          issues: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    // Extrair token de sessão dos cookies da requisição
    const sessionToken = request.cookies.get(SECURITY_CONSTANTS.SESSION_COOKIE_NAME)?.value;
    const headers = createBffHeaders(sessionToken, {
      'Content-Type': 'application/json',
    });

    const targetUrl = `${baseUrl}/api/produtores`;

    const backendResponse = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(validationResult.data),
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
    });

    const responseData = await backendResponse.json().catch(() => ({}));

    return NextResponse.json(
      responseData,
      { status: backendResponse.status }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[BFF POST /api/produtores] Falha interna:', message);
    return NextResponse.json(
      { error: 'Falha interna ao processar cadastro de produtor' },
      { status: 500 }
    );
  }
}
