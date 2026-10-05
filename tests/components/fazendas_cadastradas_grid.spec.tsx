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
        onIniciarDiagnostico={jest.fn()}
      />
    );

    // Assert
    expect(container.firstChild).toBeNull();
  });

  it('deve renderizar os cards das fazendas com apenas o botão de Iniciar Diagnóstico', () => {
    // Arrange
    const fazendas = ['Fazenda Boa Vista', 'Fazenda Santa Maria'];

    // Act
    render(
      <FazendasCadastradasGrid
        fazendas={fazendas}
        onIniciarDiagnostico={jest.fn()}
      />
    );

    // Assert
    expect(screen.getByText('Fazenda Boa Vista')).toBeInTheDocument();
    expect(screen.getByText('Fazenda Santa Maria')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Iniciar Diagnóstico/i })).toHaveLength(2);
    expect(screen.queryByRole('button', { name: /Carregar .* no formulário/i })).not.toBeInTheDocument();
  });

  it('deve filtrar fazendas por nome ou e-mail de forma insensível a maiúsculas/minúsculas', async () => {
    // Arrange
    const user = userEvent.setup();
    const fazendas = [
      { nome: 'Fazenda Alfa', email: 'alfa@fazenda.com' },
      { nome: 'Fazenda Beta', email: 'beta@educampo.com' },
    ];

    render(
      <FazendasCadastradasGrid
        fazendas={fazendas}
        onIniciarDiagnostico={jest.fn()}
      />
    );

    // Act: digita filtro por email 'educampo'
    const inputBusca = screen.getByTestId('busca-fazenda-input');
    await user.type(inputBusca, 'EDUCAMPO');

    // Assert: apenas Fazenda Beta é exibida
    expect(screen.queryByText('Fazenda Alfa')).not.toBeInTheDocument();
    expect(screen.getByText('Fazenda Beta')).toBeInTheDocument();
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
        onIniciarDiagnostico={mockDiagnostico}
      />
    );

    // Act
    const btnDiagnostico = screen.getByRole('button', { name: /Iniciar Diagnóstico para Fazenda Boa Vista/i });
    await user.click(btnDiagnostico);

    // Assert (State: Loading)
    expect(screen.getByText(/Processando.../i)).toBeInTheDocument();
    expect(mockDiagnostico).toHaveBeenCalledWith('Fazenda Boa Vista', 'Fazenda Boa Vista');

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

  it('deve isolar o estado de erro e loading entre fazendas homônimas com mesmo nome', async () => {
    // Arrange: Duas fazendas com o mesmo nome exato "Fazenda Santa Tereza", mas IDs/emails distintos
    const user = userEvent.setup();
    const mockDiagnostico = jest.fn().mockImplementation((id: string) => {
      if (id === 'uuid-gabrielly-gmail') {
        return Promise.reject(new Error('Falha ao acionar a API de Diagnóstico.'));
      }
      return Promise.resolve();
    });

    const fazendasHomonimas = [
      { id: 'uuid-gabrielly-gmail', nome: 'Fazenda Santa Tereza', email: 'gabriellylunatsousa@gmail.com' },
      { id: 'uuid-gabrielly-ufv', nome: 'Fazenda Santa Tereza', email: 'gabrielly.sousa@ufv.br' },
    ];

    render(
      <FazendasCadastradasGrid
        fazendas={fazendasHomonimas}
        onIniciarDiagnostico={mockDiagnostico}
      />
    );

    const cards = screen.getAllByTestId('fazenda-card');
    expect(cards).toHaveLength(2);

    // Act: Clica em "Iniciar Diagnóstico" apenas no card do Gmail
    const btnGmail = screen.getByRole('button', { name: /Iniciar Diagnóstico para Fazenda Santa Tereza \(gabriellylunatsousa@gmail\.com\)/i });
    await user.click(btnGmail);

    // Assert: O erro deve ser exibido APENAS no primeiro card
    await waitFor(() => {
      expect(screen.getByText('Falha ao acionar a API de Diagnóstico.')).toBeInTheDocument();
    });

    // Garante que só há 1 elemento de erro na tela inteira, e não 2
    const erros = screen.getAllByText('Falha ao acionar a API de Diagnóstico.');
    expect(erros).toHaveLength(1);
    expect(cards[0]).toContainElement(erros[0]);
    expect(cards[1]).not.toContainElement(erros[0]);

    // Valida que o mock foi chamado com o UUID prioritário da hierarquia defensiva
    expect(mockDiagnostico).toHaveBeenCalledWith('uuid-gabrielly-gmail', 'Fazenda Santa Tereza');
  });
});
