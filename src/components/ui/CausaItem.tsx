/**
 * @file src/components/ui/CausaItem.tsx
 * @description Lógica de renderização de um item de causa com popup expansível.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, Flag, X, ChevronDown } from 'lucide-react';

/**
 * @description Propriedades para configurar a exibição de uma causa e suas práticas associadas.
 * @property {string} resumo_pratica - Descrição da causa do problema processada no backend.
 * @property {string} [pratica] - Ação recomendada pela IA associada à causa.
 * @property {string} [severidade] - Nível de severidade retornado pela IA.
 * @property {string} [analise] - Detalhamento textual vindo da análise técnica avançada.
 * @property {boolean} [isAccordion] - Se renderiza em formato accordion (dentro do Modal) em vez de popover card (dentro do Grid).
 * @property {boolean} [defaultExpanded] - Se a lógica da interface dita que o accordion inicia expandido.
 * @property {(e: React.MouseEvent) => void} [onClickCausa] - Callback acionado ao clicar na causa principal.
 */
interface CausaItemProps {
  resumo_pratica: string;
  pratica?: string;
  severidade?: string;
  analise?: string;
  isAccordion?: boolean;
  defaultExpanded?: boolean;
  onClickCausa?: (e: React.MouseEvent) => void;
}

/**
 * @description Gerencia os estados locais de visibilidade (`mostrarAnalise`, `isExpanded`) com base nas propriedades externas.
 * Executa uma mutação visual alterando o DOM para formatar Accordion condicionalmente com base na flag `isAccordion`.
 * Processa o texto de severidade recebido para extrair cor semântica baseada nas lógicas de Design System usando expressões RegEx/Includes.
 * @param {CausaItemProps} props - Propriedades mapeadas da causa individual.
 * @returns {React.JSX.Element} O fragmento iterável da linha (popover ou accordion).
 */
export const CausaItem: React.FC<CausaItemProps> = ({ resumo_pratica, pratica, severidade, analise, isAccordion, defaultExpanded, onClickCausa }) => {
  const [mostrarAnalise, setMostrarAnalise] = useState(false);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded || false);

  useEffect(() => {
    if (isAccordion && defaultExpanded !== undefined) {
      setIsExpanded(defaultExpanded);
    }
  }, [defaultExpanded, isAccordion]);

  /**
   * @description Mapeia a palavra string de severidade para códigos de cores de 
   * Design System aplicadas no botão/flag.
   * @param sev Classificação de severidade textual vindo do backend.
   * @returns A classe de cores correspondente ou estilo cinza default.
   */
  const getSeveridadeColor = (sev?: string) => {
    const s = sev?.toLowerCase() || '';
    if (s.includes('alta') || s.includes('critica') || s.includes('critico')) return 'text-red-500 bg-red-50 hover:bg-red-100 border-red-200';
    if (s.includes('media') || s.includes('média') || s.includes('atencao') || s.includes('atenção')) return 'text-amber-500 bg-amber-50 hover:bg-amber-100 border-amber-200';
    if (s.includes('baixa') || s.includes('monitorar')) return 'text-blue-500 bg-blue-50 hover:bg-blue-100 border-blue-200';
    return 'text-gray-500 bg-gray-50 hover:bg-gray-100 border-gray-200';
  };

  const colorClass = getSeveridadeColor(severidade);

  // Modo Expandido (Accordion dentro do Modal do Pilar)
  if (isAccordion) {
    return (
      <div className="relative flex flex-col gap-1 my-2">
        <div 
          className="flex items-center justify-between gap-2 p-3 bg-white border border-gray-200 rounded-lg shadow-sm cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-start gap-2 flex-1">
            <span className="text-sm text-gray-800 font-medium leading-tight flex-1">{resumo_pratica}</span>
            {severidade && (
              <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs font-bold shrink-0 ${colorClass}`}>
                <Flag size={12} strokeWidth={3} />
                <span className="hidden sm:inline capitalize">{severidade}</span>
              </div>
            )}
          </div>
          <ChevronDown 
            size={18} 
            className={`text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
          />
        </div>
        
        {isExpanded && (
          <div className="p-4 bg-white border border-gray-100 rounded-lg shadow-inner mt-1 animate-in slide-in-from-top-2 fade-in">
            {pratica && (
              <div className="bg-blue-50 p-3 rounded border border-blue-100 text-sm text-blue-800 mb-4">
                <span className="font-bold block mb-1">Ação Recomendada:</span>
                {pratica}
              </div>
            )}
            {analise && (
              <div>
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                  <AlertCircle size={14} className={colorClass.split(' ')[0]} />
                  Análise da Causa
                </h4>
                <p className="text-sm text-gray-600 leading-relaxed">{analise}</p>
              </div>
            )}
            {!pratica && !analise && (
               <p className="text-sm text-gray-500 italic">Nenhum detalhe adicional fornecido.</p>
            )}
          </div>
        )}
      </div>
    );
  }

  // Modo Compacto (Cards Iniciais)
  return (
    <div className="relative flex flex-col gap-1 my-2">
      <div 
        className="flex items-start justify-between gap-2 p-2 bg-white border border-gray-100 rounded-lg shadow-sm cursor-pointer hover:border-blue-300 transition-colors"
        onClick={onClickCausa}
      >
        <span className="text-sm text-gray-700 font-medium leading-tight">{resumo_pratica}</span>
        
        {/* Flag de Severidade (Botão) */}
        {severidade && analise && (
          <button
            onClick={(e) => { e.stopPropagation(); setMostrarAnalise(true); }}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs font-bold transition-colors shrink-0 ${colorClass}`}
            title={`Severidade: ${severidade} - Clique para ver análise`}
          >
            <Flag size={12} strokeWidth={3} />
            <span className="hidden sm:inline capitalize">{severidade}</span>
          </button>
        )}
      </div>

      {/* Modal / Popover da Análise */}
      {mostrarAnalise && (
        <>
          {/* Overlay invisível para fechar ao clicar fora */}
          <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setMostrarAnalise(false); }} />
          <div 
            className="absolute top-full right-0 z-50 mt-1 w-64 md:w-72 bg-white rounded-xl shadow-xl border border-gray-200 p-4 animate-in fade-in slide-in-from-top-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-2">
              <h4 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                <AlertCircle size={14} className={colorClass.split(' ')[0]} />
                Análise da Causa
              </h4>
              <button onClick={(e) => { e.stopPropagation(); setMostrarAnalise(false); }} className="text-gray-400 hover:text-red-500 transition-colors">
                <X size={16} />
              </button>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed mb-3">{analise}</p>
            {pratica && (
              <div className="bg-blue-50 p-2 rounded border border-blue-100 text-xs text-blue-800">
                <span className="font-bold block mb-0.5">Ação Recomendada:</span>
                {pratica}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};