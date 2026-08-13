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

/**
 * Mapeamento direto entre as regiões da API Ishikawa (value/label) e a API ML (Zod Enum).
 */
export const MAP_TO_ML_REGIAO: Record<string, string> = {
  'centro': 'centro',
  'centro oeste e sudoeste': 'centro-oeste e sudoeste',
  'jequitinhonha e mucuri': 'jequitinhonha e mucuri',
  'noroeste e alto paranaiba': 'noroeste e alto paranaiba',
  'norte': 'norte',
  'norte de minas': 'norte',
  'rio doce e vale do aco': 'rio doce e vale do aco',
  'sul': 'sul',
  'sul de minas': 'sul',
  'triangulo': 'triangulo',
  'triangulo mineiro': 'triangulo',
  'zona da mata e vertentes': 'zona da mata e vertentes',
  'zona da mata': 'zona da mata e vertentes',
};

export const MAP_TO_ML_SISTEMA: Record<string, string> = {
  'compost-barn': 'compost-barn',
  'confinado-sem-estrutura': 'confinado-sem-estrutura',
  'semiconfinado': 'semiconfinado',
  'compost barn - free stall': 'compost-barn',
};

function normalizeText(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/_/g, ' ')
    .trim();
}

export function mapToMlRegion(raw: string): string {
  if (!raw) return '';
  const norm = normalizeText(raw);
  if (MAP_TO_ML_REGIAO[norm]) return MAP_TO_ML_REGIAO[norm];

  for (const [key, target] of Object.entries(MAP_TO_ML_REGIAO)) {
    if (norm.includes(key) || key.includes(norm)) return target;
  }
  return norm;
}

export function mapToMlSystem(raw: string): string {
  if (!raw) return '';
  const norm = normalizeText(raw);
  if (MAP_TO_ML_SISTEMA[norm]) return MAP_TO_ML_SISTEMA[norm];

  for (const [key, target] of Object.entries(MAP_TO_ML_SISTEMA)) {
    if (norm.includes(key) || key.includes(norm)) return target;
  }
  return norm;
}

function findIshikawaOptionValue(raw: string, optionsList: (SistemaProducaoItem | RegiaoSebraeItem)[]): string {
  if (!raw) return '';
  const clean = String(raw).trim();
  const norm = normalizeText(clean);

  for (const item of optionsList) {
    const val = getOptionValue(item);
    const lbl = getOptionLabel(item);
    const valNorm = normalizeText(val);
    const lblNorm = normalizeText(lbl);

    if (val === clean || lbl === clean || valNorm === norm || lblNorm === norm) {
      return val;
    }
  }

  for (const item of optionsList) {
    const val = getOptionValue(item);
    const lbl = getOptionLabel(item);
    const valNorm = normalizeText(val);
    const lblNorm = normalizeText(lbl);

    if (valNorm.includes(norm) || norm.includes(valNorm) || lblNorm.includes(norm) || norm.includes(lblNorm)) {
      return val;
    }
  }

  return clean;
}

const DEFAULT_SISTEMAS = ['semiconfinado', 'compost-barn', 'confinado-sem-estrutura'];
const DEFAULT_REGIOES: RegiaoSebraeItem[] = [
  { value: 'centro', label: 'Centro' },
  { value: 'centro_oeste_e_sudoeste', label: 'Centro Oeste E Sudoeste' },
  { value: 'jequitinhonha_e_mucuri', label: 'Jequitinhonha E Mucuri' },
  { value: 'noroeste_e_alto_paranaiba', label: 'Noroeste E Alto Paranaiba' },
  { value: 'norte', label: 'Norte de Minas' },
  { value: 'rio_doce_e_vale_do_aco', label: 'Rio Doce E Vale Do Aco' },
  { value: 'sul', label: 'Sul de Minas' },
  { value: 'triangulo', label: 'Triângulo Mineiro' },
  { value: 'zona_da_mata_e_vertentes', label: 'Zona Da Mata E Vertentes' },
];

