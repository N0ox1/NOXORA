// src/lib/auth/jwt.ts
// Mock para desenvolvimento. Substitua por lib real (jose/jsonwebtoken) depois.

export type Role = 'SUPER_ADMIN' | 'OWNER' | 'MANAGER' | 'STAFF' | 'VIEWER';
export type AccessClaims = {
  sub: string;      // userId
  tenantId: string; // tenant atual
  role: Role;       // RBAC
  exp?: number;
  iat?: number;
};
export type CustomJWTPayload = AccessClaims;

const ROLE_PERMISSIONS: Record<Role, string[]> = {
  SUPER_ADMIN: ['TENANT_READ','TENANT_UPDATE','BILLING_MANAGE','SHOP_CRUD','EMPLOYEE_CRUD','SERVICE_CRUD','APPOINTMENT_CRUD','REPORTS_VIEW','WEBHOOKS_MANAGE'],
  OWNER:       ['TENANT_READ','TENANT_UPDATE','BILLING_MANAGE','SHOP_CRUD','EMPLOYEE_CRUD','SERVICE_CRUD','APPOINTMENT_CRUD','REPORTS_VIEW'],
  MANAGER:     ['SHOP_READ','EMPLOYEE_CRUD','SERVICE_CRUD','APPOINTMENT_CRUD','REPORTS_VIEW'],
  STAFF:       ['APPOINTMENT_CRUD','SERVICE_READ'],
  VIEWER:      ['REPORTS_VIEW']
};

function b64urlEncode(obj: unknown): string {
  const json = typeof obj === 'string' ? obj : JSON.stringify(obj ?? {});
  return Buffer.from(json).toString('base64url');
}
function b64urlDecodeToJSON<T = any>(b64: string): T {
  const s = Buffer.from(b64, 'base64url').toString('utf8');
  return JSON.parse(s);
}

export async function verifyAccessToken(token: string): Promise<AccessClaims> {
  if (!token) throw new Error('INVALID_TOKEN');
  const parts = token.split('.');
  let payload: any;
  if (parts.length >= 2) {
    payload = b64urlDecodeToJSON(parts[1]);
  } else if (token.startsWith('mock.')) {
    payload = b64urlDecodeToJSON(token.slice(5));
  } else {
    throw new Error('INVALID_TOKEN');
  }
  if (!payload?.tenantId || !payload?.sub || !payload?.role) throw new Error('INVALID_TOKEN');
  return { sub: String(payload.sub), tenantId: String(payload.tenantId), role: String(payload.role).toUpperCase() as Role, exp: payload.exp, iat: payload.iat };
}

export function hasPermission(role: Role, permission: string): boolean {
  return (ROLE_PERMISSIONS[role] ?? []).includes(permission);
}
export function permissionsOf(role: Role): string[] { return ROLE_PERMISSIONS[role] ?? []; }

export class JWTService {
  static signAccessToken(payload: AccessClaims): string {
    // Mock: header+payload base64url, sem assinatura
    const header = b64urlEncode({ alg: 'none', typ: 'JWT' });
    const body = b64urlEncode(payload);
    return `${header}.${body}.`;
  }
  static signRefreshToken(payload: Pick<AccessClaims, 'sub' | 'tenantId' | 'role'> & { exp?: number }): string {
    return 'mock.' + b64urlEncode(payload);
  }
  static async verifyAccessToken(token: string): Promise<AccessClaims> {
    return verifyAccessToken(token);
  }
  static decode(token: string): Partial<AccessClaims> | null {
    try {
      const parts = token.split('.');
      if (parts.length >= 2) return b64urlDecodeToJSON(parts[1]);
      if (token.startsWith('mock.')) return b64urlDecodeToJSON(token.slice(5));
      return null;
    } catch { return null; }
  }
}

export { ROLE_PERMISSIONS };


