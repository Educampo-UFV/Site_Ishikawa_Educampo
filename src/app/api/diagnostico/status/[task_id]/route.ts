/**
 * @file route.ts
 * @description Implementação da Rota de Polling BFF para o Diagnóstico Ishikawa.
 * 
 * Esta rota atua como proxy seguro para consultar o status de uma task assíncrona
 * da API Python, injetando e repassando dados de telemetria de IA.
 */

import { NextRequest, NextResponse } from 'next/server';
import { extractAiTelemetry } from '@/lib/apiUtils';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ task_id: string }> }
) {
  const { task_id } = await params;

  if (!task_id) {
    return NextResponse.json({ error: 'task_id não fornecido' }, { status: 400 });
  }

  const baseUrl = process.env.API_BASE_URL;
  const apiKey = process.env.API_KEY || process.env.API_TOKEN;

  if (!baseUrl || !apiKey) {
    console.error('[BFF Status] ALERTA CRÍTICO: API_BASE_URL ou API_TOKEN ausentes!');
    return NextResponse.json(
      { error: 'Configuração interna do servidor ausente.' },
      { status: 500 }
    );
  }

  const apiUrl = `${baseUrl}/api/diagnostico/status/${task_id}`;
  const forwardedFor = req.headers?.get?.('x-forwarded-for') || '';

  try {
    const apiResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'X-API-KEY': apiKey,
        'X-Forwarded-For': forwardedFor
      }
    });

    if (!apiResponse.ok) {
      if (apiResponse.status === 404) {
        return NextResponse.json({ error: 'Tarefa não encontrada.' }, { status: 404 });
      }
      return NextResponse.json(
        { error: 'Falha ao consultar status na API externa.' },
        { status: 502 }
      );
    }

    const data = await apiResponse.json();
    const responseHeaders = new Headers({ 'Content-Type': 'application/json' });

    // Se o processamento concluiu, extrai as métricas de IA injetando no payload JSON para o frontend
    if (data.status === 'completed') {
      const telemetry = extractAiTelemetry(apiResponse.headers);
      const tokens = apiResponse.headers.get('X-IA-Tokens');
      const reasoningTokens = apiResponse.headers.get('X-IA-Reasoning-Tokens');
      const custo = apiResponse.headers.get('X-IA-Custo-Dolar');
      const provider = apiResponse.headers.get('X-IA-Provider');

      if (tokens || custo || reasoningTokens || provider) {
        console.log(`[BFF Status Metrics] Tokens: ${tokens || 'N/A'}, Custo (USD): ${custo || 'N/A'}`);
        
        data.telemetry = telemetry;
        data.ia_metrics = {
          tokens: tokens || undefined,
          reasoning_tokens: reasoningTokens || undefined,
          custo: custo || undefined,
          provider: provider || undefined
        };

        if (tokens) responseHeaders.set('X-IA-Tokens', tokens);
        if (reasoningTokens) responseHeaders.set('X-IA-Reasoning-Tokens', reasoningTokens);
        if (custo) responseHeaders.set('X-IA-Custo-Dolar', custo);
        if (provider) responseHeaders.set('X-IA-Provider', provider);
      }
    }

    return NextResponse.json(data, { status: 200, headers: responseHeaders });

  } catch (error) {
    console.error('[BFF Status Error]:', error);
    return NextResponse.json(
      { error: 'Falha de comunicação com o servidor de processamento.' },
      { status: 502 }
    );
  }
}
