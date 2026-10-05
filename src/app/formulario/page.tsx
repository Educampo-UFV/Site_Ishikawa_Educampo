/**
 * @file src/app/formulario/page.tsx
 * @description Interface visual de coleta de dados da fazenda com cadastro expansível em 3 seções,
 * pesquisa de fazendas cadastradas e acionamento direto de diagnóstico.
 * Ref: Obsidian note [[sdd-promover-rota-formularios-frontend]]
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useFazendaStore } from '@/store/useFazendaStore';
import { fazendaSchema, CadastrarFazendaFormData } from '@/lib/schemas';
import { CadastrarFazendaSection } from '@/components/CadastrarFazendaSection';
import { FazendasCadastradasGrid } from '@/components/FazendasCadastradasGrid';
import { AlertCircle, RefreshCw } from 'lucide-react';

import { 
  FormularioOpcoesResponse, 
  FazendaDetalhadaResponse,
  SistemaProducaoItem,
  RegiaoSebraeItem,
  getOptionValue,
  getOptionLabel,
} from '@/types/formulario';

import {
  fetchOpcoesFormulario,
  fetchFazendaDetalhes,
  mapFarmApiToFormData,
  mapToMlRegion,
  mapToMlSystem,
  findIshikawaOptionValue,
  MAP_TO_ML_REGIAO,
  MAP_TO_ML_SISTEMA,
  DEFAULT_SISTEMAS,
  DEFAULT_REGIOES,
} from '@/lib/fazendaService';

export {
  MAP_TO_ML_REGIAO,
  MAP_TO_ML_SISTEMA,
  mapToMlRegion,
  mapToMlSystem,
  mapFarmApiToFormData,
  findIshikawaOptionValue,
};

export default function FormularioPage() {
  const router = useRouter();
  const setDadosFazenda = useFazendaStore((state: { setDadosFazenda: (dados: any) => void }) => state.setDadosFazenda);

  const [erros, setErros] = useState<string[]>([]);
  const [opcoes, setOpcoes] = useState<FormularioOpcoesResponse>({
    sistemas_producao: [],
    regioes_sebrae: [],
    fazendas_cadastradas: []
  });
  const [isLoadingOpcoes, setIsLoadingOpcoes] = useState(false);
  const [isErrorApi, setIsErrorApi] = useState(false);
  const [isLoadingFarmData, setIsLoadingFarmData] = useState(false);
  const cacheFazendas = useRef<Record<string, any>>({});

  const fetchOpcoes = async () => {
    setIsLoadingOpcoes(true);
    setIsErrorApi(false);
    try {
      const data = await fetchOpcoesFormulario();
      setOpcoes(data);
    } catch (error) {
      console.error('Erro ao buscar opções do formulário:', error);
      setIsErrorApi(true);
    } finally {
      setIsLoadingOpcoes(false);
    }
  };

  useEffect(() => {
    fetchOpcoes();
  }, []);

  const handleCadastrarEDiagnosticar = (cadFormData: CadastrarFazendaFormData, producerId?: string) => {
    setErros([]);
    const payloadParaMl = {
      id_fazenda: producerId || undefined,
      nome_fazenda: cadFormData.nome_fazenda,
      email: cadFormData.email,
      sistema_producao: mapToMlSystem(cadFormData.sistema_producao),
      total_vacas: cadFormData.total_vacas,
      percentual_lactacao: cadFormData.percentual_lactacao,
      animais_rebanho: cadFormData.total_rebanho,
      area_atividade: cadFormData.area_atividade,
      mao_obra_total: cadFormData.numero_trabalhadores,
      producao_vaca: cadFormData.producao_vaca,
      preco_leite: cadFormData.preco_recebido,
      preco_referencia: cadFormData.preco_referencia,
      preco_concentrado: 1.81,
      ccs: cadFormData.ccs,
      regiao: mapToMlRegion(cadFormData.regiao_sebrae),
    };

    const validacao = fazendaSchema.safeParse(payloadParaMl);

    if (!validacao.success) {
      const mensagensErro = validacao.error.issues.map((err) => {
        const path = err.path && err.path.length > 0 ? err.path.join(' ') : 'Campo';
        return `${path}: ${err.message}`;
      });

      setErros(mensagensErro);
      return;
    }

    setDadosFazenda(validacao.data);
    router.push('/carregando');
  };

  const handleIniciarDiagnosticoDirect = async (identificador: string, _nome: string) => {
    let payloadParaMl: any;

    if (cacheFazendas.current[identificador]) {
      payloadParaMl = cacheFazendas.current[identificador];
    } else {
      payloadParaMl = await fetchFazendaDetalhes(identificador, regioesDisponiveis, sistemasDisponiveis);
      cacheFazendas.current[identificador] = payloadParaMl;
    }

    const validacao = fazendaSchema.safeParse(payloadParaMl);
    if (!validacao.success) {
      throw new Error('Dados da fazenda inconsistentes para o diagnóstico.');
    }

    const resDiagnostico = await fetch('/api/diagnostico', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validacao.data),
    });

    if (!resDiagnostico.ok) {
      throw new Error('Falha ao acionar a API de Diagnóstico.');
    }

    const dataDiagnostico = await resDiagnostico.json();
    setDadosFazenda(validacao.data);

    const taskId = dataDiagnostico?.task_id;
    if (taskId) {
      router.push(`/carregando?task_id=${encodeURIComponent(taskId)}`);
    } else {
      router.push('/carregando');
    }
  };

  const sistemasDisponiveis = (opcoes?.sistemas_producao?.length ?? 0) > 0 ? opcoes.sistemas_producao : DEFAULT_SISTEMAS;
  const regioesDisponiveis = (opcoes?.regioes_sebrae?.length ?? 0) > 0 ? opcoes.regioes_sebrae : DEFAULT_REGIOES;
  const fazendasCadastradas = opcoes?.fazendas_cadastradas ?? [];

  return (
    <div className="min-h-screen bg-fundo-alt pb-8 sm:pb-12">
      {/* Cabeçalho */}
      <header className="border-b border-gray-100 bg-white/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
          <Image
            src="/banner_educampo.png"
            alt="Educampo Logo"
            width={160}
            height={45}
            className="object-contain w-32 sm:w-44 h-auto"
            priority
          />
          <h1 className="text-base sm:text-xl font-semibold text-primary text-right">
            Diagnóstico de Fazenda
          </h1>
        </div>
      </header>

      {/* Container Principal */}
      <main className="max-w-4xl mx-auto px-3 sm:px-4 mt-5 sm:mt-8">

        {/* Banner de Erro de Conexão com a API */}
        {isErrorApi && (
          <div className="mb-6 p-4 bg-amber-50 border-l-4 border-amber-500 text-amber-800 rounded-md shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-amber-600 flex-shrink-0" size={20} />
              <p className="text-sm font-medium">
                Falha ao conectar com o serviço de opções do formulário. Algumas listas podem exibir dados padrão.
              </p>
            </div>
            <button
              onClick={fetchOpcoes}
              disabled={isLoadingOpcoes}
              className="flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-3 py-1.5 rounded transition"
            >
              <RefreshCw size={14} className={isLoadingOpcoes ? 'animate-spin' : ''} />
              Tentar Novamente
            </button>
          </div>
        )}

        {/* Box de Erros de Validação */}
        {erros.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md shadow-sm">
            <h3 className="font-bold">Atenção (Inválido):</h3>
            <ul className="list-disc ml-5 mt-2">
              {erros.map((erro, index) => (
                <li key={index}>{erro}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Componente Expansível: Cadastrar Fazenda / Produtor */}
        <CadastrarFazendaSection
          sistemasDisponiveis={sistemasDisponiveis}
          regioesDisponiveis={regioesDisponiveis}
          onSuccess={fetchOpcoes}
          onCadastrarEDiagnosticar={handleCadastrarEDiagnosticar}
        />

        {/* Seção Dinâmica de Fazendas Cadastradas em Grid */}
        <FazendasCadastradasGrid
          fazendas={fazendasCadastradas}
          onIniciarDiagnostico={handleIniciarDiagnosticoDirect}
          isLoadingGlobal={isLoadingFarmData}
        />

      </main>
    </div>
  );
}
