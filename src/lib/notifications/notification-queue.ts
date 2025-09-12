import redis from '@/lib/redis';
import { 
  NotificationJob, 
  NotificationJobCreate, 
  NotificationConfig,
  JobResult 
} from '@/types/notifications';
import { v4 as uuidv4 } from 'uuid';

import notificationConfigData from '../../../config/notifications.json';
const NOTIFICATION_CONFIG: NotificationConfig = notificationConfigData as unknown as NotificationConfig;

export class NotificationQueueService {
  private readonly queueKey = 'notifications:queue';
  private readonly processingKey = 'notifications:processing';
  private readonly failedKey = 'notifications:failed';
  private readonly statsKey = 'notifications:stats';

  /**
   * Adiciona um job de notificação à fila
   */
  async enqueue(jobData: NotificationJobCreate): Promise<string> {
    const job: NotificationJob = {
      id: uuidv4(),
      tenant_id: jobData.tenant_id,
      template: jobData.template,
      recipient: jobData.recipient,
      recipient_type: jobData.recipient_type,
      data: jobData.data,
      scheduled_for: jobData.scheduled_for || new Date(),
      priority: jobData.priority || 'normal',
      status: 'pending',
      attempts: 0,
      max_attempts: NOTIFICATION_CONFIG.channels[jobData.template]?.retry_attempts || 3,
      created_at: new Date(),
      updated_at: new Date()
    };

    const score = this.getPriorityScore(job.priority, job.scheduled_for);
    
    await redis.zadd(this.queueKey, score, JSON.stringify(job));
    
    // Atualizar estatísticas
    await this.updateStats('enqueued', 1);
    
    return job.id;
  }

  /**
   * Processa o próximo job da fila
   */
  async dequeue(): Promise<NotificationJob | null> {
    const jobs = await redis.zrange(this.queueKey, 0, 0, 'WITHSCORES');
    
    if (jobs.length === 0) {
      return null;
    }

    const [jobJson, score] = jobs;
    const job: NotificationJob = JSON.parse(jobJson);
    
    // Verificar se o job está pronto para execução
    if (job.scheduled_for > new Date()) {
      return null;
    }

    // Mover para processamento
    await redis.zrem(this.queueKey, jobJson);
    await redis.hset(this.processingKey, job.id, JSON.stringify({
      ...job,
      status: 'processing',
      updated_at: new Date()
    }));

    return job;
  }

  /**
   * Marca um job como concluído
   */
  async markCompleted(jobId: string): Promise<void> {
    const jobJson = await redis.hget(this.processingKey, jobId);
    if (!jobJson) return;

    const job: NotificationJob = JSON.parse(jobJson);
    job.status = 'sent';
    job.sent_at = new Date();
    job.updated_at = new Date();

    // Remover do processamento
    await redis.hdel(this.processingKey, jobId);
    
    // Atualizar estatísticas
    await this.updateStats('sent', 1);
  }

  /**
   * Marca um job como falhou
   */
  async markFailed(jobId: string, error: string): Promise<void> {
    const jobJson = await redis.hget(this.processingKey, jobId);
    if (!jobJson) return;

    const job: NotificationJob = JSON.parse(jobJson);
    job.attempts += 1;
    job.updated_at = new Date();
    job.error_message = error;

    if (job.attempts >= job.max_attempts) {
      // Mover para falhas permanentes
      job.status = 'failed';
      await redis.hset(this.failedKey, jobId, JSON.stringify(job));
      await redis.hdel(this.processingKey, jobId);
      await this.updateStats('failed', 1);
    } else {
      // Reagendar para retry
      const retryDelay = this.calculateRetryDelay(job.attempts);
      job.scheduled_for = new Date(Date.now() + retryDelay);
      job.status = 'pending';
      
      await redis.hdel(this.processingKey, jobId);
      const score = this.getPriorityScore(job.priority, job.scheduled_for);
      await redis.zadd(this.queueKey, score, JSON.stringify(job));
      
      await this.updateStats('retried', 1);
    }
  }

