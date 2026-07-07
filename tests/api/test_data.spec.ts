/**
 * @file tests/api/test_data.spec.ts
 * @description Suíte de testes para a rota Proxy BFF de Fazendas de Teste.
 * Garante que a rota injeta o X-API-KEY e repassa as requisições para o backend.
 */

import { GET } from '@/app/api/test-data/route';
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
        this.headers = { get: (key) => null };
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

// Polyfill para AbortSignal.timeout caso o JSDOM não suporte
if (!AbortSignal.timeout) {
  AbortSignal.timeout = (ms: number) => {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), ms);
    return controller.signal;
  };
}

describe('BFF Proxy API - GET /api/test-data', () => {
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

  it('deve retornar a lista de fazendas quando nenhum nome for fornecido na query', async () => {
    const mockFarmsList = [
      { nome: 'Fazenda Recanto', sistema_producao: 'compost-barn' },
      { nome: 'Fazenda Esperança', sistema_producao: 'confinado-sem-estrutura' }
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockFarmsList,
    });

    const req = new NextRequest('http://localhost:3000/api/test-data');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(
      `${process.env.API_BASE_URL}/api/test-data/farms`,
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'X-API-KEY': process.env.API_TOKEN
        })
      })
    );
    expect(data).toEqual(mockFarmsList);
  });

  it('deve retornar os dados completos da fazenda quando o nome for fornecido na query', async () => {
    const mockFarmData = {
      nome_fazenda: 'Fazenda Recanto',
      sistema_producao: 'compost-barn',
      total_vacas: 200
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockFarmData,
    });

    const req = new NextRequest('http://localhost:3000/api/test-data?nome=Fazenda%20Recanto');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(
      `${process.env.API_BASE_URL}/api/test-data/farms/Fazenda%20Recanto`,
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'X-API-KEY': process.env.API_TOKEN
        })
      })
    );
    expect(data).toEqual(mockFarmData);
  });

  it('deve retornar erro 500 se o backend FastAPI falhar', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    const req = new NextRequest('http://localhost:3000/api/test-data');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toHaveProperty('error', 'Falha ao buscar dados de teste');
  });
});
