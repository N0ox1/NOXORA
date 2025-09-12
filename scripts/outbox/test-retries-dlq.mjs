import { strict as assert } from 'assert';

const API_BASE = process.env.API_BASE || 'http://localhost:3000/api/v1';

async function testRetriesDLQ() {
    console.log('🧪 Testing retries and DLQ...');

    try {
        const payload = {
            template: 'created',
            to: 'fail@force.invalid',
            forceFail: true
        };

        const response = await fetch(`${API_BASE}/notifications/test`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Tenant-Id': 'test-tenant',
                'Idempotency-Key': `test-retry-${Date.now()}`
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        const id = result.id;

        if (!id) {
            throw new Error('Failed to create notification');
        }

        console.log(`Created notification with ID: ${id}`);

        // Aguardar processamento com retries
        let status = 'PENDING';
        for (let i = 0; i < 40; i++) {
            await new Promise(resolve => setTimeout(resolve, 500));

            const statusResponse = await fetch(`${API_BASE}/notifications/status/${id}`, {
                headers: {
                    'X-Tenant-Id': 'test-tenant'
                }
            });

            const statusResult = await statusResponse.json();
            status = statusResult.status;

            console.log(`Attempt ${i + 1}: status=${status}`);

            if (status === 'FAILED' || status === 'DLQ') {
                break;
            }
        }

        if (status !== 'FAILED' && status !== 'DLQ') {
            throw new Error(`esperado FAILED/DLQ; veio ${status}`);
        }

        console.log(`✅ outbox: retries/DLQ ok - final status: ${status}`);

    } catch (error) {
        console.error('❌ Retries/DLQ test failed:', error.message);
        throw error;
    }
}

export default testRetriesDLQ;
testRetriesDLQ().catch(console.error);
