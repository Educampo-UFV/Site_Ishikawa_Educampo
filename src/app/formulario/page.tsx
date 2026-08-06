/**
 * @file src/app/formulario/page.tsx
 * @description Interface visual de coleta de dados da fazenda com consumo dinâmico de opções e fazendas cadastradas.
 * Ref: Obsidian note [[sdd-promover-rota-formularios-frontend]]
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useFazendaStore } from '@/store/useFazendaStore';
import { fazendaSchema } from '@/lib/schemas';
import { Info, AlertCircle, RefreshCw } from 'lucide-react';
import { NumericFormat } from 'react-number-format';
import { 
  FormularioOpcoesResponse, 
  FazendaDetalhadaResponse,
  SistemaProducaoItem,
  RegiaoSebraeItem,
  FazendaCadastradaItem
} from '@/types/formulario';

function getOptionValue(item: SistemaProducaoItem | RegiaoSebraeItem): string {
  if (typeof item === 'object' && item !== null && 'value' in item) {
    return item.value;
  }
  return String(item);
}

function getOptionLabel(item: SistemaProducaoItem | RegiaoSebraeItem): string {
  if (typeof item === 'object' && item !== null && 'label' in item) {
    return item.label;
  }
  return String(item);
}

function getFazendaNome(item: FazendaCadastradaItem): string {
  if (typeof item === 'object' && item !== null && 'nome' in item) {
    return item.nome;
  }
  return String(item);
}

const LabelComDica = ({ htmlFor, label, unidade, dica }: { htmlFor: string, label: string, unidade?: string, dica?: string }) => (
  <div className="flex items-center gap-2 mb-1">
    <label htmlFor={htmlFor} className="text-sm font-semibold text-gray-700">
      {label} {unidade && <span className="text-gray-400 font-normal">({unidade})</span>}
    </label>
    {dica && (
      <div className="group relative flex items-center">
        <Info size={15} className="text-primary cursor-help hover:text-primary-light transition-colors" />
        <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs p-2.5 rounded shadow-lg w-56 bottom-full left-1/2 -translate-x-1/2 mb-2 z-10 text-center font-normal leading-relaxed">
          {dica}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
        </div>
      </div>
    )}
  </div>
);

interface InputComDicaProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  unidade?: string;
  dica?: string;
  decimalScale?: number;
}

const CASAS_DECIMAIS = 2;
const STEP_PADRAO = "0.01";

function aplicarLimiteCasasDecimais(valor: string | number | undefined | null, maxCasas: number): string {
  if (valor === undefined || valor === null || valor === '') return '';
  const strVal = String(valor);
  const num = parseFloat(strVal);
  if (isNaN(num)) return strVal;
  
  if (maxCasas === 0) {
    return Math.round(num).toString();
  }

  const partes = strVal.split('.');
  if (partes.length > 1 && partes[1].length > maxCasas) {
    return num.toFixed(maxCasas);
  }
  return strVal;
}

const InputComDica: React.FC<InputComDicaProps> = ({ label, unidade, dica, placeholder, step = STEP_PADRAO, decimalScale = CASAS_DECIMAIS, ...props }) => {
  const inputClassName = `w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-gray-300 ${props.className || ''}`;
  const commonProps: React.InputHTMLAttributes<HTMLInputElement> = {
    ...props,
    placeholder: placeholder ? `Ex: ${placeholder}` : '',
    className: inputClassName,
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      <LabelComDica htmlFor={props.id as string} label={label} unidade={unidade} dica={dica} />
      {props.type === 'number' ? (
        <NumericFormat
          {...(commonProps as React.ComponentProps<typeof NumericFormat>)}
          type="text"
          inputMode="decimal"
          allowNegative={false}
          decimalScale={decimalScale}
          allowedDecimalSeparators={[',', '.']}
          decimalSeparator="."
        />
      ) : (
        <input {...commonProps} />
      )}
    </div>
  );
};

/**
 * Mapeamento direto entre as 9 regiões da API Ishikawa (value/label) e a API ML (Zod Enum).
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
    total_vacas: aplicarLimiteCasasDecimais(dadosObj?.total_vacas, 2),
    percentual_lactacao: aplicarLimiteCasasDecimais(dadosObj?.percentual_lactacao, 1),
    animais_rebanho: aplicarLimiteCasasDecimais(dadosObj?.total_rebanho ?? dadosObj?.animais_rebanho, 2),
    area_atividade: aplicarLimiteCasasDecimais(dadosObj?.area_atividade, 2),
    mao_obra_total: aplicarLimiteCasasDecimais(dadosObj?.numero_trabalhadores ?? dadosObj?.mao_obra_total, 1),
    producao_vaca: aplicarLimiteCasasDecimais(dadosObj?.producao_vaca, 2),
    preco_leite: aplicarLimiteCasasDecimais(dadosObj?.preco_recebido ?? dadosObj?.preco_leite, 2),
    preco_referencia: aplicarLimiteCasasDecimais(dadosObj?.preco_referencia, 2),
    preco_concentrado: aplicarLimiteCasasDecimais(dadosObj?.custo_concentrado ?? dadosObj?.preco_concentrado, 2),
    ccs: aplicarLimiteCasasDecimais(dadosObj?.ccs, 2),
    regiao: matchedRegiao,
  };
}

const INITIAL_FORM_DATA = {
  nome_fazenda: '',
  email: '',
  sistema_producao: '',
  total_vacas: '',
  percentual_lactacao: '',
  animais_rebanho: '',
  area_atividade: '',
  mao_obra_total: '',
  producao_vaca: '',
  preco_leite: '',
  preco_referencia: '',
  preco_concentrado: '',
  ccs: '',
  regiao: '',
};

export default function FormularioPage() {
  const router = useRouter();
  const setDadosFazenda = useFazendaStore((state: { setDadosFazenda: (dados: any) => void }) => state.setDadosFazenda);

  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

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

  const handleFazendaChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nome = e.target.value;
    if (!nome) return;

    if (cacheFazendas.current[nome]) {
      setFormData((prev) => ({ ...prev, ...cacheFazendas.current[nome] }));
      return;
    }

    setIsLoadingFarmData(true);
    try {
      const res = await fetch(`/api/formularios?nome=${encodeURIComponent(nome)}`);
      if (res.ok) {
        const data: FazendaDetalhadaResponse = await res.json();
        const mappedData = mapFarmApiToFormData(data, regioesDisponiveis, sistemasDisponiveis);

        cacheFazendas.current[nome] = mappedData;
        setFormData((prev) => ({ ...prev, ...mappedData }));
      }
    } catch (error) {
      console.error('Erro ao carregar dados da fazenda:', error);
    } finally {
      setIsLoadingFarmData(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let { name, value, type } = e.target;

    if (type === 'number') {
      value = aplicarLimiteCasasDecimais(value, CASAS_DECIMAIS);
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErros([]);

    // Mapeia os campos regiao e sistema_producao para os Enums exigidos pelo modelo de ML
    const payloadParaMl = {
      ...formData,
      regiao: mapToMlRegion(formData.regiao),
      sistema_producao: mapToMlSystem(formData.sistema_producao),
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

        {/* Box de Erros de Validação de Formulário */}
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

        <form onSubmit={handleSubmit} className="space-y-8 relative">

          {/* Bloqueador visual durante o carregamento de dados detalhados */}
          {isLoadingFarmData && (
            <div className="absolute inset-0 bg-white/50 z-50 flex items-center justify-center rounded-xl">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          )}

          {/* Seção Dinâmica de Fazendas Cadastradas */}
          {fazendasCadastradas.length > 0 && (
            <section className="bg-blue-50 p-8 rounded-xl shadow-sm border border-blue-100">
              <h2 className="text-xl font-bold text-blue-800 mb-4 flex items-center gap-2">
                <span className="text-2xl font-normal">🏡</span> Fazendas Cadastradas
              </h2>
              <div className="flex flex-col gap-1 w-full md:w-1/2">
                <LabelComDica
                  htmlFor="fazendas_cadastradas_select"
                  label="Selecionar Fazenda Cadastrada"
                  dica="Escolha uma fazenda cadastrada para autopopular os campos do formulário."
                />
                <select
                  id="fazendas_cadastradas_select"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                  onChange={handleFazendaChange}
                  disabled={isLoadingFarmData || isErrorApi}
                  defaultValue=""
                >
                  <option value="" disabled>Selecione uma fazenda...</option>
                  {fazendasCadastradas.map((item, idx) => {
                    const nome = getFazendaNome(item);
                    return (
                      <option key={idx} value={nome}>
                        {nome}
                      </option>
                    );
                  })}
                </select>
              </div>
            </section>
          )}

          {/* Quadrante 1: Informações Gerais */}
          <section className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Informações Gerais</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputComDica
                id="nome_fazenda" name="nome_fazenda" type="text"
                label="Nome da Fazenda"
                placeholder="Fazenda Leiteira Experimental"
                dica="Nome de identificação da sua propriedade."
                value={formData.nome_fazenda} onChange={handleChange} required maxLength={100}
              />
              <InputComDica
                id="email" name="email" type="email"
                label="E-mail do Produtor"
                placeholder="produtor@email.com"
                dica="E-mail de contato e identificação do produtor."
                value={formData.email} onChange={handleChange} maxLength={100}
              />
              <div className="flex flex-col gap-1 w-full md:col-span-2">
                <LabelComDica
                  htmlFor="sistema_producao"
                  label="Sistema de Produção"
                  dica="Modelo de confinamento ou pastagem adotado na propriedade."
                />
                <select
                  id="sistema_producao" name="sistema_producao"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={formData.sistema_producao} onChange={handleChange} required
                  disabled={isErrorApi}
                >
                  <option value="">Selecione o sistema</option>
                  {sistemasDisponiveis.map((sis, idx) => {
                    const val = getOptionValue(sis);
                    const lbl = getOptionLabel(sis);
                    return <option key={idx} value={val}>{lbl}</option>;
                  })}
                </select>
              </div>
            </div>
          </section>

          {/* Quadrante 2: Estrutura e Rebanho */}
          <section className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Estrutura e Rebanho</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputComDica
                id="total_vacas" name="total_vacas" type="number"
                label="Total de Vacas" unidade="cab." placeholder="100"
                dica="Quantidade total de vacas (secas e em lactação)."
                value={formData.total_vacas} onChange={handleChange} min={0} max={50000} required
              />
              <InputComDica
                id="percentual_lactacao" name="percentual_lactacao" type="number"
                label="Perc. em Lactação" unidade="%" placeholder="85"
                dica="Percentual do rebanho de vacas que estão em lactação atualmente."
                decimalScale={1}
                value={formData.percentual_lactacao} onChange={handleChange} min={0} max={100} required
              />
              <InputComDica
                id="animais_rebanho" name="animais_rebanho" type="number"
                label="Total no Rebanho" unidade="cab." placeholder="150"
                dica="Todas as categorias de animais do rebanho leiteiro."
                value={formData.animais_rebanho} onChange={handleChange} min={0} max={100000} required
              />
              <InputComDica
                id="area_atividade" name="area_atividade" type="number"
                label="Área da Atividade" unidade="ha" placeholder="10.0"
                dica="Área total destinada à pecuária de leite em hectares."
                value={formData.area_atividade} onChange={handleChange} min={0.1} max={50000} required
              />
              <InputComDica
                id="preco_concentrado" name="preco_concentrado" type="number"
                label="Preço do Concentrado" unidade="R$/kg" placeholder="2.30"
                dica="Custo médio do quilograma de concentrado utilizado na alimentação do rebanho."
                value={formData.preco_concentrado} onChange={handleChange} min={0} max={100} required
              />
              <div className="md:col-span-2">
                <InputComDica
                  id="mao_obra_total" name="mao_obra_total" type="number"
                  label="Mão de Obra Total" unidade="trabalhadores" placeholder="3"
                  dica="Número total de trabalhadores envolvidos na atividade leiteira."
                  decimalScale={1}
                  value={formData.mao_obra_total} onChange={handleChange} min={1} max={1000} required
                />
              </div>
            </div>
          </section>

          {/* Quadrante 3: Produção e Qualidade */}
          <section className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Produção e Qualidade</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputComDica
                id="producao_vaca" name="producao_vaca" type="number"
                label="Prod. por Vaca" unidade="L/dia" placeholder="35.0"
                dica="Média de litros produzidos por vaca em lactação."
                value={formData.producao_vaca} onChange={handleChange} min={0} max={100} required
              />
              <div>
                <InputComDica
                  id="ccs" name="ccs" type="number"
                  label="Qualidade" unidade="CCS x1000" placeholder="150"
                  dica="Importante: Digite apenas os primeiros números. Ex: Para 150.000, digite 150."
                  value={formData.ccs} onChange={handleChange} min={0} max={9999} required
                />
                <p className="text-xs text-gray-500 mt-1.5 ml-1">Informe o valor simplificado. O sistema multiplicará por 1.000 automaticamente.</p>
              </div>
              <InputComDica
                id="preco_leite" name="preco_leite" type="number"
                label="Preço Recebido" unidade="R$/L" placeholder="3.20"
                dica="Valor bruto recebido pelo litro do leite."
                value={formData.preco_leite} onChange={handleChange} min={0} max={15} required
              />
              <InputComDica
                id="preco_referencia" name="preco_referencia" type="number"
                label="Preço de Referência" unidade="R$/L" placeholder="2.50"
                dica="Preço base ou média regional para comparação."
                value={formData.preco_referencia} onChange={handleChange} min={0} max={15} required
              />
              <div className="md:col-span-2">
                <div className="flex flex-col gap-1 w-full">
                  <LabelComDica
                    htmlFor="regiao"
                    label="Região"
                    dica="Região da fazenda para balizar comparações com o mercado local."
                  />
                  <select
                    id="regiao" name="regiao"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={formData.regiao} onChange={handleChange} required
                    disabled={isErrorApi}
                  >
                    <option value="">Selecione a região</option>
                    {regioesDisponiveis.map((reg, idx) => {
                      const val = getOptionValue(reg);
                      const lbl = getOptionLabel(reg);
                      return <option key={idx} value={val}>{lbl}</option>;
                    })}
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Rodapé de Ações */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="bg-primary hover:bg-primary-light text-white font-bold py-3 px-10 rounded-lg shadow-md transition duration-200"
            >
              Avançar
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
