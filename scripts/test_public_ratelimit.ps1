$ErrorActionPreference='Stop'
$base='http://localhost:3000'
$H=@{'X-Tenant-Id'='TENANT_TEST'}
$slug='barbearia-teste'

Write-Host '=== RATE LIMIT: barbershop slug ===' -ForegroundColor Cyan
$ok=0;$blocked=0
1..75 | ForEach-Object {
  try{ 
    $r=Invoke-WebRequest -Uri "$base/api/public/barbershop/$slug" -Method GET -Headers $H -TimeoutSec 5
    $ok++ 
  } catch { 
    $blocked++ 
  }
}
Write-Host ("OK="+$ok+" BLOCKED>="+$blocked) -ForegroundColor Yellow
if($blocked -lt 10){ throw 'Rate limit não acionou' }




















