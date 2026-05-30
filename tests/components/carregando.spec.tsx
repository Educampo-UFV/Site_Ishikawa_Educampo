/**
 * @file tests/components/carregando.spec.tsx
 * @description Testes (O Contrato) para a tela de Carregamento.
 * Garante o comportamento de polling (verificação de saúde da API), o disparo das requisições paralelas 
 * e o tratamento do estado visual da tela antes de redirecionar o usuário.
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

// Mock do Fetch
global.fetch = jest.fn();

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
    sistema_producao: "compost_barn",
    total_vacas: 100,
    percentual_lactacao: 60
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    
    (useFazendaStore as unknown as jest.Mock).mockImplementation(() => ({
      dadosFazenda: mockDadosFazenda,
      setDiagnosticoIA: mockSetDiagnosticoIA,
      setResultadoSimulacao: mockSetResultadoSimulacao,
    }));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('deve redirecionar para /formulario caso não haja dadosFazenda no estado global', () => {
    (useFazendaStore as unknown as jest.Mock).mockImplementation(() => ({
      dadosFazenda: null,
      setDiagnosticoIA: mockSetDiagnosticoIA,
      setResultadoSimulacao: mockSetResultadoSimulacao,
    }));

    render(<CarregandoPage />);
    expect(mockPush).toHaveBeenCalledWith('/formulario');
  });

  it('deve aguardar a API acordar (polling) se o status de saúde for warming_up', async () => {
    // Primeira chamada: warming_up
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ status: 'warming_up' })
    });

    render(<CarregandoPage />);

    await waitFor(() => {
      expect(screen.getByText(/Esperando API acordar/i)).toBeInTheDocument();
    });

    // Avança o tempo do setTimeout interno (3000ms) para disparar nova requisição de polling
    await act(async () => {
      jest.advanceTimersByTime(3000);
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it('deve processar a análise com chamadas paralelas (Diag, Sim, Param) quando a API estiver saudável', async () => {
    // 1. healthcheck
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ status: 'healthy' }) });
    // 2, 3, 4. /diagnostico, /simulacao, /parametros-painel
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ diag: 'ok' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ sim: 'ok' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ param: 'ok' }) });

    render(<CarregandoPage />);

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(4));
    expect(mockSetDiagnosticoIA).toHaveBeenCalledWith({ diag: 'ok' });
    expect(mockSetResultadoSimulacao).toHaveBeenCalledWith({ sim: 'ok', param: 'ok' });

    await act(async () => { 
      jest.advanceTimersByTime(1500); 
    });
    expect(mockPush).toHaveBeenCalledWith('/selecao');
  });

  it('deve aplicar backoff e eventual circuit breaker se a API retornar status 429 repetidamente', async () => {
    // Mocking de 5 chamadas consecutivas retornando status 429
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: false, status: 429 }) // tentativa 1
      .mockResolvedValueOnce({ ok: false, status: 429 }) // tentativa 2
      .mockResolvedValueOnce({ ok: false, status: 429 }) // tentativa 3
      .mockResolvedValueOnce({ ok: false, status: 429 }) // tentativa 4
      .mockResolvedValueOnce({ ok: false, status: 429 }); // tentativa 5

    render(<CarregandoPage />);

    // Tentativa 1 (exibe erro de rate limit e aguarda 3000ms)
    await waitFor(() => {
      expect(screen.getByText(/Muitas requisições/i)).toBeInTheDocument();
    });

    // Avança 3s para Tentativa 2 (espera 6000ms)
    await act(async () => {
      jest.advanceTimersByTime(3000);
    });

    // Avança 6s para Tentativa 3 (espera 12000ms)
    await act(async () => {
      jest.advanceTimersByTime(6000);
    });

    // Avança 12s para Tentativa 4 (espera 20000ms)
    await act(async () => {
      jest.advanceTimersByTime(12000);
    });

    // Avança 20s para Tentativa 5 (Circuit Breaker ativado)
    await act(async () => {
      jest.advanceTimersByTime(20000);
    });

    // Espera a mensagem de erro do Circuit Breaker
    await waitFor(() => {
      expect(screen.getByText(/Serviço temporariamente indisponível/i)).toBeInTheDocument();
    });

    // Avança os 4000ms do redirecionamento do Circuit Breaker
    await act(async () => {
      jest.advanceTimersByTime(4000);
    });

    expect(mockPush).toHaveBeenCalledWith('/formulario');
  });
});