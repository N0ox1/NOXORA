import { queueService } from './queue-service';
import { notificationQueueService as notificationService } from '@/lib/notifications';
import { billingService } from '@/lib/billing';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';
import redis from '@/lib/redis';
import { appointments, clients, services, tenants } from '@/lib/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import type { JobHandler, QueueMessage } from '@/types/jobs';

// ===== HANDLER PARA ENVIO DE LEMBRETES =====
export const sendRemindersHandler: JobHandler = {
  name: 'send_reminders',
  queue: 'notifications',
  concurrency: 5,
  timeout: 60000, // 1 minuto
  handler: async (message: QueueMessage) => {
    try {
      logger.info('Processing send_reminders job', { messageId: message.id });

      // Busca agendamentos confirmados para as próximas 24h
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const upcomingAppointments = await db.query.appointments.findMany({
        where: and(
          eq(appointments.status, 'CONFIRMED'),
          gte(appointments.startAt, now),
          lte(appointments.startAt, tomorrow)
        ),
        with: {
          client: true,
          service: true,
          barbershop: true,
        },
      });

      logger.info('Found upcoming appointments', { 
        count: upcomingAppointments.length 
      });

      let sentCount = 0;
      let failedCount = 0;

      for (const appointment of upcomingAppointments) {
        try {
          // Verifica se já foi enviado lembrete
          const reminderKey = `reminder_sent:${appointment.id}`;
          const alreadySent = await redis.get(reminderKey);
          
          if (alreadySent) {
            logger.debug('Reminder already sent', { appointmentId: appointment.id });
            continue;
          }

          // Calcula tempo até o agendamento
          const timeUntilAppointment = appointment.startAt.getTime() - now.getTime();
          const hoursUntilAppointment = Math.floor(timeUntilAppointment / (60 * 60 * 1000));

          // Envia lembrete se faltar menos de 24h
          if (hoursUntilAppointment <= 24) {
            const reminderData = {
              type: 'appointment_reminder',
              channel: 'whatsapp', // Prioriza WhatsApp para lembretes
              recipient: appointment.client.phone,
              variables: {
                service: appointment.service.name,
                date: appointment.startAt.toLocaleDateString('pt-BR'),
                time: appointment.startAt.toLocaleTimeString('pt-BR', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                }),
                clientName: appointment.client.name,
                barbershopName: appointment.barbershop.name,
              },
              tenantId: appointment.tenantId,
            };

            // Envia notificação
            const result = await (notificationService as any).sendBulkNotifications([reminderData]);
            
            if (result.success) {
              // Marca como enviado
              await redis.setex(reminderKey, 24 * 60 * 60, 'sent'); // TTL de 24h
              sentCount++;
              
              logger.info('Reminder sent successfully', {
                appointmentId: appointment.id,
                clientPhone: appointment.client.phone,
                hoursUntilAppointment,
              });
            } else {
              failedCount++;
              logger.error('Failed to send reminder', {
                appointmentId: appointment.id,
                error: result.error,
              });
            }
          }
        } catch (error) {
          failedCount++;
          logger.error('Error processing appointment for reminder', {
            appointmentId: appointment.id,
            error,
          });
        }
      }

      logger.info('Send reminders job completed', {
        total: upcomingAppointments.length,
        sent: sentCount,
        failed: failedCount,
      });

    } catch (error) {
      logger.error('Failed to process send_reminders job', { 
        messageId: message.id, 
        error 
      });
      throw error;
    }
  },
};

