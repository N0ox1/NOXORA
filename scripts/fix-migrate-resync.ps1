$ErrorActionPreference = 'Stop'
# 0) matar node que segura dll do Prisma
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force; Start-Sleep -Seconds 1

# 1) limpar possíveis locks do client
$clientPath = Join-Path (Resolve-Path .).Path 'node_modules/.prisma/client'
if (Test-Path $clientPath) { Get-ChildItem $clientPath -Filter .tmp -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue }

# 2) status (debug)
Write-Host '=== prisma migrate status ===' -ForegroundColor Cyan
npm run db:status

# 3) RESET APENAS EM DEV (irá apagar dados do schema atual)
Write-Host '=== prisma migrate reset --force ===' -ForegroundColor Yellow
npm run db:reset:dev

# 4) generate
Write-Host '=== prisma generate ===' -ForegroundColor Cyan
npx prisma generate

# 5) seed owner se existir
if (Test-Path './scripts/seed.owner.ts') {
  Write-Host '=== seed.owner.ts ===' -ForegroundColor Cyan
  npx tsx ./scripts/seed.owner.ts
}

Write-Host '=== DONE: DB resync + generate + seed ===' -ForegroundColor Green


