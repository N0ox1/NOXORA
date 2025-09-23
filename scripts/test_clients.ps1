$ErrorActionPreference = 'Stop'

Write-Host '=== TEST CLIENTS PUT/DELETE ===' -ForegroundColor Cyan
$base = 'http://localhost:3000'
$tenant = @{ 'X-Tenant-Id' = 'TENANT_TEST'; 'Content-Type' = 'application/json' }

$createBody = @{ name = 'Cliente PUTDEL'; phone = '+5511999999999' } | ConvertTo-Json
$created = Invoke-RestMethod -Uri "$base/api/clients" -Method POST -Headers $tenant -Body $createBody
Write-Host ("CREATED: {0} {1}" -f $created.id, $created.name) -ForegroundColor Green

$putBody = @{ id = $created.id; name = 'Cliente Atualizado'; email = 'cli@ex.com' } | ConvertTo-Json
$updated = Invoke-RestMethod -Uri "$base/api/clients" -Method PUT -Headers $tenant -Body $putBody
Write-Host ("UPDATED: {0} {1} {2}" -f $updated.id, $updated.name, $updated.email) -ForegroundColor Green

$delBody = @{ id = $created.id } | ConvertTo-Json
$resp = Invoke-WebRequest -Uri "$base/api/clients" -Method DELETE -Headers $tenant -Body $delBody
Write-Host ("DELETED STATUS: {0}" -f $resp.StatusCode) -ForegroundColor Green

try {
  $resp2 = Invoke-WebRequest -Uri "$base/api/clients" -Method DELETE -Headers $tenant -Body $delBody
} catch {
  Write-Host ("DELETE AGAIN -> EXPECT 404: {0}" -f $_.Exception.Response.StatusCode) -ForegroundColor Yellow
}























