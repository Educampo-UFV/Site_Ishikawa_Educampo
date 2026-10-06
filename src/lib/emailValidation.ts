/**
 * @fileoverview Utilitário estritamente tipado para validação de e-mails e prevenção de typos.
 * @description
 * Valida sintaxe RFC, detecta erros clássicos de digitação em provedores populares (Gmail, Hotmail, etc.)
 * e rejeita TLDs sabidamente inválidos (.cos, .con, etc.), preservando domínios institucionais legítimos.
 */

export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * TLDs conhecidos que representam erros comuns de digitação de extensões válidas (.com, .com.br).
 */
const INVALID_TLD_TYPOS = new Set<string>([
  'cos',
  'con',
  'cmo',
  'comm',
  'coom',
  'cm',
  'cpm',
  'xom',
  'col',
  'comp',
  'coum',
]);

/**
 * Erros de digitação frequentes para os maiores provedores de e-mail utilizados no Brasil.
 */
const POPULAR_PROVIDER_TYPOS = new Set<string>([
  // Gmail
  'gmai.com',
  'gmial.com',
  'gmaill.com',
  'gamil.com',
  'gmaul.com',
  'gmail.com.br',
  'gmail.cos',
  'gmail.con',
  'gmail.cmo',
  'gmail.comm',
  'gmail.coom',
  'gmail.cm',
  'gmail.co',
  // Hotmail
  'hotmial.com',
  'hotmai.com',
  'hotmaill.com',
  'hotamil.com',
  'homail.com',
  'hotmail.cos',
  'hotmail.con',
  'hotmial.com.br',
  // Outlook
  'outlok.com',
  'outloo.com',
  'outloook.com',
  'outlock.com',
  'ootlook.com',
  'outlook.cos',
  'outlook.con',
  // Yahoo
  'yaho.com',
  'yahooo.com',
  'yaho.com.br',
  'yahooo.com.br',
  'yaoo.com',
  'yahoo.cos',
  'yahoo.con',
]);

/**
 * Expressão regular baseada na especificação do HTML5 e RFC 5322 simplificada.
 */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Valida um endereço de e-mail com checagem estrutural e proteção contra erros comuns de digitação.
 *
 * @param email - Endereço de e-mail a ser validado
 * @returns Objeto com status de validade e mensagem de erro amigável, caso inválido.
 */
export function validateEmail(email: string | null | undefined): EmailValidationResult {
  if (!email || typeof email !== 'string' || email.trim() === '') {
    return {
      isValid: false,
      error: 'O e-mail é obrigatório.',
    };
  }

  const trimmed = email.trim();

  // Rejeita espaços em branco internos
  if (/\s/.test(trimmed)) {
    return {
      isValid: false,
      error: 'Insira um e-mail válido (ex: produtor@fazenda.com.br).',
    };
  }

  // Validação de formato base
  if (!EMAIL_REGEX.test(trimmed)) {
    return {
      isValid: false,
      error: 'Insira um e-mail válido (ex: produtor@fazenda.com.br).',
    };
  }

  // Divisão estrutural de usuário e domínio
  const parts = trimmed.split('@');
  if (parts.length !== 2) {
    return {
      isValid: false,
      error: 'Insira um e-mail válido (ex: produtor@fazenda.com.br).',
    };
  }

  const [username, domainRaw] = parts;
  const domain = domainRaw.toLowerCase();

  // Proteção contra pontos consecutivos no usuário ou no domínio
  if (username.includes('..') || domain.includes('..')) {
    return {
      isValid: false,
      error: 'Insira um e-mail válido (ex: produtor@fazenda.com.br).',
    };
  }

  // 1. Detecção de typos em provedores populares (Gmail, Hotmail, Outlook, Yahoo)
  if (POPULAR_PROVIDER_TYPOS.has(domain)) {
    return {
      isValid: false,
      error: 'Parece haver um erro de digitação no domínio do e-mail (ex: @gmail.com, @hotmail.com).',
    };
  }

  // 2. Extração do TLD final
  const domainParts = domain.split('.');
  const tld = domainParts[domainParts.length - 1];

  // TLD deve ter no mínimo 2 caracteres alfabéticos
  if (!tld || tld.length < 2 || !/^[a-z]+$/.test(tld)) {
    return {
      isValid: false,
      error: 'Insira um e-mail válido (ex: produtor@fazenda.com.br).',
    };
  }

  // 3. Detecção de TLDs com typos clássicos (.cos, .con, .cmo, etc.)
  if (INVALID_TLD_TYPOS.has(tld)) {
    return {
      isValid: false,
      error: 'Extensão de domínio inválida (ex: use .com ou .com.br).',
    };
  }

  return { isValid: true };
}
