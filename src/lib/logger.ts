import { config } from './config';

// Níveis de log
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

// Interface para contexto de log
export interface LogContext {
  tenantId?: string;
  userId?: string;
  requestId?: string;
  operation?: string;
  duration?: number;
  [key: string]: any;
}

// Interface para entrada de log
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: LogContext;
  error?: Error;
}

// Classe principal do logger
export class Logger {
  private static instance: Logger;
  private isDevelopment: boolean;

  private constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  // Log de erro
  public error(message: string, context: LogContext = {}, error?: Error): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  // Log de aviso
  public warn(message: string, context: LogContext = {}): void {
    this.log(LogLevel.WARN, message, context);
  }

  // Log de informação
  public info(message: string, context: LogContext = {}): void {
    this.log(LogLevel.INFO, message, context);
  }

  // Log de debug
  public debug(message: string, context: LogContext = {}): void {
    if (this.isDevelopment) {
      this.log(LogLevel.DEBUG, message, context);
    }
  }

  // Método principal de logging
  private log(level: LogLevel, message: string, context: LogContext = {}, error?: Error): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        environment: process.env.NODE_ENV || 'development',
        service: 'noxora',
        version: '1.0.0',
        ...context,
      },
      error,
    };

    // Em desenvolvimento, log no console
    if (this.isDevelopment) {
      this.logToConsole(logEntry);
    }

    // Em produção, enviar para sistema de observabilidade
    if ((config as any).current?.enableLogs) {
      this.logToObservability(logEntry);
    }
  }

  // Log no console para desenvolvimento
  private logToConsole(entry: LogEntry): void {
    const { timestamp, level, message, context, error } = entry;
    
    const emoji = this.getLevelEmoji(level);
    const color = this.getLevelColor(level);
    
    console.group(`${emoji} [${timestamp}] ${level.toUpperCase()}: ${message}`);
    
    if (Object.keys(context).length > 0) {
      console.log('📋 Contexto:', context);
    }
    
    if (error) {
      console.error('❌ Erro:', error);
      console.error('📚 Stack:', error.stack);
    }
    
    console.groupEnd();
  }

  // Log para sistema de observabilidade
  private async logToObservability(entry: LogEntry): Promise<void> {
    try {
      // Aqui você pode implementar o envio para:
      // - Sentry
      // - DataDog
      // - New Relic
      // - Logs do Vercel
      
      if (entry.level === LogLevel.ERROR && entry.error) {
        // Enviar erro para Sentry
        // Sentry.captureException(entry.error, {
        //   extra: entry.context,
        //   tags: {
        //     tenantId: entry.context.tenantId,
        //     operation: entry.context.operation,
        //   },
        // });
      }
      
      // Enviar log para sistema de observabilidade
      // await fetch(config.observability.otlp_endpoint, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(entry),
      // });
      
    } catch (logError) {
      // Fallback para console em caso de erro no sistema de observabilidade
      console.error('Erro ao enviar log para observabilidade:', logError);
      this.logToConsole(entry);
    }
  }

  // Emojis para diferentes níveis de log
  private getLevelEmoji(level: LogLevel): string {
    switch (level) {
      case LogLevel.ERROR: return '🚨';
      case LogLevel.WARN: return '⚠️';
      case LogLevel.INFO: return 'ℹ️';
      case LogLevel.DEBUG: return '🐛';
      default: return '📝';
    }
  }

  // Cores para diferentes níveis de log
  private getLevelColor(level: LogLevel): string {
    switch (level) {
      case LogLevel.ERROR: return '#ef4444';
      case LogLevel.WARN: return '#f59e0b';
      case LogLevel.INFO: return '#3b82f6';
      case LogLevel.DEBUG: return '#10b981';
      default: return '#6b7280';
    }
  }

  // Método para criar logger com contexto padrão
  public withContext(defaultContext: LogContext): Logger {
    const logger = new Logger();
    logger.log = (level: LogLevel, message: string, context: LogContext = {}, error?: Error) => {
      this.log(level, message, { ...defaultContext, ...context }, error);
    };
    return logger;
  }
}

// Instância global do logger
export const logger = Logger.getInstance();

// Funções de conveniência
export const logError = (message: string, context?: LogContext, error?: Error) => 
  logger.error(message, context, error);

export const logWarn = (message: string, context?: LogContext) => 
  logger.warn(message, context);

export const logInfo = (message: string, context?: LogContext) => 
  logger.info(message, context);

export const logDebug = (message: string, context?: LogContext) => 
  logger.debug(message, context);

// Logger com contexto de tenant
export const createTenantLogger = (tenantId: string) => 
  logger.withContext({ tenantId });

// Logger com contexto de operação
export const createOperationLogger = (operation: string, tenantId?: string) => 
  logger.withContext({ operation, tenantId });


