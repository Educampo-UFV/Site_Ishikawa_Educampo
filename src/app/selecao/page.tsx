/**
 * @file src/app/selecao/page.tsx
 * @description Tela de Seleção (Split Screen) exibida após a tela de carregamento.
 * Implementa o padrão "Dual Action Screen", permitindo ao produtor escolher
 * visualmente entre acessar o Painel de Diagnóstico ou o Simulador de Cenários.
 * 
 * PROTEÇÃO DE ROTA (Route Guard):
 * Consome `dadosFazenda` do Zustand. Se o usuário acessar esta tela sem ter
 * preenchido o formulário (ex: navegação direta pela URL), é redirecionado
 * automaticamente para `/formulario`.
 * 
 * @returns {React.JSX.Element} Interface renderizada com dois grandes painéis interativos.
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BarChart2, Lightbulb } from "lucide-react";
import { useFazendaStore } from "@/store/useFazendaStore";

export default function SelecaoPage() {
  const router = useRouter();
  const { dadosFazenda } = useFazendaStore();
  const [isMounted, setIsMounted] = useState(false);

  // Estado que controla qual lado da tela está recebendo o foco do mouse.
  // Pode ser 'diagnostico', 'simulacao' ou null (estado neutro / cursor fora).
  const [foco, setFoco] = useState<"diagnostico" | "simulacao" | null>(null);

  /**
   * @description Efeito colateral disparado na montagem do componente no cliente.
   * Marca `isMounted` como true para evitar problemas de "hydration mismatch" do Next.js.
   */
  useEffect(() => {
    setIsMounted(true);
  }, []);

  /**
   * @description Efeito de proteção da rota (Route Guard) visual.
   * Se o componente montou e não há `dadosFazenda` populado no Zustand (ex: acesso direto pela URL),
   * força o redirecionamento imperativo para a etapa inicial em `/formulario`.
   */
  useEffect(() => {
    if (isMounted && !dadosFazenda) {
      router.push('/formulario');
    }
  }, [dadosFazenda, isMounted, router]);

  // Aguarda a hidratação do cliente para evitar erros do Next.js com dados persistidos
  if (!isMounted || !dadosFazenda) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="h-12 w-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  return (
    /* O contêiner principal ocupa toda a tela (h-screen) e bloqueia a rolagem (overflow-hidden).
       No mobile, os painéis empilham verticalmente (flex-col). No desktop, lado a lado (md:flex-row). */
    <main className="relative flex h-screen w-full flex-col md:flex-row overflow-hidden bg-slate-900">
      
      {/* LADO ESQUERDO: Painel de Diagnóstico */}
      <Link
        href="/diagnostico"
        prefetch={false}
        onMouseEnter={() => setFoco("diagnostico")}
        onMouseLeave={() => setFoco(null)}
        className={`
          relative flex flex-1 flex-col items-center justify-center p-8 transition-all duration-700 ease-in-out
          ${foco === "diagnostico" ? "md:flex-[1.15] bg-[#1973d3] z-10 shadow-2xl" : "bg-[#145aab]"}
          ${foco === "simulacao" ? "md:flex-[0.85] opacity-50 grayscale brightness-50 blur-[2px]" : "opacity-100"}
          border-b-4 md:border-b-0 md:border-r-4 border-slate-900/50 hover:border-transparent group
        `}
        aria-label="Ir para a tela de Diagnóstico"
      >
        {/* Bloco visual interno do Diagnóstico (Ícone, Título e Texto) */}
        <div className={`
          flex flex-col items-center text-center transition-transform duration-500
          ${foco === "diagnostico" ? "scale-110 translate-y-0" : "scale-100 md:translate-y-4"}
        `}>
          <BarChart2 size={80} className={`mb-6 transition-colors duration-500 ${foco === "diagnostico" ? "text-white" : "text-blue-200"}`} />
          <h2 className={`text-4xl md:text-5xl font-extrabold mb-4 transition-colors duration-500 ${foco === "diagnostico" ? "text-white" : "text-blue-100"}`}>
            Diagnóstico
          </h2>
          <p className={`max-w-sm text-lg transition-opacity duration-500 ${foco === "diagnostico" ? "opacity-100 text-blue-50" : "opacity-90 text-blue-200 md:opacity-70"}`}>
            Descubra as causas raízes e veja seu comparativo de mercado.
          </p>
        </div>
      </Link>

      {/* LADO DIREITO: Painel de Simulação */}
      <Link
        href="/simulacao"
        prefetch={false}
        onMouseEnter={() => setFoco("simulacao")}
        onMouseLeave={() => setFoco(null)}
        className={`
          relative flex flex-1 flex-col items-center justify-center p-8 transition-all duration-700 ease-in-out
          ${foco === "simulacao" ? "md:flex-[1.15] bg-amber-500 z-10 shadow-2xl" : "bg-amber-600"}
          ${foco === "diagnostico" ? "md:flex-[0.85] opacity-50 grayscale brightness-50 blur-[2px]" : "opacity-100"}
        `}
        aria-label="Ir para a tela do Simulador de Cenários"
      >
        {/* Bloco visual interno do Simulador (Ícone, Título e Texto) */}
        <div className={`
          flex flex-col items-center text-center transition-transform duration-500
          ${foco === "simulacao" ? "scale-110 translate-y-0" : "scale-100 md:translate-y-4"}
        `}>
          <Lightbulb size={80} className={`mb-6 transition-colors duration-500 ${foco === "simulacao" ? "text-white" : "text-amber-200"}`} />
          <h2 className={`text-4xl md:text-5xl font-extrabold mb-4 transition-colors duration-500 ${foco === "simulacao" ? "text-white" : "text-amber-100"}`}>
            Simulador
          </h2>
          <p className={`max-w-sm text-lg transition-opacity duration-500 ${foco === "simulacao" ? "opacity-100 text-amber-50" : "opacity-90 text-amber-200 md:opacity-70"}`}>
            Projete cenários e descubra como aumentar sua margem de lucro.
          </p>
        </div>
      </Link>
      
    </main>
  );
}