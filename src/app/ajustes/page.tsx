/**
 * @file src/app/ajustes/page.tsx
 * @description Interface visual para ajuste e recálculo dos dados da fazenda.
 * Reaproveita a estrutura visual de coleta, mas atua como uma ferramenta de edição.
 * Inclui proteção anti-spam com cooldown de 30 segundos nas requisições à API.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { ZodError } from 'zod';
import { useRouter } from 'next/navigation';
import { useFazendaStore } from '@/store/useFazendaStore';
import { fazendaSchema, FazendaFormData } from '@/lib/schemas';
import { Navbar } from '@/components/ui/Navbar';
import { Info, AlertCircle, CheckCircle, Loader2, X } from 'lucide-react';
import Link from 'next/link';
import { NumericFormat } from 'react-number-format';
import { fetchComResiliencia } from '@/lib/apiUtils';
import { DiagnosticoProgress, DiagnosticoStatusResponse } from '@/types/diagnostico';
import { 
  FormularioOpcoesResponse, 
  SistemaProducaoItem, 
  RegiaoSebraeItem, 
  getOptionValue, 
  getOptionLabel 
} from '@/types/formulario';

/**
 * Componente auxiliar genérico para renderizar um rótulo (label) com uma dica (tooltip) interativa.
 */
const LabelComDica = ({ htmlFor, label, unidade, dica }: { htmlFor: string, label: string, unidade?: string, dica?: string }) => (
  <div className="flex items-center gap-2 mb-1">
    <label htmlFor={htmlFor} className="text-sm font-semibold text-gray-700">
      {label} {unidade && <span className="text-gray-500 font-normal">({unidade})</span>}
    </label>
    {dica && (
      <div className="group relative flex items-center cursor-help">
        <Info className="w-4 h-4 text-primary" />
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10">
          {dica}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
        </div>
      </div>
    )}
  </div>
);

/**
 * Componente auxiliar para encapsular os atributos repetitivos do NumericFormat 
 * e agrupar com o LabelComDica.
 */
const CASAS_DECIMAIS = 3;

