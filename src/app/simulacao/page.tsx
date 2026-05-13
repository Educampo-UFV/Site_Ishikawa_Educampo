/**
 * @file src/app/simulacao/page.tsx
 * @description Dashboard de Simulação Interativa (What-If Analysis).
 * Permite ao produtor alterar variáveis em tempo real (Painel Esquerdo) e 
 * visualizar o impacto em 9 indicadores cruciais (Painel Central), comparando
 * contra linhas de base (Cenários: Inferior, Intermediário, Superior) sem custos de API.
 */

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Navbar } from '@/components/ui/Navbar';
import { useFazendaStore } from '@/store/useFazendaStore';
import { TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react';
import Link from 'next/link';

/**
 * @description Renderiza um gráfico de barra comparativo puro, sem dependências.
 * Calcula a escala proporcionalmente aos valores fornecidos para alinhar as barras.
 * @param titulo Título exibido acima das barras.
 * @param valorSimulado O valor resultante da simulação em tempo real.
 * @param valorReferencia O valor base para comparação do cenário.
 * @param unidade A unidade de medida (ex: Litros, R$).
 * @param inverterCores Se verdadeiro, barras menores ganham cores positivas (ex: CCS).
 */
const BarChartSimulacao = ({ 
  titulo, 
  valorSimulado, 
  valorReferencia, 
  unidade, 
  inverterCores = false // Ex: Para CCS, menor é melhor (inverter = true)
}: { 
  titulo: string, valorSimulado: number, valorReferencia: number, unidade: string, inverterCores?: boolean 
}) => {
  // Encontra o teto para calcular a altura percentual (100% da barra)
  const maxVal = Math.max(valorSimulado, valorReferencia, 1); 
  const alturaSimulado = `${(valorSimulado / maxVal) * 100}%`;
  const alturaReferencia = `${(valorReferencia / maxVal) * 100}%`;

  // Lógica de cores: Verde (Melhor), Vermelho (Pior), Cinza (Igual)
  let corBarraSimulada = 'bg-gray-400';
  let corTextoSimulado = 'text-gray-600';

  if (valorSimulado !== valorReferencia) {
    const isMelhor = inverterCores ? valorSimulado < valorReferencia : valorSimulado > valorReferencia;
    corBarraSimulada = isMelhor ? 'bg-green-500' : 'bg-red-500';
    corTextoSimulado = isMelhor ? 'text-green-600' : 'text-red-600';
  }

  // Cálculos do Indicador Percentual (Top Right)
  const diff = valorSimulado - valorReferencia;
  const pct = valorReferencia > 0 ? (diff / valorReferencia) * 100 : 0;
  
  let indicatorColor = 'text-gray-500 bg-gray-100';
  let prefix = '';
  let Icon = Minus;

  if (diff > 0) {
    Icon = TrendingUp;
    prefix = '+';
    indicatorColor = inverterCores ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50';
  } else if (diff < 0) {
    Icon = TrendingDown;
    prefix = '-';
    indicatorColor = inverterCores ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50';
  }

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col h-64 relative">
      {/* Badge Indicador de Diferença Percentual */}
      <div 
        className={`absolute top-3 right-3 flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${indicatorColor}`}
        title="Diferença em relação à referência"
      >
        <Icon size={12} strokeWidth={2.5} />
        <span>{prefix}{Math.abs(pct).toFixed(1)}%</span>
      </div>

      <h3 className="text-sm font-bold text-gray-700 text-center mb-4 px-10">{titulo}</h3>
      
      {/* Container das Barras (Cresce de baixo para cima) */}
      <div className="flex-1 flex items-end justify-center gap-6 pb-2">
        {/* Barra Simulada (Em Tempo Real) */}
        <div className="flex flex-col items-center justify-end w-16 group h-full">
          <span className={`text-xs font-bold mb-1 ${corTextoSimulado}`}>
            {valorSimulado.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}
          </span>
          <div 
            className={`w-full ${corBarraSimulada} rounded-t-sm transition-all duration-300 ease-out relative shadow-sm`}
            style={{ height: alturaSimulado }}
          >
             {/* Tooltip Hover */}
             <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-gray-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
              Valor Simulado
            </div>
          </div>
          <span className="text-[10px] font-bold text-gray-500 mt-2 uppercase tracking-wider">Simulação</span>
        </div>

        {/* Barra de Referência (Educampo) */}
        <div className="flex flex-col items-center justify-end w-16 group h-full">
          <span className="text-xs text-gray-500 mb-1 font-medium">{valorReferencia.toLocaleString('pt-BR')}</span>
          <div 
            className="w-full bg-primary rounded-t-sm transition-all duration-500 ease-out relative"
            style={{ height: alturaReferencia }}
          >
            {/* Tooltip Hover */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-gray-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
              Referência Base
            </div>
          </div>
          <span className="text-[10px] font-bold text-primary mt-2 uppercase tracking-wider">Referência</span>
        </div>
      </div>
      
      <div className="text-center mt-2 pt-2 border-t border-gray-50">
        <span className="text-xs text-gray-500">{unidade}</span>
      </div>
    </div>
  );
};

/**
 * @description Tela interativa do Simulador de Cenários.
 * Mantém um estado local que herda a base da store do Zustand para permitir manipulações
 * descartáveis sem corromper o diagnóstico original do produtor.
 */
export default function SimulacaoPage() {
  const { dadosFazenda, resultadoSimulacao, setResultadoSimulacao } = useFazendaStore();
  
  // Estado local para a Simulação (não altera a store principal para não estragar o diagnóstico real)
  const [simulacao, setSimulacao] = useState({
    total_vacas: dadosFazenda?.total_vacas || 100,
    vacas_lactacao: dadosFazenda?.vacas_lactacao || 85,
    producao_vaca: dadosFazenda?.producao_vaca || 30.0,
    preco_leite: dadosFazenda?.preco_leite || 3.00,
    area_atividade: dadosFazenda?.area_atividade || 10.0,
    ccs: dadosFazenda?.ccs || 150,
  });

  const [isSimulando, setIsSimulando] = useState(false);
  const [cenarioAtivo, setCenarioAtivo] = useState<'inferior' | 'intermediario' | 'superior'>('intermediario');
  
  // NOVO: Estado para a barreira do Rate Limiting
  const [tempoBloqueio, setTempoBloqueio] = useState(0);

  // Efeito que diminui o contador automaticamente a cada segundo
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (tempoBloqueio > 0) {
      interval = setInterval(() => setTempoBloqueio((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [tempoBloqueio]);

  // Valores de referência do Educampo (Mockados temporariamente para a simulação funcionar de imediato)
  // Numa etapa futura, isso pode vir direto de `diagnosticoIA.cenarios`
  const referencias = {
    inferior:      { producao: 15.0, preco: 2.50, area: 15, ccs: 400 },
    intermediario: { producao: 25.0, preco: 2.80, area: 10, ccs: 250 },
    superior:      { producao: 35.0, preco: 3.20, area: 8,  ccs: 100 },
  };

  /**
   * @description Motor de recálculo local de alta frequência.
   * Disparado instantaneamente (via useMemo) a cada arraste nos sliders para evitar requisições
   * à rede enquanto projeta variáveis triviais e independentes de IA (ex: Receita Bruta).
   */
  const calculos = useMemo(() => {
    const pDiariaSim = simulacao.vacas_lactacao * simulacao.producao_vaca;
    const pDiariaRef = simulacao.vacas_lactacao * referencias[cenarioAtivo].producao; // Usando vacas da fazenda como base

    return {
      producao_diaria: pDiariaSim,
      producao_diaria_ref: pDiariaRef,
      
      receita_bruta: pDiariaSim * simulacao.preco_leite,
      receita_bruta_ref: pDiariaRef * referencias[cenarioAtivo].preco,
      
      prod_area: (pDiariaSim * 365) / simulacao.area_atividade,
      prod_area_ref: (pDiariaRef * 365) / referencias[cenarioAtivo].area,
      
      taxa_lactacao: (simulacao.vacas_lactacao / simulacao.total_vacas) * 100,
      taxa_lactacao_ref: 83, // Referência fixa da literatura
    };
  }, [simulacao, cenarioAtivo]);

  /**
   * @description Define a faixa estatística de produção baseada no volume gerado.
   * É essencial como insumo (feature) para o modelo de Machine Learning no backend.
   * @param diaria Volume diário total projetado pelo produtor.
   * @returns String contendo o quartil estatístico.
   */
  const getFaixaProducao = (diaria: number) => {
    if (diaria < 500) return "< 500";
    if (diaria <= 1000) return "500-1000";
    if (diaria <= 2000) return "1000-2000";
    if (diaria <= 5000) return "2000-5000";
    return "> 5000";
  };

  /**
   * @description Mescla as edições locais da simulação e solicita à API
   * externa a projeção avançada de custo (Machine Learning) e re-divisão dos quartis.
   */
  const executarSimulacao = async () => {
    if (!dadosFazenda) return;

    setIsSimulando(true);

    const payloadSimulacao = {
      sistema_producao: dadosFazenda.sistema_producao,
      regiao_sebrae: dadosFazenda.regiao,
      faixa_producao: getFaixaProducao(calculos.producao_diaria),
      total_vacas: simulacao.total_vacas,
      vacas_lactacao: simulacao.vacas_lactacao,
      area_atividade: simulacao.area_atividade,
      numero_trabalhadores: dadosFazenda.mao_obra_total,
      preco_concentrado: dadosFazenda.preco_concentrado || 1.81, // Fallback de segurança
      producao_vaca: simulacao.producao_vaca,
      preco_recebido: simulacao.preco_leite,
      ccs: simulacao.ccs
    };

    try {
      const response = await fetch('/api/simulacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadSimulacao),
      });

      // --- NOVO: Intercepta o Rate Limit (429 Too Many Requests) ---
      if (response.status === 429) {
        setTempoBloqueio(60); // Aplica punição de 60 segundos
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setResultadoSimulacao(data); // Atualiza o cache global no Zustand
      } else {
        console.error("Falha na simulação");
      }
    } catch (error) {
      console.error("Erro ao simular:", error);
    } finally {
      setIsSimulando(false);
    }
  };

  /**
   * @description Manipula a alteração dos inputs do tipo `range` injetando
   * valores numéricos válidos no estado da simulação.
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSimulacao(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  if (!dadosFazenda) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-8">
        <div className="text-center text-red-500 font-bold text-2xl mb-4">Nenhum dado encontrado.</div>
        <p className="text-gray-600 mb-8 text-center max-w-md">Por favor, preencha o formulário inicial para gerar um diagnóstico antes de tentar simular cenários.</p>
        <Link href="/formulario" className="bg-primary hover:bg-[#003e7d] text-white font-bold py-3 px-8 rounded-lg shadow-md transition duration-200">
          Ir para Coleta de Dados
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* PAINEL ESQUERDO: CONTROLES (Inputs & Sliders) */}
        <aside className="w-full lg:w-80 flex-shrink-0 bg-white rounded-2xl shadow-lg border border-gray-100 p-6 flex flex-col h-max sticky top-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> Variáveis
            </h2>
            <p className="text-xs text-gray-500 mt-1">Ajuste os valores para simular.</p>
          </div>

          <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            
            {/* Controle: Total de Vacas */}
            <div>
              <label htmlFor="total_vacas" className="text-sm font-semibold text-gray-700 flex justify-between">
                Total de Vacas <span className="text-primary">{simulacao.total_vacas}</span>
              </label>
              <input 
                id="total_vacas" name="total_vacas" type="range" 
                min="10" max="500" step="1" 
                value={simulacao.total_vacas} onChange={handleChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-2 accent-primary"
              />
            </div>

            {/* Controle: Vacas em Lactação */}
            <div>
              <label htmlFor="vacas_lactacao" className="text-sm font-semibold text-gray-700 flex justify-between">
                Vacas em Lactação <span className="text-primary">{simulacao.vacas_lactacao}</span>
              </label>
              <input 
                id="vacas_lactacao" name="vacas_lactacao" type="range" 
                min="0" max={simulacao.total_vacas} step="1" 
                value={simulacao.vacas_lactacao} onChange={handleChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-2 accent-primary"
              />
            </div>

            {/* Controle: Produção por Vaca */}
            <div>
              <label htmlFor="producao_vaca" className="text-sm font-semibold text-gray-700 flex justify-between">
                Produção por Vaca <span className="text-primary">{simulacao.producao_vaca} L</span>
              </label>
              <input 
                id="producao_vaca" name="producao_vaca" type="range" 
                min="5" max="50" step="0.5" 
                value={simulacao.producao_vaca} onChange={handleChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-2 accent-primary"
              />
            </div>

            {/* Controle: Preço do Leite */}
            <div>
              <label htmlFor="preco_leite" className="text-sm font-semibold text-gray-700 flex justify-between">
                Preço do Leite <span className="text-primary">R$ {simulacao.preco_leite.toFixed(2)}</span>
              </label>
              <input 
                id="preco_leite" name="preco_leite" type="range" 
                min="1.5" max="5.0" step="0.05" 
                value={simulacao.preco_leite} onChange={handleChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-2 accent-primary"
              />
            </div>

            {/* Controle: CCS */}
            <div>
              <label htmlFor="ccs" className="text-sm font-semibold text-gray-700 flex justify-between">
                CCS (x1000) <span className="text-primary">{simulacao.ccs}</span>
              </label>
              <input 
                id="ccs" name="ccs" type="range" 
                min="50" max="1000" step="10" 
                value={simulacao.ccs} onChange={handleChange}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-2 accent-primary"
              />
            </div>

            <button 
              onClick={executarSimulacao}
              disabled={isSimulando || tempoBloqueio > 0}
              className={`w-full py-3 mt-4 rounded-xl font-bold text-white transition-all shadow-md ${
                tempoBloqueio > 0 || isSimulando ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-[#003e7d]'
              }`}
            >
              {tempoBloqueio > 0 
                ? `Aguarde ${tempoBloqueio}s` 
                : isSimulando 
                  ? 'A Calcular...' 
                  : 'Analisar Cenário (ML)'}
            </button>
          </div>
        </aside>

        {/* PAINEL DIREITO: TABS E GRÁFICOS */}
        <section className="flex-1 flex flex-col">
          
          {/* Topo: Tabs de Cenário Educampo */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 flex gap-2 mb-6 w-max mx-auto md:mx-0">
            {(['inferior', 'intermediario', 'superior'] as const).map(cenario => (
              <button
                key={cenario}
                onClick={() => setCenarioAtivo(cenario)}
                className={`px-6 py-2 rounded-xl text-sm font-bold capitalize transition-all duration-300 ${
                  cenarioAtivo === cenario 
                  ? 'bg-primary text-white shadow-md' 
                  : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {cenario}
              </button>
            ))}
          </div>

          {/* 
            ESTADOS DE RENDERIZAÇÃO:
            1. isSimulando && !resultado: Primeira carga -> Mostra 5 Skeletons genéricos.
            2. resultado?.metricas: Dados presentes -> Mostra os gráficos reais (com Overlay de carregamento se estiver recalculando).
            3. Fallback/Vazio: Caso a API falhe ou os dados ainda não tenham sido pré-carregados.
          */}
          {isSimulando && !resultadoSimulacao?.metricas ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in duration-500">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col h-64 items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gray-50 opacity-50"></div>
                  <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                  <span className="text-sm font-bold text-gray-400">Projetando cenários...</span>
                </div>
              ))}
            </div>
          ) : resultadoSimulacao?.metricas ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in duration-500">
              {resultadoSimulacao.metricas.map((item: any) => {
                
                // Card Financeiro Especial para Custo Estimado
                if (item.metrica === 'custo_estimado') {
                  const dadosCusto = item[cenarioAtivo];
                  return (
                    <div key={item.metrica} className="relative h-full">
                      {/* OVERLAY DE RECARREGAMENTO */}
                      {isSimulando && (
                        <div className="absolute inset-0 z-20 bg-[#003e7d]/60 backdrop-blur-[2px] rounded-xl flex items-center justify-center">
                          <Loader2 className="w-10 h-10 text-white animate-spin" />
                        </div>
                      )}
                      <div className="bg-gradient-to-br from-[#003e7d] to-[#1973d3] p-6 rounded-xl shadow-md text-white flex flex-col justify-center items-center h-64 text-center">
                        <h3 className="text-lg font-bold mb-2">Insight Financeiro (IA)</h3>
                        <div className="text-3xl font-black mb-2 text-green-300">
                          {dadosCusto.margem_lucro_percentual}% <span className="text-sm font-normal text-blue-100">Margem</span>
                        </div>
                        <p className="text-blue-50 text-xs leading-relaxed line-clamp-4">
                          {dadosCusto.texto_margem}
                        </p>
                      </div>
                    </div>
                  );
                }

                // Gráficos Padrão
                const nomeFormatado = item.metrica.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
                const inverter = item.metrica === 'ccs' || item.metrica === 'area_atividade';
                
                let valorSimulado = 0;
                if (item.metrica === 'producao_diaria') valorSimulado = calculos.producao_diaria;
                else if (item.metrica === 'receita_bruta_diaria') valorSimulado = calculos.receita_bruta;
                else if (item.metrica === 'producao_area') valorSimulado = calculos.prod_area;
                else if (item.metrica === 'perc_vacas_lactacao') valorSimulado = calculos.taxa_lactacao;
                else if (item.metrica === 'preco_recebido') valorSimulado = simulacao.preco_leite;
                else valorSimulado = (simulacao as any)[item.metrica] || 0;

                const ChartComponent = (
                   <BarChartSimulacao 
                    key={item.metrica}
                    titulo={nomeFormatado} 
                    valorSimulado={valorSimulado}
                    valorReferencia={item[cenarioAtivo]}
                    unidade=""
                    inverterCores={inverter}
                  />
                );

                return (
                  <div key={item.metrica} className="relative h-full">
                    {/* OVERLAY DE RECARREGAMENTO */}
                    {isSimulando && (
                      <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[2px] rounded-xl flex items-center justify-center">
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                      </div>
                    )}
                    {ChartComponent}
                  </div>
                );
              })}
            </div>
          ) : (
             <div className="flex justify-center items-center h-64 text-gray-400">Aguardando dados...</div>
          )}
        </section>

      </main>
    </div>
  );
}