/**
 * @file tests/api/consultant_auth_bff.spec.ts
 * @description Suíte de testes (TDD) para as rotas BFF de Autenticação do Consultor.
 * Valida os endpoints:
 * - POST /api/auth (Login)
 * - POST /api/auth/logout (Logout)
 * - GET /api/auth/me (Perfil do Consultor Logado)
 */

import { POST as loginPOST } from '@/app/api/auth/route';
import { POST as logoutPOST } from '@/app/api/auth/logout/route';
import { GET as meGET } from '@/app/api/auth/me/route';
import { NextRequest } from 'next/server';

// Mock do módulo next/server para execução consistente em ambiente Jest (JSDOM)
jest.mock('next/server', () => {
  const createMockCookies = (initialCookies: Record<string, string> = {}) => {
    const store = new Map<string, { name: string; value: string; [key: string]: any }>();
    Object.entries(initialCookies).forEach(([k, v]) => {
      store.set(k, { name: k, value: v });
    });

    return {
      get: (name: string) => store.get(name),
      set: (cookieOrName: any, value?: string) => {
        if (typeof cookieOrName === 'string') {
          store.set(cookieOrName, { name: cookieOrName, value: value || '' });
        } else {
          store.set(cookieOrName.name, cookieOrName);
        }
      },
      delete: (name: string) => {
        store.delete(name);
      },
      has: (name: string) => store.has(name),
    };
  };

  return {
    NextRequest: class MockNextRequest {
      url: string;
      _body: any;
      cookies: ReturnType<typeof createMockCookies>;
      headers: Map<string, string>;

      constructor(url: string, options?: any) {
        this.url = url;
        this._body = options?.body ? JSON.parse(options.body) : null;
        const cookieHeader = options?.cookies || {};
        this.cookies = createMockCookies(cookieHeader);
        this.headers = new Map(Object.entries(options?.headers || {}));
      }

      async json() {
        return this._body;
      }
    },
    NextResponse: class MockNextResponse {
      cookies = createMockCookies();
      status: number;
      _body: any;

      constructor(body: any, init?: { status?: number }) {
        this._body = body;
        this.status = init?.status || 200;
      }

      static json(body: any, init?: { status?: number }) {
        const res = new MockNextResponse(body, init);
        return res;
      }

      async json() {
        return this._body;
      }
    },
  };
});

global.fetch = jest.fn();

describe('BFF Auth API Routes - Feature 1: Autenticação do Consultor', () => {
  const originalEnv = process.env;

  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      API_BASE_URL: 'https://api-backend-educampo.com',
      API_KEY: '42',
    };
  });

  afterAll(() => {
    jest.restoreAllMocks();
    process.env = originalEnv;
  });

  describe('POST /api/auth (Login)', () => {
    it('deve repassar e-mail e senha para a API backend com X-API-KEY e injetar cookie session_token no sucesso', async () => {
      // Arrange
      const mockBackendResponse = {
        message: 'Login realizado com sucesso',
        consultant: {
          id: 'consultant-uuid-123',
          email: 'consultor@educampo.com',
          producers_managed: ['produtor-1', 'produtor-2'],
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {
          get: (header: string) =>
            header.toLowerCase() === 'set-cookie' ? 'session_token=backend-session-jwt; Path=/' : null,
        },
        json: async () => mockBackendResponse,
      });

      const req = new NextRequest('http://localhost:3000/api/auth', {
        method: 'POST',
        body: JSON.stringify({
          email: 'consultor@educampo.com',
          password: 'admin123',
          rememberMe: true,
        }),
      });

      // Act
      const response = await loginPOST(req);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.message).toBe('Login realizado com sucesso');
      expect(data.consultant.email).toBe('consultor@educampo.com');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api-backend-educampo.com/api/auth/login',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-API-KEY': '42',
          }),
          body: JSON.stringify({
            email: 'consultor@educampo.com',
            password: 'admin123',
          }),
        })
      );

      const sessionCookie = response.cookies.get('session_token');
      expect(sessionCookie).toBeDefined();
      expect(sessionCookie?.value).toBe('backend-session-jwt');
      expect(sessionCookie?.httpOnly).toBe(true);
      expect(sessionCookie?.sameSite).toBe('lax');
    });

    it('deve retornar 401 Unauthorized e não emitir cookie se as credenciais forem inválidas', async () => {
      // Arrange
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ detail: 'Credenciais inválidas' }),
      });

      const req = new NextRequest('http://localhost:3000/api/auth', {
        method: 'POST',
        body: JSON.stringify({
          email: 'consultor@educampo.com',
          password: 'senha_errada',
        }),
      });

      // Act
      const response = await loginPOST(req);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe('Credenciais inválidas');
      expect(response.cookies.has('session_token')).toBe(false);
    });

    it('deve retornar 400 Bad Request se email ou senha forem omitidos', async () => {
      // Arrange
      const req = new NextRequest('http://localhost:3000/api/auth', {
        method: 'POST',
        body: JSON.stringify({ email: '' }),
      });

      // Act
      const response = await loginPOST(req);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('E-mail e senha são obrigatórios.');
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/auth/logout (Logout)', () => {
    it('deve encaminhar logout para a API backend e expirar/remover o cookie session_token', async () => {
      // Arrange
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: 'Logout realizado com sucesso' }),
      });

      const req = new NextRequest('http://localhost:3000/api/auth/logout', {
        method: 'POST',
        cookies: { session_token: 'valid-token' },
      });

      // Act
      const response = await logoutPOST(req);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.message).toBe('Logout realizado com sucesso');
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api-backend-educampo.com/api/auth/logout',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'X-API-KEY': '42',
          }),
        })
      );
    });
  });

  describe('GET /api/auth/me (Perfil do Consultor)', () => {
    it('deve retornar perfil do consultor logado repassando o cookie e X-API-KEY para o backend', async () => {
      // Arrange
      const mockProfile = {
        id: 'consultant-uuid-123',
        email: 'consultor@educampo.com',
        producers_managed: ['produtor-1', 'produtor-2'],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockProfile,
      });

      const req = new NextRequest('http://localhost:3000/api/auth/me', {
        method: 'GET',
        cookies: { session_token: 'valid-session-jwt' },
      });

      // Act
      const response = await meGET(req);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.email).toBe('consultor@educampo.com');
      expect(data.producers_managed).toHaveLength(2);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api-backend-educampo.com/api/auth/me',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'X-API-KEY': '42',
            Cookie: 'session_token=valid-session-jwt',
          }),
        })
      );
    });

    it('deve retornar 401 se a requisição me não possuir o cookie session_token', async () => {
      // Arrange
      const req = new NextRequest('http://localhost:3000/api/auth/me', {
        method: 'GET',
      });

      // Act
      const response = await meGET(req);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data.error).toBe('Sessão não encontrada');
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
