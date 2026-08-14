/**
 * @file tests/api/relatorio_pdf.spec.ts
 * @description Testes unitários para o proxy BFF de geração de relatório PDF do produtor (GET e POST /api/produtores/[produtorId]/relatorio/pdf).
 * Ref: Obsidian note [[sdd-relatorio-produtor-pdf.md]]
 */

import { GET, POST } from '@/app/api/produtores/[produtorId]/relatorio/pdf/route';
import { NextRequest } from 'next/server';

jest.mock('next/server', () => {
  return {
    NextRequest: class MockNextRequest {
      url: string;
      headers: { get: (key: string) => string | null };
      cookies: { get: (key: string) => { value: string } | undefined };
      private _body: any;

      constructor(url: string, init?: { cookies?: Record<string, string>; body?: any }) {
        this.url = url;
        this.headers = { get: () => null };
        const cookieMap = init?.cookies || {};
        this.cookies = {
          get: (key: string) => (cookieMap[key] ? { value: cookieMap[key] } : undefined),
        };
        this._body = init?.body;
      }

      async json() {
        if (typeof this._body === 'string') {
          return JSON.parse(this._body);
        }
        return this._body || {};
      }
    },
    NextResponse: class MockNextResponse {
      status: number;
      headers: Record<string, string>;
      body: any;

      constructor(body: any, init?: { status?: number; headers?: Record<string, string> }) {
        this.body = body;
        this.status = init?.status || 200;
        this.headers = init?.headers || {};
      }

      static json(body: any, init?: { status?: number; headers?: Record<string, string> }) {
        return {
          status: init?.status || 200,
          headers: init?.headers || {},
          json: async () => body,
        };
      }

      async arrayBuffer() {
        return this.body;
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

describe('BFF Proxy API - GET & POST /api/produtores/[produtorId]/relatorio/pdf', () => {
  const originalEnv = process.env;

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

  describe('GET Endpoint', () => {
    it('deve baixar PDF completo com sucesso (200 OK) repassando stream e headers', async () => {
      // Arrange
      const mockPdfBuffer = new ArrayBuffer(8);
      const mockHeaders = new Headers();
      mockHeaders.set('content-disposition', 'attachment; filename="relatorio_produtor_prod_123.pdf"');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: mockHeaders,
        arrayBuffer: async () => mockPdfBuffer,
      });

      const req = new NextRequest('http://localhost:3000/api/produtores/prod_123/relatorio/pdf', {
        cookies: { session_token: 'sessao_valida_abc' },
      });

      // Act
      const response = await GET(req, { params: Promise.resolve({ produtorId: 'prod_123' }) });

      // Assert
      expect(response.status).toBe(200);
      expect(global.fetch).toHaveBeenCalledWith(
        `${process.env.API_BASE_URL}/api/produtores/prod_123/relatorio/pdf`,
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'X-API-KEY': 'chave-teste-123',
            'Cookie': 'session_token=sessao_valida_abc',
          }),
        })
      );
      expect(response.headers['Content-Type']).toBe('application/pdf');
    });

    it('deve retornar 404 quando o produtor não possui dados para relatório', async () => {
      // Arrange
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ detail: 'Produtor não encontrado' }),
      });

      const req = new NextRequest('http://localhost:3000/api/produtores/prod_404/relatorio/pdf');

      // Act
      const response = await GET(req, { params: Promise.resolve({ produtorId: 'prod_404' }) });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.error).toContain('Esta fazenda ainda não possui dados de diagnóstico salvos');
    });

    it('deve retornar 400 se produtorId for vazio ou inválido', async () => {
      // Arrange
      const req = new NextRequest('http://localhost:3000/api/produtores//relatorio/pdf');

      // Act
      const response = await GET(req, { params: Promise.resolve({ produtorId: '' }) });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('Identificador do produtor ou fazenda é obrigatório');
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('POST Endpoint (Custom Filters)', () => {
    it('deve encaminhar filtros customizados via POST e retornar o PDF compilado (200 OK)', async () => {
      // Arrange
      const mockPdfBuffer = new ArrayBuffer(16);
      const mockHeaders = new Headers();
      mockHeaders.set('content-disposition', 'attachment; filename="relatorio_produtor_fazenda_999.pdf"');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: mockHeaders,
        arrayBuffer: async () => mockPdfBuffer,
      });

      const customFilters = {
        secao_resumo: { visao_geral: true, evidencias_raciocinios: false },
        secao_benchmarking: { ccs: true, producao_vaca: false },
      };

      const req = new NextRequest('http://localhost:3000/api/produtores/fazenda_999/relatorio/pdf', {
        cookies: { session_token: 'sessao_valida_abc' },
        body: customFilters,
      });

      // Act
      const response = await POST(req, { params: Promise.resolve({ produtorId: 'fazenda_999' }) });

      // Assert
      expect(response.status).toBe(200);
      expect(global.fetch).toHaveBeenCalledWith(
        `${process.env.API_BASE_URL}/api/produtores/fazenda_999/relatorio/pdf`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(customFilters),
          headers: expect.objectContaining({
            'X-API-KEY': 'chave-teste-123',
            'Content-Type': 'application/json',
            'Cookie': 'session_token=sessao_valida_abc',
          }),
        })
      );
      expect(response.headers['Content-Type']).toBe('application/pdf');
    });

    it('deve retornar 404 no POST quando produtor não possui dados para relatório', async () => {
      // Arrange
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ detail: 'Produtor não encontrado' }),
      });

      const req = new NextRequest('http://localhost:3000/api/produtores/prod_404/relatorio/pdf', {
        body: {},
      });

      // Act
      const response = await POST(req, { params: Promise.resolve({ produtorId: 'prod_404' }) });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data.error).toContain('Esta fazenda ainda não possui dados de diagnóstico salvos');
    });

    it('deve retornar 400 no POST se produtorId for vazio', async () => {
      // Arrange
      const req = new NextRequest('http://localhost:3000/api/produtores//relatorio/pdf', {
        body: {},
      });

      // Act
      const response = await POST(req, { params: Promise.resolve({ produtorId: '   ' }) });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('Identificador do produtor ou fazenda é obrigatório');
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
