/**
 * @file tests/components/cadastrar_fazenda_section.spec.tsx
 * @description Testes de componente para a seção CadastrarFazendaSection.
 * Ref: Obsidian note [[sdd-cadastrar-fazenda.md]]
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CadastrarFazendaSection } from '@/components/CadastrarFazendaSection';
import '@testing-library/jest-dom';

global.fetch = jest.fn();

describe('CadastrarFazendaSection Component Unit Tests', () => {
  const mockOnSuccess = jest.fn();
  const mockSistemas = [{ value: 'compost-barn', label: 'Compost Barn' }];
  const mockRegioes = [{ value: 'triangulo', label: 'Triângulo Mineiro' }];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar inicialmente em estado colapsado', () => {
    // Arrange & Act
    render(
      <CadastrarFazendaSection
        sistemasDisponiveis={mockSistemas}
        regioesDisponiveis={mockRegioes}
        onSuccess={mockOnSuccess}
      />
    );

    // Assert
    expect(screen.getByText('Cadastrar Nova Fazenda / Produtor')).toBeInTheDocument();
    expect(screen.getByText('Expandir')).toBeInTheDocument();
    expect(screen.queryByTestId('cadastrar-fazenda-form')).not.toBeInTheDocument();
  });

  it('deve expandir o formulário ao clicar no header colapsável', () => {
    // Arrange
    render(
      <CadastrarFazendaSection
        sistemasDisponiveis={mockSistemas}
        regioesDisponiveis={mockRegioes}
        onSuccess={mockOnSuccess}
      />
    );

    // Act
    const toggleBtn = screen.getByTestId('toggle-cadastrar-fazenda-btn');
    fireEvent.click(toggleBtn);

    // Assert
    expect(screen.getByText('Recolher')).toBeInTheDocument();
    expect(screen.getByTestId('cadastrar-fazenda-form')).toBeInTheDocument();
    expect(screen.getByLabelText(/E-mail do Produtor/i)).toBeInTheDocument();
  });

  it('deve exibir mensagem de erro Zod quando a senha for menor que 6 caracteres', async () => {
    // Arrange
    render(
      <CadastrarFazendaSection
        sistemasDisponiveis={mockSistemas}
        regioesDisponiveis={mockRegioes}
        onSuccess={mockOnSuccess}
      />
    );

    fireEvent.click(screen.getByTestId('toggle-cadastrar-fazenda-btn'));

    // Act - Preenche campos com senha fraca (menos de 6 chars)
    fireEvent.change(screen.getByLabelText(/E-mail do Produtor/i), { target: { value: 'teste@fazenda.com' } });
    fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: '123' } });
    fireEvent.change(screen.getByLabelText(/Nome da Fazenda/i), { target: { value: 'Fazenda Teste' } });
    fireEvent.change(screen.getByLabelText(/Sistema de Produção/i), { target: { value: 'compost-barn' } });
    fireEvent.change(screen.getByLabelText(/Região SEBRAE/i), { target: { value: 'triangulo' } });
    fireEvent.change(screen.getByLabelText(/Total de Vacas/i), { target: { value: '50' } });
    fireEvent.change(screen.getByLabelText(/Perc. em Lactação/i), { target: { value: '80' } });
    fireEvent.change(screen.getByLabelText(/Total do Rebanho/i), { target: { value: '60' } });
    fireEvent.change(screen.getByLabelText(/Área da Atividade/i), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText(/Mão de Obra/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/Produção por Vaca/i), { target: { value: '25' } });
    fireEvent.change(screen.getByLabelText(/Preço Recebido/i), { target: { value: '2.80' } });
    fireEvent.change(screen.getByLabelText(/Preço Referência/i), { target: { value: '2.50' } });
    fireEvent.change(screen.getByLabelText(/Qualidade CCS/i), { target: { value: '150' } });

    fireEvent.click(screen.getByTestId('cadastrar-fazenda-submit-btn'));

    // Assert
    await waitFor(() => {
      expect(screen.getByText('A senha deve ter no mínimo 6 caracteres')).toBeInTheDocument();
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('deve realizar submit com sucesso, colapsar o card e invocar onSuccess (201 Created)', async () => {
    // Arrange
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ id: '123', message: 'Sucesso' }),
    });

    render(
      <CadastrarFazendaSection
        sistemasDisponiveis={mockSistemas}
        regioesDisponiveis={mockRegioes}
        onSuccess={mockOnSuccess}
      />
    );

    fireEvent.click(screen.getByTestId('toggle-cadastrar-fazenda-btn'));

    // Act
    fireEvent.change(screen.getByLabelText(/E-mail do Produtor/i), { target: { value: 'novo.produtor@fazenda.com.br' } });
    fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: 'senhaSegura123' } });
    fireEvent.change(screen.getByLabelText(/Nome da Fazenda/i), { target: { value: 'Fazenda Santa Maria' } });
    fireEvent.change(screen.getByLabelText(/Sistema de Produção/i), { target: { value: 'compost-barn' } });
    fireEvent.change(screen.getByLabelText(/Região SEBRAE/i), { target: { value: 'triangulo' } });
    fireEvent.change(screen.getByLabelText(/Total de Vacas/i), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText(/Perc. em Lactação/i), { target: { value: '80' } });
    fireEvent.change(screen.getByLabelText(/Total do Rebanho/i), { target: { value: '150' } });
    fireEvent.change(screen.getByLabelText(/Área da Atividade/i), { target: { value: '20' } });
    fireEvent.change(screen.getByLabelText(/Mão de Obra/i), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText(/Produção por Vaca/i), { target: { value: '30' } });
    fireEvent.change(screen.getByLabelText(/Preço Recebido/i), { target: { value: '3.00' } });
    fireEvent.change(screen.getByLabelText(/Preço Referência/i), { target: { value: '2.50' } });
    fireEvent.change(screen.getByLabelText(/Qualidade CCS/i), { target: { value: '200' } });

    fireEvent.click(screen.getByTestId('cadastrar-fazenda-submit-btn'));

    // Assert
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/produtores',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Fazenda cadastrada com sucesso!')).toBeInTheDocument();
      expect(mockOnSuccess).toHaveBeenCalledTimes(1);
      expect(screen.queryByTestId('cadastrar-fazenda-form')).not.toBeInTheDocument();
    });
  });

  it('deve exibir mensagem de erro ao receber status 409 Conflict da API', async () => {
    // Arrange
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({ message: 'O e-mail consultor@educampo.com já está cadastrado no sistema.' }),
    });

    render(
      <CadastrarFazendaSection
        sistemasDisponiveis={mockSistemas}
        regioesDisponiveis={mockRegioes}
        onSuccess={mockOnSuccess}
      />
    );

    fireEvent.click(screen.getByTestId('toggle-cadastrar-fazenda-btn'));

    // Act
    fireEvent.change(screen.getByLabelText(/E-mail do Produtor/i), { target: { value: 'consultor@educampo.com' } });
    fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: 'senhaSegura123' } });
    fireEvent.change(screen.getByLabelText(/Nome da Fazenda/i), { target: { value: 'Fazenda Duplicada' } });
    fireEvent.change(screen.getByLabelText(/Sistema de Produção/i), { target: { value: 'compost-barn' } });
    fireEvent.change(screen.getByLabelText(/Região SEBRAE/i), { target: { value: 'triangulo' } });
    fireEvent.change(screen.getByLabelText(/Total de Vacas/i), { target: { value: '50' } });
    fireEvent.change(screen.getByLabelText(/Perc. em Lactação/i), { target: { value: '80' } });
    fireEvent.change(screen.getByLabelText(/Total do Rebanho/i), { target: { value: '60' } });
    fireEvent.change(screen.getByLabelText(/Área da Atividade/i), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText(/Mão de Obra/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/Produção por Vaca/i), { target: { value: '25' } });
    fireEvent.change(screen.getByLabelText(/Preço Recebido/i), { target: { value: '2.80' } });
    fireEvent.change(screen.getByLabelText(/Preço Referência/i), { target: { value: '2.50' } });
    fireEvent.change(screen.getByLabelText(/Qualidade CCS/i), { target: { value: '150' } });

    fireEvent.click(screen.getByTestId('cadastrar-fazenda-submit-btn'));

    // Assert
    await waitFor(() => {
      const errorElements = screen.getAllByText('O e-mail consultor@educampo.com já está cadastrado no sistema.');
      expect(errorElements.length).toBeGreaterThan(0);
    });
    expect(screen.getByTestId('cadastrar-fazenda-form')).toBeInTheDocument();
  });
});

