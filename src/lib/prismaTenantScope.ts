import type { PrismaClient } from '@prisma/client';

const __TENANT_MODELS = new Set([
  'Barbershop','Employee','Client','Service','Appointment','RefreshToken','AuditLog','IdempotencyRequest','PasswordResetToken'
]);

function __requireTenantWhere(op: string, args: any) {
  const w = args?.where ?? {};
  if (!('tenantId' in w)) throw Object.assign(new Error('tenant_scope_required'), { code: 'TENANT_WHERE_REQUIRED', op });
}
function __requireTenantUnique(op: string, args: any) {
  const w = args?.where;
  if (!w || !('tenantId' in w)) throw Object.assign(new Error('tenant_scope_required_unique'), { code: 'TENANT_UNIQUE_REQUIRED', op });
}
function __requireTenantCreate(op: string, args: any) {
  const data = args?.data;
  const rows = Array.isArray(data) ? data : [data];
  for (const row of rows) {
    if (!row || row.tenantId == null) throw Object.assign(new Error('tenant_id_missing_on_create'), { code: 'TENANT_CREATE_MISSING', op });
  }
}

export function withTenantScope(client: PrismaClient): PrismaClient {
  const anyClient = client as any;
  if (anyClient.__tenantScopeExtApplied) return client;
  const ext = anyClient.$extends({
    query: {
      $allModels: {
        create({ model, args, query }: any) {
          if (__TENANT_MODELS.has(String(model))) __requireTenantCreate('create', args);
          return query(args);
        },
        createMany({ model, args, query }: any) {
          if (__TENANT_MODELS.has(String(model))) __requireTenantCreate('createMany', args);
          return query(args);
        },
        findMany({ model, args, query }: any) {
          if (__TENANT_MODELS.has(String(model))) __requireTenantWhere('findMany', args);
          return query(args);
        },
        updateMany({ model, args, query }: any) {
          if (__TENANT_MODELS.has(String(model))) __requireTenantWhere('updateMany', args);
          return query(args);
        },
        deleteMany({ model, args, query }: any) {
          if (__TENANT_MODELS.has(String(model))) __requireTenantWhere('deleteMany', args);
          return query(args);
        },
        count({ model, args, query }: any) {
          if (__TENANT_MODELS.has(String(model))) __requireTenantWhere('count', args);
          return query(args);
        },
        aggregate({ model, args, query }: any) {
          if (__TENANT_MODELS.has(String(model))) __requireTenantWhere('aggregate', args);
          return query(args);
        },
        groupBy({ model, args, query }: any) {
          if (__TENANT_MODELS.has(String(model))) __requireTenantWhere('groupBy', args);
          return query(args);
        },
        findUnique({ model, args, query }: any) {
          if (__TENANT_MODELS.has(String(model))) __requireTenantUnique('findUnique', args);
          return query(args);
        },
        update({ model, args, query }: any) {
          if (__TENANT_MODELS.has(String(model))) __requireTenantUnique('update', args);
          return query(args);
        },
        delete({ model, args, query }: any) {
          if (__TENANT_MODELS.has(String(model))) __requireTenantUnique('delete', args);
          return query(args);
        },
        upsert({ model, args, query }: any) {
          if (__TENANT_MODELS.has(String(model))) __requireTenantUnique('upsert', args);
          return query(args);
        }
      }
    }
  });
  Object.defineProperty(ext, '__tenantScopeExtApplied', { value: true });
  return ext as PrismaClient;
}
