/**
 * @file status_bff.spec.ts
 * @description Suíte de testes para a rota Backend-For-Frontend (BFF) de status do diagnóstico.
 * Garante o correto polling e o repasse dos cabeçalhos de custo/tokens e nó telemetry.
 */

import { GET } from '@/app/api/diagnostico/status/[task_id]/route';
import { NextRequest } from 'next/server';

jest.mock('next/server', () => {
  return {
    NextRequest: class MockNextRequest {
      url: string;
      constructor(url: string) {
        this.url = url;
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

describe('BFF Proxy API - GET /api/diagnostico/status/[task_id]', () => {
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

  it('deve repassar a requisição e retornar o status processing', async () => {
    // Arrange
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => ({ status: 'processing' }),
    });

    const req = new NextRequest('http://localhost:3000/api/diagnostico/status/123');

    // Act
    const response = await GET(req, { params: Promise.resolve({ task_id: '123' }) });
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(global.fetch).toHaveBeenCalledWith(
      `${process.env.API_BASE_URL}/api/diagnostico/status/123`,
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Authorization': `Bearer ${process.env.API_TOKEN}`,
          'X-API-KEY': process.env.API_TOKEN
        })
      })
    );
    expect(data).toHaveProperty('status', 'processing');
  });

  it('deve repassar a requisição e retornar o status completed com o nó telemetry e ia_metrics', async () => {
    // Arrange
    const mockHeaders = new Headers();
    mockHeaders.set('X-IA-Tokens', '1500');
    mockHeaders.set('X-IA-Reasoning-Tokens', '300');
    mockHeaders.set('X-IA-Custo-Dolar', '0.02');
    mockHeaders.set('X-IA-Provider', 'openai/gpt-4o');

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: mockHeaders,
      json: async () => ({ status: 'completed', result: { test: 'ok' } }),
    });

    const req = new NextRequest('http://localhost:3000/api/diagnostico/status/123');

    // Act
    const response = await GET(req, { params: Promise.resolve({ task_id: '123' }) });
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('status', 'completed');
    expect(data).toHaveProperty('result');
    expect(data).toHaveProperty('telemetry');
    expect(data.telemetry).toEqual({
      tokens: 1500,
      reasoningTokens: 300,
      costUsd: 0.02,
      provider: 'openai/gpt-4o'
    });
    expect(data.ia_metrics).toHaveProperty('tokens', '1500');
  });
});
