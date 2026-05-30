/**
 * @file page.tsx (Carregando)
 * @description Tela de transição e processamento de dados.
 * Responsabilidades:
 * 1. Recuperar os dados da fazenda salvos no Zustand.
 * 2. Enviar os dados para as APIs internas (BFF) de Diagnóstico e Simulação em paralelo.
 * 3. Gerenciar o estado de espera visual do usuário com feedback elegante.
 * 4. Salvar os resultados retornados no estado global e redirecionar para a Tela de Seleção.
 */

"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useFazendaStore } from "@/store/useFazendaStore"; 
import Image from "next/image";
import { fetchComResiliencia } from "@/lib/apiUtils";

export default function CarregandoPage() {
  const router = useRouter();
  const { dadosFazenda, setDiagnosticoIA, setResultadoSimulacao } = useFazendaStore();
  const [mensagem, setMensagem] = useState("Verificando conexão");
  const [dots, setDots] = useState("");
  const processamentoIniciado = useRef(false);

  // Efeito para criar a animação dos "3 pontinhos"
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!dadosFazenda) {
      router.push("/formulario");
      return;
    }

    if (processamentoIniciado.current) return;
    processamentoIniciado.current = true;

    const processarAnalise = async () => {
      try {
        setMensagem("A Inteligência Artificial está projetando seus cenários");

        // Prepara os payloads para as duas requisições
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

        // Prepara payload de extração dos limites do slider
        const payloadParametros = {
          producao_vaca: dadosFazenda.producao_vaca,
          sistema_producao: dadosFazenda.sistema_producao,
          percentual_lactacao: dadosFazenda.percentual_lactacao,
          total_vacas: dadosFazenda.total_vacas
        };

        // Dispara as três requisições em paralelo para otimizar o tempo de espera
        // Usamos nosso fetch com Circuit Breaker capado em 3 tentativas para rotas pesadas
        const [diagResponse, simResponse, paramResponse] = await Promise.all([
          fetchComResiliencia("/api/diagnostico", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dadosFazenda),
          }, 3, 2000, 10000, 60000), // Timeout de 60s para respeitar a lentidão da IA
          fetchComResiliencia("/api/simulacao", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payloadSimulacao),
          }, 3, 2000, 10000, 10000), // Timeout de 10s para leitura rápida
          fetchComResiliencia("/api/parametros-painel", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payloadParametros),
          }, 3, 2000, 10000, 10000), // Timeout de 10s para extração de limites
        ]);

        if (!diagResponse.ok || !simResponse.ok || !paramResponse.ok) {
          throw new Error("Erro na comunicação com os servidores de análise.");
        }

        const diagData = await diagResponse.json();
        const simData = await simResponse.json();
        const paramData = await paramResponse.json();

        // Injeta os resultados no estado global, combinando os limites dos sliders com as predições
        setDiagnosticoIA(diagData);
        setResultadoSimulacao({ ...simData, ...paramData });

        setMensagem("Análise concluída! Montando seu Diagnóstico");

        // Pequeno delay para garantir que o usuário veja a conclusão antes da troca de tela para a seleção de módulos
        setTimeout(() => router.push("/selecao"), 1500);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error("Falha no processamento:", error);
        }
        setMensagem("Ocorreu um erro ao processar os dados. Redirecionando");
        setTimeout(() => router.push("/formulario"), 3000);
      }
    };

    /**
     * @description Interroga o servidor até que ele esteja pronto (Trata Cold Start e Rate Limit).
     * Implementa um padrão de Circuit Breaker (Limite de Tentativas) acoplado a um 
     * Exponential Backoff (Espera Progressiva) para proteger o backend e a experiência do usuário.
     * 
     * @param {number} tentativa - O número da tentativa atual (Inicia em 1).
     * @returns {Promise<void>} Uma promise vazia que resolve quando o processamento de saúde encerra.
     */
    const verificarSaude = async (tentativa: number = 1) => {
      // Constantes arquiteturais de resiliência
      const MAX_TENTATIVAS = 5;
      const TEMPO_BASE_MS = 3000;
      const CAP_TEMPO_MS = 20000;

      try {
        const res = await fetch("/api/health");

        // POR QUE TRATAMOS O STATUS 429 ESPECIALMENTE:
        // A API possui limites estritos de requisições por minuto. Caso recebamos um HTTP 429 (Rate Limited),
        // em vez de criarmos um loop infinito de 5 segundos que sobrecarrega ainda mais a nuvem, lançamos
        // um erro dedicado. Isso permite que a chamada caia no fluxo padrão de Exponential Backoff (que estica
        // o tempo de espera progressivamente) e acione o Circuit Breaker se a situação persistir por 5 tentativas.
        if (res.status === 429) {
          throw new Error("Rate limit atingido (HTTP 429)");
        }

        // Erros Críticos (Falhas definitivas onde retentar é inútil)
        if (res.status === 403 || res.status === 503) {
          setMensagem(res.status === 403 ? "Acesso negado: Chave de API inválida" : "Serviço indisponível: Falha nos recursos");
          setTimeout(() => router.push("/formulario"), 3000);
          return;
        }

        // Cenário de comunicação bem-sucedida
        if (res.ok) {
          const data = await res.json().catch(() => ({}));

          // Trata os casos onde o contêiner de ML/API está em processo de boot
          if (data.status === "warming_up" || data.ml_api === "waking_up") {
            throw new Error("Warming up"); // Força a cair no catch para aplicar o Backoff
          }

          // Gatilho final: API totalmente pronta. Libera o carregamento em paralelo.
          if (data.status === "healthy") {
            processarAnalise();
            return;
          }
        }

        // Fallback: qualquer status não-ok (ex: 502/504) indica que o backend falhou ou está subindo.
        throw new Error(`API não pronta ou indisponível (Status: ${res.status})`);
      } catch (error) {
        // O Circuit Breaker atua: Excedeu as 5 tentativas e corta o loop de sondagem.
        if (tentativa >= MAX_TENTATIVAS) {
          if (process.env.NODE_ENV === 'development') {
            console.error("[Circuit Breaker] Falha na verificação de saúde após número máximo de tentativas.");
          }
          setMensagem("Serviço temporariamente indisponível. Tente novamente mais tarde");
          setTimeout(() => router.push("/formulario"), 4000);
          return;
        }

        // Exponential Backoff: Aumenta progressivamente o tempo de espera
        // Fórmula: min(3000 * 2^(tentativa - 1), 20000)
        const tempoEspera = Math.min(TEMPO_BASE_MS * Math.pow(2, tentativa - 1), CAP_TEMPO_MS);
        
        // REGRA DE NEGÓCIO: Mensagem personalizada de acordo com o tipo de falha
        // Se for um Rate Limit (429), exibimos feedback de "Muitas requisições" em vez de "Esperando API acordar".
        if (error instanceof Error && error.message.includes("HTTP 429")) {
          setMensagem("Muitas requisições. Aguardando liberação");
        } else {
          setMensagem("Esperando API acordar");
        }
        
        // Agenda a próxima tentativa aplicando o delay calculado
        setTimeout(() => verificarSaude(tentativa + 1), tempoEspera);
      }
    };

    verificarSaude(1);
  }, [dadosFazenda, router, setDiagnosticoIA, setResultadoSimulacao]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-fundo p-6">
      <div className="w-full max-w-md text-center space-y-8 animate-pulse">
        {/* Logo Educampo para reforço de marca */}
        <div className="relative h-20 w-48 mx-auto">
          <Image
            src="/logo_educampo.png"
            alt="Logo Educampo"
            fill
            className="object-contain"
            priority
          />
        </div>

        {/* Spinner Visual */}
        <div className="flex justify-center">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-secondary flex items-center justify-center">
            <span>{mensagem}</span>
            <span className="w-6 text-left">{dots}</span>
          </h2>
          <p className="text-sm text-gray-500">
            Isso pode levar alguns segundos, estamos cruzando seus dados com o benchmarking do setor.
          </p>
        </div>
      </div>
    </main>
  );
}