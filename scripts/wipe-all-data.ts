import { PrismaClient } from '@prisma/client';

type Flags = { force: boolean };

function parseFlags(argv: string[]): Flags {
    return { force: argv.includes('--force') || argv.includes('-f') };
}

function header(title: string) {
    console.log('\n' + '='.repeat(60));
    console.log(title);
    console.log('='.repeat(60));
}

async function countAll(prisma: PrismaClient) {
    const [
        tenants,
        barbershops,
        employees,
        services,
        clients,
        appointments,
        subscriptions,
        clientSubs,
        auditLogs,
        refreshTokens,
        pwdResets,
        idempotency
    ] = await Promise.all([
        prisma.tenant.count(),
        prisma.barbershop.count(),
        prisma.employee.count(),
        prisma.service.count(),
        prisma.client.count(),
        prisma.appointment.count(),
        prisma.subscription.count(),
        prisma.clientSubscription.count(),
        prisma.auditLog.count(),
        prisma.refreshToken.count(),
        prisma.passwordResetToken.count(),
        prisma.idempotencyRequest.count(),
    ]);
    return { tenants, barbershops, employees, services, clients, appointments, subscriptions, clientSubs, auditLogs, refreshTokens, pwdResets, idempotency };
}

async function main() {
    const flags = parseFlags(process.argv.slice(2));
    const prisma = new PrismaClient();

    header('📊 Contagem atual de registros (pré)');
    const pre = await countAll(prisma);
    console.table(pre);

    if (!flags.force) {
        header('🧪 Dry-run: execute com --force para apagar todos os dados');
        await prisma.$disconnect();
        return;
    }

    header('🗑️  Limpando todas as tabelas (EXECUÇÃO REAL)');
    // Ordem segura: filhos -> pais
    await prisma.$transaction([
        prisma.idempotencyRequest.deleteMany({}),
        prisma.passwordResetToken.deleteMany({}),
        prisma.refreshToken.deleteMany({}),
        prisma.auditLog.deleteMany({}),
        prisma.appointment.deleteMany({}),
        prisma.clientSubscription.deleteMany({}),
        prisma.subscription.deleteMany({}),
        prisma.service.deleteMany({}),
        prisma.employee.deleteMany({}),
        prisma.client.deleteMany({}),
        prisma.barbershop.deleteMany({}),
        prisma.tenant.deleteMany({}),
    ]);

    header('✅ Contagem após limpeza (pós)');
    const post = await countAll(prisma);
    console.table(post);

    await prisma.$disconnect();
}

main().catch((err) => {
    console.error('💥 Erro ao limpar dados:', err);
    process.exit(1);
});


