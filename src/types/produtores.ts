/**
 * @file src/types/produtores.ts
 * @description Interfaces de contrato de dados para o cadastro de novos produtores rurais e fazendas.
 * @see [[sdd-cadastrar-fazenda.md]]
 */

export interface ProducerRegistrationInput {
  email: string;
  senha: string;
  nome_fazenda: string;
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
  ccs: number;
}

export interface ProducerRegistrationResponse {
  id: string;
  email: string;
  nome_fazenda: string;
  message: string;
}
