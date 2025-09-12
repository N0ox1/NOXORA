import { CronJobConfig, BillingReconciliationJob, JobResult } from '@/types/notifications';
import { notificationQueueService } from '@/lib/notifications/notification-queue';
import { billingService } from '@/lib/billing/billing-service';
import { TenantService } from '@/lib/tenant';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import redis from '@/lib/redis';

export class CronService {
  private jobs: Map<string, NodeJS.Timeout> = new Map();
  private readonly cronJobsKey = 'cron:jobs:status';

  /**
   * Inicializa todos os jobs cron configurados
   */
  async initializeCronJobs(): Promise<void> {
    const cronJobs: CronJobConfig[] = [
      {
        name: 'send_reminders',
        schedule: '0 */1 * * *', // A cada hora
        enabled: true,
        max_duration_minutes: 30
      },
      {
        name: 'billing_reconciliation',
        schedule: '0 2 * * *', // Diariamente às 2h
        enabled: true,
        max_duration_minutes: 60
      },
      {
        name: 'cleanup_old_jobs',
        schedule: '0 3 * * 0', // Semanalmente no domingo às 3h
        enabled: true,
        max_duration_minutes: 15
      }
    ];

    for (const job of cronJobs) {
      if (job.enabled) {
        await this.scheduleJob(job);
      }
    }

    logger.info('Cron jobs initialized', { count: cronJobs.length });
  }

  /**
   * Agenda um job cron
   */
  private async scheduleJob(jobConfig: CronJobConfig): Promise<void> {
    try {
      const interval = this.parseCronExpression(jobConfig.schedule);
      if (!interval) {
        logger.error('Invalid cron expression', { job: jobConfig.name, schedule: jobConfig.schedule });
        return;
      }

      const timeout = setInterval(async () => {
        await this.executeJob(jobConfig);
      }, interval);

      this.jobs.set(jobConfig.name, timeout);
      
      // Atualizar status no Redis
      await this.updateJobStatus(jobConfig.name, {
        ...jobConfig,
        last_run: undefined,
        next_run: new Date(Date.now() + interval)
      });

      logger.info('Cron job scheduled', { 
        name: jobConfig.name, 
        schedule: jobConfig.schedule,
        intervalMs: interval 
      });

    } catch (error) {
      logger.error('Error scheduling cron job', { 
        job: jobConfig.name, 
        error 
      });
    }
  }

  /**
   * Executa um job específico
   */
  private async executeJob(jobConfig: CronJobConfig): Promise<void> {
    const startTime = Date.now();
    const jobId = `${jobConfig.name}_${Date.now()}`;

    try {
      logger.info('Starting cron job', { 
        jobId, 
        name: jobConfig.name,
        startTime: new Date(startTime).toISOString() 
      });

      // Atualizar status
      await this.updateJobStatus(jobConfig.name, {
        ...jobConfig,
        last_run: new Date(startTime)
      });

      let result: JobResult;

      switch (jobConfig.name) {
        case 'send_reminders':
          result = await this.executeSendReminders();
          break;
        
        case 'billing_reconciliation':
          result = await this.executeBillingReconciliation();
          break;
        
        case 'cleanup_old_jobs':
          result = await this.executeCleanupOldJobs();
          break;
        
        default:
          result = {
            success: false,
            message: `Unknown job: ${jobConfig.name}`,
            processed: 0,
            failed: 1
          };
      }

      const duration = Date.now() - startTime;
      
      if (result.success) {
        logger.info('Cron job completed successfully', {
          jobId,
          name: jobConfig.name,
          duration,
          processed: result.processed,
          failed: result.failed
        });
      } else {
        logger.error('Cron job failed', {
          jobId,
          name: jobConfig.name,
          duration,
          error: result.message
        });
      }

      // Verificar se excedeu o tempo máximo
      if (duration > jobConfig.max_duration_minutes * 60 * 1000) {
        logger.warn('Cron job exceeded max duration', {
          jobId,
          name: jobConfig.name,
          duration,
          maxDuration: jobConfig.max_duration_minutes
        });
      }

    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('Cron job execution error', {
        jobId,
        name: jobConfig.name,
        duration,
        error
      });
    }
  }

