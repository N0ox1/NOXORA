import redis from '@/lib/redis';
import { logger } from '@/lib/logger';
import {
  type QueueName,
  type QueueMessage,
  type JobHandler,
  type QueueConfig,
  type QueueStats,
  type ScheduledJob,
  type JobExecution,
  type JobStatus,
  isValidQueueName,
  createRetryStrategy,
  calculateBackoffDelay,
  calculateNextRun,
} from '@/types/jobs';

export class QueueService {
  private static instance: QueueService;
  private handlers: Map<string, JobHandler> = new Map();
  private configs: Map<QueueName, QueueConfig> = new Map();
  private scheduledJobs: Map<string, ScheduledJob> = new Map();
  private isRunning: boolean = false;
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {
    this.initializeDefaultConfigs();
    this.loadScheduledJobs();
  }

  public static getInstance(): QueueService {
    if (!QueueService.instance) {
      QueueService.instance = new QueueService();
    }
    return QueueService.instance;
  }

  /**
   * Inicializa configurações padrão para cada fila
   */
  private initializeDefaultConfigs() {
    const defaultRetryStrategy = createRetryStrategy();

    this.configs.set('default', {
      name: 'default',
      concurrency: 5,
      timeout: 30000, // 30 segundos
      retryStrategy: defaultRetryStrategy,
      enableMetrics: true,
    });

    this.configs.set('notifications', {
      name: 'notifications',
      concurrency: 10,
      timeout: 60000, // 1 minuto
      retryStrategy: createRetryStrategy(5, 2000, 2, 60000),
      enableMetrics: true,
    });

    this.configs.set('billing', {
      name: 'billing',
      concurrency: 3,
      timeout: 120000, // 2 minutos
      retryStrategy: createRetryStrategy(3, 5000, 2, 120000),
      enableMetrics: true,
    });
  }

  /**
   * Carrega jobs agendados do jobs.json
   */
  private async loadScheduledJobs() {
    try {
      // Em produção, isso viria de uma configuração ou banco de dados
      const scheduledJobs: ScheduledJob[] = [
        {
          name: 'send_reminders',
          cron: '*/5 * * * *',
          queue: 'notifications',
          enabled: true,
          maxRetries: 3,
        },
        {
          name: 'billing_reconciliation',
          cron: '0 3 * * *',
          queue: 'billing',
          enabled: true,
          maxRetries: 3,
        },
      ];

      for (const job of scheduledJobs) {
        this.scheduledJobs.set(job.name, {
          ...job,
          nextRun: calculateNextRun(job.cron),
        });
      }

      logger.info('Scheduled jobs loaded', { count: scheduledJobs.length });
    } catch (error) {
      logger.error('Failed to load scheduled jobs', { error });
    }
  }

  /**
   * Registra um handler para um tipo de job
   */
  public registerHandler(handler: JobHandler): void {
    if (!isValidQueueName(handler.queue)) {
      throw new Error(`Invalid queue name: ${handler.queue}`);
    }

    this.handlers.set(handler.name, handler);
    logger.info('Job handler registered', { 
      name: handler.name, 
      queue: handler.queue 
    });
  }

