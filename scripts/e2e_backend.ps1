$ErrorActionPreference = 'Stop'

function Log([string]$msg, [string]$color='Gray') { Write-Host $msg -ForegroundColor $color }
function J($o) { return ($o | ConvertTo-Json -Depth 8 -Compress) }
function TryInvoke {
  param([string]$Method,[string]$Url,[hashtable]$Headers,[object]$Body=$null)
  try {
    $json = $null; if ($Body -ne $null) { $json = $Body | ConvertTo-Json -Depth 8 }
    $resp = Invoke-RestMethod -Uri $Url -Method $Method -Headers $Headers -Body $json
    return @{ ok = $true; data = $resp }
  } catch {
    $status = $null; try { $status = $_.Exception.Response.StatusCode.Value__ } catch {}
    return @{ ok = $false; status = $status; error = $_.Exception.Message }
  }
}

# === CONFIG ===
$base = 'http://localhost:3000'
$tenantId = 'TENANT_TEST'
$H = @{ 'X-Tenant-Id' = $tenantId; 'Content-Type' = 'application/json' }
$tag = (Get-Random)
$summary = [ordered]@{ health=$false; clients=@{create=$false; update=$false; list=$false; delete=$false}; services=@{create=$false; list=$false; delete=$false}; employees=@{create=$false; list=$false; delete=$false}; appointments=@{status=$false; create=$false; list=$false; update=$false; delete=$false} }

$barbershopId = $null
Log '=== E2E BACKEND (rotas existentes) ===' 'Cyan'

# 1) HEALTH
Log '--- /api/health' 'Yellow'
$r = TryInvoke GET "$base/api/health" $H
if ($r.ok) { Log ("HEALTH: " + (J $r.data)) 'Green'; $summary.health = $true } else { Log ("HEALTH FAIL: $($r.status) $($r.error)") 'Red' }

# 2) CLIENTS CRUD (flat)
$clientId = $null
Log '--- /api/clients (POST)' 'Yellow'
$cliCreate = @{ name = "E2E Client $tag"; phone = "+5511999999999" }
$r = TryInvoke POST "$base/api/clients" $H $cliCreate
if ($r.ok -and $r.data.id) { $clientId = $r.data.id; Log ("CLIENT CREATED: " + (J $r.data)) 'Green'; $summary.clients.create = $true } else { Log ("CLIENT CREATE FAIL: $($r.status) $($r.error)") 'Red' }

if ($clientId) {
  Log '--- /api/clients (PUT)' 'Yellow'
  $cliUpdate = @{ id = $clientId; name = "E2E Client Updated $tag"; email = "e2e$tag@test.com" }
  $r = TryInvoke PUT "$base/api/clients" $H $cliUpdate
  if ($r.ok) { Log ("CLIENT UPDATED: " + (J $r.data)) 'Green'; $summary.clients.update = $true } else { Log ("CLIENT UPDATE FAIL: $($r.status) $($r.error)") 'Red' }
}

Log '--- /api/clients (GET)' 'Yellow'
$r = TryInvoke GET "$base/api/clients" $H
if ($r.ok) { Log ("CLIENTS LIST: " + (J $r.data)) 'Green'; $summary.clients.list = $true } else { Log ("CLIENTS LIST FAIL: $($r.status) $($r.error)") 'Red' }

