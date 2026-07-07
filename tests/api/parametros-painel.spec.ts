/**
 * @file tests/api/parametros-painel.spec.ts
 * @description Contrato de testes para o Proxy BFF do endpoint de Parâmetros do Painel.
 * Garante o repasse correto do payload de ancoragem e o retorno dos limites dos sliders.
 */

import { POST } from '@/app/api/parametros-painel/route';
import { NextRequest } from 'next/server';

// Mock do next/server
jest.mock('next/server', () => ({
  NextRequest: class MockNextRequest {
    url: string;
    _body: any;
    constructor(url: string, options?: any) {
      this.url = url;
      this._body = options?.body ? JSON.parse(options.body) : null;
    }
    async json() { return this._body; }
  },
  NextResponse: class MockNextResponse {
    static json(body: any, init?: { status?: number }) {
      return { status: init?.status || 200, json: async () => body };
    }
  },
}));

global.fetch = jest.fn();

describe('BFF Route: POST /api/parametros-painel', () => {
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

  it('deve repassar o payload e retornar os limites dos sliders (status 200)', async () => {
    const mockLimitsResponse = {
      parametros_painel: {
        producao_vaca: { intermediario: { min: 10, max: 50, step: 0.5, fronteiras_cenario: null } }
      }
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockLimitsResponse,
    });

    const payload = { producao_vaca: 25, sistema_producao: "compost-barn", percentual_lactacao: 60, total_vacas: 100 };
    const req = new NextRequest('http://localhost:3000/api/parametros-painel', { method: 'POST', body: JSON.stringify(payload) });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockLimitsResponse);
  });

  it('deve retornar 500 se houver erro interno de rede na chamada para a API externa', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network failed'));
    const req = new NextRequest('http://localhost:3000/api/parametros-painel', { method: 'POST', body: JSON.stringify({}) });
    const response = await POST(req);
    expect(response.status).toBe(500);
  });

  it('deve retornar 500 se as variáveis de ambiente estiverem ausentes', async () => {
    delete process.env.API_BASE_URL;
    const req = new NextRequest('http://localhost:3000/api/parametros-painel', { method: 'POST', body: JSON.stringify({}) });
    const response = await POST(req);
    expect(response.status).toBe(500);
  });
});