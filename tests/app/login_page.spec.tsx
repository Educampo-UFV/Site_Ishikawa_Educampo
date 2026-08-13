/**
 * @file tests/app/login_page.spec.tsx
 * @description Suíte de testes para a página de Login (src/app/login/page.tsx).
 * Valida formulário com e-mail/senha, atalho de homologação e feedback de erro.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '@/app/login/page';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} alt={props.alt || ''} />,
}));

global.fetch = jest.fn();

describe('LoginPage Component - Batch 4 (Consultant Login UI)', () => {
  beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('deve preencher o e-mail consultor@educampo.com e a senha admin123 ao clicar no botão de teste', () => {
    // Arrange
    render(<LoginPage />);

    const testButton = screen.getByText(/preencher com credenciais de teste/i);
    const emailInput = screen.getByPlaceholderText(/consultor@educampo.com/i) as HTMLInputElement;
    const passwordInput = screen.getByPlaceholderText(/••••••••/i) as HTMLInputElement;

    // Act
    fireEvent.click(testButton);

    // Assert
    expect(emailInput.value).toBe('consultor@educampo.com');
    expect(passwordInput.value).toBe('admin123');
  });

  it('deve submeter e-mail e senha para /api/auth via POST ao enviar o formulário', async () => {
    // Arrange
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ message: 'Login realizado com sucesso' }),
    });

    render(<LoginPage />);

    const testButton = screen.getByText(/preencher com credenciais de teste/i);
    fireEvent.click(testButton);

    const submitButton = screen.getByRole('button', { name: /entrar/i });

    // Act
    fireEvent.click(submitButton);

    // Assert
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            email: 'consultor@educampo.com',
            password: 'admin123',
            rememberMe: false,
          }),
        })
      );
    });
  });

  it('deve exibir mensagem de erro visual quando a resposta da API retornar falha 401', async () => {
    // Arrange
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Credenciais inválidas' }),
    });

    render(<LoginPage />);

    const testButton = screen.getByText(/preencher com credenciais de teste/i);
    fireEvent.click(testButton);

    const submitButton = screen.getByRole('button', { name: /entrar/i });

    // Act
    fireEvent.click(submitButton);

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Credenciais inválidas')).toBeInTheDocument();
    });
  });
});
