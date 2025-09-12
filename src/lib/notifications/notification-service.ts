import { config } from '@/lib/config';
import redis from '@/lib/redis';
import { logger } from '@/lib/logger';
import { 
  type NotificationRequest, 
  type NotificationResponse, 
  type NotificationStatus,
  type Channel,
  type NotificationTemplate,
  getTemplateText,
  validateNotificationRequest,
  checkQuotaLimit,
  mapChannelToProvider
} from '@/types/notifications';
import type { BillingPlan } from '@/types/billing';

export class NotificationService {
  private static instance: NotificationService;
  private notificationConfig = config.notifications;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Envia uma notificação através do canal especificado
   */
  async sendNotification(request: NotificationRequest): Promise<NotificationResponse> {
    try {
      // Validar a requisição
      validateNotificationRequest(request);

      // —— normalized fields ——
      const tenantId = (request.tenant_id ?? request.tenantId) ?? 'unknown';
      const barbershopId = (request.barbershop_id as string | undefined) ?? 'unknown';
      const appointmentId = (request.appointment_id as string | undefined) ?? 'unknown';


      // Verificar quota para lembretes
      if (request.template === 'appointment_reminder') {
        const quotaCheck = await this.checkQuotaForTenant(tenantId);
        if (quotaCheck.exceeded) {
          throw new Error(`Quota limit exceeded for reminders. Limit: ${quotaCheck.limit}, Used: ${quotaCheck.used}`);
        }
      }

      // Gerar ID único para a notificação
      const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Obter texto do template com variáveis substituídas
      const tpl = (this.notificationConfig.templates as any)[request.template] as NotificationTemplate;
      const text = getTemplateText(tpl, request.params ?? {});

      // Enviar notificação baseada no canal
      const result = await this.sendToChannel(mapChannelToProvider(request.channel), {
        recipient: request.recipient,
        message: text.body,
        notificationId,
        metadata: {
          type: request.channel,
          tenant_id: tenantId,
          barbershop_id: barbershopId,
          appointment_id: appointmentId,
        }
      });

      // Registrar sucesso
      if (request.template === 'appointment_reminder') {
        await this.incrementQuotaUsage(tenantId);
      }

      // Salvar status da notificação
      await this.saveNotificationStatus(notificationId, 'SENT');

      logger.info('Notification sent successfully', {
        notificationId,
        type: request.channel,
        channel: request.channel,
        recipient: request.recipient,
        tenant_id: (request.tenant_id ?? request.tenantId),
      });

      return { id: request.id, status: 'SENT', meta: { attempts: 1, last_attempt: new Date() } };

    } catch (error) {
      logger.error('Failed to send notification', {
        error: error instanceof Error ? error.message : String(error),
        request,
      });

      return { id: request.id, status: 'FAILED', meta: { error: error instanceof Error ? error.message : String(error) } };
    }
  }

  /**
   * Envia múltiplas notificações em lote
   */
  async sendBulkNotifications(requests: NotificationRequest[]): Promise<NotificationResponse[]> {
    const results: NotificationResponse[] = [];
    
    for (const request of requests) {
      try {
        const result = await this.sendNotification(request);
        results.push(result);
      } catch (error) {
        logger.error('Failed to send bulk notification', {
          error: error instanceof Error ? error.message : String(error),
          request,
        });
        
        results.push({
          id: request.id,
          status: 'FAILED',
          meta: { error: error instanceof Error ? error.message : String(error) }
        });
      }
    }

    return results;
  }

