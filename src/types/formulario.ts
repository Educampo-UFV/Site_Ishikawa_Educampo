/**
 * @file src/types/formulario.ts
 * @description Definições de interfaces e tipos TypeScript para a rota de formulários e opções dinâmicas.
 * Linked to Obsidian Vault: [[sdd-promover-rota-formularios-frontend]]
 */

export interface FormularioOpcoesResponse {
  sistemas_producao: string[];
  regioes_sebrae: string[];
  fazendas_cadastradas: string[];
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
  nome: string;
  dados: MetricasFazenda;
}
