/**
 * @file dashboard.spec.tsx
 * @description Suite de testes de contrato para a tela principal do Dashboard.
 * Verifica a renderização dos dados da store, o funcionamento dos cálculos 
 * TEMPORÁRIOS de benchmarking e o comportamento do menu de navegação.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DashboardPage from '@/app/dashboard/page';
import { useFazendaStore } from '@/store/useFazendaStore';
import { useRouter } from 'next/navigation';

// Mock do Zustand para controlar o estado durante os testes
jest.mock('@/store/useFazendaStore');

// Mock do Next.js Router para testar redirecionamentos
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('Feature: Dashboard Central', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });

    // Injeta dados simulados na Store antes de cada teste
    (useFazendaStore as unknown as jest.Mock).mockReturnValue({
      dadosFazenda: {
        producao_vaca: 35.0, // Acima de 30 (Acima da Média)
        ccs: 150,            // Abaixo de 200 (Excelente)
        preco_leite: 3.20,
        preco_referencia: 3.00, // Preço recebido maior (Competitivo)
      },
      diagnosticoIA: {
        resumo: "Sua fazenda apresenta excelente qualidade de leite, mas há gargalos na alimentação.",
      }
    });
  });

  it('deve renderizar os indicadores da fazenda a partir da store', async () => {
    /**
     * @description Verifica se os dados vitais estão na tela.
     */
    render(<DashboardPage />);
    
    await waitFor(() => {
      expect(screen.getByText('35.0 L/dia')).toBeInTheDocument();
      expect(screen.getByText('CCS: 150')).toBeInTheDocument();
    });
  });

  it('deve calcular e exibir o status de benchmark temporário corretamente', async () => {
    /**
     * @description Valida as regras de negócio temporárias feitas no frontend.
     * TODO: [TEMPORARIO] Remover/atualizar este teste quando os cálculos de benchmark 
     * forem migrados definitivamente para o backend/BFF.
     */
    render(<DashboardPage />);
    
    await waitFor(() => {
      // Baseado no mock: Prod = 35 (>30), CCS = 150 (<200), Preço = 3.20 (>3.00)
      expect(screen.getByText(/Acima da Média/i)).toBeInTheDocument();
      expect(screen.getByText(/Excelente/i)).toBeInTheDocument();
      expect(screen.getByText(/Competitivo/i)).toBeInTheDocument();
    });
  });

  it('deve redirecionar para a tela de diagnóstico ao clicar no resumo da IA', async () => {
    /**
     * @description Verifica o fluxo de usabilidade onde o bloco de resumo atua como atalho.
     */
    render(<DashboardPage />);
    
    const resumoBlock = await screen.findByText(/Sua fazenda apresenta excelente qualidade/i);
    fireEvent.click(resumoBlock);
    
    expect(mockPush).toHaveBeenCalledWith('/diagnostico');
  });

  it('deve abrir o menu suspenso ao clicar no ícone hamburger', async () => {
    /**
     * @description Testa a interatividade do menu global do Educampo.
     */
    render(<DashboardPage />);
    
    const menuButton = await screen.findByRole('button', { name: /abrir menu/i });
    fireEvent.click(menuButton);
    
    // Verifica se as opções do menu aparecem na tela após o clique
    expect(screen.getByText(/Diagnóstico/i)).toBeVisible();
    expect(screen.getByText(/Simulações/i)).toBeVisible();
    expect(screen.getByText(/Configurações/i)).toBeVisible();
  });
});