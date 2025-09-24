$ErrorActionPreference='Stop'
function J($o){try{$o|ConvertTo-Json -Depth 8 -Compress}catch{[string]$o}}
$base='http://localhost:3000'
$H=@{'X-Tenant-Id'='TENANT_TEST';'Content-Type'='application/json'}
$slug='barbearia-teste'

Write-Host '=== GET /api/public/barbershop/[slug] (para resolver ids) ===' -ForegroundColor Cyan
$pub = Invoke-RestMethod -Uri "$base/api/public/barbershop/$slug" -Method GET -Headers $H
$shopId=$pub.data.barbershop.id; $svcId=$pub.data.services[0].id; $empId=$pub.data.employees[0].id
$today=(Get-Date).ToString('yyyy-MM-dd')

Write-Host '=== GET /api/public/availability ===' -ForegroundColor Cyan
$u = "$base/api/public/availability?barbershopId=$shopId&serviceId=$svcId&date=$today&employeeId=$empId"
$r = Invoke-RestMethod -Uri $u -Method GET -Headers $H
Write-Host (J $r) -ForegroundColor Green

























