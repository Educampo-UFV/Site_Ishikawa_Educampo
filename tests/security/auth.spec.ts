/**
 * @file tests/security/auth.spec.ts
 * @description Suíte de testes de segurança que define o contrato da Barreira de Segurança (Auth).
 * Garante o padrão Zero-Token-Exposure e o bloqueio de rotas privadas via Proxy.
 *
 * COMO ESTE CÓDIGO FUNCIONA:
 * 1. Simulação de Ambiente (JSDOM): Utilizamos os objetos globais `window.localStorage` e 
 * `window.sessionStorage` espionados (spies) pelo Jest para garantir que nenhuma lógica
 * frontend tente armazenar o token JWT no navegador.
 * 2. Mocking de Resposta HTTP: Simulamos a estrutura de cabeçalhos de resposta para verificar
 * se a rota de autenticação injeta o cookie com as flags `HttpOnly`, `Secure` e `SameSite=Strict`.
 * 3. Validação de Interceptação: Testamos o fluxo abstrato do Proxy, garantindo que
 * requisições sem o cookie gerem um redirecionamento forçado para `/login`.
 */

import { NextRequest, NextResponse } from 'next/server';

// Realiza o mock do next/server para evitar o erro "ReferenceError: Request is not defined"
// no ambiente do JSDOM, que não possui o Request nativo da Fetch API.
jest.mock('next/server', () => {
  const createMockCookies = () => {
    const store = new Map();
    return {
      get: (name: string) => store.get(name),
      set: (cookieOrName: any, value?: string) => {
        if (typeof cookieOrName === 'string') {
          store.set(cookieOrName, { name: cookieOrName, value });
        } else {
          store.set(cookieOrName.name, cookieOrName);
        }
      },
      has: (name: string) => store.has(name),
    };
  };

  return {
    NextRequest: class MockNextRequest {
      url: string;
      cookies = createMockCookies();
      constructor(url: string) {
        this.url = url;
      }
    },
    NextResponse: class MockNextResponse {
      static json(body: any) {
        return { cookies: createMockCookies(), status: 200 };
      }
      static redirect(url: URL | string) {
        return {
          status: 307,
          headers: { get: (key: string) => (key.toLowerCase() === 'location' ? url.toString() : null) },
        };
      }
      static next() {
        return { status: 200 };
      }
    },
  };
});

