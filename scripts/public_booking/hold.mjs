import { strict as A } from 'assert';
const base = 'http://localhost:3000/api/v1';
const TENANT = process.env.TENANT_ID; const BARB = process.env.BARBERSHOP_ID; const EMP = process.env.EMPLOYEE_ID; const SVC = process.env.SERVICE_ID;
function isoPlus(min) { const d = new Date(); d.setUTCMinutes(d.getUTCMinutes() + min); return d.toISOString(); }
export default async function testHold() {
    A.ok(TENANT && BARB && EMP && SVC, 'env vars');
    const start = isoPlus(240), end = isoPlus(270);
    const p = { tenantId: TENANT, barbershopId: BARB, employeeId: EMP, serviceId: SVC, startAt: start, endAt: end };
    const r = await fetch(`${base}/public/appointments`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(p) });
    A.ok([201, 409].includes(r.status), `hold/confirm 201/409 got ${r.status}`);
    return 'hold ok';
}




