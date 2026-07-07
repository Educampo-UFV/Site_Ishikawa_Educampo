/**
 * @file tests/components/diagnostico.spec.tsx
 * @description Suíte de testes corrigida com mock de store resiliente.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DiagnosticoPage from '@/app/diagnostico/page';
import { useFazendaStore } from '@/store/useFazendaStore';

jest.mock('@/store/useFazendaStore', () => ({
  useFazendaStore: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

describe('Feature: Hub Central de Diagnóstico', () => {
  const mockStorePopulated = {
    dadosFazenda: {
      nome_fazenda: 'Fazenda Teste',
      sistema_producao: 'compost-barn',
      total_vacas: 100,
      percentual_lactacao: 85,
      animais_rebanho: 120,
      area_atividade: 10.0,
      mao_obra_total: 2,
      producao_vaca: 35.0,
      preco_leite: 3.20,
      preco_referencia: 2.80,
      ccs: 150,
      regiao: 'triangulo',
    },
    diagnosticoIA: {
      resumo_geral: {
        visao_geral: "Sua fazenda é ótima [1]. E o leite está bom [2].",
        raciocinios: [
          { id: "1", analise_tecnica: "A margem bruta está positiva devido ao custo baixo." },
          { id: "2", analise_tecnica: "A qualidade sanitária eleva o preço base." }
        ]
      },
      benchmarking: [
        {
          titulo: "Lotação Animal",
          valor_produtor: 8.5,
          valor_referencia: 1.78,
          unidade: "cab/ha",
          status_comparacao: "positivo",
          mensagem_curta: "Acima da média",
          mensagem_detalhada: "Seu resultado está 377.5% superior à média regional."
        },
        {
          titulo: "Sistema de Produção",
          valor_produtor: "Compost Barn",
          mensagem_detalhada: "19.7% das fazendas da região utilizam este sistema."
        }
      ],
      ccs: {
        status: 'bom',
        textos_analise: 'O CCS está excelente.',
        valor_atual: 150,
        causas: [
          { 
            pilar: "Mão de Obra", 
            causa: "Falta de Treinamento", 
            pratica: "Capacitar equipe",
            severidade: "Alta",
            analise: "A falta de rotina na ordenha eleva a CCS."
          }
        ],
        ishikawa: { mao_de_obra: [], maquina: [], meio_ambiente: [], metodo: [], medida: [], material: [] }
      },
      producao_vaca: {
        status: 'alerta',
        textos_analise: 'A produção de 35 L/vaca precisa melhorar.',
        valor_atual: 35.0,
        ishikawa: { mao_de_obra: [], maquina: [], meio_ambiente: [], metodo: [], medida: [], material: [] }
      }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Implementação que suporta chamadas useFazendaStore() e useFazendaStore(s => s.x)
    (useFazendaStore as unknown as jest.Mock).mockImplementation((selector) => 
      selector ? selector(mockStorePopulated) : mockStorePopulated
    );
  });

  it('deve renderizar os indicadores da fazenda (resiliente a fragmentação)', async () => {
    render(<DiagnosticoPage />);
    
    await waitFor(() => {
      // Usamos a função queryByText com uma lógica customizada para ignorar scripts e achar o conteúdo
      const matchIndicador = screen.queryAllByText((content, element) => {
        return element?.tagName.toLowerCase() !== 'script' && (content.includes('35') || content.includes('150') || content.includes('Fazenda Teste'));
      });
      
      expect(matchIndicador.length).toBeGreaterThan(0);
    });
  });

  it('deve carregar o diagnóstico de CCS por padrão', async () => {
    render(<DiagnosticoPage />);
    expect(screen.getByText(/O CCS está excelente/i)).toBeInTheDocument();
  });

  it('deve renderizar perfeitamente cards de benchmark descritivos (sem valor_referencia e unidade)', async () => {
    render(<DiagnosticoPage />);
    
    // Garante que o Card qualitativo com strings e sem referência não quebrou a UI do React
    expect(screen.getByText('Sistema de Produção')).toBeInTheDocument();
    expect(screen.getAllByText('Compost Barn').length).toBeGreaterThan(0);
    expect(screen.getByText('19.7% das fazendas da região utilizam este sistema.')).toBeInTheDocument();
  });
});