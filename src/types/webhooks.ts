// Tipos para webhooks baseados no webhooks.json
import crypto from 'crypto';

// ===== WEBHOOKS INBOUND (Recebidos) =====

export type StripeEventType = 
  | 'checkout.session.completed'
  | 'customer.subscription.created'
  | 'customer.subscription.updated'
  | 'invoice.payment_failed';

export interface StripeWebhookPayload {
  id: string;
  object: string;
  api_version: string;
  created: number;
  data: {
    object: any; // Stripe object data
  };
  livemode: boolean;
  pending_webhooks: number;
  request: {
    id: string;
    idempotency_key: string | null;
  };
  type: StripeEventType;
}

export interface InboundWebhookConfig {
  stripe: {
    path: string;
    events: StripeEventType[];
  };
}

// ===== WEBHOOKS OUTBOUND (Enviados) =====

export type OutboundWebhookEvent = 'appointment.created';

export interface OutboundWebhookPayload {
  id: string;
  tenant_id: string;
  timestamp: string;
  event_type: OutboundWebhookEvent;
  data: Record<string, any>;
}

export interface OutboundWebhookConfig {
  appointment: {
    created: {
      payload_example: {
        id: string;
        tenant_id: string;
      };
    };
  };
}

// ===== CONFIGURAÇÃO GERAL =====

export interface WebhookConfig {
  inbound: InboundWebhookConfig;
  outbound: OutboundWebhookConfig;
}

// ===== TIPOS PARA PROCESSAMENTO =====

export interface WebhookHandler {
  eventType: string;
  handler: (payload: any) => Promise<void>;
}

export interface WebhookDeliveryAttempt {
  id: string;
  webhook_id: string;
  url: string;
  status: 'pending' | 'success' | 'failed';
  attempts: number;
  last_attempt?: Date;
  next_retry?: Date;
  response_code?: number;
  response_body?: string;
  error_message?: string;
  created_at: Date;
  updated_at: Date;
}

export interface WebhookSubscription {
  id: string;
  tenant_id: string;
  event_type: OutboundWebhookEvent;
  url: string;
  is_active: boolean;
  secret?: string; // Para assinatura HMAC
  headers?: Record<string, string>;
  retry_config?: {
    max_attempts: number;
    initial_delay_ms: number;
    max_delay_ms: number;
    backoff_multiplier: number;
  };
  created_at: Date;
  updated_at: Date;
}

// ===== TIPOS PARA VALIDAÇÃO =====

export interface WebhookValidationResult {
  isValid: boolean;
  signature?: string;
  timestamp?: number;
  error?: string;
}

// ===== TIPOS PARA LOGS E MONITORAMENTO =====

export interface WebhookLog {
  id: string;
  webhook_id: string;
  event_type: string;
  direction: 'inbound' | 'outbound';
  status: 'success' | 'failed' | 'pending';
  payload_size: number;
  processing_time_ms: number;
  error_message?: string;
  created_at: Date;
}

// ===== FUNÇÕES UTILITÁRIAS =====

export const isValidStripeEvent = (eventType: string): eventType is StripeEventType => {
  const validEvents: StripeEventType[] = [
    'checkout.session.completed',
    'customer.subscription.created',
    'customer.subscription.updated',
    'invoice.payment_failed'
  ];
  return validEvents.includes(eventType as StripeEventType);
};

export const isValidOutboundEvent = (eventType: string): eventType is OutboundWebhookEvent => {
  const validEvents: OutboundWebhookEvent[] = [
    'appointment.created'
  ];
  return validEvents.includes(eventType as OutboundWebhookEvent);
};

export const createOutboundPayload = (
  eventType: OutboundWebhookEvent,
  data: Record<string, any>
): OutboundWebhookPayload => {
  return {
    id: `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    tenant_id: data.tenant_id,
    timestamp: new Date().toISOString(),
    event_type: eventType,
    data
  };
};

export const calculateWebhookSignature = (
  payload: string,
  secret: string,
  timestamp: number
): string => {
  const signedPayload = `${timestamp}.${payload}`;
  return crypto
    .createHmac('sha256', secret)
    .update(signedPayload, 'utf8')
    .digest('hex');
};

export const validateWebhookSignature = (
  signature: string,
  payload: string,
  secret: string,
  timestamp: number,
  toleranceSeconds: number = 300
): WebhookValidationResult => {
  try {
    // Verificar se o timestamp não é muito antigo
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > toleranceSeconds) {
      return {
        isValid: false,
        error: 'Webhook timestamp is too old'
      };
    }

    // Verificar assinatura
    const expectedSignature = calculateWebhookSignature(payload, secret, timestamp);
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );

    return {
      isValid,
      signature,
      timestamp
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
