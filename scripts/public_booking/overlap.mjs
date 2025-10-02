import { strict as A } from 'assert';
const base = 'http://localhost:3000/api/v1';
const TENANT = process.env.TENANT_ID; const BARB = process.env.BARBERSHOP_ID; const EMP = process.env.EMPLOYEE_ID; const SVC = process.env.SERVICE_ID;
function isoPlus(min) { const d = new Date(); d.setUTCMinutes(d.getUTCMinutes() + min); return d.toISOString(); }
export default async function testOverlap() {
    A.ok(TENANT && BARB && EMP && SVC, 'env vars');
    const start = isoPlus(180), end = isoPlus(210);
    const p = { tenantId: TENANT, barbershopId: BARB, employeeId: EMP, serviceId: SVC, startAt: start, endAt: end };
    const a = await fetch(`${base}/public/appointments`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(p) });
    A.equal(a.status, 201, 'primeiro booking 201');
    const b = await fetch(`${base}/public/appointments`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(p) });
    A.equal(b.status, 409, 'segundo booking 409 overlap');
    return 'overlap ok';
}






















