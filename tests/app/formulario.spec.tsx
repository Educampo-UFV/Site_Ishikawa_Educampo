/**
 * @file tests/app/formulario.spec.tsx
 * @description Suíte de testes para o componente FormularioPage.
 * Garante o consumo de opções dinâmicas, inicialização de diagnóstico e resiliência/retry em falhas de API.
 * Ref: Obsidian note [[sdd-promover-rota-formularios-frontend]]
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FormularioPage from '@/app/formulario/page';

jest.setTimeout(15000);

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} alt={props.alt || ''} />,
}));

const mockSetDadosFazenda = jest.fn();
jest.mock('@/store/useFazendaStore', () => ({
  useFazendaStore: (selector: any) => selector({
    setDadosFazenda: mockSetDadosFazenda,
  }),
}));

global.fetch = jest.fn();

describe('FormularioPage - Dynamic Options & Diagnosis Integration', () => {
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('deve carregar opções dinâmicas da API /api/formularios e popular a lista na montagem', async () => {
    // Arrange
    const mockOpcoes = {
      sistemas_producao: ['compost-barn', 'pastoreio'],
      regioes_sebrae: ['Zona da Mata', 'Sul'],
      fazendas_cadastradas: ['Fazenda Experimental 1', 'Fazenda Modelo 2']
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockOpcoes,
    });

    // Act
    render(<FormularioPage />);

    // Assert
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/formularios');
    }, { timeout: 4000 });

    await waitFor(() => {
      expect(screen.getByText('Fazenda Experimental 1')).toBeInTheDocument();
      expect(screen.getByText('Fazenda Modelo 2')).toBeInTheDocument();
    }, { timeout: 4000 });
  });

  it('deve disparar diagnóstico direto ao clicar em "Iniciar Diagnóstico" em uma fazenda cadastrada', async () => {
    // Arrange
    const mockOpcoes = {
      sistemas_producao: ['compost-barn'],
      regioes_sebrae: ['Zona da Mata'],
      fazendas_cadastradas: ['Fazenda Leiteira Experimental 1']
    };

    const mockFazendaDetalhes = {
      nome: 'Fazenda Leiteira Experimental 1',
      dados: {
        sistema_producao: 'compost-barn',
        regiao_sebrae: 'zona da mata e vertentes',
        total_vacas: 150,
        percentual_lactacao: 85,
        total_rebanho: 200,
        area_atividade: 15,
        numero_trabalhadores: 4,
        producao_vaca: 28,
        preco_recebido: 3.10,
        preco_referencia: 2.50,
        custo_concentrado: 2.20,
        ccs: 180
      }
    };

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockOpcoes,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockFazendaDetalhes,
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ task_id: 'task-123', status: 'processing' }),
      });

    render(<FormularioPage />);

    await waitFor(() => {
      expect(screen.getByText('Fazenda Leiteira Experimental 1')).toBeInTheDocument();
    }, { timeout: 4000 });

    // Act
    const diagnosticoBtn = screen.getByRole('button', { name: /Iniciar Diagnóstico para Fazenda Leiteira Experimental 1/i });
    fireEvent.click(diagnosticoBtn);

    // Assert
    await waitFor(() => {
      expect(mockSetDadosFazenda).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/carregando?task_id=task-123');
    }, { timeout: 4000 });
  });

  it('deve exibir mensagem de aviso e botão Tentar Novamente quando a chamada à API falhar', async () => {
    // Arrange
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    render(<FormularioPage />);

    // Act & Assert
    await waitFor(() => {
      expect(screen.getByText(/Falha ao conectar com o serviço de opções do formulário/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Tentar Novamente/i })).toBeInTheDocument();
    }, { timeout: 4000 });

    // Test retry
    const mockOpcoes = {
      sistemas_producao: ['compost-barn'],
      regioes_sebrae: ['Zona da Mata'],
      fazendas_cadastradas: ['Fazenda 1']
    };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockOpcoes,
    });

    const retryBtn = screen.getByRole('button', { name: /Tentar Novamente/i });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(screen.queryByText(/Falha ao conectar com o serviço de opções do formulário/i)).not.toBeInTheDocument();
    }, { timeout: 4000 });
  });
});
