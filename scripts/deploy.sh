#!/bin/bash

# Script de Deploy para Vercel
# Uso: ./scripts/deploy.sh [environment]

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    error "Este script deve ser executado na raiz do projeto"
    exit 1
fi

# Verificar se Vercel CLI está instalado
if ! command -v vercel &> /dev/null; then
    error "Vercel CLI não está instalado. Instale com: npm i -g vercel"
    exit 1
fi

# Verificar se estamos logados no Vercel
if ! vercel whoami &> /dev/null; then
    error "Você não está logado no Vercel. Execute: vercel login"
    exit 1
fi

# Ambiente padrão
ENVIRONMENT=${1:-production}

log "🚀 Iniciando deploy para ambiente: $ENVIRONMENT"

# 1. Verificar se há mudanças não commitadas
if [ -n "$(git status --porcelain)" ]; then
    warning "Há mudanças não commitadas no repositório"
    git status --short
    
    read -p "Deseja continuar mesmo assim? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Deploy cancelado"
        exit 1
    fi
fi

# 2. Verificar se estamos na branch main
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    warning "Você está na branch '$CURRENT_BRANCH', não na 'main'"
    read -p "Deseja continuar mesmo assim? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Deploy cancelado"
        exit 1
    fi
fi

# 3. Executar testes
log "🧪 Executando testes..."
if ! npm run test:e2e; then
    error "Testes E2E falharam. Deploy cancelado."
    exit 1
fi
success "Testes E2E passaram"

# 4. Build da aplicação
log "🔨 Fazendo build da aplicação..."
if ! npm run build; then
    error "Build falhou. Deploy cancelado."
    exit 1
fi
success "Build concluído com sucesso"

# 5. Deploy para Vercel
log "🚀 Fazendo deploy para Vercel..."
if [ "$ENVIRONMENT" = "production" ]; then
    if ! vercel --prod; then
        error "Deploy falhou"
        exit 1
    fi
else
    if ! vercel; then
        error "Deploy falhou"
        exit 1
    fi
fi

success "Deploy concluído com sucesso!"

# 6. Health check
log "🏥 Fazendo health check..."
DEPLOY_URL=$(vercel ls | grep "$(vercel project ls | grep noxora | awk '{print $1}')" | awk '{print $2}')

if [ -n "$DEPLOY_URL" ]; then
    log "URL do deploy: $DEPLOY_URL"
    
    # Aguardar um pouco para o deploy ficar estável
    log "⏳ Aguardando estabilização do deploy..."
    sleep 30
    
    # Health check
    if curl -f "$DEPLOY_URL/api/health" > /dev/null 2>&1; then
        success "Health check passou"
    else
        warning "Health check falhou - verifique manualmente"
    fi
else
    warning "Não foi possível obter a URL do deploy"
fi

# 7. Resumo final
log "📊 Resumo do deploy:"
success "✅ Deploy concluído para ambiente: $ENVIRONMENT"
success "✅ Testes E2E passaram"
success "✅ Build bem-sucedido"
success "✅ Aplicação deployada no Vercel"

if [ -n "$DEPLOY_URL" ]; then
    log "🌐 URL: $DEPLOY_URL"
fi

log "🎉 Deploy finalizado com sucesso!"
