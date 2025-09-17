$ErrorActionPreference='Stop'
function J($o){try{$o|ConvertTo-Json -Depth 8 -Compress}catch{[string]$o}}
$base='http://localhost:3000'
$H=@{'X-Tenant-Id'='TENANT_TEST';'Content-Type'='application/json'}

Write-Host '=== ATUALIZANDO SLUG DO BARBERSHOP ===' -ForegroundColor Cyan

# Primeiro, vou tentar criar uma rota temporária para atualizar o slug
# Ou usar o banco diretamente via Prisma Studio

Write-Host '--- OPÇÃO 1: Tentar criar barbershop com slug ---' -ForegroundColor Yellow
$barbershopData = @{
  slug = 'barbearia-teste'
  name = 'Barbearia Teste'
  description = 'Barbearia para testes'
  isActive = $true
}

try {
  $r = Invoke-RestMethod -Uri "$base/api/barbershops" -Method POST -Headers $H -Body ($barbershopData | ConvertTo-Json)
  Write-Host "BARBERSHOP CRIADO: " -ForegroundColor Green
  Write-Host (J $r) -ForegroundColor Green
} catch {
  Write-Host "ERRO ao criar barbershop: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host '--- OPÇÃO 2: Testar rota pública com slug ---' -ForegroundColor Yellow
try {
  $r = Invoke-WebRequest -Uri "$base/api/public/barbershop/barbearia-teste" -Method GET -Headers $H -ErrorAction Stop
  Write-Host "ROTA PÚBLICA FUNCIONA! Status: $($r.StatusCode)" -ForegroundColor Green
  try { 
    $data = $r.Content | ConvertFrom-Json 
    Write-Host "RESPOSTA:" -ForegroundColor Green
    Write-Host (J $data) -ForegroundColor Green
  } catch { 
    Write-Host "Conteúdo: $($r.Content)" -ForegroundColor Green 
  }
} catch {
  $status = $null
  try { $status = $_.Exception.Response.StatusCode.Value__ } catch {}
  Write-Host "ROTA PÚBLICA FALHOU: $status - $($_.Exception.Message)" -ForegroundColor Red
}













