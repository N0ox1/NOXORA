const BASE = process.env.BASE_URL || 'http://localhost:3000';
(async()=>{
  const res = await fetch(`${BASE}/api/health`);
  const h = Object.fromEntries(res.headers.entries());
  const ok = h['x-content-type-options']==='nosniff' && h['x-frame-options']==='DENY' && h['referrer-policy']?.startsWith('strict-origin');
  console.log(JSON.stringify({ ok, headers: { xcto: h['x-content-type-options'], xfo: h['x-frame-options'], rp: h['referrer-policy'] } }, null, 2));
  process.exit(ok?0:1);
})().catch(e=>{ console.error(JSON.stringify({ ok:false, error:String(e?.message||e) })); process.exit(1); });
