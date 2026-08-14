/**
 * @file src/types/relatorio.ts
 * @description Definições de tipos e estruturas de dados para a customização e geração de relatórios PDF.
 * Mapeia os filtros granulares conforme especificado em INTEGRATION.md (ReportFilterPayload).
 * Ref: Obsidian note [[sdd-relatorio-produtor-pdf.md]]
 */

export interface SecaoResumoFilter {
  visao_geral: boolean;
  evidencias_raciocinios: boolean;
}

export interface SecaoBenchmarkingFilter {
  sistema_producao: boolean;
  faixa_producao: boolean;
  ccs: boolean;
  producao_vaca: boolean;
  producao_area: boolean;
  producao_trabalhador: boolean;
  preco_leite: boolean;
  percentual_vacas_lactacao: boolean;
  lotacao_animal: boolean;
}

export interface SimulacoesFinanceirasFilter {
  custo_leite: boolean;
  margem_litro: boolean;
  margem_ano: boolean;
}

export interface SimulacoesEstaticasFilter {
  ccs: boolean;
  producao_vaca: boolean;
}

export interface SimulacoesOperacionaisFilter {
  producao_trabalhador: boolean;
  producao_area: boolean;
}

export interface SecaoSimulacoesFilter {
  financeiras: SimulacoesFinanceirasFilter;
  estaticas: SimulacoesEstaticasFilter;
  operacionais: SimulacoesOperacionaisFilter;
}

export interface SeveridadesIshikawaFilter {
  critica: boolean;
  atencao: boolean;
  monitorar: boolean;
  neutra: boolean;
}

export interface PilaresIshikawaFilter {
  mao_de_obra: boolean;
  metodos: boolean;
  maquinas: boolean;
  meio_ambiente: boolean;
  medicao: boolean;
  materia_prima: boolean;
}

export interface IndicadorIshikawaFilter {
  incluir: boolean;
  pilares: PilaresIshikawaFilter;
}

export interface SecaoIshikawaFilter {
  incluir_analise_causa: boolean;
  severidades: SeveridadesIshikawaFilter;
  indicadores: Record<string, IndicadorIshikawaFilter>;
}

export interface ReportFilterPayload {
  secao_resumo?: SecaoResumoFilter;
  secao_benchmarking?: SecaoBenchmarkingFilter;
  secao_simulacoes?: SecaoSimulacoesFilter;
  secao_ishikawa?: SecaoIshikawaFilter;
}

export const PILARES_ISHIKAWA_LABELS: Record<keyof PilaresIshikawaFilter, string> = {
  mao_de_obra: 'Mão de Obra',
  metodos: 'Métodos',
  maquinas: 'Máquinas',
  meio_ambiente: 'Meio Ambiente',
  medicao: 'Medição',
  materia_prima: 'Matéria-Prima',
};

export const SEVERIDADES_ISHIKAWA_LABELS: Record<keyof SeveridadesIshikawaFilter, { label: string; color: string }> = {
  critica: { label: 'Crítica', color: 'bg-red-100 text-red-700 border-red-200' },
  atencao: { label: 'Atenção', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  monitorar: { label: 'Monitorar', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  neutra: { label: 'Neutra', color: 'bg-gray-100 text-gray-700 border-gray-200' },
};

export const INDICADORES_ISHIKAWA_DEFAULT_LIST = [
  { slug: 'ccs', label: 'CCS (Qualidade e Mastite)' },
  { slug: 'producao_vaca', label: 'Produção Média Diária por Vaca' },
  { slug: 'producao_area', label: 'Produção por Área (L/ha/ano)' },
  { slug: 'producao_trabalhador', label: 'Produção por Trabalhador (L/func/dia)' },
  { slug: 'preco_leite', label: 'Preço do Leite (R$/L)' },
  { slug: 'percentual_vacas_lactacao', label: 'Percentual de Vacas em Lactação' },
  { slug: 'lotacao_animal', label: 'Lotação Animal (cab/ha)' },
];

export function getDefaultPilares(): PilaresIshikawaFilter {
  return {
    mao_de_obra: true,
    metodos: true,
    maquinas: true,
    meio_ambiente: true,
    medicao: true,
    materia_prima: true,
  };
}

export function getDefaultReportFilterPayload(): Required<ReportFilterPayload> {
  const defaultIndicadores: Record<string, IndicadorIshikawaFilter> = {};
  INDICADORES_ISHIKAWA_DEFAULT_LIST.forEach(({ slug }) => {
    defaultIndicadores[slug] = {
      incluir: true,
      pilares: getDefaultPilares(),
    };
  });

  return {
    secao_resumo: {
      visao_geral: true,
      evidencias_raciocinios: false,
    },
    secao_benchmarking: {
      sistema_producao: true,
      faixa_producao: true,
      ccs: true,
      producao_vaca: true,
      producao_area: true,
      producao_trabalhador: true,
      preco_leite: true,
      percentual_vacas_lactacao: true,
      lotacao_animal: true,
    },
    secao_simulacoes: {
      financeiras: {
        custo_leite: true,
        margem_litro: true,
        margem_ano: true,
      },
      estaticas: {
        ccs: true,
        producao_vaca: true,
      },
      operacionais: {
        producao_trabalhador: true,
        producao_area: true,
      },
    },
    secao_ishikawa: {
      incluir_analise_causa: false,
      severidades: {
        critica: true,
        atencao: true,
        monitorar: false,
        neutra: false,
      },
      indicadores: defaultIndicadores,
    },
  };
}

export function getAllReportFilterPayload(): Required<ReportFilterPayload> {
  const allIndicadores: Record<string, IndicadorIshikawaFilter> = {};
  INDICADORES_ISHIKAWA_DEFAULT_LIST.forEach(({ slug }) => {
    allIndicadores[slug] = {
      incluir: true,
      pilares: getDefaultPilares(),
    };
  });

  return {
    secao_resumo: {
      visao_geral: true,
      evidencias_raciocinios: true,
    },
    secao_benchmarking: {
      sistema_producao: true,
      faixa_producao: true,
      ccs: true,
      producao_vaca: true,
      producao_area: true,
      producao_trabalhador: true,
      preco_leite: true,
      percentual_vacas_lactacao: true,
      lotacao_animal: true,
    },
    secao_simulacoes: {
      financeiras: {
        custo_leite: true,
        margem_litro: true,
        margem_ano: true,
      },
      estaticas: {
        ccs: true,
        producao_vaca: true,
      },
      operacionais: {
        producao_trabalhador: true,
        producao_area: true,
      },
    },
    secao_ishikawa: {
      incluir_analise_causa: true,
      severidades: {
        critica: true,
        atencao: true,
        monitorar: true,
        neutra: true,
      },
      indicadores: allIndicadores,
    },
  };
}

