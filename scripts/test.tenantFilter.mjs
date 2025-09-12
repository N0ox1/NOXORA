import prisma from '../src/lib/prisma.js';

const BASE = process.env.BASE_URL || 'http://localhost:3000';
const EMAIL = process.env.E2E_EMAIL || 'owner@noxora.dev';
const PASSWORD = process.env.E2E_PASSWORD || 'owner123';

async function http(method, path, body) {
  const res = await fetch(`${BASE}${path}`, { method, headers: { 'content-type':'application/json' }, body: body? JSON.stringify(body): undefined });
  let json = null; try { json = await res.json(); } catch {}
  return { status: res.status, json };
}
const b64u = s => Buffer.from(s,'base64url').toString('utf8');
const claims = t => { const p=t.split('.'); try { return JSON.parse(b64u(p[1]||'')); } catch { return {}; } };

(async()=>{
  const out = { steps: [] };
  const login = await http('POST','/api/auth/login',{ email: EMAIL, password: PASSWORD });
  if (login.status !== 200) { console.error(JSON.stringify({ ok:false, step:'login', res:login })); process.exit(1); }
  const { tenantId, sub:userId } = claims(login.json.accessToken);

  const prisma = prisma;
  // 1) findMany sem where.tenantId deve falhar
  let noWhereErr = null;
  try { await prisma.service.findMany({}); } catch (e) { noWhereErr = String(e?.message||e); }
  out.steps.push({ step:'findMany_no_tenant_where', error: noWhereErr });

  // 2) findMany com where.tenantId deve passar
  let okList = null; try { okList = await prisma.service.findMany({ where: { tenantId } }); } catch (e) { console.error(JSON.stringify({ ok:false, step:'findMany_with_tenant', error:String(e?.message||e) })); process.exit(1); }
  out.steps.push({ step:'findMany_with_tenant', count: okList.length });

  // 3) update unique sem tenantId em where deve falhar
  let updErr = null;
  try { await prisma.employee.update({ where: { id: userId }, data: { role: 'MANAGER' } }); } catch (e) { updErr = String(e?.message||e); }
  out.steps.push({ step:'update_unique_no_tenant', error: updErr });

  // 4) updateMany com tenantId deve passar (e reverter)
  const toRole = 'MANAGER';
  const u1 = await prisma.employee.updateMany({ where: { id: userId, tenantId }, data: { role: toRole } });
  const u2 = await prisma.employee.updateMany({ where: { id: userId, tenantId }, data: { role: 'OWNER' } });
  out.steps.push({ step:'update_many_with_tenant', counts: [u1.count, u2.count] });

  await prisma.$disconnect();
  const expect = {
    findMany_no_tenant_where_threw: /tenant_scope_required/.test(noWhereErr||''),
    update_unique_no_tenant_threw: /tenant_scope_required_unique/.test(updErr||''),
    update_many_counts_valid: true
  };
  const ok = Object.values(expect).every(Boolean);
  console.log(JSON.stringify({ ok, expect, summary: out }, null, 2));
  process.exit(ok?0:1);
})().catch(e=>{ console.error(JSON.stringify({ ok:false, error:String(e?.message||e) })); process.exit(1); });
