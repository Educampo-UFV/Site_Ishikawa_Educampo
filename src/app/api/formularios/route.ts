/**
 * @file src/app/api/formularios/route.ts
 * @description Proxy BFF para a rota promovida de opções de formulários e dados detalhados de fazendas.
 * Injeta a chave de autenticação (X-API-KEY) no lado do servidor e repassa requisições para o backend FastAPI.
 * Linked to Obsidian Vault: [[sdd-promover-rota-formularios-frontend]]
 */

import { NextRequest, NextResponse } from 'next/server';

const API_TIMEOUT_MS = 5000;
const DEFAULT_CLIENT_IP = '127.0.0.1';
const CACHE_CONTROL_HEADER = 'private, max-age=60, stale-while-revalidate=120';

function buildBackendUrl(baseUrl: string, nome: string | null): string {
  const endpoint = nome 
    ? `/api/formularios?nome=${encodeURIComponent(nome)}`
    : `/api/formularios`;
  return `${baseUrl}${endpoint}`;
}

/**
 * @description Intercepta requisições GET para opções de formulário / dados de fazenda e realiza o proxy seguro.
 * 
 * @param {NextRequest} request - A requisição Next.js recebida do cliente.
 * @returns {Promise<NextResponse>} O payload JSON retornado pelo backend FastAPI.
 */
export async function GET(request: NextRequest) {
  try {
    const nome = request.nextUrl.searchParams.get('nome');
    const baseUrl = process.env.API_BASE_URL;
    const apiKey = process.env.API_TOKEN || process.env.API_KEY;

    if (!baseUrl || !apiKey) {
      console.error('[API Proxy /api/formularios] Variáveis de ambiente API_BASE_URL ou API_TOKEN/API_KEY ausentes.');
      return NextResponse.json(
        { error: 'Configurações da API não encontradas no servidor' },
        { status: 500 }
      );
    }

    const clientIp = request.headers.get('x-forwarded-for') || DEFAULT_CLIENT_IP;
    const url = buildBackendUrl(baseUrl, nome);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
        'X-Forwarded-For': clientIp
      },
      signal: AbortSignal.timeout(API_TIMEOUT_MS)
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Falha ao buscar opções de formulários' }, 
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': CACHE_CONTROL_HEADER
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[API Proxy /api/formularios] Falha interna na rota:', message);
    return NextResponse.json(
      { error: 'Falha ao buscar opções de formulários' },
      { status: 500 }
    );
  }
}

