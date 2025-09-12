#!/bin/bash

# Script para executar migrações do banco de dados
# Este script deve ser executado após qualquer mudança no schema

set -e

echo "🚀 Iniciando migrações do banco de dados..."

# Verifica se o Drizzle está instalado
if ! command -v drizzle-kit &> /dev/null; then
    echo "❌ Drizzle Kit não está instalado. Instalando..."
    npm install -g drizzle-kit
fi

# Verifica se as variáveis de ambiente estão configuradas
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL não está configurada"
    echo "Por favor, configure a variável DATABASE_URL no arquivo .env"
    exit 1
fi

echo "📊 Gerando migrações..."

# Gera as migrações baseadas no schema atual
drizzle-kit generate

echo "🔧 Aplicando migrações..."

# Aplica as migrações ao banco de dados
drizzle-kit migrate

echo "📝 Executando script de inicialização..."

# Executa o script de inicialização que inclui a tabela audit_logs
psql "$DATABASE_URL" -f scripts/init-db.sql

echo "✅ Migrações concluídas com sucesso!"

echo ""
echo "📋 Resumo das operações:"
echo "  • Schema atualizado"
echo "  • Tabela audit_logs criada"
echo "  • Índices criados"
echo "  • Dados de exemplo inseridos"
echo ""
echo "🌐 Para visualizar o banco de dados, execute:"
echo "   npm run db:studio"
echo ""
echo "🔍 Para verificar o status das migrações:"
echo "   npm run db:status"