  /**
   * Executa o job de envio de lembretes
   */
  private async executeSendReminders(): Promise<JobResult> {
    try {
      let processed = 0;
      let failed = 0;

      // Buscar agendamentos futuros (próximas 24h)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      // Aqui você faria uma consulta real ao banco
      // Por enquanto, vamos simular alguns lembretes
      const mockAppointments = [
        {
          tenant_id: 'tnt_1',
          client_name: 'João Silva',
          employee_name: 'Rafa',
          service_name: 'Corte Masculino',
          appointment_time: tomorrow,
          client_phone: '+55 11 90000-0000'
        }
      ];

      for (const appointment of mockAppointments) {
        try {
          await notificationQueueService.scheduleAppointmentReminders(
            appointment.tenant_id,
            appointment
          );
          processed++;
        } catch (error) {
          failed++;
          logger.error('Error scheduling reminder', { 
            appointment, 
            error 
          });
        }
      }

      return {
        success: failed === 0,
        message: `Scheduled ${processed} reminders, ${failed} failed`,
        processed,
        failed
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        message: `Send reminders error: ${errorMessage}`,
        processed: 0,
        failed: 1
      };
    }
  }

  /**
   * Executa o job de reconciliação de billing
   */
  private async executeBillingReconciliation(): Promise<JobResult> {
    try {
      let processed = 0;
      let failed = 0;

      // Buscar todos os tenants ativos
      const tenants = await /* tenant-guard:allow */ prisma.tenant.findMany({ where: { status: 'ACTIVE' } });
      
      for (const tenant of tenants) {
        try {
          // Verificar limites e status
          const limitsResult = await billingService.enforceLimits(tenant.id);
          
          if ((limitsResult as any).limitExceeded) {
            // Enviar notificação de limite excedido
            await notificationQueueService.enqueue({
              tenant_id: tenant.id,
              template: 'billing_overdue',
              recipient: (tenant as any).email || 'admin@example.com',
              recipient_type: 'tenant',
              data: {
                tenant_name: tenant.name,
                days_overdue: 1,
                amount: '99.90'
              },
              priority: 'critical'
            });
          }

          // Verificar trial terminando
          if (tenant.status === 'TRIALING') {
            const trialEnd = new Date(tenant.createdAt);
            trialEnd.setDate(trialEnd.getDate() + 14); // 14 dias de trial
            
            const daysUntilEnd = Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            
            if (daysUntilEnd <= 2) {
              await notificationQueueService.enqueue({
                tenant_id: tenant.id,
                template: 'trial_ending',
                recipient: (tenant as any).email || 'admin@example.com',
                recipient_type: 'tenant',
                data: {
                  tenant_name: tenant.name,
                  days_until_end: daysUntilEnd
                },
                priority: 'high'
              });
            }
          }

          processed++;
        } catch (error) {
          failed++;
          logger.error('Error processing tenant billing', { 
            tenantId: tenant.id, 
            error 
          });
        }
      }

      return {
        success: failed === 0,
        message: `Processed ${processed} tenants, ${failed} failed`,
        processed,
        failed
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        message: `Billing reconciliation error: ${errorMessage}`,
        processed: 0,
        failed: 1
      };
    }
  }

  /**
   * Executa limpeza de jobs antigos
   */
  private async executeCleanupOldJobs(): Promise<JobResult> {
    try {
      const cleaned = await notificationQueueService.cleanupOldJobs(30);
      
      return {
        success: true,
        message: `Cleaned up ${cleaned} old jobs`,
        processed: cleaned,
        failed: 0
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        success: false,
        message: `Cleanup error: ${errorMessage}`,
        processed: 0,
        failed: 1
      };
    }
  }

  /**
   * Para todos os jobs cron
   */
  stopAllJobs(): void {
    for (const [name, timeout] of this.jobs) {
      clearInterval(timeout);
      logger.info('Stopped cron job', { name });
    }
    this.jobs.clear();
  }

  /**
   * Obtém status de todos os jobs
   */
  async getJobsStatus(): Promise<CronJobConfig[]> {
    const statuses = await redis.hgetall(this.cronJobsKey);
    return Object.values(statuses).map(status => JSON.parse(status));
  }

  /**
   * Atualiza status de um job
   */
  private async updateJobStatus(jobName: string, status: CronJobConfig): Promise<void> {
    await redis.hset(this.cronJobsKey, jobName, JSON.stringify(status));
  }

  /**
   * Parse de expressão cron simples (minuto hora dia mês dia_semana)
   */
  private parseCronExpression(cron: string): number | null {
    const parts = cron.split(' ');
    if (parts.length !== 5) return null;

    const [minute, hour, day, month, dayOfWeek] = parts;
    
    // Para simplificar, vamos converter para intervalos em milissegundos
    // Em produção, use uma biblioteca como 'node-cron'
    
    if (minute === '0' && hour === '*/1') {
      return 60 * 60 * 1000; // A cada hora
    }
    
    if (minute === '0' && hour === '2') {
      return 24 * 60 * 60 * 1000; // Diariamente
    }
    
    if (minute === '0' && hour === '3' && dayOfWeek === '0') {
      return 7 * 24 * 60 * 60 * 1000; // Semanalmente
    }
    
    return null;
  }
}

export const cronService = new CronService();
