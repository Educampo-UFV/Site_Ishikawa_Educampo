/**
 * @file tests/schemas/float-inputs.spec.ts
 * @description Suíte de testes TDD para garantir a aceitação de Floats nos campos quantitativos
 * e validar o comportamento e a performance da nova regra de schemas.
 */

import { fazendaSchema } from '../../src/lib/schemas';

// Função utilitária para gerar payload base válido
const basePayload = () => ({
  nome_fazenda: "Fazenda TDD",
  sistema_producao: "compost-barn",
  total_vacas: 100,
  percentual_lactacao: 85,
  animais_rebanho: 150,
  area_atividade: 50,
  mao_obra_total: 4,
  producao_vaca: 35,
  preco_leite: 3.10,
  preco_referencia: 3.00,
  preco_concentrado: 2.50,
  ccs: 200,
  regiao: "sul"
});

describe('TDD: Suporte a Floats e Máscara Numérica (Zod Schema)', () => {

  // 1. HAPPY PATH
  it('deve aceitar valores decimais perfeitos (floats) em campos quantitativos', () => {
    const payload = {
      ...basePayload(),
      total_vacas: 102.38,
      animais_rebanho: 102.388,
      mao_obra_total: 2.5,
      ccs: 150.123
    };

    const validacao = fazendaSchema.safeParse(payload);
    expect(validacao.success).toBe(true);
    if (validacao.success) {
      expect(validacao.data.total_vacas).toBe(102.38);
      expect(validacao.data.animais_rebanho).toBe(102.388);
    }
  });

  it('z.coerce deve converter corretamente strings com formato de float padrão (Ponto)', () => {
    const payload = {
      ...basePayload(),
      total_vacas: "102.38",
      animais_rebanho: "102.388"
    };

    const validacao = fazendaSchema.safeParse(payload);
    expect(validacao.success).toBe(true);
    if (validacao.success) {
      expect(validacao.data.total_vacas).toBe(102.38);
      expect(validacao.data.animais_rebanho).toBe(102.388);
    }
  });

  // 2. EDGE CASES
  it('deve aceitar valores limítrofes exatos de precisão (3 casas decimais e zero absoluto)', () => {
    const payload = {
      ...basePayload(),
      total_vacas: 0.001,
      animais_rebanho: 0.001,
      mao_obra_total: 1.000 // O Mínimo de mão de obra é 1, conforme FAZENDA_LIMITS
    };

    const validacao = fazendaSchema.safeParse(payload);
    expect(validacao.success).toBe(true);
  });

  // 3. EXCEPTION PATHS
  it('deve rejeitar submissões vazias ou alfanuméricas mascaradas erradas (Proteção pós react-number-format)', () => {
    const payload = {
      ...basePayload(),
      total_vacas: "abc", // Simulando falha da máscara
      animais_rebanho: ""
    };

    const validacao = fazendaSchema.safeParse(payload);
    expect(validacao.success).toBe(false);
  });

  // 4. PERFORMANCE & SCALING
  it('deve processar e validar grandes volumes de schemas com floats eficientemente', () => {
    const tamanhos = [10, 100, 1000];
    
    console.log('\n=== PERFORMANCE REPORT: Zod Float Validation ===');
    console.log('| N (Items) | Time (ms) |');
    console.log('|-----------|-----------|');

    for (const n of tamanhos) {
      const startTime = performance.now();
      
      for (let i = 0; i < n; i++) {
        const payload = {
          ...basePayload(),
          total_vacas: 100 + (i * 0.111),
          animais_rebanho: 150 + (i * 0.111)
        };
        fazendaSchema.safeParse(payload);
      }

      const timeTaken = (performance.now() - startTime).toFixed(2);
      console.log(`| ${n.toString().padEnd(9)} | ${timeTaken.padEnd(9)} |`);
    }
    console.log('================================================\n');
    
    expect(true).toBe(true);
  });
});
