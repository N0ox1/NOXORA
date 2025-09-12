import { strict as A } from 'assert';
import { execSync } from 'node:child_process';
export default async function testIndexes() {
    const text = execSync('type prisma\\schema.prisma', { shell: true }).toString();
    A.ok(text.includes('@@index([tenantId, employeeId, startAt])'), 'idx employee');
    A.ok(text.includes('@@index([tenantId, barbershopId, startAt])'), 'idx shop');
    return 'indexes ok';
}
