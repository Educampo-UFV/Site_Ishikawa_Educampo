/**
 * @fileoverview Suíte de testes unitários para os schemas de validação do Zod.
 * @description
 * Esta suíte garante que a validação de entrada de dados da fazenda funcione como uma malha fina.
 * Como o código se adapta aos testes, as asserções aqui definem como a função `parse` do Zod
 * deve aceitar objetos que cumpram as regras zootécnicas e rejeitar (lançando erros) objetos
 * com valores fora da realidade, como números negativos, limites estourados ou inconsistências cruzadas.
 */

import { fazendaSchema } from '../../src/lib/schemas';

describe('Validações Zod: fazendaSchema', () => {
  const dadosValidos = {
    nome_fazenda: 'Fazenda Leiteira Experimental',
    sistema_producao: 'compost-barn',
    total_vacas: 100,
    percentual_lactacao: 85,
    animais_rebanho: 120,
    area_atividade: 10.0,
    mao_obra_total: 2,
    producao_vaca: 35.0,
    preco_leite: 3.20,
    preco_referencia: 2.50,
    preco_concentrado: 2.30,
    ccs: 150,
    regiao: 'triangulo',
  };

  /**
   * @description Testa o caminho feliz (Happy Path). Se o schema estiver correto, 
   * o método `.parse()` retornará o próprio objeto sem lançar exceções.
   */
  it('deve aceitar um objeto de dados completamente válido', () => {
    expect(() => fazendaSchema.parse(dadosValidos)).not.toThrow();
  });

  /**
   * @description Injeta uma string contendo 101 caracteres no campo nome_fazenda.
   * O Zod deve identificar o excesso e lançar um ZodError, validando a proteção contra abusos no banco.
   */
  it('deve rejeitar nome da fazenda com mais de 100 caracteres', () => {
    const dadosInvalidos = { ...dadosValidos, nome_fazenda: 'A'.repeat(101) };
    expect(() => fazendaSchema.parse(dadosInvalidos)).toThrow();
  });

  /**
   * @description Injeta um valor negativo em um campo financeiro (preco_leite).
   * O método deve lançar um erro provando que a aplicação não aceitará prejuízos matemáticos irreais.
   */
  it('deve rejeitar valores negativos em campos estritamente positivos', () => {
    const dadosInvalidos = { ...dadosValidos, preco_leite: -1.5 };
    expect(() => fazendaSchema.parse(dadosInvalidos)).toThrow();
  });


  /**
   * @description Avalia a hierarquia de rebanho. O número total de vacas (100)
   * não pode superar o total de animais do rebanho (90).
   */
  it('deve rejeitar total de vacas maior que o total do rebanho (Regra Cruzada)', () => {
    const dadosInvalidos = { ...dadosValidos, total_vacas: 100, animais_rebanho: 90 };
    expect(() => fazendaSchema.parse(dadosInvalidos)).toThrow();
  });

  /**
   * @description Fornece strings não tabeladas ('pastagem' e 'capital').
   * O Zod deve lançar erro garantindo o funcionamento estrito dos Enums definidos pela API.
   */
  it('deve rejeitar sistemas de produção ou regiões fora do Enum permitido', () => {
    const dadosInvalidos = { ...dadosValidos, sistema_producao: 'pastagem', regiao: 'capital' };
    expect(() => fazendaSchema.parse(dadosInvalidos)).toThrow();
  });

  it('deve rejeitar sistemas de produção usando snake_case legado', () => {
    const dadosInvalidos = { ...dadosValidos, sistema_producao: 'compost_barn' };
    expect(() => fazendaSchema.parse(dadosInvalidos)).toThrow();
  });
});