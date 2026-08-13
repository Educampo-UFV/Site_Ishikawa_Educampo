/**
 * @file src/components/CadastrarFazendaSection.tsx
 * @description Componente React isolado e expansível para cadastro de novas fazendas/produtores.
 * Integração com POST /api/produtores e validação Zod client-side.
 * Ref: Obsidian note [[sdd-cadastrar-fazenda.md]]
 */

'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, PlusCircle, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { cadastrarFazendaSchema, CadastrarFazendaFormData } from '@/lib/schemas';
import { SistemaProducaoItem, RegiaoSebraeItem } from '@/types/formulario';

interface CadastrarFazendaSectionProps {
  sistemasDisponiveis?: SistemaProducaoItem[];
  regioesDisponiveis?: RegiaoSebraeItem[];
  onSuccess?: () => void;
}

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

const INITIAL_STATE: CadastrarFazendaFormData = {
  email: '',
  senha: '',
  nome_fazenda: '',
  sistema_producao: '',
  regiao_sebrae: '',
  total_vacas: 0,
  percentual_lactacao: 0,
  total_rebanho: 0,
  area_atividade: 0,
  numero_trabalhadores: 1,
  producao_vaca: 0,
  preco_recebido: 0,
  preco_referencia: 0,
  ccs: 0,
};

