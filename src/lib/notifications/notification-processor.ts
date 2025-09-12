import { 
  NotificationJob, 
  NotificationTemplate, 
  NotificationConfig,
  JobResult 
} from '@/types/notifications';
import { notificationQueueService } from './notification-queue';
import { logger } from '@/lib/logger';

import notificationConfigData from '../../../config/notifications.json';
const NOTIFICATION_CONFIG: NotificationConfig = notificationConfigData as unknown as NotificationConfig;

export class NotificationProcessorService {
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;

  /**
   * Inicia o processamento contínuo da fila
   */
  startProcessing(intervalMs: number = 5000): void {
    if (this.isProcessing) {
      logger.warn('Notification processor already running');
      return;
    }

    this.isProcessing = true;
    this.processingInterval = setInterval(async () => {
      await this.processNextJob();
    }, intervalMs);

    logger.info('Notification processor started', { intervalMs });
  }

  /**
   * Para o processamento contínuo
   */
  stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    this.isProcessing = false;
    logger.info('Notification processor stopped');
  }

  /**
   * Processa o próximo job da fila
   */
  private async processNextJob(): Promise<void> {
    try {
      const job = await notificationQueueService.dequeue();
      if (!job) return;

      logger.info('Processing notification job', { 
        jobId: job.id, 
        template: job.template,
        recipient: job.recipient 
      });

      const result = await this.sendNotification(job);
      
      if (result.success) {
        await notificationQueueService.markCompleted(job.id);
        logger.info('Notification sent successfully', { jobId: job.id });
      } else {
        await notificationQueueService.markFailed(job.id, result.message);
        logger.error('Notification failed', { 
          jobId: job.id, 
          error: result.message 
        });
      }
    } catch (error) {
      logger.error('Error processing notification job', { error });
    }
  }

  /**
   * Envia uma notificação usando o template apropriado
   */
  private async sendNotification(job: NotificationJob): Promise<JobResult> {
    try {
      const template = NOTIFICATION_CONFIG.templates[job.template];
      if (!template) {
        return {
          success: false,
          message: `Template not found: ${job.template}`,
          processed: 0,
          failed: 1
        };
      }

      const channel = NOTIFICATION_CONFIG.channels[template.type];
      if (!channel) {
        return {
          success: false,
          message: `Channel not found: ${template.type}`,
          processed: 0,
          failed: 1
        };
      }

      // Substituir variáveis no template
      const processedContent = this.processTemplate(template, job.data);
      
      // Enviar via canal apropriado
      const sendResult = await this.sendViaChannel(
        template.type,
        job.recipient,
        processedContent.title,
        processedContent.body,
        job.tenant_id
      );

      return {
        success: sendResult.success,
        message: sendResult.message,
        processed: sendResult.success ? 1 : 0,
        failed: sendResult.success ? 0 : 1
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        message: `Processing error: ${errorMessage}`,
        processed: 0,
        failed: 1
      };
    }
  }

  /**
   * Processa template substituindo variáveis
   */
  private processTemplate(template: NotificationTemplate, data: Record<string, any>): { title: string; body: string } {
    let title = template.title;
    let body = template.body;

    // Substituir variáveis no título e corpo
    Object.entries(data).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      title = title.replace(new RegExp(placeholder, 'g'), String(value));
      body = body.replace(new RegExp(placeholder, 'g'), String(value));
    });

    return { title, body };
  }

  /**
   * Envia notificação via canal específico
   */
  private async sendViaChannel(
    channelType: string,
    recipient: string,
    title: string,
    body: string,
    tenantId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      switch (channelType) {
        case 'SMS':
          return await this.sendSMS(recipient, body, tenantId);
        
        case 'EMAIL':
          return await this.sendEmail(recipient, title, body, tenantId);
        
        case 'PUSH':
          return await this.sendPushNotification(recipient, title, body, tenantId);
        
        default:
          return {
            success: false,
            message: `Unsupported channel type: ${channelType}`
          };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        message: `Channel error: ${errorMessage}`
      };
    }
  }

  /**
   * Envia SMS (mock)
   */
  private async sendSMS(recipient: string, body: string, tenantId: string): Promise<{ success: boolean; message: string }> {
    // Simular envio de SMS
    await new Promise(resolve => setTimeout(resolve, 100));
    
    logger.info('SMS sent (mock)', { 
      recipient, 
      body: body.substring(0, 50) + '...',
      tenantId 
    });

    return {
      success: true,
      message: 'SMS sent successfully'
    };
  }

  /**
   * Envia email (mock)
   */
  private async sendEmail(recipient: string, title: string, body: string, tenantId: string): Promise<{ success: boolean; message: string }> {
    // Simular envio de email
    await new Promise(resolve => setTimeout(resolve, 200));
    
    logger.info('Email sent (mock)', { 
      recipient, 
      title,
      body: body.substring(0, 50) + '...',
      tenantId 
    });

    return {
      success: true,
      message: 'Email sent successfully'
    };
  }

  /**
   * Envia notificação push (mock)
   */
  private async sendPushNotification(recipient: string, title: string, body: string, tenantId: string): Promise<{ success: boolean; message: string }> {
    // Simular envio de push notification
    await new Promise(resolve => setTimeout(resolve, 150));
    
    logger.info('Push notification sent (mock)', { 
      recipient, 
      title,
      body: body.substring(0, 50) + '...',
      tenantId 
    });

    return {
      success: true,
      message: 'Push notification sent successfully'
    };
  }

  /**
   * Processa todos os jobs pendentes (para uso manual)
   */
  async processAllPendingJobs(): Promise<JobResult> {
    let processed = 0;
    let failed = 0;
    const errors: string[] = [];

    try {
      while (true) {
        const job = await notificationQueueService.dequeue();
        if (!job) break;

        try {
          const result = await this.sendNotification(job);
          
          if (result.success) {
            await notificationQueueService.markCompleted(job.id);
            processed++;
          } else {
            await notificationQueueService.markFailed(job.id, result.message);
            failed++;
            errors.push(`Job ${job.id}: ${result.message}`);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          await notificationQueueService.markFailed(job.id, errorMessage);
          failed++;
          errors.push(`Job ${job.id}: ${errorMessage}`);
        }
      }

      return {
        success: failed === 0,
        message: `Processed ${processed} jobs, ${failed} failed`,
        processed,
        failed,
        details: errors.length > 0 ? { errors } : undefined
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        message: `Processing error: ${errorMessage}`,
        processed,
        failed
      };
    }
  }

  /**
   * Obtém status do processador
   */
  getStatus(): { isProcessing: boolean; hasInterval: boolean } {
    return {
      isProcessing: this.isProcessing,
      hasInterval: this.processingInterval !== null
    };
  }
}

export const notificationProcessorService = new NotificationProcessorService();
