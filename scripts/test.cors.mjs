const BASE = process.env.BASE_URL || 'http://localhost:3000';
async function preflight(path, origin) {
  const res = await fetch(`${BASE}${path}`, { method: 'OPTIONS', headers: { Origin: origin, 'Access-Control-Request-Method': 'POST' } });
  return { status: res.status, h: Object.fromEntries(res.headers.entries()) };
}
async function get(path, origin) {
  const res = await fetch(`${BASE}${path}`, { headers: { Origin: origin } });
  return { status: res.status, h: Object.fromEntries(res.headers.entries()) };
}
(async()=>{
  const originOK = 'http://localhost:3000';
  const pre = await preflight('/api/health', originOK);
  const g = await get('/api/health', originOK);
  const allow = g.h['access-control-allow-origin'];
  const okAllow = allow === originOK || allow === '';
  const okPre = pre.status===204 && (pre.h['access-control-allow-methods']||'').includes('POST');
  const ok = okAllow && okPre;
  console.log(JSON.stringify({ ok, pre: pre.status, allow, methods: pre.h['access-control-allow-methods'] }, null, 2));
  process.exit(ok?0:1);
})().catch(e=>{ console.error(JSON.stringify({ ok:false, error:String(e?.message||e) })); process.exit(1); });
