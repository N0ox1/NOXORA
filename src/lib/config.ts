// Configuração centralizada baseada no infra.json e billing.json
export const config = {
  runtime: {
    frontend: 'Next.js 15',
    node: '20.x',
    region: 'gru1',
  },
  
  cache: {
    provider: 'Upstash Redis',
    ttl_seconds: 60,
    cdn: {
      s_maxage: 60,
      stale_while_revalidate: 120,
    },
  },
  
  rate_limit: {
    global_per_ip_per_min: 600,
    public_per_ip_tenant_slug_per_min: 60,
  },
  
  observability: {
    tracing: true,
    logs: true,
    metrics: true,
    otlp_endpoint: 'https://otlp.mock',
  },

  billing: {
    plans: [
      { code: 'STARTER', price_month: 49, limits: { shops: 1, employees: 3 } },
      { code: 'PRO', price_month: 149, limits: { shops: 5, employees: 20 } },
      { code: 'SCALE', price_month: 399, limits: { shops: 999, employees: 999 } },
    ],
    addons: [
      { code: 'REMINDERS_300', price_month: 19, grants: { reminders_month: 300 } },
    ],
    stripe_mock: {
      prices: {
        STARTER: 'price_mock_starter',
        PRO: 'price_mock_pro',
        SCALE: 'price_mock_scale',
      },
      customer_id: 'cus_mock_123',
      subscription_id: 'sub_mock_123',
    },
  },

  api: {
    headers: {
      tenant: 'X-Tenant-Id',
      auth: 'Authorization: Bearer <jwt>',
    },
    public: [
      { method: 'GET', path: '/api/health' },
      { method: 'GET', path: '/api/barbershop/public/{slug}' },
    ],
    admin: [
      { method: 'POST', path: '/api/auth/register' },
      { method: 'POST', path: '/api/auth/login' },
      { method: 'POST', path: '/api/services' },
      { method: 'POST', path: '/api/appointments' },
    ],
  },

  notifications: {
    channels: ['email', 'whatsapp'],
    templates: {
      appointment_confirmed: {
        text: 'Seu horário {{service}} em {{date}} foi confirmado.',
      },
      appointment_reminder: {
        text: 'Lembrete: {{service}} às {{time}}.',
      },
    },
    quotas: {
      reminders_month_default: 100,
    },
  },

  webhooks: {
    inbound: {
      stripe: {
        path: '/api/webhooks/stripe',
        events: ['checkout.session.completed', 'customer.subscription.created', 'customer.subscription.updated', 'invoice.payment_failed'],
      },
    },
    outbound: {
      appointment: {
        created: {
          payload_example: {
            id: 'app_1',
            tenant_id: 'tnt_1',
          },
        },
      },
    },
  },

  jobs: {
    queues: ['default', 'notifications', 'billing'],
    scheduled: [
      { name: 'send_reminders', cron: '*/5 * * * *', queue: 'notifications' },
      { name: 'billing_reconciliation', cron: '0 3 * * *', queue: 'billing' }
    ],
    default: {
      concurrency: 5,
      timeout: 30000,
      retryStrategy: {
        maxRetries: 3,
        backoffMs: 1000,
        backoffMultiplier: 2,
        maxBackoffMs: 30000,
      },
    },
    notifications: {
      concurrency: 10,
      timeout: 60000,
      retryStrategy: {
        maxRetries: 5,
        backoffMs: 2000,
        backoffMultiplier: 2,
        maxBackoffMs: 60000,
      },
    },
    billing: {
      concurrency: 3,
      timeout: 120000,
      retryStrategy: {
        maxRetries: 3,
        backoffMs: 5000,
        backoffMultiplier: 2,
        maxBackoffMs: 120000,
      },
    },
  },

  reporting: {
    metrics: {
      bookings_today: { 
        type: 'count', 
        source: 'appointments', 
        filter: { 
          status_in: ['CONFIRMED','DONE'], 
          date: 'today' 
        } 
      },
      no_show_rate_7d: { 
        type: 'ratio', 
        window_days: 7 
      },
      revenue_estimate_30d: { 
        type: 'sum(price_cents)', 
        window_days: 30 
      }
    },
    cache: {
      default_ttl: 300, // 5 minutos
      metric_ttl: 600, // 10 minutos
      report_ttl: 3600, // 1 hora
    },
    export: {
      supported_formats: ['csv', 'excel', 'pdf', 'json'],
      max_records: 10000,
      date_format: 'dd/MM/yyyy',
      locale: 'pt-BR',
    },
  },

  audit: {
    enabled: true,
    log_levels: [
      'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 
      'EXPORT', 'IMPORT', 'APPROVE', 'REJECT', 'ASSIGN', 
      'UNASSIGN', 'ENABLE', 'DISABLE', 'ARCHIVE', 'RESTORE'
    ],
    sensitive_fields: ['password', 'token', 'secret', 'key', 'credential'],
    retention_days: 365,
    max_log_size: 100, // MB
    compression_enabled: true,
    encryption_enabled: false,
    real_time_logging: true,
    batch_size: 100,
    flush_interval: 5000, // 5 segundos
    entities: [
      'tenant', 'barbershop', 'employee', 'service', 'client', 
      'appointment', 'user', 'role', 'permission', 'billing_plan', 
      'notification', 'webhook', 'report', 'metric'
    ],
  },
  
  // Configurações de ambiente
  env: {
    database: {
      url: process.env.DATABASE_URL || 'postgres://user:pass@localhost:5432/noxora_mock',
    },
    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      upstash: {
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      },
    },
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_mock',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_mock_123',
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    },
    auth: {
      secret: process.env.NEXTAUTH_SECRET || 'nextauth_mock',
      url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    },
    app: {
      baseUrl: process.env.BASE_URL || 'https://noxora-mock.vercel.app',
      defaultTenantId: process.env.DEFAULT_TENANT_ID || 'barbearia-alfa',
    },
  },
  
  // Configurações de desenvolvimento
  development: {
    mockData: true,
    enableLogs: true,
    enableTelemetry: false,
  },
  
  // Configurações de produção
  production: {
    mockData: false,
    enableLogs: true,
    enableTelemetry: true,
  },
} as const;

// Tipos para a configuração
export type Config = typeof config;
export type RuntimeConfig = Config['runtime'];
export type CacheConfig = Config['cache'];
export type RateLimitConfig = Config['rate_limit'];
export type ObservabilityConfig = Config['observability'];
export type BillingConfig = Config['billing'];
export type ApiConfig = Config['api'];
export type NotificationConfig = Config['notifications'];
export type WebhookConfig = Config['webhooks'];
export type JobsConfig = Config['jobs'];
export type ReportingConfig = Config['reporting'];
export type AuditConfig = Config['audit'];
export type EnvConfig = Config['env'];

// Função para obter configuração baseada no ambiente
export function getConfig() {
  const isDevelopment = process.env.NODE_ENV === 'development';
  return {
    ...config,
    current: isDevelopment ? config.development : config.production,
  };
}

// Função para validar configurações obrigatórias
export function validateConfig() {
  const requiredEnvVars = [
    'DATABASE_URL',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
    'STRIPE_SECRET_KEY',
    'NEXTAUTH_SECRET',
  ];

  const missingVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingVars.length > 0) {
    console.warn(
      `⚠️  Variáveis de ambiente ausentes: ${missingVars.join(', ')}`
    );
    console.warn('📝 Usando valores mock para desenvolvimento');
  }

  return {
    isValid: missingVars.length === 0,
    missingVars,
  };
}