const CampoNumericoAjuste = ({ id, label, unidade, dica, value, onChange }: { id: string, label: string, unidade?: string, dica?: string, value: string | number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
  <>
    <LabelComDica htmlFor={id} label={label} unidade={unidade} dica={dica} />
    <NumericFormat
      id={id} name={id} type="text" inputMode="decimal" allowNegative={false} decimalScale={CASAS_DECIMAIS} allowedDecimalSeparators={[',', '.']} decimalSeparator="." required
      value={value} onChange={onChange}
      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
    />
  </>
);

const DEFAULT_SISTEMAS_OPCOES: SistemaProducaoItem[] = [
  { value: 'compost-barn', label: 'Compost Barn' },
  { value: 'semiconfinado', label: 'Semi-confinado' },
  { value: 'confinado-sem-estrutura', label: 'Confinado' },
];

const DEFAULT_REGIOES_OPCOES: RegiaoSebraeItem[] = [
  { value: 'triangulo', label: 'Triângulo Mineiro' },
  { value: 'rio doce e vale do aco', label: 'Rio Doce e Vale do Aço' },
  { value: 'noroeste e alto paranaiba', label: 'Noroeste e Alto Paranaíba' },
  { value: 'centro', label: 'Centro' },
  { value: 'centro-oeste e sudoeste', label: 'Centro-Oeste e Sudoeste' },
  { value: 'sul', label: 'Sul' },
  { value: 'norte', label: 'Norte' },
  { value: 'zona da mata e vertentes', label: 'Zona da Mata e Vertentes' },
  { value: 'jequitinhonha e mucuri', label: 'Jequitinhonha e Mucuri' },
];

/**
 * Página de Ajustes de Dados da Fazenda.
 * 
 * Consume o estado global (`useFazendaStore`) para inicializar o formulário de forma controlada.
 * Esta página permite que o produtor faça alterações pontuais dos dados e recalcule o diagnóstico
 * refazendo o fetch ao BFF (`/api/diagnostico`) com suporte a polling assíncrono de status (`/api/diagnostico/status/[task_id]`).
 * 
 * @returns {JSX.Element} A renderização estrutural do formulário de ajustes.
 */
export default function AjustesPage() {
  const router = useRouter();
  const { dadosFazenda, setDadosFazenda, setDiagnosticoIA } = useFazendaStore();

  // Inicializa o estado local com os dados da store (se existirem)
  const [formData, setFormData] = useState<Partial<FazendaFormData>>(dadosFazenda || {});

  // Estados para as opções dinâmicas trazidas da API /api/formularios
  const [opcoesSistemas, setOpcoesSistemas] = useState<SistemaProducaoItem[]>(DEFAULT_SISTEMAS_OPCOES);
  const [opcoesRegioes, setOpcoesRegioes] = useState<RegiaoSebraeItem[]>(DEFAULT_REGIOES_OPCOES);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mensagemStatus, setMensagemStatus] = useState<string>('');
  const [progresso, setProgresso] = useState<DiagnosticoProgress | null>(null);
  const [cooldown, setCooldown] = useState(0);

  /**
   * Efeito colateral para carregar as opções dinâmicas de formulário (sistemas de produção e regiões).
   */
  useEffect(() => {
    let isMounted = true;
    fetchComResiliencia('/api/formularios', { method: 'GET' }, 1, 500, 2000, 3000)
      .then(async (res) => {
        if (res.ok) {
          const data: FormularioOpcoesResponse = await res.json();
          if (isMounted) {
            if (Array.isArray(data.sistemas_producao) && data.sistemas_producao.length > 0) {
              setOpcoesSistemas(data.sistemas_producao);
            }
            if (Array.isArray(data.regioes_sebrae) && data.regioes_sebrae.length > 0) {
              setOpcoesRegioes(data.regioes_sebrae);
            }
          }
        }
      })
      .catch(() => {
        // Mantém as opções de fallback estáticas em caso de inconsistência no fetch
      });

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Efeito colateral para gerenciar a contagem decrescente do tempo de recarga (Cooldown).
   */
  useEffect(() => {
    if (cooldown > 0) {
      const timerId = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [cooldown]);

  /**
   * Efeito colateral de interface visual (Toast).
   */
  useEffect(() => {
    if (feedback?.type === 'success') {
      const timerId = setTimeout(() => setFeedback(null), 5000);
      return () => clearTimeout(timerId);
    }
  }, [feedback]);

  /**
   * Controla e manipula as alterações do usuário nos elementos do formulário.
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFeedback(null); // Limpa o feedback ao alterar qualquer campo
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * Intercepta a submissão do formulário, valida os dados no Zod, enfileira a tarefa de diagnóstico e realiza polling até a conclusão.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0 || isSubmitting) return;
    setFeedback(null);
    setIsSubmitting(true);
    setMensagemStatus('Iniciando recálculo do diagnóstico...');
    setProgresso(null);

    try {
      // 1. Validação Zod
      const dadosValidados = fazendaSchema.parse(formData);

      // 2. Requisição inicial para enfileirar o diagnóstico no BFF
      const response = await fetchComResiliencia('/api/diagnostico', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dadosValidados),
      }, 3, 2000, 10000, 15000);

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: Falha ao processar análise.`);
      }

      const initData = await response.json();
      const taskId = initData.task_id;

      if (!taskId) {
        throw new Error('A API não retornou um ID de tarefa válido para acompanhamento.');
      }

      setMensagemStatus('Inteligência Artificial processando novo diagnóstico...');

      // 3. Polling na rota de status
      const maxTempoPolling = 180000; // 3 minutos
      const tempoInicio = Date.now();
      let statusData: DiagnosticoStatusResponse | null = null;

      while (true) {
        if (Date.now() - tempoInicio > maxTempoPolling) {
          throw new Error('Tempo limite de processamento da IA (3 minutos) excedido.');
        }

        await new Promise((resolve) => setTimeout(resolve, 3000));

        const statusResponse = await fetchComResiliencia(`/api/diagnostico/status/${taskId}`, {
          method: 'GET'
        }, 3, 2000, 10000, 10000);

        if (!statusResponse.ok) {
          throw new Error('Falha ao consultar status do processamento.');
        }

        statusData = await statusResponse.json();

        if (statusData?.message) {
          setMensagemStatus(statusData.message);
        }

        if (statusData?.progress && typeof statusData.progress.done === 'number' && typeof statusData.progress.total === 'number') {
          setProgresso(statusData.progress);
        }

        if (statusData?.status === 'completed') {
          break;
        } else if (statusData?.status === 'failed') {
          throw new Error('O motor de Inteligência Artificial falhou ao processar o diagnóstico.');
        }
      }

      // 4. Sucesso: Atualiza Zustand e redireciona para a tela de diagnóstico
      setDadosFazenda(dadosValidados);
      setDiagnosticoIA(statusData?.result);
      setCooldown(12);
      setFeedback({ type: 'success', message: 'Diagnóstico atualizado com sucesso! Redirecionando...' });

      setTimeout(() => {
        router.push('/diagnostico');
      }, 1500);

    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Erro na submissão/polling:', error);
      }

      let errorMessage = 'Verifique os dados e tente novamente.';
      if (error instanceof ZodError) {
        errorMessage = error.issues.map(e => e.message).join(' ');
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      setCooldown(5);
      setFeedback({ type: 'error', message: `Erro ao atualizar: ${errorMessage}.` });
    } finally {
      setIsSubmitting(false);
      setMensagemStatus('');
      setProgresso(null);
    }
  };

  // Intercepta e renderiza um aviso de escape rápido se a fazenda base não existir na store
  if (!dadosFazenda) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-8">
        <div className="text-center text-red-500 font-bold text-2xl mb-4">Nenhum dado encontrado.</div>
        <p className="text-gray-600 mb-8 text-center max-w-md">Por favor, preencha o formulário inicial para gerar um diagnóstico antes de tentar ajustar os dados da fazenda.</p>
        <Link href="/formulario" className="bg-primary hover:bg-primary-light text-white font-bold py-3 px-8 rounded-lg shadow-md transition duration-200">
          Ir para Coleta de Dados
        </Link>
      </div>
    );
  }

  const porcentagemAjustes = progresso && progresso.total > 0
    ? Math.min(100, Math.round((progresso.done / progresso.total) * 100))
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-10 border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Ajuste de Dados da Fazenda</h1>
          <p className="text-gray-600 mb-8">Modifique os valores abaixo para recalcular o diagnóstico. Limite de uma atualização a cada 30 segundos.</p>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Bloco 1: Estrutura e Rebanho */}
            <section className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h2 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
                Estrutura e Rebanho
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <LabelComDica htmlFor="nome_fazenda" label="Nome da Fazenda" />
                  <input
                    id="nome_fazenda" name="nome_fazenda" type="text" required
                    value={formData.nome_fazenda || ''} onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
                  />
                </div>
                <div className="md:col-span-2">
                  <LabelComDica htmlFor="email" label="E-mail do Produtor" />
                  <input
                    id="email" name="email" type="email"
                    value={formData.email || ''} onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition"
                    placeholder="produtor@email.com"
                  />
                </div>
                <div>
                  <LabelComDica htmlFor="sistema_producao" label="Sistema de Produção" />
                  <select
                    id="sistema_producao" name="sistema_producao" required
                    value={formData.sistema_producao || ''} onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition bg-white"
                  >
                    <option value="" disabled>Selecione...</option>
                    {opcoesSistemas.map((item, idx) => {
                      const val = getOptionValue(item);
                      const lbl = getOptionLabel(item);
                      return (
                        <option key={`sistema-${val}-${idx}`} value={val}>
                          {lbl}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <LabelComDica htmlFor="regiao" label="Região" />
                  <select
                    id="regiao" name="regiao" required
                    value={formData.regiao || ''} onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition bg-white"
                  >
                    <option value="" disabled>Selecione...</option>
                    {opcoesRegioes.map((item, idx) => {
                      const val = getOptionValue(item);
                      const lbl = getOptionLabel(item);
                      return (
                        <option key={`regiao-${val}-${idx}`} value={val}>
                          {lbl}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <CampoNumericoAjuste id="total_vacas" label="Total de Vacas" dica="Todo o rebanho leiteiro" value={formData.total_vacas || ''} onChange={handleChange} />
                </div>
                <div>
                  <CampoNumericoAjuste id="percentual_lactacao" label="Perc. em Lactação" unidade="%" dica="Percentual do rebanho de vacas que estão em lactação atualmente." value={formData.percentual_lactacao || ''} onChange={handleChange} />
                </div>
                <div>
                  <CampoNumericoAjuste id="animais_rebanho" label="Total no Rebanho" dica="Inclui vacas secas, novilhas, bezerras, etc." value={formData.animais_rebanho || ''} onChange={handleChange} />
                </div>
                <div>
                  <CampoNumericoAjuste id="area_atividade" label="Área da Atividade" unidade="ha" dica="Hectares dedicados à produção de leite." value={formData.area_atividade || ''} onChange={handleChange} />
                </div>
                <div className="md:col-span-2">
                  <CampoNumericoAjuste id="mao_obra_total" label="Mão de Obra Total" dica="Número de funcionários diretos na atividade leiteira." value={formData.mao_obra_total || ''} onChange={handleChange} />
                </div>
              </div>
            </section>

            {/* Bloco 2: Produção e Mercado */}
            <section className="bg-gray-50 p-6 rounded-xl border border-gray-200">
              <h2 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
                <span className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
                Produção e Mercado
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <CampoNumericoAjuste id="producao_vaca" label="Prod. por Vaca" unidade="L/dia" value={formData.producao_vaca || ''} onChange={handleChange} />
                </div>
                <div>
                  <CampoNumericoAjuste id="ccs" label="Qualidade (CCS)" unidade="x1000" dica="Contagem de Células Somáticas" value={formData.ccs || ''} onChange={handleChange} />
                </div>
                <div>
                  <CampoNumericoAjuste id="preco_leite" label="Preço Recebido" unidade="R$/L" value={formData.preco_leite || ''} onChange={handleChange} />
                </div>
                <div>
                  <CampoNumericoAjuste id="preco_referencia" label="Preço de Referência" unidade="R$/L" dica="Preço médio de referência para sua região." value={formData.preco_referencia || ''} onChange={handleChange} />
                </div>
                <div>
                  <CampoNumericoAjuste id="preco_concentrado" label="Preço do Concentrado" unidade="R$/kg" dica="Preço médio pago pelo produtor no kg do concentrado." value={formData.preco_concentrado || ''} onChange={handleChange} />
                </div>
              </div>
            </section>

            {/* Rodapé de Ações com Cooldown e Progresso */}
            <div className="flex flex-col items-center justify-center gap-3 w-full max-w-md mx-auto pt-2">
              <button
                type="submit"
                disabled={isSubmitting || cooldown > 0}
                className={`w-full flex items-center justify-center font-bold py-3 px-10 rounded-lg shadow-md transition duration-200 ${isSubmitting || cooldown > 0
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-primary hover:bg-primary-light text-white'
                  }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {mensagemStatus || 'Atualizando...'}
                  </span>
                ) : cooldown > 0 ? (
                  `Aguarde ${cooldown}s`
                ) : (
                  'Atualizar Dados'
                )}
              </button>

              {isSubmitting && progresso && progresso.total > 0 && (
                <div className="w-full space-y-1.5 animate-in fade-in duration-300">
                  <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden shadow-inner border border-gray-100">
                    <div 
                      className="bg-gradient-to-r from-primary to-primary-light h-full rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${porcentagemAjustes}%` }}
                      role="progressbar"
                      aria-valuenow={porcentagemAjustes}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500 font-medium px-1">
                    <span>{progresso.done} de {progresso.total} análises concluídas</span>
                    <span className="font-bold text-primary">{porcentagemAjustes}%</span>
                  </div>
                </div>
              )}
            </div>

          </form>
        </div>
      </main>

      {/* Popup de Feedback (Toast) */}
      {feedback && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setFeedback(null)}
        >
          <div
            className={`p-4 rounded-lg shadow-2xl flex items-start gap-3 text-sm font-medium border-l-4 w-full max-w-md ${feedback.type === 'success'
                ? 'bg-white border-green-500 text-gray-800'
                : 'bg-white border-red-500 text-gray-800'
              }`}
            onClick={e => e.stopPropagation()}
          >
            {feedback.type === 'success' ? (
              <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="font-bold text-base mb-1">
                {feedback.type === 'success' ? 'Sucesso!' : 'Atenção!'}
              </p>
              <p className="text-gray-600 font-normal leading-relaxed">{feedback.message}</p>
            </div>
            <button onClick={() => setFeedback(null)} className="ml-4 text-gray-400 hover:text-gray-600 transition-colors" title="Fechar">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
