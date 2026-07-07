/**
 * @file bff.spec.ts
 * @description Suíte de testes (O Contrato) para a rota Backend-For-Frontend (BFF) de diagnóstico.
 * Garante a correta comunicação com a API em Python, o tratamento do payload,
 * a tolerância a falhas (resiliência) e o desvio condicional de criptografia futura.
 */

import { POST } from '@/app/api/diagnostico/route';
import { NextRequest } from 'next/server';

// Realiza o mock do next/server para evitar o erro "ReferenceError: Request is not defined"
// no ambiente do JSDOM, assim como feito na suíte de testes de autenticação.
jest.mock('next/server', () => {
  return {
    NextRequest: class MockNextRequest {
      url: string;
      _body: any;
      constructor(url: string, options?: any) {
        this.url = url;
        this._body = options?.body ? JSON.parse(options.body) : null;
      }
      async json() {
        return this._body;
      }
    },
    NextResponse: class MockNextResponse {
      static json(body: any, init?: { status?: number }) {
        return {
          status: init?.status || 200,
          json: async () => body,
        };
      }
    },
  };
});

// Mock global da função fetch para evitar chamadas reais à rede durante os testes
global.fetch = jest.fn();

describe('BFF Proxy API - POST /api/diagnostico', () => {
  const originalEnv = process.env;

  beforeAll(() => {
    // Suprime os logs esperados de erro e avisos no terminal para manter a saída de testes limpa
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Restaura as variáveis de ambiente antes de cada teste
    process.env = { ...originalEnv };
    process.env.API_BASE_URL = 'https://api-fake-educampo.com';
    process.env.API_TOKEN = 'token-fake-123';
  });

  afterAll(() => {
    jest.restoreAllMocks();
    process.env = originalEnv;
  });

  /**
   * Mock de um payload válido enviado pelo frontend (Zustand).
   */
  const mockValidPayload = {
    nome_fazenda: 'Fazenda Leiteira Experimental',
    sistema_producao: 'compost-barn',
    total_vacas: 100,
    percentual_lactacao: 85,
    animais_rebanho: 120,
    area_atividade: 10.0,
    mao_obra_total: 2,
    producao_vaca: 35.0,
    preco_leite: 3.20,
    preco_referencia: 2.50,
    preco_concentrado: 2.30,
    ccs: 150,
    regiao: 'triangulo',
  };

  /**
   * Mock da resposta de sucesso assíncrona esperada da API em Python (POST).
   */
  const mockApiPostResponse = {
    task_id: "fake-task-1234",
    status: "processing"
  };

  it('deve repassar o payload para a API real e retornar 202 Accepted com task_id', async () => {
    /**
     * @description Verifica o "Caminho Feliz" no novo padrão Long Polling. 
     * A requisição chega, é validada, encaminhada para a API externa (fila)
     * e o task_id é devolvido ao cliente.
     */
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 202,
      headers: { get: jest.fn() },
      json: async () => mockApiPostResponse,
    });

    const req = new NextRequest('http://localhost:3000/api/diagnostico', {
      method: 'POST',
      body: JSON.stringify(mockValidPayload),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(202);
    expect(global.fetch).toHaveBeenCalledWith(
      `${process.env.API_BASE_URL}/api/diagnostico`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.API_TOKEN}`,
          'X-API-KEY': process.env.API_TOKEN
        })
      })
    );
    expect(data).toHaveProperty('task_id', 'fake-task-1234');
    expect(data).toHaveProperty('status', 'processing');
  });

  it('deve simular o desvio de fluxo quando ENABLE_PAYLOAD_ENCRYPTION estiver ativo', async () => {
    /** Security by Design.
     * Quando o interruptor estiver ligado, o comportamento interno de envio deve ser diferente
     * (preparando o terreno para a futura criptografia AES).
     */
    process.env.ENABLE_PAYLOAD_ENCRYPTION = 'true';

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 202,
      headers: { get: jest.fn() },
      json: async () => mockApiPostResponse,
    });

    const req = new NextRequest('http://localhost:3000/api/diagnostico', {
      method: 'POST',
      body: JSON.stringify(mockValidPayload),
    });

    const response = await POST(req);
    
    // O teste garante que o código passou com sucesso mesmo com a flag ativa.
    expect(response.status).toBe(202);
    expect(global.fetch).toHaveBeenCalled();
  });

  it('deve retornar erro 504 se a API externa demorar muito para responder (Timeout)', async () => {
    /**
     * @description Teste de resiliência. Simula o AbortError disparado pelo
     * AbortController quando o timeout de 30 segundos da requisição é atingido.
     */
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    
    (global.fetch as jest.Mock).mockRejectedValueOnce(abortError);

    const req = new NextRequest('http://localhost:3000/api/diagnostico', {
      method: 'POST',
      body: JSON.stringify(mockValidPayload),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(504);
    expect(data.error).toBe('A API de diagnóstico demorou muito para responder. Tente novamente mais tarde.');
  });

  it('deve retornar erro 502 (Bad Gateway) se a API externa do Educampo falhar', async () => {
    /**
     * @description Teste de resiliência. Se a API em Python estiver fora do ar ou
     * retornar erro, nosso BFF não deve quebrar, mas sim devolver um erro tratado (502).
     */
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const req = new NextRequest('http://localhost:3000/api/diagnostico', {
      method: 'POST',
      body: JSON.stringify(mockValidPayload),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(502);
    expect(data.error).toBe('Falha ao comunicar com a API de Diagnóstico.');
  });

  it('deve retornar erro 403 se a API externa recusar a autenticação', async () => {
    /**
     * @description Teste de repasse de falha de segurança. Se o token for inválido,
     * o BFF deve retornar um 403 claro em vez de mascarar como 502.
     */
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 403,
    });

    const req = new NextRequest('http://localhost:3000/api/diagnostico', {
      method: 'POST',
      body: JSON.stringify(mockValidPayload),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Falha de autenticação ao comunicar com a inteligência.');
  });

  it('deve bloquear a requisição com erro 400 se o payload estiver malformado', async () => {
    /**
     * @description Teste de blindagem do servidor. Se faltarem dados essenciais,
     * o BFF barra a requisição antes de gastar recursos chamando a API externa.
     */
    const invalidPayload = { ccs: 250000 }; // Faltam vários campos obrigatórios

    const req = new NextRequest('http://localhost:3000/api/diagnostico', {
      method: 'POST',
      body: JSON.stringify(invalidPayload),
    });

    const response = await POST(req);
    
    expect(response.status).toBe(400);
    // Garante que o fetch para a API em Python NUNCA foi chamado para dados inválidos
    expect(global.fetch).not.toHaveBeenCalled(); 
  });
});