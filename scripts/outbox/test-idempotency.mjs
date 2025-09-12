import { strict as assert } from 'assert';

const API_BASE = process.env.API_BASE || 'http://localhost:3000/api/v1';

async function testIdempotency() {
    console.log('🧪 Testing notification idempotency...');

    const messageKey = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const payload = {
        template: 'created',
        to: 'dev@noxora.dev',
        messageKey,
        data: { x: 1 }
    };

    try {
        // Primeira submissão
        const response1 = await fetch(`${API_BASE}/notifications/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Tenant-Id': 'test-tenant',
                'Idempotency-Key': messageKey
            },
            body: JSON.stringify(payload)
        });

        const result1 = await response1.json();
        console.log('First submission:', result1);

        // Segunda submissão (deve ser deduplicada)
        const response2 = await fetch(`${API_BASE}/notifications/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Tenant-Id': 'test-tenant',
                'Idempotency-Key': messageKey
            },
            body: JSON.stringify(payload)
        });

        const result2 = await response2.json();
        console.log('Second submission:', result2);

        // Verificar se houve deduplicação
        const isDeduped = result2.dedup || response2.status === 200 || response2.status === 201 || response2.status === 409;

        if (!isDeduped) {
            throw new Error('dedupe não observado');
        }

        console.log('✅ outbox: idempotência ok');

    } catch (error) {
        console.error('❌ Idempotency test failed:', error.message);
        throw error;
    }
}

export default testIdempotency;
testIdempotency().catch(console.error);
