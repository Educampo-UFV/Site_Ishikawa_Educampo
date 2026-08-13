/**
 * @file CadastrarFazendaSection.spec.tsx
 * @description Suíte de testes para a exibição de mensagens de erro estruturadas e destaques nos campos.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CadastrarFazendaSection } from '../../src/components/CadastrarFazendaSection';

global.fetch = jest.fn();

const mockSistemas = [{ value: 'compost_barn', label: 'Compost Barn' }];
const mockRegioes = [{ value: 'triangulo', label: 'Triângulo Mineiro' }];

describe('CadastrarFazendaSection Component - Error Handling', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve exibir mensagem de erro amigável para e-mail duplicado (HTTP 409 DUPLICATE_EMAIL)', async () => {
    // Arrange
    const mockErrorPayload = {
      error_code: 'DUPLICATE_EMAIL',
      message: "O e-mail 'produtor.existente@fazenda.com.br' já está cadastrado no sistema.",
      details: { email: 'produtor.existente@fazenda.com.br' }
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 409,
      headers: new Headers({ 'Content-Type': 'application/json' }),
      json: async () => mockErrorPayload,
    });

    render(<CadastrarFazendaSection sistemasDisponiveis={mockSistemas} regioesDisponiveis={mockRegioes} />);

    // Expandir formulário
    const toggleBtn = screen.getByTestId('toggle-cadastrar-fazenda-btn');
    fireEvent.click(toggleBtn);

    // Preencher formulário válido
    fireEvent.change(screen.getByLabelText(/E-mail do Produtor/i), { target: { value: 'produtor.existente@fazenda.com.br' } });
    fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: '123456' } });
    fireEvent.change(screen.getByLabelText(/Nome da Fazenda/i), { target: { value: 'Fazenda Teste' } });
    fireEvent.change(screen.getByLabelText(/Sistema de Produção/i), { target: { value: 'compost_barn' } });
    fireEvent.change(screen.getByLabelText(/Região SEBRAE/i), { target: { value: 'triangulo' } });
    fireEvent.change(screen.getByLabelText(/Total de Vacas/i), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText(/Perc. em Lactação/i), { target: { value: '80' } });
    fireEvent.change(screen.getByLabelText(/Total do Rebanho/i), { target: { value: '150' } });
    fireEvent.change(screen.getByLabelText(/Área da Atividade/i), { target: { value: '20' } });
    fireEvent.change(screen.getByLabelText(/Mão de Obra/i), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText(/Produção por Vaca/i), { target: { value: '25' } });
    fireEvent.change(screen.getByLabelText(/Preço Recebido/i), { target: { value: '3.0' } });
    fireEvent.change(screen.getByLabelText(/Preço Referência/i), { target: { value: '2.5' } });
    fireEvent.change(screen.getByLabelText(/Qualidade CCS/i), { target: { value: '200' } });

    // Act
    const submitBtn = screen.getByTestId('cadastrar-fazenda-submit-btn');
    fireEvent.click(submitBtn);

    // Assert
    await waitFor(() => {
      const messages = screen.getAllByText(/O e-mail 'produtor.existente@fazenda.com.br' já está cadastrado no sistema./i);
      expect(messages.length).toBeGreaterThan(0);
      expect(messages[0]).toBeInTheDocument();
    });
  });

  it('deve destacar o campo com erro de validação Pydantic (HTTP 422)', async () => {
    // Arrange
    const mockPydanticErrorPayload = {
      detail: [
        {
          loc: ['body', 'ccs'],
          msg: 'Input should be a valid integer',
          type: 'int_parsing'
        }
      ]
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 422,
      headers: new Headers({ 'Content-Type': 'application/json' }),
      json: async () => mockPydanticErrorPayload,
    });

    render(<CadastrarFazendaSection sistemasDisponiveis={mockSistemas} regioesDisponiveis={mockRegioes} />);

    const toggleBtn = screen.getByTestId('toggle-cadastrar-fazenda-btn');
    fireEvent.click(toggleBtn);

    // Preencher dados
    fireEvent.change(screen.getByLabelText(/E-mail do Produtor/i), { target: { value: 'novo.produtor@fazenda.com.br' } });
    fireEvent.change(screen.getByLabelText(/Senha/i), { target: { value: '123456' } });
    fireEvent.change(screen.getByLabelText(/Nome da Fazenda/i), { target: { value: 'Fazenda Teste' } });
    fireEvent.change(screen.getByLabelText(/Sistema de Produção/i), { target: { value: 'compost_barn' } });
    fireEvent.change(screen.getByLabelText(/Região SEBRAE/i), { target: { value: 'triangulo' } });
    fireEvent.change(screen.getByLabelText(/Total de Vacas/i), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText(/Perc. em Lactação/i), { target: { value: '80' } });
    fireEvent.change(screen.getByLabelText(/Total do Rebanho/i), { target: { value: '150' } });
    fireEvent.change(screen.getByLabelText(/Área da Atividade/i), { target: { value: '20' } });
    fireEvent.change(screen.getByLabelText(/Mão de Obra/i), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText(/Produção por Vaca/i), { target: { value: '25' } });
    fireEvent.change(screen.getByLabelText(/Preço Recebido/i), { target: { value: '3.0' } });
    fireEvent.change(screen.getByLabelText(/Preço Referência/i), { target: { value: '2.5' } });
    fireEvent.change(screen.getByLabelText(/Qualidade CCS/i), { target: { value: '200' } });

    // Act
    const submitBtn = screen.getByTestId('cadastrar-fazenda-submit-btn');
    fireEvent.click(submitBtn);

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/Input should be a valid integer/i)).toBeInTheDocument();
    });
  });

});
