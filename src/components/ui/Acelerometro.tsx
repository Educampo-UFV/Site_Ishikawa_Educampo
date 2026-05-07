/**
 * @file src/components/ui/Acelerometro.tsx
 * @description Widget de diagnóstico completo em formato de velocímetro (Gauge Chart).
 * Renderiza o gráfico, o valor numérico, a unidade, os limites (thresholds) e a legenda.
 */

import React from 'react';

interface Thresholds {
  bom?: string;
  regular?: string;
  critico?: string;
}

interface AcelerometroProps {
  valor: number | string;
  unidade?: string;
  status: string;
  thresholds?: Thresholds;
  minimo?: number; 
  maximo?: number; 
}

export function Acelerometro({ 
  valor, 
  unidade, 
  status, 
  thresholds,
  minimo,
  maximo 
}: AcelerometroProps) {
  
  const allThresholdsStr = `${thresholds?.bom || ''} ${thresholds?.regular || ''} ${thresholds?.critico || ''}`;
  const numbers = allThresholdsStr.match(/-?\d+(\.\d+)?/g)?.map(Number) || [];
  const uniqueNumbers = Array.from(new Set(numbers)).sort((a, b) => a - b);
  
  const minBound = uniqueNumbers.length > 0 ? uniqueNumbers[0] : 200;
  const maxBound = uniqueNumbers.length > 1 ? uniqueNumbers[1] : 500;

  // Cálculo dinâmico dos extremos do gráfico baseado na distância entre os limites (thresholds)
  const diff = maxBound - minBound > 0 ? maxBound - minBound : maxBound * 0.5;
  const calcMinimo = minimo !== undefined ? minimo : Math.max(0, minBound - diff);
  const calcMaximo = maximo !== undefined ? maximo : maxBound + diff;
  const displayMin = Number.isInteger(calcMinimo) ? calcMinimo : Number(calcMinimo).toFixed(2);
  const displayMax = Number.isInteger(calcMaximo) ? calcMaximo : Number(calcMaximo).toFixed(2);

  const bomStr = thresholds?.bom || '';
  const criticoStr = thresholds?.critico || '';
  const isLowerBetter = bomStr.includes('<') || criticoStr.includes('>');

  let rotation = 0;
  
  switch (status?.toLowerCase()) {
    case 'bom':
    case 'positivo':
      rotation = isLowerBetter ? -55 : 55; 
      break;
    case 'regular':
    case 'atencao':
    case 'alerta':
      rotation = 0; 
      break;
    case 'critico':
    case 'negativo':
      rotation = isLowerBetter ? 55 : -55; 
      break;
  }

  const colorBom = '#22c55e';
  const colorRegular = '#f59e0b';
  const colorCritico = '#ef4444';

  const leftArcColor = isLowerBetter ? colorBom : colorCritico;
  const middleArcColor = colorRegular;
  const rightArcColor = isLowerBetter ? colorCritico : colorBom;

  return (
    <div className="flex flex-col items-center w-full max-w-xs font-sans">
      
      {/* 1. Topo: Gráfico SVG Interativo */}
      <div className="relative w-full max-w-[240px] overflow-visible mb-1 mt-4">
        {/* ViewBox ajustado para caber perfeitamente todos os números sem cortar */}
        <svg viewBox="0 0 200 125" className="w-full h-full overflow-visible">
          
          {/* ARCOS DE COR */}
          {/* Matemática do arco: Raio=75, Centro=(100, 95), Espessura=20.
              Os cortes estão exatamente a -25 e +25 graus do topo. */}
          <path d="M 25 95 A 75 75 0 0 1 68.3 27" fill="none" stroke={leftArcColor} strokeWidth="20" />
          <path d="M 68.3 27 A 75 75 0 0 1 131.7 27" fill="none" stroke={middleArcColor} strokeWidth="20" />
          <path d="M 131.7 27 A 75 75 0 0 1 175 95" fill="none" stroke={rightArcColor} strokeWidth="20" />

          {/* VALORES EXTREMOS (Base Esquerda e Direita - não rotacionam) */}
          <text x="25" y="120" textAnchor="middle" fontSize="11" fill="#6b7280" fontWeight="700">
            {displayMin}
          </text>
          <text x="175" y="120" textAnchor="middle" fontSize="11" fill="#6b7280" fontWeight="700">
            {displayMax}
          </text>

          {/* MARCADOR ESQUERDO (-25 graus) */}
          <g transform="rotate(-25, 100, 95)">
            {/* Traço separador (Radial) */}
            <line x1="100" y1="10" x2="100" y2="30" stroke="#374151" strokeWidth="2.5" />
            {/* Texto tangencial rotacionado com o grupo */}
            <text x="100" y="5" textAnchor="middle" fontSize="11" fill="#4b5563" fontWeight="800">
              {minBound}
            </text>
          </g>

          {/* MARCADOR DIREITO (+25 graus) */}
          <g transform="rotate(25, 100, 95)">
            {/* Traço separador (Radial) */}
            <line x1="100" y1="10" x2="100" y2="30" stroke="#374151" strokeWidth="2.5" />
            {/* Texto tangencial rotacionado com o grupo */}
            <text x="100" y="5" textAnchor="middle" fontSize="11" fill="#4b5563" fontWeight="800">
              {maxBound}
            </text>
          </g>

          {/* PONTEIRO (Agulha) */}
          {/* Eixo no centro do arco (100, 95) */}
          <g 
            transform={`translate(100, 95) rotate(${rotation})`} 
            className="transition-transform duration-1000 ease-out"
            style={{ filter: 'drop-shadow(0px 3px 2px rgba(0,0,0,0.3))' }}
          >
            {/* Corpo da agulha (atinge a base das cores) */}
            <polygon points="-3.5,0 3.5,0 0,-70" fill="#1f2937" />
            {/* Círculo base vazado */}
            <circle cx="0" cy="0" r="8" fill="#f8fafc" stroke="#1f2937" strokeWidth="4" />
          </g>
        </svg>
      </div>

      {/* 2. Legenda de Cores */}
      <div className="flex items-center justify-center gap-4 mt-1 mb-5 text-[11px] font-bold text-gray-600 uppercase tracking-wider">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#22c55e]"></span> BOM
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#f59e0b]"></span> REGULAR
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#ef4444]"></span> CRÍTICO
        </div>
      </div>

      {/* 3. Centro: Valor e Unidade */}
      <div className="bg-slate-50 border border-gray-200 rounded-2xl px-10 py-3 text-center min-w-[140px] shadow-sm">
        <div className="text-[2.5rem] leading-none font-black text-gray-900 tracking-tight">
          {valor}
        </div>
        {unidade && (
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mt-2">
            {unidade}
          </div>
        )}
      </div>

    </div>
  );
}