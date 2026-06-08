/**
 * @file src/app/simulacao/page.tsx
 * @description Dashboard de Simulação Interativa (What-If Analysis).
 * Permite ao produtor alterar variáveis em tempo real (Painel Esquerdo) e 
 * visualizar o impacto em 9 indicadores cruciais (Painel Central), comparando
 * contra linhas de base (Cenários: Inferior, Intermediário, Superior) sem custos de API.
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from '@/components/ui/Navbar';
import { useFazendaStore } from '@/store/useFazendaStore';
import { TrendingUp, TrendingDown, Minus, Loader2, RotateCcw, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { formatSidebarNumber } from '@/lib/formatters';

/**
 * @description Renderiza um gráfico de barra comparativo puro, sem dependências.
 * Calcula a escala proporcionalmente aos valores fornecidos para alinhar as barras.
 * @param titulo Título exibido acima das barras.
 * @param valorSimulado O valor resultante da simulação em tempo real.
 * @param valorReferencia O valor base para comparação do cenário.
 * @param unidade A unidade de medida (ex: Litros, R$).
 * @param inverterCores Se verdadeiro, barras menores ganham cores positivas (ex: CCS).
 * @param diferencaPercentualAPI Opcional. A diferença percentual calculada com precisão pela inteligência no backend.
 */
