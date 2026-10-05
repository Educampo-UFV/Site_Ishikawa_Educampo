import { cadastrarFazendaSchema, fazendaSchema, MENSAGENS_VALIDACAO } from '../../src/lib/schemas';

describe('cadastrarFazendaSchema Validation Unit Tests', () => {
  it('should pass validation for a completely valid producer input payload', () => {
    // Arrange
    const validPayload = {
      email: 'novo.produtor@fazenda.com.br',
      senha: 'senhaSegura123',
      nome_fazenda: 'Fazenda Santa Maria',
      sistema_producao: 'Compost Barn',
      regiao_sebrae: 'Triângulo Mineiro',
      total_vacas: 150,
      percentual_lactacao: 80,
      total_rebanho: 180,
      area_atividade: 25,
      numero_trabalhadores: 3,
      producao_vaca: 30,
      preco_recebido: 3.10,
      preco_referencia: 2.50,
      ccs: 200,
    };

    // Act
    const result = cadastrarFazendaSchema.safeParse(validPayload);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('novo.produtor@fazenda.com.br');
      expect(result.data.total_vacas).toBe(150);
      expect(result.data.total_rebanho).toBe(180);
    }
  });

  it('should reject validation when password has less than 6 characters', () => {
    // Arrange
    const invalidPayload = {
      email: 'produtor@fazenda.com',
      senha: '12345',
      nome_fazenda: 'Fazenda Esperança',
      sistema_producao: 'Confinado',
      regiao_sebrae: 'Sul de Minas',
      total_vacas: 50,
      percentual_lactacao: 70,
      total_rebanho: 60,
      area_atividade: 10,
      numero_trabalhadores: 2,
      producao_vaca: 25,
      preco_recebido: 2.80,
      preco_referencia: 2.50,
      ccs: 150,
    };

    // Act
    const result = cadastrarFazendaSchema.safeParse(invalidPayload);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      const passwordError = result.error.issues.find(issue => issue.path.includes('senha'));
      expect(passwordError).toBeDefined();
      expect(passwordError?.message).toBe('A senha deve ter no mínimo 6 caracteres');
    }
  });

  it('should reject validation when total_rebanho is less than total_vacas', () => {
    // Arrange
    const inconsistentHerdPayload = {
      email: 'produtor@fazenda.com',
      senha: 'senhaSegura123',
      nome_fazenda: 'Fazenda Esperança',
      sistema_producao: 'Confinado',
      regiao_sebrae: 'Sul de Minas',
      total_vacas: 100,
      percentual_lactacao: 70,
      total_rebanho: 50,
      area_atividade: 10,
      numero_trabalhadores: 2,
      producao_vaca: 25,
      preco_recebido: 2.80,
      preco_referencia: 2.50,
      ccs: 150,
    };

    // Act
    const result = cadastrarFazendaSchema.safeParse(inconsistentHerdPayload);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      const herdError = result.error.issues.find(issue => issue.path.includes('total_rebanho'));
      expect(herdError).toBeDefined();
      expect(herdError?.message).toBe(MENSAGENS_VALIDACAO.REBANHO_MENOR_QUE_VACAS);
    }
  });

  it('should reject validation when email format is invalid', () => {
    // Arrange
    const invalidEmailPayload = {
      email: 'email_invalido',
      senha: 'senhaSegura123',
      nome_fazenda: 'Fazenda Esperança',
      sistema_producao: 'Confinado',
      regiao_sebrae: 'Sul de Minas',
      total_vacas: 50,
      percentual_lactacao: 70,
      total_rebanho: 60,
      area_atividade: 10,
      numero_trabalhadores: 2,
      producao_vaca: 25,
      preco_recebido: 2.80,
      preco_referencia: 2.50,
      ccs: 150,
    };

    // Act
    const result = cadastrarFazendaSchema.safeParse(invalidEmailPayload);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      const emailError = result.error.issues.find(issue => issue.path.includes('email'));
      expect(emailError).toBeDefined();
      expect(emailError?.message).toBe('Insira um e-mail válido');
    }
  });
});

