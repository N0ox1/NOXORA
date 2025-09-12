import Stripe from 'stripe';
import { config } from './config';

// Configuração do Stripe
const stripeConfig = {
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_YOUR_STRIPE_PUBLISHABLE_KEY_HERE',
  secretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_YOUR_STRIPE_SECRET_KEY_HERE',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_your_webhook_secret_here',
  webhookEndpoint: '/api/v1/webhooks/stripe',
  idempotency: {
    enabled: true,
    keyPrefix: 'stripe:event:',
    dedupeBy: 'event.id'
  },
  reconciliation: {
    enabled: true,
    frequency: 'daily',
    cron: '0 3 * * *'
  },
  billingPortal: {
    enabled: true,
    returnUrl: 'https://app.noxora.dev/account/billing'
  },
  plans: [
    {
      code: 'starter',
      product: {
        name: 'Starter',
        productId: null
      },
      prices: [
        {
          cadence: 'monthly',
          priceId: null,
          currency: 'BRL',
          unitAmount: 2900
        },
        {
          cadence: 'yearly',
          priceId: null,
          currency: 'BRL',
          unitAmount: 29000
        }
      ],
      trialDays: 14,
      couponsAllowed: true,
      limits: {
        employees: 3,
        appointmentsPerMonth: 500,
        notificationsPerMonth: 2000
      }
    },
    {
      code: 'pro',
      product: {
        name: 'Pro',
        productId: null
      },
      prices: [
        {
          cadence: 'monthly',
          priceId: null,
          currency: 'BRL',
          unitAmount: 7900
        },
        {
          cadence: 'yearly',
          priceId: null,
          currency: 'BRL',
          unitAmount: 79000
        }
      ],
      trialDays: 14,
      couponsAllowed: true,
      limits: {
        employees: 15,
        appointmentsPerMonth: 5000,
        notificationsPerMonth: 20000
      }
    }
  ],
  webhooks: {
    listen: [
      'checkout.session.completed',
      'invoice.paid',
      'invoice.payment_failed',
      'customer.subscription.updated',
      'payment_intent.succeeded',
      'payment_intent.payment_failed'
    ],
    idempotencyByEventId: true
  },
  enforceLimits: {
    enabled: true,
    sources: ['stripe.subscription', 'local.cache'],
    onBreach: 'block_and_notify'
  }
};

// Inicializar cliente Stripe
export const stripe = new Stripe(stripeConfig.secretKey, {
  apiVersion: '2023-10-16',
  typescript: true,
});

// Funções utilitárias para Stripe
export class StripeService {
  /**
   * Valida assinatura do webhook
   */
  static validateWebhookSignature(payload: string, signature: string): boolean {
    try {
      const elements = signature.split(',');
      const timestamp = elements.find(el => el.startsWith('t='))?.split('=')[1];
      const v1 = elements.find(el => el.startsWith('v1='))?.split('=')[1];

      if (!timestamp || !v1) {
        return false;
      }

      const expectedSignature = Stripe.webhooks.generateTestHeaderString({
        payload,
        secret: stripeConfig.webhookSecret,
        timestamp: parseInt(timestamp),
      });

      return expectedSignature === signature;
    } catch (error) {
      console.error('Error validating webhook signature:', error);
      return false;
    }
  }

  /**
   * Cria sessão de checkout
   */
  static async createCheckoutSession(params: {
    tenantId: string;
    planCode: string;
    cadence: 'monthly' | 'yearly';
    customerId?: string;
    couponCode?: string;
  }) {
    const plan = stripeConfig.plans.find(p => p.code === params.planCode);
    if (!plan) {
      throw new Error(`Plan ${params.planCode} not found`);
    }

    const price = plan.prices.find(p => p.cadence === params.cadence);
    if (!price) {
      throw new Error(`Price for ${params.cadence} not found`);
    }

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      customer: params.customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: price.currency.toLowerCase(),
            product_data: {
              name: plan.product.name,
            },
            unit_amount: price.unitAmount,
            recurring: {
              interval: params.cadence === 'yearly' ? 'year' : 'month',
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/account/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/account/billing?canceled=true`,
      metadata: {
        tenantId: params.tenantId,
        planCode: params.planCode,
        cadence: params.cadence,
      },
    };

    // Adicionar trial se configurado
    if (plan.trialDays > 0) {
      sessionConfig.subscription_data = {
        trial_period_days: plan.trialDays,
      };
    }

    // Adicionar cupom se fornecido
    if (params.couponCode && plan.couponsAllowed) {
      sessionConfig.discounts = [
        {
          coupon: params.couponCode,
        },
      ];
    }

    return await stripe.checkout.sessions.create(sessionConfig);
  }

  /**
   * Cria sessão do portal de billing
   */
  static async createBillingPortalSession(customerId: string, returnUrl?: string) {
    return await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || stripeConfig.billingPortal.returnUrl,
    });
  }

  /**
   * Processa evento do webhook
   */
  static async processWebhookEvent(event: Stripe.Event) {
    console.log(`Processing Stripe event: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        return await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);

      case 'customer.subscription.created':
        return await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);

      case 'customer.subscription.updated':
        return await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);

      case 'invoice.payment_succeeded':
        return await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);

      case 'invoice.payment_failed':
        return await this.handlePaymentFailed(event.data.object as Stripe.Invoice);

      default:
        console.log(`Unhandled event type: ${event.type}`);
        return { processed: false, message: 'Event type not handled' };
    }
  }

  private static async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    console.log('Checkout session completed:', session.id);
    // Implementar lógica de ativação do plano
    return { processed: true, message: 'Checkout session processed' };
  }

  private static async handleSubscriptionCreated(subscription: Stripe.Subscription) {
    console.log('Subscription created:', subscription.id);
    // Implementar lógica de criação de assinatura
    return { processed: true, message: 'Subscription created' };
  }

  private static async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    console.log('Subscription updated:', subscription.id);
    // Implementar lógica de atualização de assinatura
    return { processed: true, message: 'Subscription updated' };
  }

  private static async handlePaymentSucceeded(invoice: Stripe.Invoice) {
    console.log('Payment succeeded:', invoice.id);
    // Implementar lógica de pagamento bem-sucedido
    return { processed: true, message: 'Payment succeeded' };
  }

  private static async handlePaymentFailed(invoice: Stripe.Invoice) {
    console.log('Payment failed:', invoice.id);
    // Implementar lógica de falha no pagamento
    return { processed: true, message: 'Payment failed' };
  }
}

export { stripeConfig };