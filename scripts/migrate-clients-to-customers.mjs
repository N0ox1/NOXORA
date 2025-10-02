import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function migrateClientsToCustomers() {
    console.log('🚀 Iniciando migração de Client -> Customer + CustomerTenant...');

    try {
        // Buscar todos os clients existentes
        const clients = await prisma.client.findMany({
            include: {
                tenant: true,
                appointments: true,
                subscriptions: true
            }
        });

        console.log(`📊 Encontrados ${clients.length} clients para migrar`);

        let migratedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        for (const client of clients) {
            try {
                // Verificar se já existe um Customer com este email
                if (!client.email) {
                    console.log(`⚠️  Client ${client.id} não tem email, pulando...`);
                    skippedCount++;
                    continue;
                }

                const normalizedEmail = client.email.toLowerCase().trim();

                let customer = await prisma.customer.findUnique({
                    where: { email: normalizedEmail }
                });

                if (!customer) {
                    // Criar Customer se não existir
                    const passwordHash = await bcrypt.hash('temp-password-123', 12);

                    customer = await prisma.customer.create({
                        data: {
                            email: normalizedEmail,
                            passwordHash,
                            name: client.name,
                            phone: client.phone || null
                        }
                    });

                    console.log(`✅ Criado Customer ${customer.id} para email ${normalizedEmail}`);
                }

                // Criar CustomerTenant se não existir
                const existingCustomerTenant = await prisma.customerTenant.findUnique({
                    where: {
                        customerId_tenantId: {
                            customerId: customer.id,
                            tenantId: client.tenantId
                        }
                    }
                });

                if (!existingCustomerTenant) {
                    await prisma.customerTenant.create({
                        data: {
                            customerId: customer.id,
                            tenantId: client.tenantId,
                            status: 'active',
                            roles: ['client']
                        }
                    });

                    console.log(`✅ Criado CustomerTenant para Customer ${customer.id} + Tenant ${client.tenantId}`);
                }

                // Atualizar appointments para referenciar o Customer
                if (client.appointments.length > 0) {
                    await prisma.appointment.updateMany({
                        where: { clientId: client.id },
                        data: { customerId: customer.id }
                    });

                    console.log(`✅ Atualizados ${client.appointments.length} appointments para Customer ${customer.id}`);
                }

                // Atualizar subscriptions para referenciar o Customer
                if (client.subscriptions.length > 0) {
                    await prisma.subscription.updateMany({
                        where: {
                            id: { in: client.subscriptions.map(s => s.id) }
                        },
                        data: { customerId: customer.id }
                    });

                    console.log(`✅ Atualizadas ${client.subscriptions.length} subscriptions para Customer ${customer.id}`);
                }

                migratedCount++;

            } catch (error) {
                console.error(`❌ Erro ao migrar Client ${client.id}:`, error);
                errorCount++;
            }
        }

        console.log('\n📈 Resumo da migração:');
        console.log(`✅ Migrados com sucesso: ${migratedCount}`);
        console.log(`⚠️  Pulados (sem email): ${skippedCount}`);
        console.log(`❌ Erros: ${errorCount}`);
        console.log(`📊 Total processados: ${clients.length}`);

    } catch (error) {
        console.error('❌ Erro geral na migração:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Executar migração
migrateClientsToCustomers()
    .then(() => {
        console.log('🎉 Migração concluída!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('💥 Erro fatal na migração:', error);
        process.exit(1);
    });
