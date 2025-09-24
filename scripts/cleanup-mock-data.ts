import { PrismaClient } from '@prisma/client';

type CleanupFlags = {
    force: boolean;
};

function parseFlags(argv: string[]): CleanupFlags {
    return {
        force: argv.includes('--force') || argv.includes('-f'),
    };
}

function logHeader(title: string) {
    console.log('\n' + '='.repeat(60));
    console.log(title);
    console.log('='.repeat(60));
}

async function main() {
    const flags = parseFlags(process.argv.slice(2));
    const prisma = new PrismaClient();

    // Regras conhecidas de mock/seed
    const MOCK_TENANT_IDS = ['tnt_1'];
    const MOCK_TENANT_DOMAINS = ['t_dev'];
    const MOCK_BARBERSHOP_SLUGS = ['barber-labs-centro', 'main'];
    const MOCK_EMPLOYEE_EMAILS = ['owner@noxora.dev'];

    logHeader('🔎 Procurando dados mockados no banco');

    // 1) Encontrar tenants candidatos por id/domain
    const tenantsByIdOrDomain = await prisma.tenant.findMany({
        where: {
            OR: [
                { id: { in: MOCK_TENANT_IDS } },
                { domain: { in: MOCK_TENANT_DOMAINS } },
            ],
        },
        include: {
            _count: {
                select: {
                    barbershops: true,
                    employees: true,
                    services: true,
                    clients: true,
                    appointments: true,
                    subscriptions: true,
                    clientSubscriptions: true,
                    auditLogs: true,
                    RefreshToken: true,
                },
            },
        },
    });

    // 2) Encontrar tenants por barbershops com slugs conhecidos (pode incluir t_dev e seeds)
    const barbershops = await prisma.barbershop.findMany({
        where: { slug: { in: MOCK_BARBERSHOP_SLUGS } },
        select: { id: true, tenantId: true, slug: true, name: true },
    });
    const tenantIdsFromShops = Array.from(new Set(barbershops.map((b) => b.tenantId)));
    const tenantsByShops = await prisma.tenant.findMany({
        where: { id: { in: tenantIdsFromShops } },
        include: {
            _count: {
                select: {
                    barbershops: true,
                    employees: true,
                    services: true,
                    clients: true,
                    appointments: true,
                    subscriptions: true,
                    clientSubscriptions: true,
                    auditLogs: true,
                    RefreshToken: true,
                },
            },
        },
    });

    // 3) Funcionários de e-mails de teste (apenas para diagnóstico; remoção ocorre via tenant)
    const testEmployees = await prisma.employee.findMany({
        where: { email: { in: MOCK_EMPLOYEE_EMAILS } },
        select: { id: true, email: true, tenantId: true, barbershopId: true, name: true },
    });

    // Consolidar tenants únicos a remover
    const tenantMap: Record<string, (typeof tenantsByIdOrDomain)[number]> = {};
    for (const t of tenantsByIdOrDomain) tenantMap[t.id] = t;
    for (const t of tenantsByShops) tenantMap[t.id] = tenantMap[t.id] || t;

    const tenantsToRemove = Object.values(tenantMap);

    if (tenantsToRemove.length === 0) {
        console.log('✅ Nenhum tenant mock encontrado (tudo limpo).');
    } else {
        console.log(`⚠️  Encontrados ${tenantsToRemove.length} tenant(s) candidatos a remoção:`);
        for (const t of tenantsToRemove) {
            console.log(` - Tenant ${t.id} | name=${t.name} | domain=${t.domain ?? '-'} | active=${t.isActive}`);
            console.log(
                `   _count => shops=${t._count.barbershops}, employees=${t._count.employees}, services=${t._count.services}, clients=${t._count.clients}, appts=${t._count.appointments}, subs=${t._count.subscriptions}, clientSubs=${t._count.clientSubscriptions}, audit=${t._count.auditLogs}, refresh=${t._count.RefreshToken}`
            );
        }
    }

    if (barbershops.length > 0) {
        console.log(`\n🏪 Barbershops com slugs mock: ${barbershops.length}`);
        for (const b of barbershops) {
            console.log(` - ${b.id} slug=${b.slug} name=${b.name} tenantId=${b.tenantId}`);
        }
    }

    if (testEmployees.length > 0) {
        console.log(`\n👤 Employees com e-mails de teste (${MOCK_EMPLOYEE_EMAILS.join(', ')}): ${testEmployees.length}`);
        for (const e of testEmployees) {
            console.log(` - ${e.id} ${e.email} name=${e.name} tenantId=${e.tenantId} barbershopId=${e.barbershopId}`);
        }
    }

    if (!flags.force) {
        logHeader('🧪 Dry-run completo. Execute com --force para apagar.');
        await prisma.$disconnect();
        return;
    }

    if (tenantsToRemove.length === 0) {
        console.log('Nada a remover.');
        await prisma.$disconnect();
        return;
    }

    logHeader('🗑️  Removendo dados mockados (EXECUÇÃO REAL)');

    // Remoção por tenant com CASCADE nas FKs
    for (const t of tenantsToRemove) {
        console.log(`Removendo tenant ${t.id} (${t.name}) ...`);
        await prisma.tenant.delete({ where: { id: t.id } });
        console.log(` - OK: ${t.id}`);
    }

    console.log('\n✅ Concluído.');
    await prisma.$disconnect();
}

main().catch((err) => {
    console.error('💥 Erro na limpeza de mocks:', err);
    process.exit(1);
});


