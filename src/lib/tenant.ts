import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';

// Schemas de validação
export const TenantSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  domain: z.string().optional(),
  plan: z.enum(['STARTER', 'PRO', 'SCALE']),
  status: z.enum(['ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELED']),
  isActive: z.boolean(),
  settings: z.record(z.any()).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const TenantCreateSchema = TenantSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const TenantUpdateSchema = TenantCreateSchema.partial();

// Tipos
export type Tenant = z.infer<typeof TenantSchema>;
export type TenantCreate = z.infer<typeof TenantCreateSchema>;
export type TenantUpdate = z.infer<typeof TenantUpdateSchema>;

export interface TenantSettings {
  maxBarbershops: number;
  maxEmployees: number;
  maxClients: number;
  features: string[];
  branding: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
}

export interface TenantLimits {
  barbershops: number;
  employees: number;
  clients: number;
  appointments: number;
  storage: number; // MB
}

// DTOs Zod exigindo tenant_id
export const BaseTenantDTO = z.object({
  tenant_id: z.string().min(1, 'tenant_id é obrigatório'),
});

export const BarbershopDTO = BaseTenantDTO.extend({
  name: z.string().min(1, 'Nome é obrigatório'),
  slug: z.string().min(1, 'Slug é obrigatório'),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  is_active: z.boolean().default(true),
});

export const EmployeeDTO = BaseTenantDTO.extend({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  role: z.enum(['OWNER', 'MANAGER', 'BARBER', 'ASSISTANT']),
  barbershop_id: z.string().min(1, 'barbershop_id é obrigatório'),
  is_active: z.boolean().default(true),
});

export const ServiceDTO = BaseTenantDTO.extend({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  duration_min: z.number().min(1, 'Duração deve ser maior que 0'),
  price_cents: z.number().min(0, 'Preço deve ser maior ou igual a 0'),
  barbershop_id: z.string().min(1, 'barbershop_id é obrigatório'),
  is_active: z.boolean().default(true),
});

export const ClientDTO = BaseTenantDTO.extend({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido').optional(),
  phone: z.string().min(1, 'Telefone é obrigatório'),
  address: z.string().optional(),
  birth_date: z.date().optional(),
  notes: z.string().optional(),
});

export const AppointmentDTO = BaseTenantDTO.extend({
  client_id: z.string().min(1, 'client_id é obrigatório'),
  service_id: z.string().min(1, 'service_id é obrigatório'),
  employee_id: z.string().min(1, 'employee_id é obrigatório'),
  barbershop_id: z.string().min(1, 'barbershop_id é obrigatório'),
  start_at: z.date(),
  end_at: z.date().optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELED', 'DONE', 'NO_SHOW']).default('PENDING'),
  notes: z.string().optional(),
});

// Serviço de Tenant
export class TenantService {
  /**
   * Resolve o tenant da requisição baseado em múltiplas estratégias
   */
  static async resolveTenant(req: NextRequest): Promise<Tenant | null> {
    try {
      // 1. Tentar resolver por header X-Tenant-Id
      const tenantId = req.headers.get('X-Tenant-Id');
      if (tenantId) {
        return await this.getTenantById(tenantId);
      }

      // 2. Tentar resolver por subdomínio
      const hostname = req.headers.get('host') || '';
      const subdomain = this.extractSubdomain(hostname);
      if (subdomain) {
        return await this.getTenantBySubdomain(subdomain);
      }

      // 3. Tentar resolver por domínio customizado
      const domain = this.extractDomain(hostname);
      if (domain) {
        return await this.getTenantByDomain(domain);
      }

      return null;
    } catch (error) {
      console.error('Erro ao resolver tenant:', error);
      return null;
    }
  }

  /**
   * Extrai subdomínio do hostname
   */
  private static extractSubdomain(hostname: string): string | null {
    // Remove porta se existir
    const cleanHostname = hostname.split(':')[0];
    
    // Verifica se é localhost (desenvolvimento)
    if (cleanHostname === 'localhost' || cleanHostname.startsWith('127.0.0.1')) {
      return null;
    }

    // Verifica se tem subdomínio (ex: tenant1.localhost:3000)
    const parts = cleanHostname.split('.');
    if (parts.length > 2) {
      return parts[0];
    }

    return null;
  }

  /**
   * Extrai domínio do hostname
   */
  private static extractDomain(hostname: string): string | null {
    const cleanHostname = hostname.split(':')[0];
    
    // Verifica se é localhost (desenvolvimento)
    if (cleanHostname === 'localhost' || cleanHostname.startsWith('127.0.0.1')) {
      return null;
    }

    // Retorna o domínio completo
    return cleanHostname;
  }

  /**
   * Obtém tenant por ID
   */
  static async getTenantById(tenantId: string): Promise<Tenant | null> {
    try {
      // TODO: Implementar consulta real ao banco
      // Por enquanto, retorna mock
      if (tenantId === 'tenant_1') {
        return {
          id: 'tenant_1',
          name: 'Barber Labs',
          slug: 'barber-labs',
          domain: 'barberlabs.com',
          plan: 'PRO',
          status: 'ACTIVE',
          isActive: true,
          settings: {
            maxBarbershops: 5,
            maxEmployees: 20,
            maxClients: 1000,
            features: ['appointments', 'billing', 'reports'],
            branding: {
              primaryColor: '#3B82F6',
              secondaryColor: '#1E40AF',
            },
          },
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        };
      }

      return null;
    } catch (error) {
      console.error('Erro ao buscar tenant por ID:', error);
      return null;
    }
  }

