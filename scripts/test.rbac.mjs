import prisma from '../src/lib/prisma.ts';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const TENANT_ID = process.env.E2E_TENANT_ID ?? 't_dev';
const COMMON_HEADERS = { 'Content-Type': 'application/json', 'X-Tenant-Id': TENANT_ID };
const EMAIL = process.env.E2E_EMAIL; const PASSWORD = process.env.E2E_PASSWORD;
if (!EMAIL || !PASSWORD) { console.error(JSON.stringify({ ok:false, error:'Faltam E2E_EMAIL/E2E_PASSWORD' })); process.exit(2); }

async function waitForServer(url, { retries = 120, intervalMs = 1000 } = {}) {
  for (let i = 0; i < retries; i++) {
    if (i % 10 === 0) console.log(JSON.stringify({ info: 'waiting_server', attempt: i, url }, null, 2));
    try {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), 8000);
      const res = await fetch(`${url}/api/health`, { signal: ctl.signal });
      clearTimeout(t);
      if (res.ok) return true;
    } catch {}
    await new Promise(r => setTimeout(r, intervalMs));
  }
  throw new Error(`server_not_ready: ${url}`);
}

async function fetchJSON(input, init = {}) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 8000);
  try {
    const res = await fetch(input, { ...init, signal: ctl.signal });
    const text = await res.text();
    let json;
    try { json = JSON.parse(text); } catch { json = { raw: text }; }
    if (!res.ok) {
      const err = new Error('http_error');
      err.status = res.status;
      err.body = json;
      throw err;
    }
    return json;
  } catch (e) {
    const err = new Error('network_error');
    err.cause = { name: e.name, message: e.message, code: e.code ?? e.cause?.code };
    throw err;
  } finally { clearTimeout(timer); }
}

async function req(method, path, { token, tenant, body } = {}) {
 const h = { ...COMMON_HEADERS };
 if (token) h.authorization = `Bearer ${token}`;
 if (tenant) h['x-tenant-id'] = tenant;
 try {
   const json = await fetchJSON(`${BASE_URL}${path}`, { method, headers: h, body: body? JSON.stringify(body): undefined });
   return { status: 200, json };
 } catch (e) {
   if (e.message === 'http_error') return { status: e.status, json: e.body };
   throw e;
 }
}
const b64u = s => Buffer.from(s,'base64url').toString('utf8');
const claims = t => { const p=t.split('.'); try { return JSON.parse(b64u(p[1]||'')); } catch { return {}; } };

(async()=>{
 await waitForServer(BASE_URL);
 console.log(JSON.stringify({ info: 'server_ready', baseUrl: BASE_URL, tenant: TENANT_ID }));
 const out = { steps: [] };
 const login1 = await req('POST','/api/auth/login',{ body:{ email:EMAIL, password:PASSWORD } });
 if (login1.status!==200) { console.error(JSON.stringify({ ok:false, step:'login_owner', res:login1 })); process.exit(1); }
 const accessOwner = login1.json.accessToken; const { tenantId, sub:userId } = claims(accessOwner);
 // usando singleton exportado
// const prisma = prisma; // removido
 const me = await prisma.employee.findUnique({ where: { id: userId, tenantId }, select: { barbershopId: true } });
 const barbershopId = me?.barbershopId;

 // employees deve 200
 const empOK = await req('GET','/api/employees',{ token: accessOwner, tenant: tenantId });
 out.steps.push({ step:'employees_owner', status: empOK.status });

 // services POST deve 201
 const name = `Srv Test ${Date.now().toString(36)}`;
 const sPOSTok = await req('POST','/api/services',{ token: accessOwner, tenant: tenantId, body:{ name, durationMin: 15, priceCents: 1000, barbershopId } });
 out.steps.push({ step:'services_post_owner', status: sPOSTok.status });

 // mudar papel para BARBER e relogar
 await prisma.employee.updateMany({ where: { id: userId, tenantId }, data: { role: 'BARBER' } });
 const login2 = await req('POST','/api/auth/login',{ body:{ email:EMAIL, password:PASSWORD } });
 const accessBarber = login2.json.accessToken; const { tenantId: t2 } = claims(accessBarber);

 // employees deve 403
 const emp403 = await req('GET','/api/employees',{ token: accessBarber, tenant: t2 });
 out.steps.push({ step:'employees_barber', status: emp403.status, body: emp403.json });
 // services GET deve 200
 const sGETok = await req('GET','/api/services',{ token: accessBarber, tenant: t2 });
 out.steps.push({ step:'services_get_barber', status: sGETok.status });
 // services POST deve 403
 const sPOST403 = await req('POST','/api/services',{ token: accessBarber, tenant: t2, body:{ name:`No ${Date.now().toString(36)}`, durationMin: 10, priceCents: 500, barbershopId } });
 out.steps.push({ step:'services_post_barber', status: sPOST403.status, body: sPOST403.json });

 // reverter para OWNER
 await prisma.employee.updateMany({ where: { id: userId, tenantId }, data: { role: 'OWNER' } });
 await prisma.$disconnect();

 const expect = {
 employees_owner_200: empOK.status === 200,
 services_post_owner_created: [200,201].includes(sPOSTok.status),
 employees_barber_403: emp403.status === 403,
 services_get_barber_200: sGETok.status === 200,
 services_post_barber_403: sPOST403.status === 403
 };
 const ok = Object.values(expect).every(Boolean);
 console.log(JSON.stringify({ ok, expect, summary: out }, null, 2));
 process.exit(ok?0:1);
})().catch(e=>{ console.error(JSON.stringify({ ok:false, error:String(e?.message||e) })); process.exit(1); });
