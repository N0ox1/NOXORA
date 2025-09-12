import { PrismaClient } from '@prisma/client';
const BASE = process.env.BASE_URL || 'http://localhost:3000';
const EMAIL = process.env.E2E_EMAIL; const PASSWORD = process.env.E2E_PASSWORD; const TENANT = process.env.E2E_TENANT_ID;
if (!EMAIL || !PASSWORD || !TENANT) { console.error(JSON.stringify({ ok:false, error:'Faltam E2E_EMAIL/E2E_PASSWORD/E2E_TENANT_ID' })); process.exit(2); }
async function req(method, path, { body, headers } = {}) { const h = { 'content-type': 'application/json', ...(headers||{}) }; const res = await fetch(`${BASE}${path}`, { method, headers: h, body: body? JSON.stringify(body): undefined }); let json=null; try { json=await res.json(); } catch {} return { status: res.status, json }; }
const b64u = (s)=> Buffer.from(s,'base64url').toString('utf8'); const decodeJwt = (t)=>{ const p=t.split('.'); if(p.length<2) return {}; try{return JSON.parse(b64u(p[1]||''));}catch{return{};} };
(async()=>{
 const out = { steps: [] };
 // login
 const login = await req('POST','/api/auth/login',{ body:{ email: EMAIL, password: PASSWORD } });
 if (login.status!==200) { console.error(JSON.stringify({ ok:false, step:'login', res:login })); process.exit(1); }
 const access = login.json.accessToken; const refresh0 = login.json.refreshToken; const sessionId = login.json.sessionId || 'unknown';
 const { sub:userId, tenantId } = decodeJwt(access);
 out.steps.push({ step:'login', status: login.status, sessionId, userId, tenantId });
 const prisma = new PrismaClient();
 const before = await prisma.refreshToken.findMany({ where: { tenantId, userId, sessionId } });
 out.steps.push({ step:'db_before', count: before.length, revoked: before.filter(x=>x.isRevoked).length });
 // refresh 1
 const r1 = await req('POST','/api/auth/refresh',{ body:{ refreshToken: refresh0 } });
 out.steps.push({ step:'refresh_1', status: r1.status });
 if (r1.status!==200) { console.error(JSON.stringify({ ok:false, step:'refresh_1', res:r1 })); process.exit(1); }
 const refresh1 = r1.json.refreshToken;
 // reuse do antigo → deve derrubar toda família
 const reuse = await req('POST','/api/auth/refresh',{ body:{ refreshToken: refresh0 } });
 out.steps.push({ step:'reuse_old', status: reuse.status, error: reuse.json?.error || null });
 // refresh 2 com token novo → deve falhar 401 pois família foi revogada
 const r2 = await req('POST','/api/auth/refresh',{ body:{ refreshToken: refresh1 } });
 out.steps.push({ step:'refresh_2', status: r2.status, error: r2.json?.error || null });
 const after = await prisma.refreshToken.findMany({ where: { tenantId, userId, sessionId } });
 await prisma.$disconnect();
 const revoked = after.filter(x=>x.isRevoked).length; const active = after.filter(x=>!x.isRevoked).length;
 out.steps.push({ step:'db_after', count: after.length, revoked, active });
 const expect = { refresh_1_200: r1.status===200, reuse_401: reuse.status===401, refresh2_401: r2.status===401, active_zero: active===0 };
 const ok = expect.refresh_1_200 && expect.reuse_401 && expect.refresh2_401 && expect.active_zero;
 console.log(JSON.stringify({ ok, expect, summary: out }, null, 2));
 process.exit(ok?0:1);
})().catch(e=>{ console.error(JSON.stringify({ ok:false, error:String(e?.message||e) })); process.exit(1); });
