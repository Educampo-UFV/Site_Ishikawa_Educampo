/**
 * @file page.tsx
 * @description Página principal de Diagnóstico (Hub 360º) do Educampo.
 * Consome os dados da 'useFazendaStore' para renderizar os indicadores de performance,
 * benchmarking, o resumo estratégico gerado pela IA e o diagrama de Ishikawa.
 */

"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFazendaStore } from '@/store/useFazendaStore';
import { Navbar } from '@/components/ui/Navbar';
import { IshikawaDiagram } from '@/components/ui/IshikawaDiagram';
import { Acelerometro } from '@/components/ui/Acelerometro';
import { ImpactFactorBar } from '@/components/ui/ImpactFactorBar';
import { TextoComCitacoes } from '@/components/ui/TextoComCitacoes';
import { 
  TrendingUp, 
  Activity,
  TrendingDown,
  Minus,
  AlertTriangle
} from 'lucide-react';
import { StatusComparacao, BenchmarkingCardData } from '../../types/diagnostico';

export interface FatorImpacto {
  valor_atual: number;
  regras: {
    [key: string]: string; // Ex: { "bom": "< 200", "critico": "> 500" }
  };
}

const TABS = [
  { id: 'ccs', label: 'CCS' },
  { id: 'producao_vaca', label: 'Produção Média Diária' },
  { id: 'producao_area', label: 'Produção por Área' },
  { id: 'producao_funcionario', label: 'Produção por Funcionário' },
  { id: 'preco_leite', label: 'Preço do Leite' },
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

  // Dicionário visual para traduzir o status textual em Design Semântico
  const getStatusUI = (status: StatusComparacao) => {
    switch (status) {
      case 'positivo':
        return {
          bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200',
          icon: <TrendingUp size={24} className="text-green-600" />
        };
      case 'negativo':
        return {
          bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200',
          icon: <TrendingDown size={24} className="text-red-600" />
        };
      case 'alerta':
        return {
          bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200',
          icon: <AlertTriangle size={24} className="text-amber-600" />
        };
      case 'neutro':
      default:
        return {
          bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200',
          icon: <Minus size={24} className="text-gray-600" />
        };
    }
  };

  // Extração do array processado pelo BFF Global State (Segurança contra falhas com fallback para array vazio)
  const benchmarks: BenchmarkingCardData[] = diagnosticoIA?.benchmarking || [];

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
      fatores_impacto: data.fatores_impacto || {},
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
            <TrendingUp size={24} /> Benchmarkings
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {benchmarks.length > 0 ? (
              benchmarks.map((card, index) => {
                const ui = getStatusUI(card.status_comparacao);
                return (
                  <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">{card.titulo}</p>
                        {ui.icon}
                      </div>
                      <div className="mt-2">
                        <span className="sr-only">{card.valor_produtor} {card.unidade}</span>
                        <div aria-hidden="true" className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold text-gray-800">
                            {Number(card.valor_produtor).toLocaleString('pt-BR')}
                          </span>
                          <span className="text-base font-normal text-gray-500">{card.unidade}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${ui.bg} ${ui.text} ${ui.border}`}>
                        {card.mensagem_curta}
                      </span>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        {card.mensagem_detalhada} (Ref: {Number(card.valor_referencia).toLocaleString('pt-BR')} {card.unidade})
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500 italic md:col-span-3">Carregando dados de benchmarking...</p>
            )}
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
              {/* Mantemos compatibilidade com strings antigas (diagnosticoIA?.resumo) e suportamos o novo objeto */}
              {diagnosticoIA?.resumo_geral ? (
                <TextoComCitacoes 
                  texto={diagnosticoIA.resumo_geral.visao_geral} 
                  raciocinios={diagnosticoIA.resumo_geral.raciocinios} 
                />
              ) : (
                <p className="text-lg leading-relaxed text-blue-50">
                  {diagnosticoIA?.resumo || "Carregando análise técnica..."}
                </p>
              )}
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
                      className={`text-center text-sm font-bold leading-tight whitespace-nowrap transition-colors duration-200 ${
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
              {/* Linha 1: Status Atual e Fatores de Impacto */}
              <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6">
                {/* Coluna Esquerda: Acelerômetro */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center min-h-[200px] md:min-w-[360px]">
                  <span className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-4">Status Atual</span>
                  <Acelerometro 
                    valor={processedData.valor_atual} 
                    unidade={processedData.unidade || ''} 
                    status={processedData.status || ''} 
                    thresholds={processedData.thresholds} 
                  />
                </div>

                {/* Coluna Direita: Fatores de Impacto */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center min-h-[200px] min-w-0">
                  <h3 className="font-bold text-gray-800 mb-5 border-b border-gray-100 pb-2">Fatores de Impacto</h3>
                  <div className="flex-1 flex flex-col justify-center w-full lg:px-4">
                    {(() => {
                      const fatores = processedData.fatores_impacto || {};
                      const fatoresKeys = Object.keys(fatores);
                      
                      if (fatoresKeys.length === 0) {
                        return <p className="text-sm text-gray-500 italic text-center">Nenhum fator de impacto detalhado para este indicador.</p>;
                      }

                      return Object.entries(fatores).map(([chave, dadosFator]) => {
                        const fator = dadosFator as FatorImpacto;
                        return (
                          <ImpactFactorBar 
                            key={chave} 
                            label={chave} 
                            valor={fator.valor_atual}
                            thresholds={fator.regras as any} 
                          />
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>

              {/* Linha 2: Análise Estratégica */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
                <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wide">IA</span>
                  Análise Estratégica
                </h3>
                <p className="text-gray-700 leading-relaxed text-sm md:text-base">
                  {processedData.textos_analise || "Análise estratégica em processamento."}
                </p>
              </div>

              {/* Cards do Diagrama Ishikawa (Inferior) */}
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  Mapeamento de Causas (Ishikawa)
                </h2>
                <IshikawaDiagram data={processedData.ishikawa} impactoPilares={processedData.impacto_pilares} />
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