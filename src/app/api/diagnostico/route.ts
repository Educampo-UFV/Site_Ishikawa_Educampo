/**
 * @file route.ts
 * @description Implementação do Endpoint BFF para Diagnóstico.
 * 
 * Este arquivo atua como um Proxy Inteligente e Seguro entre o Frontend e a API Python no Render.
 * 
 * Lógica de Funcionamento (Como):
 * 1. Recebe a requisição POST do navegador.
 * 2. Valida o payload utilizando o Schema do Zod para garantir integridade.
 * 3. Verifica a Feature Flag de criptografia para preparo de segurança futura.
 * 4. Injeta o Token de Autenticação (Bearer) oculto no servidor e encaminha a chamada para a API real.
 * 5. Implementa um timeout de 30 segundos para resiliência contra APIs lentas.
 * 6. Captura metadados de custo e performance (`X-IA-Total-Tokens`, `X-IA-Cost-USD`) dos headers da resposta para logging.
 * 7. Trata possíveis falhas de conexão e da API externa (Resiliência).
 */

import { NextRequest, NextResponse } from 'next/server';
import { fazendaSchema } from '@/lib/schemas';
import { DiagnosticoIAResponse } from '../../../types/diagnostico';

/**
 * Manipula requisições POST para gerar o diagnóstico da fazenda.
 * 
 * Como a função opera internamente:
 * - O JSON da requisição é extraído e submetido à função `safeParse` do `fazendaSchema` (Zod).
 * - Os campos validados sofrem um mapeamento de nomenclatura para adaptar a estrutura do Next.js ao padrão Pydantic esperado pelo backend em Python (ex: `animais_rebanho` para `total_rebanho`).
 * - Instancia um `AbortController` atrelado ao `fetch` para garantir um timeout global de 30 segundos.
 * - Os headers `Authorization` e `X-API-KEY` são enriquecidos com variáveis de ambiente sigilosas, blindando o cliente.
 * - Verifica os status HTTP de erro (400, 401, 403, 422) retornados pela API real e faz o proxy formatando mensagens customizadas para o client.
 * - Ao finalizar com sucesso (200), extrai e loga as métricas de performance dos cabeçalhos da resposta antes de retornar o objeto tipado como `DiagnosticoIAResponse`.
 * 
 * @param req - Objeto da requisição NextRequest contendo o JSON dos dados da fazenda.
 * @returns NextResponse contendo o diagnóstico da IA em caso de sucesso (status 200) ou detalhes do erro de validação/comunicação (status 400, 502, 504, 500).
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Captura e Validação de Dados (Anti-Injection/Payload Malformado)
    const body = await req.json();
    const validation = fazendaSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados da fazenda inválidos ou incompletos.', details: validation.error.format() },
        { status: 400 }
      );
    }

    // 2. Transformação de Payload (O verdadeiro poder de um BFF!)
    // O Frontend e o Backend possuem nomenclaturas ligeiramente diferentes. 
    // Nosso BFF atua como um tradutor para satisfazer o Pydantic do Python.
    const payloadToSend = {
      nome_fazenda: validation.data.nome_fazenda,
      sistema_producao: validation.data.sistema_producao,
      total_vacas: validation.data.total_vacas,
      vacas_lactacao: validation.data.vacas_lactacao,
      total_rebanho: validation.data.animais_rebanho,       // Frontend -> Backend
      area_atividade: validation.data.area_atividade,
      numero_trabalhadores: validation.data.mao_obra_total, // Frontend -> Backend
      producao_vaca: validation.data.producao_vaca,
      preco_recebido: validation.data.preco_leite,          // Frontend -> Backend
      preco_referencia: validation.data.preco_referencia,
      ccs: validation.data.ccs,
      regiao_sebrae: validation.data.regiao                 // Frontend -> Backend
    };

    // 2.1 Verificação de Feature Flag (Security by Design)
    const encryptionEnabled = process.env.ENABLE_PAYLOAD_ENCRYPTION === 'true';

    if (encryptionEnabled) {
      // TODO: Implementar lógica de criptografia AES-256 no futuro se necessário.
      console.log("[BFF] Payload encryption flag is ACTIVE. Ready for AES implementation.");
    }

    // 3. Comunicação Segura com a API Externa (Render)
    const apiUrl = `${process.env.API_BASE_URL}/api/diagnostico`;
    
    let apiResponse: Response;
    try {
      console.log(`[BFF Debug] Chamando API Externa: ${apiUrl}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // Timeout de 30 segundos

      apiResponse = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.API_TOKEN}`,
          'X-API-KEY': process.env.API_TOKEN || ''
        },
        body: JSON.stringify(payloadToSend),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('[BFF Timeout] A API externa demorou muito para responder.');
        return NextResponse.json(
            { error: 'A API de diagnóstico demorou muito para responder. Tente novamente mais tarde.' },
            { status: 504 } // Gateway Timeout
        );
      }
      // Re-lança outros erros de fetch para serem pegos pelo catch principal
      throw error;
    }

    // 4. Tratamento de Resiliência e Códigos de Status da API
    if (!apiResponse.ok) {
      if (apiResponse.status === 422 || apiResponse.status === 400) {
        const errorData = await apiResponse.json().catch(() => null);
        console.error("[BFF Error] Erro de validação da API Python:", JSON.stringify(errorData, null, 2));
        return NextResponse.json(
          { error: 'Falha na validação da API', detalhes: errorData },
          { status: apiResponse.status }
        );
      }

      // Se for erro de autenticação (401 ou 403), repassamos com clareza para depuração
      if (apiResponse.status === 401 || apiResponse.status === 403) {
        console.error(`[BFF Error] Autenticação recusada pela API Python. Status: ${apiResponse.status}`);
        return NextResponse.json(
          { error: 'Falha de autenticação ao comunicar com a inteligência.' },
          { status: apiResponse.status }
        );
      }

      console.error(`[BFF Error] API Externa retornou status: ${apiResponse.status}`);
      return NextResponse.json(
        { error: 'Falha ao comunicar com a API de Diagnóstico.' },
        { status: 502 }
      );
    }

    // 5. Sucesso: Captura metadados e repassa os dados da IA para o Frontend
    const data: DiagnosticoIAResponse = await apiResponse.json();

    // 5.1 Captura e loga os metadados de performance e custo da IA (dos headers)
    const totalTokens = apiResponse.headers.get('X-IA-Total-Tokens');
    const custoEstimado = apiResponse.headers.get('X-IA-Cost-USD');

    if (totalTokens || custoEstimado) {
      console.log(`[BFF Metrics] Tokens: ${totalTokens || 'N/A'}, Custo (USD): ${custoEstimado || 'N/A'}`);
    }

    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    // Erro genérico não tratado (ex: falha de rede, erro de programação no BFF)
    console.error('[BFF Critical Error]:', error);
    return NextResponse.json(
      { error: 'Erro interno no servidor de processamento.' },
      { status: 500 }
    );
  }
}