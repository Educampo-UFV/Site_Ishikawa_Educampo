/**
 * @file page.tsx
 * @description Página principal de Diagnóstico (Hub 360º) do Educampo.
 * Consome os dados da 'useFazendaStore' para renderizar os indicadores de performance,
 * benchmarking, o resumo estratégico gerado pela IA e o diagrama de Ishikawa.
 * * TODO: [TEMPORÁRIO] Os cálculos de benchmarking estão sendo feitos no frontend.
 * Esta lógica deve ser migrada para o BFF/API assim que os endpoints de comparação
 * regional estiverem disponíveis.
 */

"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFazendaStore } from '@/store/useFazendaStore';
import { Navbar } from '@/components/ui/Navbar';
import { IshikawaDiagram } from '@/components/ui/IshikawaDiagram';
import { Acelerometro } from '@/components/ui/Acelerometro';
import { 
  TrendingUp, 
  Activity
} from 'lucide-react';

const TABS = [
  { id: 'ccs', label: 'CCS' },
  { id: 'producao_vaca', label: 'Produção/Vaca' },
  { id: 'producao_area', label: 'Produção/Área' },
  { id: 'producao_funcionario', label: 'Produção/Func.' },
  { id: 'preco_leite', label: 'Preço Leite' },
];

export default function DiagnosticoPage() {
  const router = useRouter();
  const { dadosFazenda, diagnosticoIA } = useFazendaStore();
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState(TABS[0].id);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Aguarda a montagem para evitar redirecionamento prematuro antes do Zustand hidratar os dados persistidos
    if (isMounted && !dadosFazenda) {
      router.push('/formulario');
    }
  }, [dadosFazenda, isMounted, router]);

  // Aguarda a hidratação do cliente para evitar erros do Next.js com dados persistidos
  if (!isMounted || !dadosFazenda) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="h-12 w-12 border-4 border-[#1973d3] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  /**
   * TODO: [LOGICA-TEMPORARIA] 
   * Cálculos baseados na referência da imagem image_1f931e.png
   */
  const getBenchmarkStatus = () => {
    return {
      producao: {
        label: dadosFazenda.producao_vaca >= 30 ? "Acima da Média" : "Atenção",
        color: dadosFazenda.producao_vaca >= 30 ? "text-green-600" : "text-amber-500"
      },
      qualidade: {
        label: dadosFazenda.ccs <= 200 ? "Padrão Ideal" : "Atenção",
        color: dadosFazenda.ccs <= 200 ? "text-green-600" : "text-amber-500"
      },
      mercado: {
        label: dadosFazenda.preco_leite >= (dadosFazenda.preco_referencia || 0) 
          ? "Competitivo" : "Abaixo do Mercado",
        color: dadosFazenda.preco_leite >= (dadosFazenda.preco_referencia || 0) 
          ? "text-green-600" : "text-amber-500"
      }
    };
  };

  const status = getBenchmarkStatus();

  // ============================================================================
  // LÓGICA DE DIAGNÓSTICO (Trazida da antiga tela diagnostico/page.tsx)
  // ============================================================================
  const rawData = diagnosticoIA?.indicadores?.[activeTab] || diagnosticoIA?.[activeTab];

  const processarDados = (data: any, tabId: string) => {
    if (!data) return null;

    if (data.ishikawa && data.ranking) return {
      ...data,
      valor_atual: (dadosFazenda as any)?.[tabId] || '--',
    };

    const ishikawa: any = { mao_de_obra: [], maquina: [], meio_ambiente: [], metodo: [], medida: [], material: [] };
    const praticas: string[] = [];

    if (data.causas && Array.isArray(data.causas)) {
      data.causas.forEach((item: any) => {
        const pilar = (item.pilar || '').toLowerCase();
        const causaObj = { causa: item.causa, pratica: item.pratica };
        
        if (pilar.includes('obra')) ishikawa.mao_de_obra.push(causaObj);
        else if (pilar.includes('maquina') || pilar.includes('máquina')) ishikawa.maquina.push(causaObj);
        else if (pilar.includes('ambiente')) ishikawa.meio_ambiente.push(causaObj);
        else if (pilar.includes('metodo') || pilar.includes('método')) ishikawa.metodo.push(causaObj);
        else if (pilar.includes('medida') || pilar.includes('medição') || pilar.includes('medicao')) ishikawa.medida.push(causaObj);
        else if (pilar.includes('material')) ishikawa.material.push(causaObj);

        if (item.pratica && !praticas.includes(item.pratica)) {
          praticas.push(item.pratica);
        }
      });
    }

    return {
      ...data,
      valor_atual: (dadosFazenda as any)?.[tabId] || '--',
      ishikawa,
      ranking: praticas.slice(0, 5)
    };
  };

  const processedData = processarDados(rawData, activeTab);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-8">
        
        {/* SEÇÃO 1: BENCHMARKING (TOP) */}
        <section aria-labelledby="benchmark-title">
          <h2 id="benchmark-title" className="text-xl font-bold text-[#003e7d] mb-4 flex items-center gap-2">
            <TrendingUp size={24} /> Benchmarking Regional
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card Produção */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Produção por Vaca</p>
              <div className="mt-2">
                {/* Nó de texto unificado para acessibilidade (Leitores de Tela) e Testes Estritos (A Lei) */}
                <span className="sr-only">{Number(dadosFazenda?.producao_vaca || 0).toFixed(1)} L/dia</span>
                
                {/* Renderização visual com tamanhos divididos (oculta da árvore de acessibilidade) */}
                <div aria-hidden="true" className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-800">{Number(dadosFazenda?.producao_vaca || 0).toFixed(1)}</span>
                  <span className="text-base font-normal text-gray-500">L/dia</span>
                </div>
              </div>
              <p className={`text-sm font-semibold mt-2 ${status.producao.color}`}>
                {status.producao.label}
              </p>
            </div>

            {/* Card Qualidade */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Qualidade do Leite</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-bold text-gray-800">CCS: {dadosFazenda?.ccs || 0}</span>
              </div>
              <p className={`text-sm font-semibold mt-2 ${status.qualidade.color}`}>
                {status.qualidade.label}
              </p>
            </div>

            {/* Card Preço */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">Preço Recebido</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-bold text-gray-800">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(dadosFazenda?.preco_leite || 0))}</span>
              </div>
              <p className={`text-sm font-semibold mt-2 ${status.mercado.color}`}>
                {status.mercado.label}
              </p>
            </div>
          </div>
        </section>

        {/* SEÇÃO 2: RESUMO ESTRATÉGICO IA (LARGURA TOTAL) */}
        <div className="w-full">
          
          <div className="bg-[#003e7d] text-white p-8 rounded-2xl shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold">Resumo Estratégico</h2>
                <Activity className="text-[#1973d3]" size={32} />
              </div>
              <p className="text-lg leading-relaxed text-blue-50">
                {diagnosticoIA?.resumo_geral?.visao_geral || diagnosticoIA?.resumo || "Carregando análise técnica..."}
              </p>
            </div>
          </div>

        </div>

        {/* SEÇÃO 3: DIAGNÓSTICO DETALHADO (ISHIKAWA) */}
        <section id="diagnostico" className="mt-4 flex flex-col gap-6">
          {/* Navegação de Indicadores - Estilo Stepper (Círculos e Linhas) */}
          <div className="flex flex-wrap md:flex-nowrap justify-center md:justify-between w-full max-w-5xl mx-auto gap-6 md:gap-0 border-b border-gray-300 pb-8 mb-4">
            {TABS.map((tab, index) => {
              const isActive = activeTab === tab.id;
              const isNextActive = index < TABS.length - 1 && activeTab === TABS[index + 1].id;
              
              return (
                <React.Fragment key={tab.id}>
                  {/* Card Circular */}
                  <div className="flex flex-col items-center gap-3 w-24 shrink-0 relative z-10">
                    <button
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        relative z-10 group flex items-center justify-center w-16 h-16 rounded-full font-black text-2xl transition-all duration-200 border
                        ${isActive
                          ? 'bg-[#1973d3] text-white border-[#003e7d] shadow-[inset_0_4px_8px_rgba(0,0,0,0.4)] translate-y-1'
                          : 'bg-white text-gray-600 border-gray-200 shadow-md hover:shadow-lg hover:border-[#1973d3] hover:-translate-y-1'
                        }
                      `}
                      aria-label={`Ver indicador ${tab.label}`}
                    >
                      {index + 1}
                    </button>
                    <span 
                      className={`text-center text-sm font-bold leading-tight transition-colors duration-200 ${
                        isActive ? 'text-[#003e7d]' : 'text-gray-500'
                      }`}
                      aria-hidden="true"
                    >
                      {tab.label}
                    </span>
                  </div>

                  {/* Linha Conectora (Oculta no Mobile) */}
                  {index < TABS.length - 1 && (
                    <div 
                      className={`
                        hidden md:block flex-grow h-[2px] mt-8 -mx-6 z-0 transition-colors duration-300
                        ${isActive ? 'bg-gradient-to-r from-[#1973d3] to-gray-200' : ''}
                        ${isNextActive ? 'bg-gradient-to-r from-gray-200 to-[#1973d3]' : ''}
                        ${!isActive && !isNextActive ? 'bg-gray-200' : ''}
                      `}
                      aria-hidden="true"
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {processedData ? (
            <div className="animate-in fade-in duration-500 space-y-8">
              {/* Painel de Diagnóstico do Indicador (Centro) */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Status (Acelerômetro) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center min-h-[200px]">
                  <span className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-2">Status</span>
                  <Acelerometro status={processedData.status || ''} />
                </div>

                {/* Textos da Análise (Centro - Ocupa 2 colunas) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 md:col-span-2 flex flex-col justify-center">
                  <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-800 p-1 rounded-md text-xs">IA</span>
                    Análise Estratégica
                  </h3>
                  <p className="text-gray-700 leading-relaxed text-sm md:text-base">
                    {processedData.textos_analise}
                  </p>
                </div>

                {/* Valor Atual */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                  <span className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-3">Valor Atual</span>
                  <div className="text-4xl font-black text-[#003e7d]">
                    {processedData.valor_atual}
                  </div>
                </div>
              </div>

              {/* Cards do Diagrama Ishikawa (Inferior) */}
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  Mapeamento de Causas (Ishikawa)
                </h2>
                <IshikawaDiagram data={processedData.ishikawa} />
              </div>

              {/* Ranking de Prioridade (Rodapé) */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-[#003e7d] mb-4">Plano de Ação - Top Prioridades</h2>
                {processedData.ranking && processedData.ranking.length > 0 ? (
                  <ol className="space-y-3">
                    {processedData.ranking.map((item: string, index: number) => (
                      <li key={index} className="flex items-start gap-3 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs shrink-0">
                          {index + 1}
                        </span>
                        <span className="text-gray-800 font-medium">{item}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-gray-500 italic text-sm">Nenhuma ação prioritária definida neste pilar.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-gray-100">
              <p className="text-gray-500">Selecione um indicador para visualizar o diagnóstico.</p>
            </div>
          )}
        </section>

      </main>
    </div>
  );
}