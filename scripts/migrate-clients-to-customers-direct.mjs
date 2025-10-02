import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function migrateClientsToCustomers() {
    console.log('🚀 Iniciando migração de Client -> Customer + CustomerTenant...');

    try {
        // Buscar todos os clients existentes
        const clientsResult = await pool.query(`
      SELECT c.*, t.name as tenant_name 
      FROM clients c 
      JOIN tenants t ON c."tenantId" = t.id
    `);

        const clients = clientsResult.rows;
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

                // Verificar se Customer já existe
                const existingCustomerResult = await pool.query(
                    'SELECT id FROM customers WHERE email = $1',
                    [normalizedEmail]
                );

                let customerId;
                if (existingCustomerResult.rows.length > 0) {
                    customerId = existingCustomerResult.rows[0].id;
                    console.log(`✅ Customer já existe ${customerId} para email ${normalizedEmail}`);
                } else {
                    // Criar Customer se não existir
                    const passwordHash = await bcrypt.hash('temp-password-123', 12);

                    const newCustomerResult = await pool.query(`
            INSERT INTO customers (id, email, "passwordHash", name, phone, "createdAt", "updatedAt")
            VALUES (gen_random_uuid()::text, $1, $2, $3, $4, NOW(), NOW())
            RETURNING id
          `, [normalizedEmail, passwordHash, client.name, client.phone || null]);

                    customerId = newCustomerResult.rows[0].id;
                    console.log(`✅ Criado Customer ${customerId} para email ${normalizedEmail}`);
                }

                // Verificar se CustomerTenant já existe
                const existingCustomerTenantResult = await pool.query(`
          SELECT id FROM customer_tenants 
          WHERE "customerId" = $1 AND "tenantId" = $2
        `, [customerId, client.tenantId]);

                if (existingCustomerTenantResult.rows.length === 0) {
                    // Criar CustomerTenant se não existir
                    await pool.query(`
            INSERT INTO customer_tenants (id, "customerId", "tenantId", status, roles, "createdAt", "updatedAt")
            VALUES (gen_random_uuid()::text, $1, $2, 'active', ARRAY['client'], NOW(), NOW())
          `, [customerId, client.tenantId]);

                    console.log(`✅ Criado CustomerTenant para Customer ${customerId} + Tenant ${client.tenantId}`);
                }

                // Atualizar appointments para referenciar o Customer
                const appointmentsResult = await pool.query(`
          UPDATE appointments 
          SET "customerId" = $1 
          WHERE "clientId" = $2
        `, [customerId, client.id]);

                if (appointmentsResult.rowCount > 0) {
                    console.log(`✅ Atualizados ${appointmentsResult.rowCount} appointments para Customer ${customerId}`);
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
        await pool.end();
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


