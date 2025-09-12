// src/lib/api/api-middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, hasPermission, type AccessClaims } from '@/lib/auth/jwt';

/**
 * Middleware utilitário para APIs. Use dentro dos handlers:
 * const guard = await requireAuth(req, { permission: 'SERVICE_CRUD' });
 * if (guard.response) return guard.response; // bloqueado
 * // guard.claims, guard.tenantId disponíveis
 */
export async function requireAuth(
  req: NextRequest,
  opts: { permission?: string } = {}
): Promise<{ response?: NextResponse; claims?: AccessClaims; tenantId?: string }> {
  // Tenant obrigatório
  const rawTenant = req.headers.get('x-tenant-id');
  if (!rawTenant) {
    return { response: NextResponse.json({ error: 'TENANT_HEADER_REQUIRED' }, { status: 400 }) };
  }
  const tenantId: string = rawTenant; // agora é string, não mais string|null

  // Authorization: Bearer <token>
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { response: NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 }) };
  }
  const token: string = authHeader.slice('Bearer '.length);

  // Verificar token e claims
  let claims: AccessClaims;
  try {
    claims = await verifyAccessToken(token);
  } catch {
    return { response: NextResponse.json({ error: 'INVALID_TOKEN' }, { status: 401 }) };
  }

  // Enforce tenant match
  if (claims.tenantId !== tenantId) {
    return { response: NextResponse.json({ error: 'TENANT_MISMATCH' }, { status: 403 }) };
  }

  // RBAC opcional
  if (opts.permission && !hasPermission(claims.role, opts.permission)) {
    return { response: NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 }) };
  }

  return { claims, tenantId };
}

/** Helpers opcionais para obter dados já validados dentro do handler */
export function getTenantId(req: NextRequest): string | null {
  return req.headers.get('x-tenant-id');
}

export function getBearerToken(req: NextRequest): string | null {
  const h = req.headers.get('authorization');
  if (!h || !h.startsWith('Bearer ')) return null;
  return h.slice('Bearer '.length);
}

export interface ApiMiddlewareOptions {
  enableRateLimit?: boolean;
  enableLogging?: boolean;
  enableMetrics?: boolean;
}

export class ApiMiddleware {
  private static instance: ApiMiddleware;
  private options: ApiMiddlewareOptions;

  private constructor(options: ApiMiddlewareOptions = {}) {
    this.options = {
      enableRateLimit: true,
      enableLogging: true,
      enableMetrics: true,
      ...options,
    };
  }

  public static getInstance(options?: ApiMiddlewareOptions): ApiMiddleware {
    if (!ApiMiddleware.instance) {
      ApiMiddleware.instance = new ApiMiddleware(options);
    }
    return ApiMiddleware.instance;
  }

  /**
   * Middleware principal para validação de API
   */
  async handle(
    request: NextRequest,
    handler: () => Promise<NextResponse>
  ): Promise<NextResponse> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    const path = request.nextUrl.pathname;
    const method = request.method;

