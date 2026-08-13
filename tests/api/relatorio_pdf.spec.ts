/**
 * @file tests/api/relatorio_pdf.spec.ts
 * @description Testes unitários para o proxy BFF de geração de relatório PDF do produtor (GET /api/produtores/[produtorId]/relatorio/pdf).
 * Ref: Obsidian note [[sdd-relatorio-produtor-pdf.md]]
 */

import { GET } from '@/app/api/produtores/[produtorId]/relatorio/pdf/route';
import { NextRequest } from 'next/server';

jest.mock('next/server', () => {
  return {
    NextRequest: class MockNextRequest {
      url: string;
      headers: { get: (key: string) => string | null };
      cookies: { get: (key: string) => { value: string } | undefined };

      constructor(url: string, init?: { cookies?: Record<string, string> }) {
        this.url = url;
        this.headers = { get: () => null };
        const cookieMap = init?.cookies || {};
        this.cookies = {
          get: (key: string) => (cookieMap[key] ? { value: cookieMap[key] } : undefined),
        };
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

describe('BFF Proxy API - GET /api/produtores/[produtorId]/relatorio/pdf', () => {
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

  it('deve baixar PDF com sucesso (200 OK) repassando stream e headers corretos', async () => {
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

  it('deve retornar 404 quando o produtor/fazenda não possui diagnósticos/simulações', async () => {
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
