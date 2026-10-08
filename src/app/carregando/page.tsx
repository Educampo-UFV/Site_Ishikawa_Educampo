/**
 * @file page.tsx (Carregando)
 * @description Tela de transição e processamento de dados.
 * Responsabilidades:
 * 1. Recuperar os dados da fazenda salvos no Zustand.
 * 2. Enviar os dados para as APIs internas (BFF) de Diagnóstico e Simulação em paralelo.
 * 3. Gerenciar o estado de espera visual do usuário com feedback elegante.
 * 4. Salvar os resultados e a telemetria de IA no estado global e redirecionar para a Tela de Seleção.
 */

"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useFazendaStore } from "@/store/useFazendaStore"; 
import Image from "next/image";
import { fetchComResiliencia } from "@/lib/apiUtils";
import { DiagnosticoProgress, DiagnosticoStatusResponse } from "@/types/diagnostico";
import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react";

export default function CarregandoPage() {
  const router = useRouter();
  const { dadosFazenda, setDiagnosticoIA, setResultadoSimulacao, setTelemetry, apiHealthy } = useFazendaStore();
  const [mensagem, setMensagem] = useState("Preparando análise");
  const [progresso, setProgresso] = useState<DiagnosticoProgress | null>(null);
  const [dots, setDots] = useState("");
  const [erroProcessamento, setErroProcessamento] = useState<string | null>(null);
  const processamentoIniciado = useRef(false);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Efeito para criar a animação dos "3 pontinhos"
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  const processarAnalise = useCallback(async () => {
    if (!dadosFazenda) return;
    setErroProcessamento(null);
    setMensagem("A Inteligência Artificial está projetando seus cenários");

    try {
      console.info(
        `%c[Carregando] API pré-verificada no login: ${apiHealthy ? '✅ SIM' : '⚠️ NÃO (fallback via retry)'}`,
        `color: ${apiHealthy ? '#10b981' : '#f59e0b'}; font-weight: bold; padding: 2px 4px; border-radius: 4px;`
      );

      const payloadSimulacao = {
        email: dadosFazenda.email || 'produtor@fazenda.com.br',
        dados_originais: {
          area_atividade: dadosFazenda.area_atividade,
          ccs: dadosFazenda.ccs,
          custo_concentrado: dadosFazenda.preco_concentrado || 1.81,
          numero_trabalhadores: dadosFazenda.mao_obra_total,
          preco_recebido: dadosFazenda.preco_leite,
          producao_vaca: dadosFazenda.producao_vaca,
          regiao_sebrae: dadosFazenda.regiao,
          sistema_producao: dadosFazenda.sistema_producao,
          total_vacas: dadosFazenda.total_vacas,
          percentual_lactacao: dadosFazenda.percentual_lactacao
        },
        dados_simulados: {
          area_atividade: dadosFazenda.area_atividade,
          ccs: dadosFazenda.ccs,
          custo_concentrado: dadosFazenda.preco_concentrado || 1.81,
          numero_trabalhadores: dadosFazenda.mao_obra_total,
          preco_recebido: dadosFazenda.preco_leite,
          producao_vaca: dadosFazenda.producao_vaca,
          total_vacas: dadosFazenda.total_vacas,
          percentual_lactacao: dadosFazenda.percentual_lactacao
        }
      };

      const payloadParametros = {
        producao_vaca: dadosFazenda.producao_vaca,
        sistema_producao: dadosFazenda.sistema_producao,
        percentual_lactacao: dadosFazenda.percentual_lactacao,
        total_vacas: dadosFazenda.total_vacas
      };

      const fetchDiagnosticoPolling = async () => {
        const initResponse = await fetchComResiliencia("/api/diagnostico", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(dadosFazenda),
        }, 3, 2000, 10000, 15000);
        
        if (!initResponse.ok) throw new Error("Falha ao iniciar o processamento do diagnóstico.");
        
        const initData = await initResponse.json();
        const taskId = initData.task_id;
        
        if (!taskId) {
           throw new Error("A API não retornou um task_id válido para acompanhamento.");
        }
        
        const maxTempoPolling = 180000;
        const tempoInicio = Date.now();
        
        while (true) {
          if (Date.now() - tempoInicio > maxTempoPolling) {
            throw new Error("Tempo limite de processamento da IA (3 minutos) excedido.");
          }
          
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          const statusResponse = await fetchComResiliencia(`/api/diagnostico/status/${taskId}`, {
            method: "GET"
          }, 3, 2000, 10000, 10000);
          
          if (!statusResponse.ok) throw new Error("Falha ao consultar status do processamento.");
          
          const statusData: DiagnosticoStatusResponse = await statusResponse.json();
          
          if (statusData.message) {
            const isGenericCountMessage = /an[aá]lises em andamento/i.test(statusData.message);
            if (!isGenericCountMessage) {
              setMensagem(statusData.message);
            }
          }

          if (statusData.progress && typeof statusData.progress.done === 'number' && typeof statusData.progress.total === 'number') {
            setProgresso(statusData.progress);
          }
          
          if (statusData.status === "completed") {
            if (statusData.telemetry) {
              setTelemetry(statusData.telemetry);
            }
            return statusData;
          } else if (statusData.status === "failed") {
            throw new Error(statusData.error || "O motor de Inteligência Artificial falhou ao processar o diagnóstico.");
          }
        }
      };

      const [diagDataCompleto, simResponse, paramResponse] = await Promise.all([
        fetchDiagnosticoPolling(),
        fetchComResiliencia("/api/simulacao", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payloadSimulacao),
        }, 3, 2000, 10000, 10000),
        fetchComResiliencia("/api/parametros-painel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payloadParametros),
        }, 3, 2000, 10000, 10000),
      ]);

      if (!simResponse.ok || !paramResponse.ok) {
        throw new Error("Erro na comunicação com os servidores de simulação.");
      }

      const simData = await simResponse.json();
      const paramData = await paramResponse.json();

      setDiagnosticoIA(diagDataCompleto.result);
      setResultadoSimulacao({ ...simData, ...paramData });

      setMensagem("Análise concluída! Montando seu Diagnóstico");
      if (progresso) {
        setProgresso({ done: progresso.total, total: progresso.total });
      }

      setTimeout(() => router.push("/selecao"), 1500);
    } catch (error) {
      console.error("[Carregando] Falha no processamento:", error);
      const msg = error instanceof Error ? error.message : "Erro desconhecido";
      setErroProcessamento(msg);
      setMensagem("Ocorreu um erro ao processar os dados.");
    }
  }, [dadosFazenda, apiHealthy, progresso, router, setDiagnosticoIA, setResultadoSimulacao, setTelemetry]);

  useEffect(() => {
    if (!dadosFazenda) {
      router.push("/formulario");
      return;
    }

    if (processamentoIniciado.current) return;
    processamentoIniciado.current = true;

    processarAnalise();
  }, [dadosFazenda, router, processarAnalise]);

  const handleRetry = () => {
    setErroProcessamento(null);
    setProgresso(null);
    processamentoIniciado.current = false;
    processarAnalise();
  };

  const handleVoltar = () => {
    router.push("/formulario");
  };

  const porcentagem = progresso && progresso.total > 0 
    ? Math.min(100, Math.round((progresso.done / progresso.total) * 100))
    : 0;

  const isProgressBarActive = Boolean(progresso && progresso.total > 0);
  const isGenericLoadingText = 
    mensagem === "A Inteligência Artificial está projetando seus cenários" ||
    mensagem === "Preparando análise" ||
    /an[aá]lises em andamento/i.test(mensagem);

  const shouldShowMessage = !isProgressBarActive || !isGenericLoadingText;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-fundo p-6">
      <div className="w-full max-w-md text-center space-y-8">
        <div className="relative mx-auto flex justify-center">
          <Image
            src="/logo_educampo.png"
            alt="Logo Educampo"
            width={192}
            height={80}
            className="object-contain"
            priority
            style={{ width: '192px', height: 'auto' }}
          />
        </div>

        {erroProcessamento ? (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="mx-auto w-14 h-14 bg-red-100 rounded-full flex items-center justify-center text-red-600 shadow-inner">
              <AlertCircle size={32} />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-secondary">
                Ocorreu um erro ao processar os dados
              </h2>
              <p className="text-sm text-gray-600 max-w-sm mx-auto">
                {/OpenRouter|Inteligência Artificial|IA/i.test(erroProcessamento)
                  ? "Houve uma instabilidade temporária no serviço de Inteligência Artificial. Seus dados cadastrais estão preservados."
                  : "Não foi possível concluir o processamento no momento. Seus dados cadastrais foram preservados."}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={handleRetry}
                data-testid="btn-tentar-novamente"
                className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-lg shadow transition active:scale-[0.99] text-sm"
              >
                <RefreshCw size={16} />
                <span>Tentar Novamente</span>
              </button>

              <button
                type="button"
                onClick={handleVoltar}
                data-testid="btn-voltar-formulario"
                className="flex items-center justify-center gap-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2.5 px-5 rounded-lg transition active:scale-[0.99] text-sm"
              >
                <ArrowLeft size={16} />
                <span>Voltar ao Formulário</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-center">
              <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>

            {progresso && progresso.total > 0 && (
              <div className="space-y-2 px-2 animate-in fade-in duration-300">
                <div className="w-full bg-gray-200 rounded-full h-3.5 overflow-hidden shadow-inner border border-gray-100">
                  <div 
                    className="bg-gradient-to-r from-primary to-primary-light h-full rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${porcentagem}%` }}
                    role="progressbar"
                    aria-valuenow={porcentagem}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
                <div className="flex justify-between items-center text-lg font-bold text-secondary px-1">
                  <span>{progresso.done} de {progresso.total} análises concluídas</span>
                  <span>{porcentagem}%</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {shouldShowMessage && (
                <h2 className="text-xl font-bold text-secondary flex items-center justify-center animate-in fade-in duration-300">
                  <span>{mensagem}</span>
                  <span className="w-6 text-left">{dots}</span>
                </h2>
              )}
              <p className="text-sm text-gray-500">
                Isso pode levar alguns segundos, estamos cruzando seus dados com o benchmarking do setor.
              </p>
            </div>
          </>
        )}
      </div>
    </main>
  );
}