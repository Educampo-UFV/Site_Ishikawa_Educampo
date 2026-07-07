/**
 * @file src/app/ajustes/page.tsx
 * @description Interface visual para ajuste e recálculo dos dados da fazenda.
 * Reaproveita a estrutura visual de coleta, mas atua como uma ferramenta de edição.
 * Inclui proteção anti-spam com cooldown de 30 segundos nas requisições à API.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { ZodError } from 'zod';
import { useFazendaStore } from '@/store/useFazendaStore';
import { fazendaSchema, FazendaFormData } from '@/lib/schemas';
import { Navbar } from '@/components/ui/Navbar';
import { Info, AlertCircle, CheckCircle, Loader2, X } from 'lucide-react';
import Link from 'next/link';
import { NumericFormat } from 'react-number-format';

/**
 * Componente auxiliar genérico para renderizar um rótulo (label) com uma dica (tooltip) interativa.
 * 
 * @param {Object} props - Propriedades do componente.
 * @param {string} props.htmlFor - O ID do input associado a este rótulo, auxiliando na acessibilidade.
 * @param {string} props.label - O texto principal do rótulo.
 * @param {string} [props.unidade] - Texto opcional representando a unidade de medida (ex: R$/L).
 * @param {string} [props.dica] - Texto opcional para o tooltip (balão de dica) mostrado ao passar o mouse.
 * @returns {JSX.Element} Elemento JSX contendo o rótulo e o ícone de informação com tooltip embutido (se houver dica).
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

/**
 * Página de Ajustes de Dados da Fazenda.
 * 
 * Consume o estado global (`useFazendaStore`) para inicializar o formulário de forma controlada.
 * Esta página permite que o produtor faça alterações pontuais dos dados e recalcule o diagnóstico
 * inteiro refazendo o fetch ao BFF (`/api/diagnostico`). 
 * A lógica restringe requisições utilizando mecanismos de 'cooldown' limitados por tempo.
 * 
 * @returns {JSX.Element} A renderização estrutural do formulário de ajustes.
 */
export default function AjustesPage() {
  const { dadosFazenda, setDadosFazenda, setDiagnosticoIA } = useFazendaStore();

  // Inicializa o estado local com os dados da store (se existirem)
  const [formData, setFormData] = useState<Partial<FazendaFormData>>(dadosFazenda || {});

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  /**
   * Efeito colateral para gerenciar a contagem decrescente do tempo de recarga (Cooldown).
   * Implementa um timeout que roda a cada segundo subtraindo a variável `cooldown` até atingir 0,
   * ajudando a mitigar duplicação de submissões à API externa.
   */
  useEffect(() => {
    if (cooldown > 0) {
      const timerId = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [cooldown]);

  /**
   * Efeito colateral de interface visual (Toast).
   * Esconde e desmonta automaticamente as notificações flutuantes (feedback) do tipo 'sucesso' 
   * de volta para `null` após a duração de 5000ms.
   */
  useEffect(() => {
    if (feedback?.type === 'success') {
      const timerId = setTimeout(() => setFeedback(null), 5000);
      return () => clearTimeout(timerId);
    }
  }, [feedback]);

  /**
   * Controla e manipula as alterações do usuário nos elementos do formulário.
   * Captura as entradas e preenche o estado unificado do formulário `formData`.
   * 
   * @param {React.ChangeEvent<HTMLInputElement | HTMLSelectElement>} e - O evento de alteração do input/select.
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFeedback(null); // Limpa o feedback ao alterar qualquer campo
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * Intercepta a submissão do formulário, valida os dados no Zod e envia para a API recalcular o diagnóstico.
   * 
   * Fluxo da Função:
   * 1. Bloqueia se o sistema estiver operando ou sob tempo de penalidade (cooldown).
   * 2. Tenta forçar os dados atuais pelo schema de validação (Zod).
   * 3. Faz proxying e dispara requisição POST contra o BFF (`/api/diagnostico`).
   * 4. Atualiza a *store* (Zustand) com os novos parâmetros e os novos resultados.
   * 
   * @param {React.FormEvent} e - O evento de submissão do formulário.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0 || isSubmitting) return; // Barreira de proteção extra
    setFeedback(null);

    setIsSubmitting(true);

    try {
      // 1. Validação Zod
      const dadosValidados = fazendaSchema.parse(formData);

      // 2. Requisição para o BFF (API Real)
      const response = await fetch('/api/diagnostico', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dadosValidados),
      });

      if (!response.ok) {
        throw new Error(`Erro ${response.status}: Falha ao processar análise.`);
      }

      const diagnostico = await response.json();

      // 3. Sucesso: Atualiza o Zustand e inicia Cooldown de 30s
      setDadosFazenda(dadosValidados);
      setDiagnosticoIA(diagnostico);
      setCooldown(12); // Tempo padrão em caso de sucesso
      setFeedback({ type: 'success', message: 'A atualização foi concluída com sucesso!' });

    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Erro na submissão:', error);
      }

      let errorMessage = 'Verifique os dados e tente novamente.';
      if (error instanceof ZodError) {
        // Formata a mensagem de erro do Zod para ser mais legível
        errorMessage = error.issues.map(e => e.message).join(' ');
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      setCooldown(5); // Tempo ajustado para 5s em caso de erro
      setFeedback({ type: 'error', message: `Erro ao atualizar: ${errorMessage}. Por favor, espere 10 segundos e tente novamente.` });
    } finally {
      setIsSubmitting(false);
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
                <div>
                  <LabelComDica htmlFor="sistema_producao" label="Sistema de Produção" />
                  <select
                    id="sistema_producao" name="sistema_producao" required
                    value={formData.sistema_producao || ''} onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition bg-white"
                  >
                    <option value="" disabled>Selecione...</option>
                    <option value="compost-barn">Compost Barn</option>
                    <option value="semiconfinado">Semi-confinado</option>
                    <option value="confinado-sem-estrutura">Confinado</option>
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
                    <option value="triangulo">Triângulo Mineiro</option>
                    <option value="rio doce e vale do aco">Rio Doce e Vale do Aço</option>
                    <option value="noroeste e alto paranaiba">Noroeste e Alto Paranaíba</option>
                    <option value="centro">Centro</option>
                    <option value="centro-oeste e sudoeste">Centro-Oeste e Sudoeste</option>
                    <option value="sul">Sul</option>
                    <option value="norte">Norte</option>
                    <option value="zona da mata e vertentes">Zona da Mata e Vertentes</option>
                    <option value="jequitinhonha e mucuri">Jequitinhonha e Mucuri</option>
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

            {/* Rodapé de Ações com Cooldown */}
            <div className="flex justify-center pt-2">
              <button
                type="submit"
                disabled={isSubmitting || cooldown > 0}
                className={`flex items-center justify-center font-bold py-3 px-10 rounded-lg shadow-md transition duration-200 ${isSubmitting || cooldown > 0
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-primary hover:bg-primary-light text-white'
                  }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Atualizando...
                  </span>
                ) : cooldown > 0 ? (
                  `Aguarde ${cooldown}s`
                ) : (
                  'Atualizar Dados'
                )}
              </button>
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