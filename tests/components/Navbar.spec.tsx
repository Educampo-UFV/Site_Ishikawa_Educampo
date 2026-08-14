/**
 * @file tests/components/Navbar.spec.tsx
 * @description Suíte de testes unitários para a barra de navegação global (Navbar).
 * Valida a renderização dos links de navegação para a nova página de relatório customizado (/relatorio).
 * Ref: Obsidian note [[sdd-relatorio-produtor-pdf.md]]
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Navbar } from '@/components/ui/Navbar';
import { useFazendaStore } from '@/store/useFazendaStore';
import '@testing-library/jest-dom';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/diagnostico',
}));

global.fetch = jest.fn();

describe('Navbar Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useFazendaStore.setState({
      dadosFazenda: {
        id_fazenda: 'fazenda_123',
        nome_fazenda: 'Fazenda Boa Esperança',
        sistema_producao: 'compost-barn',
        total_vacas: 100,
        percentual_lactacao: 85,
        animais_rebanho: 120,
        area_atividade: 50,
        mao_obra_total: 4,
        producao_vaca: 28,
        preco_leite: 2.8,
        preco_referencia: 2.5,
        preco_concentrado: 1.81,
        ccs: 250,
        regiao: 'triangulo',
      },
    });
  });

  it('deve renderizar os links principais de navegação incluindo "Gerar Relatório"', () => {
    // Arrange & Act
    render(<Navbar />);

    // Assert
    const linkRelatorio = screen.getAllByRole('link', { name: /Gerar Relatório/i });
    expect(linkRelatorio.length).toBeGreaterThan(0);
    expect(linkRelatorio[0]).toHaveAttribute('href', '/relatorio');

    expect(screen.getAllByRole('link', { name: /Diagnóstico/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /Simulador de Cenários/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /Atualizar Dados/i }).length).toBeGreaterThan(0);
  });

  it('deve alternar a visibilidade do menu mobile ao clicar no botão hamburger', () => {
    // Arrange
    render(<Navbar />);
    const hamburgerBtn = screen.getByRole('button', { name: /Abrir menu/i });

    // Act
    fireEvent.click(hamburgerBtn);

    // Assert
    expect(screen.getByRole('button', { name: /Fechar menu/i })).toBeInTheDocument();
  });

  it('deve acionar o logout ao clicar no botão Sair e redirecionar para /login', async () => {
    // Arrange
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });
    render(<Navbar />);

    // Act
    const botoesSair = screen.getAllByRole('button', { name: /Sair/i });
    fireEvent.click(botoesSair[0]);

    // Assert
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST' });
      expect(useFazendaStore.getState().dadosFazenda).toBeNull();
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });
});
