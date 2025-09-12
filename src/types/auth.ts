// Tipos baseados no auth.json
export type Permission = 
  | 'TENANT_READ'
  | 'TENANT_UPDATE'
  | 'BILLING_MANAGE'
  | 'SHOP_CRUD'
  | 'SHOP_READ'
  | 'EMPLOYEE_CRUD'
  | 'SERVICE_CRUD'
  | 'SERVICE_READ'
  | 'APPOINTMENT_CRUD'
  | 'REPORTS_VIEW'
  | 'WEBHOOK_MANAGE';

export type Role = 'OWNER' | 'MANAGER' | 'STAFF' | 'VIEWER';

// Configuração de roles e permissões
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  OWNER: [
    'TENANT_READ',
    'TENANT_UPDATE',
    'BILLING_MANAGE',
    'SHOP_CRUD',
    'EMPLOYEE_CRUD',
    'SERVICE_CRUD',
    'APPOINTMENT_CRUD',
    'REPORTS_VIEW',
    'WEBHOOK_MANAGE'
  ],
  MANAGER: [
    'SHOP_READ',
    'EMPLOYEE_CRUD',
    'SERVICE_CRUD',
    'APPOINTMENT_CRUD',
    'REPORTS_VIEW'
  ],
  STAFF: [
    'APPOINTMENT_CRUD',
    'SERVICE_READ'
  ],
  VIEWER: [
    'REPORTS_VIEW'
  ]
};

// Interface para usuário autenticado
export interface AuthenticatedUser {
  id: string;
  tenantId: string;
  barbershopId?: string;
  email: string;
  name: string;
  role: Role;
  permissions: Permission[];
  isActive: boolean;
  lastLoginAt?: Date;
}

// Interface para payload JWT
export interface JWTPayload {
  sub: string; // user ID
  tenantId: string;
  barbershopId?: string;
  email: string;
  role: Role;
  permissions: Permission[];
  iat: number; // issued at
  exp: number; // expiration
}

// Interface para refresh token
export interface RefreshToken {
  id: string;
  userId: string;
  tenantId: string;
  token: string;
  expiresAt: Date;
  isRevoked: boolean;
  createdAt: Date;
  lastUsedAt?: Date;
}

// Interface para login
export interface LoginRequest {
  email: string;
  password: string;
  tenantId: string;
}

