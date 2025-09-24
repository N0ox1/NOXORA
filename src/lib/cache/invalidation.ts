import { cacheService, CACHE_KEYS } from './redis';

// Regras de invalidação baseadas nas mutações
export const INVALIDATION_RULES = {
    appointments: {
        patterns: [
            'avl:{tenantId}:*', // Disponibilidade
            'rpt:daily:{tenantId}:*', // Relatórios diários
            'rpt:occ:{tenantId}:*', // Ocupação
        ],
        on: ['POST', 'PATCH', 'DELETE'],
    },
    services: {
        patterns: [
            'svc:{tenantId}:*', // Serviços em cache
            'avl:{tenantId}:*', // Disponibilidade (depende dos serviços)
            'rpt:daily:{tenantId}:*', // Relatórios (dependem dos serviços)
        ],
        on: ['POST', 'PATCH', 'DELETE'],
    },
    employees: {
        patterns: [
            'emp:{tenantId}:*', // Funcionários em cache
            'avl:{tenantId}:*', // Disponibilidade (depende dos funcionários)
            'rpt:occ:{tenantId}:*', // Ocupação (depende dos funcionários)
        ],
        on: ['POST', 'PATCH', 'DELETE'],
    },
    barbershop: {
        patterns: [
            'bs:{tenantId}:*', // Dados da barbearia
        ],
        on: ['PATCH'],
    },
} as const;

// Classe para gerenciar invalidação de cache
export class CacheInvalidationService {
    // Invalidar cache baseado no tipo de operação e tenant
    async invalidateByOperation(
        operation: 'appointments' | 'services' | 'employees' | 'barbershop',
        tenantId: string,
        additionalParams?: Record<string, string>
    ): Promise<void> {
        const rules = INVALIDATION_RULES[operation];

        if (!rules) {
            console.warn(`No invalidation rules found for operation: ${operation}`);
            return;
        }

        // Construir padrões de invalidação
        const patterns = rules.patterns.map(pattern =>
            pattern.replace('{tenantId}', tenantId)
        );

        // Adicionar parâmetros específicos se fornecidos
        if (additionalParams) {
            const specificPatterns = patterns.map(pattern => {
                let specificPattern = pattern;
                Object.entries(additionalParams).forEach(([key, value]) => {
                    specificPattern = specificPattern.replace(`{${key}}`, value);
                });
                return specificPattern;
            });

            patterns.push(...specificPatterns);
        }

        // Executar invalidação
        await cacheService.invalidateMultiple(patterns);

        console.log(`Cache invalidated for ${operation}:`, patterns);
    }

    // Invalidar cache específico por chave
    async invalidateByKey(key: string): Promise<void> {
        await cacheService.invalidate(key);
    }

    // Invalidar cache de disponibilidade para um dia específico
    async invalidateAvailability(
        tenantId: string,
        barbershopId: string,
        day: string
    ): Promise<void> {
        const key = CACHE_KEYS.availability(tenantId, barbershopId, day);
        await this.invalidateByKey(key);
    }

    // Invalidar cache de relatórios para um período
    async invalidateReporting(
        tenantId: string,
        from: string,
        to: string
    ): Promise<void> {
        const patterns = [
            `rpt:daily:${tenantId}:${from}:${to}`,
            `rpt:occ:${tenantId}:*:${from}:${to}`,
        ];

        await cacheService.invalidateMultiple(patterns);
    }

    // Invalidar cache de serviços para uma barbearia
    async invalidateServices(
        tenantId: string,
        barbershopId: string
    ): Promise<void> {
        const key = CACHE_KEYS.servicesHot(tenantId, barbershopId);
        await this.invalidateByKey(key);
    }

    // Invalidar cache de funcionários para uma barbearia
    async invalidateEmployees(
        tenantId: string,
        barbershopId: string
    ): Promise<void> {
        const key = CACHE_KEYS.employeesHot(tenantId, barbershopId);
        await this.invalidateByKey(key);
    }

    // Invalidar cache de barbearia pública
    async invalidatePublicBarbershop(
        tenantId: string,
        slug: string
    ): Promise<void> {
        const key = CACHE_KEYS.publicShop(tenantId, slug);
        await this.invalidateByKey(key);
    }

    // Invalidar todo o cache de um tenant (útil para testes)
    async invalidateTenant(tenantId: string): Promise<void> {
        const patterns = [
            `avl:${tenantId}:*`,
            `svc:${tenantId}:*`,
            `emp:${tenantId}:*`,
            `bs:${tenantId}:*`,
            `rpt:daily:${tenantId}:*`,
            `rpt:occ:${tenantId}:*`,
        ];

        await cacheService.invalidateMultiple(patterns);
    }
}

// Instância singleton
export const cacheInvalidation = new CacheInvalidationService();

// Middleware para invalidação automática
export function createInvalidationMiddleware() {
    return {
        // Middleware para rotas de agendamentos
        appointments: async (req: Request, tenantId: string, method: string) => {
            if (['POST', 'PATCH', 'DELETE'].includes(method)) {
                await cacheInvalidation.invalidateByOperation('appointments', tenantId);
            }
        },

        // Middleware para rotas de serviços
        services: async (req: Request, tenantId: string, method: string) => {
            if (['POST', 'PATCH', 'DELETE'].includes(method)) {
                await cacheInvalidation.invalidateByOperation('services', tenantId);
            }
        },

        // Middleware para rotas de funcionários
        employees: async (req: Request, tenantId: string, method: string) => {
            if (['POST', 'PATCH', 'DELETE'].includes(method)) {
                await cacheInvalidation.invalidateByOperation('employees', tenantId);
            }
        },

        // Middleware para rotas de barbearia
        barbershop: async (req: Request, tenantId: string, method: string) => {
            if (['PATCH'].includes(method)) {
                await cacheInvalidation.invalidateByOperation('barbershop', tenantId);
            }
        },
    };
}

















