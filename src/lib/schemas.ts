/**
 * @fileoverview Definição de esquemas de validação robustos utilizando Zod.
 * @description
 * Este arquivo centraliza a lógica de validação de entrada de dados do sistema.
 * Utilizamos o Zod para garantir tipagem estática e validação em tempo de execução,
 * aplicando regras zootécnicas e limites de segurança (malha fina) para evitar
 * inconsistências nos cálculos do Diagrama de Ishikawa.
 */

import { z } from 'zod';
import { FAZENDA_LIMITS } from './constants';

/**
 * Enum para os sistemas de produção suportados pela API.
 */
export const SistemaProducaoEnum = z.enum(['compost-barn', 'confinado-sem-estrutura', 'semiconfinado']);

/**
 * Enum para as regiões geográficas mapeadas pelo SEBRAE/Educampo.
 */
export const RegiaoEnum = z.enum([
  'triangulo',
  'rio doce e vale do aco',
  'noroeste e alto paranaiba',
  'centro',
  'centro-oeste e sudoeste',
  'sul',
  'norte',
  'zona da mata e vertentes',
  'jequitinhonha e mucuri',
]);

/**
 * Schema principal para os dados da fazenda.
 * @description
 * Aplica limites superiores e inferiores para prevenir erros de digitação e
 * utiliza superRefine para validações cruzadas entre campos (ex: lactação vs total).
 */
export const fazendaSchema = z.object({
  nome_fazenda: z.string()
    .min(1, 'O nome da fazenda é obrigatório')
    .max(FAZENDA_LIMITS.NOME_MAX_LENGTH, `O nome deve ter no máximo ${FAZENDA_LIMITS.NOME_MAX_LENGTH} caracteres`),

  sistema_producao: SistemaProducaoEnum,

  total_vacas: z.coerce.number().min(0).max(FAZENDA_LIMITS.VACAS_MAX),

  percentual_lactacao: z.coerce.number().min(0).max(100),

  animais_rebanho: z.coerce.number().min(0).max(FAZENDA_LIMITS.REBANHO_MAX),

  area_atividade: z.coerce.number().min(FAZENDA_LIMITS.AREA_MIN, `A área mínima é ${FAZENDA_LIMITS.AREA_MIN} ha`).max(FAZENDA_LIMITS.AREA_MAX),

  mao_obra_total: z.coerce.number().min(FAZENDA_LIMITS.MAO_DE_OBRA_MIN, `Mínimo de ${FAZENDA_LIMITS.MAO_DE_OBRA_MIN} trabalhador`).max(FAZENDA_LIMITS.MAO_DE_OBRA_MAX),

  producao_vaca: z.coerce.number().min(0).max(FAZENDA_LIMITS.PRODUCAO_VACA_MAX),

  preco_leite: z.coerce.number().min(0).max(FAZENDA_LIMITS.PRECO_MAX),

  preco_referencia: z.coerce.number().min(0).max(FAZENDA_LIMITS.PRECO_MAX),

  /** Preço médio do concentrado em R$/kg, essencial para o modelo de ML na Simulação. */
  preco_concentrado: z.coerce.number().min(0, 'O preço não pode ser negativo').max(FAZENDA_LIMITS.PRECO_CONCENTRADO_MAX),

  ccs: z.coerce.number().min(0).max(FAZENDA_LIMITS.CCS_MAX),

  email: z.string().email('Insira um e-mail válido').optional().or(z.literal('')),

  regiao: RegiaoEnum,
}).superRefine((data, ctx) => {

  /**
   * Validação Cruzada: Total de Vacas não pode ser maior que o Rebanho Total.
   */
  if (data.total_vacas > data.animais_rebanho) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'O total de vacas não pode exceder o total do rebanho',
      path: ['total_vacas'],
    });
  }
});

/**
 * Schema flexível para os dados de Benchmarking recebidos da IA.
 */
export const benchmarkingSchema = z.object({
  titulo: z.string(),
  valor_produtor: z.union([z.number(), z.string()]),
  valor_referencia: z.union([z.number(), z.string()]).optional(),
  unidade: z.string().optional(),
  status_comparacao: z.enum(['positivo', 'neutro', 'negativo', 'alerta']).optional(),
  mensagem_curta: z.string().optional(),
  mensagem_detalhada: z.string(),
});

/**
 * Tipo TypeScript extraído automaticamente do Schema do Zod.
 */
export type FazendaFormData = z.infer<typeof fazendaSchema>;

/**
 * Schema para o cadastro expansível de novos produtores rurais/fazenda (POST /api/produtores).
 */
export const cadastrarFazendaSchema = z.object({
  email: z.string().min(1, 'O e-mail é obrigatório').email('Insira um e-mail válido'),
  senha: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
  nome_fazenda: z.string().min(1, 'O nome da fazenda é obrigatório'),
  sistema_producao: z.string().min(1, 'Selecione um sistema de produção'),
  regiao_sebrae: z.string().min(1, 'Selecione uma região SEBRAE'),
  total_vacas: z.coerce.number().min(0, 'Total de vacas não pode ser negativo'),
  percentual_lactacao: z.coerce.number().min(0, 'Percentual não pode ser negativo').max(100, 'Percentual máximo é 100%'),
  total_rebanho: z.coerce.number().min(0, 'Total do rebanho não pode ser negativo'),
  area_atividade: z.coerce.number().min(0.1, 'Área mínima de 0.1 ha'),
  numero_trabalhadores: z.coerce.number().min(1, 'Mínimo 1 trabalhador'),
  producao_vaca: z.coerce.number().min(0, 'Produção por vaca não pode ser negativa'),
  preco_recebido: z.coerce.number().min(0, 'Preço recebido não pode ser negativo'),
  preco_referencia: z.coerce.number().min(0, 'Preço de referência não pode ser negativo'),
  ccs: z.coerce.number().min(0, 'CCS não pode ser negativa'),
}).superRefine((data, ctx) => {
  if (data.total_rebanho < data.total_vacas) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'O total do rebanho não pode ser menor que o total de vacas',
      path: ['total_rebanho'],
    });
  }
});

export type CadastrarFazendaFormData = z.infer<typeof cadastrarFazendaSchema>;