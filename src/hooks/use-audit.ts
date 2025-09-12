import { useCallback } from 'react';
import { type AuditAction, type AuditableEntity, type AuditContext } from '@/types/audit';

interface UseAuditOptions {
  tenantId: string;
  actorId: string;
  actorType?: 'user' | 'system' | 'api';
  actorName?: string;
  actorEmail?: string;
}

export function useAudit(options: UseAuditOptions) {
  const { tenantId, actorId, actorType = 'user', actorName, actorEmail } = options;

  const logAction = useCallback(async (
    action: AuditAction,
    entity: AuditableEntity,
    entityId: string,
    changes?: any[],
    metadata?: Record<string, any>
  ) => {
    try {
      const context: AuditContext = {
        tenant_id: tenantId,
        actor_id: actorId,
        actor_type: actorType,
        actor_name: actorName,
        actor_email: actorEmail,
        timestamp: new Date(),
      };

      // Em uma implementação real, você chamaria a API de auditoria
      // Por enquanto, apenas registra no console
      console.log('🔍 AUDIT LOG:', {
        context,
        action,
        entity,
        entity_id: entityId,
        changes,
        metadata,
      });

      // Aqui você pode fazer uma chamada para a API de auditoria
      // await fetch('/api/audit/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     context,
      //     action,
      //     entity,
      //     entity_id: entityId,
      //     changes,
      //     metadata,
      //   }),
      // });

    } catch (error) {
      console.error('Failed to log audit action:', error);
    }
  }, [tenantId, actorId, actorType, actorName, actorEmail]);

  const logCreate = useCallback((entity: AuditableEntity, entityId: string, data?: any) => {
    return logAction('CREATE', entity, entityId, undefined, {
      action_type: 'create',
      data,
      timestamp: new Date().toISOString(),
    });
  }, [logAction]);

  const logRead = useCallback((entity: AuditableEntity, entityId: string, filters?: any) => {
    return logAction('READ', entity, entityId, undefined, {
      action_type: 'read',
      filters,
      timestamp: new Date().toISOString(),
    });
  }, [logAction]);

  const logUpdate = useCallback((entity: AuditableEntity, entityId: string, changes: any[], oldData?: any, newData?: any) => {
    return logAction('UPDATE', entity, entityId, changes, {
      action_type: 'update',
      old_data: oldData,
      new_data: newData,
      timestamp: new Date().toISOString(),
    });
  }, [logAction]);

  const logDelete = useCallback((entity: AuditableEntity, entityId: string, deletedData?: any) => {
    return logAction('DELETE', entity, entityId, undefined, {
      action_type: 'delete',
      deleted_data: deletedData,
      timestamp: new Date().toISOString(),
    });
  }, [logAction]);

  const logLogin = useCallback((userId: string, success: boolean, metadata?: any) => {
    return logAction('LOGIN', 'user', userId, undefined, {
      action_type: 'login',
      success,
      metadata,
      timestamp: new Date().toISOString(),
    });
  }, [logAction]);

  const logLogout = useCallback((userId: string, metadata?: any) => {
    return logAction('LOGOUT', 'user', userId, undefined, {
      action_type: 'logout',
      metadata,
      timestamp: new Date().toISOString(),
    });
  }, [logAction]);

  const logExport = useCallback((entity: AuditableEntity, exportType: string, filters?: any) => {
    return logAction('EXPORT', entity, 'export_operation', undefined, {
      action_type: 'export',
      export_type: exportType,
      filters,
      timestamp: new Date().toISOString(),
    });
  }, [logAction]);

  const logImport = useCallback((entity: AuditableEntity, importType: string, recordCount?: number) => {
    return logAction('IMPORT', entity, 'import_operation', undefined, {
      action_type: 'import',
      import_type: importType,
      record_count: recordCount,
      timestamp: new Date().toISOString(),
    });
  }, [logAction]);

  return {
    logAction,
    logCreate,
    logRead,
    logUpdate,
    logDelete,
    logLogin,
    logLogout,
    logExport,
    logImport,
  };
}
