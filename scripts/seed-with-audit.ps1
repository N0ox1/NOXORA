# Script PowerShell para executar seed com auditoria (Windows)
# Este script executa o seed de dados e verifica se a auditoria está funcionando

Write-Host "🚀 Iniciando seed com auditoria..." -ForegroundColor Green

# Verifica se as variáveis de ambiente estão configuradas
if (-not $env:DATABASE_URL) {
    Write-Host "❌ DATABASE_URL não está configurada" -ForegroundColor Red
    Write-Host "Por favor, configure a variável DATABASE_URL no arquivo .env" -ForegroundColor Red
    exit 1
}

Write-Host "📊 Executando seed com auditoria via Node.js..." -ForegroundColor Blue

# Executa o script Node.js de seed
try {
    npm run seed:audit
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Seed com auditoria executado com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "❌ Erro ao executar seed com auditoria" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Erro ao executar npm run seed:audit: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📋 Resumo das operações:" -ForegroundColor White
Write-Host "  • Dados de exemplo inseridos" -ForegroundColor White
Write-Host "  • Logs de auditoria criados" -ForegroundColor White
Write-Host "  • Sistema de auditoria testado" -ForegroundColor White
Write-Host ""

Write-Host "🌐 Para visualizar os dados e auditoria:" -ForegroundColor Cyan
Write-Host "   • Dashboard de auditoria: http://localhost:3000/audit" -ForegroundColor White
Write-Host "   • Drizzle Studio: npm run db:studio" -ForegroundColor White
Write-Host ""

Write-Host "🔍 Para verificar os logs de auditoria:" -ForegroundColor Cyan
Write-Host "   • API de logs: GET /api/audit/logs?tenant_id=tnt_1" -ForegroundColor White
Write-Host "   • API de estatísticas: GET /api/audit/stats?tenant_id=tnt_1" -ForegroundColor White
Write-Host ""

Write-Host "🎉 Seed com auditoria concluído! Verifique os resultados acima." -ForegroundColor Green