/**
 * Contrato unificado Front + API (gt=0).
 * @see Obsidian: 02-auditorias/pivots-and-bugs/2026-10-05-validacao-cadastro-produtor-e-contratos-diagnostico.md
 */
describe('Contrato gt=0: cadastrarFazendaSchema', () => {
  const base = {
    email: 'produtor@fazenda.com',
    senha: 'senhaSegura123',
    nome_fazenda: 'Fazenda Santa Tereza',
    sistema_producao: 'compost-barn',
    regiao_sebrae: 'sul',
    total_vacas: 50,
    percentual_lactacao: 70,
    total_rebanho: 60,
    area_atividade: 10,
    numero_trabalhadores: 2,
    producao_vaca: 25,
    preco_recebido: 2.8,
    preco_referencia: 2.7,
    ccs: 200,
  };

  it.each([
    ['producao_vaca', 0, MENSAGENS_VALIDACAO.PRODUCAO_VACA],
    ['preco_recebido', 0, MENSAGENS_VALIDACAO.PRECO_RECEBIDO],
    ['preco_referencia', 0, MENSAGENS_VALIDACAO.PRECO_REFERENCIA],
    ['ccs', 0, MENSAGENS_VALIDACAO.CCS],
    ['ccs', -10, MENSAGENS_VALIDACAO.CCS],
    ['total_rebanho', 0, MENSAGENS_VALIDACAO.TOTAL_REBANHO],
    ['area_atividade', 0, MENSAGENS_VALIDACAO.AREA],
    ['numero_trabalhadores', 0, MENSAGENS_VALIDACAO.TRABALHADORES],
    ['percentual_lactacao', 0, MENSAGENS_VALIDACAO.PERCENTUAL_LACTACAO],
    ['percentual_lactacao', 105, MENSAGENS_VALIDACAO.PERCENTUAL_LACTACAO],
    ['producao_vaca', '', MENSAGENS_VALIDACAO.PRODUCAO_VACA],
  ])('rejeita %s = %p', (campo, valor, mensagem) => {
    const result = cadastrarFazendaSchema.safeParse({ ...base, [campo]: valor });
    expect(result.success).toBe(false);
    const issue = result.error?.issues.find((i) => i.path.includes(campo as string));
    expect(issue?.message).toBe(mensagem);
  });

  it('rejeita total_vacas = 0', () => {
    const result = cadastrarFazendaSchema.safeParse({ ...base, total_vacas: 0 });
    expect(result.error?.issues.some((i) => i.message === MENSAGENS_VALIDACAO.TOTAL_VACAS)).toBe(true);
  });

  it('aceita médias decimais (CT10)', () => {
    const result = cadastrarFazendaSchema.safeParse({ ...base, total_vacas: 85.5, total_rebanho: 90.3, numero_trabalhadores: 2.5 });
    expect(result.success).toBe(true);
  });
});

describe('Contrato gt=0: fazendaSchema (página de Ajustes)', () => {
  const base = {
    nome_fazenda: 'Fazenda Santa Tereza',
    sistema_producao: 'compost-barn',
    regiao: 'sul',
    total_vacas: 50,
    percentual_lactacao: 70,
    animais_rebanho: 60,
    area_atividade: 10,
    mao_obra_total: 2.5,
    producao_vaca: 25,
    preco_leite: 2.8,
    preco_referencia: 2.7,
    preco_concentrado: 1.5,
    ccs: 200,
  };

  it('aceita payload válido com decimais', () => {
    expect(fazendaSchema.safeParse(base).success).toBe(true);
  });

  it.each(['producao_vaca', 'preco_leite', 'preco_referencia', 'ccs', 'area_atividade', 'mao_obra_total', 'percentual_lactacao'])(
    'rejeita %s = 0',
    (campo) => {
      const result = fazendaSchema.safeParse({ ...base, [campo]: 0 });
      expect(result.success).toBe(false);
      expect(result.error?.issues.some((i) => i.path.includes(campo))).toBe(true);
    },
  );
});