    try {
      // Log da requisição
      if (this.options.enableLogging) {
        this.logRequest(request, requestId);
      }

      // Validação básica da rota
      const validation = this.validateRoute(path, method);
      if (!validation.isValid) {
        return this.createErrorResponse(validation.error || 'Erro de validação da rota', 400, requestId);
      }

      // Validação de headers obrigatórios
      const headerValidation = this.validateHeaders(request, path);
      if (!headerValidation.isValid) {
        return this.createErrorResponse(headerValidation.error || 'Erro de validação de headers', 400, requestId);
      }

      // Validação de autenticação
      if (validation.requiresAuth) {
        const authValidation = await this.validateAuthentication(request);
        if (!authValidation.isValid) {
          return this.createErrorResponse(authValidation.error || 'Erro de autenticação', 401, requestId);
        }

        // Validação de permissões
        if (validation.permissions && validation.permissions.length > 0) {
          const permissionValidation = await this.validatePermissions(
            request,
            validation.permissions
          );
          if (!permissionValidation.isValid) {
            return this.createErrorResponse(permissionValidation.error || 'Erro de permissões', 403, requestId);
          }
        }
      }

      // Executa o handler
      const response = await handler();

      // Adiciona headers de resposta
      this.addResponseHeaders(response, requestId);

      // Log da resposta
      if (this.options.enableLogging) {
        this.logResponse(response, requestId, Date.now() - startTime);
      }

      return response;

    } catch (error) {
      // Log do erro
      if (this.options.enableLogging) {
        this.logError(error, requestId, path);
      }

      return this.createErrorResponse(
        'Erro interno do servidor',
        500,
        requestId
      );
    }
  }

  /**
   * Valida se a rota é válida
   */
  private validateRoute(path: string, method: string) {
    // Implementação simplificada - você pode expandir conforme necessário
    const isPublic = path.startsWith('/api/public') || path.includes('/health');
    const requiresAuth = !isPublic;
    
    return {
      isValid: true,
      error: null,
      requiresAuth,
      permissions: []
    };
  }

  /**
   * Valida headers obrigatórios
   */
  private validateHeaders(request: NextRequest, path: string) {
    // Verifica se precisa de tenant (rotas que não são públicas)
    if (!path.startsWith('/api/public') && !path.includes('/health')) {
      const tenantId = request.headers.get('x-tenant-id');
      if (!tenantId) {
        return {
          isValid: false,
          error: 'Header x-tenant-id é obrigatório'
        };
      }
    }

    // Verifica se precisa de autenticação
    if (!path.startsWith('/api/public') && !path.includes('/health')) {
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return {
          isValid: false,
          error: 'Header Authorization com Bearer token é obrigatório'
        };
      }
    }

    return { isValid: true, error: null };
  }

  /**
   * Valida autenticação
   */
  private async validateAuthentication(request: NextRequest) {
    try {
      const authHeader = request.headers.get('authorization');
      if (!authHeader) {
        return {
          isValid: false,
          error: 'Token de autenticação não fornecido'
        };
      }

      const token = authHeader.replace('Bearer ', '');
      const payload = await verifyAccessToken(token);

      if (!payload) {
        return {
          isValid: false,
          error: 'Token de autenticação inválido'
        };
      }

      // Adiciona o usuário autenticado ao request
      (request as any).user = payload;

      return { isValid: true, error: null, user: payload };

    } catch (error) {
      return {
        isValid: false,
        error: 'Token de autenticação inválido'
      };
    }
  }

  /**
   * Valida permissões do usuário
   */
  private async validatePermissions(
    request: NextRequest,
    requiredPermissions: string[]
  ) {
    const user = (request as any).user;
    if (!user) {
      return {
        isValid: false,
        error: 'Usuário não autenticado'
      };
    }

    for (const permission of requiredPermissions) {
      if (!hasPermission(user.role, permission)) {
        return {
          isValid: false,
          error: `Permissão ${permission} é necessária`
        };
      }
    }

    return { isValid: true, error: null };
  }

  /**
   * Cria resposta de erro padronizada
   */
  private createErrorResponse(
    message: string,
    statusCode: number,
    requestId: string
  ): NextResponse {
    const errorResponse = {
      error: true,
      message,
      statusCode,
      timestamp: new Date().toISOString(),
      requestId,
      path: '/api/error'
    };

    return NextResponse.json(errorResponse, { status: statusCode });
  }

  /**
   * Adiciona headers de resposta
   */
  private addResponseHeaders(response: NextResponse, requestId: string) {
    response.headers.set('X-Request-ID', requestId);
    response.headers.set('X-API-Version', '1.0.0');
    response.headers.set('X-Response-Time', Date.now().toString());
  }

  /**
   * Gera ID único para a requisição
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log da requisição
   */
  private logRequest(request: NextRequest, requestId: string) {
    console.log(`[API] ${requestId} - ${request.method} ${request.nextUrl.pathname}`);
  }

  /**
   * Log da resposta
   */
  private logResponse(response: NextResponse, requestId: string, duration: number) {
    console.log(`[API] ${requestId} - Response ${response.status} in ${duration}ms`);
  }

  /**
   * Log de erro
   */
  private logError(error: any, requestId: string, path: string) {
    console.error(`[API] ${requestId} - Error in ${path}:`, error);
  }

  /**
   * Middleware wrapper para uso fácil
   */
  static withApi(
    handler: (request: NextRequest) => Promise<NextResponse>,
    options?: ApiMiddlewareOptions
  ) {
    const middleware = ApiMiddleware.getInstance(options);
    
    return async (request: NextRequest) => {
      return middleware.handle(request, () => handler(request));
    };
  }
}

// Exporta instância padrão
export const apiMiddleware = ApiMiddleware.getInstance();


