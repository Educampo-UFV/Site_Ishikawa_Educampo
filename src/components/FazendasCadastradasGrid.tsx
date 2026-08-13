/**
 * @file src/components/FazendasCadastradasGrid.tsx
 * @description Componente UI para exibição de fazendas cadastradas em formato de grid de cards,
 * com suporte a carregamento no formulário e disparo direto de diagnóstico.
 * Ref: Obsidian note [[sdd-03-lista-fazendas-diagnostico]]
 */

'use client';

import React, { useState } from 'react';
import { FazendaCadastradaItem } from '@/types/formulario';
import { Home, Play, FileText, Loader2, AlertCircle } from 'lucide-react';

export interface FazendasCadastradasGridProps {
  fazendas: FazendaCadastradaItem[];
  onCarregarFormulario: (nome: string) => void;
  onIniciarDiagnostico: (nome: string) => Promise<void>;
  isLoadingGlobal?: boolean;
}

function getFazendaNome(item: FazendaCadastradaItem): string {
  if (typeof item === 'object' && item !== null && 'nome' in item) {
    return item.nome;
  }
  return String(item);
}

export const FazendasCadastradasGrid: React.FC<FazendasCadastradasGridProps> = ({
  fazendas,
  onCarregarFormulario,
  onIniciarDiagnostico,
  isLoadingGlobal = false,
}) => {
  const [loadingFarm, setLoadingFarm] = useState<string | null>(null);
  const [erroFarm, setErroFarm] = useState<Record<string, string>>({});

  if (!fazendas || fazendas.length === 0) {
    return null;
  }

  const handleDiagnostico = async (nome: string) => {
    setLoadingFarm(nome);
    setErroFarm((prev) => ({ ...prev, [nome]: '' }));
    try {
      await onIniciarDiagnostico(nome);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Falha ao iniciar diagnóstico';
      setErroFarm((prev) => ({ ...prev, [nome]: msg }));
    } finally {
      setLoadingFarm(null);
    }
  };

  return (
    <section className="bg-blue-50/70 p-6 md:p-8 rounded-xl border border-blue-100 shadow-sm mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-600 text-white rounded-lg shadow-sm">
          <Home size={22} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Fazendas Cadastradas</h2>
          <p className="text-sm text-gray-600">
            Selecione uma fazenda para autopopular os dados ou inicie o diagnóstico diretamente.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {fazendas.map((item, idx) => {
          const nome = getFazendaNome(item);
          const isLoadingThis = loadingFarm === nome;
          const erro = erroFarm[nome];

          return (
            <div
              key={idx}
              className="bg-white rounded-xl p-5 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-bold text-gray-800 text-base line-clamp-2">{nome}</h3>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full shrink-0">
                    Cadastrada
                  </span>
                </div>

                {erro && (
                  <div className="mb-3 p-2 bg-red-50 text-red-600 text-xs rounded border border-red-200 flex items-center gap-1.5">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{erro}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 mt-4 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => handleDiagnostico(nome)}
                  disabled={isLoadingThis || isLoadingGlobal}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold text-sm py-2 px-3 rounded-lg shadow-sm transition-colors"
                  aria-label={`Iniciar Diagnóstico para ${nome}`}
                >
                  {isLoadingThis ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Processando...</span>
                    </>
                  ) : (
                    <>
                      <Play size={16} />
                      <span>Iniciar Diagnóstico</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onCarregarFormulario(nome)}
                  disabled={isLoadingThis || isLoadingGlobal}
                  className="w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 disabled:opacity-50 text-gray-700 font-medium text-xs py-2 px-3 rounded-lg border border-gray-200 transition-colors"
                  aria-label={`Carregar ${nome} no formulário`}
                >
                  <FileText size={14} />
                  <span>Carregar no Formulário</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
