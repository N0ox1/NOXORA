import { strict as assert } from 'assert';

async function checkProductsPrices() {
    console.log('📦 Checking Stripe products and prices...');

    const sk = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';
    if (!sk) {
        throw new Error('Defina STRIPE_SECRET_KEY');
    }

    const headers = {
        'Authorization': `Bearer ${sk}`
    };

    try {
        // Buscar produtos
        const productsResponse = await fetch('https://api.stripe.com/v1/products?active=true&limit=10', {
            headers
        });

        if (productsResponse.status !== 200) {
            throw new Error(`Products API returned ${productsResponse.status}`);
        }

        const products = await productsResponse.json();
        console.log('Produtos:', JSON.stringify(products, null, 2));

        // Buscar preços
        const pricesResponse = await fetch('https://api.stripe.com/v1/prices?active=true&limit=10', {
            headers
        });

        if (pricesResponse.status !== 200) {
            throw new Error(`Prices API returned ${pricesResponse.status}`);
        }

        const prices = await pricesResponse.json();
        console.log('Prices:', JSON.stringify(prices, null, 2));

        console.log('✅ Stripe: produtos/prices listados');

    } catch (error) {
        console.error('❌ Stripe products/prices check failed:', error.message);
        throw error;
    }
}

checkProductsPrices().catch(console.error);
