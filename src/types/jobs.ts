// Tipos para o sistema de jobs baseados no jobs.json

// ===== FILAS =====
export type QueueName = 'default' | 'notifications' | 'billing';

// ===== JOBS AGENDADOS =====
export interface ScheduledJob {
  name: string;
  cron: string;
  queue: QueueName;
  enabled?: boolean;
  lastRun?: Date;
  nextRun?: Date;
  retryCount?: number;
  maxRetries?: number;
}

// ===== MENSAGENS DE FILA =====
export interface QueueMessage<T = any> {
  id: string;
  type: string;
  data: T;
  tenantId?: string;
  userId?: string;
  priority?: number;
  retryCount?: number;
  maxRetries?: number;
  scheduledFor?: Date;
  createdAt: Date;
  metadata?: Record<string, any>;
}

// ===== HANDLERS DE JOBS =====
export interface JobHandler<T = any> {
  name: string;
  queue: QueueName;
  handler: (message: QueueMessage<T>) => Promise<void>;
  concurrency?: number;
  timeout?: number;
  retryStrategy?: RetryStrategy;
}

// ===== ESTRATÉGIA DE RETRY =====
export interface RetryStrategy {
  maxRetries: number;
  backoffMs: number;
  backoffMultiplier: number;
  maxBackoffMs: number;
}

// ===== STATUS DE JOBS =====
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'retrying' | 'cancelled';

export interface JobExecution {
  id: string;
  jobId: string;
  status: JobStatus;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  error?: string;
  result?: any;
  retryCount: number;
  tenantId?: string;
}

// ===== CONFIGURAÇÃO DE FILAS =====
export interface QueueConfig {
  name: QueueName;
  concurrency: number;
  timeout: number;
  retryStrategy: RetryStrategy;
  deadLetterQueue?: string;
  enableMetrics?: boolean;
}

// ===== ESTATÍSTICAS DE FILAS =====
export interface QueueStats {
  queueName: QueueName;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  retrying: number;
  throughput: number; // jobs por minuto
  averageProcessingTime: number; // em ms
  errorRate: number; // porcentagem
  lastJobAt?: Date;
}

// ===== FUNÇÕES UTILITÁRIAS =====
export const isValidQueueName = (name: string): name is QueueName => {
  return ['default', 'notifications', 'billing'].includes(name);
};

export const isValidCronExpression = (cron: string): boolean => {
  // Validação básica de cron (5 campos: minuto, hora, dia, mês, dia da semana)
  const cronRegex = /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/;
  return cronRegex.test(cron);
};

export const calculateNextRun = (cron: string, fromDate: Date = new Date()): Date => {
  // Implementação simplificada - em produção usar uma biblioteca como cron-parser
  // Por enquanto, retorna a data atual + 1 minuto para jobs que rodam a cada 5 min
  if (cron === '*/5 * * * *') {
    const next = new Date(fromDate);
    next.setMinutes(Math.ceil(next.getMinutes() / 5) * 5);
    next.setSeconds(0);
    next.setMilliseconds(0);
    return next;
  }
  
  // Para jobs diários às 3h da manhã
  if (cron === '0 3 * * *') {
    const next = new Date(fromDate);
    next.setHours(3, 0, 0, 0);
    if (next <= fromDate) {
      next.setDate(next.getDate() + 1);
    }
    return next;
  }
  
  // Fallback: próxima execução em 1 hora
  return new Date(fromDate.getTime() + 60 * 60 * 1000);
};

export const createRetryStrategy = (
  maxRetries: number = 3,
  backoffMs: number = 1000,
  backoffMultiplier: number = 2,
  maxBackoffMs: number = 30000
): RetryStrategy => ({
  maxRetries,
  backoffMs,
  backoffMultiplier,
  maxBackoffMs,
});

export const calculateBackoffDelay = (
  retryCount: number,
  strategy: RetryStrategy
): number => {
  const delay = strategy.backoffMs * Math.pow(strategy.backoffMultiplier, retryCount);
  return Math.min(delay, strategy.maxBackoffMs);
};