export const CadastrarFazendaSection: React.FC<CadastrarFazendaSectionProps> = ({
  sistemasDisponiveis = [],
  regioesDisponiveis = [],
  onSuccess,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [formData, setFormData] = useState<CadastrarFazendaFormData>(INITIAL_STATE);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleExpand = () => {
    setIsExpanded((prev) => !prev);
    setSubmitError(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    setSubmitError(null);

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : Number(value)) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setSubmitError(null);
    setSuccessMessage(null);

    // Validação Zod Client-Side
    const validacao = cadastrarFazendaSchema.safeParse(formData);

    if (!validacao.success) {
      const errors: Record<string, string> = {};
      validacao.error.issues.forEach((issue) => {
        const path = issue.path[0] as string;
        if (path && !errors[path]) {
          errors[path] = issue.message;
        }
      });
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/produtores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validacao.data),
      });

      const responseData = await response.json().catch(() => ({}));

      if (response.status === 201 || response.ok) {
        setSuccessMessage('Fazenda cadastrada com sucesso!');
        setFormData(INITIAL_STATE);
        setIsExpanded(false);
        if (onSuccess) {
          onSuccess();
        }
      } else if (response.status === 409) {
        const errorMsg = responseData.message || responseData.error || `O e-mail ${formData.email} já está cadastrado no sistema.`;
        setSubmitError(errorMsg);
        setFieldErrors((prev) => ({ ...prev, email: errorMsg }));
      } else if (response.status === 400) {
        const errorMsg = responseData.message || responseData.error || 'Erro nas informações prestadas do cadastro.';
        setSubmitError(errorMsg);
      } else {
        setSubmitError(responseData.message || responseData.error || 'Falha ao realizar cadastro da fazenda.');
      }
    } catch (error) {
      console.error('Erro na submissão de cadastro:', error);
      setSubmitError('Erro de conexão ao cadastrar fazenda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="bg-emerald-50/70 border border-emerald-200 rounded-xl shadow-sm overflow-hidden mb-6 transition-all duration-300">
      {/* Header Colapsável */}
      <button
        type="button"
        onClick={toggleExpand}
        className="w-full px-6 py-4 flex items-center justify-between bg-emerald-100/60 hover:bg-emerald-100 transition-colors text-left focus:outline-none focus:ring-2 focus:ring-emerald-500"
        aria-expanded={isExpanded}
        data-testid="toggle-cadastrar-fazenda-btn"
      >
        <div className="flex items-center gap-3">
          <PlusCircle className="text-emerald-700" size={22} />
          <div>
            <h2 className="text-lg font-bold text-emerald-900">Cadastrar Nova Fazenda / Produtor</h2>
            <p className="text-xs text-emerald-700">Adicione uma nova propriedade diretamente ao sistema Educampo</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
          <span>{isExpanded ? 'Recolher' : 'Expandir'}</span>
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>

      {/* Banner de Sucesso */}
      {successMessage && !isExpanded && (
        <div className="mx-6 my-4 p-3 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-lg flex items-center gap-2 text-sm font-medium">
          <CheckCircle size={18} className="text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Conteúdo Expandido do Formulário */}
      {isExpanded && (
        <form onSubmit={handleSubmit} className="p-6 space-y-6 bg-white" data-testid="cadastrar-fazenda-form">
          {submitError && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md text-sm flex items-center gap-2">
              <AlertCircle size={18} className="flex-shrink-0 text-red-600" />
              <span>{submitError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* E-mail */}
            <div>
              <label htmlFor="cad_email" className="block text-xs font-semibold text-gray-700 mb-1">
                E-mail do Produtor *
              </label>
              <input
                id="cad_email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="ex: produtor@fazenda.com.br"
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                  fieldErrors.email ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {fieldErrors.email && <p className="text-xs text-red-600 mt-1">{fieldErrors.email}</p>}
            </div>

            {/* Senha */}
            <div>
              <label htmlFor="cad_senha" className="block text-xs font-semibold text-gray-700 mb-1">
                Senha (mínimo 6 caracteres) *
              </label>
              <input
                id="cad_senha"
                name="senha"
                type="password"
                required
                value={formData.senha}
                onChange={handleChange}
                placeholder="******"
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                  fieldErrors.senha ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {fieldErrors.senha && <p className="text-xs text-red-600 mt-1">{fieldErrors.senha}</p>}
            </div>

            {/* Nome da Fazenda */}
            <div>
              <label htmlFor="cad_nome_fazenda" className="block text-xs font-semibold text-gray-700 mb-1">
                Nome da Fazenda *
              </label>
              <input
                id="cad_nome_fazenda"
                name="nome_fazenda"
                type="text"
                required
                value={formData.nome_fazenda}
                onChange={handleChange}
                placeholder="ex: Fazenda Santa Maria"
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                  fieldErrors.nome_fazenda ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {fieldErrors.nome_fazenda && <p className="text-xs text-red-600 mt-1">{fieldErrors.nome_fazenda}</p>}
            </div>

            {/* Sistema de Produção */}
            <div>
              <label htmlFor="cad_sistema_producao" className="block text-xs font-semibold text-gray-700 mb-1">
                Sistema de Produção *
              </label>
              <select
                id="cad_sistema_producao"
                name="sistema_producao"
                required
                value={formData.sistema_producao}
                onChange={handleChange}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white ${
                  fieldErrors.sistema_producao ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Selecione o sistema</option>
                {sistemasDisponiveis.map((sis, idx) => (
                  <option key={idx} value={getOptionValue(sis)}>
                    {getOptionLabel(sis)}
                  </option>
                ))}
              </select>
              {fieldErrors.sistema_producao && <p className="text-xs text-red-600 mt-1">{fieldErrors.sistema_producao}</p>}
            </div>

            {/* Região SEBRAE */}
            <div>
              <label htmlFor="cad_regiao_sebrae" className="block text-xs font-semibold text-gray-700 mb-1">
                Região SEBRAE *
              </label>
              <select
                id="cad_regiao_sebrae"
                name="regiao_sebrae"
                required
                value={formData.regiao_sebrae}
                onChange={handleChange}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white ${
                  fieldErrors.regiao_sebrae ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Selecione a região</option>
                {regioesDisponiveis.map((reg, idx) => (
                  <option key={idx} value={getOptionValue(reg)}>
                    {getOptionLabel(reg)}
                  </option>
                ))}
              </select>
              {fieldErrors.regiao_sebrae && <p className="text-xs text-red-600 mt-1">{fieldErrors.regiao_sebrae}</p>}
            </div>

            {/* Total de Vacas */}
            <div>
              <label htmlFor="cad_total_vacas" className="block text-xs font-semibold text-gray-700 mb-1">
                Total de Vacas (cab.) *
              </label>
              <input
                id="cad_total_vacas"
                name="total_vacas"
                type="number"
                min="0"
                required
                value={formData.total_vacas}
                onChange={handleChange}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                  fieldErrors.total_vacas ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {fieldErrors.total_vacas && <p className="text-xs text-red-600 mt-1">{fieldErrors.total_vacas}</p>}
            </div>

            {/* Perc. Lactação */}
            <div>
              <label htmlFor="cad_percentual_lactacao" className="block text-xs font-semibold text-gray-700 mb-1">
                Perc. em Lactação (%) *
              </label>
              <input
                id="cad_percentual_lactacao"
                name="percentual_lactacao"
                type="number"
                min="0"
                max="100"
                step="0.1"
                required
                value={formData.percentual_lactacao}
                onChange={handleChange}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                  fieldErrors.percentual_lactacao ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {fieldErrors.percentual_lactacao && <p className="text-xs text-red-600 mt-1">{fieldErrors.percentual_lactacao}</p>}
            </div>

            {/* Total Rebanho */}
            <div>
              <label htmlFor="cad_total_rebanho" className="block text-xs font-semibold text-gray-700 mb-1">
                Total do Rebanho (cab.) *
              </label>
              <input
                id="cad_total_rebanho"
                name="total_rebanho"
                type="number"
                min="0"
                required
                value={formData.total_rebanho}
                onChange={handleChange}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                  fieldErrors.total_rebanho ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {fieldErrors.total_rebanho && <p className="text-xs text-red-600 mt-1">{fieldErrors.total_rebanho}</p>}
            </div>

            {/* Área Atividade */}
            <div>
              <label htmlFor="cad_area_atividade" className="block text-xs font-semibold text-gray-700 mb-1">
                Área da Atividade (ha) *
              </label>
              <input
                id="cad_area_atividade"
                name="area_atividade"
                type="number"
                min="0.1"
                step="0.1"
                required
                value={formData.area_atividade}
                onChange={handleChange}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                  fieldErrors.area_atividade ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {fieldErrors.area_atividade && <p className="text-xs text-red-600 mt-1">{fieldErrors.area_atividade}</p>}
            </div>

            {/* Número Trabalhadores */}
            <div>
              <label htmlFor="cad_numero_trabalhadores" className="block text-xs font-semibold text-gray-700 mb-1">
                Mão de Obra (trabalhadores) *
              </label>
              <input
                id="cad_numero_trabalhadores"
                name="numero_trabalhadores"
                type="number"
                min="1"
                required
                value={formData.numero_trabalhadores}
                onChange={handleChange}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                  fieldErrors.numero_trabalhadores ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {fieldErrors.numero_trabalhadores && (
                <p className="text-xs text-red-600 mt-1">{fieldErrors.numero_trabalhadores}</p>
              )}
            </div>

            {/* Produção Vaca */}
            <div>
              <label htmlFor="cad_producao_vaca" className="block text-xs font-semibold text-gray-700 mb-1">
                Produção por Vaca (L/dia) *
              </label>
              <input
                id="cad_producao_vaca"
                name="producao_vaca"
                type="number"
                min="0"
                step="0.1"
                required
                value={formData.producao_vaca}
                onChange={handleChange}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                  fieldErrors.producao_vaca ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {fieldErrors.producao_vaca && <p className="text-xs text-red-600 mt-1">{fieldErrors.producao_vaca}</p>}
            </div>

            {/* Preço Recebido */}
            <div>
              <label htmlFor="cad_preco_recebido" className="block text-xs font-semibold text-gray-700 mb-1">
                Preço Recebido (R$/L) *
              </label>
              <input
                id="cad_preco_recebido"
                name="preco_recebido"
                type="number"
                min="0"
                step="0.01"
                required
                value={formData.preco_recebido}
                onChange={handleChange}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                  fieldErrors.preco_recebido ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {fieldErrors.preco_recebido && <p className="text-xs text-red-600 mt-1">{fieldErrors.preco_recebido}</p>}
            </div>

            {/* Preço Referência */}
            <div>
              <label htmlFor="cad_preco_referencia" className="block text-xs font-semibold text-gray-700 mb-1">
                Preço Referência (R$/L) *
              </label>
              <input
                id="cad_preco_referencia"
                name="preco_referencia"
                type="number"
                min="0"
                step="0.01"
                required
                value={formData.preco_referencia}
                onChange={handleChange}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                  fieldErrors.preco_referencia ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {fieldErrors.preco_referencia && <p className="text-xs text-red-600 mt-1">{fieldErrors.preco_referencia}</p>}
            </div>

            {/* Qualidade CCS */}
            <div>
              <label htmlFor="cad_ccs" className="block text-xs font-semibold text-gray-700 mb-1">
                Qualidade CCS (x1000) *
              </label>
              <input
                id="cad_ccs"
                name="ccs"
                type="number"
                min="0"
                required
                value={formData.ccs}
                onChange={handleChange}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                  fieldErrors.ccs ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {fieldErrors.ccs && <p className="text-xs text-red-600 mt-1">{fieldErrors.ccs}</p>}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={toggleExpand}
              className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-6 rounded-lg shadow transition disabled:opacity-50 text-sm"
              data-testid="cadastrar-fazenda-submit-btn"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Cadastrando...</span>
                </>
              ) : (
                <span>Cadastrar Fazenda</span>
              )}
            </button>
          </div>
        </form>
      )}
    </section>
  );
};
