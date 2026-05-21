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
 * @property {string} [direcao_ideal] - Direção de otimização da métrica (ex: centralizado_melhor).
 * @property {ImpactThresholds} thresholds - Objeto contendo os limites avaliativos para colorir a barra.
 */
interface ImpactFactorBarProps {
  label: string;
  titulo?: string;
  valor?: number | string;
  unidade?: string;
  minimo?: number;
  maximo?: number;
  direcao_ideal?: string;
  thresholds: ImpactThresholds;
}

/**
 * @description Converte strings de limiares (ex: `> 500`) fornecidos em `thresholds` para delimitar e
 * calcular frações de exibição (larguras percentuais relativas) das faixas Verde, Amarelo e Vermelho.
 * Ajusta a coordenada horizontal (left) em porcentagem clampleando matematicamente sobre toda a amplitude (Range).
 * @param {ImpactFactorBarProps} props - Propriedades do fator.
 * @returns {React.JSX.Element} Div renderizada como linha CSS manipulada por estilos dinâmicos em `style=`.
 */
export function ImpactFactorBar({ label, titulo, valor, unidade, minimo, maximo, direcao_ideal, thresholds }: ImpactFactorBarProps) {
  // Tenta extrair o valor e unidade das props ou do objeto thresholds
  const rawValor = valor !== undefined ? valor : thresholds?.valor;
  
  let numValor = 0;
  let isValorValido = false;

  if (rawValor !== undefined && rawValor !== null && rawValor !== '') {
    if (typeof rawValor === 'number' && !isNaN(rawValor)) {
      numValor = rawValor;
      isValorValido = true;
    } else {
      // Fallback para strings numéricas com vírgula ou caracteres extras (ex: "35,00")
      const cleanStr = String(rawValor).replace(',', '.').replace(/[^\d.-]/g, '');
      const parsed = Number(cleanStr);
      if (!isNaN(parsed) && cleanStr !== '') {
        numValor = parsed;
        isValorValido = true;
      }
    }
  }

  const displayUnidade = unidade || (thresholds as any)?.unidade || '';

  const tAny = thresholds as any;
  const bomStr = tAny?.bom || tAny?.bom_alto || tAny?.bom_baixo || '';
  const criticoStr = tAny?.critico || tAny?.critico_alto || tAny?.critico_baixo || '';
  const regularStr = tAny?.regular || '';
  const direcao = direcao_ideal || tAny?.direcao_ideal || tAny?.direcao_otimizacao;
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

  const formatNumber = (v: number) => v.toLocaleString('pt-BR', { maximumFractionDigits: 2 });

  const colorBom = 'bg-green-500';
  const colorRegular = 'bg-amber-400';
  const colorCritico = 'bg-red-500';

  let segments: Array<{ width: number, color: string, label: string, range?: string }> = [];
  let percentage = 0;

  if (has5Zones) {
    const zoneWidth = 100 / 5;

    segments = [
      { width: zoneWidth, color: colorCritico, label: 'CRÍTICO', range: `Até ${formatNumber(b1)}` },
      { width: zoneWidth, color: colorRegular, label: 'REGULAR', range: `${formatNumber(b1)} a ${formatNumber(b2)}` },
      { width: zoneWidth, color: colorBom, label: 'BOM', range: `${formatNumber(b2)} a ${formatNumber(b3)}` },
      { width: zoneWidth, color: colorRegular, label: 'REGULAR', range: `${formatNumber(b3)} a ${formatNumber(b4)}` },
      { width: zoneWidth, color: colorCritico, label: 'CRÍTICO', range: `Acima de ${formatNumber(b4)}` }
    ];

    if (numValor <= b1) {
      const range = b1 - displayMin || 1;
      const p = Math.max(0, (numValor - displayMin) / range);
      percentage = p * zoneWidth;
    } else if (numValor <= b2) {
      const range = b2 - b1 || 1;
      const p = (numValor - b1) / range;
      percentage = zoneWidth + p * zoneWidth;
    } else if (numValor <= b3) {
      const range = b3 - b2 || 1;
      const p = (numValor - b2) / range;
      percentage = zoneWidth * 2 + p * zoneWidth;
    } else if (numValor <= b4) {
      const range = b4 - b3 || 1;
      const p = (numValor - b3) / range;
      percentage = zoneWidth * 3 + p * zoneWidth;
    } else {
      const range = displayMax - b4 || 1;
      const p = Math.min(1, (numValor - b4) / range);
      percentage = zoneWidth * 4 + p * zoneWidth;
    }
  } else {
    const zoneWidth = 100 / 3;

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
      { width: zoneWidth, color: leftColor, label: leftLabel, range: `Até ${formatNumber(minBound)}` },
      { width: zoneWidth, color: middleColor, label: middleLabel, range: `${formatNumber(minBound)} a ${formatNumber(maxBound)}` },
      { width: zoneWidth, color: rightColor, label: rightLabel, range: `Acima de ${formatNumber(maxBound)}` }
    ];

    if (numValor <= minBound) {
      const range = minBound - displayMin || 1;
      const p = Math.max(0, (numValor - displayMin) / range);
      percentage = p * zoneWidth;
    } else if (numValor <= maxBound) {
      const range = maxBound - minBound || 1;
      const p = (numValor - minBound) / range;
      percentage = zoneWidth + p * zoneWidth;
    } else {
      const range = displayMax - maxBound || 1;
      const p = Math.min(1, (numValor - maxBound) / range);
      percentage = zoneWidth * 2 + p * zoneWidth;
    }
  }

  // Previne overflow de ponteiro
  percentage = Math.max(0, Math.min(100, percentage));

  const baseLabel = titulo || label.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const displayLabel = displayUnidade ? `${baseLabel} (${displayUnidade})` : baseLabel;
  
  return (
    <div className="flex flex-col w-full mb-10 font-sans">
      <div className="flex justify-between items-end mb-8">
        <span className="text-sm font-semibold text-gray-700">{displayLabel}</span>
      </div>

      <div className="relative w-full">
        {/* Barra Colorida Fixa Visualmente */}
        <div className="relative h-8 w-full rounded-md flex overflow-hidden shadow-sm bg-gray-200">
          {segments.map((seg, i) => (
            <div key={i} style={{ width: `${seg.width}%` }} className={`h-full flex flex-col justify-center items-center ${seg.color} border-r border-white/20 last:border-0`}>
              <span className="text-[10px] sm:text-xs font-bold text-white/95 uppercase tracking-wider truncate px-1 drop-shadow-sm">
                {seg.label}
              </span>
            </div>
          ))}
        </div>

        {/* Faixas Numéricas (Inferior) */}
        <div className="flex w-full mt-1.5">
          {segments.map((seg, i) => (
            <div key={i} style={{ width: `${seg.width}%` }} className="text-center px-1">
              <span className="text-[9px] sm:text-[10px] font-semibold text-gray-500 leading-tight block truncate" title={seg.range}>
                {seg.range}
              </span>
            </div>
          ))}
        </div>

        {/* Ponteiro (Valor Atual) */}
        <div 
          className="absolute flex flex-col items-center z-10 transition-all duration-1000 ease-out -translate-x-1/2" 
          style={{ left: `${percentage}%`, top: '-22px' }}
        >
          {/* CAIXA PRETA (Badge com o valor numérico) */}
          <span className="bg-slate-900 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">
            {isValorValido ? formatNumber(numValor) : '--'} {displayUnidade && <span className="font-normal text-gray-300 ml-0.5">{displayUnidade}</span>}
          </span>
          
          {/* TRIÂNGULO (Ponta da agulha em CSS puro apontando para baixo) */}
          <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-slate-900 mt-0.5"></div>
          
          {/* LINHA VERTICAL GUIA (Cruza a régua de cores para apontar os valores abaixo) */}
          <div className="w-0.5 h-10 bg-slate-900 -mt-0.5"></div>
        </div>
      </div>
    </div>
  );
}