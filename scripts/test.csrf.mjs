const BASE = process.env.BASE_URL || 'http://localhost:3000';
async function req(method, path, headers={}, body){
  const res = await fetch(`${BASE}${path}`, { method, headers: { 'content-type':'application/json', ...headers }, body: body? JSON.stringify(body): undefined });
  let j=null; try{ j=await res.json(); } catch{}
  return { status: res.status, json: j };
}
(async()=>{
  const bad = await req('POST','/api/public/appointments', { Referer: 'https://evil.example/' }, { any: 'thing' });
  const good = await req('POST','/api/public/appointments', { Referer: 'http://localhost:3000/' }, { any: 'thing' });
  const ok = bad.status===403 && bad.json?.error==='csrf_origin_mismatch' && good.status!==403;
  console.log(JSON.stringify({ ok, bad: bad.status, good: good.status }, null, 2));
  process.exit(ok?0:1);
})().catch(e=>{ console.error(JSON.stringify({ ok:false, error:String(e?.message||e) })); process.exit(1); });
