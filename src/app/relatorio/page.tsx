/**
 * @file src/app/relatorio/page.tsx
 * @description Página de customização e emissão do Relatório Executivo em PDF.
 * Permite ao usuário filtrar detalhadamente quais blocos, benchmarking, simulações,
 * severidades e pilares de Ishikawa estarão presentes no relatório antes da exportação.
 * Ref: Obsidian note [[sdd-relatorio-produtor-pdf.md]]
 */

"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/ui/Navbar';
import { useFazendaStore } from '@/store/useFazendaStore';
import {
  FileText,
  Download,
  ExternalLink,
  CheckSquare,
  Square,
  RotateCcw,
  Sparkles,
  BarChart3,
  Lightbulb,
  GitFork,
  Check,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Building2,
  MapPin,
  Layers,
} from 'lucide-react';
import {
  ReportFilterPayload,
  getDefaultReportFilterPayload,
  getAllReportFilterPayload,
  PILARES_ISHIKAWA_LABELS,
  SEVERIDADES_ISHIKAWA_LABELS,
  INDICADORES_ISHIKAWA_DEFAULT_LIST,
  PilaresIshikawaFilter,
  SeveridadesIshikawaFilter,
} from '@/types/relatorio';

export default function RelatorioPage() {
  const router = useRouter();
  const { dadosFazenda } = useFazendaStore();
  const [isMounted, setIsMounted] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [actionType, setActionType] = useState<'download' | 'preview' | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [expandedIshikawa, setExpandedIshikawa] = useState<Record<string, boolean>>({
    ccs: true,
    producao_vaca: true,
  });

  // Estado dos filtros
  const [filters, setFilters] = useState<Required<ReportFilterPayload>>(getDefaultReportFilterPayload);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Totalizador de itens selecionados vs totais
  const totalCounts = useMemo(() => {
    let total = 0;
    let selected = 0;

    // Resumo
    total += 2;
    if (filters.secao_resumo.visao_geral) selected++;
    if (filters.secao_resumo.evidencias_raciocinios) selected++;

    // Benchmarking
    const benchKeys = Object.keys(filters.secao_benchmarking) as Array<keyof typeof filters.secao_benchmarking>;
    total += benchKeys.length;
    benchKeys.forEach((k) => {
      if (filters.secao_benchmarking[k]) selected++;
    });

    // Simulações
    const finKeys = Object.keys(filters.secao_simulacoes.financeiras) as Array<keyof typeof filters.secao_simulacoes.financeiras>;
    const estKeys = Object.keys(filters.secao_simulacoes.estaticas) as Array<keyof typeof filters.secao_simulacoes.estaticas>;
    const opKeys = Object.keys(filters.secao_simulacoes.operacionais) as Array<keyof typeof filters.secao_simulacoes.operacionais>;
    total += finKeys.length + estKeys.length + opKeys.length;
    finKeys.forEach((k) => { if (filters.secao_simulacoes.financeiras[k]) selected++; });
    estKeys.forEach((k) => { if (filters.secao_simulacoes.estaticas[k]) selected++; });
    opKeys.forEach((k) => { if (filters.secao_simulacoes.operacionais[k]) selected++; });

    // Ishikawa
    total += 1; // incluir_analise_causa
    if (filters.secao_ishikawa.incluir_analise_causa) selected++;

    const sevKeys = Object.keys(filters.secao_ishikawa.severidades) as Array<keyof typeof filters.secao_ishikawa.severidades>;
    total += sevKeys.length;
    sevKeys.forEach((k) => { if (filters.secao_ishikawa.severidades[k]) selected++; });

    INDICADORES_ISHIKAWA_DEFAULT_LIST.forEach(({ slug }) => {
      const ind = filters.secao_ishikawa.indicadores[slug];
      if (ind) {
        total += 1; // ind.incluir
        if (ind.incluir) selected++;
        const pilarKeys = Object.keys(ind.pilares) as Array<keyof PilaresIshikawaFilter>;
        total += pilarKeys.length;
        pilarKeys.forEach((p) => {
          if (ind.pilares[p]) selected++;
        });
      }
    });

    return { total, selected };
  }, [filters]);

  // Ações em Lote
  const handleSelectAll = () => {
    const next = getAllReportFilterPayload();
    setFilters(next);
  };

  const handleUnselectAll = () => {
    const next: Required<ReportFilterPayload> = {
      secao_resumo: { visao_geral: false, evidencias_raciocinios: false },
      secao_benchmarking: {
        sistema_producao: false,
        faixa_producao: false,
        ccs: false,
        producao_vaca: false,
        producao_area: false,
        producao_trabalhador: false,
        preco_leite: false,
        percentual_vacas_lactacao: false,
        lotacao_animal: false,
      },
      secao_simulacoes: {
        financeiras: { custo_leite: false, margem_litro: false, margem_ano: false },
        estaticas: { ccs: false, producao_vaca: false },
        operacionais: { producao_trabalhador: false, producao_area: false },
      },
      secao_ishikawa: {
        incluir_analise_causa: false,
        severidades: { critica: false, atencao: false, monitorar: false, neutra: false },
        indicadores: {},
      },
    };

    INDICADORES_ISHIKAWA_DEFAULT_LIST.forEach(({ slug }) => {
      next.secao_ishikawa.indicadores[slug] = {
        incluir: false,
        pilares: {
          mao_de_obra: false,
          metodos: false,
          maquinas: false,
          meio_ambiente: false,
          medicao: false,
          materia_prima: false,
        },
      };
    });

    setFilters(next);
  };

  const handleResetDefaults = () => {
    setFilters(getDefaultReportFilterPayload());
  };

  // Toggle helpers
  const toggleResumo = (key: keyof typeof filters.secao_resumo) => {
    setFilters((prev) => ({
      ...prev,
      secao_resumo: { ...prev.secao_resumo, [key]: !prev.secao_resumo[key] },
    }));
  };

  const toggleBenchmarking = (key: keyof typeof filters.secao_benchmarking) => {
    setFilters((prev) => ({
      ...prev,
      secao_benchmarking: { ...prev.secao_benchmarking, [key]: !prev.secao_benchmarking[key] },
    }));
  };

  const toggleSimulacaoFinanceira = (key: keyof typeof filters.secao_simulacoes.financeiras) => {
    setFilters((prev) => ({
      ...prev,
      secao_simulacoes: {
        ...prev.secao_simulacoes,
        financeiras: { ...prev.secao_simulacoes.financeiras, [key]: !prev.secao_simulacoes.financeiras[key] },
      },
    }));
  };

  const toggleSimulacaoEstatica = (key: keyof typeof filters.secao_simulacoes.estaticas) => {
    setFilters((prev) => ({
      ...prev,
      secao_simulacoes: {
        ...prev.secao_simulacoes,
        estaticas: { ...prev.secao_simulacoes.estaticas, [key]: !prev.secao_simulacoes.estaticas[key] },
      },
    }));
  };

  const toggleSimulacaoOperacional = (key: keyof typeof filters.secao_simulacoes.operacionais) => {
    setFilters((prev) => ({
      ...prev,
      secao_simulacoes: {
        ...prev.secao_simulacoes,
        operacionais: { ...prev.secao_simulacoes.operacionais, [key]: !prev.secao_simulacoes.operacionais[key] },
      },
    }));
  };

  const toggleIshikawaAnaliseCausa = () => {
    setFilters((prev) => ({
      ...prev,
      secao_ishikawa: {
        ...prev.secao_ishikawa,
        incluir_analise_causa: !prev.secao_ishikawa.incluir_analise_causa,
      },
    }));
  };

  const toggleSeveridade = (key: keyof SeveridadesIshikawaFilter) => {
    setFilters((prev) => ({
      ...prev,
      secao_ishikawa: {
        ...prev.secao_ishikawa,
        severidades: { ...prev.secao_ishikawa.severidades, [key]: !prev.secao_ishikawa.severidades[key] },
      },
    }));
  };

  const toggleIndicadorIshikawa = (slug: string) => {
    setFilters((prev) => {
      const current = prev.secao_ishikawa.indicadores[slug] || {
        incluir: false,
        pilares: {
          mao_de_obra: true,
          metodos: true,
          maquinas: true,
          meio_ambiente: true,
          medicao: true,
          materia_prima: true,
        },
      };
      return {
        ...prev,
        secao_ishikawa: {
          ...prev.secao_ishikawa,
          indicadores: {
            ...prev.secao_ishikawa.indicadores,
            [slug]: { ...current, incluir: !current.incluir },
          },
        },
      };
    });
  };

  const togglePilarIshikawa = (slug: string, pilar: keyof PilaresIshikawaFilter) => {
    setFilters((prev) => {
      const current = prev.secao_ishikawa.indicadores[slug] || {
        incluir: true,
        pilares: {
          mao_de_obra: true,
          metodos: true,
          maquinas: true,
          meio_ambiente: true,
          medicao: true,
          materia_prima: true,
        },
      };
      return {
        ...prev,
        secao_ishikawa: {
          ...prev.secao_ishikawa,
          indicadores: {
            ...prev.secao_ishikawa.indicadores,
            [slug]: {
              ...current,
              pilares: {
                ...current.pilares,
                [pilar]: !current.pilares[pilar],
              },
            },
          },
        },
      };
    });
  };

  const toggleAllPilaresForIndicator = (slug: string, enableAll: boolean) => {
    setFilters((prev) => {
      const current = prev.secao_ishikawa.indicadores[slug] || {
        incluir: true,
        pilares: {
          mao_de_obra: true,
          metodos: true,
          maquinas: true,
          meio_ambiente: true,
          medicao: true,
          materia_prima: true,
        },
      };
      return {
        ...prev,
        secao_ishikawa: {
          ...prev.secao_ishikawa,
          indicadores: {
            ...prev.secao_ishikawa.indicadores,
            [slug]: {
              ...current,
              pilares: {
                mao_de_obra: enableAll,
                metodos: enableAll,
                maquinas: enableAll,
                meio_ambiente: enableAll,
                medicao: enableAll,
                materia_prima: enableAll,
              },
            },
          },
        },
      };
    });
  };

  // Disparo da Requisição PDF via POST
  const handleGerarRelatorio = async (mode: 'download' | 'preview') => {
    const produtorId = dadosFazenda?.id_fazenda || dadosFazenda?.nome_fazenda;

    if (!produtorId) {
      setErrorMessage('Nenhuma fazenda selecionada para emissão do relatório.');
      return;
    }

    if (totalCounts.selected === 0) {
      setErrorMessage('Selecione ao menos um item ou indicador para compor o relatório.');
      return;
    }

    setErrorMessage(null);
    setIsGeneratingPdf(true);
    setActionType(mode);

    try {
      const response = await fetch(`/api/produtores/${encodeURIComponent(produtorId)}/relatorio/pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filters),
      });

      if (!response.ok) {
        if (response.status === 404) {
          setErrorMessage('Esta fazenda ainda não possui dados de diagnóstico salvos para gerar o relatório.');
          return;
        }
        const errJson = await response.json().catch(() => ({}));
        setErrorMessage(errJson.error || 'Ocorreu um erro ao gerar o arquivo PDF customizado.');
        return;
      }

      const blob = await response.blob();
      const pdfUrl = window.URL.createObjectURL(blob);

      if (mode === 'preview') {
        window.open(pdfUrl, '_blank');
      } else {
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.setAttribute('download', `relatorio_produtor_${produtorId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => window.URL.revokeObjectURL(pdfUrl), 10000);
      }
    } catch (error) {
      console.error('Erro ao emitir relatório em PDF customizado:', error);
      setErrorMessage('Ocorreu um erro de conexão ao tentar gerar o relatório.');
    } finally {
      setIsGeneratingPdf(false);
      setActionType(null);
    }
  };

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-24">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-6">
        
        {/* Cabeçalho da Página */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-50 rounded-full blur-3xl -z-0 pointer-events-none transform translate-x-1/3 -translate-y-1/3" />
          
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100/70 border border-emerald-200 rounded-full text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-3">
                <FileText size={14} className="text-emerald-700" />
                Relatório Executivo PDF
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Personalização de Relatório
              </h1>
              <p className="text-slate-500 text-sm sm:text-base mt-1 max-w-2xl">
                Selecione as seções, métricas e pilares que farão parte do documento executivo final para exportação.
              </p>

              {/* Informações da Fazenda Ativa */}
              {dadosFazenda ? (
                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-600 font-medium">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-xl border border-slate-200">
                    <Building2 size={14} className="text-slate-500" />
                    <strong>{dadosFazenda.nome_fazenda || 'Fazenda'}</strong>
                  </span>
                  {dadosFazenda.sistema_producao && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-xl border border-slate-200 capitalize">
                      <Layers size={14} className="text-slate-500" />
                      Sistema: {dadosFazenda.sistema_producao}
                    </span>
                  )}
                  {dadosFazenda.regiao && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-xl border border-slate-200 capitalize">
                      <MapPin size={14} className="text-slate-500" />
                      Região: {dadosFazenda.regiao}
                    </span>
                  )}
                </div>
              ) : (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl flex items-center gap-2">
                  <AlertCircle size={18} className="shrink-0 text-amber-600" />
                  <span>Nenhuma fazenda selecionada. Selecione uma fazenda para habilitar o download.</span>
                </div>
              )}
            </div>

            {/* Contador e Ações Globais */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 shrink-0">
              <div className="px-4 py-2 bg-slate-100 rounded-2xl border border-slate-200 flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-slate-700">
                  <strong data-testid="selected-count" className="text-emerald-700 text-sm">{totalCounts.selected}</strong> de {totalCounts.total} itens ativos
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <CheckSquare size={14} className="text-emerald-600" />
                  Selecionar Tudo
                </button>
                <button
                  type="button"
                  onClick={handleUnselectAll}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Square size={14} className="text-slate-400" />
                  Desmarcar Tudo
                </button>
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Restaurar seleção padrão recomendada"
                >
                  <RotateCcw size={14} className="text-blue-500" />
                  Padrão
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mensagem de Erro / Alerta */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between text-red-800 text-sm shadow-xs animate-shake">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-red-600 shrink-0" />
              <span className="font-medium">{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-500 hover:text-red-700 text-xs font-bold underline cursor-pointer"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Grid de Seções de Customização */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          {/* SEÇÃO 1: RESUMO EXECUTIVO */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs hover:border-emerald-200 transition-colors">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-[#1973d3]">
                <Sparkles size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">1. Resumo Executivo & Inteligência</h2>
                <p className="text-xs text-slate-500">Parecer técnico e justificativas da inteligência artificial</p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3 rounded-2xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={filters.secao_resumo.visao_geral}
                  onChange={() => toggleResumo('visao_geral')}
                  className="mt-0.5 w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                />
                <div>
                  <span className="text-sm font-semibold text-slate-800 block">Visão Geral Consolidada</span>
                  <span className="text-xs text-slate-500">Texto de introdução e síntese diagnóstica da propriedade</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-2xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={filters.secao_resumo.evidencias_raciocinios}
                  onChange={() => toggleResumo('evidencias_raciocinios')}
                  className="mt-0.5 w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                />
                <div>
                  <span className="text-sm font-semibold text-slate-800 block">Evidências Técnicas & Citações</span>
                  <span className="text-xs text-slate-500">Cards de citações científicas e dados empíricos de apoio</span>
                </div>
              </label>
            </div>
          </div>

          {/* SEÇÃO 2: BENCHMARKING REGIONAL */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs hover:border-emerald-200 transition-colors">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                <BarChart3 size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">2. Benchmarking Regional</h2>
                <p className="text-xs text-slate-500">Métricas comparativas com o grupo de produtores da região</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { key: 'sistema_producao', label: 'Sistema de Produção' },
                { key: 'faixa_producao', label: 'Faixa de Produção (Volume)' },
                { key: 'ccs', label: 'Contagem Células Somáticas (CCS)' },
                { key: 'producao_vaca', label: 'Produção Média/Vaca/Dia' },
                { key: 'producao_area', label: 'Produção por Área (L/ha/ano)' },
                { key: 'producao_trabalhador', label: 'Produção/Trabalhador' },
                { key: 'preco_leite', label: 'Preço do Leite (R$/L)' },
                { key: 'percentual_vacas_lactacao', label: '% Vacas em Lactação' },
                { key: 'lotacao_animal', label: 'Lotação Animal (cab/ha)' },
              ].map(({ key, label }) => {
                const k = key as keyof typeof filters.secao_benchmarking;
                return (
                  <label
                    key={key}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={filters.secao_benchmarking[k]}
                      onChange={() => toggleBenchmarking(k)}
                      className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="font-medium text-slate-700">{label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* SEÇÃO 3: SIMULAÇÕES & CENÁRIOS */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs hover:border-emerald-200 transition-colors lg:col-span-2">
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600">
                <Lightbulb size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">3. Simulações & Otimizações de Cenários</h2>
                <p className="text-xs text-slate-500">Métricas financeiras, estáticas e operacionais projetadas</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Financeiras */}
              <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Financeiras</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.secao_simulacoes.financeiras.custo_leite}
                      onChange={() => toggleSimulacaoFinanceira('custo_leite')}
                      className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                    />
                    <span className="font-medium">Custo Estimado do Leite</span>
                  </label>
                  <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.secao_simulacoes.financeiras.margem_litro}
                      onChange={() => toggleSimulacaoFinanceira('margem_litro')}
                      className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                    />
                    <span className="font-medium">Margem Bruta por Litro</span>
                  </label>
                  <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.secao_simulacoes.financeiras.margem_ano}
                      onChange={() => toggleSimulacaoFinanceira('margem_ano')}
                      className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                    />
                    <span className="font-medium">Margem Bruta Anual</span>
                  </label>
                </div>
              </div>

              {/* Estáticas */}
              <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Estáticas</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.secao_simulacoes.estaticas.ccs}
                      onChange={() => toggleSimulacaoEstatica('ccs')}
                      className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                    />
                    <span className="font-medium">Impacto em CCS</span>
                  </label>
                  <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.secao_simulacoes.estaticas.producao_vaca}
                      onChange={() => toggleSimulacaoEstatica('producao_vaca')}
                      className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                    />
                    <span className="font-medium">Impacto Produção/Vaca</span>
                  </label>
                </div>
              </div>

              {/* Operacionais */}
              <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Operacionais</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.secao_simulacoes.operacionais.producao_trabalhador}
                      onChange={() => toggleSimulacaoOperacional('producao_trabalhador')}
                      className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                    />
                    <span className="font-medium">Produção por Trabalhador</span>
                  </label>
                  <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.secao_simulacoes.operacionais.producao_area}
                      onChange={() => toggleSimulacaoOperacional('producao_area')}
                      className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                    />
                    <span className="font-medium">Produção por Área (L/ha)</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* SEÇÃO 4: ISHIKAWA & RECOMENDAÇÕES */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs hover:border-emerald-200 transition-colors lg:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <GitFork size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">4. Matriz Ishikawa & 6 Pilares de Causa Raiz</h2>
                  <p className="text-xs text-slate-500">Filtragem de indicadores, severidades e práticas recomendadas</p>
                </div>
              </div>

              {/* Toggle de Análise da Causa */}
              <label className="inline-flex items-center gap-2.5 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={filters.secao_ishikawa.incluir_analise_causa}
                  onChange={toggleIshikawaAnaliseCausa}
                  className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-700">Incluir Texto de Análise da Causa</span>
              </label>
            </div>

            {/* Filtro de Severidades */}
            <div className="mb-6 bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-3">
                Severidades de Causas Permitidas no Relatório:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(Object.keys(SEVERIDADES_ISHIKAWA_LABELS) as Array<keyof SeveridadesIshikawaFilter>).map((sev) => {
                  const meta = SEVERIDADES_ISHIKAWA_LABELS[sev];
                  const isChecked = filters.secao_ishikawa.severidades[sev];
                  return (
                    <label
                      key={sev}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isChecked
                          ? `${meta.color} font-semibold shadow-xs`
                          : 'bg-white border-slate-200 text-slate-400 opacity-60'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSeveridade(sev)}
                        className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                      />
                      <span className="text-xs">{meta.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Indicadores Ishikawa e seus 6 Pilares */}
            <div className="space-y-4">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                Indicadores e Seleção Granular dos 6 Pilares:
              </span>

              <div className="space-y-3">
                {INDICADORES_ISHIKAWA_DEFAULT_LIST.map(({ slug, label }) => {
                  const ind = filters.secao_ishikawa.indicadores[slug] || {
                    incluir: true,
                    pilares: {
                      mao_de_obra: true,
                      metodos: true,
                      maquinas: true,
                      meio_ambiente: true,
                      medicao: true,
                      materia_prima: true,
                    },
                  };
                  const isExpanded = !!expandedIshikawa[slug];

                  const activePilaresCount = Object.values(ind.pilares).filter(Boolean).length;

                  return (
                    <div
                      key={slug}
                      className={`border rounded-2xl transition-all ${
                        ind.incluir
                          ? 'border-slate-200 bg-white'
                          : 'border-slate-200 bg-slate-50/50 opacity-60'
                      }`}
                    >
                      <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={ind.incluir}
                            onChange={() => toggleIndicadorIshikawa(slug)}
                            className="w-5 h-5 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                          />
                          <div>
                            <span className="text-sm font-bold text-slate-800 block">{label}</span>
                            <span className="text-xs text-slate-500">
                              {ind.incluir ? `${activePilaresCount} de 6 pilares ativos` : 'Indicador excluído do relatório'}
                            </span>
                          </div>
                        </div>

                        {ind.incluir && (
                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={() => toggleAllPilaresForIndicator(slug, true)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                            >
                              Todos Pilares
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleAllPilaresForIndicator(slug, false)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                            >
                              Nenhum Pilar
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedIshikawa((prev) => ({ ...prev, [slug]: !prev[slug] }))
                              }
                              className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
                              aria-label="Expandir ou recolher pilares"
                            >
                              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Pilares Colapsáveis */}
                      {ind.incluir && isExpanded && (
                        <div className="px-4 pb-4 pt-1 border-t border-slate-100">
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mt-2">
                            {(Object.keys(PILARES_ISHIKAWA_LABELS) as Array<keyof PilaresIshikawaFilter>).map((pilar) => {
                              const isPilarActive = ind.pilares[pilar];
                              return (
                                <label
                                  key={pilar}
                                  className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition-colors ${
                                    isPilarActive
                                      ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900 font-medium'
                                      : 'bg-slate-50 border-slate-200 text-slate-400'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isPilarActive}
                                    onChange={() => togglePilarIshikawa(slug, pilar)}
                                    className="w-3.5 h-3.5 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                                  />
                                  <span>{PILARES_ISHIKAWA_LABELS[pilar]}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Barra Flutuante Inferior de Ação */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-3.5 px-4 sm:px-8 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Check size={16} className="text-emerald-600" />
            <span>Filtros prontos para compilação executiva em PDF.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => handleGerarRelatorio('preview')}
              disabled={isGeneratingPdf || totalCounts.selected === 0}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-full font-bold text-sm text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all shadow-xs disabled:opacity-50 inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              {isGeneratingPdf && actionType === 'preview' ? (
                <div className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <ExternalLink size={16} />
              )}
              Visualizar em Nova Aba
            </button>

            <button
              type="button"
              onClick={() => handleGerarRelatorio('download')}
              disabled={isGeneratingPdf || totalCounts.selected === 0}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-full font-bold text-sm text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              {isGeneratingPdf && actionType === 'download' ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download size={16} />
              )}
              Baixar Relatório em PDF
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
