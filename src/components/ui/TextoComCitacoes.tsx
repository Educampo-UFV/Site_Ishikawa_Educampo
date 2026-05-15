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
  const [citacaoAtiva, setCitacaoAtiva] = useState<Raciocinio | null>(null);

  // Regex para encontrar padrões como [1], [2], [10]
  const regex = /(\[\d+\])/g;
  
  // Quebra a string em um array preservando as marcações
  const partes = texto.split(regex);

  return (
    <>
      <div className="text-lg leading-relaxed text-blue-50">
        {partes.map((parte, index) => {
          // Verifica se a parte atual é uma marcação (ex: "[1]")
          const match = parte.match(/\[(\d+)\]/);
          
          if (match) {
            const idCitacao = match[1]; // Extrai apenas o número "1"
            const raciocinioEncontrado = raciocinios.find(r => String(r.id) === idCitacao);

            // Se achou o raciocínio correspondente, renderiza como botão interativo
            if (raciocinioEncontrado) {
              return (
                <button
                  key={index}
                  onClick={() => setCitacaoAtiva(raciocinioEncontrado)}
                  className="inline-flex items-center justify-center mx-1 px-2 py-0.5 text-xs font-bold bg-[#1973d3] hover:bg-white text-white hover:text-[#003e7d] rounded cursor-pointer transition-colors shadow-sm align-super"
                  title="Ver análise técnica"
                >
                  {idCitacao}
                </button>
              );
            }
          }
          // Se não for citação, ou não tiver raciocínio, retorna o texto puro
          return <React.Fragment key={index}>{parte}</React.Fragment>;
        })}
      </div>

      {/* Modal de Análise Técnica */}
      {citacaoAtiva && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-bold text-[#003e7d] flex items-center gap-2">
                <BookOpen size={18} className="text-[#1973d3]" />
                Fundamento Técnico (Citação [{citacaoAtiva.id}])
              </h3>
              <button 
                onClick={() => setCitacaoAtiva(null)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 text-gray-700 text-sm leading-relaxed max-h-[70vh] overflow-y-auto">
              {citacaoAtiva.analise_tecnica}
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 text-right">
              <button
                onClick={() => setCitacaoAtiva(null)}
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