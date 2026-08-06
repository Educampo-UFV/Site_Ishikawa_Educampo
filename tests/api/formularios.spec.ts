/**
 * @file tests/api/formularios.spec.ts
 * @description Suíte de testes para a rota Proxy BFF de Formulários (/api/formularios).
 * Testa a injeção do cabeçalho X-API-KEY, repasse de requisição para o backend FastAPI e tratamento de erros.
 */

import { GET } from '@/app/api/formularios/route';
import { NextRequest } from 'next/server';

jest.mock('next/server', () => {
  return {
    NextRequest: class MockNextRequest {
      url: string;
      nextUrl: { searchParams: URLSearchParams };
      headers: { get: (key: string) => string | null };
      ip?: string;
      
      constructor(url: string) {
        this.url = url;
        const parsedUrl = new URL(url);
        this.nextUrl = { searchParams: parsedUrl.searchParams };
        this.headers = { get: () => null };
        this.ip = '127.0.0.1';
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

describe('BFF Proxy API - GET /api/formularios', () => {
  const originalEnv = process.env;

  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.API_BASE_URL = 'https://api-fake-educampo.com';
    process.env.API_TOKEN = 'token-fake-123';
  });

  afterAll(() => {
    jest.restoreAllMocks();
    process.env = originalEnv;
  });

  it('deve retornar as opções de formulário quando nenhum nome for fornecido na query', async () => {
    // Arrange
    const mockOpcoes = {
      sistemas_producao: ['compost-barn', 'pastoreio'],
      regioes_sebrae: ['Norte', 'Sul'],
      fazendas_cadastradas: ['Fazenda 1', 'Fazenda 2']
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockOpcoes,
    });

    const req = new NextRequest('http://localhost:3000/api/formularios');

    // Act
    const response = await GET(req);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(
      `${process.env.API_BASE_URL}/api/formularios`,
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'X-API-KEY': process.env.API_TOKEN
        })
      })
    );
    expect(data).toEqual(mockOpcoes);
  });

  it('deve retornar os dados detalhados da fazenda quando o nome for fornecido na query', async () => {
    // Arrange
    const mockFazenda = {
      nome: 'Fazenda Leiteira Experimental 1',
      dados: {
        sistema_producao: 'compost-barn',
        regiao_sebrae: 'Zona da Mata',
        total_vacas: 150
      }
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockFazenda,
    });

    const req = new NextRequest('http://localhost:3000/api/formularios?nome=Fazenda%20Leiteira%20Experimental%201');

    // Act
    const response = await GET(req);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(
      `${process.env.API_BASE_URL}/api/formularios?nome=Fazenda%20Leiteira%20Experimental%201`,
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'X-API-KEY': process.env.API_TOKEN
        })
      })
    );
    expect(data).toEqual(mockFazenda);
  });

  it('deve retornar erro 500 se as variáveis de ambiente API_BASE_URL ou API_TOKEN estiverem ausentes', async () => {
    // Arrange
    delete process.env.API_BASE_URL;
    delete process.env.API_TOKEN;
    const req = new NextRequest('http://localhost:3000/api/formularios');

    // Act
    const response = await GET(req);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(data).toHaveProperty('error', 'Configurações da API não encontradas no servidor');
  });

  it('deve retornar erro 500 se o backend FastAPI falhar com erro HTTP', async () => {
    // Arrange
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    const req = new NextRequest('http://localhost:3000/api/formularios');

    // Act
    const response = await GET(req);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(data).toHaveProperty('error', 'Falha ao buscar opções de formulários');
  });
});
