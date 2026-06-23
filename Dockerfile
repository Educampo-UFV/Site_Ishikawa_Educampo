# ==========================================
# Etapa 1: Dependências (deps)
# ==========================================
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copia os gestores de pacotes
COPY package.json package-lock.json* ./
# Instala as dependências de forma limpa
RUN npm install

# ==========================================
# Etapa 2: Construtor (builder)
# ==========================================
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Desativa a telemetria do Next.js durante a construção
ENV NEXT_TELEMETRY_DISABLED 1

# Recebe a variável de ambiente pública via build args para embutir no client-side JavaScript
ARG NEXT_PUBLIC_ENABLE_TEST_FARMS
ENV NEXT_PUBLIC_ENABLE_TEST_FARMS=$NEXT_PUBLIC_ENABLE_TEST_FARMS

# Fornece variáveis de ambiente fictícias estritamente para que o Next.js 
# consiga analisar os arquivos e concluir o processo de build das rotas.
# As credenciais verdadeiras deverão ser passadas em tempo de execução (runner).
ENV ENCRYPTION_SECRET_KEY="build_dummy_secret_key_educampo"
ENV ADMIN_USERNAME="build_dummy_user"
ENV ADMIN_PASSWORD="build_dummy_password"

# Faz o build da aplicação
RUN npm run build

# ==========================================
# Etapa 3: Execução (runner) - Imagem Final
# ==========================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Prática de SecOps: Criação de utilizador não-root (UID 1001)
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copia a pasta public (imagens, ícones)
COPY --from=builder /app/public ./public

# Configura as permissões corretas para a pasta do Next.js
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Aproveita a otimização "standalone" do Next.js para imagens mínimas
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Alterna para o utilizador seguro
USER nextjs

# Expõe a porta que o Next.js vai usar
EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Comando de arranque
CMD ["node", "server.js"]