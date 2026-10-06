import { validateEmail } from '../../src/lib/emailValidation';

describe('validateEmail Unit Tests', () => {
  describe('Happy Path: E-mails válidos', () => {
    it.each([
      'produtor@fazenda.com.br',
      'joao.silva@gmail.com',
      'maria@hotmail.com',
      'consultor@outlook.com',
      'contato@yahoo.com.br',
      'pesquisador@ufv.br',
      'tecnico@embrapa.br',
      'veterinario@epamig.br',
      'gestor@agritech.io',
      'suporte@coop.org.br',
      'novo_produtor+teste@fazenda.agr.br',
    ])('deve aprovar o e-mail válido: %s', (email) => {
      // Act
      const result = validateEmail(email);

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('Unhappy Path: Typos nos principais provedores', () => {
    it.each([
      ['produtor@gmail.cos', 'Parece haver um erro de digitação no domínio do e-mail'],
      ['produtor@gmai.com', 'Parece haver um erro de digitação no domínio do e-mail'],
      ['produtor@gmial.com', 'Parece haver um erro de digitação no domínio do e-mail'],
      ['produtor@gmaill.com', 'Parece haver um erro de digitação no domínio do e-mail'],
      ['produtor@gamil.com', 'Parece haver um erro de digitação no domínio do e-mail'],
      ['produtor@gmaul.com', 'Parece haver um erro de digitação no domínio do e-mail'],
      ['produtor@gmail.com.br', 'Parece haver um erro de digitação no domínio do e-mail'],
      ['produtor@gmail.con', 'Parece haver um erro de digitação no domínio do e-mail'],
      ['produtor@gmail.cmo', 'Parece haver um erro de digitação no domínio do e-mail'],
      ['produtor@gmail.comm', 'Parece haver um erro de digitação no domínio do e-mail'],
      ['produtor@hotmial.com', 'Parece haver um erro de digitação no domínio do e-mail'],
      ['produtor@hotmai.com', 'Parece haver um erro de digitação no domínio do e-mail'],
      ['produtor@hotmaill.com', 'Parece haver um erro de digitação no domínio do e-mail'],
      ['produtor@hotamil.com', 'Parece haver um erro de digitação no domínio do e-mail'],
      ['produtor@homail.com', 'Parece haver um erro de digitação no domínio do e-mail'],
      ['produtor@outlok.com', 'Parece haver um erro de digitação no domínio do e-mail'],
      ['produtor@outloo.com', 'Parece haver um erro de digitação no domínio do e-mail'],
      ['produtor@outloook.com', 'Parece haver um erro de digitação no domínio do e-mail'],
      ['produtor@outlock.com', 'Parece haver um erro de digitação no domínio do e-mail'],
      ['produtor@yaho.com', 'Parece haver um erro de digitação no domínio do e-mail'],
      ['produtor@yahooo.com', 'Parece haver um erro de digitação no domínio do e-mail'],
      ['produtor@yaho.com.br', 'Parece haver um erro de digitação no domínio do e-mail'],
    ])('deve identificar e rejeitar erro de digitação em provedor: %s', (email, expectedSnippet) => {
      // Act
      const result = validateEmail(email);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.error).toContain(expectedSnippet);
    });
  });

  describe('Unhappy Path: TLDs com erros comuns de digitação', () => {
    it.each([
      ['usuario@fazendasantaclara.cos', 'Extensão de domínio inválida'],
      ['usuario@fazendasantaclara.con', 'Extensão de domínio inválida'],
      ['usuario@fazendasantaclara.cmo', 'Extensão de domínio inválida'],
      ['usuario@fazendasantaclara.comm', 'Extensão de domínio inválida'],
      ['usuario@fazendasantaclara.coom', 'Extensão de domínio inválida'],
      ['usuario@fazendasantaclara.cm', 'Extensão de domínio inválida'],
    ])('deve rejeitar TLD inválido por typo: %s', (email, expectedSnippet) => {
      // Act
      const result = validateEmail(email);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.error).toContain(expectedSnippet);
    });
  });

  describe('Unhappy Path: Violações de formato RFC e entradas malformadas', () => {
    it.each([
      ['', 'O e-mail é obrigatório'],
      ['   ', 'O e-mail é obrigatório'],
      ['email_sem_arroba', 'Insira um e-mail válido'],
      ['@sem_usuario.com', 'Insira um e-mail válido'],
      ['usuario@', 'Insira um e-mail válido'],
      ['usuario@dominio', 'Insira um e-mail válido'],
      ['usuario@dominio.', 'Insira um e-mail válido'],
      ['usuario@dominio.c', 'Insira um e-mail válido'],
      ['usuario..duplo@dominio.com', 'Insira um e-mail válido'],
      ['usuario@dominio..com', 'Insira um e-mail válido'],
      ['usuario @dominio.com', 'Insira um e-mail válido'],
      ['usuario@dom inio.com', 'Insira um e-mail válido'],
    ])('deve rejeitar entrada malformada: "%s"', (email, expectedSnippet) => {
      // Act
      const result = validateEmail(email);

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.error).toContain(expectedSnippet);
    });
  });
});
