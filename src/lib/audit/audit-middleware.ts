import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { AuditService } from './audit-service';
import { type AuditAction, type AuditableEntity } from '@/types/audit';

export interface AuditMiddlewareOptions {
  action: AuditAction;
  entity: AuditableEntity;
  getEntityId: (request: NextRequest, response?: NextResponse) => string;
  getChanges?: (request: NextRequest, response?: NextResponse) => any[];
  getMetadata?: (request: NextRequest, response?: NextResponse) => Record<string, any>;
  shouldAudit?: (request: NextRequest, response?: NextResponse) => boolean;
}

export function withAudit(options: AuditMiddlewareOptions) {
  return function <T extends any[], R>(
    handler: (request: NextRequest, ...args: T) => Promise<R>
  ) {
    return async function (request: NextRequest, ...args: T): Promise<R> {
      const startTime = Date.now();
      let response: NextResponse | undefined;
      let error: any = null;

      try {
        // Executa o handler original
        const result = await handler(request, ...args);
        
        // Se o resultado for uma NextResponse, captura para auditoria
        if (result instanceof NextResponse) {
          response = result;
        }
        
        return result;
      } catch (err) {
        error = err;
        throw err;
      } finally {
        // Registra a auditoria
        try {
          if (options.shouldAudit && !options.shouldAudit(request, response)) {
            return undefined as any;
          }

          const entityId = options.getEntityId(request, response);
          
          // Obtém contexto da requisição
          const context = {
            tenant_id: request.headers.get('X-Tenant-Id') || 'unknown',
            actor_id: request.headers.get('X-User-Id') || 'system',
            actor_type: 'api' as const,
            actor_name: request.headers.get('X-User-Name') || 'API',
            actor_email: request.headers.get('X-User-Email'),
            ip_address: request.headers.get('x-forwarded-for') || 'unknown',
            user_agent: request.headers.get('User-Agent'),
            session_id: request.headers.get('X-Session-Id'),
            request_id: request.headers.get('X-Request-Id') || `req_${Date.now()}`,
            timestamp: new Date(),
          };

          // Obtém mudanças se disponível
          const changes = options.getChanges?.(request, response) ?? [];
          
          // Obtém metadados se disponível
          const metadata = options.getMetadata ? options.getMetadata(request, response) : {
            method: request.method,
            url: request.url,
            duration_ms: Date.now() - startTime,
            status: response?.status || (error ? 500 : 200),
            error: error ? error.message : undefined,
          };

          // Registra o log de auditoria
          await AuditService.log({
            tenantId: context.tenant_id,
            action: options.action,
            resource: options.entity,
            details: {
              entity: options.entity,
              changes,
              metadata
            }
          });
        } catch (auditError) {
          // Erro na auditoria não deve afetar a operação principal
          console.error('Audit logging failed:', auditError);
        }
      }
    };
  };
}

// Middleware específico para operações CRUD
export const auditCRUD = {
  create: (entity: AuditableEntity) => withAudit({
    action: 'CREATE',
    entity,
    getEntityId: (request, response) => {
      // Tenta extrair o ID da resposta ou do corpo da requisição
      if (response?.headers.get('X-Entity-Id')) {
        return response.headers.get('X-Entity-Id')!;
      }
      
      // Fallback para um ID baseado no timestamp
      return `temp_${Date.now()}`;
    },
    getChanges: (request, _response) => { return []; },
  }),

  read: (entity: AuditableEntity) => withAudit({
    action: 'READ',
    entity,
    getEntityId: (request) => {
      // Extrai o ID da URL ou query params
      const url = new URL(request.url);
      const pathParts = url.pathname.split('/');
      return pathParts[pathParts.length - 1] || 'unknown';
    },
  }),

  update: (entity: AuditableEntity) => withAudit({
    action: 'UPDATE',
    entity,
    getEntityId: (request) => {
      // Extrai o ID da URL
      const url = new URL(request.url);
      const pathParts = url.pathname.split('/');
      return pathParts[pathParts.length - 1] || 'unknown';
    },
    getChanges: (request, _response) => { return []; },
  }),

  delete: (entity: AuditableEntity) => withAudit({
    action: 'DELETE',
    entity,
    getEntityId: (request) => {
      // Extrai o ID da URL
      const url = new URL(request.url);
      const pathParts = url.pathname.split('/');
      return pathParts[pathParts.length - 1] || 'unknown';
    },
  }),
};

// Middleware para ações específicas
export const auditActions = {
  login: withAudit({
    action: 'LOGIN',
    entity: 'user',
    getEntityId: (request) => {
      // Para login, o ID pode vir do corpo da requisição
      return 'login_attempt';
    },
    getMetadata: (request) => ({
      method: request.method,
      url: request.url,
      success: true, // Assumindo que chegou até aqui
    }),
  }),

  logout: withAudit({
    action: 'LOGOUT',
    entity: 'user',
    getEntityId: (request) => {
      return request.headers.get('X-User-Id') || 'unknown';
    },
  }),

  export: (entity: AuditableEntity) => withAudit({
    action: 'EXPORT',
    entity,
    getEntityId: (request) => {
      return 'export_operation';
    },
    getMetadata: (request) => ({
      method: request.method,
      url: request.url,
      export_type: request.nextUrl?.searchParams.get('type') || 'unknown',
    }),
  }),

  import: (entity: AuditableEntity) => withAudit({
    action: 'IMPORT',
    entity,
    getEntityId: (request) => {
      return 'import_operation';
    },
    getMetadata: (request) => ({
      method: request.method,
      url: request.url,
      import_type: request.nextUrl?.searchParams.get('type') || 'unknown',
    }),
  }),
};
