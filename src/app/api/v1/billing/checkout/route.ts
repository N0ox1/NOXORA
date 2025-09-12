import { NextRequest, NextResponse } from 'next/server';
import { stripe, stripeConfig } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import type Stripe from 'stripe';

export async function POST(req: NextRequest) {
    try {
        const { priceId, planCode, cadence = 'monthly', customerId, couponCode, successUrl, cancelUrl } = await req.json();
        const tenantId = req.headers.get('x-tenant-id');

        if (!tenantId) {
            return NextResponse.json(
                { code: 'missing_tenant', message: 'X-Tenant-Id required' },
                { status: 400 }
            );
        }

        // Se priceId for fornecido, usar diretamente
        let stripePriceId = priceId;

        if (!stripePriceId && planCode) {
            // Encontrar o plano
            const plan = stripeConfig.plans.find(p => p.code === planCode);
            if (!plan) {
                return NextResponse.json(
                    { code: 'invalid_plan', message: 'Plan not found' },
                    { status: 404 }
                );
            }

            // Encontrar o preço
            const price = plan.prices.find(p => p.cadence === cadence);
            if (!price) {
                return NextResponse.json(
                    { code: 'invalid_cadence', message: 'Cadence not found for this plan' },
                    { status: 400 }
                );
            }

            // Se não há priceId no plano, retornar erro
            if (!price.priceId) {
                return NextResponse.json(
                    { code: 'no_price_id', message: 'Price ID not configured for this plan/cadence' },
                    { status: 400 }
                );
            }

            stripePriceId = price.priceId;
        }

        if (!stripePriceId) {
            return NextResponse.json(
                { code: 'missing_price', message: 'priceId or planCode is required' },
                { status: 400 }
            );
        }

        // Buscar ou criar customer no Stripe
        let stripeCustomerId = customerId;
        if (!stripeCustomerId) {
            const tenant = await prisma.tenant.findUnique({
                where: { id: tenantId },
                select: { name: true }
            });

            const customer = await stripe.customers.create({
                name: tenant?.name || 'Noxora Customer',
                metadata: { tenantId }
            });
            stripeCustomerId = customer.id;
        }

        // Configurar a sessão de checkout
        const sessionConfig: Stripe.Checkout.SessionCreateParams = {
            customer: stripeCustomerId,
            payment_method_types: ['card'],
            mode: 'subscription',
            line_items: [
                {
                    price: stripePriceId,
                    quantity: 1,
                },
            ],
            success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/account/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/account/billing?canceled=true`,
            metadata: {
                tenantId,
                planCode: planCode || 'unknown',
                cadence: cadence || 'monthly',
            },
        };

        // Adicionar cupom se fornecido
        if (couponCode) {
            sessionConfig.discounts = [
                {
                    coupon: couponCode,
                },
            ];
        }

        const session = await stripe.checkout.sessions.create(sessionConfig);

        return NextResponse.json({
            sessionId: session.id,
            url: session.url,
        });

    } catch (error) {
        console.error('Error creating checkout session:', error);

        return NextResponse.json(
            {
                code: 'checkout_error',
                message: 'Failed to create checkout session',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
