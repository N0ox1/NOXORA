$ErrorActionPreference = 'Stop'

Write-Host '=== TESTE BACKEND COMPLETO ===' -ForegroundColor Cyan
$base = 'http://localhost:3000'
$tenant = @{ 'X-Tenant-Id' = 'TENANT_TEST'; 'Content-Type' = 'application/json' }

# 1. Health
Write-Host '--- Health ---' -ForegroundColor Yellow
$health = Invoke-RestMethod -Uri "$base/api/health" -Method GET
Write-Host ("HEALTH: {0}" -f ($health | ConvertTo-Json -Compress)) -ForegroundColor Green

# 2. Clients CRUD
Write-Host '--- Clients ---' -ForegroundColor Yellow
$cliBody = @{ name = 'Cliente E2E'; phone = '+5511999999999' } | ConvertTo-Json
$cli = Invoke-RestMethod -Uri "$base/api/clients" -Method POST -Headers $tenant -Body $cliBody
Write-Host ("CREATED CLIENT: {0} {1}" -f $cli.id, $cli.name) -ForegroundColor Green

$cliUpd = @{ id = $cli.id; name = 'Cliente Atualizado'; email = 'cli@teste.com' } | ConvertTo-Json
$cli2 = Invoke-RestMethod -Uri "$base/api/clients" -Method PUT -Headers $tenant -Body $cliUpd
Write-Host ("UPDATED CLIENT: {0} {1}" -f $cli2.id, $cli2.name) -ForegroundColor Green

$delBody = @{ id = $cli.id } | ConvertTo-Json
$delResp = Invoke-WebRequest -Uri "$base/api/clients" -Method DELETE -Headers $tenant -Body $delBody
Write-Host ("DELETED CLIENT STATUS: {0}" -f $delResp.StatusCode) -ForegroundColor Green

# 3. Services (se existir)
Write-Host '--- Services ---' -ForegroundColor Yellow
try {
  $svcBody = @{ name = 'Corte Simples'; durationMin = 30; priceCents = 5000 } | ConvertTo-Json
  $svc = Invoke-RestMethod -Uri "$base/api/services" -Method POST -Headers $tenant -Body $svcBody
  Write-Host ("CREATED SERVICE: {0} {1}" -f $svc.id, $svc.name) -ForegroundColor Green
  
  $services = Invoke-RestMethod -Uri "$base/api/services" -Method GET -Headers $tenant
  Write-Host ("SERVICES COUNT: {0}" -f $services.Length) -ForegroundColor Green
} catch {
  Write-Host "Services endpoint não disponível ou falhou: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 4. Appointments (se existir)
Write-Host '--- Appointments ---' -ForegroundColor Yellow
try {
  $apptBody = @{ serviceId = 'dummy-svc'; clientId = 'dummy-client'; employeeId = 'dummy-emp'; startAt = (Get-Date).AddHours(1).ToString('o') } | ConvertTo-Json
  $appt = Invoke-RestMethod -Uri "$base/api/appointments" -Method POST -Headers $tenant -Body $apptBody
  Write-Host ("CREATED APPOINTMENT: {0}" -f $appt.id) -ForegroundColor Green
} catch {
  Write-Host "Appointments endpoint não disponível ou falhou: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 5. Appointments List (se existir)
Write-Host '--- Appointments List ---' -ForegroundColor Yellow
try {
  $start = (Get-Date).ToString('o')
  $end = (Get-Date).AddDays(7).ToString('o')
  $appts = Invoke-RestMethod -Uri "$base/api/appointments/list?start=$start&end=$end" -Method GET -Headers $tenant
  Write-Host ("APPOINTMENTS COUNT: {0}" -f $appts.items.Length) -ForegroundColor Green
} catch {
  Write-Host "Appointments list endpoint não disponível ou falhou: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host '=== TESTE BACKEND FINALIZADO ===' -ForegroundColor Cyan
