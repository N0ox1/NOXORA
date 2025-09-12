import { PrismaClient } from '@prisma/client';
import { createSpan, addSpanAttributes, markSpanAsError, endSpan } from '../telemetry';
import captureError from '../sentry';
import { setTenantContext } from '../sentry';

const prisma = new PrismaClient();

export interface AuditLogData {
  tenantId: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  traceId?: string;
  spanId?: string;
}

export interface AuditLogQuery {
  tenantId: string;
  userId?: string;
  action?: string;
  resource?: string;
  resourceId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export class AuditService {
  /**
   * Registrar uma ação de audit
   */
  static async log(data: AuditLogData): Promise<void> {
    const span = createSpan('audit.log', (span) => {
      span.setAttributes?.({
        'audit.action': data.action,
        'audit.resource': data.resource,
        'audit.tenant_id': data.tenantId,
        'audit.user_id': data.userId,
      });
      return span;
    });

    try {
      // Configurar contexto do tenant no Sentry
      setTenantContext(data.tenantId);

      // Adicionar atributos ao span
      addSpanAttributes(span, {
        'audit.resource_id': data.resourceId,
        'audit.ip_address': data.ipAddress,
        'audit.trace_id': data.traceId,
        'audit.span_id': data.spanId,
      });

      // Criar log de audit
      await prisma.auditLog.create({
        data: {
          tenantId: data.tenantId,
          actorId: data.userId || 'system',
          action: data.action,
          entity: data.resource,
          entityId: data.resourceId || 'unknown',
          metadata: data.details,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          requestId: data.traceId,
          sessionId: data.spanId,
          ts: new Date(),
        },
      });

      // Adicionar breadcrumb no Sentry
      captureError(new Error('Audit log created'), {
        tags: {
          type: 'audit_log',
          action: data.action,
          resource: data.resource,
          tenantId: data.tenantId,
        },
        extra: {
          audit: data,
        },
      });

      span.setStatus?.({ code: 1 }); // OK
    } catch (error) {
      markSpanAsError(span, {
        'audit.error': error instanceof Error ? error.message : 'Unknown error',
      });

      // Capturar erro no Sentry
      captureError(error as Error, {
        tags: {
          type: 'audit_error',
          action: data.action,
          resource: data.resource,
          tenantId: data.tenantId,
        },
        extra: {
          audit_data: data,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    } finally {
      endSpan();
    }
  }

  /**
   * Registrar criação de recurso
   */
  static async logCreate(
    tenantId: string,
    resource: string,
    resourceId: string,
    details: Record<string, any>,
    userId?: string,
    context?: { ipAddress?: string; userAgent?: string; traceId?: string; spanId?: string }
  ): Promise<void> {
    return this.log({
      tenantId,
      userId,
      action: 'CREATE',
      resource,
      resourceId,
      details,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      traceId: context?.traceId,
      spanId: context?.spanId,
    });
  }

  /**
   * Registrar atualização de recurso
   */
  static async logUpdate(
    tenantId: string,
    resource: string,
    resourceId: string,
    details: Record<string, any>,
    userId?: string,
    context?: { ipAddress?: string; userAgent?: string; traceId?: string; spanId?: string }
  ): Promise<void> {
    return this.log({
      tenantId,
      userId,
      action: 'UPDATE',
      resource,
      resourceId,
      details,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      traceId: context?.traceId,
      spanId: context?.spanId,
    });
  }

  /**
   * Registrar exclusão de recurso
   */
  static async logDelete(
    tenantId: string,
    resource: string,
    resourceId: string,
    details: Record<string, any>,
    userId?: string,
    context?: { ipAddress?: string; userAgent?: string; traceId?: string; spanId?: string }
  ): Promise<void> {
    return this.log({
      tenantId,
      userId,
      action: 'DELETE',
      resource,
      resourceId,
      details,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      traceId: context?.traceId,
      spanId: context?.spanId,
    });
  }

  /**
   * Registrar acesso a recurso
   */
  static async logAccess(
    tenantId: string,
    resource: string,
    resourceId: string,
    details: Record<string, any>,
    userId?: string,
    context?: { ipAddress?: string; userAgent?: string; traceId?: string; spanId?: string }
  ): Promise<void> {
    return this.log({
      tenantId,
      userId,
      action: 'ACCESS',
      resource,
      resourceId,
      details,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      traceId: context?.traceId,
      spanId: context?.spanId,
    });
  }

  /**
   * Registrar ação de autenticação
   */
  static async logAuth(
    tenantId: string,
    action: 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'PASSWORD_CHANGE' | 'PASSWORD_RESET',
    details: Record<string, any>,
    userId?: string,
    context?: { ipAddress?: string; userAgent?: string; traceId?: string; spanId?: string }
  ): Promise<void> {
    return this.log({
      tenantId,
      userId,
      action,
      resource: 'AUTH',
      details,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      traceId: context?.traceId,
      spanId: context?.spanId,
    });
  }

  /**
   * Registrar ação de billing
   */
  static async logBilling(
    tenantId: string,
    action: 'PLAN_CHANGE' | 'PAYMENT_SUCCESS' | 'PAYMENT_FAILED' | 'SUBSCRIPTION_CANCELED',
    details: Record<string, any>,
    userId?: string,
    context?: { ipAddress?: string; userAgent?: string; traceId?: string; spanId?: string }
  ): Promise<void> {
    return this.log({
      tenantId,
      userId,
      action,
      resource: 'BILLING',
      details,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
      traceId: context?.traceId,
      spanId: context?.spanId,
    });
  }

  /**
   * Consultar logs de audit
   */
  static async query(query: AuditLogQuery): Promise<any[]> {
    const span = createSpan('audit.query', (span) => {
      span.setAttributes?.({
        'audit.query.tenant_id': query.tenantId,
        'audit.query.action': query.action,
        'audit.query.resource': query.resource,
      });
      return span;
    });

    try {
      const where: any = {
        tenantId: query.tenantId,
      };

      if (query.userId) {
        where.actorId = query.userId;
      }

      if (query.action) {
        where.action = query.action;
      }

      if (query.resource) {
        where.entity = query.resource;
      }

      if (query.resourceId) {
        where.entityId = query.resourceId;
      }

      if (query.startDate || query.endDate) {
        where.ts = {};
        if (query.startDate) {
          where.ts.gte = query.startDate;
        }
        if (query.endDate) {
          where.ts.lte = query.endDate;
        }
      }

      const logs = await prisma.auditLog.findMany({
        where,
        orderBy: {
          ts: 'desc',
        },
        take: query.limit || 100,
        skip: query.offset || 0,
        select: {
          id: true,
          tenantId: true,
          actorId: true,
          action: true,
          entityId: true,
          entity: true,
          metadata: true,
          ipAddress: true,
          userAgent: true,
          requestId: true,
          sessionId: true,
          ts: true,
        },
      });

      span.setStatus?.({ code: 1 }); // OK
      return logs;
    } catch (error) {
      markSpanAsError(span, {
        'audit.query.error': error instanceof Error ? error.message : 'Unknown error',
      });

      // Capturar erro no Sentry
      captureError(error as Error, {
        tags: {
          type: 'audit_query_error',
          tenantId: query.tenantId,
        },
        extra: {
          query,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    } finally {
      endSpan();
    }
  }

  /**
   * Obter estatísticas de audit por tenant
   */
  static async getStats(tenantId: string, days: number = 30): Promise<any> {
    const span = createSpan('audit.stats', (span) => {
      span.setAttributes?.({
        'audit.stats.tenant_id': tenantId,
        'audit.stats.days': days,
      });
      return span;
    });

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const stats = await prisma.auditLog.groupBy({
        by: ['action'],
        where: {
          tenantId: tenantId,
          ts: {
            gte: startDate,
          },
        },
        _count: {
          id: true,
        },
      });

      const totalLogs = await prisma.auditLog.count({
        where: {
          tenantId: tenantId,
          ts: {
            gte: startDate,
          },
        },
      });

      span.setStatus?.({ code: 1 }); // OK
      return {
        totalLogs,
        stats: stats.map((stat: any) => ({
          action: stat.action,
          resource: stat.resource,
          count: stat._count.id,
        })),
        period: {
          start: startDate,
          end: new Date(),
          days,
        },
      };
    } catch (error) {
      markSpanAsError(span, {
        'audit.stats.error': error instanceof Error ? error.message : 'Unknown error',
      });

      // Capturar erro no Sentry
      captureError(error as Error, {
        tags: {
          type: 'audit_stats_error',
          tenantId: tenantId,
        },
        extra: {
          tenantId,
          days,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    } finally {
      endSpan();
    }
  }

  /**
   * Limpar logs antigos (manutenção)
   */
  static async cleanupOldLogs(tenantId: string, daysToKeep: number = 90): Promise<number> {
    const span = createSpan('audit.cleanup', (span) => {
      span.setAttributes?.({
        'audit.cleanup.tenant_id': tenantId,
        'audit.cleanup.days_to_keep': daysToKeep,
      });
      return span;
    });

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await prisma.auditLog.deleteMany({
        where: {
          tenantId: tenantId,
          ts: {
            lt: cutoffDate,
          },
        },
      });

      span.setStatus?.({ code: 1 }); // OK
      return result.count;
    } catch (error) {
      markSpanAsError(span, {
        'audit.cleanup.error': error instanceof Error ? error.message : 'Unknown error',
      });

      // Capturar erro no Sentry
      captureError(error as Error, {
        tags: {
          type: 'audit_cleanup_error',
          tenantId: tenantId,
        },
        extra: {
          tenantId,
          daysToKeep,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      throw error;
    } finally {
      endSpan();
    }
  }
}

// Decorator para métodos que devem ser auditados
export function audited(action: string, resource: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (this: any, ...args: any[]) {
      const tenantId = this.tenantId || args[0]?.tenantId || 'unknown';
      const userId = this.userId || args[0]?.userId;
      const resourceId = args[0]?.id || args[0]?.resourceId;
      
      try {
        const result = await method.apply(this, args);
        
        // Registrar sucesso
        await AuditService.log({
          tenantId,
          userId,
          action,
          resource,
          resourceId,
          details: {
            method: propertyKey,
            args: args.map(arg => 
              typeof arg === 'object' && arg !== null 
                ? { ...arg, __audited: true }
                : arg
            ),
            result: result ? { ...result, __audited: true } : null,
            success: true,
          },
        });
        
        return result;
      } catch (error) {
        // Registrar falha
        await AuditService.log({
          tenantId,
          userId,
          action,
          resource,
          resourceId,
          details: {
            method: propertyKey,
            args: args.map(arg => 
              typeof arg === 'object' && arg !== null 
                ? { ...arg, __audited: true }
                : arg
            ),
            error: error instanceof Error ? error.message : 'Unknown error',
            success: false,
          },
        });
        
        throw error;
      }
    };
    
    return descriptor;
  };
}export default AuditService;


