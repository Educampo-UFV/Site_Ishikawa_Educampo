import { cadastrarFazendaSchema } from '../../src/lib/schemas';

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
      expect(herdError?.message).toBe('O total do rebanho não pode ser menor que o total de vacas');
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
