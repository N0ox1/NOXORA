export interface NotificationTemplate {
  title: string;
  body: string;
  type: 'SMS' | 'EMAIL' | 'PUSH';
  priority: 'LOW' | 'NORMAL' | 'HIGH';
  delay_hours: number;
}

export interface NotificationChannel {
  provider: string;
  rate_limit: number;
  retry_attempts: number;
  retry_delay_minutes: number;
}

export interface NotificationConfig {
  templates: Record<string, NotificationTemplate>;
  channels: Record<string, NotificationChannel>;
  scheduling: {
    reminder_lead_time_hours: number;
    confirmation_delay_minutes: number;
    billing_reminder_days: number;
    trial_warning_days: number;
    max_retry_attempts: number;
    retry_backoff_multiplier: number;
  };
}

export interface NotificationJob {
  id: string;
  tenant_id: string;
  template: string;
  recipient: string;
  recipient_type: 'client' | 'tenant' | 'employee';
  data: Record<string, any>;
  scheduled_for: Date;
  priority: 'low' | 'normal' | 'high' | 'critical';
  status: 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled';
  attempts: number;
  max_attempts: number;
  created_at: Date;
  updated_at: Date;
  sent_at?: Date;
  error_message?: string;
}

export interface NotificationJobCreate {
  tenant_id: string;
  template: string;
  recipient: string;
  recipient_type: 'client' | 'tenant' | 'employee';
  data: Record<string, any>;
  scheduled_for?: Date;
  priority?: 'low' | 'normal' | 'high' | 'critical';
}

export interface JobResult {
  success: boolean;
  message: string;
  processed: number;
  failed: number;
  details?: any;
}

export interface CronJobConfig {
  name: string;
  schedule: string; // cron expression
  enabled: boolean;
  last_run?: Date;
  next_run?: Date;
  max_duration_minutes: number;
}

export interface BillingReconciliationJob {
  tenant_id: string;
  action: 'check_limits' | 'send_reminders' | 'process_overdue' | 'update_status';
  data: Record<string, any>;
  created_at: Date;
  processed_at?: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: any;
  error_message?: string;
}

// Tipos adicionais para compatibilidade
export type Channel = 'SMS' | 'EMAIL' | 'PUSH';

export interface NotificationTemplate {
  title: string;
  body: string;
  type: Channel;
  priority: 'LOW' | 'NORMAL' | 'HIGH';
  delay_hours: number;
}

export interface NotificationConfig {
  templates: Record<string, NotificationTemplate>;
}

export type NotificationRequest = {
  id: string;
  template: string;
  recipient: string;
  params: Record<string, string>;
  channel?: Channel;
  // compat legado (snake_case)
  tenant_id?: string;
  barbershop_id?: string;
  appointment_id?: string;
  tenantId?: string;
  // espaço para campos extras que o serviço pode ler
  [key: string]: unknown;
};

export type NotificationResponse = {
  id: string;
  status: NotificationStatus;
  [key: string]: unknown;
};

export type NotificationStatus = 'QUEUED' | 'SENT' | 'FAILED';

export function getTemplateText(t: NotificationTemplate, params: Record<string, string>) {
  return {
    title: t.title,
    body: Object.entries(params).reduce((b, [k, v]) => b.replace(new RegExp(`{{${k}}}`, 'g'), v), t.body)
  };
}



export function checkQuotaLimit() {
  return true;
}

export function mapChannelToProvider(c?: Channel): 'email' | 'whatsapp' {
  if (c === 'SMS') return 'whatsapp';
  return 'email';
}

export function validateNotificationRequest(r: NotificationRequest): void {
  if (!r?.template || !r?.recipient) throw new Error('invalid_request');
}

export type NotificationTemplateMap = NotificationConfig['templates'];


