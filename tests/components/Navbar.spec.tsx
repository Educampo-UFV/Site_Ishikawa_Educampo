/**
 * @file tests/components/Navbar.spec.tsx
 * @description Suíte de testes unitários para a barra de navegação global (Navbar).
 * Valida a renderização dos menus, incluindo o novo menu "Gerar Relatório" entre "Atualizar Dados" e "Sair".
 * Ref: Obsidian note [[sdd-relatorio-produtor-pdf.md]]
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Navbar } from '@/components/ui/Navbar';
import { useFazendaStore } from '@/store/useFazendaStore';
import '@testing-library/jest-dom';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

global.fetch = jest.fn();
window.alert = jest.fn();
window.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
window.URL.revokeObjectURL = jest.fn();

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

  it('deve renderizar o menu "Gerar Relatório" na barra de navegação', () => {
    // Arrange & Act
    render(<Navbar />);

    // Assert
    const botoesGerarRelatorio = screen.getAllByRole('button', { name: /Gerar Relatório/i });
    expect(botoesGerarRelatorio.length).toBeGreaterThan(0);
    expect(screen.getAllByText('Diagnóstico').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Simulador de Cenários').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Atualizar Dados').length).toBeGreaterThan(0);
  });

  it('deve disparar download de PDF com sucesso ao clicar em "Gerar Relatório"', async () => {
    // Arrange
    const mockBlob = new Blob(['pdf-mock-data'], { type: 'application/pdf' });
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      blob: async () => mockBlob,
    });

    render(<Navbar />);

    // Act
    const botoesGerarRelatorio = screen.getAllByRole('button', { name: /Gerar Relatório/i });
    fireEvent.click(botoesGerarRelatorio[0]);

    // Assert
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/produtores/fazenda_123/relatorio/pdf');
      expect(window.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    });
  });

  it('deve alertar usuário caso a API retorne 404', async () => {
    // Arrange
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Não encontrado' }),
    });

    render(<Navbar />);

    // Act
    const botoesGerarRelatorio = screen.getAllByRole('button', { name: /Gerar Relatório/i });
    fireEvent.click(botoesGerarRelatorio[0]);

    // Assert
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        'Esta fazenda ainda não possui dados de diagnóstico salvos para gerar o relatório.'
      );
    });
  });

  it('deve alertar se nenhuma fazenda estiver selecionada na store', async () => {
    // Arrange
    useFazendaStore.setState({ dadosFazenda: null });
    render(<Navbar />);

    // Act
    const botoesGerarRelatorio = screen.getAllByRole('button', { name: /Gerar Relatório/i });
    fireEvent.click(botoesGerarRelatorio[0]);

    // Assert
    expect(window.alert).toHaveBeenCalledWith('Nenhuma fazenda selecionada para emissão do relatório.');
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
