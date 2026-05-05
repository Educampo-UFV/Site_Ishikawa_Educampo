/**
 * @file page.tsx
 * @description Página principal do Dashboard Central do Educampo.
 * Consome os dados da 'useFazendaStore' para renderizar os indicadores de performance,
 * benchmarking e o resumo estratégico gerado pela IA.
 * * TODO: [TEMPORÁRIO] Os cálculos de benchmarking estão sendo feitos no frontend.
 * Esta lógica deve ser migrada para o BFF/API assim que os endpoints de comparação
 * regional estiverem disponíveis.
 */

"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useFazendaStore } from '@/store/useFazendaStore';
import { Navbar } from '@/components/ui/Navbar';
import { 
  TrendingUp, 
  Droplets, 
  DollarSign, 
  ChevronRight, 
  Activity, 
  Settings, 
  PlayCircle 
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { dadosFazenda, diagnosticoIA } = useFazendaStore();
  const [isMounted, setIsMounted] = useState(false);

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

        {/* SEÇÃO 2: RESUMO IA E ATALHOS (DIVIDIDO) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Lado Esquerdo: Resumo Geral IA */}
          <div 
            onClick={() => router.push('/diagnostico')}
            className="group cursor-pointer bg-[#003e7d] text-white p-8 rounded-2xl shadow-lg hover:bg-[#002d5a] transition-all flex flex-col justify-between"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && router.push('/diagnostico')}
          >
            <div>
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold">Resumo Estratégico</h2>
                <Activity className="text-[#1973d3]" size={32} />
              </div>
              <p className="text-lg leading-relaxed text-blue-50">
                {diagnosticoIA?.resumo_geral?.visao_geral || diagnosticoIA?.resumo || "Carregando análise técnica..."}
              </p>
            </div>
            <div className="mt-8 flex items-center gap-2 font-semibold text-blue-200 group-hover:text-white transition-colors">
              Ver análise completa <ChevronRight size={20} />
            </div>
          </div>

          {/* Lado Direito: Atalhos Rápidos */}
          <section className="grid grid-cols-2 grid-rows-2 gap-4">
            {/* Atalho Principal: Diagnóstico */}
            <Link 
              href="/diagnostico"
              className="col-span-2 bg-white border-2 border-gray-100 p-6 rounded-2xl flex items-center justify-between hover:border-[#1973d3] hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-[#1973d3] rounded-xl group-hover:bg-[#1973d3] group-hover:text-white transition-colors">
                  <Activity size={28} />
                </div>
                <div className="text-left">
                  <span className="block font-bold text-gray-800 text-lg">Análise Ishikawa</span>
                  <span className="text-sm text-gray-500">Causas e efeitos detalhados</span>
                </div>
              </div>
              <ChevronRight className="text-gray-400" />
            </Link>

            {/* Atalho Simulação */}
            <Link 
              href="/simulacao"
              className="bg-white border-2 border-gray-100 p-6 rounded-2xl flex flex-col gap-3 items-start hover:border-[#1973d3] hover:shadow-md transition-all group"
            >
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <PlayCircle size={24} />
              </div>
              <span className="font-bold text-gray-800">Simular Cenários</span>
            </Link>

            {/* Atalho Configurações (Edição) */}
            <Link 
              href="/formulario"
              className="bg-white border-2 border-gray-100 p-6 rounded-2xl flex flex-col gap-3 items-start hover:border-[#1973d3] hover:shadow-md transition-all group"
            >
              <div className="p-2 bg-gray-50 text-gray-600 rounded-lg group-hover:bg-gray-600 group-hover:text-white transition-colors">
                <Settings size={24} />
              </div>
              <span className="font-bold text-gray-800">Configurar Dados</span>
            </Link>
          </section>

        </div>
      </main>
    </div>
  );
}