# 3) SERVICES CRUD (opcional)
$serviceId = $null
Log '--- /api/services (POST)' 'Yellow'
$svcCreate = @{ name = "Corte E2E $tag"; durationMin = 30; priceCents = 5000; isActive = $true }
if ($barbershopId) { $svcCreate.barbershopId = $barbershopId }
$r = TryInvoke POST "$base/api/services" $H $svcCreate
if ($r.ok -and $r.data.id) { $serviceId = $r.data.id; if (-not $barbershopId -and $r.data.barbershopId) { $barbershopId = $r.data.barbershopId }; Log ("SERVICE CREATED: " + (J $r.data)) 'Green'; $summary.services.create = $true }
else {
  Log ("SERVICE CREATE SKIP/FAIL: $($r.status) $($r.error)") 'Yellow'
  # Fallback: pegue primeiro serviço existente
  $r2 = TryInvoke GET "$base/api/services" $H
  if ($r2.ok -and $r2.data.Length -gt 0) { $serviceId = $r2.data[0].id; if (-not $barbershopId -and $r2.data[0].barbershopId) { $barbershopId = $r2.data[0].barbershopId }; Log ("SERVICE PICKED: " + (J $r2.data[0])) 'Green' } else { Log 'NO SERVICE AVAILABLE' 'Red' }
}

Log '--- /api/services (GET)' 'Yellow'
$r = TryInvoke GET "$base/api/services" $H
if ($r.ok) {
  Log ("SERVICES LIST: " + (J $r.data)) 'Green';
  $summary.services.list = $true
  if (-not $barbershopId -and $r.data.Length -gt 0) { $barbershopId = $r.data[0].barbershopId }
} else { Log ("SERVICES LIST SKIP/FAIL: $($r.status) $($r.error)") 'Yellow' }

# 4) EMPLOYEES CRUD (opcional)
$employeeId = $null
Log '--- /api/employees (POST)' 'Yellow'
$empCreate = @{ name = "Barbeiro E2E $tag"; role = "BARBER" }
if ($barbershopId) { $empCreate.barbershopId = $barbershopId }
$r = TryInvoke POST "$base/api/employees" $H $empCreate
if ($r.ok -and $r.data.id) { $employeeId = $r.data.id; if (-not $barbershopId -and $r.data.barbershopId) { $barbershopId = $r.data.barbershopId }; Log ("EMPLOYEE CREATED: " + (J $r.data)) 'Green'; $summary.employees.create = $true }
else {
  Log ("EMPLOYEE CREATE SKIP/FAIL: $($r.status) $($r.error)") 'Yellow'
  # Fallback: pegue primeiro funcionário existente
  $r2 = TryInvoke GET "$base/api/employees" $H
  if ($r2.ok -and $r2.data.Length -gt 0) { $employeeId = $r2.data[0].id; if (-not $barbershopId -and $r2.data[0].barbershopId) { $barbershopId = $r2.data[0].barbershopId }; Log ("EMPLOYEE PICKED: " + (J $r2.data[0])) 'Green' } else { Log 'NO EMPLOYEE AVAILABLE' 'Red' }
}

Log '--- /api/employees (GET)' 'Yellow'
$r = TryInvoke GET "$base/api/employees" $H
if ($r.ok) { Log ("EMPLOYEES LIST: " + (J $r.data)) 'Green'; $summary.employees.list = $true } else { Log ("EMPLOYEES LIST SKIP/FAIL: $($r.status) $($r.error)") 'Yellow' }

# 5) APPOINTMENTS (status + list + CRUD básico)
$apptId = $null
Log '--- /api/appointments (GET status/contadores)' 'Yellow'
$r = TryInvoke GET "$base/api/appointments" $H
if ($r.ok) { Log ("APPT STATUS: " + (J $r.data)) 'Green'; $summary.appointments.status = $true } else { Log ("APPT STATUS FAIL: $($r.status) $($r.error)") 'Yellow' }

if ($clientId -and $serviceId -and $employeeId) {
  Log '--- /api/appointments (POST)' 'Yellow'
  $start = (Get-Date).AddHours(1)
  $end = $start.AddMinutes(30)
  $apptCreate = @{ serviceId = $serviceId; clientId = $clientId; employeeId = $employeeId; startAt = $start.ToString('o'); endAt = $end.ToString('o') }
  if ($barbershopId) { $apptCreate.barbershopId = $barbershopId }
  $r = TryInvoke POST "$base/api/appointments" $H $apptCreate
  if ($r.ok -and $r.data.id) { $apptId = $r.data.id; Log ("APPT CREATED: " + (J $r.data)) 'Green'; $summary.appointments.create = $true } else { Log ("APPT CREATE FAIL: $($r.status) $($r.error)") 'Yellow' }
} else {
  Log 'APPT CREATE SKIPPED: missing client/service/employee' 'Yellow'
}

