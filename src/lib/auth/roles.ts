// Sistema de Roles e Permissões para Noxora

export enum UserRole {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  BARBER = 'BARBER',
  ASSISTANT = 'ASSISTANT',
  CLIENT = 'CLIENT',
}

export enum Permission {
  // Gestão de Barbearias
  BARBERSHOP_CREATE = 'barbershop:create',
  BARBERSHOP_READ = 'barbershop:read',
  BARBERSHOP_UPDATE = 'barbershop:update',
  BARBERSHOP_DELETE = 'barbershop:delete',
  
  // Gestão de Funcionários
  EMPLOYEE_CREATE = 'employee:create',
  EMPLOYEE_READ = 'employee:read',
  EMPLOYEE_UPDATE = 'employee:update',
  EMPLOYEE_DELETE = 'employee:delete',
  
  // Gestão de Serviços
  SERVICE_CREATE = 'service:create',
  SERVICE_READ = 'service:read',
  SERVICE_UPDATE = 'service:update',
  SERVICE_DELETE = 'service:delete',
  
  // Gestão de Clientes
  CLIENT_CREATE = 'client:create',
  CLIENT_READ = 'client:read',
  CLIENT_UPDATE = 'client:update',
  CLIENT_DELETE = 'client:delete',
  
  // Gestão de Agendamentos
  APPOINTMENT_CREATE = 'appointment:create',
  APPOINTMENT_READ = 'appointment:read',
  APPOINTMENT_UPDATE = 'appointment:update',
  APPOINTMENT_DELETE = 'appointment:delete',
  APPOINTMENT_CANCEL = 'appointment:cancel',
  
  // Gestão Financeira
  BILLING_READ = 'billing:read',
  BILLING_CREATE = 'billing:create',
  BILLING_UPDATE = 'billing:update',
  BILLING_DELETE = 'billing:delete',
  
  // Relatórios e Analytics
  REPORTS_READ = 'reports:read',
  ANALYTICS_READ = 'analytics:read',
  
  // Gestão de Sistema
  SYSTEM_SETTINGS = 'system:settings',
  USER_MANAGEMENT = 'user:management',
  AUDIT_LOGS = 'audit:logs',
}