  /**
   * Agenda uma notificação para envio futuro
   */
  async scheduleNotification(
    request: NotificationRequest, 
    scheduledFor: Date
  ): Promise<NotificationResponse> {
    try {
      // Validar a requisição
      validateNotificationRequest(request);


      const notificationId = `scheduled_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Salvar notificação agendada no Redis
      const scheduledKey = `scheduled_notification:${notificationId}`;
      await redis.setex(scheduledKey, Math.floor((scheduledFor.getTime() - Date.now()) / 1000), JSON.stringify({
        ...request,
        notificationId,
        scheduledFor: scheduledFor.toISOString(),
      }));

      logger.info('Notification scheduled successfully', {
        notificationId,
        scheduledFor: scheduledFor.toISOString(),
        type: request.channel,
        tenant_id: (request.tenant_id ?? request.tenantId),
      });

      return { id: request.id, status: 'QUEUED', meta: { scheduled_for: scheduledFor } };

    } catch (error) {
      logger.error('Failed to schedule notification', {
        error: error instanceof Error ? error.message : String(error),
        request,
        scheduledFor,
      });

      return { id: request.id, status: 'FAILED', meta: { error: error instanceof Error ? error.message : String(error) } };
    }
  }

  /**
   * Verifica o status de uma notificação
   */
  async getNotificationStatus(notificationId: string): Promise<NotificationStatus | null> {
    try {
      const statusKey = `notification_status:${notificationId}`;
      const statusData = await redis.get(statusKey);
      
      if (!statusData) {
        return null;
      }

      return JSON.parse(statusData) as NotificationStatus;
    } catch (error) {
      logger.error('Failed to get notification status', {
        error: error instanceof Error ? error.message : String(error),
        notificationId,
      });
      return null;
    }
  }

  /**
   * Verifica quota de lembretes para um tenant
   */
  async checkQuotaForTenant(tenantId: string): Promise<{ used: number; limit: number; exceeded: boolean }> {
    try {
      const quotaKey = `quota_reminders:${tenantId}:${this.getCurrentMonthKey()}`;
      const used = parseInt(await redis.get(quotaKey) || '0');
      
      // TODO: Obter plano atual do tenant do banco de dados
      // Por enquanto, usando quota padrão
      const limit = this.notificationConfig.quotas.reminders_month_default;
      
      return {
        used,
        limit,
        exceeded: used >= limit,
      };
    } catch (error) {
      logger.error('Failed to check quota for tenant', {
        error: error instanceof Error ? error.message : String(error),
        tenantId,
      });
      
      return {
        used: 0,
        limit: 0,
        exceeded: false,
      };
    }
  }

  /**
   * Incrementa o uso da quota de lembretes
   */
  private async incrementQuotaUsage(tenantId: string): Promise<void> {
    try {
      const quotaKey = `quota_reminders:${tenantId}:${this.getCurrentMonthKey()}`;
      await redis.incr(quotaKey);
      
      // Definir expiração para o final do mês
      const now = new Date();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      const ttl = Math.floor((endOfMonth.getTime() - now.getTime()) / 1000);
      
      if (ttl > 0) {
        await redis.expire(quotaKey, ttl);
      }
    } catch (error) {
      logger.error('Failed to increment quota usage', {
        error: error instanceof Error ? error.message : String(error),
        tenantId,
      });
    }
  }

  /**
   * Obtém chave do mês atual para quota
   */
  private getCurrentMonthKey(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  /**
   * Envia notificação para o canal específico
   */
  private async sendToChannel(
    channel: 'email' | 'whatsapp',
    data: {
      recipient: string;
      message: string;
      notificationId: string;
      metadata: Record<string, any>;
    }
  ): Promise<void> {
    switch (channel) {
      case 'email':
        await this.sendEmail(data.recipient, data.message, data.metadata);
        break;
      case 'whatsapp':
        await this.sendWhatsApp(data.recipient, data.message, data.metadata);
        break;
      default:
        throw new Error(`Unsupported channel: ${channel}`);
    }
  }

  /**
   * Envia notificação por email (mock implementation)
   */
  private async sendEmail(
    recipient: string,
    message: string,
    metadata: Record<string, any>
  ): Promise<void> {
    // TODO: Implementar integração real com serviço de email
    logger.info('Mock email sent', {
      recipient,
      message,
      metadata,
    });
    
    // Simular delay de envio
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Envia notificação por WhatsApp (mock implementation)
   */
  private async sendWhatsApp(
    recipient: string,
    message: string,
    metadata: Record<string, any>
  ): Promise<void> {
    // TODO: Implementar integração real com API do WhatsApp
    logger.info('Mock WhatsApp message sent', {
      recipient,
      message,
      metadata,
    });
    
    // Simular delay de envio
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  /**
   * Salva o status da notificação
   */
  private async saveNotificationStatus(
    notificationId: string,
    status: NotificationStatus
  ): Promise<void> {
    try {
      const statusKey = `notification_status:${notificationId}`;
      await redis.setex(statusKey, 86400 * 30, JSON.stringify(status)); // 30 dias
    } catch (error) {
      logger.error('Failed to save notification status', {
        error: error instanceof Error ? error.message : String(error),
        notificationId,
        status,
      });
    }
  }

  /**
   * Processa notificações agendadas
   */
  async processScheduledNotifications(): Promise<void> {
    try {
      const pattern = 'scheduled_notification:*';
      const keys = await redis.keys(pattern);
      
      for (const key of keys) {
        try {
          const data = await redis.get(key);
          if (!data) continue;

          const scheduledNotification = JSON.parse(data);
          const scheduledFor = new Date(scheduledNotification.scheduledFor);
          
          if (scheduledFor <= new Date()) {
            // Notificação está vencida, enviar agora
            await this.sendNotification(scheduledNotification);
            
            // Remover da lista de agendadas
            await redis.del(key);
          }
        } catch (error) {
          logger.error('Failed to process scheduled notification', {
            error: error instanceof Error ? error.message : String(error),
            key,
          });
        }
      }
    } catch (error) {
      logger.error('Failed to process scheduled notifications', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

export const notificationService = NotificationService.getInstance();
export default notificationService;


