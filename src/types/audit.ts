// Tipos para o sistema de auditoria baseados no audit.json

// ===== TIPOS DE AÇÕES =====
export type AuditAction = 
  | 'CREATE' 
  | 'READ' 
  | 'UPDATE' 
  | 'DELETE' 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'EXPORT' 
  | 'IMPORT' 
  | 'APPROVE' 
  | 'REJECT' 
  | 'ASSIGN' 
  | 'UNASSIGN' 
  | 'ENABLE' 
  | 'DISABLE' 
  | 'ARCHIVE' 
  | 'RESTORE';

// ===== ENTIDADES AUDITÁVEIS =====
export type AuditableEntity = 
  | 'tenant' 
  | 'barbershop' 
  | 'employee' 
  | 'service' 
  | 'client' 
  | 'appointment' 
  | 'user' 
  | 'role' 
  | 'permission' 
  | 'billing_plan' 
  | 'notification' 
  | 'webhook' 
  | 'report' 
  | 'metric';

// ===== LOG DE AUDITORIA =====
export interface AuditLog {
  id: string;
  tenant_id: string;
  actor_id: string;
  action: AuditAction;
  entity: AuditableEntity;
  entity_id: string;
  ts: Date;
  // Campos adicionais para contexto
  actor_type?: 'user' | 'system' | 'api';
  actor_name?: string;
  actor_email?: string;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  request_id?: string;
  // Dados da entidade
  entity_name?: string;
  entity_type?: string;
  // Mudanças realizadas
  changes?: AuditChange[];
  // Metadados
  metadata?: Record<string, any>;
  // Severidade
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  // Status
  status?: 'SUCCESS' | 'FAILURE' | 'PENDING';
  // Mensagem de erro (se aplicável)
  error_message?: string;
  // Stack trace (para erros)
  stack_trace?: string;
}

// ===== MUDANÇA AUDITÁVEL =====
export interface AuditChange {
  field: string;
  old_value: any;
  new_value: any;
  change_type: 'ADDED' | 'MODIFIED' | 'REMOVED';
}

// ===== CONTEXTO DE AUDITORIA =====
export interface AuditContext {
  tenant_id: string;
  actor_id: string;
  actor_type: 'user' | 'system' | 'api';
  actor_name?: string;
  actor_email?: string;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  request_id?: string;
  timestamp?: Date;
}

// ===== FILTROS DE AUDITORIA =====
export interface AuditFilter {
  tenant_id?: string;
  actor_id?: string;
  action?: AuditAction | AuditAction[];
  entity?: AuditableEntity | AuditableEntity[];
  entity_id?: string;
  start_date?: Date;
  end_date?: Date;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status?: 'SUCCESS' | 'FAILURE' | 'PENDING';
  actor_type?: 'user' | 'system' | 'api';
  search?: string; // Busca por texto em campos de texto
}

// ===== CONFIGURAÇÃO DE AUDITORIA =====
export interface AuditConfig {
  enabled: boolean;
  log_levels: AuditAction[];
  sensitive_fields: string[]; // Campos que não devem ser logados
  retention_days: number;
  max_log_size: number; // MB
  compression_enabled: boolean;
  encryption_enabled: boolean;
  real_time_logging: boolean;
  batch_size: number;
  flush_interval: number; // ms
}

// ===== ESTATÍSTICAS DE AUDITORIA =====
export interface AuditStats {
  total_logs: number;
  logs_today: number;
  logs_this_week: number;
  logs_this_month: number;
  actions_distribution: Record<AuditAction, number>;
  entities_distribution: Record<AuditableEntity, number>;
  severity_distribution: Record<string, number>;
  status_distribution: Record<string, number>;
  top_actors: Array<{
    actor_id: string;
    actor_name: string;
    action_count: number;
  }>;
  top_entities: Array<{
    entity: AuditableEntity;
    action_count: number;
  }>;
}

// ===== RELATÓRIO DE AUDITORIA =====
export interface AuditReport {
  id: string;
  tenant_id: string;
  generated_at: Date;
  period: {
    start: Date;
    end: Date;
  };
  filters: AuditFilter;
  summary: {
    total_logs: number;
    unique_actors: number;
    unique_entities: number;
    actions_count: Record<AuditAction, number>;
  };
  details: AuditLog[];
  statistics: AuditStats;
  recommendations?: string[];
}

