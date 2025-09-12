# Dockerfile para aplicação Next.js
FROM node:20-alpine AS base

# Instalar dependências apenas quando necessário
FROM base AS deps
# Verificar https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine para entender por que libc6-compat pode ser necessário.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Instalar dependências baseadas no arquivo de lock preferido
# Ver https://yarnpkg.com/advanced/lockfile#toc-when-to-use
COPY package.json package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f package-lock.json ]; then npm ci --only=production; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  elif [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Reconstruir o código fonte apenas quando necessário
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Próxima etapa recolhe informações sobre o processo de build
# https://nextjs.org/docs/advanced-features/output-file-tracing
RUN \
  if [ -f package-lock.json ]; then npm run build; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
  elif [ -f yarn.lock ]; then yarn build; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Imagem de produção, copia todos os arquivos e executa next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
# Descomente a linha seguinte se você não estiver usando um usuário customizado
# RUN addgroup --system --gid 1001 nodejs
# RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Definir a variável correta para o arquivo de trace
# https://nextjs.org/docs/advanced-features/output-file-tracing
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
# set hostname to localhost
ENV HOSTNAME "0.0.0.0"

# server.js é criado pelo next build usando a configuração standalone
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["node", "server.js"]
