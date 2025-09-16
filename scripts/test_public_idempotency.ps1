$ErrorActionPreference='Stop'
function J($o){try{$o|ConvertTo-Json -Depth 8 -Compress}catch{[string]$o}}
$base='http://localhost:3000'
$H=@{'X-Tenant-Id'='TENANT_TEST';'Content-Type'='application/json'}
$slug='barbearia-teste'

# resolver ids e slot
$pub = Invoke-RestMethod -Uri "$base/api/public/barbershop/$slug" -Method GET -Headers $H
$shopId=$pub.data.barbershop.id; $svcId=$pub.data.services[0].id; $empId=$pub.data.employees[0].id
$today=(Get-Date).ToString('yyyy-MM-dd')
$avail = Invoke-RestMethod -Uri "$base/api/public/availability?barbershopId=$shopId&serviceId=$svcId&date=$today&employeeId=$empId" -Method GET -Headers $H
$slot=$avail.data.slots[0]

# request body
$body=@{ barbershopId=$shopId; serviceId=$svcId; employeeId=$empId; startAt=$slot; customer=@{ name='Cliente Público'; phone='+5511999999999' } }
$idem=[guid]::NewGuid().ToString()

# primeira tentativa 201
$r1=Invoke-WebRequest -Uri "$base/api/public/appointments" -Method POST -Headers (@{ 'X-Tenant-Id'=$H['X-Tenant-Id']; 'Content-Type'='application/json'; 'Idempotency-Key'=$idem }) -Body ($body|ConvertTo-Json)
Write-Host ("FIRST: " + $r1.StatusCode) -ForegroundColor Green
Write-Host $r1.Content -ForegroundColor Green

# replay 200 mesmo conteúdo
$r2=Invoke-WebRequest -Uri "$base/api/public/appointments" -Method POST -Headers (@{ 'X-Tenant-Id'=$H['X-Tenant-Id']; 'Content-Type'='application/json'; 'Idempotency-Key'=$idem }) -Body ($body|ConvertTo-Json)
Write-Host ("REPLAY: " + $r2.StatusCode) -ForegroundColor Yellow
Write-Host $r2.Content -ForegroundColor Yellow











