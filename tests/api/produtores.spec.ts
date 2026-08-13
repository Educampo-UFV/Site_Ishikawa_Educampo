/**
 * @file tests/api/produtores.spec.ts
 * @description Suíte de testes TDD para a rota BFF POST /api/produtores.
 * Ref: Obsidian note [[sdd-cadastrar-fazenda.md]]
 */

import { POST } from '@/app/api/produtores/route';
import { NextRequest } from 'next/server';

jest.mock('next/server', () => {
  return {
    NextRequest: class MockNextRequest {
      url: string;
      headers: { get: (key: string) => string | null };
      cookies: { get: (key: string) => { value: string } | undefined };
      body: any;

      constructor(url: string, init?: { body?: any; cookies?: Record<string, string> }) {
        this.url = url;
        this.headers = { get: () => null };
        this.body = init?.body || {};
        const cookieMap = init?.cookies || {};
        this.cookies = {
          get: (key: string) => (cookieMap[key] ? { value: cookieMap[key] } : undefined),
        };
      }

      async json() {
        return this.body;
      }
    },
    NextResponse: class MockNextResponse {
      static json(body: any, init?: { status?: number; headers?: Headers }) {
        return {
          status: init?.status || 200,
          headers: init?.headers,
          json: async () => body,
        };
      }
    },
  };
});

global.fetch = jest.fn();

if (!AbortSignal.timeout) {
  AbortSignal.timeout = (ms: number) => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), ms);
    return controller.signal;
  };
}

describe('BFF Proxy API - POST /api/produtores', () => {
  const originalEnv = process.env;

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

  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.API_BASE_URL = 'https://api-fake-educampo.com';
    process.env.API_KEY = 'chave-teste-123';
  });

  afterAll(() => {
    jest.restoreAllMocks();
    process.env = originalEnv;
  });

  it('deve cadastrar novo produtor com sucesso (201 Created)', async () => {
    // Arrange
    const backendSuccessResponse = {
      id: 'prod_999',
      email: 'novo.produtor@fazenda.com.br',
      nome_fazenda: 'Fazenda Santa Maria',
      message: 'Produtor cadastrado com sucesso',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => backendSuccessResponse,
    });

    const req = new NextRequest('http://localhost:3000/api/produtores', {
      body: validPayload,
      cookies: { session_token: 'sessao_valida_abc' },
    });

    // Act
    const response = await POST(req);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(201);
    expect(global.fetch).toHaveBeenCalledWith(
      `${process.env.API_BASE_URL}/api/produtores`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'X-API-KEY': 'chave-teste-123',
          'Cookie': 'session_token=sessao_valida_abc',
        }),
      })
    );
    expect(data).toEqual(backendSuccessResponse);
  });

  it('deve repassar erro 409 Conflict em caso de e-mail duplicado no backend', async () => {
    // Arrange
    const backendConflictResponse = {
      error_code: 'DUPLICATE_EMAIL',
      message: 'O e-mail consultor@educampo.com já está cadastrado no sistema.',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => backendConflictResponse,
    });

    const req = new NextRequest('http://localhost:3000/api/produtores', {
      body: { ...validPayload, email: 'consultor@educampo.com' },
    });

    // Act
    const response = await POST(req);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(409);
    expect(data).toEqual(backendConflictResponse);
  });

  it('deve rejeitar requisição com status 400 em caso de payload com schema inválido', async () => {
    // Arrange
    const invalidPayload = {
      ...validPayload,
      senha: '123', // Senha com menos de 6 caracteres
    };

    const req = new NextRequest('http://localhost:3000/api/produtores', {
      body: invalidPayload,
    });

    // Act
    const response = await POST(req);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(data.error).toBe('Dados de cadastro inválidos');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('deve retornar status 500 se as variáveis de ambiente do backend estiverem ausentes', async () => {
    // Arrange
    delete process.env.API_BASE_URL;
    delete process.env.API_KEY;

    const req = new NextRequest('http://localhost:3000/api/produtores', {
      body: validPayload,
    });

    // Act
    const response = await POST(req);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(data.error).toBe('Configurações da API não encontradas no servidor');
  });
});
