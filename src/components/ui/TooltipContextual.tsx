'use client';

import React from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';

/**
 * @description Componente de Tooltip acessível utilizando Radix UI.
 * 
 * Este componente implementa a exibição flutuante de conteúdo (Progressive Disclosure)
 * via Portal, o que previne problemas de "clipping" quando renderizado dentro de 
 * containers com overflow-hidden. Ideal para mensagens de feedback contextuais.
 * 
 * @param {React.ReactNode} children O elemento gatilho (ex: botão ou ícone) que aciona o Tooltip.
 * @param {React.ReactNode} content O conteúdo (texto ou JSX) a ser exibido dentro do balão flutuante.
 * 
 * @returns Um wrapper funcional de Tooltip.
 * 
 * Contexto de Domínio:
 * Aplicado primariamente para os alertas de transbordo da simulação, onde o usuário
 * deve ver a mensagem apenas quando requisitado (Hover ou Focus), mantendo a UI limpa.
 */
export function TooltipContextual({ children, content }: { children: React.ReactNode; content: React.ReactNode }) {
  return (
    <Tooltip.Provider delayDuration={150}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          {children}
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content 
            className="z-50 max-w-xs px-3 py-2.5 text-xs leading-relaxed font-medium text-white bg-slate-900 border border-slate-700 rounded-lg shadow-xl animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95" 
            sideOffset={6}
            side="top"
          >
            {content}
            <Tooltip.Arrow className="fill-slate-900" width={12} height={6} />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
