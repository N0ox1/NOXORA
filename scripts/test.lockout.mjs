import { PrismaClient } from '@prisma/client';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const EMAIL = process.env.E2E_EMAIL || 'owner@noxora.dev';
const PASSWORD = process.env.E2E_PASSWORD || 'owner123';
const TENANT = process.env.E2E_TENANT_ID; // opcional

async function req(method, path, { body, headers } = {}) {
 const h = { 'content-type': 'application/json', ...(headers||{}) };
 const res = await fetch(`${BASE}${path}`, { method, headers: h, body: body? JSON.stringify(body): undefined });
 let json=null; try{ json=await res.json(); }catch{}
 return { status: res.status, json };
}

(async()=>{
 const prisma = new PrismaClient();
 const user = await prisma.employee.findFirst({ where: { email: EMAIL } });
 if (!user) { console.error(JSON.stringify({ ok:false, error:'seed_missing_user' })); process.exit(1); }
 await prisma.employee.update({ where: { id: user.id }, data: { failedLoginAttempts: 0, lockedUntil: null } });

 const wrong = [];
 for (let i=0;i<5;i++) {
 const r = await req('POST','/api/auth/login',{ body:{ email: EMAIL, password: 'wrongpass' } });
 wrong.push(r.status);
 }
 const afterLock = await req('POST','/api/auth/login',{ body:{ email: EMAIL, password: PASSWORD } });

 console.log(JSON.stringify({ ok: wrong.slice(0,4).every(s=>s===401) && [401,423].includes(wrong[4]) && afterLock.status===423, wrong, afterLock: afterLock.status }, null, 2));
 await prisma.$disconnect();
 process.exit(0);
})().catch(e=>{ console.error(JSON.stringify({ ok:false, error:String(e?.message||e) })); process.exit(1); });


