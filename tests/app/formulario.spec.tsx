/**
 * @file tests/app/formulario.spec.tsx
 * @description Suíte de testes para o componente FormularioPage.
 * Garante o tratamento de opções dinâmicas, auto-preenchimento e UX de resiliência/retry em falhas de API.
 * Ref: Obsidian note [[sdd-promover-rota-formularios-frontend]]
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FormularioPage from '@/app/formulario/page';

jest.setTimeout(15000);

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} alt={props.alt || ''} />,
}));

jest.mock('@/store/useFazendaStore', () => ({
  useFazendaStore: (selector: any) => selector({
    setDadosFazenda: jest.fn(),
  }),
}));

global.fetch = jest.fn();

describe('FormularioPage - Dynamic Options & Auto-fill Integration', () => {
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

  it('deve carregar opções dinâmicas da API /api/formularios e popular selects na montagem', async () => {
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

  it('deve realizar auto-preenchimento ao selecionar uma fazenda cadastrada', async () => {
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
        regiao_sebrae: 'Zona da Mata',
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
      });

    render(<FormularioPage />);

    await waitFor(() => {
      expect(screen.getByText('Fazenda Leiteira Experimental 1')).toBeInTheDocument();
    }, { timeout: 4000 });

    // Act
    const carregarBtn = screen.getByRole('button', { name: /Carregar Fazenda Leiteira Experimental 1 no formulário/i });
    fireEvent.click(carregarBtn);

    // Assert
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/formularios?nome=Fazenda%20Leiteira%20Experimental%201');
    }, { timeout: 4000 });

    await waitFor(() => {
      const inputNome = screen.getByLabelText(/Nome da Fazenda/i) as HTMLInputElement;
      const selectRegiao = screen.getByLabelText(/Região/i) as HTMLSelectElement;
      expect(inputNome.value).toBe('Fazenda Leiteira Experimental 1');
      expect(selectRegiao.value).toBe('Zona da Mata');
    }, { timeout: 4000 });
  });

  it('deve normalizar e autopreencher o campo Região flexivelmente quando a API retornar com maiúsculas, acentos ou a chave regiao', async () => {
    // Arrange
    const mockOpcoes = {
      sistemas_producao: ['compost-barn'],
      regioes_sebrae: ['triangulo', 'zona da mata e vertentes'],
      fazendas_cadastradas: ['Fazenda Teste Regiao']
    };

    const mockFazendaComRegiaoCustom = {
      nome: 'Fazenda Teste Regiao',
      dados: {
        sistema_producao: 'compost-barn',
        regiao: 'Triângulo', // Retorna 'regiao' com maiúscula e acento
        total_vacas: 100
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
        json: async () => mockFazendaComRegiaoCustom,
      });

    render(<FormularioPage />);

    await waitFor(() => {
      expect(screen.getByText('Fazenda Teste Regiao')).toBeInTheDocument();
    }, { timeout: 4000 });

    // Act
    const carregarBtn = screen.getByRole('button', { name: /Carregar Fazenda Teste Regiao no formulário/i });
    fireEvent.click(carregarBtn);

    // Assert
    await waitFor(() => {
      const selectRegiao = screen.getByLabelText(/Região/i) as HTMLSelectElement;
      expect(selectRegiao.value).toBe('triangulo');
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
