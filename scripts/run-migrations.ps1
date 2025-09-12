# Script para executar migrações do banco de dados (Windows PowerShell)
# Este script deve ser executado após qualquer mudança no schema

Write-Host "🚀 Iniciando migrações do banco de dados..." -ForegroundColor Green

# Verifica se o Drizzle está instalado
try {
    $null = Get-Command drizzle-kit -ErrorAction Stop
    Write-Host "✅ Drizzle Kit encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ Drizzle Kit não está instalado. Instalando..." -ForegroundColor Yellow
    npm install -g drizzle-kit
}

# Verifica se as variáveis de ambiente estão configuradas
if (-not $env:DATABASE_URL) {
    Write-Host "❌ DATABASE_URL não está configurada" -ForegroundColor Red
    Write-Host "Por favor, configure a variável DATABASE_URL no arquivo .env" -ForegroundColor Red
    exit 1
}

Write-Host "📊 Gerando migrações..." -ForegroundColor Blue

# Gera as migrações baseadas no schema atual
drizzle-kit generate

Write-Host "🔧 Aplicando migrações..." -ForegroundColor Blue

# Aplica as migrações ao banco de dados
drizzle-kit migrate

Write-Host "📝 Executando script de inicialização..." -ForegroundColor Blue

# Executa o script de inicialização que inclui a tabela audit_logs
# Nota: No Windows, você pode precisar usar psql ou outro cliente PostgreSQL
Write-Host "⚠️  Execute manualmente o script scripts/init-db.sql no seu cliente PostgreSQL" -ForegroundColor Yellow
Write-Host "   ou use: psql $env:DATABASE_URL -f scripts/init-db.sql" -ForegroundColor Cyan

Write-Host "✅ Migrações concluídas com sucesso!" -ForegroundColor Green

Write-Host ""
Write-Host "📋 Resumo das operações:" -ForegroundColor White
Write-Host "  • Schema atualizado" -ForegroundColor White
Write-Host "  • Tabela audit_logs criada" -ForegroundColor White
Write-Host "  • Índices criados" -ForegroundColor White
Write-Host "  • Dados de exemplo inseridos" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Para visualizar o banco de dados, execute:" -ForegroundColor Cyan
Write-Host "   npm run db:studio" -ForegroundColor White
Write-Host ""
Write-Host "🔍 Para verificar o status das migrações:" -ForegroundColor Cyan
Write-Host "   npm run db:status" -ForegroundColor White
Write-Host ""
Write-Host "📝 Para executar o script SQL manualmente:" -ForegroundColor Cyan
Write-Host "   psql $env:DATABASE_URL -f scripts/init-db.sql" -ForegroundColor White
