const BASE = process.env.BASE_URL || 'http://localhost:3000';
const EMAIL = process.env.E2E_EMAIL; const PASSWORD = process.env.E2E_PASSWORD;
if (!EMAIL || !PASSWORD) { console.error(JSON.stringify({ ok:false, error:'Faltam E2E_EMAIL/E2E_PASSWORD' })); process.exit(2); }
async function req(method, path, { token, tenant, body } = {}) {
 const h = { 'content-type': 'application/json' };
 if (token) h.authorization = `Bearer ${token}`;
 if (tenant !== undefined) h['x-tenant-id'] = tenant;
 const res = await fetch(`${BASE}${path}`, { method, headers: h, body: body? JSON.stringify(body): undefined });
 let json = null; try { json = await res.json(); } catch {}
 return { status: res.status, json };
}
const b64u = s => Buffer.from(s, 'base64url').toString('utf8');
const claims = t => { const p=t.split('.'); try { return JSON.parse(b64u(p[1]||'')); } catch { return {}; } };
(async()=>{
 const login = await req('POST','/api/auth/login',{ body:{ email: EMAIL, password: PASSWORD } });
 if (login.status!==200) { console.error(JSON.stringify({ ok:false, step:'login', res:login })); process.exit(1); }
 const access = login.json.accessToken; const { tenantId } = claims(access);
 // ok
 const ok1 = await req('GET','/api/employees',{ token: access, tenant: tenantId });
 // falta header
 const miss = await req('GET','/api/employees',{ token: access });
 // mismatch
 const bad = await req('GET','/api/employees',{ token: access, tenant: 'wrong-tenant' });
 const expect = { ok200: ok1.status===200, missing400: miss.status===400 && miss.json?.error==='tenant_header_required', mismatch400: bad.status===400 && bad.json?.error==='tenant_mismatch' };
 const ok = expect.ok200 && expect.missing400 && expect.mismatch400;
 console.log(JSON.stringify({ ok, expect, samples: { ok1, miss, bad } }, null, 2));
 process.exit(ok?0:1);
})().catch(e=>{ console.error(JSON.stringify({ ok:false, error:String(e?.message||e) })); process.exit(1); });