export interface LoginResponse {
  user: AuthenticatedUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Interface para refresh
export interface RefreshRequest {
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Interface para registro
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  tenantId: string;
  barbershopId?: string;
  role?: Role;
}

// Interface para mudança de senha
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Interface para reset de senha
export interface ResetPasswordRequest {
  email: string;
  tenantId: string;
}

export interface ResetPasswordConfirmRequest {
  token: string;
  newPassword: string;
}

// Interface para verificação de permissões
export interface PermissionCheck {
  permission: Permission;
  resource?: {
    type: 'tenant' | 'barbershop' | 'employee' | 'service' | 'appointment';
    id?: string;
    tenantId?: string;
  };
}

// Interface para contexto de autenticação
export interface AuthContext {
  user: AuthenticatedUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  hasPermission: (permission: Permission, resource?: PermissionCheck['resource']) => boolean;
  hasRole: (role: Role) => boolean;
}

// Interface para middleware de autenticação
export interface AuthMiddlewareOptions {
  requireAuth?: boolean;
  requiredPermissions?: Permission[];
  requiredRole?: Role;
  resourceType?: 'tenant' | 'barbershop' | 'employee' | 'service' | 'appointment';
}

// Interface para configuração de autenticação
export interface AuthConfig {
  jwt: {
    accessTtlMin: number;
    refreshTtlDays: number;
    secret: string;
    refreshSecret: string;
  };
  roles: Record<Role, Permission[]>;
  rls: {
    enabled: boolean;
    policy: string;
  };
  bcrypt: {
    rounds: number;
  };
  session: {
    maxConcurrentSessions: number;
    idleTimeoutMinutes: number;
  };
}

// Funções utilitárias para verificação de permissões
export const hasPermission = (user: AuthenticatedUser, permission: Permission): boolean => {
  return user.permissions.includes(permission);
};

export const hasRole = (user: AuthenticatedUser, role: Role): boolean => {
  return user.role === role;
};

export const hasAnyRole = (user: AuthenticatedUser, roles: Role[]): boolean => {
  return roles.includes(user.role);
};

export const hasAllPermissions = (user: AuthenticatedUser, permissions: Permission[]): boolean => {
  return permissions.every(permission => user.permissions.includes(permission));
};

export const hasAnyPermission = (user: AuthenticatedUser, permissions: Permission[]): boolean => {
  return permissions.some(permission => user.permissions.includes(permission));
};

// Função para verificar permissões em recursos específicos
export const canAccessResource = (
  user: AuthenticatedUser,
  permission: Permission,
  resource?: PermissionCheck['resource']
): boolean => {
  // Verificar se o usuário tem a permissão básica
  if (!hasPermission(user, permission)) {
    return false;
  }

  // Se não há recurso específico, apenas a permissão é suficiente
  if (!resource) {
    return true;
  }

  // Verificar se o usuário pode acessar o recurso do tenant
  if (resource.tenantId && resource.tenantId !== user.tenantId) {
    return false;
  }

  // Verificar permissões específicas por tipo de recurso
  switch (resource.type) {
    case 'tenant':
      return hasPermission(user, 'TENANT_READ') || hasPermission(user, 'TENANT_UPDATE');
    
    case 'barbershop':
      if (hasPermission(user, 'SHOP_CRUD')) return true;
      if (hasPermission(user, 'SHOP_READ') && resource.id === user.barbershopId) return true;
      return false;
    
    case 'employee':
      if (hasPermission(user, 'EMPLOYEE_CRUD')) return true;
      // Funcionários podem ver apenas colegas da mesma barbearia
      if (resource.id === user.id) return true;
      if (resource.tenantId === user.tenantId && resource.id === user.barbershopId) return true;
      return false;
    
    case 'service':
      if (hasPermission(user, 'SERVICE_CRUD')) return true;
      if (hasPermission(user, 'SERVICE_READ')) return true;
      return false;
    
    case 'appointment':
      if (hasPermission(user, 'APPOINTMENT_CRUD')) return true;
      return false;
    
    default:
      return false;
  }
};

// Função para obter permissões mínimas necessárias para uma operação
export const getRequiredPermissions = (operation: string): Permission[] => {
  const permissionMap: Record<string, Permission[]> = {
    'tenant.read': ['TENANT_READ'],
    'tenant.update': ['TENANT_UPDATE'],
    'billing.manage': ['BILLING_MANAGE'],
    'shop.create': ['SHOP_CRUD'],
    'shop.read': ['SHOP_READ', 'SHOP_CRUD'],
    'shop.update': ['SHOP_CRUD'],
    'shop.delete': ['SHOP_CRUD'],
    'employee.create': ['EMPLOYEE_CRUD'],
    'employee.read': ['EMPLOYEE_CRUD'],
    'employee.update': ['EMPLOYEE_CRUD'],
    'employee.delete': ['EMPLOYEE_CRUD'],
    'service.create': ['SERVICE_CRUD'],
    'service.read': ['SERVICE_READ', 'SERVICE_CRUD'],
    'service.update': ['SERVICE_CRUD'],
    'service.delete': ['SERVICE_CRUD'],
    'appointment.create': ['APPOINTMENT_CRUD'],
    'appointment.read': ['APPOINTMENT_CRUD'],
    'appointment.update': ['APPOINTMENT_CRUD'],
    'appointment.delete': ['APPOINTMENT_CRUD'],
    'reports.view': ['REPORTS_VIEW']
  };

  return permissionMap[operation] || [];
};


