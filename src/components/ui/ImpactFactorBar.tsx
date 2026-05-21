/**
 * @file src/components/ui/ImpactFactorBar.tsx
 * @description Lógica de cálculo e renderização da barra base percentual linear e marcadores posicionais.
 */

import React from 'react';
import { ImpactThresholds } from '../../types/diagnostico';

/**
 * @description Propriedades exigidas para alimentar a barra de fator de impacto de um indicador isolado.
 * @property {string} label - Rótulo/Nome do fator sendo exibido.
 * @property {string} [titulo] - Título formatado vindo da API.
 * @property {number | string} [valor] - Valor numérico a ser apontado como tooltip superior na barra.
 * @property {string} [unidade] - Sufixo da unidade para renderização visual da bolha.
 * @property {number} [minimo] - Fundo matemático de escala (Start Point).
 * @property {number} [maximo] - Topo matemático de escala (End Point).
 * @property {ImpactThresholds} thresholds - Objeto contendo os limites avaliativos para colorir a barra.
 */
interface ImpactFactorBarProps {
  label: string;
  titulo?: string;
  valor?: number | string;
  unidade?: string;
  minimo?: number;
  maximo?: number;
  thresholds: ImpactThresholds;
}

/**
 * @description Converte strings de limiares (ex: `> 500`) fornecidos em `thresholds` para delimitar e
 * calcular frações de exibição (larguras percentuais relativas) das faixas Verde, Amarelo e Vermelho.
 * Ajusta a coordenada horizontal (left) em porcentagem clampleando matematicamente sobre toda a amplitude (Range).
 * @param {ImpactFactorBarProps} props - Propriedades do fator.
 * @returns {React.JSX.Element} Div renderizada como linha CSS manipulada por estilos dinâmicos em `style=`.
 */