// ===== HANDLER PARA RECONCILIAÇÃO DE FATURAMENTO =====
export const billingReconciliationHandler: JobHandler = {
  name: 'billing_reconciliation',
  queue: 'billing',
  concurrency: 2,
  timeout: 120000, // 2 minutos
  handler: async (message: QueueMessage) => {
    try {
      logger.info('Processing billing_reconciliation job', { messageId: message.id });

      // Busca todos os tenants ativos
      const activeTenants = await db.query.tenants.findMany({
        where: eq(tenants.status, 'ACTIVE'),
      });

      logger.info('Found active tenants', { count: activeTenants.length });

      let processedCount = 0;
      let failedCount = 0;

      for (const tenant of activeTenants) {
        try {
          // Verifica uso atual vs. limites do plano
          const currentUsage = await billingService.getCurrentUsage(tenant.id);
          const plan = billingService.getPlans().find((p: any) => p.code === tenant.plan);
          
          if (!plan) {
            logger.warn('Plan not found for tenant', { 
              tenantId: tenant.id, 
              plan: tenant.plan 
            });
            continue;
          }

          // Verifica se excedeu limites
          const exceededLimits = {
            shops: currentUsage.shops > plan.limits.shops,
            employees: currentUsage.employees > plan.limits.employees,
          };

          if (exceededLimits.shops || exceededLimits.employees) {
            logger.warn('Tenant exceeded plan limits', {
              tenantId: tenant.id,
              plan: tenant.plan,
              exceededLimits,
              currentUsage,
              planLimits: plan.limits,
            });

            // Envia notificação para o tenant
            await (notificationService as any).sendBulkNotifications([{
              type: 'billing_limit_exceeded',
              channel: 'email',
              recipient: (tenant as any).email || 'admin@tenant.com',
              variables: {
                tenantName: tenant.name,
                plan: tenant.plan,
                exceededLimits: Object.keys(exceededLimits).filter(k => exceededLimits[k as keyof typeof exceededLimits]).join(', '),
                currentShops: currentUsage.shops,
                maxShops: plan.limits.shops,
                currentEmployees: currentUsage.employees,
                maxEmployees: plan.limits.employees,
              },
              tenantId: tenant.id,
            }]);
          }

          // Verifica se precisa de upgrade
          const upgradeRecommendation = billingService.getPlans(); /* TODO: implementar getUpgradeRecommendation */
          
          if ((upgradeRecommendation as any).recommended) {
            logger.info('Upgrade recommended for tenant', {
              tenantId: tenant.id,
              currentPlan: tenant.plan,
              recommendedPlan: (upgradeRecommendation as any).recommendedPlan,
              reason: (upgradeRecommendation as any).reason,
            });

            // Envia notificação de upgrade
            await (notificationService as any).sendBulkNotifications([{
              type: 'billing_upgrade_recommended',
              channel: 'email',
              recipient: (tenant as any).email || 'admin@tenant.com',
              variables: {
                tenantName: tenant.name,
                currentPlan: tenant.plan,
                recommendedPlan: (upgradeRecommendation as any).recommendedPlan,
                reason: (upgradeRecommendation as any).reason,
                estimatedCost: (upgradeRecommendation as any).estimatedCost,
              },
              tenantId: tenant.id,
            }]);
          }

          // Atualiza estatísticas de uso
          /* TODO: implementar updateUsageStats */ void (billingService);
          
          processedCount++;
          
          logger.info('Tenant billing reconciliation completed', {
            tenantId: tenant.id,
            plan: tenant.plan,
            usage: currentUsage,
            exceededLimits,
            upgradeRecommended: (upgradeRecommendation as any).recommended,
          });

        } catch (error) {
          failedCount++;
          logger.error('Error processing tenant billing reconciliation', {
            tenantId: tenant.id,
            error,
          });
        }
      }

      logger.info('Billing reconciliation job completed', {
        total: activeTenants.length,
        processed: processedCount,
        failed: failedCount,
      });

    } catch (error) {
      logger.error('Failed to process billing_reconciliation job', { 
        messageId: message.id, 
        error 
      });
      throw error;
    }
  },
};

// ===== HANDLER PARA NOTIFICAÇÕES GERAIS =====
export const notificationHandler: JobHandler = {
  name: 'notification',
  queue: 'notifications',
  concurrency: 10,
  timeout: 60000, // 1 minuto
  handler: async (message: QueueMessage) => {
    try {
      logger.info('Processing notification job', { 
        messageId: message.id, 
        type: message.data.type 
      });

      // Delega para o serviço de notificações
      const result = await (notificationService as any).sendBulkNotifications([message.data]);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to send notification');
      }

      logger.info('Notification job completed successfully', {
        messageId: message.id,
        notificationId: result.id,
      });

    } catch (error) {
      logger.error('Failed to process notification job', { 
        messageId: message.id, 
        error 
      });
      throw error;
    }
  },
};

// ===== HANDLER PARA TAREFAS GERAIS =====
export const defaultHandler: JobHandler = {
  name: 'default',
  queue: 'default',
  concurrency: 5,
  timeout: 30000, // 30 segundos
  handler: async (message: QueueMessage) => {
    try {
      logger.info('Processing default job', { 
        messageId: message.id, 
        type: message.data.type 
      });

      // Processa diferentes tipos de jobs padrão
      switch (message.data.type) {
        case 'data_cleanup':
          await processDataCleanup(message);
          break;
        case 'metrics_collection':
          await processMetricsCollection(message);
          break;
        case 'health_check':
          await processHealthCheck(message);
          break;
        default:
          logger.warn('Unknown default job type', { 
            messageId: message.id, 
            type: message.data.type 
          });
      }

      logger.info('Default job completed successfully', { messageId: message.id });

    } catch (error) {
      logger.error('Failed to process default job', { 
        messageId: message.id, 
        error 
      });
      throw error;
    }
  },
};

// ===== FUNÇÕES AUXILIARES PARA JOBS PADRÃO =====
async function processDataCleanup(message: QueueMessage): Promise<void> {
  logger.info('Processing data cleanup job', { messageId: message.id });
  
  // Implementar limpeza de dados antigos
  // - Logs antigos
  // - Cache expirado
  // - Arquivos temporários
  // - Dados de sessão expirados
  
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simula processamento
}

async function processMetricsCollection(message: QueueMessage): Promise<void> {
  logger.info('Processing metrics collection job', { messageId: message.id });
  
  // Implementar coleta de métricas
  // - Estatísticas de uso
  // - Performance das APIs
  // - Uso de recursos
  // - Métricas de negócio
  
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simula processamento
}

async function processHealthCheck(message: QueueMessage): Promise<void> {
  logger.info('Processing health check job', { messageId: message.id });
  
  // Implementar verificação de saúde
  // - Status do banco de dados
  // - Status do Redis
  // - Status dos serviços externos
  // - Verificação de conectividade
  
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simula processamento
}

// ===== REGISTRA TODOS OS HANDLERS =====
export function registerAllHandlers(): void {
  try {
    queueService.registerHandler(sendRemindersHandler);
    queueService.registerHandler(billingReconciliationHandler);
    queueService.registerHandler(notificationHandler);
    queueService.registerHandler(defaultHandler);
    
    logger.info('All job handlers registered successfully');
  } catch (error) {
    logger.error('Failed to register job handlers', { error });
    throw error;
  }
}
