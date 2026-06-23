#!/bin/bash

# ==============================================================================
# Script de Teste de Infraestrutura: Docker Build Env Var Injection
# ==============================================================================
# Verifica se a variável NEXT_PUBLIC_ENABLE_TEST_FARMS é injetada corretamente
# durante o processo de compilação da imagem Docker.

set -e

echo "🟢 Iniciando teste de infraestrutura (Build Context)..."

# Compilar a imagem garantindo que enviamos a variável de build
echo "📦 Construindo imagem de teste..."
docker-compose build --no-cache --build-arg NEXT_PUBLIC_ENABLE_TEST_FARMS=true frontend

# Inicializar o container em background para teste
echo "🚀 Subindo container para teste..."
docker-compose up -d frontend

# Aguardar a aplicação iniciar
sleep 5

# Fazer uma requisição na rota principal e procurar pelo marcador da funcionalidade
echo "🔍 Verificando se a página contém a funcionalidade (Teste E2E básico)..."
RESPONSE=$(curl -s http://localhost:3000/formulario)

# Parar e limpar o ambiente de teste
echo "🧹 Limpando ambiente..."
docker-compose down

if echo "$RESPONSE" | grep -q "Fazendas de Teste"; then
  echo "✅ SUCESSO: A variável de ambiente foi injetada corretamente no build estático do Next.js."
  exit 0
else
  echo "❌ FALHA: A variável de ambiente não foi injetada. A feature não apareceu no build de produção."
  exit 1
fi
