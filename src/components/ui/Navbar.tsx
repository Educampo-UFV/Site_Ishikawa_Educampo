/**
 * @file Navbar.tsx
 * @description Componente de cabeçalho e navegação global. 
 * Exibe o logotipo do Educampo à esquerda e um botão de menu (hamburger/X) à direita.
 * Ao ser clicado, revela um painel de navegação expandido com descrições das rotas.
 */

"use client";

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BarChart2, Lightbulb, Settings, Menu, X } from 'lucide-react';

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <header className="relative z-50 bg-white border-b border-gray-100 shadow-sm">
      {/* Barra superior fixa */}
      <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto relative z-50">
        <div className="flex items-center">
          {/* Logo Educampo */}
          <Link href="/">
            <Image
              src="/logo_educampo.png"
              alt="Logo Educampo"
              width={150}
              height={40}
              className="object-contain cursor-pointer"
              priority
            />
          </Link>
        </div>
        
        {/* Botão Hamburger / X */}
        <button
          onClick={toggleMenu}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
        >
          {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Menu Dropdown Expandido (Painel Compacto) */}
      {isMenuOpen && (
        <div className="absolute top-20 right-6 w-[28rem] bg-white rounded-xl shadow-[0_10px_40px_rgb(0,0,0,0.15)] border border-gray-100 overflow-hidden origin-top-right transition-all animate-in fade-in zoom-in-95 duration-200">
          
          {/* Metade Superior: Diagnóstico (Ocupa 100% da largura) */}
          <Link 
            href="/diagnostico" 
            onClick={() => setIsMenuOpen(false)}
            className="block p-6 hover:bg-blue-50/50 transition-colors border-b border-gray-100 group"
          >
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-blue-100 text-[#1973d3] rounded-lg group-hover:bg-[#1973d3] group-hover:text-white transition-colors">
                <BarChart2 size={24} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#1973d3] transition-colors">
                Diagnóstico
              </h3>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed ml-[3.25rem]">
              Analise o cenário da sua fazenda através do diagrama de Ishikawa, identificando gargalos e visualizando práticas recomendadas pela IA.
            </p>
          </Link>

          {/* Metade Inferior: Grid dividido em 2 colunas de 50% */}
          <div className="grid grid-cols-2 bg-gray-50/50">
            
            {/* Coluna Esquerda: Simulações */}
            <Link 
              href="/simulacao" 
              onClick={() => setIsMenuOpen(false)}
              className="block p-6 hover:bg-amber-50/80 transition-colors border-r border-gray-100 group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-amber-100 text-amber-600 rounded-lg group-hover:bg-amber-500 group-hover:text-white transition-colors">
                  <Lightbulb size={20} />
                </div>
                <h3 className="text-base font-bold text-gray-900 group-hover:text-amber-600 transition-colors">
                  Simulações
                </h3>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Crie novos cenários e projete os resultados futuros com base nas métricas atuais.
              </p>
            </Link>

            {/* Coluna Direita: Dados Fazendas */}
            <Link 
              href="/formulario" 
              onClick={() => setIsMenuOpen(false)}
              className="block p-6 hover:bg-slate-100 transition-colors group"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-slate-200 text-slate-600 rounded-lg group-hover:bg-slate-600 group-hover:text-white transition-colors">
                  <Settings size={20} />
                </div>
                <h3 className="text-base font-bold text-gray-900 group-hover:text-slate-600 transition-colors">
                  Dados Fazendas
                </h3>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Revise e ajuste as métricas e informações da fazenda preenchidas no formulário de coleta.
              </p>
            </Link>

          </div>
        </div>
      )}
    </header>
  );
}