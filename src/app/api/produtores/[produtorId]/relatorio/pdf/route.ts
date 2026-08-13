/**
 * @file src/app/api/produtores/[produtorId]/relatorio/pdf/route.ts
 * @description Proxy BFF para download do relatório executivo em PDF do produtor.
 * Encaminha a requisição GET para o backend com cabeçalho X-API-KEY e repassa o stream binário de PDF.
 * Ref: Obsidian note [[sdd-relatorio-produtor-pdf.md]]
 */

import { NextRequest, NextResponse } from 'next/server';
import { getBffBackendConfig, createBffHeaders } from '@/lib/bff-config';
import { SECURITY_CONSTANTS } from '@/lib/constants';

const API_TIMEOUT_MS = 30000;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ produtorId: string }> | { produtorId: string } }
) {
  try {
    const { baseUrl, apiKey } = getBffBackendConfig();

    if (!baseUrl || !apiKey) {
      console.error('[BFF GET /api/produtores/[produtorId]/relatorio/pdf] Configurações de API ausentes.');
      return NextResponse.json(
        { error: 'Configurações da API não encontradas no servidor' },
        { status: 500 }
      );
    }

    const resolvedParams = await Promise.resolve(context?.params);
    const produtorId = resolvedParams?.produtorId;

    if (!produtorId || produtorId.trim() === '') {
      return NextResponse.json(
        { error: 'Identificador do produtor ou fazenda é obrigatório' },
        { status: 400 }
      );
    }

    const sessionToken = request.cookies?.get?.(SECURITY_CONSTANTS.SESSION_COOKIE_NAME)?.value;
    const headers = createBffHeaders(sessionToken);

    const targetUrl = `${baseUrl}/api/produtores/${encodeURIComponent(produtorId)}/relatorio/pdf`;

    const backendResponse = await fetch(targetUrl, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
    });

    if (!backendResponse.ok) {
      if (backendResponse.status === 404) {
        return NextResponse.json(
          { error: 'Esta fazenda ainda não possui dados de diagnóstico salvos para gerar o relatório.' },
          { status: 404 }
        );
      }
      if (backendResponse.status === 403 || backendResponse.status === 401) {
        return NextResponse.json(
          { error: 'Acesso não autorizado para emissão do relatório.' },
          { status: backendResponse.status }
        );
      }
      const errorBody = await backendResponse.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorBody.detail || errorBody.message || 'Erro ao gerar o relatório em PDF no servidor.' },
        { status: backendResponse.status }
      );
    }

    const pdfBuffer = await backendResponse.arrayBuffer();
    const contentDisposition =
      backendResponse.headers.get('content-disposition') ||
      `attachment; filename="relatorio_produtor_${produtorId}.pdf"`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': contentDisposition,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Tempo limite excedido ao compilar o relatório em PDF.' },
        { status: 504 }
      );
    }
    const message = error instanceof Error ? error.message : String(error);
    console.error('[BFF GET /api/produtores/[produtorId]/relatorio/pdf] Falha:', message);
    return NextResponse.json(
      { error: 'Falha interna ao solicitar o relatório em PDF' },
      { status: 500 }
    );
  }
}
