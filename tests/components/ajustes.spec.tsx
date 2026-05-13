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
    sistema_producao: 'compost_barn',
    total_vacas: 100,
    vacas_lactacao: 85,
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
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('Deve renderizar o formulário pré-preenchido com os dados do Zustand', () => {
    render(<AjustesPage />);
    expect(screen.getByLabelText(/Nome da Fazenda/i)).toHaveValue('Fazenda Teste');
    expect(screen.getByLabelText(/Total de Vacas/i)).toHaveValue(100);
  });

  it('Deve ativar o cooldown de 30 segundos após submissão com sucesso', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ resultado: 'sucesso' }),
    });

    render(<AjustesPage />);
    const botaoSubmit = screen.getByRole('button', { name: /Atualizar Dados/i });

    await act(async () => {
      fireEvent.click(botaoSubmit);
    });

    // Agora o fetch será chamado porque os dados do mock passam na validação Zod
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    expect(botaoSubmit).toBeDisabled();
    expect(botaoSubmit).toHaveTextContent(/Aguarde 12s/i);

    for (let i = 0; i < 12; i++) {
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
    }
    expect(botaoSubmit).not.toBeDisabled();
    expect(botaoSubmit).toHaveTextContent('Atualizar Dados');
  });
});