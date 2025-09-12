// src/lib/auth/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { JWTService, type Role, type CustomJWTPayload, hasPermission } from './jwt';

// Tipos para o middleware
export interface AuthContext {
  user: CustomJWTPayload;
  hasRole: (role: Role) => boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyRole: (roles: Role[]) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
}

// Middleware de autenticação base
export function requireAuth() {
  return async function (request: NextRequest) {
    try {
      // Obter token do header Authorization
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'Token de acesso não fornecido' },
          { status: 401 }
        );
      }

      const token = authHeader.substring(7); // Remove "Bearer "
      
      // Verificar token
      const payload = await JWTService.verifyAccessToken(token);
      
      // Criar contexto de autenticação
      const authContext: AuthContext = {
        user: payload,
        hasRole: (role: Role) => payload.role === role,
        hasPermission: (permission: string) => hasPermission(payload.role, permission),
        hasAnyRole: (roles: Role[]) => roles.includes(payload.role),
        hasAnyPermission: (permissions: string[]) => permissions.some(permission => hasPermission(payload.role, permission)),
      };

      // Adicionar contexto à request
      (request as any).auth = authContext;
      
      return null; // Continua para o próximo middleware/handler
    } catch (error) {
      return NextResponse.json(
        { error: 'Token de acesso inválido ou expirado' },
        { status: 401 }
      );
    }
  };
}

// Middleware de autenticação com role específico
export function requireRole(requiredRole: Role) {
  return async function (request: NextRequest) {
    try {
      // Primeiro verificar autenticação
      const authResult = await requireAuth()(request);
      if (authResult) return authResult; // Erro de autenticação

      const authContext = (request as any).auth as AuthContext;
      
      // Verificar se tem o role necessário
      if (!authContext.hasRole(requiredRole)) {
        return NextResponse.json(
          { error: `Role '${requiredRole}' é necessário para acessar este recurso` },
          { status: 403 }
        );
      }

      return null; // Continua para o próximo middleware/handler
    } catch (error) {
      return NextResponse.json(
        { error: 'Erro na verificação de role' },
        { status: 500 }
      );
    }
  };
}

// Middleware de autenticação com qualquer role da lista
export function requireAnyRole(requiredRoles: Role[]) {
  return async function (request: NextRequest) {
    try {
      // Primeiro verificar autenticação
      const authResult = await requireAuth()(request);
      if (authResult) return authResult; // Erro de autenticação

      const authContext = (request as any).auth as AuthContext;
      
      // Verificar se tem pelo menos um dos roles necessários
      if (!authContext.hasAnyRole(requiredRoles)) {
        return NextResponse.json(
          { error: `Um dos roles [${requiredRoles.join(', ')}] é necessário para acessar este recurso` },
          { status: 403 }
        );
      }

      return null; // Continua para o próximo middleware/handler
    } catch (error) {
      return NextResponse.json(
        { error: 'Erro na verificação de roles' },
        { status: 500 }
      );
    }
  };
}

// Middleware de autenticação com permissão específica
export function requirePermission(requiredPermission: string) {
  return async function (request: NextRequest) {
    try {
      // Primeiro verificar autenticação
      const authResult = await requireAuth()(request);
      if (authResult) return authResult; // Erro de autenticação

      const authContext = (request as any).auth as AuthContext;
      
      // Verificar se tem a permissão necessária
      if (!authContext.hasPermission(requiredPermission)) {
        return NextResponse.json(
          { error: `Permissão '${requiredPermission}' é necessária para acessar este recurso` },
          { status: 403 }
        );
      }

      return null; // Continua para o próximo middleware/handler
    } catch (error) {
      return NextResponse.json(
        { error: 'Erro na verificação de permissão' },
        { status: 500 }
      );
    }
  };
}

// Middleware de autenticação com qualquer permissão da lista
export function requireAnyPermission(requiredPermissions: string[]) {
  return async function (request: NextRequest) {
    try {
      // Primeiro verificar autenticação
      const authResult = await requireAuth()(request);
      if (authResult) return authResult; // Erro de autenticação

      const authContext = (request as any).auth as AuthContext;
      
      // Verificar se tem pelo menos uma das permissões necessárias
      if (!authContext.hasAnyPermission(requiredPermissions)) {
        return NextResponse.json(
          { error: `Uma das permissões [${requiredPermissions.join(', ')}] é necessária para acessar este recurso` },
          { status: 403 }
        );
      }

      return null; // Continua para o próximo middleware/handler
    } catch (error) {
      return NextResponse.json(
        { error: 'Erro na verificação de permissões' },
        { status: 500 }
      );
    }
  };
}

// Middleware de autenticação com role mínimo (hierárquico)
export function requireMinRole(minRole: Role) {
  return async function (request: NextRequest) {
    try {
      // Primeiro verificar autenticação
      const authResult = await requireAuth()(request);
      if (authResult) return authResult; // Erro de autenticação

      const authContext = (request as any).auth as AuthContext;
      
      // Verificar se tem pelo menos o role mínimo
      const userRole = authContext.user.role;
      if (!isRoleAtLeast(userRole, minRole)) {
        return NextResponse.json(
          { error: `Role mínimo '${minRole}' é necessário para acessar este recurso` },
          { status: 403 }
        );
      }

      return null; // Continua para o próximo middleware/handler
    } catch (error) {
      return NextResponse.json(
        { error: 'Erro na verificação de role mínimo' },
        { status: 500 }
      );
    }
  };
}

// Função utilitária para obter contexto de autenticação
export function getAuthContext(request: NextRequest): AuthContext | null {
  return (request as any).auth || null;
}

// Função utilitária para verificar se usuário está autenticado
export function isAuthenticated(request: NextRequest): boolean {
  return getAuthContext(request) !== null;
}

// Funções utilitárias para hierarquia de roles
export function roleRank(role: Role): number {
  const order: Role[] = ['VIEWER','STAFF','MANAGER','OWNER','SUPER_ADMIN'];
  return Math.max(0, order.indexOf(role));
}

export function isRoleAtLeast(current: Role, highest: Role): boolean {
  return roleRank(current) >= roleRank(highest);
}


