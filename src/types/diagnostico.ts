/**
 * @file src/types/diagnostico.ts
 * @description Definições de tipos centralizadas para o ecossistema de Diagnóstico.
 * Garante a integridade dos dados entre a resposta da IA (BFF), o Zustand e a Interface.
 */

/**
 * Define o status visual de uma comparação de benchmarking.
 */
export type StatusComparacao = 'positivo' | 'neutro' | 'negativo' | 'alerta';

/**
 * Define a severidade de uma causa identificada no diagrama de Ishikawa.
 */
export type SeveridadeCausa = 'critica' | 'atencao' | 'monitorar' | 'neutra';

/**
 * Estrutura de dados para os cards de benchmarking.
 */
export interface BenchmarkingCardData {
  titulo: string;
  valor_produtor: number | string;
  valor_referencia?: number | string;
  unidade_medida?: string;
  status_comparacao?: StatusComparacao;
  mensagem_curta?: string;
  mensagem_detalhada: string;
}

/**
 * Representa um item (causa) individual dentro do Diagrama de Ishikawa.
 */
export interface IshikawaItem {
  resumo_pratica: string;
  pratica?: string;
  severidade?: SeveridadeCausa; // Adicionado para exibir as bolinhas coloridas (UX)
  analise?: string;             // Adicionado para tooltip/justificativa no Modal
}

/**
 * Agrupa as causas do Diagrama de Ishikawa em suas respectivas categorias (Os 6 Ms).
 */
export interface IshikawaCategorias {
  mao_de_obra: IshikawaItem[];
  maquina: IshikawaItem[];
  meio_ambiente: IshikawaItem[];
  metodo: IshikawaItem[];
  medida: IshikawaItem[];
  material: IshikawaItem[];
}

/**
 * Define os limites (thresholds) de impacto para um determinado indicador.
 */
export interface ImpactThresholds {
  bom?: string;
  regular?: string;
  critico?: string;
  valor?: number;
  unidade_medida?: string;
  direcao_ideal?: string;
  limite_inferior?: number;
  limite_superior?: number;
}

/**
 * Estrutura que representa a análise detalhada de um indicador específico.
 */
export interface IndicadorData {
  status: 'bom' | 'regular' | 'critico';
  impacto_pilares?: Record<string, number>; // Novo: % de peso de cada pilar para UI futura
  causas?: IshikawaItem[];                  
  ishikawa?: IshikawaCategorias;            
  textos_analise?: string;
  fatores_impacto?: Record<string, ImpactThresholds>;
  unidade_medida?: string;
  thresholds?: ImpactThresholds;
  valor_atual?: number | string;
  ranking?: string[];
}

/**
 * Estrutura do resumo geral estratégico gerado pela IA.
 */
export interface ResumoGeral {
  visao_geral: string;
  prioridades: string[];
  proximos_passos: string[];
}

/**
 * Resposta completa consolidada enviada pela API de Diagnóstico (BFF) após análise da IA.
 */
export interface DiagnosticoIAResponse {
  resumo_geral?: ResumoGeral;
  resumo?: string; // Fallback temporário para versões anteriores
  benchmarking: BenchmarkingCardData[];
  indicadores?: Record<string, IndicadorData>;
}