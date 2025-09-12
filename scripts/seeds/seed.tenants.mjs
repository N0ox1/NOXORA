import { promises as fs } from 'node:fs';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const OUT_DIR = '.seeds';
const OUT_FILE = `${OUT_DIR}/tenants.json`;
const REGISTER_ENDPOINT = process.env.REGISTER_ENDPOINT || '/api/auth/register';

function envJSON(name){ try{ return process.env[name] ? JSON.parse(process.env[name]) : null }catch{ return null } }

async function req(path,{method='GET',json,headers={},token,tenantId}={}){
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  const h = { 'content-type':'application/json', ...headers };
  if (token) h.authorization = `Bearer ${token}`;
  if (tenantId) h['x-tenant-id'] = tenantId;
  const res = await fetch(url, { method, headers:h, body: json ? JSON.stringify(json) : undefined });
  let body = null; try { body = await res.json(); } catch {}
  return { res, body };
}

function decodeJwt(tok){ if(!tok) return {}; const p=tok.split('.'); if(p.length!==3) return {}; const b=Buffer.from(p[1].replace(/-/g,'+').replace(/_/g,'/'),'base64').toString('utf8'); try{ return JSON.parse(b) }catch{ return {} } }

function buildPayload(email,password,name){
  const base = envJSON('REGISTER_PAYLOAD_BASE') || {};
  return { email, password, name, ...base };
}

async function tryRegister(email,password,name){
  const candidates = [
    buildPayload(email,password,name),
    { ...buildPayload(email,password,name), confirmPassword: password },
    { ...buildPayload(email,password,name), passwordConfirm: password },
    { ...buildPayload(email,password,`Owner ${name}`), barbershopName: `Shop ${name}`, terms: true },
    { ...buildPayload(email,password,`Owner ${name}`), tenantName: `Tenant ${name}`, terms: true }
  ];
  for (const p of candidates){
    const r = await req(REGISTER_ENDPOINT,{ method:'POST', json:p });
    if (r.res.ok) return r.body;
    if (['email_in_use','conflict'].includes(r.body?.error)) throw new Error(`email em uso: ${email}`);
  }
  throw new Error('register falhou para todos os payloads');
}

async function login(email,password){
  const r = await req('/api/auth/login',{ method:'POST', json:{ email, password } });
  if (!r.res.ok) throw new Error(`login falhou ${r.res.status} ${JSON.stringify(r.body)}`);
  return r.body;
}

async function ensureIdentity(tag){
  // usa credenciais pré-existentes se fornecidas
  const EMAIL = process.env[`TENANT_${tag}_EMAIL`] || `${tag.toLowerCase()}+${Date.now()}@noxora.dev`;
  const PASSWORD = process.env[`TENANT_${tag}_PASSWORD`] || 'OwnerP@ssw0rd1!';

  // 1) tenta login
  let auth = null;
  const loginTry = await req('/api/auth/login',{ method:'POST', json:{ email: EMAIL, password: PASSWORD } });
  if (loginTry.res.ok) auth = loginTry.body;
  // 2) senão, registra com payload flexível
  if (!auth){
    const reg = await tryRegister(EMAIL,PASSWORD,`Tenant ${tag}`);
    auth = reg;
  }
  const access = auth?.access_token || auth?.accessToken || auth?.token;
  const tenantId = auth?.tenantId || auth?.tenant?.id || decodeJwt(access).tenantId;
  if (!access || !tenantId) throw new Error('sem access/tenantId após auth');
  return { email: EMAIL, password: PASSWORD, access, tenantId };
}

async function ensureService(access,tenantId,name){
  const body = { name, durationMin: 30, priceCents: 5000 };
  const r = await req('/api/services',{ method:'POST', json: body, token: access, tenantId });
  if (!r.res.ok) throw new Error(`create service falhou ${r.res.status} ${JSON.stringify(r.body)}`);
  return r.body?.id || r.body?.service?.id || r.body?.data?.id;
}

(async()=>{
  console.log('🌱 Seeding 2 tenants...');
  const A = await ensureIdentity('A');
  const B = await ensureIdentity('B');
  const svcA = await ensureService(A.access, A.tenantId, 'Corte A');
  const svcB = await ensureService(B.access, B.tenantId, 'Corte B');
  await fs.mkdir(OUT_DIR,{ recursive:true });
  await fs.writeFile(OUT_FILE, JSON.stringify({ A:{ email:A.email, password:A.password, tenantId:A.tenantId, serviceId:svcA }, B:{ email:B.email, password:B.password, tenantId:B.tenantId, serviceId:svcB } }, null, 2));
  console.log('✅ Seed ok ->', OUT_FILE);
  console.log({ A:{ tenantId:A.tenantId, email:A.email, serviceId:svcA }, B:{ tenantId:B.tenantId, email:B.email, serviceId:svcB } });
})().catch(e=>{ console.error('❌ Seed falhou:', e.message); process.exit(1); });
