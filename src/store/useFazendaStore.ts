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
 * Valores manipulados nos sliders e inputs da tela de simulação.
 */
export interface ValoresSimulacao {
  total_vacas: number;
  percentual_lactacao: number;
  producao_vaca: number;
  preco_recebido: number;
  area_atividade: number;
  ccs: number;
  numero_trabalhadores: number;
  custo_concentrado: number;
}

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
  /** Valores manipulados nos sliders da simulação. */
  valoresSimulacao: ValoresSimulacao | null;

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
  /** Define os valores da simulação no estado global. */
  setValoresSimulacao: (valores: ValoresSimulacao | null) => void;
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
      valoresSimulacao: null,

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

      setValoresSimulacao: (valores) => {
        set({ valoresSimulacao: valores });
      },

      limparDados: () => {
        set({
          dadosFazenda: null,
          diagnosticoIA: null,
          resultadoSimulacao: null,
          telemetry: null,
          apiHealthy: false,
          valoresSimulacao: null,
        });
      },
    }),
    {
      name: 'educampo-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);