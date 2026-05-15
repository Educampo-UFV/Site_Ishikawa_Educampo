/**
 * @file src/components/ui/Acelerometro.tsx
 * @description Implementa a renderização do Acelerômetro usando SVG.
 */

import React from 'react';

interface Thresholds {
  bom?: string;
  regular?: string;
  critico?: string;
  bom_alto?: string;
  bom_baixo?: string;
  critico_alto?: string;
  critico_baixo?: string;
  direcao_otimizacao?: string;
}

/**
 * @description Propriedades para renderização do componente Acelerometro.
 * @property {number | string} valor - Valor atual a ser exibido e apontado pela agulha.
 * @property {string} [unidade] - Unidade de medida associada ao valor.
 * @property {string} status - Status do indicador para fallback da cor do marcador.
 * @property {Thresholds} [thresholds] - Limites lógicos para cálculo das zonas percentuais de cor.
 * @property {number} [minimo] - Valor mínimo explícito do gráfico.
 * @property {number} [maximo] - Valor máximo explícito do gráfico.
 */
interface AcelerometroProps {
  valor: number | string;
  unidade?: string;
  status: string;
  thresholds?: Thresholds;
  minimo?: number; 
  maximo?: number; 
}

/**
 * @description Calcula matematicamente a rotação contínua da agulha usando proporcionalidade aos arcos
 * SVG e distribui os offsets baseando-se nos valores contidos nas props (ou fallback dinâmico).
 * @param {AcelerometroProps} props - Propriedades do componente.
 * @returns {React.JSX.Element} Estrutura SVG e HTML renderizando o acelerômetro.
 */
export function Acelerometro({ 
  valor, 
  unidade, 
  status, 
  thresholds,
  minimo,
  maximo 
}: AcelerometroProps) {
  
  const bomStr = thresholds?.bom || thresholds?.bom_alto || thresholds?.bom_baixo || '';
  const criticoStr = thresholds?.critico || thresholds?.critico_alto || thresholds?.critico_baixo || '';
  const regularStr = thresholds?.regular || '';
  const direcao = thresholds?.direcao_otimizacao;

  const allThresholdsStr = `${bomStr} ${regularStr} ${criticoStr}`;
  const numbers = allThresholdsStr.match(/-?\d+(\.\d+)?/g)?.map(Number) || [];
  const uniqueNumbers = Array.from(new Set(numbers)).sort((a, b) => a - b);
  
  const minBound = uniqueNumbers.length > 0 ? uniqueNumbers[0] : 200;
  const maxBound = uniqueNumbers.length > 1 ? uniqueNumbers[uniqueNumbers.length - 1] : (uniqueNumbers.length === 1 ? (uniqueNumbers[0] === 0 ? 100 : uniqueNumbers[0] * 1.5) : 500);

  // Usamos as margens fornecidas pela API, ou criamos um fallback
  const diff = maxBound - minBound > 0 ? maxBound - minBound : maxBound * 0.5;
  const calcMinimo = minimo !== undefined ? Number(minimo) : Math.max(0, minBound - diff);
  const calcMaximo = maximo !== undefined ? Number(maximo) : maxBound + diff;
  const displayMin = Number.isInteger(calcMinimo) ? calcMinimo : Number(calcMinimo).toFixed(2);
  const displayMax = Number.isInteger(calcMaximo) ? calcMaximo : Number(calcMaximo).toFixed(2);

  // Determinação clara de cor baseada na diretriz da API, se existir
  const isLowerBetter = direcao ? direcao === 'menor_melhor' : (bomStr.includes('<') || bomStr.includes('&lt;') || criticoStr.includes('>') || criticoStr.includes('&gt;'));

  // Lógica Matemática Contínua: Faz a agulha varrer proporcionalmente o arco inteiro
  let rotation = 0;
  const val = Number(valor);
  
  if (!isNaN(val)) {
    if (val <= minBound) {
      // Zona Esquerda (Ângulos de -90 a -25 graus)
      const range = minBound - calcMinimo || 1;
      const p = Math.max(0, (val - calcMinimo) / range);
      rotation = -90 + (p * 65);
    } else if (val <= maxBound) {
      // Zona Central (Ângulos de -25 a +25 graus)
      const range = maxBound - minBound || 1;
      const p = (val - minBound) / range;
      rotation = -25 + (p * 50);
    } else {
      // Zona Direita (Ângulos de +25 a +90 graus)
      const range = calcMaximo - maxBound || 1;
      const p = Math.min(1, (val - maxBound) / range);
      rotation = 25 + (p * 65);
    }
  } else {
    // Fallback caso seja um texto que não é número
    if (status?.toLowerCase() === 'bom' || status?.toLowerCase() === 'positivo') rotation = isLowerBetter ? -55 : 55;
    else if (status?.toLowerCase() === 'critico' || status?.toLowerCase() === 'negativo') rotation = isLowerBetter ? 55 : -55;
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