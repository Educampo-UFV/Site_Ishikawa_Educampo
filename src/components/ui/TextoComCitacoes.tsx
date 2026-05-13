/**
 * @file src/components/ui/TextoComCitacoes.tsx
 * @description Componente responsável por ler o texto da IA (visao_geral),
 * identificar marcações de citação (ex: [1], [2]) via Regex, e substituí-las
 * por botões interativos. Ao clicar, exibe um Modal com a analise_tecnica respectiva.
 */

'use client';

import React, { useState } from 'react';
import { X, BookOpen } from 'lucide-react';

interface Raciocinio {
  id: string | number;
  analise_tecnica: string;
}

interface TextoComCitacoesProps {
  texto: string;
  raciocinios?: Raciocinio[];
}

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