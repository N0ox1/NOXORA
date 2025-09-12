const BASE = process.env.BASE_URL || 'http://localhost:3000';
const EMAIL = process.env.E2E_EMAIL;
const PASSWORD = process.env.E2E_PASSWORD;
const TENANT = process.env.E2E_TENANT_ID;
if (!EMAIL || !PASSWORD || !TENANT) { console.error(JSON.stringify({ ok:false, error:'Faltam E2E_EMAIL/E2E_PASSWORD/E2E_TENANT_ID' })); process.exit(2); }
async function req(method, path, { body, token, headers } = {}) { const h = { 'content-type': 'application/json', ...(headers||{}) }; if (token) h.authorization = `Bearer ${token}`; const res = await fetch(`${BASE}${path}`, { method, headers: h, body: body? JSON.stringify(body): undefined }); let json=null; try{ json=await res.json(); }catch{} return { status: res.status, json }; }
function assert(cond, msg){ if(!cond) throw new Error(msg); }
(async()=>{
 const out = { steps: [] };
 const h = await req('GET','/api/health'); out.steps.push({ step:'health', res:h }); assert(h.status===200 && h.json?.ok===true,'health falhou');
 const login = await req('POST','/api/auth/login',{ body:{ email:EMAIL, password:PASSWORD } }); out.steps.push({ step:'login', res:{ status:login.status, hasAccess:!!login.json?.accessToken, hasRefresh:!!login.json?.refreshToken } }); assert(login.status===200 && login.json?.accessToken && login.json?.refreshToken,'login falhou');
 const access = login.json.accessToken; const refresh = login.json.refreshToken;
 const emp = await req('GET','/api/employees',{ token:access, headers:{ 'x-tenant-id': TENANT }}); const count = Array.isArray(emp.json?.items)? emp.json.items.length : (emp.json?.items? 1: 0); out.steps.push({ step:'employees', res:{ status:emp.status, count } }); assert(emp.status===200 && (emp.json?.items!==undefined),'employees falhou');
 const r = await req('POST','/api/auth/refresh',{ body:{ refreshToken:refresh }}); out.steps.push({ step:'refresh', res:{ status:r.status, hasAccess:!!r.json?.accessToken, hasRefresh:!!r.json?.refreshToken } }); assert(r.status===200 && r.json?.accessToken && r.json?.refreshToken,'refresh falhou');
 const sv = await req('GET','/api/services',{ token:access, headers:{ 'x-tenant-id': TENANT }}); const scount = Array.isArray(sv.json?.items)? sv.json.items.length : (sv.json?.items? 1: 0); out.steps.push({ step:'services', res:{ status:sv.status, count: scount } }); assert(sv.status===200 && (sv.json?.items!==undefined),'services falhou');
 console.log(JSON.stringify({ ok:true, summary: out }, null, 2)); process.exit(0);
})().catch(err=>{ console.error(JSON.stringify({ ok:false, error:String(err?.message||err) })); process.exit(1); });
