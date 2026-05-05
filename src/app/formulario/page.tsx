/**
 * @file src/app/formulario/page.tsx
 * @description Interface visual de coleta de dados da fazenda.
 * * COMO FUNCIONA:
 * 1. O componente renderiza um layout de formulário dividido em três categorias
 * lógicas (Informações Gerais, Estrutura e Rebanho, Produção e Qualidade).
 * 2. Utiliza estado local para capturar as entradas do usuário.
 * 3. Ao submeter, valida os dados (aqui interceptaremos os erros se houver). Se válidos,
 * injeta os dados na `useFazendaStore` (Zustand) e redireciona o usuário
 * para a tela de carregamento via `useRouter`.
 */

'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useFazendaStore } from '@/store/useFazendaStore';
import { fazendaSchema } from '@/lib/schemas';
import { Info } from 'lucide-react';

/**
 * @description Componente interno para renderizar o rótulo com unidade e tooltip de ajuda.
 */
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
}

/**
 * @description Componente de entrada com rótulo, unidade, dica de ajuda e placeholder padronizado.
 */
const InputComDica: React.FC<InputComDicaProps> = ({ label, unidade, dica, placeholder, ...props }) => (
  <div className="flex flex-col gap-1 w-full">
    <LabelComDica htmlFor={props.id as string} label={label} unidade={unidade} dica={dica} />
    <input
      {...props}
      placeholder={placeholder ? `Ex: ${placeholder}` : ''}
      className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-gray-300 ${props.className || ''}`}
    />
  </div>
);

export default function FormularioPage() {
  const router = useRouter();
  const setDadosFazenda = useFazendaStore((state: any) => state.setDadosFazenda);

  // Estados dos formulários (tipados e inicializados)
  const [formData, setFormData] = useState({
    nome_fazenda: '',
    sistema_producao: '',
    total_vacas: '',
    vacas_lactacao: '',
    animais_rebanho: '',
    area_atividade: '',
    mao_obra_total: '',
    producao_vaca: '',
    preco_leite: '',
    preco_referencia: '',
    ccs: '',
    regiao: '',
  });

  const [erros, setErros] = useState<string[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErros([]);

    // Validação real usando o Schema centralizado do projeto (z.coerce fará a conversão numérica)
    const validacao = fazendaSchema.safeParse(formData);

    if (!validacao.success) {
      // Garante suporte robusto para extrair a lista de erros, evitando falhas de prototype no JSDOM
      const errorData = validacao.error as any;
      const errorList = Array.isArray(errorData) ? errorData : (errorData?.issues || errorData?.errors || [{ message: 'Dados inválidos', path: ['Formulário'] }]);
      
      // Mapeia os erros do Zod para mensagens amigáveis na interface
      const mensagensErro = errorList.map((err: any) => {
        const path = err.path && Array.isArray(err.path) ? err.path.join(' ') : 'Campo';
        return `${path}: ${err.message}`;
      });
      
      setErros(mensagensErro);
      return;
    }

    // Se for sucesso, os dados já vêm tipados e tratados pelo Zod
    setDadosFazenda(validacao.data);
    router.push('/carregando');
  };

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
          />
          <h1 className="text-xl font-semibold text-primary">Diagnóstico de Fazenda</h1>
        </div>
      </header>

      {/* Container Principal */}
      <main className="max-w-4xl mx-auto px-4 mt-8">
        
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

        <form onSubmit={handleSubmit} className="space-y-8">
          
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
              <div className="flex flex-col gap-1 w-full">
                <LabelComDica 
                  htmlFor="sistema_producao" 
                  label="Sistema de Produção" 
                  dica="Modelo de confinamento ou pastagem adotado na propriedade." 
                />
                <select 
                  id="sistema_producao" name="sistema_producao" 
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  value={formData.sistema_producao} onChange={handleChange} required
                >
                  <option value="">Selecione o sistema</option>
                  <option value="semi_confinado">Semi-confinado</option>
                  <option value="compost_barn">Compost Barn</option>
                  <option value="confinado">Confinado</option>
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
                id="vacas_lactacao" name="vacas_lactacao" type="number" 
                label="Vacas em Lactação" unidade="cab." placeholder="85"
                dica="Apenas as vacas que estão produzindo leite atualmente."
                value={formData.vacas_lactacao} onChange={handleChange} min={0} max={50000} required 
              />
              <InputComDica 
                id="animais_rebanho" name="animais_rebanho" type="number" 
                label="Total no Rebanho" unidade="cab." placeholder="150"
                dica="Todas as categorias de animais do rebanho leiteiro."
                value={formData.animais_rebanho} onChange={handleChange} min={0} max={100000} required 
              />
              <InputComDica 
                id="area_atividade" name="area_atividade" type="number" step="0.01" 
                label="Área da Atividade" unidade="ha" placeholder="10.0"
                dica="Área total destinada à pecuária de leite em hectares."
                value={formData.area_atividade} onChange={handleChange} min={0.1} max={50000} required 
              />
              <div className="md:col-span-2">
                <InputComDica 
                  id="mao_obra_total" name="mao_obra_total" type="number" 
                  label="Mão de Obra Total" unidade="trabalhadores" placeholder="3"
                  dica="Número total de trabalhadores envolvidos na atividade leiteira."
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
                id="producao_vaca" name="producao_vaca" type="number" step="0.01" 
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
                id="preco_leite" name="preco_leite" type="number" step="0.01" 
                label="Preço Recebido" unidade="R$/L" placeholder="3.20"
                dica="Valor bruto recebido pelo litro do leite."
                value={formData.preco_leite} onChange={handleChange} min={0} max={15} required 
              />
              <InputComDica 
                id="preco_referencia" name="preco_referencia" type="number" step="0.01" 
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
                  >
                  <option value="">Selecione a região</option>
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

        {/* --- INÍCIO: PREENCHIMENTO AUTOMÁTICO PARA TESTES (REMOVER EM PRODUÇÃO - basta excluir esse bloco) --- */}
        <div className="mt-12 flex justify-center border-t border-gray-200 pt-6">
          <button
            type="button"
            onClick={() => setFormData({
              nome_fazenda: 'Fazenda Auto Teste',
              sistema_producao: 'compost_barn',
              total_vacas: '100',
              vacas_lactacao: '85',
              animais_rebanho: '120',
              area_atividade: '10.0',
              mao_obra_total: '2',
              producao_vaca: '35.0',
              preco_leite: '3.20',
              preco_referencia: '2.50',
              ccs: '150',
              regiao: 'triangulo',
            })}
            className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-600 font-medium py-2 px-4 rounded-md transition-colors"
          >
            🧪 Preenchimento Automático (DEV)
          </button>
        </div>
        {/* --- FIM: PREENCHIMENTO AUTOMÁTICO --- */}
      </main>
    </div>
  );
}