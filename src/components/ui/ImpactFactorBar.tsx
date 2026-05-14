/**
 * @file src/components/ui/ImpactFactorBar.tsx
 * @description Componente visual para exibir os Fatores de Impacto de um indicador,
 * apresentando uma barra linear colorida e um marcador indicando a posição do valor atual do produtor.
 */

import React from 'react';
import { ImpactThresholds } from '../../types/diagnostico';

interface ImpactFactorBarProps {
  label: string;
  valor?: number | string;
  unidade?: string;
  minimo?: number;
  maximo?: number;
  thresholds: ImpactThresholds;
}

export function ImpactFactorBar({ label, valor, unidade, minimo, maximo, thresholds }: ImpactFactorBarProps) {
  // Tenta extrair o valor e unidade das props ou do objeto thresholds
  const rawValor = valor !== undefined ? valor : thresholds?.valor;
  const numValor = Number(rawValor) || 0;
  const displayUnidade = unidade || (thresholds as any)?.unidade || '';

  const tAny = thresholds as any;
  const bomStr = tAny?.bom || tAny?.bom_alto || tAny?.bom_baixo || '';
  const criticoStr = tAny?.critico || tAny?.critico_alto || tAny?.critico_baixo || '';
  const regularStr = tAny?.regular || '';
  const direcao = tAny?.direcao_otimizacao;

  const isLowerBetter = direcao ? direcao === 'menor_melhor' : (bomStr.includes('<') || bomStr.includes('&lt;') || criticoStr.includes('>') || criticoStr.includes('&gt;'));

  // Extrair números das strings de limites para calcular a amplitude e extremos
  const allThresholdsStr = `${bomStr} ${regularStr} ${criticoStr}`;
  const numbers = allThresholdsStr.match(/-?\d+(\.\d+)?/g)?.map(Number) || [];
  const uniqueNumbers = Array.from(new Set(numbers)).sort((a, b) => a - b);

  let minBound = uniqueNumbers.length > 0 ? uniqueNumbers[0] : 0;
  let maxBound = uniqueNumbers.length > 1 ? uniqueNumbers[uniqueNumbers.length - 1] : (uniqueNumbers.length === 1 ? (uniqueNumbers[0] === 0 ? 100 : uniqueNumbers[0] * 1.5) : 100);

  let diff = maxBound - minBound;
  if (diff === 0) diff = maxBound > 0 ? maxBound * 0.5 : 100;

  // Usa os limites rígidos da API se fornecidos, senão expande 15% visualmente
  let displayMin = minimo !== undefined ? Number(minimo) : minBound - diff * 0.15;
  let displayMax = maximo !== undefined ? Number(maximo) : maxBound + diff * 0.15;

  // Previne bugs matemáticos caso maximo seja igual ou menor que o minimo
  if (displayMax <= displayMin) displayMax = displayMin + 100;

  const totalRange = displayMax - displayMin;

  // Trava (clampa) as faixas internas para nunca ultrapassarem o espaço de exibição SVG/CSS
  const clampedMinBound = Math.max(displayMin, Math.min(displayMax, minBound));
  const clampedMaxBound = Math.max(displayMin, Math.min(displayMax, maxBound));

  // Cálculos precisos de largura proporcional em tela para cada faixa de cor
  const p1 = ((clampedMinBound - displayMin) / totalRange) * 100;
  const p2 = ((clampedMaxBound - clampedMinBound) / totalRange) * 100;
  const p3 = ((displayMax - clampedMaxBound) / totalRange) * 100;

  let percentage = ((numValor - displayMin) / totalRange) * 100;
  // Garantir que a seta fique contida nos limites de 0% e 100% da barra
  percentage = Math.max(0, Math.min(100, percentage));

  const colorBom = 'bg-green-500';
  const colorRegular = 'bg-amber-400';
  const colorCritico = 'bg-red-500';

  const leftColor = isLowerBetter ? colorBom : colorCritico;
  const rightColor = isLowerBetter ? colorCritico : colorBom;
  const middleColor = colorRegular;

  const leftLabel = isLowerBetter ? 'BOM' : 'CRÍTICO';
  const rightLabel = isLowerBetter ? 'CRÍTICO' : 'BOM';
  const middleLabel = 'REGULAR';

  // Melhorar a formatação do label (remover underlines e capitalizar)
  const displayLabel = label.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  
  const formatNumber = (v: number) => Number.isInteger(v) ? v : Number(v).toFixed(2);

  return (
    <div className="flex flex-col w-full mb-10 font-sans">
      {/* Topo: Nome do Fator (Valor numérico foi movido para o tooltip da bolha) */}
      <div className="flex justify-between items-end mb-8">
        <span className="text-sm font-semibold text-gray-700">{displayLabel}</span>
      </div>

      <div className="relative w-full">
        {/* Legenda Superior (Nomes das Faixas) */}
        <div className="absolute bottom-full left-0 w-full flex text-[10px] font-bold text-gray-500 mb-1.5">
          <div style={{ width: `${p1}%` }} className="text-center truncate px-1 tracking-wider">{leftLabel}</div>
          <div style={{ width: `${p2}%` }} className="text-center truncate px-1 tracking-wider">{middleLabel}</div>
          <div style={{ width: `${p3}%` }} className="text-center truncate px-1 tracking-wider">{rightLabel}</div>
        </div>

        {/* Barra Colorida Proporcional (Flex não usa mais flex-1 padronizado) */}
        <div className="relative h-2.5 w-full rounded-full flex overflow-hidden shadow-inner bg-gray-200">
          <div style={{ width: `${p1}%` }} className={`h-full ${leftColor}`}></div>
          <div style={{ width: `${p2}%` }} className={`h-full ${middleColor}`}></div>
          <div style={{ width: `${p3}%` }} className={`h-full ${rightColor}`}></div>
        </div>

        {/* Marcadores de Limite Matemático (Inferior) */}
        <div className="absolute top-full left-0 w-full h-8 mt-1 pointer-events-none">
          <div className="absolute top-0 flex flex-col items-center -translate-x-1/2" style={{ left: `${p1}%` }}>
            <div className="w-0.5 h-1.5 bg-gray-400 rounded-full"></div>
            <span className="text-[10px] font-bold text-gray-500 mt-0.5">{formatNumber(minBound)}</span>
          </div>
          <div className="absolute top-0 flex flex-col items-center -translate-x-1/2" style={{ left: `${p1 + p2}%` }}>
            <div className="w-0.5 h-1.5 bg-gray-400 rounded-full"></div>
            <span className="text-[10px] font-bold text-gray-500 mt-0.5">{formatNumber(maxBound)}</span>
          </div>
        </div>

        {/* Indicador de Bolha de Ar com Balão flutuante (Valor Atual) */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 transition-all duration-1000 ease-out" 
          style={{ left: `${percentage}%` }}
        >
          {/* Tooltip com setinha virada para baixo */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-800 text-white text-[11px] font-bold px-2 py-0.5 rounded shadow-sm whitespace-nowrap after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-[4px] after:border-transparent after:border-t-gray-800">
            {rawValor !== undefined ? formatNumber(numValor) : '--'} <span className="text-[9px] font-normal text-gray-300">{displayUnidade}</span>
          </div>
          
          {/* A Bolha */}
          <div className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-md bg-[#1973d3]"></div>
        </div>
      </div>
    </div>
  );
}