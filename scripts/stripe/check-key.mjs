import { strict as assert } from 'assert';

async function checkStripeKey() {
    console.log('🔑 Checking Stripe secret key...');

    const sk = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_key_here';
    if (!sk) {
        throw new Error('Defina STRIPE_SECRET_KEY');
    }

    const headers = {
        'Authorization': `Bearer ${sk}`
    };

    try {
        const response = await fetch('https://api.stripe.com/v1/products?limit=1', {
            headers
        });

        if (response.status !== 200) {
            throw new Error(`HTTP ${response.status}`);
        }

        console.log('✅ Stripe SK: OK (200)');

    } catch (error) {
        console.error('❌ Stripe SK inválida/desativada:', error.message);
        throw error;
    }
}

checkStripeKey().catch(console.error);