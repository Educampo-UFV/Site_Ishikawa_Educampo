/**
 * @file src/components/ui/Navbar.tsx
 * @description Lógica do Menu de Navegação Global (App Router Header).
 */

"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BarChart2, Lightbulb, Settings, LogOut } from 'lucide-react';
import { useFazendaStore } from '../../store/useFazendaStore';

/**
 * @description Inicia refs do DOM (menuRef, buttonRef) para verificar coordenadas no handler global `handleClickOutside`.
 * Executa mutações de classe usando `isMenuOpen` injetando escalas em spans para simular animação CSS (Hamburger -> X) 
 * evitando bibliotecas de animação de terceiros para perfomance máxima.
 * @returns {React.JSX.Element} Cabeçalho injetado com interatividade isolada de cliente ('use client').
 */
export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const limparDados = useFazendaStore((state) => state.limparDados);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Erro ao realizar o logout', e);
    }
    limparDados();
    window.location.href = '/login';
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      // Fecha o menu se o clique for fora do menu dropdown e também fora do botão hamburger
      if (
        isMenuOpen &&
        menuRef.current && !menuRef.current.contains(target) &&
        buttonRef.current && !buttonRef.current.contains(target)
      ) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  return (
    <header className="relative z-50 bg-transparent w-full">
      <div className="max-w-7xl mx-auto px-6 relative">
        
        {/* Barra Superior */}
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center">
            <Image
              src="/banner_educampo.png"
              alt="Logo Educampo"
              width={150}
              height={40}
              className="object-contain"
              priority
              style={{ width: '150px', height: 'auto' }}
            />
          </div>
          
          {/* LADO DIREITO (MODO DESKTOP): Links Pill com Ícones */}
          <div className="hidden md:flex items-center gap-1 lg:gap-4 font-bold text-sm lg:text-base text-gray-600">
            <Link href="/diagnostico" className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-blue-50 hover:text-[#1973d3] transition-colors">
              <BarChart2 size={18} />
              Diagnóstico
            </Link>
            <Link href="/simulacao" prefetch={false} className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-amber-50 hover:text-amber-600 transition-colors">
              <Lightbulb size={18} />
              Simulador de Cenários
            </Link>
            <Link href="/ajustes" className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-slate-100 hover:text-slate-700 transition-colors">
              <Settings size={18} />
              Atualizar Dados
            </Link>
            <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-red-50 hover:text-red-600 transition-colors">
              <LogOut size={18} />
              Sair
            </button>
          </div>

          {/* Botão Hamburger (MODO MOBILE) */}
          <button
            ref={buttonRef}
            onClick={toggleMenu}
            className="md:hidden w-11 h-11 flex flex-col items-center justify-center gap-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors relative z-[60]"
            aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
          >
            <span className={`block h-0.5 w-6 bg-current rounded-full transition-all duration-300 ease-out ${isMenuOpen ? 'translate-y-2 rotate-45' : ''}`}></span>
            <span className={`block h-0.5 w-6 bg-current rounded-full transition-all duration-300 ease-out ${isMenuOpen ? 'opacity-0 scale-50' : 'opacity-100 scale-100'}`}></span>
            <span className={`block h-0.5 w-6 bg-current rounded-full transition-all duration-300 ease-out ${isMenuOpen ? '-translate-y-2 -rotate-45' : ''}`}></span>
          </button>
        </div>

        {/* Menu Dropdown Expandido (MODO MOBILE APENAS) */}
        <div
          ref={menuRef}
          className={`md:hidden absolute top-2 right-4 w-[28rem] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden origin-top transition-all duration-500 ease-out z-[55] ${
            isMenuOpen 
              ? 'opacity-100 translate-y-0 visible' 
              : 'opacity-0 -translate-y-12 invisible pointer-events-none'
          }`}
        >
            
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
                    Simulador de Cenários
                    </h3>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Crie novos cenários e projete os resultados futuros com base nas métricas.
                  </p>
                </div>
              </Link>

              {/* Coluna Direita: Dados Fazendas */}
              <Link 
                href="/ajustes" 
                onClick={() => setIsMenuOpen(false)}
                className="block p-6 hover:bg-white transition-colors border-b border-gray-100 group"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-200 text-slate-600 rounded-lg group-hover:bg-slate-600 group-hover:text-white transition-colors">
                      <Settings size={20} />
                    </div>
                    <h3 className="text-base font-bold text-gray-900 group-hover:text-slate-600 transition-colors">
                    Atualizar Dados
                    </h3>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Ajuste os dados e métricas da fazenda preenchidos no formulário.
                  </p>
                </div>
              </Link>

              {/* Linha Inteira: Sair */}
              <button 
                onClick={() => {
                  setIsMenuOpen(false);
                  handleLogout();
                }}
                className="col-span-2 block p-6 hover:bg-red-50 transition-colors text-left group"
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 text-red-600 rounded-lg group-hover:bg-red-600 group-hover:text-white transition-colors">
                      <LogOut size={20} />
                    </div>
                    <h3 className="text-base font-bold text-gray-900 group-hover:text-red-600 transition-colors">
                      Sair
                    </h3>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Encerrar a sessão e voltar para a tela de login.
                  </p>
                </div>
              </button>

            </div>
          </div>
      </div>
    </header>
  );
}