const BarChartSimulacao = ({ 
  titulo, 
  valorSimulado, 
  valorReferencia, 
  unidade, 
  inverterCores = false,
  diferencaPercentualAPI
}: { 
  titulo: string, valorSimulado: number, valorReferencia: number, unidade: string, inverterCores?: boolean, diferencaPercentualAPI?: number
}) => {
  /**
   * Trava Defensiva: Fixa valores negativos em 0 apenas para o cálculo visual da altura da barra.
   * Garante que anomalias da API (ou margens negativas reais) não quebrem o layout crescendo para cima de forma confusa.
   */
  const safeSimulado = Math.max(0, valorSimulado);
  const safeReferencia = Math.max(0, valorReferencia);
  const maxVal = Math.max(safeSimulado, safeReferencia, 0.01);
  const tetoGrafico = maxVal * 1.15; // Adiciona 15% de folga no topo para respiro
  const alturaSimulado = `${(safeSimulado / tetoGrafico) * 100}%`;
  const alturaReferencia = `${(safeReferencia / tetoGrafico) * 100}%`;

  /**
   * Lógica de cores: Verde (Melhor), Vermelho (Pior), Cinza (Igual)
   */
  let corBarraSimulada = 'bg-gray-400';
  let corTextoSimulado = 'text-gray-600';

  if (valorSimulado !== valorReferencia) {
    const isMelhor = inverterCores ? valorSimulado < valorReferencia : valorSimulado > valorReferencia;
    corBarraSimulada = isMelhor ? 'bg-green-500' : 'bg-red-500';
    corTextoSimulado = isMelhor ? 'text-green-600' : 'text-red-600';
  }


  /**
   * Cálculos do Indicador Percentual para o canto superior direito do componente.
   */
  const diff = valorSimulado - valorReferencia;
  const pct = diferencaPercentualAPI !== undefined 
    ? diferencaPercentualAPI 
    : (Math.abs(valorReferencia) > 0 ? (diff / Math.abs(valorReferencia)) * 100 : 0);
  
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

  /**
   * Formatação para grandes números (K) e moedas/frações pequenas
   * @param num O número a ser formatado.
   * @returns A representação formatada em string do número fornecido.
   */
  const formatNumber = (num: number) => {
    if (Math.abs(num) >= 1000) {
      return num.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
    }
    return num.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between h-56">
      {/* Cabeçalho Flexbox Inteligente */}
      <div className="flex justify-between items-start gap-4 mb-4">
        <h3 className="text-sm font-bold text-gray-700 leading-tight">{titulo}</h3>
        {/* Badge Indicador de Diferença Percentual */}
        <div 
          className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${indicatorColor}`}
          title="Diferença em relação à referência"
        >
          <Icon size={12} strokeWidth={2.5} />
          <span>{prefix}{Math.abs(pct).toFixed(1)}%</span>
        </div>
      </div>
      
      {/* Container das Barras (Cresce de baixo para cima) */}
      <div className="flex-1 flex items-end justify-center gap-6 pb-2">
        {/* Barra Simulada (Em Tempo Real) */}
        <div className="flex flex-col items-center justify-end w-14 group h-full">
          {/* Wrapper isolado para garantir que a porcentagem de altura não distorça no Flexbox */}
          <div className="w-full flex-1 flex flex-col justify-end items-center">
            <span className={`text-xs font-bold mb-1 transition-all duration-300 ${corTextoSimulado}`}>
              {formatNumber(valorSimulado)}
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
          </div>
          <span className="text-[10px] font-bold text-gray-500 mt-2 uppercase tracking-wider">Simulação</span>
        </div>

        {/* Barra de Referência (Educampo) */}
        <div className="flex flex-col items-center justify-end w-14 group h-full">
          <div className="w-full flex-1 flex flex-col justify-end items-center">
            <span className="text-xs text-gray-500 mb-1 font-medium transition-all duration-500">
              {formatNumber(valorReferencia)}
            </span>
            <div 
              className="w-full bg-primary rounded-t-sm transition-all duration-500 ease-out relative"
              style={{ height: alturaReferencia }}
            >
              {/* Tooltip Hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-gray-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">
                Referência Base
              </div>
            </div>
          </div>
          <span className="text-[10px] font-bold text-primary mt-2 uppercase tracking-wider">Referência</span>
        </div>
      </div>
      
      {unidade && (
        <div className="text-center mt-2 pt-2 border-t border-gray-50">
          <span className="text-xs text-gray-500">{unidade}</span>
        </div>
      )}
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
  
  /**
   * Estados para os acordeões dos grupos de variáveis.
   * Mercado inicia expandido, Ajustes Técnicos inicia fechado por padrão.
   */
  const [isMercadoOpen, setIsMercadoOpen] = useState(true);
  const [isTecnicoOpen, setIsTecnicoOpen] = useState(false);

  /**
   * Estado local para a Simulação (não altera a store principal para não estragar o diagnóstico real do produtor).
   */
  const [simulacao, setSimulacao] = useState({
    total_vacas: dadosFazenda?.total_vacas || 100,
    percentual_lactacao: dadosFazenda?.percentual_lactacao || 85,
    producao_vaca: dadosFazenda?.producao_vaca || 30.0,
    preco_recebido: dadosFazenda?.preco_leite || 3.00,
    area_atividade: dadosFazenda?.area_atividade || 10.0,
    ccs: dadosFazenda?.ccs || 150,
    numero_trabalhadores: dadosFazenda?.mao_obra_total || 2,
    custo_concentrado: dadosFazenda?.preco_concentrado || 2.00,
  });

  /**
   * @description Restaura os valores da simulação para os originais do produtor.
   */
  const restaurarValoresOriginais = () => {
    if (dadosFazenda) {
      const valoresOriginais = {
        total_vacas: dadosFazenda.total_vacas || 100,
        percentual_lactacao: dadosFazenda.percentual_lactacao || 85,
        producao_vaca: dadosFazenda.producao_vaca || 30.0,
        preco_recebido: dadosFazenda.preco_leite || 3.00,
        area_atividade: dadosFazenda.area_atividade || 10.0,
        ccs: dadosFazenda.ccs || 150,
        numero_trabalhadores: dadosFazenda.mao_obra_total || 2,
        custo_concentrado: dadosFazenda.preco_concentrado || 2.00,
      };
      setSimulacao(valoresOriginais);
      executarSimulacao(valoresOriginais);
    }
  };

  const [isSimulando, setIsSimulando] = useState(false);
  const [cenarioAtivo, setCenarioAtivo] = useState<'inferior' | 'intermediario' | 'superior'>('intermediario');
  
  /**
   * Estado para a barreira do Rate Limiting que impede cliques em massa no botão de simulação.
   */
  const [tempoBloqueio, setTempoBloqueio] = useState(0);

  /**
   * Estados para o controle do ajuste fino em formato texto (Input)
   */
  const [paramEditando, setParamEditando] = useState<ParamKey | null>(null);
  const [valorTemp, setValorTemp] = useState<string>('');

  /**
   * Efeito que diminui o contador automaticamente a cada segundo quando acionado o bloqueio de taxa.
   */
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (tempoBloqueio > 0) {
      interval = setInterval(() => setTempoBloqueio((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [tempoBloqueio]);

  /**
   * Ref para o AbortController nativo, garantindo que o disparo contínuo de simulações
   * cancele as requisições antigas "em voo" e não gere condições de corrida nos gráficos.
   */
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * @description Mescla as edições locais da simulação e solicita à API
   * externa a projeção avançada de custo (Machine Learning) e re-divisão dos quartis.
   * O resultado é mesclado ao estado global para não sobrescrever e perder os parâmetros do painel (`parametros_painel`).
   */
  const executarSimulacao = async (estadoSimulacao = simulacao) => {
    if (!dadosFazenda) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Função para sanitizar os dados antes de enviar à API
    // - Garante que não sejam enviados NaN ou menores que o mínimo permitido.
    // - Garante que campos que exigem inteiros sejam arredondados.
    const sanitizar = (valor: any, min: number, isInt: boolean = false) => {
      let num = parseFloat(valor);
      if (isNaN(num) || num < min) num = min;
      return isInt ? Math.round(num) : num;
    };

    setIsSimulando(true);
    const payloadSimulacao = {
      dados_originais: {
        area_atividade: sanitizar(dadosFazenda.area_atividade, 0.1),
        ccs: sanitizar(dadosFazenda.ccs, 0.1),
        custo_concentrado: sanitizar(dadosFazenda.preco_concentrado, 0.01),
        numero_trabalhadores: sanitizar(dadosFazenda.mao_obra_total, 1, true), // Força Inteiro
        preco_recebido: sanitizar(dadosFazenda.preco_leite, 0.01),
        producao_vaca: sanitizar(dadosFazenda.producao_vaca, 0.1),
        regiao_sebrae: dadosFazenda.regiao || 'desconhecida',
        sistema_producao: dadosFazenda.sistema_producao || 'desconhecido',
        total_vacas: sanitizar(dadosFazenda.total_vacas, 1, true), // Força Inteiro
        percentual_lactacao: sanitizar(dadosFazenda.percentual_lactacao, 0)
      },
      dados_simulados: {
        area_atividade: sanitizar(estadoSimulacao.area_atividade, 0.1),
        ccs: sanitizar(estadoSimulacao.ccs, 0.1),
        custo_concentrado: sanitizar(estadoSimulacao.custo_concentrado, 0.01),
        numero_trabalhadores: sanitizar(estadoSimulacao.numero_trabalhadores, 1, true), // Força Inteiro
        preco_recebido: sanitizar(estadoSimulacao.preco_recebido, 0.01),
        producao_vaca: sanitizar(estadoSimulacao.producao_vaca, 0.1),
        total_vacas: sanitizar(estadoSimulacao.total_vacas, 1, true), // Força Inteiro
        percentual_lactacao: sanitizar(estadoSimulacao.percentual_lactacao, 0)
      }
    };

    try {
      const response = await fetch('/api/simulacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadSimulacao),
        signal: controller.signal
      });

      /**
       * Intercepta o Rate Limit (429 Too Many Requests)
       */
      if (response.status === 429) {
        setTempoBloqueio(60);
        return;
      }

      if (response.ok) {
        const data = await response.json();
        
        /**
         * Instrumentação de Logs (Apenas Desenvolvimento)
         * Inspeciona o payload recebido para facilitar a depuração de valores negativos nas margens,
         * garantindo que não vaze para o console do navegador em produção.
         */
        if (process.env.NODE_ENV === 'development') {
          console.groupCollapsed('🔍 [Simulador] Resposta da API (BFF)');
          console.log('Dados Consolidados:', data);
          console.groupEnd();
        }

        setResultadoSimulacao({
          ...resultadoSimulacao,
          ...data
        });
      } else {
        console.error("Falha na simulação");
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.log('Requisição anterior cancelada devido a nova interação do usuário.');
        return;
      }
      console.error("Erro ao simular:", error);
    } finally {
      if (abortControllerRef.current === controller) {
        setIsSimulando(false);
      }
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

  /**
   * @description Habilita o modo de edição fina para a variável clicada
   */
  const handleEditClick = (chave: ParamKey, valorAtual: number) => {
    setParamEditando(chave);
    setValorTemp(valorAtual.toString());
  };

  /**
   * @description Consolida a alteração fina no estado local e garante limites
   */
  const handleEditBlur = (chave: ParamKey) => {
    setParamEditando(null);
    let num = parseFloat(valorTemp);
    if (!isNaN(num)) {
      const param = getParam(chave);
      if (num < param.min) num = param.min;
      if (num > param.max) num = param.max;
      if (num !== simulacao[chave]) {
        const novoEstado = { ...simulacao, [chave]: num };
        setSimulacao(novoEstado);
        executarSimulacao(novoEstado);
      }
    }
  };

  /**
   * @description Controle do teclado para a edição fina (Acessibilidade)
   */
  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, chave: ParamKey) => {
    if (e.key === 'Enter') {
      handleEditBlur(chave);
    } else if (e.key === 'Escape') {
      setParamEditando(null);
    }
  };

  /**
   * Parâmetros de segurança e limites de UI para o simulador divididos por cenário.
   */
  const defaultParams = {
    total_vacas: { min: 10, max: 500, step: 1, fronteiras_cenario: null as any },
    percentual_lactacao: { min: 0, max: 100, step: 0.5, fronteiras_cenario: null as any },
    producao_vaca: { min: 5, max: 60, step: 0.5, fronteiras_cenario: null as any },
    preco_recebido: { min: 1.0, max: 6.0, step: 0.05, fronteiras_cenario: null as any },
    ccs: { min: 50, max: 1000, step: 10, fronteiras_cenario: null as any },
    area_atividade: { min: 1, max: 1000, step: 0.5, fronteiras_cenario: null as any },
    custo_concentrado: { min: 0.5, max: 6.0, step: 0.05, fronteiras_cenario: null as any },
    numero_trabalhadores: { min: 1, max: 50, step: 1, fronteiras_cenario: null as any }
  };

  type ParamKey = keyof typeof defaultParams;

  /**
   * @description Resgata os parâmetros do painel (min, max, step e limites de cenário)
   * de forma resiliente, suportando tanto o agrupamento na raiz da métrica quanto a subdivisão aninhada por cenário.
   */
  const getParam = (chave: ParamKey) => {
    const painel = resultadoSimulacao?.parametros_painel;
    
    if (painel && painel[chave]) {
      const paramData = painel[chave];
      
      if (paramData[cenarioAtivo]) {
        return paramData[cenarioAtivo];
      }
      
      return {
        min: paramData.min ?? defaultParams[chave].min,
        max: paramData.max ?? defaultParams[chave].max,
        step: paramData.step ?? defaultParams[chave].step,
        fronteiras_cenario: paramData.fronteiras_cenario?.[cenarioAtivo] ?? paramData.fronteiras_cenario ?? null
      };
    }
    return defaultParams[chave];
  };

  const pTotalVacas = getParam('total_vacas');
  const pPercentualLactacao = getParam('percentual_lactacao');
  const pProducaoVaca = getParam('producao_vaca');
  const pPrecoRecebido = getParam('preco_recebido');
  const pCcs = getParam('ccs');
  const pAreaAtividade = getParam('area_atividade');
  const pCustoConcentrado = getParam('custo_concentrado');
  const pNumeroTrabalhadores = getParam('numero_trabalhadores');

  /**
   * @description Renderiza o grupo de controle completo (Label, Input Slider e Alertas).
   * Posiciona a mensagem de alerta abaixo do slider e elimina duplicação de código.
   */
  const renderControl = (chave: ParamKey, titulo: string, formatText: (v: number) => string, inverterLogicaWarning: boolean = false) => {
    const param = getParam(chave);
    const val = simulacao[chave];
    const isDesabilitado = isSimulando || tempoBloqueio > 0;

    let warning = null;
    let corSlider = 'accent-primary';

    if (isDesabilitado) {
      corSlider = 'accent-gray-400 cursor-not-allowed';
    } else if (param.fronteiras_cenario) {
      if (val < param.fronteiras_cenario.limite_inferior || val > param.fronteiras_cenario.limite_superior) {
        corSlider = 'accent-orange-500';
      }

      let direcaoMudanca: 'melhora' | 'piora' | null = null;

      // Identifica a direção da simulação com base na lógica (direta ou invertida)
      if (val < param.fronteiras_cenario.limite_inferior) {
        direcaoMudanca = inverterLogicaWarning ? 'melhora' : 'piora';
      } else if (val > param.fronteiras_cenario.limite_superior) {
        direcaoMudanca = inverterLogicaWarning ? 'piora' : 'melhora';
      }

      if (direcaoMudanca) {
        let cenarioAlvo = '';
        
        // Máquina de estados simples para descobrir para qual cenário o usuário está indo
        if (direcaoMudanca === 'melhora') {
          if (cenarioAtivo === 'inferior') cenarioAlvo = 'intermediário';
          else if (cenarioAtivo === 'intermediario') cenarioAlvo = 'superior';
          else cenarioAlvo = 'extremo_superior';
        } else {
          if (cenarioAtivo === 'superior') cenarioAlvo = 'intermediário';
          else if (cenarioAtivo === 'intermediario') cenarioAlvo = 'inferior';
          else cenarioAlvo = 'extremo_inferior';
        }

        // Geração da mensagem exata baseada no alvo
        if (cenarioAlvo === 'extremo_superior') {
          warning = `Com este valor, os seus resultados ultrapassam o cenário superior da sua região.`;
        } else if (cenarioAlvo === 'extremo_inferior') {
          const adj = inverterLogicaWarning ? 'altos' : 'baixos';
          warning = `Atenção: Simulação com valores atipicamente ${adj}, fora da escala do cenário inferior da sua região.`;
        } else {
          warning = `Com este valor, os seus resultados aproximam-se do cenário ${cenarioAlvo}. Considere mudar o seu cenário base para uma comparação ideal.`;
        }
      }
    }

    return (
      <div>
        <label htmlFor={chave} className="text-sm font-semibold text-gray-700 flex justify-between items-start gap-2">
          <span className="inline-flex flex-wrap items-center gap-1.5 flex-1 leading-tight pr-2">
            {titulo}
            {warning && (
              <span className="text-yellow-500 text-sm leading-none shrink-0" aria-label="Alerta" title="Atenção: verifique a mensagem abaixo">⚠️</span>
            )}
          </span>
          {paramEditando === chave ? (
            <input
              type="number"
              autoFocus
              className="w-24 text-right border-b border-primary outline-none text-primary bg-transparent font-medium shrink-0"
              value={valorTemp}
              onChange={(e) => setValorTemp(e.target.value)}
              onBlur={() => handleEditBlur(chave)}
              onKeyDown={(e) => handleEditKeyDown(e, chave)}
              disabled={isDesabilitado}
            />
          ) : (
            <span 
              className={`${isDesabilitado ? 'text-gray-400 cursor-not-allowed' : 'text-primary cursor-pointer hover:underline'} decoration-dashed underline-offset-2 shrink-0 text-right font-medium`}
              onClick={(e) => { e.preventDefault(); if (!isDesabilitado) handleEditClick(chave, val); }}
              title={isDesabilitado ? 'Aguarde o cálculo do cenário...' : 'Clique para realizar um ajuste fino'}
            >
              {formatText(val)}
            </span>
          )}
        </label>
        
        <input 
          id={chave} name={chave} type="range" 
          min={param.min} max={param.max} step={param.step} 
          value={val} onChange={handleChange}
          disabled={isDesabilitado}
          onPointerUp={(e) => { if (!isDesabilitado) executarSimulacao({ ...simulacao, [chave]: parseFloat(e.currentTarget.value) }); }}
          onKeyUp={(e) => {
            if (!isDesabilitado && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
              executarSimulacao({ ...simulacao, [chave]: parseFloat(e.currentTarget.value) });
            }
          }}
          className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-3 mb-1 transition-colors ${corSlider}`}
        />

        {/* Mensagem de alerta reposicionada abaixo do slider */}
        {warning && (
          <div className="mt-2 p-2.5 bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs leading-snug rounded-lg shadow-sm">
            {warning}
          </div>
        )}
      </div>
    );
  };


  /**
   * @description Função genérica para renderizar as sessões de gráficos.
   * Alimenta os gráficos comparativos diretamente da resposta do BFF.
   */
  const renderMetricCards = (metricas: any[]) => {
    return metricas.map((item: any) => {
      const cenarioRef = item.cenarios?.[cenarioAtivo];
      
      const valorSimulado = cenarioRef?.valor_produtor ?? 0;
      const valorReferencia = cenarioRef?.valor_referencia ?? 0;
      const diferencaPercentual = cenarioRef?.diferenca_percentual;
      const inverter = item.direcao_otimizacao === 'menor_melhor';
      
      return (
        <div key={item.metrica} className="relative h-full">
          {isSimulando && (
            <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[2px] rounded-xl flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
          )}
          <BarChartSimulacao 
            titulo={item.titulo_grafico} 
            valorSimulado={valorSimulado}
            valorReferencia={valorReferencia}
            unidade=""
            inverterCores={inverter}
                diferencaPercentualAPI={diferencaPercentual}
          />
        </div>
      );
    });
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
      
      <main className="flex-1 max-w-[95%] w-full mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* PAINEL ESQUERDO: CONTROLES (Inputs & Sliders) */}
        <aside className="w-full lg:w-80 flex-shrink-0 bg-white rounded-2xl shadow-lg border border-gray-100 p-6 flex flex-col max-h-[calc(100vh-4rem)] sticky top-8">
          <div className="mb-6 flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" /> Variáveis de Simulação
              </h2>
              <p className="text-xs text-gray-500 mt-1">Ajustes de Mercado &amp; Eficiência</p>
            </div>
            <button
              onClick={restaurarValoresOriginais}
              className="p-2 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-full transition-colors"
              title="Restaurar valores originais"
            >
              <RotateCcw size={20} />
            </button>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar pb-4">
            
            {/* GRUPO 1: Mercado & Escala */}
            <div className="border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm">
              <button
                onClick={() => setIsMercadoOpen(!isMercadoOpen)}
                className="w-full flex justify-between items-center p-3.5 bg-gray-50/80 hover:bg-gray-100 transition-colors text-sm font-bold text-gray-800"
                aria-expanded={isMercadoOpen}
              >
                <span>Mercado &amp; Escala</span>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isMercadoOpen ? 'rotate-180' : ''}`} />
              </button>
              <div className={`grid transition-all duration-300 ease-in-out ${isMercadoOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                  <div className="p-4 space-y-6">
                    
                    {/* Controle: Quantidade de Vacas */}
                    {renderControl('total_vacas', 'Quantidade de Vacas', (v) => `${formatSidebarNumber(v)} vacas`)}

                    {/* Controle: Preço do Leite */}
                    {renderControl('preco_recebido', 'Preço do Leite', (v) => `R$ ${formatSidebarNumber(v, 2, 2)}`)}

                    {/* Controle: Custo do Concentrado */}
                    {renderControl('custo_concentrado', 'Custo Concentrado', (v) => `R$ ${formatSidebarNumber(v, 2, 2)}`)}

                  </div>
                </div>
              </div>
            </div>

            {/* GRUPO 2: Ajustes Técnicos Finos */}
            <div className="border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm mt-4">
              <button
                onClick={() => setIsTecnicoOpen(!isTecnicoOpen)}
                className="w-full flex justify-between items-center p-3.5 bg-gray-50/80 hover:bg-gray-100 transition-colors text-sm font-bold text-gray-800"
                aria-expanded={isTecnicoOpen}
              >
                <span>Ajustes Técnicos Finos</span>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${isTecnicoOpen ? 'rotate-180' : ''}`} />
              </button>
              <div className={`grid transition-all duration-300 ease-in-out ${isTecnicoOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                  <div className="p-4 space-y-6">

                    {/* Controle: Percentual de Lactação */}
                    {renderControl('percentual_lactacao', 'Percentual em Lactação', (v) => `${formatSidebarNumber(v)} %`)}

                    {/* Controle: CCS */}
                    {renderControl('ccs', 'CCS', (v) => `${formatSidebarNumber(v)} x1000 céls/mL`, true)}

                    {/* Controle: Produção por Vaca */}
                    {renderControl('producao_vaca', 'Produção por vaca', (v) => `${formatSidebarNumber(v)} L/dia`)}

                    {/* Controle: Área de Atividade */}
                    {renderControl('area_atividade', 'Área de atividade', (v) => `${formatSidebarNumber(v)} hectares`)}

                    {/* Controle: Número de Trabalhadores */}
                    {renderControl('numero_trabalhadores', 'Total de Trabalhadores', (v) => `${formatSidebarNumber(v)} pessoas`)}

                  </div>
                </div>
              </div>
            </div>

            {tempoBloqueio > 0 && (
              <div className="w-full py-3 mt-4 rounded-xl font-bold text-center text-white bg-gray-400 transition-all shadow-sm">
                Limitar taxa: Aguarde {tempoBloqueio}s
              </div>
            )}
          </div>
        </aside>

        {/* PAINEL DIREITO: TABS E GRÁFICOS */}
        <section className="flex-1 flex flex-col">
          
          {/* Topo: Bloco de Controle de Cenário (Card Unificado) */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6 flex flex-col items-center w-full">
            <h3 className="text-gray-800 font-bold text-lg text-center">Perfil de desempenho</h3>
            <p className="text-gray-500 text-sm text-center mb-4">Selecione o perfil de desempenho que deseja alcançar</p>
            
            <div className="bg-gray-50 border border-gray-100/50 rounded-2xl p-1.5 flex gap-1">
              {(['inferior', 'intermediario', 'superior'] as const).map(cenario => (
                <button
                  key={cenario}
                  onClick={() => setCenarioAtivo(cenario)}
                  className={`px-6 py-2 rounded-xl text-sm font-bold capitalize transition-all duration-300 ${
                    cenarioAtivo === cenario 
                    ? 'bg-primary text-white shadow-md' 
                    : 'text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {cenario}
                </button>
              ))}
            </div>
          </div>

          {isSimulando && !resultadoSimulacao?.simulacao ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 animate-in fade-in duration-500">
              {Array.from({ length: 9 }).map((_, index) => (
                <div key={index} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col h-20 items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gray-50 opacity-50"></div>
                  <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                  <span className="text-sm font-bold text-gray-400">Projetando cenários...</span>
                </div>
              ))}
            </div>
          ) : resultadoSimulacao?.simulacao ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 animate-in fade-in duration-500">
              {renderMetricCards([
                ...resultadoSimulacao.simulacao.estaticas,
                ...resultadoSimulacao.simulacao.operacionais,
                ...resultadoSimulacao.simulacao.financeiras
              ])}
            </div>
          ) : (
             <div className="flex justify-center items-center h-56 text-gray-400">Aguardando dados...</div>
          )}
        </section>

      </main>
    </div>
  );
}