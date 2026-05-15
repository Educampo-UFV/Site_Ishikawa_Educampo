/**
 * @file src/app/api/simulacao/route.ts
 * @description Proxy BFF para o endpoint de Simulação.
 * Recebe os parâmetros ajustados pelo produtor, processa a segurança (esconde o token) 
 * e solicita à API Python o recálculo rápido dos indicadores e estimativa de Machine Learning.
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * @description Método principal para despachar o payload de simulação, validando
 * a presença obrigatória do valor do concentrado antes do consumo de rede externo.
 * @param req Objeto NextRequest contendo as variáveis manipuladas nos sliders.
 * @returns NextResponse com a resposta resolvida da ML ou os detalhes do erro de rede.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    /**
     * 1. Extração e Validação do Payload:
     * Intercepta o corpo da requisição e aplica uma barreira leve garantindo 
     * que a variável custo_concentrado, vital para a ML, esteja presente.
     */
    if (body.custo_concentrado === undefined || body.custo_concentrado === null) {
      return NextResponse.json(
        { error: 'O campo custo_concentrado é obrigatório para as estimativas de custo.' },
        { status: 400 }
      );
    }

    /**
     * 2. Configuração de Variáveis de Ambiente e Proxy Seguro:
     * Oculta a URL base e o token de autorização injetando-os nativamente 
     * no servidor via process.env. O Frontend jamais tem acesso a essas chaves.
     */
    const backendUrl = process.env.API_BASE_URL || 'https://api-ishikawa-educampo.onrender.com';
    const backendToken = process.env.API_TOKEN || '';

    /**
     * 3. Despacho da Requisição (Fetch):
     * Monta e envia a requisição HTTP POST para a API externa (Python), 
     * anexando os cabeçalhos de segurança (Bearer e X-API-KEY).
     */
    const apiResponse = await fetch(`${backendUrl}/api/simulacao`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${backendToken}`,
        'X-API-KEY': backendToken
      },
      body: JSON.stringify(body),
    });

    /**
     * 4. Tratamento de Erro de Rede Externo:
     * Caso a API de Machine Learning retorne um erro (ex: 400, 500), 
     * o texto é capturado para log interno e uma mensagem higienizada
     * é repassada ao Frontend sem expor detalhes da stack trace em Python.
     */
    if (!apiResponse.ok) {
      const errorData = await apiResponse.text();
      console.error(`[BFF Simulacao] Erro ${apiResponse.status}:`, errorData);
      return NextResponse.json(
        { error: 'Falha ao processar a simulação na inteligência externa.' },
        { status: apiResponse.status }
      );
    }

    /**
     * 5. Sucesso e Retorno:
     * Resolve e extrai o JSON gerado pela inteligência artificial contendo 
     * as predições e os indicadores recalculados, enviando-os como resposta 200.
     */
    const data = await apiResponse.json();
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    /**
     * 6. Tratamento de Exceções Críticas Internas:
     * Captura falhas inesperadas de parsing ou de rede (Timeout) durante
     * a comunicação interna do Node.js/Next.js com a API externa.
     */
    console.error('[BFF Simulacao] Erro Crítico:', error);
    return NextResponse.json(
      { error: 'Erro interno no servidor ao processar a simulação.' },
      { status: 500 }
    );
  }
}