  /**
   * Obtém tenant por subdomínio
   */
  static async getTenantBySubdomain(subdomain: string): Promise<Tenant | null> {
    try {
      // TODO: Implementar consulta real ao banco
      // Por enquanto, retorna mock baseado no subdomínio
      if (subdomain === 'barberlabs') {
        return await this.getTenantById('tenant_1');
      }

      return null;
    } catch (error) {
      console.error('Erro ao buscar tenant por subdomínio:', error);
      return null;
    }
  }

  /**
   * Obtém tenant por domínio
   */
  static async getTenantByDomain(domain: string): Promise<Tenant | null> {
    try {
      // TODO: Implementar consulta real ao banco
      // Por enquanto, retorna mock baseado no domínio
      if (domain === 'barberlabs.com') {
        return await this.getTenantById('tenant_1');
      }

      return null;
    } catch (error) {
      console.error('Erro ao buscar tenant por domínio:', error);
      return null;
    }
  }

  /**
   * Valida se o tenant tem acesso ao recurso
   */
  static async validateTenantAccess(tenantId: string, resourceId: string, resourceType: string): Promise<boolean> {
    try {
      // TODO: Implementar validação real
      // Por enquanto, retorna true se o tenant_id corresponder
      return tenantId === 'tenant_1';
    } catch (error) {
      console.error('Erro ao validar acesso do tenant:', error);
      return false;
    }
  }

  /**
   * Obtém limites do tenant
   */
  static async getTenantLimits(tenantId: string): Promise<TenantLimits> {
    try {
      const tenant = await this.getTenantById(tenantId);
      if (!tenant) {
        throw new Error('Tenant não encontrado');
      }

      const planLimits = {
        STARTER: { barbershops: 1, employees: 3, clients: 100, appointments: 1000, storage: 100 },
        PRO: { barbershops: 5, employees: 20, clients: 1000, appointments: 10000, storage: 500 },
        SCALE: { barbershops: 20, employees: 100, clients: 10000, appointments: 100000, storage: 2000 },
      };

      return planLimits[tenant.plan] || planLimits.STARTER;
    } catch (error) {
      console.error('Erro ao obter limites do tenant:', error);
      return {
        barbershops: 1,
        employees: 3,
        clients: 100,
        appointments: 1000,
        storage: 100,
      };
    }
  }

  /**
   * Verifica se o tenant está ativo
   */
  static async isTenantActive(tenantId: string): Promise<boolean> {
    try {
      const tenant = await this.getTenantById(tenantId);
      return Boolean(tenant?.isActive && tenant?.status === 'ACTIVE');
    } catch (error) {
      console.error('Erro ao verificar status do tenant:', error);
      return false;
    }
  }

  /**
   * Obtém configurações do tenant
   */
  static async getTenantSettings(tenantId: string): Promise<TenantSettings | null> {
    try {
      const tenant = await this.getTenantById(tenantId);
      return tenant?.settings as TenantSettings || null;
    } catch (error) {
      console.error('Erro ao obter configurações do tenant:', error);
      return null;
    }
  }
}

export async function resolveTenantId(req: NextRequest): Promise<string> {
  const raw = req.headers.get('x-tenant-id');
  if (!raw) throw new Error('X-Tenant-Id ausente');
  
  // Se for um id real, usa direto
  if (raw.length >= 20) {
    const byId = await /* tenant-guard:allow */ prisma.tenant.findUnique({ where: { id: raw } });
    if (byId) return byId.id;
  }
  
  // Alias via domain
  const byDomain = await /* tenant-guard:allow */ prisma.tenant.findFirst({ where: { domain: raw } });
  if (byDomain) return byDomain.id;
  
  throw new Error('Tenant não encontrado');
}

// Middleware para validar tenant
export function requireTenant() {
  return async function (req: NextRequest) {
    try {
      const tenant = await TenantService.resolveTenant(req);
      
      if (!tenant) {
        return new Response(
          JSON.stringify({ 
            error: 'Tenant não identificado. Forneça X-Tenant-Id ou use subdomínio válido.' 
          }),
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      if (!tenant.isActive) {
        return new Response(
          JSON.stringify({ 
            error: 'Tenant inativo ou suspenso' 
          }),
          { 
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // Adiciona o tenant à requisição para uso posterior
      (req as any).tenant = tenant;
      
      return null; // Continua para o próximo middleware/handler
    } catch (error) {
      console.error('Erro no middleware de tenant:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Erro interno ao validar tenant' 
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  };
}

// Função utilitária para obter tenant da requisição
export function getTenantFromRequest(req: NextRequest): Tenant | null {
  return (req as any).tenant || null;
}

// Função para extrair tenant ID dos headers
export function getTenantIdFromHeaders(req: NextRequest): string | null {
  return req.headers.get('X-Tenant-Id') || req.headers.get('x-tenant-id');
}

// Função simples para validação básica (usada nas rotas públicas)
export const requireTenantSimple = (req: NextRequest) => {
  const t = req.headers.get('x-tenant-id')?.trim()
  if (!t) {
    const e: any = new Error('Missing X-Tenant-Id')
    e.status = 400
    throw e
  }
  return t
}

export const clientIp = (req: NextRequest) => 
  req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1'
