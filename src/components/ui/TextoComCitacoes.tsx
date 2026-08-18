/**
 * @file src/components/ui/TextoComCitacoes.tsx
 * @description Algoritmo de Regex em string e conversão para nós HTML (botões e tooltips).
 */

'use client';

import React, { useState } from 'react';
import { X, BookOpen } from 'lucide-react';

/**
 * @description Contrato para mapear o id da String de Citação.
 * @property {string | number} id - O Id referenciado como gancho do texto (ex: `1`).
 * @property {string} analise_tecnica - O subtexto completo extraído associado àquele id.
 */
interface Raciocinio {
  id: string | number;
  fontes?: string[];
  analise_tecnica: string;
}

/**
 * @description Argumentos repassados para a varredura primária do componente.
 * @property {string} texto - Texto longo contendo marcações de Regex entre colchetes a ser analisado.
 * @property {Raciocinio[]} [raciocinios] - O array correspondente indexado de chaves e detalhes.
 */
interface TextoComCitacoesProps {
  texto: string;
  raciocinios?: Raciocinio[];
}

/**
 * @description Escaneia o bloco de string usando `split(regex)` e isolando em fragmentos.
 * Se há casamento numérico (`[1]`), injeta um HTML Elemento Button no DOM; caso contrário, joga o React Fragment do texto bruto, preservando assim o fluxo contínuo do parágrafo.
 * @param {TextoComCitacoesProps} props - Propriedades iteradas.
 * @returns {React.JSX.Element} Documento HTML dinâmico com eventos em hooks que ativam Modal Flutuante para os botões recriados.
 */
export const TextoComCitacoes: React.FC<TextoComCitacoesProps> = ({ texto, raciocinios = [] }) => {
  const [citacoesAtivas, setCitacoesAtivas] = useState<Raciocinio[] | null>(null);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [isExpandedText, setIsExpandedText] = useState(false);

  // Regex para encontrar padrões de blocos como [1], [1, 2], [1, 2, 3]
  const regex = /(\[[\d,\s]+\])/g;
  
  // Quebra a string em um array preservando as marcações
  const partes = texto.split(regex);

  return (
    <>
      <div className={`text-sm sm:text-base md:text-lg leading-relaxed text-blue-50 transition-all ${!isExpandedText ? 'line-clamp-6' : ''}`}>
        {partes.map((parte, index) => {
          // Verifica se a parte atual é um bloco de marcação (ex: "[1, 2]")
          const match = parte.match(/\[([\d,\s]+)\]/);
          
          if (match) {
            // Extrai os IDs removendo os espaços e busca as fontes relacionadas
            const ids = match[1].split(',').map(id => id.trim());
            const raciociniosEncontrados = raciocinios.filter(r => ids.includes(String(r.id)));

            // Se achou os raciocínios correspondentes, renderiza como botão interativo com ícone
            if (raciociniosEncontrados.length > 0) {
              return (
                <button
                  key={index}
                  onClick={() => setCitacoesAtivas(raciociniosEncontrados)}
                  className="inline-flex items-center justify-center mx-1 px-1.5 py-0.5 text-sm bg-yellow-100/10 hover:bg-yellow-400 text-yellow-200 hover:text-yellow-900 rounded-md cursor-pointer transition-all shadow-sm align-super border border-yellow-200/30"
                  title="Ver embasamento deste trecho"
                >
                  💡
                </button>
              );
            }
          }
          // Se não for citação, ou não tiver raciocínio, retorna o texto puro
          return <React.Fragment key={index}>{parte}</React.Fragment>;
        })}
      </div>

      {/* Botão de expansão "Ver mais" / "Ver menos" */}
      <div className="mt-2">
        <button
          type="button"
          onClick={() => setIsExpandedText(!isExpandedText)}
          className="text-xs sm:text-sm font-bold text-blue-200 hover:text-white underline underline-offset-4 transition-colors cursor-pointer inline-flex items-center gap-1 focus:outline-none"
          aria-expanded={isExpandedText}
        >
          {isExpandedText ? 'Ver menos' : 'Ver mais...'}
        </button>
      </div>

      {/* Accordion Retrátil do Embasamento Técnico */}
      {raciocinios.length > 0 && (
        <div className="mt-6 sm:mt-8 border-t border-[#1973d3]/30 pt-4">
          <button 
            onClick={() => setIsAccordionOpen(!isAccordionOpen)}
            className="flex items-center gap-2 text-xs sm:text-sm font-bold text-blue-200 hover:text-white transition-colors w-full outline-none focus-visible:ring-2 focus-visible:ring-[#1973d3] rounded"
          >
            <span className={`transition-transform duration-300 ${isAccordionOpen ? 'rotate-180' : ''}`}>▼</span>
            Ver Embasamento Técnico
          </button>
          
          {isAccordionOpen && (
            <div className="mt-4 sm:mt-5 space-y-3 sm:space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              {raciocinios.map((raciocinio, index) => (
                <div key={raciocinio.id} className={`flex flex-col gap-1.5 ${index > 0 ? 'border-t border-[#1973d3]/20 pt-3 sm:pt-4' : ''}`}>
                  <p className="text-xs sm:text-sm text-blue-50 leading-relaxed">
                    {raciocinio.analise_tecnica}
                  </p>
                  {raciocinio.fontes && raciocinio.fontes.length > 0 && (
                    <span className="text-[11px] sm:text-xs text-blue-200/70 italic font-medium">
                      Baseado em: {raciocinio.fontes.join(', ')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal de Análise Técnica (Agrupada) */}
      {citacoesAtivas && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-[#003e7d] flex items-center gap-2">
                <BookOpen size={18} className="text-[#1973d3]" />
                Fundamento Técnico
              </h3>
              <button 
                onClick={() => setCitacoesAtivas(null)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 text-gray-700 text-sm leading-relaxed max-h-[70vh] overflow-y-auto">
              {citacoesAtivas.map((citacao, idx) => (
                <div key={citacao.id} className={idx > 0 ? "mt-4 pt-4 border-t border-gray-100" : ""}>
                  <p>{citacao.analise_tecnica}</p>
                </div>
              ))}
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 text-right">
              <button
                onClick={() => setCitacoesAtivas(null)}
                className="px-4 py-2 bg-[#1973d3] text-white text-sm font-medium rounded-lg hover:bg-[#003e7d] transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};