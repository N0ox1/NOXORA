import { strict as assert } from 'assert';

const API_BASE = process.env.API_BASE || 'http://localhost:3000/api/v1';

async function testTemplates() {
    console.log('🧪 Testing notification templates...');

    const templates = ['created', 'confirmed', 'cancelled', 'reminder24h'];

    for (const template of templates) {
        try {
            const response = await fetch(`${API_BASE}/notifications/test`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Tenant-Id': 'test-tenant',
                    'Idempotency-Key': `test-${template}-${Date.now()}`
                },
                body: JSON.stringify({
                    template,
                    to: 'dev@noxora.dev',
                    data: { foo: 'bar' }
                })
            });

            const result = await response.json();

            if (!result.id) {
                throw new Error('enqueue falhou');
            }

            const id = result.id;
            console.log(`✅ Template ${template}: enqueued with ID ${id}`);

            // Aguardar processamento
            let status = 'PENDING';
            for (let i = 0; i < 30; i++) {
                await new Promise(resolve => setTimeout(resolve, 500));

                const statusResponse = await fetch(`${API_BASE}/notifications/status/${id}`, {
                    headers: {
                        'X-Tenant-Id': 'test-tenant'
                    }
                });

                const statusResult = await statusResponse.json();
                status = statusResult.status;

                if (status === 'SENT' || status === 'FAILED') {
                    break;
                }
            }

            if (status !== 'SENT') {
                throw new Error(`esperado SENT; veio ${status}`);
            }

            console.log(`✅ Template ${template}: status=${status}`);

        } catch (error) {
            console.error(`❌ Template ${template} failed:`, error.message);
            throw error;
        }
    }

    console.log('✅ outbox: templates ok');
}

export default testTemplates;
testTemplates().catch(console.error);
