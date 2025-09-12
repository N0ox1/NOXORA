#!/bin/bash

# Script de setup para desenvolvimento local do Noxora
# Este script configura o ambiente de desenvolvimento

set -e

echo "🚀 Configurando ambiente de desenvolvimento do Noxora..."

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Por favor, inicie o Docker e tente novamente."
    exit 1
fi

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não está instalado. Por favor, instale o Node.js 20.x e tente novamente."
    exit 1
fi

# Verificar versão do Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js 20.x é necessário. Versão atual: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detectado"

# Parar containers existentes
echo "🛑 Parando containers existentes..."
docker-compose down -v 2>/dev/null || true

# Iniciar serviços
echo "🐳 Iniciando PostgreSQL e Redis..."
docker-compose up -d

# Aguardar serviços ficarem prontos
echo "⏳ Aguardando serviços ficarem prontos..."
sleep 10

# Verificar se PostgreSQL está rodando
echo "🔍 Verificando PostgreSQL..."
until docker exec noxora_postgres pg_isready -U user -d noxora_mock; do
    echo "⏳ Aguardando PostgreSQL..."
    sleep 2
done

# Verificar se Redis está rodando
echo "🔍 Verificando Redis..."
until docker exec noxora_redis redis-cli ping; do
    echo "⏳ Aguardando Redis..."
    sleep 2
done

echo "✅ Serviços iniciados com sucesso!"

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Aplicar RLS SQL
echo "🗄️  Aplicando Row Level Security..."
docker exec -i noxora_postgres psql -U user -d noxora_mock < scripts/rls.sql

# Executar migrações
echo "🔄 Executando migrações..."
npm run db:migrate

# Criar arquivo .env.local se não existir
if [ ! -f .env.local ]; then
    echo "📝 Criando .env.local..."
    cat > .env.local << EOF
# Configurações de desenvolvimento local
DATABASE_URL="postgres://user:pass@localhost:5432/noxora_mock"
REDIS_URL="redis://localhost:6379"

# Stripe (mock para desenvolvimento)
STRIPE_SECRET_KEY="sk_test_mock"
STRIPE_PUBLISHABLE_KEY="pk_test_mock"
STRIPE_WEBHOOK_SECRET="whsec_mock_123"

# JWT
JWT_SECRET="dev-jwt-secret-key-123"

# App
NEXTAUTH_SECRET="dev-nextauth-secret-123"
NEXTAUTH_URL="http://localhost:3000"

# Tenant padrão
DEFAULT_TENANT_ID="barbearia-alfa"

# Observabilidade (desabilitada em desenvolvimento)
OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4318/v1/traces"
EOF
    echo "✅ .env.local criado"
else
    echo "ℹ️  .env.local já existe"
fi

# Verificar se tudo está funcionando
echo "🧪 Testando configuração..."
if curl -s http://localhost:5432 > /dev/null; then
    echo "✅ PostgreSQL acessível na porta 5432"
else
    echo "❌ PostgreSQL não está acessível na porta 5432"
fi

if curl -s http://localhost:6379 > /dev/null 2>/dev/null; then
    echo "✅ Redis acessível na porta 6379"
else
    echo "ℹ️  Redis não está acessível via HTTP (normal)"
fi

echo ""
echo "🎉 Ambiente de desenvolvimento configurado com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "1. Inicie o servidor: npm run dev"
echo "2. Acesse: http://localhost:3000"
echo "3. Redis Commander: http://localhost:8081"
echo ""
echo "🔧 Comandos úteis:"
echo "  - Parar serviços: docker-compose down"
echo "  - Ver logs: docker-compose logs -f"
echo "  - Resetar banco: docker-compose down -v && docker-compose up -d"
echo ""
echo "📚 Documentação: README.md"
echo ""


