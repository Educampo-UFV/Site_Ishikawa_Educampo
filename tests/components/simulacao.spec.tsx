/**
 * @file tests/components/simulacao.spec.tsx
 * @description Contrato de testes para o Dashboard Interativo de Simulação.
 * Valida a renderização dos sliders, recálculo em tempo real (frontend)
 * e a troca de cenários base (tabs).
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SimulacaoPage from '../../src/app/simulacao/page';
import { useFazendaStore } from '../../src/store/useFazendaStore';

// Mock do Zustand
jest.mock('../../src/store/useFazendaStore', () => ({
  useFazendaStore: jest.fn(),
}));

// Mock da Navbar
jest.mock('../../src/components/ui/Navbar', () => ({
  Navbar: function MockNavbar() { return <div data-testid="navbar-mock">Navbar</div>; }
}));

// Mock do Next Router (caso algum elemento interno precise)
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

describe('Dashboard de Simulação (SimulacaoPage)', () => {
  const mockDadosIniciais = {
    nome_fazenda: 'Fazenda Simulador',
    sistema_producao: 'compost_barn',
    regiao: 'triangulo',
    total_vacas: 100,
    percentual_lactacao: 85, // Dado importante para a conta
    producao_vaca: 30,  // 30L por vaca
    area_atividade: 10,
    preco_leite: 3.0,
    preco_concentrado: 2.0,
    ccs: 150,
    mao_obra_total: 2
  };

  const mockNovaRespostaSimulacao = {
    parametros_painel: {
      total_vacas: { min: 10, max: 500, step: 1 },
      percentual_lactacao: { min: 0, max: 100, step: 0.5 },
      producao_vaca: { min: 5, max: 60, step: 0.5 },
      preco_recebido: { min: 1.0, max: 6.0, step: 0.05 },
      ccs: { min: 50, max: 1000, step: 10 },
      area_atividade: { min: 1, max: 1000, step: 0.5 },
      custo_concentrado: { min: 0.5, max: 6.0, step: 0.05 },
      numero_trabalhadores: { min: 1, max: 50, step: 1 }
    },
    simulacao: {
      estaticas: [
        {
          metrica: "ccs",
          titulo_grafico: "Qualidade do Leite (CCS)",
          direcao_otimizacao: "menor_melhor",
          valor_produtor: 150,
          cenarios: {
            inferior: { valor: 250, diferenca_percentual: -40 },
            intermediario: { valor: 150, diferenca_percentual: 0 },
            superior: { valor: 100, diferenca_percentual: 30 }
          }
        }
      ],
      operacionais: [
        {
          metrica: "producao_diaria",
          titulo_grafico: "Produção Total Diária (L/dia)",
          direcao_otimizacao: "maior_melhor",
          valor_produtor: 2550,
          cenarios: {
            inferior: { valor: 1500, diferenca_percentual: 80 },
            intermediario: { valor: 2500, diferenca_percentual: 5 },
            superior: { valor: 3500, diferenca_percentual: -20 }
          }
        }
      ],
      financeiras: [
        {
          metrica: "custo_estimado",
          titulo_grafico: "Custo Estimado (R$/L)",
          direcao_otimizacao: "menor_melhor",
          valor_produtor: 2.00,
          cenarios: {
            inferior: { valor: 2.50, diferenca_percentual: -20 },
            intermediario: { valor: 2.10, diferenca_percentual: 5 },
            superior: { valor: 1.80, diferenca_percentual: 15 }
          }
        }
      ]
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useFazendaStore as unknown as jest.Mock).mockImplementation((selector) => {
      const state = {
        dadosFazenda: mockDadosIniciais,
        diagnosticoIA: {
          cenarios: {
            inferior: { producao_diaria: 2000, preco: 2.5 },
            intermediario: { producao_diaria: 3000, preco: 3.0 },
            superior: { producao_diaria: 4500, preco: 3.5 }
          }
        },
        resultadoSimulacao: mockNovaRespostaSimulacao,
        setResultadoSimulacao: jest.fn(),
      };
      return selector ? selector(state) : state;
    });
    
    // Injeta o Mock global do fetch para a nova estrutura de resposta
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockNovaRespostaSimulacao,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('Deve renderizar os sliders (painel esquerdo) com os valores iniciais da store', () => {
    render(<SimulacaoPage />);
    
    // Sliders utilizam valores em string no DOM
    expect(screen.getByLabelText(/Quantidade de Vacas/i)).toHaveValue('100');
    expect(screen.getByLabelText(/Produção por vaca/i)).toHaveValue('30');
  });

  it('Deve enviar os dados atualizados para a API ao mover o slider e clicar em analisar', async () => {
    render(<SimulacaoPage />);
    
    // Produção diária inicial: 85 vacas em lactação * 30L = 2550L
    // O toLocaleString formata como "2.550"
    expect(screen.getAllByText(/2\.550/i).length).toBeGreaterThan(0);

    const inputVacasLactacao = screen.getByLabelText(/Percentual em Lactação/i);
    
    // Simula o produtor movendo o slider de 85 para 100% de lactação
    fireEvent.change(inputVacasLactacao, { target: { value: '100' } });

    const btnAnalisar = screen.getByRole('button', { name: /Analisar Cenário/i });
    fireEvent.click(btnAnalisar);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/simulacao', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('"percentual_lactacao":100') // Verifica se o novo valor está no bloco enviado
      }));
    });
  });

  it('Deve renderizar os botões de seleção de cenário (Inferior, Intermediário, Superior)', () => {
    render(<SimulacaoPage />);
    
    const btnSuperior = screen.getByRole('button', { name: /Superior/i });
    expect(btnSuperior).toBeInTheDocument();
    
    fireEvent.click(btnSuperior);
    // Verifica se a Tab foi ativada assumindo a classe principal
    expect(btnSuperior).toHaveClass('bg-primary'); 
  });

  it('Deve bloquear o botão e exibir contador de 60s ao receber erro 429 (Rate Limit)', async () => {
    // 1. Forçamos o fetch a devolver o erro 429
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => ({ error: "Muitas requisições" }),
    });

    render(<SimulacaoPage />);

    // 2. Simulamos o clique no botão de Análise
    const btnAnalisar = screen.getByRole('button', { name: /Analisar Cenário/i });
    fireEvent.click(btnAnalisar);

    // 3. Esperamos que a interface mude para o modo de bloqueio e exiba o contador
    await waitFor(() => {
      expect(btnAnalisar).toBeDisabled();
      expect(btnAnalisar).toHaveTextContent(/Aguarde 60s/i); 
    });
  });
});