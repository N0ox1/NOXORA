export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiEndpoint {
  method: HttpMethod;
  path: string;
}

export interface ApiConfig {
  headers: {
    tenant: string;
    auth: string;
  };
  public: ApiEndpoint[];
  admin: ApiEndpoint[];
}

// Tipos para endpoints específicos
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    database: 'healthy' | 'unhealthy';
    redis: 'healthy' | 'unhealthy';
    stripe: 'healthy' | 'unhealthy';
  };
}

export interface PublicBarbershopResponse {
  id: string;
  slug: string;
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  services: {
    id: string;
    name: string;
    duration_min: number;
    price_cents: number;
    is_active: boolean;
  }[];
  employees: {
    id: string;
    name: string;
    role: string;
    is_active: boolean;
  }[];
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  path: string;
  requestId?: string;
}

export interface ApiSuccess<T = any> {
  success: true;
  data: T;
  timestamp: string;
  requestId?: string;
}

// Tipos para validação de rotas
export interface RouteValidation {
  requiresAuth: boolean;
  requiresTenant: boolean;
  allowedMethods: HttpMethod[];
  rateLimit?: {
    windowMs: number;
    max: number;
  };
  permissions?: string[];
}

// Mapeamento de rotas para validações
export const ROUTE_VALIDATIONS: Record<string, RouteValidation> = {
  '/api/health': {
    requiresAuth: false,
    requiresTenant: false,
    allowedMethods: ['GET'],
    rateLimit: { windowMs: 60000, max: 100 }
  },
  '/api/barbershop/public/{slug}': {
    requiresAuth: false,
    requiresTenant: false,
    allowedMethods: ['GET'],
    rateLimit: { windowMs: 60000, max: 60 }
  },
  '/api/auth/register': {
    requiresAuth: false,
    requiresTenant: false,
    allowedMethods: ['POST'],
    rateLimit: { windowMs: 60000, max: 10 }
  },
  '/api/auth/login': {
    requiresAuth: false,
    requiresTenant: false,
    allowedMethods: ['POST'],
    rateLimit: { windowMs: 60000, max: 20 }
  },
  '/api/services': {
    requiresAuth: true,
    requiresTenant: true,
    allowedMethods: ['POST'],
    permissions: ['SERVICE_CRUD']
  },
  '/api/appointments': {
    requiresAuth: true,
    requiresTenant: true,
    allowedMethods: ['POST'],
    permissions: ['APPOINTMENT_CRUD']
  },
  '/api/notifications/send': {
    requiresAuth: true,
    requiresTenant: true,
    allowedMethods: ['POST'],
    permissions: ['APPOINTMENT_CRUD']
  },
  '/api/notifications/status/{param}': {
    requiresAuth: true,
    requiresTenant: true,
    allowedMethods: ['GET'],
    permissions: ['APPOINTMENT_READ']
  },
  '/api/notifications/quota': {
    requiresAuth: true,
    requiresTenant: true,
    allowedMethods: ['GET'],
    permissions: ['REPORTS_VIEW']
  },
  '/api/webhooks/subscriptions': {
    requiresAuth: true,
    requiresTenant: true,
    allowedMethods: ['GET', 'POST'],
    permissions: ['WEBHOOK_MANAGE']
  },
  '/api/webhooks/stats': {
    requiresAuth: true,
    requiresTenant: true,
    allowedMethods: ['GET'],
    permissions: ['REPORTS_VIEW']
  }
};

// Funções utilitárias
export const isPublicEndpoint = (path: string): boolean => {
  return ROUTE_VALIDATIONS[path]?.requiresAuth === false;
};

export const requiresTenant = (path: string): boolean => {
  return ROUTE_VALIDATIONS[path]?.requiresTenant === true;
};

export const getRouteValidation = (path: string): RouteValidation | null => {
  // Remove parâmetros dinâmicos para encontrar a validação
  const normalizedPath = path.replace(/\/\{[^}]+\}/g, '/{param}');
  return ROUTE_VALIDATIONS[normalizedPath] || null;
};

export const validateMethod = (path: string, method: HttpMethod): boolean => {
  const validation = getRouteValidation(path);
  return validation?.allowedMethods.includes(method) ?? false;
};

/**
 * Obtém as permissões necessárias para uma rota específica
 */
export const getRequiredApiPermissions = (path: string): string[] => {
  const validation = ROUTE_VALIDATIONS[path];
  return validation?.permissions || [];
};
