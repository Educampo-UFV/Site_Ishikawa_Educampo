/**
 * @file tests/components/formulario.spec.tsx
 * @description Suíte de testes para a Tela de Coleta de Dados.
 * Atualizado para refletir o cadastro expansível em 3 seções, grid com busca e diagnóstico direto.
 * Ref: Obsidian note [[sdd-promover-rota-formularios-frontend]]
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FormularioPage from '@/app/formulario/page';
import { useFazendaStore } from '@/store/useFazendaStore';
import { useRouter } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/store/useFazendaStore', () => ({
  useFazendaStore: jest.fn(),
}));

global.fetch = jest.fn();

describe('Tela de Coleta de Dados (Formulário)', () => {
  const mockPush = jest.fn();
  const mockSetDadosFazenda = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    (useFazendaStore as unknown as jest.Mock).mockImplementation((selector) => {
      const mockedState = { setDadosFazenda: mockSetDadosFazenda };
      return selector ? selector(mockedState) : mockedState;
    });

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        sistemas_producao: ['semiconfinado', 'compost-barn', 'confinado-sem-estrutura'],
        regioes_sebrae: ['triangulo', 'sul'],
        fazendas_cadastradas: ['Fazenda Recanto']
      }),
    });
  });

  it('deve renderizar a seção de cadastro expansível e a grid de fazendas cadastradas', async () => {
    render(<FormularioPage />);
    await screen.findByText('Fazenda Recanto');

    expect(screen.getByText(/Cadastrar Nova Fazenda \/ Produtor/i)).toBeInTheDocument();
    expect(screen.getByText(/Fazendas Cadastradas/i)).toBeInTheDocument();
  });

  describe('Seção de Fazendas Cadastradas e Diagnóstico Direto', () => {
    it('deve exibir a seção de Fazendas Cadastradas e acionar diagnóstico direto ao clicar no botão', async () => {
      const mockOpcoes = {
        sistemas_producao: ['compost-barn'],
        regioes_sebrae: ['sul'],
        fazendas_cadastradas: ['Fazenda Recanto']
      };

      const mockFarmData = {
        nome: 'Fazenda Recanto',
        dados: {
          sistema_producao: 'compost-barn',
          total_vacas: 200,
          percentual_lactacao: 85,
          total_rebanho: 250,
          area_atividade: 50,
          numero_trabalhadores: 4,
          producao_vaca: 35,
          preco_recebido: 3.10,
          preco_referencia: 3.00,
          custo_concentrado: 2.50,
          ccs: 200,
          regiao_sebrae: 'sul'
        }
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockOpcoes,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockFarmData,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ task_id: 'task-999', status: 'processing' }),
        });

      const user = userEvent.setup();
      render(<FormularioPage />);

      expect(await screen.findByText(/Fazendas Cadastradas/i)).toBeInTheDocument();

      const btnDiagnostico = await screen.findByRole('button', { name: /Iniciar Diagnóstico para Fazenda Recanto/i });
      await user.click(btnDiagnostico);

      await waitFor(() => {
        expect(mockSetDadosFazenda).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith('/carregando?task_id=task-999');
      });
    });

    it('deve renderizar corretamente quando a API retorna objetos com { id, nome }', async () => {
      const mockOpcoesObjetos = {
        sistemas_producao: [{ value: 'compost-barn', label: 'Compost Barn' }],
        regioes_sebrae: [{ value: 'sul', label: 'Sul de Minas' }],
        fazendas_cadastradas: [{ id: '123', nome: '#1 Fazenda Teste' }]
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockOpcoesObjetos,
      });

      render(<FormularioPage />);

      expect(await screen.findByText('#1 Fazenda Teste')).toBeInTheDocument();
    });
  });
});