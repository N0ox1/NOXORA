$ErrorActionPreference = 'Stop'

function Log([string]$m,[string]$c='Gray'){Write-Host $m -ForegroundColor $c}
function J($o){try{$o|ConvertTo-Json -Depth 8 -Compress}catch{[string]$o}}
function Req($method,$url,$headers,$body){
  try{
    $json=$null;if($body){$json=$body|ConvertTo-Json -Depth 8}
    $resp=Invoke-WebRequest -Uri $url -Method $method -Headers $headers -Body $json -ErrorAction Stop
    $data=$resp.Content;try{$data=$resp.Content|ConvertFrom-Json}catch{}
    return @{ok=$true;status=$resp.StatusCode;data=$data}
  }catch{
    $st=$null;$txt=$null;try{$st=$_.Exception.Response.StatusCode.Value__}catch{}
    try{$r=new-object IO.StreamReader($_.Exception.Response.GetResponseStream());$txt=$r.ReadToEnd();$r.Close()}catch{}
    $j=$txt;try{$j=$txt|ConvertFrom-Json}catch{}
    return @{ok=$false;status=$st;error=$_.Exception.Message;body=$j}
  }
}

# === CONFIG ===
$base='http://localhost:3000'
$tenant='TENANT_TEST'
$H=@{'X-Tenant-Id'=$tenant;'Content-Type'='application/json'}
$now=[DateTime]::UtcNow
$start=$now.AddHours(1)
$end=$start.AddMinutes(30)

Log '=== TESTE FOCO: POST /api/appointments ===' 'Cyan'

# 1) Coletar referencias existentes
Log '--- Coletando serviço existente' 'Yellow'
$s=Req GET "$base/api/services" $H $null
if(-not $s.ok -or $s.data.Length -eq 0){Log ("SERVICES FAIL: $($s.status) $($s.error)") 'Red';exit 1}
$serviceId=$s.data[0].id
$barbershopId=$s.data[0].barbershopId
Log ("SERVICE PICKED: $($s.data[0].id) $($s.data[0].name)") 'Green'

Log '--- Coletando funcionário existente' 'Yellow'
$e=Req GET "$base/api/employees" $H $null
if(-not $e.ok -or $e.data.Length -eq 0){Log ("EMPLOYEES FAIL: $($e.status) $($e.error)") 'Red';exit 1}
$employeeId=$e.data[0].id
if(-not $barbershopId -and $e.data[0].barbershopId){$barbershopId=$e.data[0].barbershopId}
Log ("EMPLOYEE PICKED: $($e.data[0].id) $($e.data[0].name)") 'Green'

Log '--- Criando cliente temporário' 'Yellow'
$cliName="E2E Appt " + (Get-Random)
$c=Req POST "$base/api/clients" $H @{name=$cliName;phone='+5511999999999'}
if(-not $c.ok){Log ("CLIENT CREATE FAIL: $($c.status) $($c.error)") 'Red';exit 1}
$clientId=$c.data.id
Log ("CLIENT CREATED: $($c.data.id) $($c.data.name)") 'Green'

# 2) POST /api/appointments (com barbershopId)
Log '--- POST /api/appointments (com barbershopId)' 'Yellow'
$body2=@{serviceId=$serviceId;employeeId=$employeeId;clientId=$clientId;startAt=$start.ToString('o');endAt=$end.ToString('o');barbershopId=$barbershopId}
$r2=Req POST "$base/api/appointments" $H $body2
if($r2.ok){ 
  Log ("APPT CREATED: " + (J $r2.data)) 'Green'; 
  $apptId=$r2.data.id 
} else { 
  Log ("APPT CREATE FAIL: status=$($r2.status) body="+(J $r2.body)) 'Red' 
}

# 4) Cleanup best-effort
if($apptId){
  Log '--- DELETE /api/appointments (cleanup)' 'Yellow'
  try{
    $d=Invoke-WebRequest -Uri "$base/api/appointments" -Method DELETE -Headers $H -Body (@{id=$apptId}|ConvertTo-Json)
    Log ("APPT DELETE: " + $d.StatusCode) 'Green'
  }catch{
    Log ("APPT DELETE FAIL: " + $_.Exception.Message) 'Yellow'
  }
}
if($clientId){
  Log '--- DELETE /api/clients (cleanup)' 'Yellow'
  try{ $d=Invoke-WebRequest -Uri "$base/api/clients" -Method DELETE -Headers $H -Body (@{id=$clientId}|ConvertTo-Json); Log ("CLIENT DELETE: " + $d.StatusCode) 'Green' }catch{ Log ("CLIENT DELETE FAIL: " + $_.Exception.Message) 'Yellow' }
}

Log '=== FIM TESTE POST /api/appointments ===' 'Cyan'
