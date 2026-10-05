/**
 * @file src/lib/fazendaService.ts
 * @description Módulo centralizado de serviços para dados de fazenda, opções de formulário e desambiguação.
 * Atua como Single Source of Truth (SSOT) para mapeamento e busca defensiva de fazendas em /formulario e /ajustes.
 * Ref: Obsidian note [[02-auditorias/pivots-and-bugs/2026-10-05-desambiguacao-fazendas-homonimas-e-chave-defensiva.md]]
 */

import { fetchComResiliencia } from '@/lib/apiUtils';
import { FazendaFormData } from '@/lib/schemas';
import {
  FormularioOpcoesResponse,
  FazendaDetalhadaResponse,
  SistemaProducaoItem,
  RegiaoSebraeItem,
  getOptionValue,
  getOptionLabel,
} from '@/types/formulario';

export const DEFAULT_SISTEMAS: SistemaProducaoItem[] = [
  { value: 'compost-barn', label: 'Compost Barn' },
  { value: 'semiconfinado', label: 'Semi-confinado' },
  { value: 'confinado-sem-estrutura', label: 'Confinado' },
];

export const DEFAULT_REGIOES: RegiaoSebraeItem[] = [
  { value: 'triangulo', label: 'Triângulo Mineiro' },
  { value: 'rio doce e vale do aco', label: 'Rio Doce e Vale do Aço' },
  { value: 'noroeste e alto paranaiba', label: 'Noroeste e Alto Paranaíba' },
  { value: 'centro', label: 'Centro' },
  { value: 'centro-oeste e sudoeste', label: 'Centro-Oeste e Sudoeste' },
  { value: 'sul', label: 'Sul' },
  { value: 'norte', label: 'Norte' },
  { value: 'zona da mata e vertentes', label: 'Zona da Mata e Vertentes' },
  { value: 'jequitinhonha e mucuri', label: 'Jequitinhonha e Mucuri' },
];

export const MAP_TO_ML_REGIAO: Record<string, string> = {
  'centro': 'centro',
  'centro oeste e sudoeste': 'centro-oeste e sudoeste',
  'centro-oeste e sudoeste': 'centro-oeste e sudoeste',
  'jequitinhonha e mucuri': 'jequitinhonha e mucuri',
  'noroeste e alto paranaiba': 'noroeste e alto paranaiba',
  'norte': 'norte',
  'norte de minas': 'norte',
  'rio doce e vale do aco': 'rio doce e vale do aco',
  'sul': 'sul',
  'sul de minas': 'sul',
  'triangulo': 'triangulo',
  'triangulo mineiro': 'triangulo',
  'zona da mata e vertentes': 'zona da mata e vertentes',
  'zona da mata': 'zona da mata e vertentes',
};

export const MAP_TO_ML_SISTEMA: Record<string, string> = {
  'compost-barn': 'compost-barn',
  'confinado-sem-estrutura': 'confinado-sem-estrutura',
  'semiconfinado': 'semiconfinado',
  'compost barn - free stall': 'compost-barn',
};

export function normalizeText(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/_/g, ' ')
    .trim();
}

export function mapToMlRegion(raw: string): string {
  if (!raw) return 'sul';
  const norm = normalizeText(raw);
  if (MAP_TO_ML_REGIAO[norm]) return MAP_TO_ML_REGIAO[norm];

  for (const [key, target] of Object.entries(MAP_TO_ML_REGIAO)) {
    if (norm.includes(key) || key.includes(norm)) return target;
  }
  return norm;
}

export function mapToMlSystem(raw: string): string {
  if (!raw) return 'compost-barn';
  const norm = normalizeText(raw);
  if (MAP_TO_ML_SISTEMA[norm]) return MAP_TO_ML_SISTEMA[norm];

  for (const [key, target] of Object.entries(MAP_TO_ML_SISTEMA)) {
    if (norm.includes(key) || key.includes(norm)) return target;
  }
  return norm;
}

export function findIshikawaOptionValue(
  raw: string,
  optionsList: (SistemaProducaoItem | RegiaoSebraeItem)[]
): string {
  if (!raw) return '';
  const clean = String(raw).trim();
  const norm = normalizeText(clean);

  for (const item of optionsList) {
    const val = getOptionValue(item);
    const lbl = getOptionLabel(item);
    const valNorm = normalizeText(val);
    const lblNorm = normalizeText(lbl);

    if (val === clean || lbl === clean || valNorm === norm || lblNorm === norm) {
      return val;
    }
  }

  for (const item of optionsList) {
    const val = getOptionValue(item);
    const lbl = getOptionLabel(item);
    const valNorm = normalizeText(val);
    const lblNorm = normalizeText(lbl);

    if (valNorm.includes(norm) || norm.includes(valNorm) || lblNorm.includes(norm) || norm.includes(lblNorm)) {
      return val;
    }
  }

  return clean;
}

