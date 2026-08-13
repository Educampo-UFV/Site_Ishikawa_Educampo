/**
 * @file AiTelemetryBadge.spec.tsx
 * @description Suíte de testes unitários para o componente AiTelemetryBadge.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { AiTelemetryBadge } from '../../src/components/AiTelemetryBadge';

describe('AiTelemetryBadge Component', () => {

  it('não deve renderizar nada se a telemetria for nula ou indefinida', () => {
    // Arrange & Act
    const { container } = render(<AiTelemetryBadge telemetry={null} />);

    // Assert
    expect(container.firstChild).toBeNull();
  });

  it('deve renderizar os dados de telemetria de IA corretamente quando fornecidos', () => {
    // Arrange
    const mockTelemetry = {
      tokens: 1450,
      reasoningTokens: 320,
      costUsd: 0.0042,
      provider: 'openai/gpt-4o'
    };

    // Act
    render(<AiTelemetryBadge telemetry={mockTelemetry} />);

    // Assert
    expect(screen.getByTestId('ai-telemetry-badge')).toBeInTheDocument();
    expect(screen.getByText(/Telemetria do Motor de IA/i)).toBeInTheDocument();
    expect(screen.getByText('openai/gpt-4o')).toBeInTheDocument();
    expect(screen.getByText('1.450')).toBeInTheDocument();
    expect(screen.getByText(/\$0.0042 USD/i)).toBeInTheDocument();
  });

});
