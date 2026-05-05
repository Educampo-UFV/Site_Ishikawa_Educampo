/**
 * @file Navbar.tsx
 * @description Componente de cabeçalho e navegação global. 
 * Exibe o logotipo do Educampo à esquerda e um botão de menu (hamburger/X) à direita.
 * O Menu Expandido respeita o container centralizado para alinhar-se perfeitamente ao botão "X".
 */

"use client";

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BarChart2, Lightbulb, Settings } from 'lucide-react';

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <header className="relative z-50 bg-transparent w-full">
      {/* CONTAINER DE REFERÊNCIA (Centralizado) 
          Colocamos 'relative' aqui para que o menu se posicione em relação ao conteúdo centralizado
      */}
      <div className="max-w-7xl mx-auto px-6 relative">
        
        {/* Barra Superior */}
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center">
            <Link href="/">
              <Image
                src="/banner_educampo.png"
                alt="Logo Educampo"
                width={150}
                height={40}
                className="object-contain cursor-pointer"
                priority
              />
            </Link>
          </div>
          
          {/* Botão Hamburger com Animação Morph (Hamburger -> X) 
              Z-index [60] para flutuar SEMPRE acima do menu 
          */}
          <button
            onClick={toggleMenu}
            className="w-11 h-11 flex flex-col items-center justify-center gap-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors relative z-[60]"
            aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
          >
            <span className={`block h-0.5 w-6 bg-current rounded-full transition-all duration-300 ease-out ${isMenuOpen ? 'translate-y-2 rotate-45' : ''}`}></span>
            <span className={`block h-0.5 w-6 bg-current rounded-full transition-all duration-300 ease-out ${isMenuOpen ? 'opacity-0 scale-50' : 'opacity-100 scale-100'}`}></span>
            <span className={`block h-0.5 w-6 bg-current rounded-full transition-all duration-300 ease-out ${isMenuOpen ? '-translate-y-2 -rotate-45' : ''}`}></span>
          </button>
        </div>

        {/* MENU DROPDOWN EXPANDIDO (Painel Flutuante / Overlay)
            'top-2 right-4' faz o menu sobrepor o cabeçalho, envolvendo o botão X.
        */}
        {isMenuOpen && (
          <div className="absolute top-2 right-4 w-[28rem] bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden origin-top transition-all animate-in fade-in slide-in-from-top-8 duration-300 ease-out z-[55]">
            
            {/* FOCO DA MUDANÇA:
                O Link agora começa no topo da caixa. 
                'pt-16' garante que o texto "Diagnóstico" não bata no botão "X".
            */}
            <Link 
              href="/diagnostico" 
              onClick={() => setIsMenuOpen(false)}
              className="block pt-16 pb-8 px-8 hover:bg-blue-50/50 transition-colors border-b border-gray-100 group"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="p-3 bg-blue-100 text-[#1973d3] rounded-lg group-hover:bg-[#1973d3] group-hover:text-white transition-colors">
                  <BarChart2 size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#1973d3] transition-colors">
                  Diagnóstico
                </h3>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed ml-[3.75rem]">
                Analise o cenário da sua fazenda através do diagrama de Ishikawa, identificando gargalos e visualizando práticas recomendadas pela IA.
              </p>
            </Link>

            {/* Metade Inferior: Grid */}
            <div className="grid grid-cols-2 bg-gray-50/30">
              
              {/* Coluna Esquerda: Simulações */}
              <Link 
                href="/simulacao" 
                onClick={() => setIsMenuOpen(false)}
                className="block p-6 hover:bg-white transition-colors border-r border-gray-100 group"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 text-amber-600 rounded-lg group-hover:bg-amber-500 group-hover:text-white transition-colors">
                      <Lightbulb size={20} />
                    </div>
                    <h3 className="text-base font-bold text-gray-900 group-hover:text-amber-600 transition-colors">
                      Simulações
                    </h3>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Crie novos cenários e projete os resultados futuros com base nas métricas.
                  </p>
                </div>
              </Link>

              {/* Coluna Direita: Dados Fazendas */}
              <Link 
                href="/formulario" 
                onClick={() => setIsMenuOpen(false)}
                className="block p-6 hover:bg-white transition-colors group"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-200 text-slate-600 rounded-lg group-hover:bg-slate-600 group-hover:text-white transition-colors">
                      <Settings size={20} />
                    </div>
                    <h3 className="text-base font-bold text-gray-900 group-hover:text-slate-600 transition-colors">
                      Dados Fazendas
                    </h3>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Ajuste os dados e métricas da fazenda preenchidos no formulário.
                  </p>
                </div>
              </Link>

            </div>
          </div>
        )}
      </div>
    </header>
  );
}