/**
 * @fileoverview Definição de esquemas de validação robustos utilizando Zod.
 * @description
 * Este arquivo centraliza a lógica de validação de entrada de dados do sistema.
 * Utilizamos o Zod para garantir tipagem estática e validação em tempo de execução,
 * aplicando regras zootécnicas e limites de segurança (malha fina) para evitar
 * inconsistências nos cálculos do Diagrama de Ishikawa.
 */

import { z } from 'zod';

/**
 * Enum para os sistemas de produção suportados pela API.
 */
export const SistemaProducaoEnum = z.enum(['compost_barn', 'confinado', 'semi_confinado']);

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
    .max(100, 'O nome deve ter no máximo 100 caracteres'),
  
  sistema_producao: SistemaProducaoEnum,
  
  total_vacas: z.coerce.number().int().min(0).max(50000),
  
  vacas_lactacao: z.coerce.number().int().min(0).max(50000),
  
  animais_rebanho: z.coerce.number().int().min(0).max(100000),
  
  area_atividade: z.coerce.number().min(0.1, 'A área mínima é 0.1 ha').max(50000),
  
  mao_obra_total: z.coerce.number().int().min(1, 'Mínimo de 1 trabalhador').max(1000),
  
  producao_vaca: z.coerce.number().min(0).max(100),
  
  preco_leite: z.coerce.number().min(0).max(15),
  
  preco_referencia: z.coerce.number().min(0).max(15),
  
  /** Preço médio do concentrado em R$/kg, essencial para o modelo de ML na Simulação. */
  preco_concentrado: z.coerce.number().min(0, 'O preço não pode ser negativo').max(100),
  
  ccs: z.coerce.number().int().min(0).max(9999),
  
  regiao: RegiaoEnum,
}).superRefine((data, ctx) => {
  /**
   * Validação Cruzada: Vacas em Lactação não pode ser maior que o Total de Vacas.
   */
  if (data.vacas_lactacao > data.total_vacas) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Vacas em lactação não pode exceder o total de vacas',
      path: ['vacas_lactacao'],
    });
  }

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
 * Tipo TypeScript extraído automaticamente do Schema do Zod.
 */
export type FazendaFormData = z.infer<typeof fazendaSchema>;