// Mapeamento de roles para permissões
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.OWNER]: [
    // Todas as permissões
    ...Object.values(Permission),
  ],
  
  [UserRole.MANAGER]: [
    // Gestão de Barbearias
    Permission.BARBERSHOP_READ,
    Permission.BARBERSHOP_UPDATE,
    
    // Gestão de Funcionários
    Permission.EMPLOYEE_CREATE,
    Permission.EMPLOYEE_READ,
    Permission.EMPLOYEE_UPDATE,
    Permission.EMPLOYEE_DELETE,
    
    // Gestão de Serviços
    Permission.SERVICE_CREATE,
    Permission.SERVICE_READ,
    Permission.SERVICE_UPDATE,
    Permission.SERVICE_DELETE,
    
    // Gestão de Clientes
    Permission.CLIENT_CREATE,
    Permission.CLIENT_READ,
    Permission.CLIENT_UPDATE,
    Permission.CLIENT_DELETE,
    
    // Gestão de Agendamentos
    Permission.APPOINTMENT_CREATE,
    Permission.APPOINTMENT_READ,
    Permission.APPOINTMENT_UPDATE,
    Permission.APPOINTMENT_DELETE,
    Permission.APPOINTMENT_CANCEL,
    
    // Gestão Financeira
    Permission.BILLING_READ,
    Permission.BILLING_CREATE,
    Permission.BILLING_UPDATE,
    Permission.BILLING_DELETE,
    
    // Relatórios
    Permission.REPORTS_READ,
    Permission.ANALYTICS_READ,
  ],
  
  [UserRole.BARBER]: [
    // Leitura de barbearia
    Permission.BARBERSHOP_READ,
    
    // Leitura de funcionários
    Permission.EMPLOYEE_READ,
    
    // Leitura de serviços
    Permission.SERVICE_READ,
    
    // Gestão de clientes
    Permission.CLIENT_CREATE,
    Permission.CLIENT_READ,
    Permission.CLIENT_UPDATE,
    
    // Gestão de agendamentos
    Permission.APPOINTMENT_CREATE,
    Permission.APPOINTMENT_READ,
    Permission.APPOINTMENT_UPDATE,
    Permission.APPOINTMENT_CANCEL,
    
    // Leitura de faturamento
    Permission.BILLING_READ,
  ],
  
  [UserRole.ASSISTANT]: [
    // Leitura de barbearia
    Permission.BARBERSHOP_READ,
    
    // Leitura de funcionários
    Permission.EMPLOYEE_READ,
    
    // Leitura de serviços
    Permission.SERVICE_READ,
    
    // Gestão de clientes
    Permission.CLIENT_CREATE,
    Permission.CLIENT_READ,
    Permission.CLIENT_UPDATE,
    
    // Gestão de agendamentos
    Permission.APPOINTMENT_CREATE,
    Permission.APPOINTMENT_READ,
    Permission.APPOINTMENT_UPDATE,
    
    // Leitura de faturamento
    Permission.BILLING_READ,
  ],
  
  [UserRole.CLIENT]: [
    // Leitura de barbearia
    Permission.BARBERSHOP_READ,
    
    // Leitura de serviços
    Permission.SERVICE_READ,
    
    // Gestão de próprio perfil
    Permission.CLIENT_READ,
    Permission.CLIENT_UPDATE,
    
    // Gestão de próprios agendamentos
    Permission.APPOINTMENT_CREATE,
    Permission.APPOINTMENT_READ,
    Permission.APPOINTMENT_UPDATE,
    Permission.APPOINTMENT_CANCEL,
    
    // Leitura de própria fatura
    Permission.BILLING_READ,
  ],
};

// Funções utilitárias para verificação de permissões
export class RoleService {
  /**
   * Obtém todas as permissões de um role
   */
  static getPermissionsForRole(role: UserRole): Permission[] {
    return ROLE_PERMISSIONS[role] || [];
  }

  /**
   * Verifica se um role tem uma permissão específica
   */
  static hasPermission(role: UserRole, permission: Permission): boolean {
    const permissions = this.getPermissionsForRole(role);
    return permissions.includes(permission);
  }

  /**
   * Verifica se um role tem qualquer uma das permissões especificadas
   */
  static hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
    const rolePermissions = this.getPermissionsForRole(role);
    return permissions.some(permission => rolePermissions.includes(permission));
  }

  /**
   * Verifica se um role tem todas as permissões especificadas
   */
  static hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
    const rolePermissions = this.getPermissionsForRole(role);
    return permissions.every(permission => rolePermissions.includes(permission));
  }

  /**
   * Obtém todos os roles que têm uma permissão específica
   */
  static getRolesWithPermission(permission: Permission): UserRole[] {
    return Object.entries(ROLE_PERMISSIONS)
      .filter(([_, permissions]) => permissions.includes(permission))
      .map(([role]) => role as UserRole);
  }

  /**
   * Verifica se um role é superior a outro
   */
  static isRoleSuperior(role1: UserRole, role2: UserRole): boolean {
    const hierarchy = {
      [UserRole.OWNER]: 5,
      [UserRole.MANAGER]: 4,
      [UserRole.BARBER]: 3,
      [UserRole.ASSISTANT]: 2,
      [UserRole.CLIENT]: 1,
    };

    return hierarchy[role1] > hierarchy[role2];
  }

  /**
   * Obtém o nível hierárquico de um role
   */
  static getRoleLevel(role: UserRole): number {
    const hierarchy = {
      [UserRole.OWNER]: 5,
      [UserRole.MANAGER]: 4,
      [UserRole.BARBER]: 3,
      [UserRole.ASSISTANT]: 2,
      [UserRole.CLIENT]: 1,
    };

    return hierarchy[role];
  }
}
