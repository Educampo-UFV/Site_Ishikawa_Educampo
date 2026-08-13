/**
 * @file tests/components/ajustes.spec.tsx
 * @description Contrato de testes robusto para a Tela de Ajustes.
 * Resolve erros de validação Zod e garante o funcionamento do cooldown.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import AjustesPage from '../../src/app/ajustes/page'; // Caminho relativo direto
import { useFazendaStore } from '../../src/store/useFazendaStore';

// Mock do Zustand
jest.mock('../../src/store/useFazendaStore', () => ({
  useFazendaStore: jest.fn(),
}));

// Mock da Navbar
jest.mock('../../src/components/ui/Navbar', () => {
  return {
    Navbar: function MockNavbar() { return <div data-testid="navbar-mock">Navbar</div>; }
  };
});

// Mock do next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

// Mock do fetch global
global.fetch = jest.fn();

// Mock do alert (JSDOM não implementa alert por padrão)
window.alert = jest.fn();

describe('Tela de Ajustes (AjustesPage)', () => {
  // Mock COMPLETO para satisfazer o fazendaSchema (Zod)
  const mockDadosFazendaCompleto = {
    nome_fazenda: 'Fazenda Teste',
    sistema_producao: 'compost-barn',
    total_vacas: 100,
    percentual_lactacao: 85,
    animais_rebanho: 120,    // Campo obrigatório
    area_atividade: 10.0,
    mao_obra_total: 2,       // Campo obrigatório
    producao_vaca: 35.0,
    preco_leite: 3.20,
    preco_referencia: 2.80,  // Campo obrigatório
    preco_concentrado: 2.30,
    ccs: 150,
    regiao: 'triangulo',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    // Suporte para useFazendaStore() e useFazendaStore(s => s.x)
    (useFazendaStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = {
        dadosFazenda: mockDadosFazendaCompleto,
        setDadosFazenda: jest.fn(),
        setDiagnosticoIA: jest.fn(),
      };
      return selector ? selector(state) : state;
    });

    // Mock padrão para fetch cobrindo a busca inicial de formulários
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (String(url).includes('/api/formularios')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            sistemas_producao: ['compost-barn', 'semiconfinado', 'confinado-sem-estrutura'],
            regioes_sebrae: ['triangulo', 'sul'],
          }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('Deve renderizar o formulário pré-preenchido com os dados do Zustand', () => {
    render(<AjustesPage />);
    expect(screen.getByLabelText(/Nome da Fazenda/i)).toHaveValue('Fazenda Teste');
    expect(screen.getByLabelText(/Total de Vacas/i)).toHaveValue('100');
  });

  it('Deve ativar o cooldown de 30 segundos após submissão com sucesso', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      const urlStr = String(url);
      if (urlStr.includes('/api/formularios')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            sistemas_producao: ['compost-barn', 'semiconfinado', 'confinado-sem-estrutura'],
            regioes_sebrae: ['triangulo'],
          }),
        });
      }
      if (urlStr.includes('/api/diagnostico/status/')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ status: 'completed', result: { diagnostico: 'ok' } }),
        });
      }
      if (urlStr.includes('/api/diagnostico')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ task_id: 'task-123', status: 'processing' }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(<AjustesPage />);
    const botaoSubmit = screen.getByRole('button', { name: /Atualizar Dados/i });

    await act(async () => {
      fireEvent.click(botaoSubmit);
    });

    // Avança o timer do polling (setTimeout 2000ms) para concluir o ciclo de verificação
    for (let i = 0; i < 5; i++) {
      await act(async () => {
        jest.advanceTimersByTime(2000);
      });
    }

    expect(botaoSubmit).toBeDisabled();
    expect(botaoSubmit).toHaveTextContent(/Aguarde \d+s/i);

    for (let i = 0; i < 12; i++) {
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
    }
    expect(botaoSubmit).not.toBeDisabled();
    expect(botaoSubmit).toHaveTextContent('Atualizar Dados');
  });

  it('Deve exibir a mensagem dinâmica e a barra de progresso durante o polling na submissão de ajustes', async () => {
    let pollingCount = 0;
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      const urlStr = String(url);
      if (urlStr.includes('/api/formularios')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            sistemas_producao: ['compost-barn', 'semiconfinado'],
            regioes_sebrae: ['triangulo'],
          }),
        });
      }
      if (urlStr.includes('/api/diagnostico/status/')) {
        pollingCount++;
        if (pollingCount === 1) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              status: 'processing',
              message: 'Analises em andamento [1/4]',
              progress: { done: 1, total: 4 }
            }),
          });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ status: 'completed', result: { diagnostico: 'ok' } }),
        });
      }
      if (urlStr.includes('/api/diagnostico')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ task_id: 'task-123', status: 'processing' }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(<AjustesPage />);
    const botaoSubmit = screen.getByRole('button', { name: /Atualizar Dados/i });

    await act(async () => {
      fireEvent.click(botaoSubmit);
    });

    // 1º tick de polling
    await act(async () => {
      jest.advanceTimersByTime(3500);
    });

    // Verifica se a mensagem dinâmica e o progresso aparecem na UI
    expect(screen.getByText(/Analises em andamento \[1\/4\]/i)).toBeInTheDocument();
    expect(screen.getByText(/1 de 4 análises concluídas/i)).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '25');
  });
});