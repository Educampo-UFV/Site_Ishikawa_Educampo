/**
 * @file src/components/ui/IshikawaDiagram.tsx
 * @description Lógica de distribuição das categorias em layout de Grid com sistema de Modais.
 */

import React, { useState } from 'react';
import { IshikawaItem, IshikawaCategorias } from '../../types/diagnostico';
import { CausaItem } from './CausaItem';

/**
 * @description Objeto tipado utilizado para injetar a visão em blocos do método Ishikawa.
 * @property {IshikawaCategorias} data - Categorias padronizadas e mapeadas em listas de itens.
 * @property {Record<string, number>} [impactoPilares] - Tabela hash extra opcional baseada nos cálculos parciais da API.
 */
interface IshikawaProps {
  data: IshikawaCategorias;
  impactoPilares?: Record<string, number>;
}

/**
 * @description Trata o objeto `data` iterando com um `map` sob a árvore dos 6 Ms clássicos da metodologia.
 * Mantém a memória `selectedCategory` na Store Local baseando o state React para disparar overlays de tela 
 * Modal caso uma das listagens do grid seja selecionada pelo usuário.
 * @param {IshikawaProps} props - Propriedades requeridas no diagrama.
 * @returns {React.JSX.Element} Composição iterada do Grid injetando os subcomponentes filho `CausaItem`.
 */
export const IshikawaDiagram: React.FC<IshikawaProps> = ({ data, impactoPilares }) => {
  const [selectedCategory, setSelectedCategory] = useState<{ 
    category: { id: string, title: string, items: IshikawaItem[] }, 
    initialCauseIndex?: number 
  } | null>(null);

  /**
   * @description Localiza, a prova de falhas de digitação ('obra', 'mão'),
   * o valor exato de distribuição percentual associado ao pilar iterado atualmente.
   * @param categoryId Chave de ID nativa estrita aos 6M's.
   * @returns Valor em Number caso exista atribuição no processamento da API, undefined caso não.
   */
  const getImpacto = (categoryId: string) => {
    if (!impactoPilares) return undefined;
    
    const entries = Object.entries(impactoPilares);
    for (const [key, value] of entries) {
      const pilarLower = key.toLowerCase();
      if (categoryId === 'mao_de_obra' && pilarLower.includes('obra')) return value;
      if (categoryId === 'maquina' && (pilarLower.includes('maquina') || pilarLower.includes('máquina'))) return value;
      if (categoryId === 'meio_ambiente' && pilarLower.includes('ambiente')) return value;
      if (categoryId === 'metodo' && (pilarLower.includes('metodo') || pilarLower.includes('método'))) return value;
      if (categoryId === 'medida' && (pilarLower.includes('medida') || pilarLower.includes('medição') || pilarLower.includes('medicao'))) return value;
      if (categoryId === 'material' && pilarLower.includes('material')) return value;
    }
    return undefined;
  };

  const categories = [
    { id: 'mao_de_obra', title: 'Mão de Obra', items: data?.mao_de_obra || [], impacto: getImpacto('mao_de_obra') },
    { id: 'maquina', title: 'Máquina', items: data?.maquina || [], impacto: getImpacto('maquina') },
    { id: 'meio_ambiente', title: 'Meio Ambiente', items: data?.meio_ambiente || [], impacto: getImpacto('meio_ambiente') },
    { id: 'metodo', title: 'Método', items: data?.metodo || [], impacto: getImpacto('metodo') },
    { id: 'medida', title: 'Medida', items: data?.medida || [], impacto: getImpacto('medida') },
    { id: 'material', title: 'Material', items: data?.material || [], impacto: getImpacto('material') },
  ];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div 
            key={cat.id} 
            className="p-5 border border-gray-200 rounded-xl shadow-sm bg-white hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedCategory({ category: cat })}
            title="Clique para ver os detalhes e práticas recomendadas"
          >
            <div className="flex justify-between items-center mb-3 border-b border-gray-100 pb-2">
              <h3 className="font-bold text-lg text-primary">{cat.title}</h3>
              {cat.impacto !== undefined && (
                <span className="font-bold text-primary bg-blue-50 px-2 py-0.5 rounded-md text-sm">
                  {Number(cat.impacto).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1 w-full">
              {cat.items.length > 0 ? (
                cat.items.map((item, idx) => (
                  <CausaItem 
                    key={idx} 
                    resumo_pratica={(item as any).resumo_pratica || (item as any).causa} 
                    pratica={item.pratica} 
                    severidade={(item as any).severidade} 
                    analise={(item as any).analise} 
                    onClickCausa={(e) => {
                      e.stopPropagation();
                      setSelectedCategory({ category: cat, initialCauseIndex: idx });
                    }}
                  />
                ))
              ) : (
                <div className="text-gray-400 text-sm italic px-2 py-1">Nenhuma causa associada</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedCategory(null)}>
          <div 
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-primary">{selectedCategory.category.title}</h2>
              <button 
                onClick={() => setSelectedCategory(null)}
                className="text-gray-500 hover:text-gray-800 transition-colors p-1"
                title="Fechar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {selectedCategory.category.items.length > 0 ? (
                <div className="space-y-4">
                  {selectedCategory.category.items.map((item, idx) => (
                    <CausaItem 
                      key={idx} 
                      resumo_pratica={(item as any).resumo_pratica || (item as any).causa} 
                      pratica={item.pratica} 
                      severidade={(item as any).severidade} 
                      analise={(item as any).analise} 
                      isAccordion={true}
                      defaultExpanded={selectedCategory.initialCauseIndex === idx}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic text-center py-8">Nenhuma causa associada a este pilar.</p>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-200 text-right bg-fundo rounded-b-xl">
              <button 
                onClick={() => setSelectedCategory(null)}
                className="bg-primary hover:opacity-90 text-white px-6 py-2 rounded-lg transition-colors font-medium"
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
