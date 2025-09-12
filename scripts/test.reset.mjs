import { PrismaClient } from '@prisma/client';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const EMAIL = process.env.E2E_EMAIL || 'owner@noxora.dev';
const OLD_PASS = process.env.E2E_PASSWORD || 'owner123';
const NEW_PASS = 'Owner1234!';

async function req(method, path, { body, headers } = {}) {
 const h = { 'content-type': 'application/json', ...(headers||{}) };
 const res = await fetch(`${BASE}${path}`, { method, headers: h, body: body? JSON.stringify(body): undefined });
 let json=null; try{ json=await res.json(); }catch{}
 return { status: res.status, json };
}
const b64u = s => Buffer.from(s,'base64url').toString('utf8');
const claims = t => { const p=t.split('.'); try { return JSON.parse(b64u(p[1]||'')); } catch { return {}; } };

(async()=>{
 const prisma = new PrismaClient();
 // 1) login para obter refresh antigo
 const login = await req('POST','/api/auth/login',{ body:{ email: EMAIL, password: OLD_PASS } });
 if (login.status!==200) { console.error(JSON.stringify({ ok:false, step:'login_old', res:login })); process.exit(1); }
 const oldRefresh = login.json.refreshToken; const { tenantId } = claims(login.json.accessToken);

 // 2) request-reset
 const reqReset = await req('POST','/api/auth/request-reset',{ body:{ email: EMAIL }, headers: { 'x-tenant-id': tenantId } });
 if (reqReset.status!==200) { console.error(JSON.stringify({ ok:false, step:'request_reset', res:reqReset })); process.exit(1); }

 // 3) buscar token do DB
 const rec = await prisma.passwordResetToken.findFirst({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
 if (!rec) { console.error(JSON.stringify({ ok:false, step:'fetch_token_db' })); process.exit(1); }
 // reconstruir token não é possível pois guardamos apenas hash; para teste, geramos novo token raw e substituímos o hash
 const raw = 'test-token-' + Date.now().toString(36);
 const crypto = await import('crypto');
 await prisma.passwordResetToken.updateMany({ where: { id: rec.id, tenantId }, data: { tokenHash: crypto.createHash('sha256').update(raw).digest('hex') } });

 // 4) reset
 const reset = await req('POST','/api/auth/reset',{ body:{ token: raw, newPassword: NEW_PASS }, headers: { 'x-tenant-id': tenantId } });
 // 5) refresh antigo deve falhar
 const reuse = await req('POST','/api/auth/refresh',{ body:{ refreshToken: oldRefresh } });
 // 6) login com senha antiga deve falhar
 const loginOld = await req('POST','/api/auth/login',{ body:{ email: EMAIL, password: OLD_PASS } });
 // 7) login com senha nova deve passar
 const loginNew = await req('POST','/api/auth/login',{ body:{ email: EMAIL, password: NEW_PASS } });

 console.log(JSON.stringify({ ok: reset.status===200 && reuse.status===401 && loginOld.status!==200 && loginNew.status===200, steps: { reset: reset.status, reuse: reuse.status, loginOld: loginOld.status, loginNew: loginNew.status } }, null, 2));

 // opcional: voltar senha antiga
 const user = await prisma.employee.findFirst({ where: { email: EMAIL, tenantId } });
 if (user) {
 const bcrypt = await import('bcryptjs');
 await prisma.employee.updateMany({ where: { id: user.id, tenantId }, data: { passwordHash: await bcrypt.default.hash(OLD_PASS, 10) } });
 }
 await prisma.$disconnect();
 process.exit(0);
})().catch(e=>{ console.error(JSON.stringify({ ok:false, error:String(e?.message||e) })); process.exit(1); });
