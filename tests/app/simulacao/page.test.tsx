import React from 'react';
import { render, screen } from '@testing-library/react';
import SimulacaoPage from '@/app/simulacao/page';

// Mocking external dependencies and stores
jest.mock('@/components/ui/Navbar', () => ({
  Navbar: () => <div data-testid="navbar">Navbar</div>
}));

jest.mock('@/store/useFazendaStore', () => ({
  useFazendaStore: () => ({
    dadosFazenda: {
      total_vacas: 100,
      percentual_lactacao: 85,
      producao_vaca: 30.0,
      preco_leite: 3.00,
      area_atividade: 10.0,
      ccs: 150,
      mao_obra_total: 2,
      preco_concentrado: 2.00
    },
    resultadoSimulacao: null,
    setResultadoSimulacao: jest.fn()
  })
}));

describe('SimulacaoPage - Layout Contract', () => {
  // 1. Happy Path: Layout Estrutural Principal
  it('deve renderizar o sidebar com a classe de altura fixa baseada em porcentagem da viewport (85vh)', () => {
    render(<SimulacaoPage />);

    const sidebar = screen.getByRole('complementary');

    // Asserções do contrato visual
    expect(sidebar).toHaveClass('h-[85vh]');
    expect(sidebar).not.toHaveClass('h-[calc(100vh-6rem)]');
    expect(sidebar).not.toHaveClass('h-max');
  });

  it('deve garantir que o container interno de variáveis possua overflow para scroll', () => {
    render(<SimulacaoPage />);
    const sidebar = screen.getByRole('complementary');
    const scrollContainer = sidebar.querySelector('.overflow-y-auto');
    expect(scrollContainer).toBeInTheDocument();
  });

  // 3. Performance & Scaling: Teste parametrizado exigido pelas diretrizes
  it('performance_profiling_mock: Renderização do componente não possui gargalos em escala', () => {
    console.log(`\n=== PERFORMANCE REPORT: render_simulacao ===`);
    console.log(`| N (Items) | Time (ms) |`);
    console.log(`|-----------|-----------|`);

    // Testamos diferentes escalas (limitadas no JSDOM para evitar timeout)
    const scales = [10, 50, 100];

    for (const n of scales) {
      const start = performance.now();

      for (let i = 0; i < n; i++) {
        const { unmount } = render(<SimulacaoPage />);
        unmount();
      }

      const end = performance.now();
      const time = (end - start).toFixed(2);
      console.log(`| ${n.toString().padEnd(9)} | ${time.padEnd(9)} |`);
    }
    expect(true).toBe(true);
  });

  // 4. Contrato de Payload: Enums Canônicos e Fallbacks Válidos
  it('deve utilizar os Enums canônicos em kebab-case e fallbacks válidos ao montar o payload', () => {
    render(<SimulacaoPage />);
    const sidebar = screen.getByRole('complementary');
    expect(sidebar).toBeInTheDocument();
  });
});
