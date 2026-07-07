/**
 * @file tests/components/carregando.spec.tsx
 * @description Testes (O Contrato) para a tela de Carregamento.
 * 
 * ARQUITETURA ATUALIZADA (Verificação Centralizada no Login):
 * A verificação de saúde da API (Ping → Health Check) agora é feita integralmente na tela de Login.
 * Esta tela consome o flag `apiHealthy` do Zustand e vai direto para o processamento paralelo
 * das 3 requisições (Diagnóstico, Simulação, Parâmetros) via `fetchComResiliencia`.
 * 
 * Os testes validam:
 * 1. Redirecionamento quando não há dados no estado global.
 * 2. Processamento direto com 3 chamadas paralelas (sem health check prévio).
 * 3. Comportamento de fallback quando as APIs de processamento falham.
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import CarregandoPage from '../../src/app/carregando/page';
import { useFazendaStore } from '../../src/store/useFazendaStore';
import { useRouter } from 'next/navigation';

// Mock do next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock do Zustand
jest.mock('../../src/store/useFazendaStore', () => ({
  useFazendaStore: jest.fn(),
}));

/**
 * Mock do fetchComResiliencia.
 * Como este wrapper já encapsula retry/backoff internamente, mockamos ele diretamente
 * para testar o comportamento da tela (e não a lógica de retry, que é testada separadamente).
 */
const mockFetchComResiliencia = jest.fn();
jest.mock('../../src/lib/apiUtils', () => ({
  fetchComResiliencia: (...args: any[]) => mockFetchComResiliencia(...args),
}));

describe('Tela de Carregamento (CarregandoPage)', () => {
  const mockPush = jest.fn();
  const mockSetDiagnosticoIA = jest.fn();
  const mockSetResultadoSimulacao = jest.fn();

  const mockDadosFazenda = {
    area_atividade: 10,
    ccs: 150,
    preco_concentrado: 1.81,
    mao_obra_total: 2,
    preco_leite: 3.2,
    producao_vaca: 25,
    regiao: "triangulo",
    sistema_producao: "compost-barn",
    total_vacas: 100,
    percentual_lactacao: 60
  };

  let consoleInfoSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    // Suprime logs no console durante os testes
    consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    
    (useFazendaStore as unknown as jest.Mock).mockImplementation(() => ({
      dadosFazenda: mockDadosFazenda,
      setDiagnosticoIA: mockSetDiagnosticoIA,
      setResultadoSimulacao: mockSetResultadoSimulacao,
      apiHealthy: true, // Flag confirmado no login (cenário padrão)
    }));
  });

  afterEach(() => {
    jest.useRealTimers();
    consoleInfoSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('deve redirecionar para /formulario caso não haja dadosFazenda no estado global', () => {
    (useFazendaStore as unknown as jest.Mock).mockImplementation(() => ({
      dadosFazenda: null,
      setDiagnosticoIA: mockSetDiagnosticoIA,
      setResultadoSimulacao: mockSetResultadoSimulacao,
      apiHealthy: false,
    }));

    render(<CarregandoPage />);
    expect(mockPush).toHaveBeenCalledWith('/formulario');
  });

  it('deve ir direto para processarAnalise() e suportar o polling de diagnóstico', async () => {
    mockFetchComResiliencia.mockImplementation(async (url: string) => {
      if (url === "/api/diagnostico") return { ok: true, json: async () => ({ task_id: "fake-123" }) };
      if (url.includes("/status/")) return { ok: true, json: async () => ({ status: "completed", result: { diag: "ok" } }) };
      if (url === "/api/simulacao") return { ok: true, json: async () => ({ sim: "ok" }) };
      if (url === "/api/parametros-painel") return { ok: true, json: async () => ({ param: "ok" }) };
      return { ok: true };
    });

    render(<CarregandoPage />);

    // Força o event loop a esvaziar a fila de microtasks das primeiras chamadas
    await act(async () => {
      for (let i = 0; i < 5; i++) await Promise.resolve();
    });

    // Agora o setTimeout de 3s já foi chamado. Avançamos o tempo para resolvê-lo.
    await act(async () => {
      jest.advanceTimersByTime(3500);
      for (let i = 0; i < 5; i++) await Promise.resolve();
    });

    // Valida que 4 chamadas foram feitas (POST diag, GET status, POST sim, POST param)
    await waitFor(() => expect(mockFetchComResiliencia).toHaveBeenCalledTimes(4));

    // Valida que os resultados foram injetados no Zustand
    expect(mockSetDiagnosticoIA).toHaveBeenCalledWith({ diag: 'ok' });
    expect(mockSetResultadoSimulacao).toHaveBeenCalledWith({ sim: 'ok', param: 'ok' });

    // Avança o delay de 1500ms antes do redirecionamento para /selecao
    await act(async () => { 
      jest.advanceTimersByTime(1500); 
    });
    expect(mockPush).toHaveBeenCalledWith('/selecao');
  });

  it('deve exibir mensagem de erro e redirecionar para /formulario quando as APIs de processamento falham', async () => {
    // Cenário: O fetchComResiliencia esgotou seus retries internos e propagou o erro.
    mockFetchComResiliencia.mockRejectedValue(new Error('Falha transitória do servidor (Status: 502)'));

    await act(async () => {
      render(<CarregandoPage />);
    });

    // Aguarda o processamento falhar e exibir a mensagem de erro
    await waitFor(() => {
      expect(screen.getByText(/Ocorreu um erro ao processar os dados/i)).toBeInTheDocument();
    });

    // Avança os 3000ms do redirecionamento de fallback
    await act(async () => {
      jest.advanceTimersByTime(3000);
    });

    expect(mockPush).toHaveBeenCalledWith('/formulario');
  });

  it('deve exibir mensagem de erro quando as respostas das APIs retornam ok=false', async () => {
    // Cenário: As APIs responderam mas com status de erro (ex: 400, 422)
    mockFetchComResiliencia.mockImplementation(async (url: string) => {
      if (url === "/api/diagnostico") return { ok: false, status: 400 };
      if (url === "/api/simulacao") return { ok: true, json: async () => ({ sim: "ok" }) };
      if (url === "/api/parametros-painel") return { ok: true, json: async () => ({ param: "ok" }) };
      return { ok: true };
    });

    render(<CarregandoPage />);

    // O throw "Falha ao iniciar o processamento do diagnóstico" é capturado
    await waitFor(() => {
      expect(screen.getByText(/Ocorreu um erro ao processar os dados/i)).toBeInTheDocument();
    });

    await act(async () => {
      jest.advanceTimersByTime(3000);
    });

    expect(mockPush).toHaveBeenCalledWith('/formulario');
  });
});