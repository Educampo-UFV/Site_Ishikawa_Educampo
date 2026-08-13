/**
 * @file src/types/formulario.ts
 * @description Definições de interfaces e tipos TypeScript para a rota de formulários e opções dinâmicas.
 * Ref: Obsidian note [[sdd-promover-rota-formularios-frontend]]
 */

export interface SistemaProducaoObjeto {
  value: string;
  label: string;
}

export interface RegiaoSebraeObjeto {
  value: string;
  label: string;
}

export interface FazendaCadastradaObjeto {
  id?: string;
  nome: string;
}

export type SistemaProducaoItem = SistemaProducaoObjeto | string;
export type RegiaoSebraeItem = RegiaoSebraeObjeto | string;
export type FazendaCadastradaItem = FazendaCadastradaObjeto | string;

export function getFazendaNome(item: FazendaCadastradaItem): string {
  if (typeof item === 'object' && item !== null && 'nome' in item) {
    return item.nome;
  }
  return String(item);
}

export function getOptionValue(item: SistemaProducaoItem | RegiaoSebraeItem): string {
  if (typeof item === 'object' && item !== null && 'value' in item) {
    return item.value;
  }
  return String(item);
}

export function getOptionLabel(item: SistemaProducaoItem | RegiaoSebraeItem): string {
  if (typeof item === 'object' && item !== null && 'label' in item) {
    return item.label;
  }
  return String(item);
}

export interface FormularioOpcoesResponse {
  sistemas_producao: SistemaProducaoItem[];
  regioes_sebrae: RegiaoSebraeItem[];
  fazendas_cadastradas: FazendaCadastradaItem[];
}

export interface MetricasFazenda {
  sistema_producao: string;
  regiao_sebrae: string;
  total_vacas: number;
  percentual_lactacao: number;
  total_rebanho: number;
  area_atividade: number;
  numero_trabalhadores: number;
  producao_vaca: number;
  preco_recebido: number;
  preco_referencia: number;
  custo_concentrado: number;
  ccs: number;
}

export interface FazendaDetalhadaResponse {
  id_fazenda?: string;
  nome: string;
  dados: MetricasFazenda;
}

export type DadosFazendaZootecnicos = MetricasFazenda;

export interface DiagnosticoTriggerResponse {
  task_id: string;
  status: 'processing' | 'completed' | 'failed';
  message?: string;
}

