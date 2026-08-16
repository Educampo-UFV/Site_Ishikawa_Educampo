/**
 * @file src/components/CadastrarFazendaSection.tsx
 * @description Componente React isolado e expansível para cadastro de novas fazendas/produtores.
 * Integração com POST /api/produtores, validação Zod client-side e parsing centralizado de erros.
 * Ref: Obsidian note [[sdd-cadastrar-fazenda.md]]
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, PlusCircle, CheckCircle, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { cadastrarFazendaSchema, CadastrarFazendaFormData } from '@/lib/schemas';
import { SistemaProducaoItem, RegiaoSebraeItem } from '@/types/formulario';
import { parseApiError } from '@/lib/apiUtils';

interface CadastrarFazendaSectionProps {
  sistemasDisponiveis?: SistemaProducaoItem[];
  regioesDisponiveis?: RegiaoSebraeItem[];
  onSuccess?: () => void;
  onCadastrarEDiagnosticar?: (formData: CadastrarFazendaFormData, producerId?: string) => void;
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

interface FormInputProps {
  id: string;
  name: keyof CadastrarFazendaFormData | string;
  label: string;
  type?: string;
  required?: boolean;
  value: string | number;
  error?: string;
  placeholder?: string;
  min?: number | string;
  max?: number | string;
  step?: number | string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const FormInput: React.FC<FormInputProps> = ({
  id,
  name,
  label,
  type = 'text',
  required = true,
  value,
  error,
  placeholder,
  min,
  max,
  step,
  onChange,
}) => {
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (type === 'number') {
      e.target.select();
    }
  };

  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-gray-700 mb-1">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        value={value}
        onChange={onChange}
        onFocus={handleFocus}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
          error ? 'border-red-500 bg-red-50/50' : 'border-gray-300'
        }`}
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
};

interface PasswordInputProps {
  id: string;
  name: string;
  label: string;
  required?: boolean;
  value: string;
  error?: string;
  placeholder?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  toggleTestId?: string;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
  id,
  name,
  label,
  required = true,
  value,
  error,
  placeholder,
  onChange,
  toggleTestId,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [peekChar, setPeekChar] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    let newRealValue = rawVal;

    if (!showPassword) {
      if (rawVal.includes('•')) {
        if (rawVal.length > value.length) {
          const addedChar = rawVal.slice(rawVal.length - 1);
          newRealValue = value + addedChar;
          setPeekChar(addedChar);
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          timeoutRef.current = setTimeout(() => {
            setPeekChar(null);
          }, 800);
        } else if (rawVal.length < value.length) {
          newRealValue = value.slice(0, rawVal.length);
          setPeekChar(null);
        }
      } else {
        newRealValue = rawVal;
        if (rawVal.length > value.length && rawVal.length === value.length + 1) {
          const lastChar = rawVal.slice(-1);
          setPeekChar(lastChar);
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          timeoutRef.current = setTimeout(() => {
            setPeekChar(null);
          }, 800);
        } else {
          setPeekChar(null);
        }
      }
    } else {
      setPeekChar(null);
    }

    const syntheticEvent = {
      ...e,
      target: {
        ...e.target,
        name,
        value: newRealValue,
      },
    } as React.ChangeEvent<HTMLInputElement>;

    onChange(syntheticEvent);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const getMaskedDisplay = () => {
    if (showPassword) return value;
    if (!value) return '';
    if (peekChar !== null && value.length > 0) {
      return '•'.repeat(Math.max(0, value.length - 1)) + peekChar;
    }
    return '•'.repeat(value.length);
  };

  const toggleVisibility = () => {
    setShowPassword((prev) => !prev);
    setPeekChar(null);
  };

  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative flex items-center">
        <input
          id={id}
          name={name}
          type={showPassword ? 'text' : (peekChar ? 'text' : 'password')}
          required={required}
          value={showPassword ? value : (peekChar ? getMaskedDisplay() : value)}
          onChange={handleInputChange}
          placeholder={placeholder}
          autoComplete="new-password"
          className={`w-full px-3 py-2 pr-10 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
            error ? 'border-red-500 bg-red-50/50' : 'border-gray-300'
          }`}
        />
        <button
          type="button"
          onClick={toggleVisibility}
          data-testid={toggleTestId}
          aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
          className="absolute right-2.5 p-1 text-gray-500 hover:text-emerald-700 transition-colors focus:outline-none"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
};

interface FormSelectProps {
  id: string;
  name: keyof CadastrarFazendaFormData;
  label: string;
  required?: boolean;
  value: string;
  error?: string;
  placeholder: string;
  options: (SistemaProducaoItem | RegiaoSebraeItem)[];
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

const FormSelect: React.FC<FormSelectProps> = ({
  id,
  name,
  label,
  required = true,
  value,
  error,
  placeholder,
  options,
  onChange,
}) => (
  <div>
    <label htmlFor={id} className="block text-xs font-semibold text-gray-700 mb-1">
      {label}
    </label>
    <select
      id={id}
      name={name}
      required={required}
      value={value}
      onChange={onChange}
      className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white ${
        error ? 'border-red-500 bg-red-50/50' : 'border-gray-300'
      }`}
    >
      <option value="">{placeholder}</option>
      {options.map((item, idx) => (
        <option key={idx} value={getOptionValue(item)}>
          {getOptionLabel(item)}
        </option>
      ))}
    </select>
    {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
  </div>
);

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
  onCadastrarEDiagnosticar,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [formData, setFormData] = useState<CadastrarFazendaFormData>(INITIAL_STATE);
  const [confirmarSenha, setConfirmarSenha] = useState('');
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

    setFormData((prev) => {
      let parsedValue: any = value;
      if (type === 'number') {
        if (value === '') {
          parsedValue = '';
        } else {
          parsedValue = Number(value);
        }
      }
      return {
        ...prev,
        [name]: parsedValue,
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setSubmitError(null);
    setSuccessMessage(null);

    // Validação client-side da confirmação de senha
    if (!confirmarSenha) {
      setFieldErrors({ confirmar_senha: 'A confirmação de senha é obrigatória' });
      return;
    }

    if (formData.senha !== confirmarSenha) {
      setFieldErrors({ confirmar_senha: 'As senhas não conferem' });
      return;
    }

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

      if (response.ok) {
        const responseData = await response.json().catch(() => ({}));
        const producerId = responseData?.id || responseData?.id_fazenda;
        setSuccessMessage('Fazenda cadastrada com sucesso!');
        onSuccess?.();
        if (onCadastrarEDiagnosticar) {
          onCadastrarEDiagnosticar(validacao.data, producerId);
        } else {
          setFormData(INITIAL_STATE);
          setConfirmarSenha('');
          setIsExpanded(false);
        }
      } else {
        const parsedError = await parseApiError(response);
        setSubmitError(parsedError.userMessage);
        if (Object.keys(parsedError.fieldErrors).length > 0) {
          setFieldErrors(parsedError.fieldErrors);
        }
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

          {/* Seção 1: Informações Gerais */}
          <div className="bg-gray-50/70 p-5 rounded-lg border border-gray-200 space-y-4">
            <h3 className="text-sm font-bold text-emerald-900 border-b border-gray-200 pb-2">
              Informações Gerais
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                id="cad_email"
                name="email"
                type="email"
                label="E-mail do Produtor *"
                value={formData.email}
                error={fieldErrors.email}
                placeholder="ex: produtor@fazenda.com.br"
                onChange={handleChange}
              />

              <FormInput
                id="cad_nome_fazenda"
                name="nome_fazenda"
                type="text"
                label="Nome da Fazenda *"
                value={formData.nome_fazenda}
                error={fieldErrors.nome_fazenda}
                placeholder="ex: Fazenda Santa Maria"
                onChange={handleChange}
              />

              <PasswordInput
                id="cad_senha"
                name="senha"
                label="Senha (mínimo 6 caracteres) *"
                value={formData.senha}
                error={fieldErrors.senha}
                placeholder="******"
                onChange={handleChange}
                toggleTestId="toggle-senha-btn"
              />

              <PasswordInput
                id="cad_confirmar_senha"
                name="confirmar_senha"
                label="Confirmar Senha *"
                value={confirmarSenha}
                error={fieldErrors.confirmar_senha}
                placeholder="******"
                onChange={(e) => {
                  setConfirmarSenha(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, confirmar_senha: '' }));
                }}
                toggleTestId="toggle-confirmar-senha-btn"
              />

              <FormSelect
                id="cad_sistema_producao"
                name="sistema_producao"
                label="Sistema de Produção *"
                value={formData.sistema_producao}
                error={fieldErrors.sistema_producao}
                placeholder="Selecione o sistema"
                options={sistemasDisponiveis}
                onChange={handleChange}
              />

              <FormSelect
                id="cad_regiao_sebrae"
                name="regiao_sebrae"
                label="Região SEBRAE *"
                value={formData.regiao_sebrae}
                error={fieldErrors.regiao_sebrae}
                placeholder="Selecione a região"
                options={regioesDisponiveis}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Seção 2: Estrutura e Rebanho */}
          <div className="bg-gray-50/70 p-5 rounded-lg border border-gray-200 space-y-4">
            <h3 className="text-sm font-bold text-emerald-900 border-b border-gray-200 pb-2">
              Estrutura e Rebanho
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                id="cad_total_vacas"
                name="total_vacas"
                type="number"
                label="Total de Vacas (cab.) *"
                value={formData.total_vacas}
                error={fieldErrors.total_vacas}
                min={0}
                onChange={handleChange}
              />

              <FormInput
                id="cad_percentual_lactacao"
                name="percentual_lactacao"
                type="number"
                label="Perc. em Lactação (%) *"
                value={formData.percentual_lactacao}
                error={fieldErrors.percentual_lactacao}
                min={0}
                max={100}
                step={0.1}
                onChange={handleChange}
              />

              <FormInput
                id="cad_total_rebanho"
                name="total_rebanho"
                type="number"
                label="Total do Rebanho (cab.) *"
                value={formData.total_rebanho}
                error={fieldErrors.total_rebanho}
                min={0}
                onChange={handleChange}
              />

              <FormInput
                id="cad_area_atividade"
                name="area_atividade"
                type="number"
                label="Área da Atividade (ha) *"
                value={formData.area_atividade}
                error={fieldErrors.area_atividade}
                min={0.1}
                step={0.1}
                onChange={handleChange}
              />

              <div className="md:col-span-2">
                <FormInput
                  id="cad_numero_trabalhadores"
                  name="numero_trabalhadores"
                  type="number"
                  label="Mão de Obra (trabalhadores) *"
                  value={formData.numero_trabalhadores}
                  error={fieldErrors.numero_trabalhadores}
                  min={1}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Seção 3: Produção e Qualidade */}
          <div className="bg-gray-50/70 p-5 rounded-lg border border-gray-200 space-y-4">
            <h3 className="text-sm font-bold text-emerald-900 border-b border-gray-200 pb-2">
              Produção e Qualidade
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                id="cad_producao_vaca"
                name="producao_vaca"
                type="number"
                label="Produção por Vaca (L/dia) *"
                value={formData.producao_vaca}
                error={fieldErrors.producao_vaca}
                min={0}
                step={0.1}
                onChange={handleChange}
              />

              <FormInput
                id="cad_preco_recebido"
                name="preco_recebido"
                type="number"
                label="Preço Recebido (R$/L) *"
                value={formData.preco_recebido}
                error={fieldErrors.preco_recebido}
                min={0}
                step={0.01}
                onChange={handleChange}
              />

              <FormInput
                id="cad_preco_referencia"
                name="preco_referencia"
                type="number"
                label="Preço Referência (R$/L) *"
                value={formData.preco_referencia}
                error={fieldErrors.preco_referencia}
                min={0}
                step={0.01}
                onChange={handleChange}
              />

              <FormInput
                id="cad_ccs"
                name="ccs"
                type="number"
                label="Qualidade CCS (x1000) *"
                value={formData.ccs}
                error={fieldErrors.ccs}
                min={0}
                onChange={handleChange}
              />
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