Log '--- /api/appointments/list (GET)' 'Yellow'
$wStart = (Get-Date).AddHours(-2).ToString('o')
$wEnd = (Get-Date).AddHours(6).ToString('o')
$q = "start=$([uri]::EscapeDataString($wStart))&end=$([uri]::EscapeDataString($wEnd))&limit=10&sort=asc"
if ($employeeId) { $q += "&employeeId=$employeeId" }
if ($serviceId) { $q += "&serviceId=$serviceId" }
$r = TryInvoke GET ("$base/api/appointments/list?" + $q) $H
if ($r.ok) { Log ("APPT LIST: " + (J $r.data)) 'Green'; $summary.appointments.list = $true } else { Log ("APPT LIST FAIL: $($r.status) $($r.error)") 'Yellow' }

if ($apptId) {
  Log '--- /api/appointments (PUT status=CANCELED)' 'Yellow'
  $r = TryInvoke PUT "$base/api/appointments" $H @{ id = $apptId; status = 'CANCELED' }
  if ($r.ok) { Log ("APPT UPDATED: " + (J $r.data)) 'Green'; $summary.appointments.update = $true } else { Log ("APPT UPDATE FAIL: $($r.status) $($r.error)") 'Yellow' }
}

# 6) CLEANUP best-effort
if ($apptId) {
  Log '--- /api/appointments (DELETE)' 'Yellow'
  try { $resp = Invoke-WebRequest -Uri "$base/api/appointments" -Method DELETE -Headers $H -Body (@{ id = $apptId } | ConvertTo-Json); Log ("APPT DELETE STATUS: $($resp.StatusCode)") 'Green'; $summary.appointments.delete = $true } catch { Log ("APPT DELETE SKIP/FAIL: $($_.Exception.Message)") 'Yellow' }
}

if ($serviceId) {
  Log '--- /api/services (DELETE)' 'Yellow'
  try { $resp = Invoke-WebRequest -Uri "$base/api/services" -Method DELETE -Headers $H -Body (@{ id = $serviceId } | ConvertTo-Json); Log ("SERVICE DELETE STATUS: $($resp.StatusCode)") 'Green'; $summary.services.delete = $true } catch { Log ("SERVICE DELETE SKIP/FAIL: $($_.Exception.Message)") 'Yellow' }
}

if ($employeeId) {
  Log '--- /api/employees (DELETE)' 'Yellow'
  try { $resp = Invoke-WebRequest -Uri "$base/api/employees" -Method DELETE -Headers $H -Body (@{ id = $employeeId } | ConvertTo-Json); Log ("EMPLOYEE DELETE STATUS: $($resp.StatusCode)") 'Green'; $summary.employees.delete = $true } catch { Log ("EMPLOYEE DELETE SKIP/FAIL: $($_.Exception.Message)") 'Yellow' }
}

if ($clientId) {
  Log '--- /api/clients (DELETE)' 'Yellow'
  try { $resp = Invoke-WebRequest -Uri "$base/api/clients" -Method DELETE -Headers $H -Body (@{ id = $clientId } | ConvertTo-Json); Log ("CLIENT DELETE STATUS: $($resp.StatusCode)") 'Green'; $summary.clients.delete = $true } catch { Log ("CLIENT DELETE FAIL: $($_.Exception.Message)") 'Red' }
}

Log '=== RESUMO ===' 'Cyan'
$summaryObj = [pscustomobject]$summary
$summaryObj | ConvertTo-Json -Depth 6 | Write-Host
