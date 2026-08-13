/**
 * @file tests/components/fazendas_cadastradas_grid.spec.tsx
 * @description Suíte de testes unitários para o componente FazendasCadastradasGrid.
 * Ref: Obsidian note [[sdd-03-lista-fazendas-diagnostico]]
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FazendasCadastradasGrid } from '@/components/FazendasCadastradasGrid';

describe('FazendasCadastradasGrid', () => {
  it('não deve renderizar nada se a lista de fazendas estiver vazia', () => {
    // Arrange
    const fazendas: string[] = [];

    // Act
    const { container } = render(
      <FazendasCadastradasGrid
        fazendas={fazendas}
        onCarregarFormulario={jest.fn()}
        onIniciarDiagnostico={jest.fn()}
      />
    );

    // Assert
    expect(container.firstChild).toBeNull();
  });

  it('deve renderizar os cards das fazendas com os botões de ação', () => {
    // Arrange
    const fazendas = ['Fazenda Boa Vista', 'Fazenda Santa Maria'];

    // Act
    render(
      <FazendasCadastradasGrid
        fazendas={fazendas}
        onCarregarFormulario={jest.fn()}
        onIniciarDiagnostico={jest.fn()}
      />
    );

    // Assert
    expect(screen.getByText('Fazenda Boa Vista')).toBeInTheDocument();
    expect(screen.getByText('Fazenda Santa Maria')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Iniciar Diagnóstico/i })).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: /Carregar .* no formulário/i })).toHaveLength(2);

  });

  it('deve chamar onCarregarFormulario ao clicar no botão "Carregar no Formulário"', async () => {
    // Arrange
    const user = userEvent.setup();
    const mockCarregar = jest.fn();
    const fazendas = ['Fazenda Boa Vista'];

    render(
      <FazendasCadastradasGrid
        fazendas={fazendas}
        onCarregarFormulario={mockCarregar}
        onIniciarDiagnostico={jest.fn()}
      />
    );

    // Act
    const btnCarregar = screen.getByRole('button', { name: /Carregar Fazenda Boa Vista no formulário/i });
    await user.click(btnCarregar);

    // Assert
    expect(mockCarregar).toHaveBeenCalledWith('Fazenda Boa Vista');
  });

  it('deve alternar para o estado de loading e chamar onIniciarDiagnostico ao clicar em "Iniciar Diagnóstico"', async () => {
    // Arrange
    const user = userEvent.setup();
    let resolveDiagnostico: () => void = () => {};
    const mockDiagnostico = jest.fn().mockImplementation(() => {
      return new Promise<void>((resolve) => {
        resolveDiagnostico = resolve;
      });
    });
    const fazendas = ['Fazenda Boa Vista'];

    render(
      <FazendasCadastradasGrid
        fazendas={fazendas}
        onCarregarFormulario={jest.fn()}
        onIniciarDiagnostico={mockDiagnostico}
      />
    );

    // Act
    const btnDiagnostico = screen.getByRole('button', { name: /Iniciar Diagnóstico para Fazenda Boa Vista/i });
    await user.click(btnDiagnostico);

    // Assert (State: Loading)
    expect(screen.getByText(/Processando.../i)).toBeInTheDocument();
    expect(mockDiagnostico).toHaveBeenCalledWith('Fazenda Boa Vista');

    // Clean up async call
    resolveDiagnostico();
    await waitFor(() => {
      expect(screen.queryByText(/Processando.../i)).not.toBeInTheDocument();
    });
  });

  it('deve exibir mensagem de erro local se onIniciarDiagnostico falhar', async () => {
    // Arrange
    const user = userEvent.setup();
    const mockDiagnostico = jest.fn().mockRejectedValue(new Error('Falha de conexão com BFF'));
    const fazendas = ['Fazenda Boa Vista'];

    render(
      <FazendasCadastradasGrid
        fazendas={fazendas}
        onCarregarFormulario={jest.fn()}
        onIniciarDiagnostico={mockDiagnostico}
      />
    );

    // Act
    const btnDiagnostico = screen.getByRole('button', { name: /Iniciar Diagnóstico para Fazenda Boa Vista/i });
    await user.click(btnDiagnostico);

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Falha de conexão com BFF')).toBeInTheDocument();
    });
  });
});
