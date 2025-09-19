$ErrorActionPreference='Stop'
function J($o){try{$o|ConvertTo-Json -Depth 8 -Compress}catch{[string]$o}}
$base='http://localhost:3000'
$H=@{'X-Tenant-Id'='TENANT_TEST';'Content-Type'='application/json'}
$slug='barbearia-teste'

Write-Host '=== RESOLVENDO IDS (barbershop/services/employees) ===' -ForegroundColor Cyan
$pub = Invoke-RestMethod -Uri "$base/api/public/barbershop/$slug" -Method GET -Headers $H
$shopId=$pub.data.barbershop.id; $svcId=$pub.data.services[0].id; $empId=$pub.data.employees[0].id
$today=(Get-Date).ToString('yyyy-MM-dd')

$avail = Invoke-RestMethod -Uri "$base/api/public/availability?barbershopId=$shopId&serviceId=$svcId&date=$today&employeeId=$empId" -Method GET -Headers $H
$slot=$avail.data.slots[0]
Write-Host ("SLOT: " + $slot) -ForegroundColor Yellow

Write-Host '=== POST /api/public/appointments ===' -ForegroundColor Cyan
$body=@{ barbershopId=$shopId; serviceId=$svcId; employeeId=$empId; startAt=$slot; customer=@{ name='Cliente Público'; phone='+5511999999999' } }
$r = Invoke-WebRequest -Uri "$base/api/public/appointments" -Method POST -Headers $H -Body ($body|ConvertTo-Json)
Write-Host $r.StatusCode -ForegroundColor Green
try { $d=$r.Content|ConvertFrom-Json } catch { $d=$r.Content }
Write-Host (J $d) -ForegroundColor Green



