/**
 * Mapeia os dados detalhados retornados pelo backend para a estrutura canônica de FazendaFormData.
 */
export function mapFarmApiToFormData(
  data: FazendaDetalhadaResponse | any,
  opcoesRegioes: RegiaoSebraeItem[] = DEFAULT_REGIOES,
  opcoesSistemas: SistemaProducaoItem[] = DEFAULT_SISTEMAS
): any {
  const dadosObj = data?.dados ?? data;
  const rawRegiao = dadosObj?.regiao_sebrae ?? dadosObj?.regiao ?? data?.regiao_sebrae ?? data?.regiao ?? '';
  const rawSistema = dadosObj?.sistema_producao ?? data?.sistema_producao ?? '';

  const listRegioes = opcoesRegioes.length > 0 ? opcoesRegioes : DEFAULT_REGIOES;
  const listSistemas = opcoesSistemas.length > 0 ? opcoesSistemas : DEFAULT_SISTEMAS;

  const matchedRegiao = findIshikawaOptionValue(rawRegiao, listRegioes);
  const matchedSistema = findIshikawaOptionValue(rawSistema, listSistemas);

  return {
    id_fazenda: data?.id_fazenda ?? data?.id ?? dadosObj?.id_fazenda ?? dadosObj?.id ?? undefined,
    nome_fazenda: data?.nome ?? data?.nome_fazenda ?? '',
    email: data?.email ?? dadosObj?.email ?? '',
    sistema_producao: matchedSistema,
    total_vacas: dadosObj?.total_vacas ?? 0,
    percentual_lactacao: dadosObj?.percentual_lactacao ?? 0,
    animais_rebanho: dadosObj?.total_rebanho ?? dadosObj?.animais_rebanho ?? 0,
    area_atividade: dadosObj?.area_atividade ?? 0,
    mao_obra_total: dadosObj?.numero_trabalhadores ?? dadosObj?.mao_obra_total ?? 1,
    producao_vaca: dadosObj?.producao_vaca ?? 0,
    preco_leite: dadosObj?.preco_recebido ?? dadosObj?.preco_leite ?? 0,
    preco_referencia: dadosObj?.preco_referencia ?? 0,
    preco_concentrado: dadosObj?.custo_concentrado ?? dadosObj?.preco_concentrado ?? 1.81,
    ccs: dadosObj?.ccs ?? 0,
    regiao: matchedRegiao,
  };
}

/**
 * Busca opções dinâmicas de sistemas de produção e regiões SEBRAE (/api/formularios).
 * Compartilhado entre a tela de Formulário e a tela de Ajustes.
 */
export async function fetchOpcoesFormulario(): Promise<FormularioOpcoesResponse> {
  const res = await fetch('/api/formularios');
  if (!res.ok) {
    throw new Error(`Falha ao carregar opções: status ${res.status}`);
  }
  const data: FormularioOpcoesResponse = await res.json();
  return {
    sistemas_producao: Array.isArray(data.sistemas_producao) && data.sistemas_producao.length > 0
      ? data.sistemas_producao
      : DEFAULT_SISTEMAS,
    regioes_sebrae: Array.isArray(data.regioes_sebrae) && data.regioes_sebrae.length > 0
      ? data.regioes_sebrae
      : DEFAULT_REGIOES,
    fazendas_cadastradas: Array.isArray(data.fazendas_cadastradas)
      ? data.fazendas_cadastradas
      : [],
  };
}

/**
 * Busca os dados detalhados de uma fazenda através do identificador único (UUID -> Email -> Nome).
 * Desambigua fazendas homônimas e formata os dados prontos para o diagnóstico ou ajustes.
 */
export async function fetchFazendaDetalhes(
  identificador: string,
  opcoesRegioes: RegiaoSebraeItem[] = DEFAULT_REGIOES,
  opcoesSistemas: SistemaProducaoItem[] = DEFAULT_SISTEMAS
): Promise<FazendaFormData> {
  const url = `/api/formularios?nome=${encodeURIComponent(identificador)}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Não foi possível carregar os dados da fazenda (Status: ${res.status}).`);
  }

  const data: FazendaDetalhadaResponse = await res.json();
  const rawMapped = mapFarmApiToFormData(data, opcoesRegioes, opcoesSistemas);

  return {
    ...rawMapped,
    regiao: mapToMlRegion(rawMapped.regiao),
    sistema_producao: mapToMlSystem(rawMapped.sistema_producao),
  } as FazendaFormData;
}
