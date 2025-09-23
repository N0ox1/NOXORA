import { strict as assert } from 'assert';

const API_BASE = process.env.API_BASE || 'http://localhost:3000/api/v1';

async function testWebhook() {
    console.log('🔗 Testing Stripe webhook...');

    try {
        const event = {
            id: 'evt_test_1',
            type: 'checkout.session.completed',
            object: 'event',
            data: {
                object: {
                    id: 'cs_test_1',
                    object: 'checkout.session'
                }
            }
        };

        const response = await fetch(`${API_BASE}/webhooks/stripe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(event)
        });

        if (response.status !== 200) {
            throw new Error(`Expected 200, got ${response.status}`);
        }

        const result = await response.json();
        console.log('Webhook response:', result);

        console.log('✅ Stripe webhook: OK (200)');

    } catch (error) {
        console.error('❌ Stripe webhook test failed:', error.message);
        throw error;
    }
}

testWebhook().catch(console.error);
















