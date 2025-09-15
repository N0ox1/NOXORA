$ErrorActionPreference='Stop'
function J($o){try{$o|ConvertTo-Json -Depth 8 -Compress}catch{[string]$o}}
$base='http://localhost:3000'
$H=@{'X-Tenant-Id'='TENANT_TEST';'Content-Type'='application/json'}
$slug='barbearia-teste'

Write-Host '=== DEFININDO SLUG VIA ROTA ADMIN ===' -ForegroundColor Cyan
$resp = Invoke-WebRequest -Uri "$base/api/admin/barbershops/slug" -Method POST -Headers $H -Body (@{ slug=$slug } | ConvertTo-Json)
Write-Host $resp.StatusCode -ForegroundColor Green
try { $shop=$resp.Content|ConvertFrom-Json } catch { $shop=$resp.Content }
Write-Host (J $shop) -ForegroundColor Green

Write-Host '=== TESTANDO ROTA PÚBLICA /api/public/barbershop/[slug] ===' -ForegroundColor Cyan
$pub = Invoke-WebRequest -Uri "$base/api/public/barbershop/$slug" -Method GET -Headers $H
Write-Host $pub.StatusCode -ForegroundColor Green
try { $data=$pub.Content|ConvertFrom-Json } catch { $data=$pub.Content }
Write-Host (J $data) -ForegroundColor Green