export function ImpactFactorBar({ label, titulo, valor, unidade, minimo, maximo, thresholds }: ImpactFactorBarProps) {
  // Tenta extrair o valor e unidade das props ou do objeto thresholds
  const rawValor = valor !== undefined ? valor : thresholds?.valor;
  const numValor = Number(rawValor) || 0;
  const displayUnidade = unidade || (thresholds as any)?.unidade || '';

  const tAny = thresholds as any;
  const bomStr = tAny?.bom || tAny?.bom_alto || tAny?.bom_baixo || '';
  const criticoStr = tAny?.critico || tAny?.critico_alto || tAny?.critico_baixo || '';
  const regularStr = tAny?.regular || '';
  const direcao = tAny?.direcao_ideal || tAny?.direcao_otimizacao;
  const isCentralizado = direcao === 'centralizado_melhor';

  const isLowerBetterFallback = bomStr.includes('<') || bomStr.includes('&lt;') || criticoStr.includes('>') || criticoStr.includes('&gt;');

  // Função de extração inteligente de números (suporta formato brasileiro com vírgula ou ponto)
  const extractNumbers = (str: string) => {
    return (str.match(/-?\d+([.,]\d+)?/g) || []).map(s => Number(s.replace(',', '.')));
  };

  // Extrair números das strings de limites para calcular a amplitude e extremos
  const allThresholdsStr = `${bomStr} ${regularStr} ${criticoStr}`;
  const numbers = extractNumbers(allThresholdsStr);
  const uniqueNumbers = Array.from(new Set(numbers)).sort((a, b) => a - b);

  let has5Zones = false;
  let b1 = 0, b2 = 0, b3 = 0, b4 = 0;

  if (isCentralizado) {
    const bomNums = extractNumbers(bomStr);
    const critNums = extractNumbers(criticoStr);
    
    if (bomNums.length >= 2 && critNums.length >= 2) {
      b2 = Math.min(...bomNums); b3 = Math.max(...bomNums);
      b1 = Math.min(...critNums); b4 = Math.max(...critNums);
      if (b1 < b2 && b2 <= b3 && b3 < b4) has5Zones = true;
    }

    if (!has5Zones && uniqueNumbers.length >= 4) {
      has5Zones = true;
      if (uniqueNumbers.length >= 6) {
        b1 = uniqueNumbers[0]; b2 = uniqueNumbers[2]; b3 = uniqueNumbers[3]; b4 = uniqueNumbers[5];
      } else if (uniqueNumbers.length === 5) {
        b1 = uniqueNumbers[1]; b2 = uniqueNumbers[2]; b3 = uniqueNumbers[3]; b4 = uniqueNumbers[4];
      } else {
        b1 = uniqueNumbers[0]; b2 = uniqueNumbers[1]; b3 = uniqueNumbers[2]; b4 = uniqueNumbers[3];
      }
    }
  }

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

  let percentage = ((numValor - displayMin) / totalRange) * 100;
  // Garantir que a seta fique contida nos limites de 0% e 100% da barra
  percentage = Math.max(0, Math.min(100, percentage));

  const colorBom = 'bg-green-500';
  const colorRegular = 'bg-amber-400';
  const colorCritico = 'bg-red-500';

  let segments: Array<{ width: number, color: string, label: string }> = [];

  const getClampedPercent = (val: number) => {
    const cl = Math.max(displayMin, Math.min(displayMax, val));
    return ((cl - displayMin) / totalRange) * 100;
  };

  if (has5Zones) {
    const p1 = getClampedPercent(b1);
    const p2 = getClampedPercent(b2) - p1;
    const p3 = getClampedPercent(b3) - (p1 + p2);
    const p4 = getClampedPercent(b4) - (p1 + p2 + p3);
    const p5 = 100 - (p1 + p2 + p3 + p4);

    segments = [
      { width: p1, color: colorCritico, label: 'CRÍTICO' },
      { width: p2, color: colorRegular, label: 'REG.' },
      { width: p3, color: colorBom, label: 'BOM' },
      { width: p4, color: colorRegular, label: 'REG.' },
      { width: p5, color: colorCritico, label: 'CRÍTICO' }
    ];
  } else {
    // Cálculos precisos de largura proporcional para 3 zonas (padrão)
    const clampedMinBound = Math.max(displayMin, Math.min(displayMax, minBound));
    const clampedMaxBound = Math.max(displayMin, Math.min(displayMax, maxBound));

    const p1 = ((clampedMinBound - displayMin) / totalRange) * 100;
    const p2 = ((clampedMaxBound - clampedMinBound) / totalRange) * 100;
    const p3 = ((displayMax - clampedMaxBound) / totalRange) * 100;

    let leftColor = colorCritico;
    let middleColor = colorRegular;
    let rightColor = colorBom;
    let leftLabel = 'CRÍTICO';
    let middleLabel = 'REGULAR';
    let rightLabel = 'BOM';

    if (direcao === 'menor_melhor' || (!direcao && isLowerBetterFallback)) {
      leftColor = colorBom; middleColor = colorRegular; rightColor = colorCritico;
      leftLabel = 'BOM'; rightLabel = 'CRÍTICO';
    } else if (direcao === 'centralizado_melhor') {
      leftColor = colorCritico; middleColor = colorBom; rightColor = colorCritico;
      leftLabel = 'CRÍTICO'; middleLabel = 'BOM'; rightLabel = 'CRÍTICO';
    } else if (direcao === 'maior_melhor') {
      leftColor = colorCritico; middleColor = colorRegular; rightColor = colorBom;
      leftLabel = 'CRÍTICO'; middleLabel = 'REGULAR'; rightLabel = 'BOM';
    }

    segments = [
      { width: p1, color: leftColor, label: leftLabel },
      { width: p2, color: middleColor, label: middleLabel },
      { width: p3, color: rightColor, label: rightLabel }
    ];
  }

  // Melhorar a formatação do label (remover underlines e capitalizar)
  const baseLabel = titulo || label.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const displayLabel = displayUnidade ? `${baseLabel} (${displayUnidade})` : baseLabel;
  
  const formatNumber = (v: number) => v.toLocaleString('pt-BR', { maximumFractionDigits: 2 });

  return (
    <div className="flex flex-col w-full mb-10 font-sans">
      {/* Topo: Nome do Fator (Valor numérico foi movido para o tooltip da bolha) */}
      <div className="flex justify-between items-end mb-8">
        <span className="text-sm font-semibold text-gray-700">{displayLabel}</span>
      </div>

      <div className="relative w-full">
        {/* Legenda Superior (Nomes das Faixas) */}
        <div className="absolute bottom-full left-0 w-full flex text-[10px] font-bold text-gray-500 mb-1.5">
          {segments.map((seg, i) => (
            <div key={i} style={{ width: `${seg.width}%` }} className="text-center truncate px-1 tracking-wider">{seg.label}</div>
          ))}
        </div>

        {/* Barra Colorida Proporcional (Flex não usa mais flex-1 padronizado) */}
        <div className="relative h-2.5 w-full rounded-full flex overflow-hidden shadow-inner bg-gray-200">
          {segments.map((seg, i) => (
            <div key={i} style={{ width: `${seg.width}%` }} className={`h-full ${seg.color}`}></div>
          ))}
        </div>

        {/* Marcadores de Limite Matemático (Inferior) */}
        <div className="absolute top-full left-0 w-full h-8 mt-1 pointer-events-none">
          {has5Zones ? (
            <>
              <div className="absolute top-0 flex flex-col items-center -translate-x-1/2" style={{ left: `${getClampedPercent(b2)}%` }}>
                <div className="w-0.5 h-1.5 bg-gray-400 rounded-full"></div>
                <span className="text-[10px] font-bold text-gray-500 mt-0.5">{formatNumber(b2)}</span>
              </div>
              <div className="absolute top-0 flex flex-col items-center -translate-x-1/2" style={{ left: `${getClampedPercent(b3)}%` }}>
                <div className="w-0.5 h-1.5 bg-gray-400 rounded-full"></div>
                <span className="text-[10px] font-bold text-gray-500 mt-0.5">{formatNumber(b3)}</span>
              </div>
            </>
          ) : (
            <>
              <div className="absolute top-0 flex flex-col items-center -translate-x-1/2" style={{ left: `${((Math.max(displayMin, Math.min(displayMax, minBound)) - displayMin) / totalRange) * 100}%` }}>
                <div className="w-0.5 h-1.5 bg-gray-400 rounded-full"></div>
                <span className="text-[10px] font-bold text-gray-500 mt-0.5">{formatNumber(minBound)}</span>
              </div>
              <div className="absolute top-0 flex flex-col items-center -translate-x-1/2" style={{ left: `${((Math.max(displayMin, Math.min(displayMax, maxBound)) - displayMin) / totalRange) * 100}%` }}>
                <div className="w-0.5 h-1.5 bg-gray-400 rounded-full"></div>
                <span className="text-[10px] font-bold text-gray-500 mt-0.5">{formatNumber(maxBound)}</span>
              </div>
            </>
          )}
        </div>

        {/* Indicador de Bolha de Ar com Balão flutuante (Valor Atual) */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 transition-all duration-1000 ease-out" 
          style={{ left: `${percentage}%` }}
        >
          {/* Tooltip com setinha virada para baixo */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-800 text-white text-[11px] font-bold px-2 py-0.5 rounded shadow-sm whitespace-nowrap after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-[4px] after:border-transparent after:border-t-gray-800">
            {rawValor !== undefined && rawValor !== null && rawValor !== '' && !isNaN(numValor) ? formatNumber(numValor) : '--'} <span className="text-[9px] font-normal text-gray-300">{displayUnidade}</span>
          </div>
          
          {/* A Bolha */}
          <div className="w-3.5 h-3.5 rounded-full border-2 border-white shadow-md bg-[#1973d3]"></div>
        </div>
      </div>
    </div>
  );
}