// ===== CONFIGURAÇÃO DE RETENÇÃO =====
export interface RetentionPolicy {
  entity: AuditableEntity;
  retention_days: number;
  archive_after_days: number;
  delete_after_days: number;
  compression_after_days: number;
}

// ===== FUNÇÕES UTILITÁRIAS =====
export const isValidAuditAction = (action: string): action is AuditAction => {
  return [
    'CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 
    'EXPORT', 'IMPORT', 'APPROVE', 'REJECT', 'ASSIGN', 
    'UNASSIGN', 'ENABLE', 'DISABLE', 'ARCHIVE', 'RESTORE'
  ].includes(action);
};

export const isValidAuditableEntity = (entity: string): entity is AuditableEntity => {
  return [
    'tenant', 'barbershop', 'employee', 'service', 'client', 
    'appointment', 'user', 'role', 'permission', 'billing_plan', 
    'notification', 'webhook', 'report', 'metric'
  ].includes(entity);
};

export const getAuditSeverity = (action: AuditAction, entity: AuditableEntity): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' => {
  // Ações críticas
  if (['DELETE', 'APPROVE', 'REJECT'].includes(action)) {
    return 'CRITICAL';
  }
  
  // Ações de alta importância
  if (['CREATE', 'UPDATE', 'ASSIGN', 'UNASSIGN'].includes(action)) {
    return 'HIGH';
  }
  
  // Ações de média importância
  if (['EXPORT', 'IMPORT', 'ENABLE', 'DISABLE'].includes(action)) {
    return 'MEDIUM';
  }
  
  // Ações de baixa importância
  if (['READ', 'LOGIN', 'LOGOUT', 'ARCHIVE', 'RESTORE'].includes(action)) {
    return 'LOW';
  }
  
  return 'MEDIUM';
};

export const shouldAuditAction = (action: AuditAction, entity: AuditableEntity): boolean => {
  // Sempre audita ações críticas
  if (getAuditSeverity(action, entity) === 'CRITICAL') {
    return true;
  }
  
  // Sempre audita entidades sensíveis
  const sensitiveEntities: AuditableEntity[] = ['user', 'role', 'permission', 'billing_plan'];
  if (sensitiveEntities.includes(entity)) {
    return true;
  }
  
  // Configuração padrão
  return true;
};

export const sanitizeAuditData = (data: any, sensitiveFields: string[]): any => {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  const sanitized = { ...data };
  
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
};

export const formatAuditMessage = (log: AuditLog): string => {
  const actor = log.actor_name || log.actor_id;
  const entity = log.entity_name || log.entity;
  
  switch (log.action) {
    case 'CREATE':
      return `${actor} criou ${entity} (ID: ${log.entity_id})`;
    case 'READ':
      return `${actor} visualizou ${entity} (ID: ${log.entity_id})`;
    case 'UPDATE':
      return `${actor} atualizou ${entity} (ID: ${log.entity_id})`;
    case 'DELETE':
      return `${actor} removeu ${entity} (ID: ${log.entity_id})`;
    case 'LOGIN':
      return `${actor} fez login no sistema`;
    case 'LOGOUT':
      return `${actor} fez logout do sistema`;
    case 'EXPORT':
      return `${actor} exportou dados de ${entity}`;
    case 'IMPORT':
      return `${actor} importou dados para ${entity}`;
    case 'APPROVE':
      return `${actor} aprovou ${entity} (ID: ${log.entity_id})`;
    case 'REJECT':
      return `${actor} rejeitou ${entity} (ID: ${log.entity_id})`;
    case 'ASSIGN':
      return `${actor} atribuiu ${entity} (ID: ${log.entity_id})`;
    case 'UNASSIGN':
      return `${actor} removeu atribuição de ${entity} (ID: ${log.entity_id})`;
    case 'ENABLE':
      return `${actor} habilitou ${entity} (ID: ${log.entity_id})`;
    case 'DISABLE':
      return `${actor} desabilitou ${entity} (ID: ${log.entity_id})`;
    case 'ARCHIVE':
      return `${actor} arquivou ${entity} (ID: ${log.entity_id})`;
    case 'RESTORE':
      return `${actor} restaurou ${entity} (ID: ${log.entity_id})`;
    default:
      return `${actor} executou ação ${log.action} em ${entity} (ID: ${log.entity_id})`;
  }
};