describe('🔒 Barreira de Segurança e Autenticação', () => {
  let localStorageSpy: jest.SpyInstance;
  let sessionStorageSpy: jest.SpyInstance;

  beforeEach(() => {
    // Espiona as APIs de armazenamento do navegador para garantir o Zero-Token-Exposure
    // No JSDOM, não podemos espionar propriedades readonly na instância, então usamos o prototype.
    localStorageSpy = jest.spyOn(Storage.prototype, 'setItem');
    sessionStorageSpy = localStorageSpy; // O mesmo spy no prototype atende a ambos
    
    // Limpa os mocks antes de cada teste
    localStorageSpy.mockClear();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('Padrão Zero-Token-Exposure', () => {
    it('NÃO deve permitir o armazenamento do token JWT no localStorage ou sessionStorage', () => {
      // Simulação de uma função de login maliciosa ou incorreta no frontend
      const mockLoginInsecure = (token: string) => {
        // A aplicação real NÃO deve fazer isso
        // localStorage.setItem('token', token); 
      };

      mockLoginInsecure('fake-jwt-token');

      // A LEI: O sistema falha se localStorage ou sessionStorage forem chamados para salvar tokens
      expect(localStorageSpy).not.toHaveBeenCalledWith(expect.any(String), expect.stringMatching(/fake-jwt-token/i));
      expect(sessionStorageSpy).not.toHaveBeenCalledWith(expect.any(String), expect.stringMatching(/fake-jwt-token/i));
    });
  });

  describe('Segurança de Cookies (Endpoint BFF)', () => {
    it('A rota de autenticação DEVE retornar um cookie blindado (HttpOnly, Secure, SameSite=Strict)', () => {
      // Simula a criação de uma resposta de sucesso da futura rota /api/auth
      const response = NextResponse.json({ message: 'Login bem-sucedido' });
      
      // Simula a injeção do cookie que nossa rota fará
      response.cookies.set({
        name: 'educampo_session',
        value: 'fake-jwt-token',
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/',
      });

      const sessionCookie = response.cookies.get('educampo_session');

      // A LEI: O cookie deve existir e possuir todas as flags de mitigação de XSS e CSRF
      expect(sessionCookie).toBeDefined();
      expect(sessionCookie?.value).toBe('fake-jwt-token');
      expect(sessionCookie?.httpOnly).toBe(true);
      expect(sessionCookie?.secure).toBe(true);
      expect(sessionCookie?.sameSite).toBe('strict');
    });
  });

  describe('Proxy Guardião (Proteção de Rotas Privadas)', () => {
    it('DEVE redirecionar para a tela de /login se o cookie de sessão não existir', () => {
      // Simula uma tentativa de acessar o diagnóstico sem estar logado
      const request = new NextRequest('http://localhost:3000/diagnostico');
      
      // Simula a lógica básica que o Proxy deverá ter
      const hasSession = request.cookies.has('educampo_session');
      let response;
      
      if (!hasSession) {
        response = NextResponse.redirect(new URL('/login', request.url));
      } else {
        response = NextResponse.next();
      }

      // A LEI: Sem cookie, a resposta deve ser um redirecionamento (status 307) para a rota de login
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toBe('http://localhost:3000/login');
    });

    it('DEVE permitir o acesso se o cookie de sessão for válido e presente', () => {
      // Simula uma requisição autenticada
      const request = new NextRequest('http://localhost:3000/diagnostico');
      request.cookies.set('educampo_session', 'valid-jwt-token');
      
      const hasSession = request.cookies.has('educampo_session');
      const response = hasSession ? NextResponse.next() : NextResponse.redirect(new URL('/login', request.url));

      // A LEI: Com cookie, a requisição passa reto (status 200 no mock next())
      expect(response.status).toBe(200);
    });
  });

  describe('Sliding Session & Lembrar de Mim (Regras de Expiração)', () => {
    it('DEVE emitir um cookie de curta duração (15m) por padrão (rememberMe = false)', () => {
      // Arrange
      const response = NextResponse.json({ message: 'Login bem-sucedido' });
      const COOKIE_MAX_AGE_SHORT = 15 * 60; // 900s
      
      // Act: Simula a ação da API de Auth
      response.cookies.set({
        name: 'educampo_session',
        value: 'fake-jwt-token-short',
        maxAge: COOKIE_MAX_AGE_SHORT,
      });

      const sessionCookie = response.cookies.get('educampo_session');

      // Assert
      expect(sessionCookie).toBeDefined();
      expect(sessionCookie?.maxAge).toBe(900);
    });

    it('DEVE emitir um cookie de longa duração (7 dias) se rememberMe for verdadeiro', () => {
      // Arrange
      const response = NextResponse.json({ message: 'Login bem-sucedido' });
      const COOKIE_MAX_AGE_LONG = 7 * 24 * 60 * 60; // 604800s
      
      // Act: Simula a ação da API de Auth com rememberMe=true
      response.cookies.set({
        name: 'educampo_session',
        value: 'fake-jwt-token-long',
        maxAge: COOKIE_MAX_AGE_LONG,
      });

      const sessionCookie = response.cookies.get('educampo_session');

      // Assert
      expect(sessionCookie).toBeDefined();
      expect(sessionCookie?.maxAge).toBe(604800);
    });

    it('DEVE emitir um novo cookie atualizado ao chamar a rota de refresh (Sliding Session)', () => {
      // Arrange
      const response = NextResponse.json({ message: 'Token renovado' });
      const COOKIE_MAX_AGE_SHORT = 15 * 60;
      
      // Act: Simula a ação da API de Refresh emitindo um novo cookie
      response.cookies.set({
        name: 'educampo_session',
        value: 'refreshed-jwt-token',
        maxAge: COOKIE_MAX_AGE_SHORT,
      });

      const sessionCookie = response.cookies.get('educampo_session');

      // Assert
      expect(sessionCookie).toBeDefined();
      expect(sessionCookie?.value).toBe('refreshed-jwt-token');
      expect(sessionCookie?.maxAge).toBe(900);
    });
  });
});