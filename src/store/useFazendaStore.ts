/**
 * @fileoverview Gerenciamento de estado global utilizando Zustand.
 * @description
 * Esta store é responsável por manter a persistência em memória dos dados da fazenda,
 * diagnósticos de IA, simulações e métricas de telemetria de IA.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { FazendaFormData } from '../lib/schemas';
import { AiTelemetry } from '../lib/apiUtils';

/**
 * Interface que define a estrutura do estado da fazenda e suas ações.
 */
interface FazendaState {
  /** Dados preenchidos no formulário de coleta. */
  dadosFazenda: FazendaFormData | null;
  /** Dados do diagnóstico retornado pela API da IA. */
  diagnosticoIA: any | null;
  /** Dados da simulação inicial retornado pela API de ML. */
  resultadoSimulacao: any | null;
  /** Dados de telemetria de IA (tokens, custo USD, provider). */
  telemetry: AiTelemetry | null;
  /** Flag de saúde da API externa. */
  apiHealthy: boolean;

  /** Define os dados da fazenda no estado global. */
  setDadosFazenda: (dados: FazendaFormData) => void;
  /** Define os dados do diagnóstico no estado global. */
  setDiagnosticoIA: (diagnosticoIA: any) => void;
  /** Define os dados da simulação no estado global. */
  setResultadoSimulacao: (resultado: any) => void;
  /** Define as métricas de telemetria no estado global. */
  setTelemetry: (telemetry: AiTelemetry | null) => void;
  /** Sinaliza que a API externa foi confirmada como saudável (healthy). */
  setApiHealthy: (healthy: boolean) => void;
  /** Reseta a store para o estado inicial (limpeza de sessão). */
  limparDados: () => void;
}

export const useFazendaStore = create<FazendaState>()(
  persist(
    (set) => ({
      dadosFazenda: null,
      diagnosticoIA: null,
      resultadoSimulacao: null,
      telemetry: null,
      apiHealthy: false,

      setDadosFazenda: (dados) => {
        set({ dadosFazenda: dados });
      },

      setDiagnosticoIA: (diagnosticoIA) => {
        set({ diagnosticoIA });
      },

      setResultadoSimulacao: (resultado) => {
        set({ resultadoSimulacao: resultado });
      },

      setTelemetry: (telemetry) => {
        set({ telemetry });
      },

      setApiHealthy: (healthy) => {
        set({ apiHealthy: healthy });
      },

      limparDados: () => {
        set({ dadosFazenda: null, diagnosticoIA: null, resultadoSimulacao: null, telemetry: null, apiHealthy: false });
      },
    }),
    {
      name: 'educampo-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);