/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ativa a compilação standalone para o Docker
  output: 'standalone',
  
  // Outras configurações (como headers de segurança que planeámos)
};

export default nextConfig;