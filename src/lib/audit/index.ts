export { AuditService, audited } from './audit-service';
export type { AuditLogData, AuditLogQuery } from './audit-service';

// Re-export para facilitar importação
export { AuditService as default } from './audit-service';

// Mock audit functions
export { audit, listAudit, clearAudit } from '../audit';
export type { AuditEntry } from '../audit';
