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

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useFazendaStore } from "@/store/useFazendaStore"; 
import Image from "next/image";
import { fetchComResiliencia } from "@/lib/apiUtils";
import { DiagnosticoProgress, DiagnosticoStatusResponse } from "@/types/diagnostico";

export default function CarregandoPage() {
  const router = useRouter();
  const { dadosFazenda, setDiagnosticoIA, setResultadoSimulacao, setTelemetry, apiHealthy } = useFazendaStore();
  const [mensagem, setMensagem] = useState("Preparando análise");
  const [progresso, setProgresso] = useState<DiagnosticoProgress | null>(null);
  const [dots, setDots] = useState("");
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

  useEffect(() => {
    if (!isMounted) return;

    if (!dadosFazenda) {
      router.push("/formulario");
      return;
    }

    if (processamentoIniciado.current) return;
    processamentoIniciado.current = true;

    const processarAnalise = async () => {
      try {
        console.info(
          `%c[Carregando] API pré-verificada no login: ${apiHealthy ? '✅ SIM' : '⚠️ NÃO (fallback via retry)'}`,
          `color: ${apiHealthy ? '#10b981' : '#f59e0b'}; font-weight: bold; padding: 2px 4px; border-radius: 4px;`
        );

        setMensagem("A Inteligência Artificial está projetando seus cenários");

        const payloadSimulacao = {
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
              setMensagem(statusData.message);
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
              throw new Error("O motor de Inteligência Artificial falhou ao processar o diagnóstico.");
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
        setMensagem("Ocorreu um erro ao processar os dados. Redirecionando");
        setTimeout(() => router.push("/formulario"), 3000);
      }
    };

    processarAnalise();
  }, [dadosFazenda, router, setDiagnosticoIA, setResultadoSimulacao, setTelemetry, apiHealthy]);

  const porcentagem = progresso && progresso.total > 0 
    ? Math.min(100, Math.round((progresso.done / progresso.total) * 100))
    : 0;

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

        <div>
          <p className="text-sm text-gray-500">
            Isso pode levar alguns segundos, estamos cruzando seus dados com o benchmarking do setor.
          </p>
        </div>
      </div>
    </main>
  );
}