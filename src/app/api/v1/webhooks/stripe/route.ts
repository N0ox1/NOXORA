export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/app/api/(helpers)/handler';
import { validate } from '@/lib/validate';
import { stripeWebhook } from '@/lib/validation/schemas';

export const { POST } = api({
    POST: async (req: NextRequest) => {
        // Validate Stripe signature
        const signature = req.headers.get('stripe-signature');
        if (!signature) {
            return new Response(
                JSON.stringify({ code: 'bad_request', msg: 'missing_stripe_signature' }),
                { status: 400, headers: { 'content-type': 'application/json' } }
            );
        }

        // TODO: Verify Stripe signature using webhook secret
        // const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        // const payload = await req.text();
        // const sig = req.headers.get('stripe-signature');
        // const event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);

        // Validate body
        const data = await validate(req, stripeWebhook);

        // TODO: Implement actual webhook processing
        // This is a placeholder response
        return new Response(
            JSON.stringify({
                received: true,
                eventId: data.id,
                eventType: data.type,
                processedAt: new Date().toISOString()
            }),
            { status: 200, headers: { 'content-type': 'application/json' } }
        );
    }
});