/**
 * @fileoverview Gerenciamento de estado global utilizando Zustand.
 * @description
 * Esta store é responsável por manter a persistência em memória dos dados da fazenda
 * preenchidos pelo produtor. Ela atua como a única fonte de verdade para os dados
 * que serão enviados ao BFF e posteriormente renderizados no Dashboard e no Diagrama de Ishikawa.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { FazendaFormData } from '../lib/schemas';

/**
 * Interface que define a estrutura do estado da fazenda e suas ações.
 */
interface FazendaState {
  /** Dados preenchidos no formulário de coleta. */
  dadosFazenda: FazendaFormData | null;
  /** Dados do diagnóstico retornado pela API da IA. */
  diagnosticoIA: any | null; // TODO: Substituir 'any' pelo tipo correto extraído do Zod (ex: DiagnosticoData)
  /** Define os dados da fazenda no estado global. */
  setDadosFazenda: (dados: FazendaFormData) => void;
  /** Define os dados do diagnóstico no estado global. */
  setDiagnosticoIA: (diagnosticoIA: any) => void;
  /** Reseta a store para o estado inicial (limpeza de sessão). */
  limparDados: () => void;
}

/**
 * Hook customizado useFazendaStore.
 * @description
 * Implementa a store com suporte a mutações simples e seguras.
 * Foi adicionado o middleware persist para manter os dados no sessionStorage.
 */
export const useFazendaStore = create<FazendaState>()(
  persist(
    (set) => ({
      dadosFazenda: null,
      diagnosticoIA: null,

      setDadosFazenda: (dados) => {
        set({ dadosFazenda: dados });
      },

      setDiagnosticoIA: (diagnosticoIA) => {
        set({ diagnosticoIA });
      },

      limparDados: () => {
        set({ dadosFazenda: null, diagnosticoIA: null });
      },
    }),
    {
      name: 'educampo-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);