import { config } from '@/lib/config';
import redis from '@/lib/redis';
import { logger } from '@/lib/logger';
import { stripe } from '@/lib/stripe';
import {
  type StripeWebhookPayload,
  type StripeEventType,
  type OutboundWebhookEvent,
  type OutboundWebhookPayload,
  type WebhookSubscription,
  type WebhookDeliveryAttempt,
  type WebhookLog,
  type WebhookValidationResult,
  isValidStripeEvent,
  isValidOutboundEvent,
  createOutboundPayload,
  calculateWebhookSignature,
  validateWebhookSignature
} from '@/types/webhooks';

export class WebhookService {
  private static instance: WebhookService;
  private webhookConfig = config.webhooks;

  private constructor() {}

  public static getInstance(): WebhookService {
    if (!WebhookService.instance) {
      WebhookService.instance = new WebhookService();
    }
    return WebhookService.instance;
  }

  // ===== WEBHOOKS INBOUND (Recebidos) =====

  /**
   * Processa webhook recebido do Stripe
   */
  async processStripeWebhook(
    payload: StripeWebhookPayload,
    signature: string,
    timestamp: number
  ): Promise<{ success: boolean; message: string }> {
    try {
      const startTime = Date.now();

      // Validar assinatura do webhook
      const validation = this.validateStripeWebhookSignature(
        payload,
        signature,
        timestamp
      );

      if (!validation.isValid) {
        logger.error('Invalid Stripe webhook signature', {
          error: validation.error,
          webhookId: payload.id,
          eventType: payload.type,
        });
        return { success: false, message: 'Invalid signature' };
      }

      // Verificar se o evento é suportado
      if (!isValidStripeEvent(payload.type)) {
        logger.warn('Unsupported Stripe event type', {
          eventType: payload.type,
          webhookId: payload.id,
        });
        return { success: false, message: 'Unsupported event type' };
      }

      // Processar evento baseado no tipo
      await this.handleStripeEvent(payload);

      // Registrar log de sucesso
      const processingTime = Date.now() - startTime;
      await this.logWebhook({
        webhook_id: payload.id,
        event_type: payload.type,
        direction: 'inbound',
        status: 'success',
        payload_size: JSON.stringify(payload).length,
        processing_time_ms: processingTime,
        created_at: new Date(),
      });

      logger.info('Stripe webhook processed successfully', {
        webhookId: payload.id,
        eventType: payload.type,
        processingTime,
      });

      return { success: true, message: 'Webhook processed successfully' };

    } catch (error) {
      logger.error('Failed to process Stripe webhook', {
        error: error instanceof Error ? error.message : String(error),
        webhookId: payload.id,
        eventType: payload.type,
      });

      // Registrar log de falha
      await this.logWebhook({
        webhook_id: payload.id,
        event_type: payload.type,
        direction: 'inbound',
        status: 'failed',
        payload_size: JSON.stringify(payload).length,
        processing_time_ms: 0,
        error_message: error instanceof Error ? error.message : String(error),
        created_at: new Date(),
      });

      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Valida assinatura do webhook do Stripe
   */
  private validateStripeWebhookSignature(
    payload: StripeWebhookPayload,
    signature: string,
    timestamp: number
  ): WebhookValidationResult {
    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret) {
        return {
          isValid: false,
          error: 'Webhook secret not configured'
        };
      }

      // Para Stripe, usar a validação nativa
      const event = stripe.webhooks.constructEvent(
        JSON.stringify(payload),
        signature,
        webhookSecret
      );

      return {
        isValid: true,
        signature,
        timestamp
      };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Signature validation failed'
      };
    }
  }

  /**
   * Processa eventos específicos do Stripe
   */
  private async handleStripeEvent(payload: StripeWebhookPayload): Promise<void> {
    const eventType = payload.type;
    const eventData = payload.data.object;

    switch (eventType) {
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(eventData);
        break;
      
      case 'customer.subscription.created':
        await this.handleSubscriptionCreated(eventData);
        break;
      
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(eventData);
        break;
      
      case 'invoice.payment_failed':
        await this.handlePaymentFailed(eventData);
        break;
      
      default:
        logger.warn('Unhandled Stripe event type', { eventType });
    }
  }

  private async handleCheckoutSessionCompleted(session: any): Promise<void> {
    logger.info('Processing checkout session completed', {
      sessionId: session.id,
      customerId: session.customer,
      amount: session.amount_total,
    });

    // TODO: Implementar lógica de negócio
    // - Atualizar status do tenant
    // - Ativar recursos baseados no plano
    // - Enviar confirmação por email
  }

  private async handleSubscriptionCreated(subscription: any): Promise<void> {
    logger.info('Processing subscription created', {
      subscriptionId: subscription.id,
      customerId: subscription.customer,
      planId: subscription.items.data[0]?.price.id,
    });

    // TODO: Implementar lógica de negócio
    // - Atualizar plano do tenant
    // - Configurar limites baseados no plano
    // - Enviar boas-vindas
  }

  private async handleSubscriptionUpdated(subscription: any): Promise<void> {
    logger.info('Processing subscription updated', {
      subscriptionId: subscription.id,
      status: subscription.status,
      planId: subscription.items.data[0]?.price.id,
    });

    // TODO: Implementar lógica de negócio
    // - Atualizar plano do tenant
    // - Ajustar limites se necessário
    // - Notificar mudanças
  }

  private async handlePaymentFailed(invoice: any): Promise<void> {
    logger.info('Processing payment failed', {
      invoiceId: invoice.id,
      customerId: invoice.customer,
      amount: invoice.amount_due,
    });

    // TODO: Implementar lógica de negócio
    // - Notificar tenant sobre falha
    // - Implementar grace period
    // - Enviar lembretes de pagamento
  }

  // ===== WEBHOOKS OUTBOUND (Enviados) =====

  /**
   * Envia webhook para sistemas externos
   */
  async sendOutboundWebhook(
    eventType: OutboundWebhookEvent,
    data: Record<string, any>
  ): Promise<void> {
    try {
      if (!isValidOutboundEvent(eventType)) {
        throw new Error(`Invalid outbound event type: ${eventType}`);
      }

      // Obter assinaturas ativas para este evento
      const subscriptions = await this.getActiveSubscriptions(eventType, data.tenant_id);
      
      if (subscriptions.length === 0) {
        logger.info('No active webhook subscriptions for event', {
          eventType,
          tenantId: data.tenant_id,
        });
        return;
      }

      // Criar payload do webhook
      const webhookPayload = createOutboundPayload(eventType, data);

      // Enviar para cada assinatura
      for (const subscription of subscriptions) {
        await this.deliverWebhook(webhookPayload, subscription);
      }

    } catch (error) {
      logger.error('Failed to send outbound webhook', {
        error: error instanceof Error ? error.message : String(error),
        eventType,
        data,
      });
    }
  }

  /**
   * Entrega webhook para uma URL específica
   */
  private async deliverWebhook(
    payload: OutboundWebhookPayload,
    subscription: WebhookSubscription
  ): Promise<void> {
    const webhookId = payload.id;
    const attemptId = `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Preparar headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'Noxora-Webhooks/1.0',
        ...subscription.headers,
      };

      // Adicionar assinatura HMAC se configurada
      if (subscription.secret) {
        const timestamp = Math.floor(Date.now() / 1000);
        const signature = calculateWebhookSignature(
          JSON.stringify(payload),
          subscription.secret,
          timestamp
        );
        
        headers['X-Webhook-Signature'] = signature;
        headers['X-Webhook-Timestamp'] = timestamp.toString();
      }

      // Fazer requisição HTTP
      const response = await fetch(subscription.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      // Registrar tentativa
      await this.recordDeliveryAttempt({
        id: attemptId,
        webhook_id: webhookId,
        url: subscription.url,
        status: response.ok ? 'success' : 'failed',
        attempts: 1,
        last_attempt: new Date(),
        response_code: response.status,
        response_body: await response.text().catch(() => ''),
        created_at: new Date(),
        updated_at: new Date(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      logger.info('Webhook delivered successfully', {
        webhookId,
        url: subscription.url,
        statusCode: response.status,
      });

    } catch (error) {
      logger.error('Failed to deliver webhook', {
        error: error instanceof Error ? error.message : String(error),
        webhookId,
        url: subscription.url,
      });

      // Registrar tentativa falhada
      await this.recordDeliveryAttempt({
        id: attemptId,
        webhook_id: webhookId,
        url: subscription.url,
        status: 'failed',
        attempts: 1,
        last_attempt: new Date(),
        error_message: error instanceof Error ? error.message : String(error),
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Agendar retry se configurado
      if (subscription.retry_config) {
        await this.scheduleWebhookRetry(payload, subscription);
      }
    }
  }

  /**
   * Agenda retry de webhook falhado
   */
  private async scheduleWebhookRetry(
    payload: OutboundWebhookPayload,
    subscription: WebhookSubscription
  ): Promise<void> {
    if (!subscription.retry_config) return;

    const { max_attempts, initial_delay_ms, max_delay_ms, backoff_multiplier } = subscription.retry_config;
    
    // TODO: Implementar lógica de retry com backoff exponencial
    // - Verificar tentativas anteriores
    // - Calcular delay baseado no número de tentativas
    // - Agendar no Redis para processamento futuro
    
    logger.info('Webhook retry scheduled', {
      webhookId: payload.id,
      url: subscription.url,
      retryConfig: subscription.retry_config,
    });
  }

  // ===== GESTÃO DE ASSINATURAS =====

  /**
   * Cria nova assinatura de webhook
   */
  async createSubscription(subscription: Omit<WebhookSubscription, 'id' | 'created_at' | 'updated_at'>): Promise<WebhookSubscription> {
    const newSubscription: WebhookSubscription = {
      ...subscription,
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date(),
      updated_at: new Date(),
    };

    // Salvar no Redis
    const key = `webhook_subscription:${newSubscription.id}`;
    await redis.setex(key, 86400 * 365, JSON.stringify(newSubscription)); // 1 ano

    logger.info('Webhook subscription created', {
      subscriptionId: newSubscription.id,
      eventType: newSubscription.event_type,
      tenantId: newSubscription.tenant_id,
    });

    return newSubscription;
  }

  /**
   * Obtém assinaturas ativas para um evento
   */
  async getActiveSubscriptions(
    eventType: OutboundWebhookEvent,
    tenantId: string
  ): Promise<WebhookSubscription[]> {
    try {
      // Buscar todas as assinaturas ativas
      const pattern = 'webhook_subscription:*';
      const keys = await redis.keys(pattern);
      
      const subscriptions: WebhookSubscription[] = [];
      
      for (const key of keys) {
        try {
          const data = await redis.get(key);
          if (!data) continue;

          const subscription = JSON.parse(data) as WebhookSubscription;
          
          if (
            subscription.event_type === eventType &&
            subscription.tenant_id === tenantId &&
            subscription.is_active
          ) {
            subscriptions.push(subscription);
          }
        } catch (error) {
          logger.error('Failed to parse webhook subscription', {
            error: error instanceof Error ? error.message : String(error),
            key,
          });
        }
      }

      return subscriptions;
    } catch (error) {
      logger.error('Failed to get webhook subscriptions', {
        error: error instanceof Error ? error.message : String(error),
        eventType,
        tenantId,
      });
      return [];
    }
  }

  // ===== LOGS E MONITORAMENTO =====

  /**
   * Registra log de webhook
   */
  private async logWebhook(log: Omit<WebhookLog, 'id'>): Promise<void> {
    try {
      const webhookLog: WebhookLog = {
        ...log,
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

      const key = `webhook_log:${webhookLog.id}`;
      await redis.setex(key, 86400 * 30, JSON.stringify(webhookLog)); // 30 dias
    } catch (error) {
      logger.error('Failed to log webhook', {
        error: error instanceof Error ? error.message : String(error),
        log,
      });
    }
  }

  /**
   * Registra tentativa de entrega
   */
  private async recordDeliveryAttempt(attempt: WebhookDeliveryAttempt): Promise<void> {
    try {
      const key = `webhook_delivery:${attempt.id}`;
      await redis.setex(key, 86400 * 7, JSON.stringify(attempt)); // 7 dias
    } catch (error) {
      logger.error('Failed to record delivery attempt', {
        error: error instanceof Error ? error.message : String(error),
        attempt,
      });
    }
  }

  /**
   * Obtém estatísticas de webhooks
   */
  async getWebhookStats(tenantId?: string): Promise<{
    totalInbound: number;
    totalOutbound: number;
    successRate: number;
    averageProcessingTime: number;
  }> {
    try {
      // TODO: Implementar cálculo de estatísticas baseado nos logs
      // Por enquanto, retornar valores mock
      return {
        totalInbound: 0,
        totalOutbound: 0,
        successRate: 100,
        averageProcessingTime: 0,
      };
    } catch (error) {
      logger.error('Failed to get webhook stats', {
        error: error instanceof Error ? error.message : String(error),
        tenantId,
      });
      
      return {
        totalInbound: 0,
        totalOutbound: 0,
        successRate: 0,
        averageProcessingTime: 0,
      };
    }
  }
}

export const webhookService = WebhookService.getInstance();
