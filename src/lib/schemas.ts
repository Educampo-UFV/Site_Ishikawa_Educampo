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
import { validateEmail } from './emailValidation';

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
 * Mensagens de validação do contrato unificado Front + API.
 * @see Obsidian: 02-auditorias/pivots-and-bugs/2026-10-05-validacao-cadastro-produtor-e-contratos-diagnostico.md
 */
export const MENSAGENS_VALIDACAO = {
  NOME_FAZENDA_OBRIGATORIO: 'O nome da fazenda é obrigatório',
  NOME_FAZENDA_ESPACO_INICIAL: 'O nome da fazenda não pode começar com espaço em branco',
  EMAIL_INVALIDO: 'Insira um e-mail válido (ex: produtor@fazenda.com.br)',
  PRODUCAO_VACA: 'A produção por vaca deve ser maior que zero (ex: 25.0).',
  PRECO_RECEBIDO: 'O preço recebido deve ser maior que zero (ex: 2.80).',
  PRECO_REFERENCIA: 'O preço de referência deve ser maior que zero (ex: 2.70).',
  CCS: 'A CCS deve ser maior que zero (ex: 200).',
  TOTAL_VACAS: 'O total de vacas deve ser maior que zero.',
  PERCENTUAL_LACTACAO: 'O percentual de lactação deve estar entre 0.1% e 100%.',
  TOTAL_REBANHO: 'O total do rebanho deve ser maior que zero.',
  REBANHO_MENOR_QUE_VACAS: 'O total de animais no rebanho não pode ser inferior à quantidade de vacas.',
  AREA: 'A área deve ser maior que zero.',
  TRABALHADORES: 'O número de trabalhadores deve ser maior que zero.',
} as const;

/**
 * Número estritamente positivo (> 0), espelhando `gt=0` da API.
 * Campos vazios são coeridos para 0 e, portanto, rejeitados.
 */
const numeroPositivo = (mensagem: string) =>
  z.coerce.number({ error: mensagem }).positive(mensagem);

/**
 * Validador estrito para o nome da fazenda:
 * - Não pode ser vazio
 * - Não pode iniciar com espaço em branco
 * - Deve ter no mínimo 1 caractere significativo
 * - Limita ao tamanho máximo configurado
 * - Aplica trim ao final da cadeia
 */
const nomeFazendaValidator = (maxLength = FAZENDA_LIMITS.NOME_MAX_LENGTH) =>
  z.string()
    .min(1, MENSAGENS_VALIDACAO.NOME_FAZENDA_OBRIGATORIO)
    .refine((val) => !val.startsWith(' '), {
      message: MENSAGENS_VALIDACAO.NOME_FAZENDA_ESPACO_INICIAL,
    })
    .refine((val) => val.trim().length >= 1, {
      message: MENSAGENS_VALIDACAO.NOME_FAZENDA_OBRIGATORIO,
    })
    .max(maxLength, `O nome deve ter no máximo ${maxLength} caracteres`)
    .transform((val) => val.trim());

/**
 * Schema principal para os dados da fazenda.
 * @description
 * Aplica limites superiores e inferiores para prevenir erros de digitação e
 * utiliza superRefine para validações cruzadas entre campos (ex: lactação vs total).
 */
