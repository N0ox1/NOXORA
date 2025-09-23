import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function processOutbox() {
    console.log('🔄 Starting Outbox Worker...');

    while (true) {
        try {
            // Buscar notificações pendentes
            const pendingNotifications = await prisma.outbox.findMany({
                where: {
                    status: 'PENDING',
                    attempts: { lt: 5 } // Menos que 5 tentativas
                },
                orderBy: { createdAt: 'asc' },
                take: 10 // Processar 10 por vez
            });

            if (pendingNotifications.length === 0) {
                console.log('⏳ No pending notifications, waiting...');
                await new Promise(resolve => setTimeout(resolve, 5000));
                continue;
            }

            console.log(`📨 Processing ${pendingNotifications.length} notifications...`);

            for (const notification of pendingNotifications) {
                await processNotification(notification);
            }

        } catch (error) {
            console.error('❌ Worker error:', error);
            await new Promise(resolve => setTimeout(resolve, 10000));
        }
    }
}

async function processNotification(notification) {
    try {
        console.log(`📤 Processing notification ${notification.id}...`);

        // Simular envio de notificação
        const success = await simulateNotificationSend(notification);

        if (success) {
            // Marcar como enviada
            await prisma.outbox.update({
                where: { id: notification.id },
                data: {
                    status: 'SENT',
                    updatedAt: new Date()
                }
            });
            console.log(`✅ Notification ${notification.id} sent successfully`);
        } else {
            // Incrementar tentativas
            const newAttempts = notification.attempts + 1;
            const newStatus = newAttempts >= notification.maxAttempts ? 'FAILED' : 'PENDING';

            await prisma.outbox.update({
                where: { id: notification.id },
                data: {
                    attempts: newAttempts,
                    status: newStatus,
                    error: success ? null : 'Simulated failure',
                    updatedAt: new Date()
                }
            });

            if (newStatus === 'FAILED') {
                console.log(`❌ Notification ${notification.id} failed after ${newAttempts} attempts`);
            } else {
                console.log(`⚠️ Notification ${notification.id} failed, retrying (${newAttempts}/${notification.maxAttempts})`);
            }
        }

    } catch (error) {
        console.error(`❌ Error processing notification ${notification.id}:`, error);

        // Marcar como erro
        await prisma.outbox.update({
            where: { id: notification.id },
            data: {
                attempts: notification.attempts + 1,
                status: 'FAILED',
                error: error.message,
                updatedAt: new Date()
            }
        });
    }
}

async function simulateNotificationSend(notification) {
    // Simular falha para emails específicos
    if (notification.to.includes('fail@force.invalid')) {
        return false;
    }

    // Simular falha aleatória (10% de chance)
    if (Math.random() < 0.1) {
        return false;
    }

    // Simular delay de envio
    await new Promise(resolve => setTimeout(resolve, 1000));

    return true;
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('🛑 Shutting down Outbox Worker...');
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('🛑 Shutting down Outbox Worker...');
    await prisma.$disconnect();
    process.exit(0);
});

// Iniciar worker
processOutbox().catch(console.error);















