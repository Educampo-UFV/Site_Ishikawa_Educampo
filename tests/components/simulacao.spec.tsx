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
    total_vacas: 100,
    vacas_lactacao: 85, // Dado importante para a conta
    producao_vaca: 30,  // 30L por vaca
    area_atividade: 10,
    preco_leite: 3.0,
    ccs: 150,
  };

  const mockNovaRespostaSimulacao = {
    metricas: [
      {
        metrica: "ccs",
        inferior: 127.75,
        intermediario: 156.62,
        superior: 309.18
      },
      {
        metrica: "producao_vaca",
        inferior: 22.52,
        intermediario: 24.67,
        superior: 26.15
      },
      {
        metrica: "producao_diaria",
        inferior: 2675.54,
        intermediario: 2896.18,
        superior: 3862.67
      },
      {
        metrica: "custo_estimado",
        inferior: {
          estimativa_produtor: 0,
          media_estimativa_grupo: 0,
          margem_lucro_percentual: 100,
          texto_margem: "Está a vender o leite a R$ 3.20 e o seu custo estimado é de R$ 0.00..."
        },
        intermediario: {
          estimativa_produtor: 0,
          media_estimativa_grupo: 0,
          margem_lucro_percentual: 100,
          texto_margem: "Está a vender o leite a R$ 3.20 e o seu custo estimado é de R$ 0.00..."
        },
        superior: {
          estimativa_produtor: 0,
          media_estimativa_grupo: 0,
          margem_lucro_percentual: 100,
          texto_margem: "Está a vender o leite a R$ 3.20 e o seu custo estimado é de R$ 0.00..."
        }
      }
    ]
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
    expect(screen.getByLabelText(/Total de Vacas/i)).toHaveValue('100');
    expect(screen.getByLabelText(/Produção por Vaca/i)).toHaveValue('30');
  });

  it('Deve recalcular indicadores em tempo real ao mover um slider', () => {
    render(<SimulacaoPage />);
    
    // Produção diária inicial: 85 vacas em lactação * 30L = 2550L
    // O toLocaleString formata como "2.550"
    expect(screen.getAllByText(/2\.550/i).length).toBeGreaterThan(0);

    const inputVacasLactacao = screen.getByLabelText(/Vacas em Lactação/i);
    
    // Simula o produtor movendo o slider de 85 para 100 vacas em lactação
    fireEvent.change(inputVacasLactacao, { target: { value: '100' } });

    // Nova produção diária esperada: 100 vacas * 30L = 3000L ("3.000")
    // O React calcula no frontend sem chamar a API!
    expect(screen.getAllByText(/3\.000/i).length).toBeGreaterThan(0);
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