export const fazendaSchema = z.object({
  id_fazenda: z.string().optional(),
  nome_fazenda: nomeFazendaValidator(),

  sistema_producao: SistemaProducaoEnum,

  total_vacas: numeroPositivo(MENSAGENS_VALIDACAO.TOTAL_VACAS).max(FAZENDA_LIMITS.VACAS_MAX),

  percentual_lactacao: numeroPositivo(MENSAGENS_VALIDACAO.PERCENTUAL_LACTACAO).max(100, MENSAGENS_VALIDACAO.PERCENTUAL_LACTACAO),

  animais_rebanho: numeroPositivo(MENSAGENS_VALIDACAO.TOTAL_REBANHO).max(FAZENDA_LIMITS.REBANHO_MAX),

  area_atividade: numeroPositivo(MENSAGENS_VALIDACAO.AREA).max(FAZENDA_LIMITS.AREA_MAX),

  mao_obra_total: numeroPositivo(MENSAGENS_VALIDACAO.TRABALHADORES).max(FAZENDA_LIMITS.MAO_DE_OBRA_MAX),

  producao_vaca: numeroPositivo(MENSAGENS_VALIDACAO.PRODUCAO_VACA).max(FAZENDA_LIMITS.PRODUCAO_VACA_MAX),

  preco_leite: numeroPositivo(MENSAGENS_VALIDACAO.PRECO_RECEBIDO).max(FAZENDA_LIMITS.PRECO_MAX),

  preco_referencia: numeroPositivo(MENSAGENS_VALIDACAO.PRECO_REFERENCIA).max(FAZENDA_LIMITS.PRECO_MAX),

  /** Preço médio do concentrado em R$/kg, essencial para o modelo de ML na Simulação. */
  preco_concentrado: z.coerce.number().min(0, 'O preço não pode ser negativo').max(FAZENDA_LIMITS.PRECO_CONCENTRADO_MAX),

  ccs: numeroPositivo(MENSAGENS_VALIDACAO.CCS).max(FAZENDA_LIMITS.CCS_MAX),

  email: z.string().optional().or(z.literal('')).superRefine((val, ctx) => {
    if (!val) return;
    const res = validateEmail(val);
    if (!res.isValid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: res.error || MENSAGENS_VALIDACAO.EMAIL_INVALIDO,
      });
    }
  }),

  regiao: RegiaoEnum,
}).superRefine((data, ctx) => {

  /**
   * Validação Cruzada: Total de Vacas não pode ser maior que o Rebanho Total.
   */
  if (data.total_vacas > data.animais_rebanho) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: MENSAGENS_VALIDACAO.REBANHO_MENOR_QUE_VACAS,
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
  email: z.string().min(1, 'O e-mail é obrigatório').superRefine((val, ctx) => {
    const res = validateEmail(val);
    if (!res.isValid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: res.error || MENSAGENS_VALIDACAO.EMAIL_INVALIDO,
      });
    }
  }),
  senha: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
  nome_fazenda: nomeFazendaValidator(),
  sistema_producao: z.string().min(1, 'Selecione um sistema de produção'),
  regiao_sebrae: z.string().min(1, 'Selecione uma região SEBRAE'),
  total_vacas: numeroPositivo(MENSAGENS_VALIDACAO.TOTAL_VACAS),
  percentual_lactacao: numeroPositivo(MENSAGENS_VALIDACAO.PERCENTUAL_LACTACAO).max(100, MENSAGENS_VALIDACAO.PERCENTUAL_LACTACAO),
  total_rebanho: numeroPositivo(MENSAGENS_VALIDACAO.TOTAL_REBANHO),
  area_atividade: numeroPositivo(MENSAGENS_VALIDACAO.AREA),
  numero_trabalhadores: numeroPositivo(MENSAGENS_VALIDACAO.TRABALHADORES),
  producao_vaca: numeroPositivo(MENSAGENS_VALIDACAO.PRODUCAO_VACA),
  preco_recebido: numeroPositivo(MENSAGENS_VALIDACAO.PRECO_RECEBIDO),
  preco_referencia: numeroPositivo(MENSAGENS_VALIDACAO.PRECO_REFERENCIA),
  ccs: numeroPositivo(MENSAGENS_VALIDACAO.CCS),
}).superRefine((data, ctx) => {
  if (data.total_rebanho < data.total_vacas) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: MENSAGENS_VALIDACAO.REBANHO_MENOR_QUE_VACAS,
      path: ['total_rebanho'],
    });
  }
});

export type CadastrarFazendaFormData = z.infer<typeof cadastrarFazendaSchema>;