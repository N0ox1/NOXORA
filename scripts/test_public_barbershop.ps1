$ErrorActionPreference='Stop'
function J($o){try{$o|ConvertTo-Json -Depth 8 -Compress}catch{[string]$o}}
$base='http://localhost:3000'
$H=@{'X-Tenant-Id'='TENANT_TEST';'Content-Type'='application/json'}

Write-Host '=== TEST: GET /api/public/barbershop/[slug] ===' -ForegroundColor Cyan

# Tentar diferentes slugs comuns
$slugs = @('barbearia-teste', 'barbearia', 'shop_1', 'teste', 'default')

foreach($slug in $slugs) {
  Write-Host "--- Tentando slug: $slug ---" -ForegroundColor Yellow
  try {
    $r = Invoke-WebRequest -Uri "$base/api/public/barbershop/$slug" -Method GET -Headers $H -ErrorAction Stop
    Write-Host "SUCESSO! Status: $($r.StatusCode)" -ForegroundColor Green
    try { 
      $data = $r.Content | ConvertFrom-Json 
      Write-Host "RESPOSTA:" -ForegroundColor Green
      Write-Host (J $data) -ForegroundColor Green
    } catch { 
      Write-Host "Conteúdo: $($r.Content)" -ForegroundColor Green 
    }
    break
  } catch {
    $status = $null
    try { $status = $_.Exception.Response.StatusCode.Value__ } catch {}
    Write-Host "FALHOU: $status - $($_.Exception.Message)" -ForegroundColor Red
  }
}
