/**
 * @file src/components/FazendasCadastradasGrid.tsx
 * @description Componente UI para exibição de fazendas cadastradas em formato de grid de cards,
 * com suporte a busca textual (nome/e-mail) e disparo direto de diagnóstico.
 * Ref: Obsidian note [[sdd-03-lista-fazendas-diagnostico]]
 */

'use client';

import React, { useState } from 'react';
import { FazendaCadastradaItem, getFazendaNome, getFazendaEmail } from '@/types/formulario';
import { Home, Play, Loader2, AlertCircle, Search } from 'lucide-react';

export interface FazendasCadastradasGridProps {
  fazendas: FazendaCadastradaItem[];
  onCarregarFormulario?: (nome: string) => void;
  onIniciarDiagnostico: (nome: string) => Promise<void>;
  isLoadingGlobal?: boolean;
}

interface FazendaCardProps {
  nome: string;
  email?: string;
  isLoadingThis: boolean;
  isLoadingGlobal: boolean;
  erro?: string;
  onDiagnostico: (nome: string) => void;
}

const FazendaCard: React.FC<FazendaCardProps> = ({
  nome,
  email,
  isLoadingThis,
  isLoadingGlobal,
  erro,
  onDiagnostico,
}) => {
  const isDisabled = isLoadingThis || isLoadingGlobal;

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-bold text-gray-800 text-base line-clamp-2">{nome}</h3>
          <span className="text-xs font-semibold px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full shrink-0">
            Cadastrada
          </span>
        </div>
        {email && <p className="text-xs text-gray-500 mb-3 truncate">{email}</p>}

        {erro && (
          <div className="my-3 p-2 bg-red-50 text-red-600 text-xs rounded border border-red-200 flex items-center gap-1.5">
            <AlertCircle size={14} className="shrink-0" />
            <span>{erro}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 mt-4 pt-3 border-t border-gray-100">
        <button
          type="button"
          onClick={() => onDiagnostico(nome)}
          disabled={isDisabled}
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
      </div>
    </div>
  );
};

export const FazendasCadastradasGrid: React.FC<FazendasCadastradasGridProps> = ({
  fazendas,
  onIniciarDiagnostico,
  isLoadingGlobal = false,
}) => {
  const [loadingFarm, setLoadingFarm] = useState<string | null>(null);
  const [erroFarm, setErroFarm] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');

  if (!fazendas || fazendas.length === 0) {
    return null;
  }

  const fazendasFiltradas = fazendas.filter((item) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const nome = getFazendaNome(item).toLowerCase();
    const email = getFazendaEmail(item).toLowerCase();
    return nome.includes(term) || email.includes(term);
  });

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600 text-white rounded-lg shadow-sm">
            <Home size={22} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Fazendas Cadastradas</h2>
            <p className="text-sm text-gray-600">
              Selecione uma fazenda cadastrada para iniciar o diagnóstico diretamente.
            </p>
          </div>
        </div>

        {/* Campo de Busca por Nome ou Email */}
        <div className="relative w-full md:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search size={16} />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por nome ou e-mail..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 shadow-sm"
            aria-label="Pesquisar fazendas cadastradas"
            data-testid="busca-fazenda-input"
          />
        </div>
      </div>

      {fazendasFiltradas.length === 0 ? (
        <div className="bg-white p-6 text-center rounded-xl border border-gray-200 text-gray-500 text-sm">
          Nenhuma fazenda encontrada com os termos digitados.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {fazendasFiltradas.map((item, idx) => {
            const nome = getFazendaNome(item);
            const email = getFazendaEmail(item);
            return (
              <FazendaCard
                key={idx}
                nome={nome}
                email={email}
                isLoadingThis={loadingFarm === nome}
                isLoadingGlobal={isLoadingGlobal}
                erro={erroFarm[nome]}
                onDiagnostico={handleDiagnostico}
              />
            );
          })}
        </div>
      )}
    </section>
  );
};