  /**
   * Agenda lembretes para agendamentos futuros
   */
  async scheduleAppointmentReminders(
    tenantId: string,
    appointmentData: {
      client_name: string;
      employee_name: string;
      service_name: string;
      appointment_time: Date;
      client_phone: string;
    }
  ): Promise<string[]> {
    const reminderTime = new Date(appointmentData.appointment_time);
    reminderTime.setHours(reminderTime.getHours() - NOTIFICATION_CONFIG.scheduling.reminder_lead_time_hours);

    const jobId = await this.enqueue({
      tenant_id: tenantId,
      template: 'appointment_reminder',
      recipient: appointmentData.client_phone,
      recipient_type: 'client',
      data: {
        client_name: appointmentData.client_name,
        employee_name: appointmentData.employee_name,
        service_name: appointmentData.service_name,
        time: appointmentData.appointment_time.toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      },
      scheduled_for: reminderTime,
      priority: 'high'
    });

    return [jobId];
  }

  /**
   * Agenda confirmações de agendamento
   */
  async scheduleAppointmentConfirmation(
    tenantId: string,
    appointmentData: {
      client_name: string;
      employee_name: string;
      service_name: string;
      appointment_time: Date;
      client_phone: string;
    }
  ): Promise<string> {
    const confirmationTime = new Date();
    confirmationTime.setMinutes(confirmationTime.getMinutes() + NOTIFICATION_CONFIG.scheduling.confirmation_delay_minutes);

    return await this.enqueue({
      tenant_id: tenantId,
      template: 'appointment_confirmation',
      recipient: appointmentData.client_phone,
      recipient_type: 'client',
      data: {
        client_name: appointmentData.client_name,
        employee_name: appointmentData.employee_name,
        service_name: appointmentData.service_name,
        date: appointmentData.appointment_time.toLocaleDateString('pt-BR'),
        time: appointmentData.appointment_time.toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      },
      scheduled_for: confirmationTime,
      priority: 'normal'
    });
  }

  /**
   * Obtém estatísticas da fila
   */
  async getStats(): Promise<Record<string, number>> {
    const stats = await redis.hgetall(this.statsKey);
    return Object.fromEntries(
      Object.entries(stats).map(([key, value]) => [key, parseInt(value) || 0])
    );
  }

  /**
   * Limpa estatísticas
   */
  async clearStats(): Promise<void> {
    await redis.del(this.statsKey);
  }

  /**
   * Obtém jobs em processamento
   */
  async getProcessingJobs(): Promise<NotificationJob[]> {
    const jobs = await redis.hgetall(this.processingKey);
    return Object.values(jobs).map(job => JSON.parse(job));
  }

  /**
   * Obtém jobs falhados
   */
  async getFailedJobs(): Promise<NotificationJob[]> {
    const jobs = await redis.hgetall(this.failedKey);
    return Object.values(jobs).map(job => JSON.parse(job));
  }

  /**
   * Limpa jobs antigos
   */
  async cleanupOldJobs(daysOld: number = 30): Promise<number> {
    const cutoff = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    let cleaned = 0;

    // Limpar jobs falhados antigos
    const failedJobs = await this.getFailedJobs();
    for (const job of failedJobs) {
      if (job.created_at.getTime() < cutoff) {
        await redis.hdel(this.failedKey, job.id);
        cleaned++;
      }
    }

    return cleaned;
  }

  private getPriorityScore(priority: string, scheduledFor: Date): number {
    const priorityScores = { low: 1, normal: 2, high: 3, critical: 4 };
    const baseScore = priorityScores[priority as keyof typeof priorityScores] || 2;
    return baseScore * 1000000 + scheduledFor.getTime();
  }

  private calculateRetryDelay(attempt: number): number {
    const baseDelay = NOTIFICATION_CONFIG.scheduling.retry_backoff_multiplier;
    return Math.min(baseDelay ** attempt * 60000, 3600000); // max 1 hora
  }

  private async updateStats(action: string, count: number): Promise<void> {
    await redis.hincrby(this.statsKey, action, count);
  }
}

export const notificationQueueService = new NotificationQueueService();
export default notificationQueueService;
