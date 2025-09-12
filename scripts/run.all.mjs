const steps = [
  ['🔎 Scan Prisma (tenantId obrigatório)', 'audit:tenant:static'],
  ['🔒 Testes de segurança', 'test:security'],
  ['🌱 Seed 2 tenants (DB)', 'seed:tenants:db'],
  ['🧪 API multi-tenant (create/list)', 'test:tenant:api'],
  ['🧪 API STRICT (update/delete)', 'test:tenant:api:strict'],
  ['🧪 Cross-tenant (404/403)', 'test:tenant:cross'],
  ['🚦 Rate limit estático', 'audit:ratelimit:static'],
  ['🚦 Rate limit dinâmico', 'test:ratelimit']
];

(async()=>{
  const { spawn } = await import('node:child_process');
  for (const [label, script] of steps) {
    console.log(`\n===== ${label} -> npm run ${script} =====`);
    const p = spawn(process.execPath, ['--no-warnings', '-e', `require('child_process').spawnSync(process.platform==='win32'?'npm.cmd':'npm',['run','${script}'],{stdio:'inherit'})`], { stdio:'inherit' });
    const code = await new Promise(r=>p.on('close', r));
    if (code !== 0) { console.error(`✖ Falha em: ${label}`); process.exit(code); }
  }
  console.log('\n✅ Tudo passou.');
})();
