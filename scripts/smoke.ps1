$ErrorActionPreference = 'Stop'
$BASE = $env:BASE_URL; if (-not $BASE) { $BASE = 'http://localhost:3000' }
$EMAIL = $env:E2E_EMAIL; $PASS = $env:E2E_PASSWORD; $TENANT = $env:E2E_TENANT_ID
if (-not $EMAIL -or -not $PASS -or -not $TENANT) { throw 'Faltam E2E_EMAIL/E2E_PASSWORD/E2E_TENANT_ID' }

# 1) health
$h = Invoke-RestMethod -Uri "$BASE/api/health" -Method GET
if (-not $h.ok) { throw 'health falhou' }

# 2) login
$login = Invoke-RestMethod -Uri "$BASE/api/auth/login" -Method POST -ContentType 'application/json' -Body (@{ email=$EMAIL; password=$PASS } | ConvertTo-Json)
$access = $login.accessToken; $refresh = $login.refreshToken
if (-not $access -or -not $refresh) { throw 'login falhou' }

# 3) employees (aceita array vazio)
$headers = @{ authorization = "Bearer $access"; 'x-tenant-id' = $TENANT }
$emp = Invoke-RestMethod -Uri "$BASE/api/employees" -Method GET -Headers $headers
if ($null -eq $emp.items) { throw 'employees falhou' }

# 4) refresh
$ref = Invoke-RestMethod -Uri "$BASE/api/auth/refresh" -Method POST -ContentType 'application/json' -Body (@{ refreshToken=$refresh } | ConvertTo-Json)
if (-not $ref.accessToken -or -not $ref.refreshToken) { throw 'refresh falhou' }

# 5) services (aceita array vazio)
$svc = Invoke-RestMethod -Uri "$BASE/api/services" -Method GET -Headers $headers
if ($null -eq $svc.items) { throw 'services falhou' }

Write-Output ( @{ ok = $true; steps = @('health','login','employees','refresh','services') } | ConvertTo-Json -Depth 5 )
