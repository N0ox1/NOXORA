import { strict as A } from 'assert';
const base = 'http://localhost:3000/api/v1';
const TENANT = process.env.TENANT_ID; const BARB = process.env.BARBERSHOP_ID; const EMP = process.env.EMPLOYEE_ID; const SVC = process.env.SERVICE_ID;
function isoPlus(min) { const d = new Date(); d.setUTCMinutes(d.getUTCMinutes() + min); return d.toISOString(); }
export default async function testCancelRules() {
    A.ok(TENANT && BARB && EMP && SVC, 'env vars');
    // cancel ok (longe)
    const s1 = isoPlus(2460), e1 = isoPlus(2460 + 30);
    const p1 = { tenantId: TENANT, barbershopId: BARB, employeeId: EMP, serviceId: SVC, startAt: s1, endAt: e1 };
    const r1 = await fetch(`${base}/public/appointments`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(p1) });
    A.equal(r1.status, 201);
    const j1 = await r1.json();
    const del = await fetch(`${base}/public/appointments/${j1.id}?tenantId=${TENANT}`, { method: 'DELETE' });
    A.equal(del.status, 200, 'cancel 200');
    // reschedule bloqueado perto
    const s2 = isoPlus(70), e2 = isoPlus(100);
    const r2 = await fetch(`${base}/public/appointments`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...p1, startAt: s2, endAt: e2 }) });
    A.equal(r2.status, 201);
    const j2 = await r2.json();
    const re = await fetch(`${base}/public/appointments/${j2.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ tenantId: TENANT, startAt: isoPlus(60), endAt: isoPlus(90) }) });
    A.equal(re.status, 422, 'reschedule window closed 422');
    return 'cancel/reschedule ok';
}



















