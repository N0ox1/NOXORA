import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
    try {
        console.log('Checking existing data...');

        // Verificar tenants
        const tenants = await prisma.tenant.findMany({
            select: { id: true, name: true }
        });
        console.log('Tenants:', tenants);

        // Verificar employees
        const employees = await prisma.employee.findMany({
            select: { id: true, name: true, tenantId: true }
        });
        console.log('Employees:', employees);

        // Verificar services
        const services = await prisma.service.findMany({
            select: { id: true, name: true, tenantId: true }
        });
        console.log('Services:', services);

        // Verificar clients
        const clients = await prisma.client.findMany({
            select: { id: true, name: true, tenantId: true }
        });
        console.log('Clients:', clients);

        // Verificar appointments
        const appointments = await prisma.appointment.findMany({
            select: { id: true, tenantId: true, startAt: true, status: true }
        });
        console.log('Appointments:', appointments);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkData();












