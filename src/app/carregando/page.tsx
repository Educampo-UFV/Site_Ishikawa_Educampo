/**
 * @file page.tsx (Carregando)
 * @description Tela de transição e processamento de dados.
 * Responsabilidades:
 * 1. Recuperar os dados da fazenda salvos no Zustand.
 * 2. Enviar os dados para a API interna (BFF).
 * 3. Gerenciar o estado de espera visual do usuário com feedback elegante.
 * 4. Salvar o diagnóstico retornado no estado global e redirecionar para o Diagnóstico.
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FazendaFormData } from "@/lib/schemas";
import { useFazendaStore } from "@/store/useFazendaStore"; 
import Image from "next/image";

/**
 * @description Define a faixa estatística de produção baseada no volume gerado.
 * É essencial como insumo (feature) para o modelo de Machine Learning no backend.
 * @param diaria Volume diário total projetado.
 * @returns String contendo o quartil estatístico.
 */
const getFaixaProducao = (diaria: number) => {
  if (diaria < 500) return "< 500";
  if (diaria <= 1000) return "500-1000";
  if (diaria <= 2000) return "1000-2000";
  if (diaria <= 5000) return "2000-5000";
  return "> 5000";
};

export default function CarregandoPage() {
  const router = useRouter();
  const { dadosFazenda, setDiagnosticoIA, setResultadoSimulacao } = useFazendaStore();
  const [mensagem, setMensagem] = useState("Preparando análise...");

  useEffect(() => {
    /**
     * @description Função assíncrona para disparar a análise assim que a tela monta.
     * Caso não existam dados na store (acesso direto à URL), redireciona para o formulário.
     */
    const processarAnalise = async () => {
      if (!dadosFazenda) {
        router.push("/formulario");
        return;
      }

      try {
        setMensagem("A Inteligência Artificial está projetando seus cenários...");

        // Prepara os payloads para as duas requisições
        const producaoDiaria = (dadosFazenda.producao_vaca || 0) * (dadosFazenda.vacas_lactacao || 0);
        const payloadSimulacao = {
          sistema_producao: dadosFazenda.sistema_producao,
          regiao_sebrae: dadosFazenda.regiao,
          faixa_producao: getFaixaProducao(producaoDiaria),
          total_vacas: dadosFazenda.total_vacas,
          vacas_lactacao: dadosFazenda.vacas_lactacao,
          area_atividade: dadosFazenda.area_atividade,
          numero_trabalhadores: dadosFazenda.mao_obra_total,
          preco_concentrado: dadosFazenda.preco_concentrado || 1.81,
          producao_vaca: dadosFazenda.producao_vaca,
          preco_recebido: dadosFazenda.preco_leite,
          ccs: dadosFazenda.ccs,
        };

        // Dispara as duas requisições em paralelo para otimizar o tempo de espera
        const [diagResponse, simResponse] = await Promise.all([
          fetch("/api/diagnostico", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dadosFazenda),
          }),
          fetch("/api/simulacao", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payloadSimulacao),
          }),
        ]);

        if (!diagResponse.ok || !simResponse.ok) {
          throw new Error("Erro na comunicação com os servidores de análise.");
        }

        const diagData = await diagResponse.json();
        const simData = await simResponse.json();

        // Injeta os dois resultados no estado global
        setDiagnosticoIA(diagData);
        setResultadoSimulacao(simData);

        setMensagem("Análise concluída! Montando seu Diagnóstico...");

        // Pequeno delay para garantir que o usuário veja a conclusão antes da troca de tela
        setTimeout(() => router.push("/diagnostico"), 1500);
      } catch (error) {
        console.error("Falha no processamento:", error);
        setMensagem("Ocorreu um erro ao processar os dados. Redirecionando...");
        setTimeout(() => router.push("/formulario"), 3000);
      }
    };

    processarAnalise();
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
          <h2 className="text-xl font-bold text-secondary">{mensagem}</h2>
          <p className="text-sm text-gray-500">
            Isso pode levar alguns segundos, estamos cruzando seus dados com o benchmarking do setor.
          </p>
        </div>
      </div>
    </main>
  );
}