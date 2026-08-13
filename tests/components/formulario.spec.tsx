/**
 * @file tests/components/formulario.spec.tsx
 * @description Suíte de testes para a Tela de Coleta de Dados.
 * Atualizado para refletir o carregamento de opções da rota promovida /api/formularios.
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

global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: async () => ({
    sistemas_producao: ['semiconfinado', 'compost-barn', 'confinado-sem-estrutura'],
    regioes_sebrae: ['triangulo', 'rio doce e vale do aco', 'noroeste e alto paranaiba', 'centro', 'centro-oeste e sudoeste', 'sul', 'norte', 'zona da mata e vertentes', 'jequitinhonha e mucuri'],
    fazendas_cadastradas: ['Fazenda Recanto']
  }),
});

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

  it('deve renderizar os grupos de campos e inputs essenciais da interface', async () => {
    render(<FormularioPage />);
    await screen.findByText('Fazenda Recanto');

    expect(screen.getByText(/Informações Gerais/i)).toBeInTheDocument();
    expect(screen.getByText(/Estrutura e Rebanho/i)).toBeInTheDocument();
    expect(screen.getByText(/Produção e Qualidade/i)).toBeInTheDocument();

    expect(screen.getByLabelText(/Nome da Fazenda/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Sistema de Produção/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Total de Vacas/i)).toBeInTheDocument();
  });

  it('deve bloquear a submissão e exibir erros do Zod quando os dados violarem regras zootécnicas', async () => {
    const user = userEvent.setup();
    render(<FormularioPage />);
    await screen.findByText('Fazenda Recanto');

    await user.type(screen.getByLabelText(/Nome da Fazenda/i), 'Fazenda Errada');
    await user.selectOptions(screen.getByLabelText(/Sistema de Produção/i), 'confinado-sem-estrutura');
    await user.type(screen.getByLabelText(/Total de Vacas/i), '150');
    await user.type(screen.getByLabelText(/Perc. em Lactação/i), '85'); 
    await user.type(screen.getByLabelText(/Total no Rebanho/i), '100');
    await user.type(screen.getByLabelText(/Área da Atividade/i), '10');
    await user.type(screen.getByLabelText(/Mão de Obra Total/i), '3');
    await user.type(screen.getByLabelText(/Prod. por Vaca/i), '30');
    await user.type(screen.getByLabelText(/Qualidade/i), '150');
    await user.type(screen.getByLabelText(/Preço Recebido/i), '3.20');
    await user.type(screen.getByLabelText(/Preço de Referência/i), '3.00');
    await user.type(screen.getByLabelText(/Preço do Concentrado/i), '2.30');
    await user.selectOptions(screen.getByLabelText(/Região/i), 'sul');

    const botaoAvancar = screen.getByRole('button', { name: /Avançar/i });
    await user.click(botaoAvancar);


    await waitFor(() => {
      expect(mockSetDadosFazenda).not.toHaveBeenCalled();
      expect(screen.getByText(/O total de vacas não pode exceder o total do rebanho/i)).toBeInTheDocument();
    });
  });

  it('deve injetar os dados no estado global e redirecionar ao submeter corretamente', async () => {
    const user = userEvent.setup();
    render(<FormularioPage />);
    await screen.findByText('Fazenda Recanto');

    await user.type(screen.getByLabelText(/Nome da Fazenda/i), 'Fazenda Leiteira Experimental');
    
    const sistemaSelect = screen.getByLabelText(/Sistema de Produção/i);
    await user.selectOptions(sistemaSelect, 'semiconfinado');

    await user.type(screen.getByLabelText(/Total de Vacas/i), '100');
    await user.type(screen.getByLabelText(/Perc. em Lactação/i), '85');
    await user.type(screen.getByLabelText(/Total no Rebanho/i), '150');
    await user.type(screen.getByLabelText(/Área da Atividade/i), '200');
    await user.type(screen.getByLabelText(/Mão de Obra Total/i), '3');

    await user.type(screen.getByLabelText(/Prod. por Vaca/i), '35');
    await user.type(screen.getByLabelText(/Preço Recebido/i), '3.20');
    await user.type(screen.getByLabelText(/Preço de Referência/i), '2.50');
    await user.type(screen.getByLabelText(/Preço do Concentrado/i), '2.30');
    await user.type(screen.getByLabelText(/Qualidade/i), '150');
    
    const regiaoSelect = screen.getByLabelText(/Região/i);
    await user.selectOptions(regiaoSelect, 'sul');

    const botaoAvancar = screen.getByRole('button', { name: /Avançar/i });
    await user.click(botaoAvancar);

    await waitFor(() => {
      expect(mockSetDadosFazenda).toHaveBeenCalledWith(expect.objectContaining({
        nome_fazenda: 'Fazenda Leiteira Experimental',
        sistema_producao: 'semiconfinado',
        total_vacas: 100,
        percentual_lactacao: 85,
      }));

      expect(mockPush).toHaveBeenCalledWith('/carregando');
    });
  });

  describe('Seção de Fazendas Cadastradas', () => {
    it('deve exibir a seção de Fazendas Cadastradas ao carregar as opções da API', async () => {
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

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockOpcoes,
      });

      const user = userEvent.setup();
      render(<FormularioPage />);

      expect(await screen.findByText(/Fazendas Cadastradas/i)).toBeInTheDocument();
      expect(global.fetch).toHaveBeenCalledWith('/api/formularios');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockFarmData,
      });

      const btnCarregar = await screen.findByRole('button', { name: /Carregar Fazenda Recanto no formulário/i });
      await user.click(btnCarregar);

      expect(global.fetch).toHaveBeenCalledWith('/api/formularios?nome=Fazenda%20Recanto');

      await waitFor(() => {
        expect(screen.getByLabelText(/Nome da Fazenda/i)).toHaveValue('Fazenda Recanto');
        expect(screen.getByLabelText(/Total de Vacas/i)).toHaveValue('200');
      });
    });


    it('deve renderizar corretamente quando a API retorna objetos { value, label } e { id, nome }', async () => {
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
      expect(screen.getByText('Compost Barn')).toBeInTheDocument();
      expect(screen.getByText('Sul de Minas')).toBeInTheDocument();
    });
  });
});