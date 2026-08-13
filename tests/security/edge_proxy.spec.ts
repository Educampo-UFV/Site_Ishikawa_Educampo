/**
 * @file tests/security/edge_proxy.spec.ts
 * @description Suíte de testes de segurança para o Edge Proxy (src/proxy.ts).
 * Valida a proteção O(1) de rotas privadas e o redirecionamento de usuários deslogados.
 */

import { NextRequest } from 'next/server';

// Mock da biblioteca ESM 'jose' para compatibilidade com a suíte Jest no Node/JSDOM
jest.mock('jose', () => ({
  jwtVerify: jest.fn(),
}));

jest.mock('next/server', () => {
  const createMockCookies = (initialCookies: Record<string, string> = {}) => {
    const store = new Map<string, { name: string; value: string }>();
    Object.entries(initialCookies).forEach(([k, v]) => {
      store.set(k, { name: k, value: v });
    });

    return {
      get: (name: string) => store.get(name),
      set: (name: string, value: string) => store.set(name, { name, value }),
      delete: (name: string) => store.delete(name),
      has: (name: string) => store.has(name),
    };
  };

  return {
    NextRequest: class MockNextRequest {
      url: string;
      nextUrl: { pathname: string };
      cookies: ReturnType<typeof createMockCookies>;

      constructor(url: string, options?: any) {
        this.url = url;
        const parsedUrl = new URL(url);
        this.nextUrl = { pathname: parsedUrl.pathname };
        this.cookies = createMockCookies(options?.cookies || {});
      }
    },
    NextResponse: class MockNextResponse {
      status: number;
      headers: Map<string, string>;
      cookies = createMockCookies();

      constructor(status = 200, location?: string) {
        this.status = status;
        this.headers = new Map();
        if (location) {
          this.headers.set('location', location);
        }
      }

      static redirect(url: URL | string) {
        return new MockNextResponse(307, url.toString());
      }

      static next() {
        return new MockNextResponse(200);
      }
    },
  };
});

// Importa o middleware após registrar os mocks globais do Jest
import { middleware as proxy } from '@/middleware';

describe('Edge Security Proxy (src/proxy.ts) - Batch 3', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      ENCRYPTION_SECRET_KEY: 'secret-key-test-1234567890-32-chars',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('deve redirecionar usuário deslogado tentando acessar /formulario para /login', async () => {
    // Arrange
    const req = new NextRequest('http://localhost:3000/formulario');

    // Act
    const res = await proxy(req);

    // Assert
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/login');
  });

  it('deve permitir que usuário deslogado acesse a página de /login', async () => {
    // Arrange
    const req = new NextRequest('http://localhost:3000/login');

    // Act
    const res = await proxy(req);

    // Assert
    expect(res.status).toBe(200);
  });

  it('deve permitir navegação para rota privada se o cookie session_token estiver presente', async () => {
    // Arrange
    const req = new NextRequest('http://localhost:3000/formulario', {
      cookies: { session_token: 'valid-session-token' },
    });

    // Act
    const res = await proxy(req);

    // Assert
    expect(res.status).toBe(200);
  });

  it('deve redirecionar usuário autenticado acessando /login para /selecao', async () => {
    // Arrange
    const req = new NextRequest('http://localhost:3000/login', {
      cookies: { session_token: 'valid-session-token' },
    });

    // Act
    const res = await proxy(req);

    // Assert
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/selecao');
  });
});
