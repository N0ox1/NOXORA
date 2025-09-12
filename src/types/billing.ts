// Tipos para o sistema de billing

export interface BillingPlan {
  code: 'STARTER' | 'PRO' | 'SCALE';
  name: string;
  price_month: number;
  price_year: number;
  currency: string;
  limits: BillingLimits;
  features: BillingFeatures;
}

export interface BillingLimits {
  shops: number;
  employees: number;
  clients: number;
  appointments_month: number;
  notifications_month: number;
  storage_gb: number;
  api_calls_month: number;
}

export interface BillingFeatures {
  multi_location: boolean;
  advanced_reporting: boolean;
  sms_notifications: boolean;
  custom_branding: boolean;
  priority_support: boolean;
  webhooks: boolean;
  api_access: boolean;
}

export interface BillingAddon {
  code: string;
  name: string;
  price_month: number;
  currency: string;
  grants: Partial<BillingLimits>;
}

export interface BillingConfig {
  plans: BillingPlan[];
  addons: BillingAddon[];
  feature_flags: Record<string, Record<string, boolean>>;
  webhook_events: string[];
  trial_days: number;
  grace_period_days: number;
  auto_upgrade: boolean;
  downgrade_restrictions: {
    min_usage_period_days: number;
    require_manual_approval: boolean;
  };
}

export interface TenantUsage {
  shops: number;
  employees: number;
  clients: number;
  appointments_month: number;
  notifications_month: number;
  storage_gb: number;
  api_calls_month: number;
}

export interface BillingCheckoutRequest {
  tenant_id: string;
  plan_code: string;
  billing_cycle: 'monthly' | 'yearly';
  addons?: string[];
  customer_email: string;
  customer_name: string;
  success_url: string;
  cancel_url: string;
}

export interface BillingCheckoutResponse {
  success: boolean;
  checkout_url: string;
  session_id: string;
  amount_total: number;
  currency: string;
  expires_at: string;
}

export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: {
      id: string;
      customer?: string;
      subscription?: string;
      status?: string;
      plan?: {
        id: string;
        nickname?: string;
      };
      metadata?: Record<string, string>;
    };
  };
  created: number;
}

export interface BillingEnforcementResult {
  allowed: boolean;
  exceeded_limits: string[];
  current_usage: TenantUsage;
  plan_limits: BillingLimits;
  plan_code: string;
  upgrade_recommended?: {
    recommended: boolean;
    recommended_plan?: string;
    reason?: string;
  };
}

export interface BillingSubscription {
  id: string;
  tenant_id: string;
  stripe_subscription_id: string;
  plan_code: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  addons: string[];
  created_at: string;
  updated_at: string;
}

export interface BillingInvoice {
  id: string;
  tenant_id: string;
  stripe_invoice_id: string;
  subscription_id: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
  due_date: string;
  paid_at?: string;
  created_at: string;
}

export interface BillingCustomer {
  id: string;
  tenant_id: string;
  stripe_customer_id: string;
  email: string;
  name: string;
  phone?: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  created_at: string;
  updated_at: string;
}

export interface BillingMetrics {
  total_revenue: number;
  monthly_recurring_revenue: number;
  active_subscriptions: number;
  churn_rate: number;
  average_revenue_per_user: number;
  plan_distribution: Record<string, number>;
  top_plans: Array<{
    plan_code: string;
    count: number;
    revenue: number;
  }>;
}


