/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ativa a compilação standalone para o Docker
  output: 'standalone',

  // Configuração de Proxy para evitar problemas de CORS e portas fechadas no Render
  async rewrites() {
    return {
      fallback: [
        {
          source: '/api/:path*',
          // O proxy redireciona a requisição do navegador para o FastAPI rodando internamente no container
          // Usamos fallback para garantir que as rotas dinâmicas do BFF (ex: [task_id]) sejam executadas primeiro.
          // Mantemos o /api no destino pois o FastAPI (uvicorn) tem os routers configurados com prefix="/api"
          destination: 'http://127.0.0.1:8000/api/:path*',
        },
      ],
    }
  },
};

export default nextConfig;