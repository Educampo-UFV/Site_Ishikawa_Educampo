/**
 * @file src/components/AiTelemetryBadge.tsx
 * @description Componente React para exibição elegante de métricas de telemetria de Inteligência Artificial.
 */

'use client';

import React from 'react';
import { Cpu, DollarSign, Zap } from 'lucide-react';
import { AiTelemetry } from '@/lib/apiUtils';

interface AiTelemetryBadgeProps {
  telemetry?: AiTelemetry | null;
}

export const AiTelemetryBadge: React.FC<AiTelemetryBadgeProps> = ({ telemetry }) => {
  if (!telemetry || (!telemetry.tokens && !telemetry.costUsd && !telemetry.provider)) {
    return null;
  }

  return (
    <div 
      className="bg-slate-900 text-slate-200 border border-slate-700 rounded-xl p-3 shadow-md text-xs flex flex-wrap items-center justify-between gap-4 mt-4"
      data-testid="ai-telemetry-badge"
    >
      <div className="flex items-center gap-2 font-semibold text-emerald-400">
        <Cpu size={16} className="animate-pulse" />
        <span>Telemetria do Motor de IA</span>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        {telemetry.provider && (
          <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-md border border-slate-700">
            <span className="text-slate-400">Modelo:</span>
            <span className="font-mono text-slate-100">{telemetry.provider}</span>
          </div>
        )}

        {telemetry.tokens !== undefined && (
          <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-md border border-slate-700">
            <Zap size={14} className="text-amber-400" />
            <span className="text-slate-400">Tokens:</span>
            <span className="font-mono font-bold text-amber-300">{telemetry.tokens.toLocaleString()}</span>
            {telemetry.reasoningTokens !== undefined && telemetry.reasoningTokens > 0 && (
              <span className="text-[10px] text-slate-400 ml-1">({telemetry.reasoningTokens} raciocínio)</span>
            )}
          </div>
        )}

        {telemetry.costUsd !== undefined && (
          <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-md border border-slate-700">
            <DollarSign size={14} className="text-emerald-400" />
            <span className="text-slate-400">Custo Est.:</span>
            <span className="font-mono font-bold text-emerald-300">${telemetry.costUsd.toFixed(4)} USD</span>
          </div>
        )}
      </div>
    </div>
  );
};