function mapFarmApiToFormData(
  data: FazendaDetalhadaResponse | any, 
  opcoesRegioes: RegiaoSebraeItem[] = DEFAULT_REGIOES,
  opcoesSistemas: SistemaProducaoItem[] = DEFAULT_SISTEMAS
) {
  const dadosObj = data?.dados ?? data;
  const rawRegiao = dadosObj?.regiao_sebrae ?? dadosObj?.regiao ?? data?.regiao_sebrae ?? data?.regiao ?? '';
  const rawSistema = dadosObj?.sistema_producao ?? data?.sistema_producao ?? '';

  const listRegioes = opcoesRegioes.length > 0 ? opcoesRegioes : DEFAULT_REGIOES;
  const listSistemas = opcoesSistemas.length > 0 ? opcoesSistemas : DEFAULT_SISTEMAS;

  const matchedRegiao = findIshikawaOptionValue(rawRegiao, listRegioes);
  const matchedSistema = findIshikawaOptionValue(rawSistema, listSistemas);

  return {
    nome_fazenda: data?.nome ?? data?.nome_fazenda ?? '',
    email: data?.email ?? dadosObj?.email ?? '',
    sistema_producao: matchedSistema,
    total_vacas: dadosObj?.total_vacas ?? 0,
    percentual_lactacao: dadosObj?.percentual_lactacao ?? 0,
    animais_rebanho: dadosObj?.total_rebanho ?? dadosObj?.animais_rebanho ?? 0,
    area_atividade: dadosObj?.area_atividade ?? 0,
    mao_obra_total: dadosObj?.numero_trabalhadores ?? dadosObj?.mao_obra_total ?? 1,
    producao_vaca: dadosObj?.producao_vaca ?? 0,
    preco_leite: dadosObj?.preco_recebido ?? dadosObj?.preco_leite ?? 0,
    preco_referencia: dadosObj?.preco_referencia ?? 0,
    preco_concentrado: dadosObj?.custo_concentrado ?? dadosObj?.preco_concentrado ?? 1.81,
    ccs: dadosObj?.ccs ?? 0,
    regiao: matchedRegiao,
  };
}

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
  const cacheFazendas = useRef<Record<string, ReturnType<typeof mapFarmApiToFormData>>>({});

  const fetchOpcoes = async () => {
    setIsLoadingOpcoes(true);
    setIsErrorApi(false);
    try {
      const res = await fetch('/api/formularios');
      if (res.ok) {
        const data: FormularioOpcoesResponse = await res.json();
        setOpcoes({
          sistemas_producao: data?.sistemas_producao || [],
          regioes_sebrae: data?.regioes_sebrae || [],
          fazendas_cadastradas: data?.fazendas_cadastradas || []
        });
      } else {
        setIsErrorApi(true);
      }
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

  const handleCadastrarEDiagnosticar = (cadFormData: CadastrarFazendaFormData) => {
    setErros([]);
    const payloadParaMl = {
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

  const handleIniciarDiagnosticoDirect = async (nome: string) => {
    let farmDataMapped: any;

    if (cacheFazendas.current[nome]) {
      farmDataMapped = cacheFazendas.current[nome];
    } else {
      const res = await fetch(`/api/formularios?nome=${encodeURIComponent(nome)}`);
      if (!res.ok) {
        throw new Error('Não foi possível carregar os dados da fazenda.');
      }
      const data: FazendaDetalhadaResponse = await res.json();
      farmDataMapped = mapFarmApiToFormData(data, regioesDisponiveis, sistemasDisponiveis);
      cacheFazendas.current[nome] = farmDataMapped;
    }

    const payloadParaMl = {
      ...farmDataMapped,
      regiao: mapToMlRegion(farmDataMapped.regiao),
      sistema_producao: mapToMlSystem(farmDataMapped.sistema_producao),
    };

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
    <div className="min-h-screen bg-fundo-alt pb-12">
      {/* Cabeçalho */}
      <header>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Image
            src="/banner_educampo.png"
            alt="Educampo Logo"
            width={180}
            height={50}
            className="object-contain"
            priority
            style={{ width: '180px', height: 'auto' }}
          />
          <h1 className="text-xl font-semibold text-primary">Diagnóstico de Fazenda</h1>
        </div>
      </header>

      {/* Container Principal */}
      <main className="max-w-4xl mx-auto px-4 mt-8">

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
