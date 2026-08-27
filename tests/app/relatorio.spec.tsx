/**
 * @file tests/app/relatorio.spec.tsx
 * @description Suíte de testes unitários e de integração para a página de customização e geração de relatório PDF (/relatorio).
 * Valida a renderização dos filtros granulares, ações em lote, triggers de download/preview e gestão de erros.
 * Ref: Obsidian note [[sdd-relatorio-produtor-pdf.md]]
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RelatorioPage from '@/app/relatorio/page';
import { useFazendaStore } from '@/store/useFazendaStore';
import '@testing-library/jest-dom';

const mockPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/relatorio',
}));

global.fetch = jest.fn();
window.open = jest.fn();
window.URL.createObjectURL = jest.fn(() => 'blob:http://localhost/mock-pdf');
window.URL.revokeObjectURL = jest.fn();

describe('Página de Customização de Relatório PDF (/relatorio)', () => {
  const mockDadosFazenda = {
    id_fazenda: 'fazenda_teste_001',
    nome_fazenda: 'Fazenda Santa Cecília',
    sistema_producao: 'pasto',
    regiao: 'cerrado',
    total_vacas: 150,
    percentual_lactacao: 80,
    animais_rebanho: 180,
    area_atividade: 90,
    mao_obra_total: 5,
    producao_vaca: 22,
    preco_leite: 2.75,
    preco_referencia: 2.45,
    preco_concentrado: 1.7,
    ccs: 210,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useFazendaStore.setState({
      dadosFazenda: mockDadosFazenda,
    });
  });

  it('deve renderizar o cabeçalho, dados da fazenda e seções de filtros com valores padrão', () => {
    // Arrange & Act
    render(<RelatorioPage />);

    // Assert
    expect(screen.getByText('Personalização de Relatório')).toBeInTheDocument();
    expect(screen.getByText('Fazenda Santa Cecília')).toBeInTheDocument();
    expect(screen.getByText(/Sistema: pasto/i)).toBeInTheDocument();
    expect(screen.getByText('1. Resumo Executivo & Inteligência')).toBeInTheDocument();
    expect(screen.getByText('2. Benchmarking Regional')).toBeInTheDocument();
    expect(screen.getByText('3. Matriz Ishikawa & 6 Pilares de Causa Raiz')).toBeInTheDocument();

    // Botões de Ação
    expect(screen.getByRole('button', { name: /Baixar Relatório em PDF/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Visualizar em Nova Aba/i })).toBeInTheDocument();
  });

  it('deve desmarcar todos os itens ao clicar em "Desmarcar Tudo"', async () => {
    // Arrange
    render(<RelatorioPage />);
    const btnUnselect = screen.getByRole('button', { name: /Desmarcar Tudo/i });

    // Act
    fireEvent.click(btnUnselect);

    // Assert
    expect(screen.getByTestId('selected-count')).toHaveTextContent('0');
  });

  it('deve marcar todos os itens ao clicar em "Selecionar Tudo"', async () => {
    // Arrange
    render(<RelatorioPage />);
    const btnUnselect = screen.getByRole('button', { name: /Desmarcar Tudo/i });
    const btnSelectAll = screen.getByRole('button', { name: /Selecionar Tudo/i });

    // Act
    fireEvent.click(btnUnselect);
    expect(screen.getByTestId('selected-count')).toHaveTextContent('0');

    fireEvent.click(btnSelectAll);

    // Assert - Verifica que todos os itens foram selecionados
    const countText = screen.getByText(/itens ativos/i).textContent;
    expect(countText).toMatch(/(\d+)\s+de\s+\1\s+itens ativos/);
  });

  it('deve restaurar a seleção padrão ao clicar em "Padrão"', async () => {
    // Arrange
    render(<RelatorioPage />);
    const btnSelectAll = screen.getByRole('button', { name: /Selecionar Tudo/i });
    const btnReset = screen.getByRole('button', { name: /Padrão/i });

    // Act: seleciona tudo primeiro
    fireEvent.click(btnSelectAll);
    const countSelectAll = screen.getByTestId('selected-count').textContent;

    // Clica em Restaurar Padrão
    fireEvent.click(btnReset);
    const countDefault = screen.getByTestId('selected-count').textContent;

    // Assert: padrão possui menos itens selecionados que o total selecionado
    expect(Number(countDefault)).toBeLessThan(Number(countSelectAll));
  });

  it('deve disparar download via POST com filtros corretos ao clicar em "Baixar Relatório em PDF"', async () => {
    // Arrange
    const mockBlob = new Blob(['%PDF-1.4 mock'], { type: 'application/pdf' });
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      blob: async () => mockBlob,
    });

    render(<RelatorioPage />);

    // Act
    const btnDownload = screen.getByRole('button', { name: /Baixar Relatório em PDF/i });
    fireEvent.click(btnDownload);

    // Assert
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/produtores/fazenda_teste_001/relatorio/pdf',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(window.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
    });
  });

  it('deve abrir em nova aba via POST ao clicar em "Visualizar em Nova Aba"', async () => {
    // Arrange
    const mockWindow = {
      document: {
        open: jest.fn(),
        write: jest.fn(),
        close: jest.fn(),
      },
      location: { href: '' },
      close: jest.fn(),
      closed: false,
    };
    (window.open as jest.Mock).mockReturnValue(mockWindow);

    const mockBlob = new Blob(['%PDF-1.4 preview'], { type: 'application/pdf' });
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      blob: async () => mockBlob,
    });

    render(<RelatorioPage />);

    // Act
    const btnPreview = screen.getByRole('button', { name: /Visualizar em Nova Aba/i });
    fireEvent.click(btnPreview);

    // Assert
    await waitFor(() => {
      expect(window.open).toHaveBeenCalledWith('', '_blank');
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/produtores/fazenda_teste_001/relatorio/pdf',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
      expect(mockWindow.document.write).toHaveBeenCalledWith(expect.stringContaining('Baixar Relatório (PDF)'));
      expect(mockWindow.document.write).toHaveBeenCalledWith(expect.stringContaining('blob:http://localhost/mock-pdf'));
    });
  });

  it('deve exibir mensagem de erro amigável se a API retornar 404', async () => {
    // Arrange
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Diagnóstico não encontrado' }),
    });

    render(<RelatorioPage />);

    // Act
    const btnDownload = screen.getByRole('button', { name: /Baixar Relatório em PDF/i });
    fireEvent.click(btnDownload);

    // Assert
    await waitFor(() => {
      expect(
        screen.getByText('Esta fazenda ainda não possui dados de diagnóstico salvos para gerar o relatório.')
      ).toBeInTheDocument();
    });
  });

  it('deve alertar usuário caso nenhuma fazenda esteja selecionada ao tentar emitir o relatório', async () => {
    // Arrange
    useFazendaStore.setState({ dadosFazenda: null });
    render(<RelatorioPage />);

    // Act
    const btnDownload = screen.getByRole('button', { name: /Baixar Relatório em PDF/i });
    fireEvent.click(btnDownload);

    // Assert
    await waitFor(() => {
      expect(
        screen.getByText('Nenhuma fazenda selecionada para emissão do relatório.')
      ).toBeInTheDocument();
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
