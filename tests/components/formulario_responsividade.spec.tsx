/**
 * @file tests/components/formulario_responsividade.spec.tsx
 * @description Testes específicos para validar os requisitos de responsividade Mobile e Tablet
 * na rota de /formulario, cobrindo FazendasCadastradasGrid e CadastrarFazendaSection.
 * Ref: Obsidian note [[bdd-responsividade-mobile-formulario.md]]
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FazendasCadastradasGrid } from '@/components/FazendasCadastradasGrid';
import { CadastrarFazendaSection } from '@/components/CadastrarFazendaSection';
import userEvent from '@testing-library/user-event';

describe('Responsividade Mobile e Tablet: /formulario', () => {
  describe('FazendasCadastradasGrid (Mobile & Tablet Layout)', () => {
    it('deve renderizar container com classes responsivas para mobile (1 col), tablet (2 cols) e desktop (3 cols)', () => {
      // Arrange
      const fazendas = [
        { nome: 'Fazenda Alvorada', email: 'alvorada@agro.com' },
        { nome: 'Fazenda Bela Vista', email: 'belavista@agro.com' },
      ];

      // Act
      render(
        <FazendasCadastradasGrid
          fazendas={fazendas}
          onIniciarDiagnostico={jest.fn()}
        />
      );

      // Assert
      const gridContainer = screen.getByTestId('fazendas-grid-container');
      expect(gridContainer).toBeInTheDocument();
      expect(gridContainer.className).toContain('grid-cols-1');
      expect(gridContainer.className).toContain('sm:grid-cols-2');
      expect(gridContainer.className).toContain('lg:grid-cols-3');
    });

    it('deve renderizar cards com badge alinhada ao nome e botão com largura total e altura de toque mínima', () => {
      // Arrange
      const fazendas = [{ nome: 'Fazenda São José', email: 'saojose@agro.com' }];

      // Act
      render(
        <FazendasCadastradasGrid
          fazendas={fazendas}
          onIniciarDiagnostico={jest.fn()}
        />
      );

      // Assert
      const card = screen.getByTestId('fazenda-card');
      expect(card).toBeInTheDocument();

      const btnDiagnostico = screen.getByRole('button', { name: /Iniciar Diagnóstico para Fazenda São José/i });
      expect(btnDiagnostico).toBeInTheDocument();
      expect(btnDiagnostico.className).toContain('w-full');
      expect(btnDiagnostico.className).toContain('min-h-[42px]');
    });
  });

  describe('CadastrarFazendaSection (Usabilidade Mobile & Grid em Duplas)', () => {
    it('deve conter inputmode correto nos campos numéricos para teclado virtual móvel', async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <CadastrarFazendaSection
          sistemasDisponiveis={[{ value: 'compost_barn', label: 'Compost Barn' }]}
          regioesDisponiveis={[{ value: 'triangulo', label: 'Triângulo Mineiro' }]}
        />
      );

      // Act
      const toggleBtn = screen.getByTestId('toggle-cadastrar-fazenda-btn');
      await user.click(toggleBtn);

      // Assert
      const inputEmail = screen.getByLabelText(/E-mail do Produtor/i);
      const inputVacas = screen.getByLabelText(/Total de Vacas/i);
      const inputLactacao = screen.getByLabelText(/Perc. em Lactação/i);
      const inputRebanho = screen.getByLabelText(/Total do Rebanho/i);
      const inputArea = screen.getByLabelText(/Área da Atividade/i);
      const inputMaoObra = screen.getByLabelText(/Mão de Obra/i);
      const inputProdVaca = screen.getByLabelText(/Produção por Vaca/i);
      const inputCcs = screen.getByLabelText(/Qualidade CCS/i);
      const inputPrecoRec = screen.getByLabelText(/Preço Recebido/i);
      const inputPrecoRef = screen.getByLabelText(/Preço Referência/i);

      expect(inputEmail).toHaveAttribute('inputmode', 'email');
      expect(inputVacas).toHaveAttribute('inputmode', 'numeric');
      expect(inputLactacao).toHaveAttribute('inputmode', 'decimal');
      expect(inputRebanho).toHaveAttribute('inputmode', 'numeric');
      expect(inputArea).toHaveAttribute('inputmode', 'decimal');
      expect(inputMaoObra).toHaveAttribute('inputmode', 'numeric');
      expect(inputProdVaca).toHaveAttribute('inputmode', 'decimal');
      expect(inputCcs).toHaveAttribute('inputmode', 'numeric');
      expect(inputPrecoRec).toHaveAttribute('inputmode', 'decimal');
      expect(inputPrecoRef).toHaveAttribute('inputmode', 'decimal');
    });

    it('deve renderizar botões de ação ergonômicos para toque no mobile', async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <CadastrarFazendaSection
          sistemasDisponiveis={[{ value: 'compost_barn', label: 'Compost Barn' }]}
          regioesDisponiveis={[{ value: 'triangulo', label: 'Triângulo Mineiro' }]}
        />
      );

      // Act
      const toggleBtn = screen.getByTestId('toggle-cadastrar-fazenda-btn');
      await user.click(toggleBtn);

      // Assert
      const btnSubmit = screen.getByTestId('cadastrar-fazenda-submit-btn');
      const btnCancelar = screen.getByRole('button', { name: /Cancelar/i });

      expect(btnSubmit.className).toContain('min-h-[42px]');
      expect(btnCancelar.className).toContain('min-h-[42px]');
    });

    it('deve renderizar os campos de Senha e Confirmar Senha em duplas e validar correspondência', async () => {
      // Arrange
      const user = userEvent.setup();
      render(
        <CadastrarFazendaSection
          sistemasDisponiveis={[{ value: 'compost_barn', label: 'Compost Barn' }]}
          regioesDisponiveis={[{ value: 'triangulo', label: 'Triângulo Mineiro' }]}
        />
      );

      // Act
      const toggleBtn = screen.getByTestId('toggle-cadastrar-fazenda-btn');
      await user.click(toggleBtn);

      const inputSenha = screen.getByLabelText(/^Senha/i);
      const inputConfirmar = screen.getByLabelText(/Confirmar Senha/i);

      expect(inputSenha).toBeInTheDocument();
      expect(inputConfirmar).toBeInTheDocument();

      // Preenche senhas divergentes
      await user.type(inputSenha, 'senha123');
      await user.type(inputConfirmar, 'senhaDiferente');

      const form = screen.getByTestId('cadastrar-fazenda-form');
      fireEvent.submit(form);

      // Assert
      expect(screen.getByText('As senhas não conferem')).toBeInTheDocument();
    });
  });
});