  /**
   * Adiciona uma mensagem à fila
   */
  public async enqueue<T>(
    queueName: QueueName,
    type: string,
    data: T,
    options: {
      tenantId?: string;
      userId?: string;
      priority?: number;
      scheduledFor?: Date;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<string> {
    if (!isValidQueueName(queueName)) {
      throw new Error(`Invalid queue name: ${queueName}`);
    }

    const message: QueueMessage<T> = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      tenantId: options.tenantId,
      userId: options.userId,
      priority: options.priority || 0,
      retryCount: 0,
      maxRetries: this.configs.get(queueName)?.retryStrategy.maxRetries || 3,
      scheduledFor: options.scheduledFor,
      createdAt: new Date(),
      metadata: options.metadata,
    };

    const queueKey = this.getQueueKey(queueName);
    const messageKey = this.getMessageKey(message.id);

    // Salva a mensagem
    await redis.setex(messageKey, 3600, JSON.stringify(message)); // TTL de 1 hora

    // Adiciona à fila
    if (options.scheduledFor && options.scheduledFor > new Date()) {
      // Job agendado para o futuro
      const delay = Math.floor((options.scheduledFor.getTime() - Date.now()) / 1000);
      await redis.zadd(queueKey, Date.now() + delay, message.id);
    } else {
      // Job para execução imediata
      await redis.lpush(queueKey, message.id);
    }

    logger.info('Message enqueued', {
      queueName,
      messageId: message.id,
      type,
      scheduledFor: options.scheduledFor,
    });

    return message.id;
  }

  /**
   * Processa mensagens de uma fila
   */
  public async processQueue(queueName: QueueName): Promise<void> {
    if (!isValidQueueName(queueName)) {
      throw new Error(`Invalid queue name: ${queueName}`);
    }

    const config = this.configs.get(queueName);
    if (!config) {
      throw new Error(`Queue config not found: ${queueName}`);
    }

    const queueKey = this.getQueueKey(queueName);
    const processingKey = this.getProcessingKey(queueName);

    try {
      // Processa jobs agendados primeiro
      await this.processScheduledJobs(queueName);

      // Processa jobs pendentes
      for (let i = 0; i < config.concurrency; i++) {
        const messageId = await redis.rpop(queueKey);
        if (!messageId) break;

        // Marca como processando
        await redis.setex(processingKey, config.timeout / 1000, messageId);

        // Processa a mensagem
        this.processMessage(messageId, queueName).catch(error => {
          logger.error('Failed to process message', { messageId, queueName, error });
        });
      }
    } catch (error) {
      logger.error('Failed to process queue', { queueName, error });
    }
  }

  /**
   * Processa jobs agendados
   */
  private async processScheduledJobs(queueName: QueueName): Promise<void> {
    /* impl A */
  }

  /**
   * Processa uma mensagem individual
   */
  private async processMessage(messageId: string, queueName: QueueName): Promise<void> {
    const messageKey = this.getMessageKey(messageId);
    const processingKey = this.getProcessingKey(queueName);
    const executionKey = this.getExecutionKey(messageId);

    try {
      // Busca a mensagem
      const messageData = await redis.get(messageKey);
      if (!messageData) {
        logger.warn('Message not found', { messageId, queueName });
        return;
      }

      const message: QueueMessage = JSON.parse(messageData);
      const handler = this.handlers.get(message.type);

      if (!handler) {
        logger.warn('No handler found for message type', { 
          messageId, 
          type: message.type, 
          queueName 
        });
        await this.markMessageFailed(messageId, 'No handler found');
        return;
      }

      // Cria execução
      const execution: JobExecution = {
        id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        jobId: messageId,
        status: 'processing',
        startedAt: new Date(),
        retryCount: message.retryCount || 0,
        tenantId: message.tenantId,
      };

      await redis.setex(executionKey, 3600, JSON.stringify(execution));

      // Executa o handler
      const startTime = Date.now();
      await handler.handler(message);
      const duration = Date.now() - startTime;

      // Marca como concluído
      execution.status = 'completed';
      execution.completedAt = new Date();
      execution.duration = duration;
      execution.result = { success: true };

      await redis.setex(executionKey, 3600, JSON.stringify(execution));
      await redis.del(messageKey);
      await redis.del(processingKey);

      logger.info('Message processed successfully', {
        messageId,
        queueName,
        type: message.type,
        duration,
      });

    } catch (error) {
      logger.error('Failed to process message', { messageId, queueName, error });
      await this.handleMessageError(messageId, queueName, error);
    }
  }

  /**
   * Trata erros de processamento de mensagens
   */
  private async handleMessageError(
    messageId: string, 
    queueName: QueueName, 
    error: any
  ): Promise<void> {
    const messageKey = this.getMessageKey(messageId);
    const processingKey = this.getProcessingKey(queueName);
    const executionKey = this.getExecutionKey(messageId);

    try {
      // Busca a mensagem para verificar retry
      const messageData = await redis.get(messageKey);
      if (!messageData) return;

      const message: QueueMessage = JSON.parse(messageData);
      const config = this.configs.get(queueName);

      if (message.retryCount && message.retryCount < (message.maxRetries || 3)) {
        // Agenda retry com backoff
        const retryCount = message.retryCount + 1;
        const delay = calculateBackoffDelay(retryCount, config?.retryStrategy || createRetryStrategy());
        
        message.retryCount = retryCount;
        await redis.setex(messageKey, 3600, JSON.stringify(message));

        // Agenda retry
        const queueKey = this.getQueueKey(queueName);
        const retryTime = Date.now() + delay;
        await redis.zadd(queueKey, retryTime, messageId);

        logger.info('Message scheduled for retry', {
          messageId,
          queueName,
          retryCount,
          delay,
        });
      } else {
        // Marca como falhado
        await this.markMessageFailed(messageId, error.message);
      }

      // Limpa execução
      await redis.del(executionKey);
      await redis.del(processingKey);

    } catch (retryError) {
      logger.error('Failed to handle message error', { 
        messageId, 
        queueName, 
        error: retryError 
      });
    }
  }

  /**
   * Marca uma mensagem como falhada
   */
  private async markMessageFailed(messageId: string, error: string): Promise<void> {
    const executionKey = this.getExecutionKey(messageId);
    const failedKey = this.getFailedKey(messageId);

    try {
      const executionData = await redis.get(executionKey);
      if (executionData) {
        const execution: JobExecution = JSON.parse(executionData);
        execution.status = 'failed';
        execution.completedAt = new Date();
        execution.error = error;

        await redis.setex(failedKey, 86400, JSON.stringify(execution)); // TTL de 24h
        await redis.del(executionKey);
      }
    } catch (error) {
      logger.error('Failed to mark message as failed', { messageId, error });
    }
  }

  /**
   * Inicia o processamento das filas
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Queue service is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting queue service');

    // Inicia processamento de cada fila
    for (const [queueName, config] of this.configs) {
      this.startQueueProcessor(queueName, config);
    }

    // Inicia scheduler para jobs agendados
    this.startScheduler();

    logger.info('Queue service started successfully');
  }

  /**
   * Para o processamento das filas
   */
  public async stop(): Promise<void> {
    if (!this.isRunning) {
      logger.warn('Queue service is not running');
      return;
    }

    this.isRunning = false;
    logger.info('Stopping queue service');

    // Para todos os intervalos
    for (const [name, interval] of this.intervals) {
      clearInterval(interval);
      this.intervals.delete(name);
    }

    logger.info('Queue service stopped');
  }

  /**
   * Inicia processador para uma fila específica
   */
  private startQueueProcessor(queueName: QueueName, config: QueueConfig): void {
    const interval = setInterval(async () => {
      if (this.isRunning) {
        await this.processQueue(queueName);
      }
    }, 1000); // Processa a cada segundo

    this.intervals.set(`processor_${queueName}`, interval);
    logger.info('Queue processor started', { queueName, concurrency: config.concurrency });
  }

  /**
   * Inicia o scheduler para jobs agendados
   */
  private startScheduler(): void {
    const interval = setInterval(async () => {
      if (this.isRunning) {
        await this.processScheduledJobs('default');
      }
    }, 60000); // Verifica a cada minuto

    this.intervals.set('scheduler', interval);
    logger.info('Job scheduler started');
  }

  /**
   * Processa todos os jobs agendados
   */
  // método duplicado removido — usar a versão com queueName

  /**
   * Executa um job agendado
   */
  private async executeScheduledJob(job: ScheduledJob): Promise<void> {
    // Envia mensagem para a fila apropriada
    await this.enqueue(job.queue, job.name, {
      scheduled: true,
      jobName: job.name,
      cron: job.cron,
      lastRun: job.lastRun,
    }, {
      priority: 1, // Alta prioridade para jobs agendados
    });
  }

  /**
   * Obtém estatísticas de uma fila
   */
  public async getQueueStats(queueName: QueueName): Promise<QueueStats> {
    if (!isValidQueueName(queueName)) {
      throw new Error(`Invalid queue name: ${queueName}`);
    }

    const queueKey = this.getQueueKey(queueName);
    const processingKey = this.getProcessingKey(queueName);
    const failedKey = this.getFailedKey(queueName);

    try {
      const [pending, processing, failed] = await Promise.all([
        redis.llen(queueKey),
        await redis.exists(processingKey) ? 1 : 0,
        redis.keys(`${failedKey}:*`).then(keys => keys.length),
      ]);

      // Calcula métricas básicas
      const total = pending + processing + failed;
      const errorRate = total > 0 ? (failed / total) * 100 : 0;

      return {
        queueName,
        pending,
        processing,
        completed: 0, // Seria calculado a partir de logs
        failed,
        retrying: 0, // Seria calculado a partir de logs
        throughput: 0, // Seria calculado a partir de logs
        averageProcessingTime: 0, // Seria calculado a partir de logs
        errorRate,
        lastJobAt: new Date(), // Seria obtido a partir de logs
      };
    } catch (error) {
      logger.error('Failed to get queue stats', { queueName, error });
      throw error;
    }
  }

  /**
   * Obtém estatísticas de todas as filas
   */
  public async getAllQueueStats(): Promise<QueueStats[]> {
    const stats: QueueStats[] = [];
    
    for (const queueName of this.configs.keys()) {
      try {
        const stat = await this.getQueueStats(queueName);
        stats.push(stat);
      } catch (error) {
        logger.error('Failed to get stats for queue', { queueName, error });
      }
    }

    return stats;
  }

  /**
   * Chaves Redis para diferentes propósitos
   */
  private getQueueKey(queueName: QueueName): string {
    return `queue:${queueName}`;
  }

  private getMessageKey(messageId: string): string {
    return `message:${messageId}`;
  }

  private getProcessingKey(queueName: QueueName): string {
    return `processing:${queueName}`;
  }

  private getExecutionKey(messageId: string): string {
    return `execution:${messageId}`;
  }

  private getFailedKey(messageId: string): string {
    return `failed:${messageId}`;
  }
}

// Exporta instância singleton
export const queueService = QueueService.getInstance();
