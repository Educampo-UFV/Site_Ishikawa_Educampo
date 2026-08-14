import { POST } from '@/app/api/reload-cache/route';
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
        this.status = init?.status ?? 200;
        this.headers = init?.headers || {};
      }

      async json() {
        if (typeof this.body === 'string') {
          try {
            return JSON.parse(this.body);
          } catch {
            return this.body;
          }
        }
        return this.body;
      }

      static json(body: any, init?: { status?: number; headers?: Record<string, string> }) {
        return new MockNextResponse(body, init);
      }
    },
  };
});

describe('BFF Route: POST /api/reload-cache', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      API_BASE_URL: 'http://localhost:8000',
      API_KEY: '42',
    };
    global.fetch = jest.fn();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('deve repassar a chamada para a API Python com os cabeçalhos de segurança X-API-KEY e retornar 200', async () => {
    // Arrange
    const mockSuccessResponse = { message: 'Cache de regras e benchmarks recarregado com sucesso.' };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValueOnce(mockSuccessResponse),
    });

    const request = new NextRequest('http://localhost:3000/api/reload-cache');

    // Act
    const response = await POST(request);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(body).toEqual(mockSuccessResponse);
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/reload-cache',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'X-API-KEY': '42',
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  it('deve retornar erro 500 se a API backend falhar com erro 500', async () => {
    // Arrange
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: jest.fn().mockResolvedValueOnce({ detail: 'Falha ao ler arquivos YAML' }),
    });

    const request = new NextRequest('http://localhost:3000/api/reload-cache');

    // Act
    const response = await POST(request);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(500);
    expect(body.error).toBe('Falha ao ler arquivos YAML');
  });

  it('deve retornar status 504 em caso de timeout na chamada externa', async () => {
    // Arrange
    const abortError = new Error('AbortError');
    abortError.name = 'AbortError';
    (global.fetch as jest.Mock).mockRejectedValueOnce(abortError);

    const request = new NextRequest('http://localhost:3000/api/reload-cache');

    // Act
    const response = await POST(request);
    const body = await response.json();

    // Assert
    expect(response.status).toBe(504);
    expect(body.error).toBe('Tempo limite excedido ao solicitar recarregamento de cache.');
  });
});
