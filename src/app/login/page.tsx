/**
 * @file src/app/login/page.tsx
 * @description Interface visual e lógica de autenticação do produtor.
 * * COMO ESTE CÓDIGO FUNCIONA:
 * 1. Abstração Visual: Utiliza o 'SplitScreenLayout' para gerenciar a responsividade, 
 * mantendo o código desta página focado apenas no processo de login.
 * 2. Segurança Zero-Token-Exposure: Não armazena nem lê tokens no cliente (localStorage). 
 * A autenticação é processada via BFF, que injeta cookies HttpOnly no navegador.
 * 3. Fluxo de Autenticação: Captura inputs via useState, valida campos básicos e realiza 
 * uma requisição POST para '/api/auth'. Em caso de sucesso, o roteador do Next.js 
 * redireciona o usuário.
 * 4. Atalho de Teste: Implementa a função 'fillTestCredentials' para agilizar a validação 
 * funcional em ambiente de desenvolvimento.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SplitScreenLayout } from '@/components/ui/SplitScreenLayout';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        // Disparamos a requisição em formato "fire-and-forget" (sem await).
        // Isso acorda o Render em background enquanto o usuário preenche o formulário.
        fetch('/api/ping').catch((err) => console.warn('Aviso: Falha ao despertar a API em background', err));
        router.push('/formulario');
      } else {
        const data = await response.json();
        setError(data.error || 'Falha na autenticação.');
      }
    } catch (err) {
      setError('Erro de rede. Verifique sua conexão e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillTestCredentials = () => {
    setUsername('educampo');
    setPassword('leite123');
    setError('');
  };

  return (
    <SplitScreenLayout 
      title="Bem-vindo de volta" 
      subtitle="Insira suas credenciais para acessar o diagnóstico."
    >
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Usuário <span className="text-blue-600">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: educampo"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors outline-none text-gray-800"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Senha <span className="text-blue-600">*</span>
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-colors outline-none text-gray-800"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-lg text-center font-medium animate-in fade-in duration-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 mt-2 rounded-lg font-medium text-white bg-primary hover:bg-primary-light focus:outline-none focus:ring-4 focus:ring-primary/30 transition-all shadow-sm ${
              isLoading ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Autenticando...' : 'Entrar'}
          </button>
        </form>
      </div>

      <div className="mt-8 text-center space-y-4">
        <button 
          type="button"
          onClick={fillTestCredentials}
          className="text-sm font-medium text-primary hover:text-primary-light transition-colors bg-transparent border-none cursor-pointer focus:outline-none focus:underline"
        >
          Preencher com credenciais de teste
        </button>
        <p className="text-xs text-gray-400">Ambiente restrito a consultores autorizados.</p>
      </div>
    </SplitScreenLayout>
  );
}