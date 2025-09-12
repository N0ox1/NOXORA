import redis from './redis';

// Configurações de locks otimistas
export const OPTIMISTIC_LOCK_CONFIG = {
  // TTL padrão para locks (5 segundos)
  DEFAULT_TTL: 5000,
  
  // TTL para locks de agendamento (10 segundos)
  APPOINTMENT_TTL: 10000,
  
  // TTL para locks de pagamento (30 segundos)
  PAYMENT_TTL: 30000,
  
  // Prefixos para diferentes tipos de lock
  PREFIXES: {
    APPOINTMENT: 'lock:appointment',
    PAYMENT: 'lock:payment',
    RESOURCE: 'lock:resource',
    TENANT: 'lock:tenant',
  },
  
  // Headers de resposta
  HEADERS: {
    LOCK_VERSION: 'X-Lock-Version',
    LOCK_CONFLICT: 'X-Lock-Conflict',
    LOCK_RETRY_AFTER: 'X-Lock-Retry-After',
  },
};

// Tipos para o sistema de locks otimistas
export interface LockResult {
  success: boolean;
  version: number;
  locked: boolean;
  conflict?: boolean;
  error?: string;
}

export interface LockOptions {
  ttl?: number;
  retryCount?: number;
  retryDelay?: number;
  conflictStrategy?: 'fail' | 'retry' | 'force';
}

// Classe principal de locks otimistas
export class OptimisticLockService {
  private redis: typeof redis;

  constructor() {
    this.redis = redis;
  }

  /**
   * Gera chave de lock para agendamento
   */
  static generateAppointmentLockKey(
    tenantId: string,
    barbershopId: string,
    employeeId: string,
    startAt: string,
    duration: number
  ): string {
    const timeSlot = this.generateTimeSlot(startAt, duration);
    return `${OPTIMISTIC_LOCK_CONFIG.PREFIXES.APPOINTMENT}:${tenantId}:${barbershopId}:${employeeId}:${timeSlot}`;
  }

  /**
   * Gera chave de lock para pagamento
   */
  static generatePaymentLockKey(
    tenantId: string,
    appointmentId: string
  ): string {
    return `${OPTIMISTIC_LOCK_CONFIG.PREFIXES.PAYMENT}:${tenantId}:${appointmentId}`;
  }

  /**
   * Gera chave de lock para recurso
   */
  static generateResourceLockKey(
    tenantId: string,
    resourceType: string,
    resourceId: string
  ): string {
    return `${OPTIMISTIC_LOCK_CONFIG.PREFIXES.RESOURCE}:${tenantId}:${resourceType}:${resourceId}`;
  }

  /**
   * Gera slot de tempo para agendamento
   */
  static generateTimeSlot(startAt: string, duration: number): string {
    const start = new Date(startAt);
    const end = new Date(start.getTime() + duration * 60 * 1000);
    
    // Arredonda para slots de 15 minutos
    const slotSize = 15 * 60 * 1000; // 15 minutos em ms
    const startSlot = Math.floor(start.getTime() / slotSize) * slotSize;
    const endSlot = Math.ceil(end.getTime() / slotSize) * slotSize;
    
    return `${startSlot}-${endSlot}`;
  }

  /**
   * Verifica se um slot de tempo está disponível
   */
  async checkTimeSlotAvailability(
    tenantId: string,
    barbershopId: string,
    employeeId: string,
    startAt: string,
    duration: number
  ): Promise<{ available: boolean; conflictingAppointments: string[] }> {
    try {
      const lockKey = OptimisticLockService.generateAppointmentLockKey(
        tenantId,
        barbershopId,
        employeeId,
        startAt,
        duration
      );

      // Verificar se já existe um lock ativo
      const existingLock = await this.redis.get(lockKey);
      if (existingLock) {
        return {
          available: false,
          conflictingAppointments: [existingLock],
        };
      }

      // Verificar conflitos com agendamentos existentes
      const conflictingAppointments = await this.findConflictingAppointments(
        tenantId,
        barbershopId,
        employeeId,
        startAt,
        duration
      );

      return {
        available: conflictingAppointments.length === 0,
        conflictingAppointments,
      };
    } catch (error) {
      console.error('Erro ao verificar disponibilidade do slot:', error);
      return {
        available: false,
        conflictingAppointments: [],
      };
    }
  }

  /**
   * Encontra agendamentos conflitantes
   */
  private async findConflictingAppointments(
    tenantId: string,
    barbershopId: string,
    employeeId: string,
    startAt: string,
    duration: number
  ): Promise<string[]> {
    try {
      // TODO: Implementar busca real no banco de dados
      // Por enquanto, retorna array vazio (sem conflitos)
      return [];
    } catch (error) {
      console.error('Erro ao buscar agendamentos conflitantes:', error);
      return [];
    }
  }

  /**
   * Tenta obter um lock otimista
   */
  async acquireLock(
    key: string,
    version: number = 1,
    options: LockOptions = {}
  ): Promise<LockResult> {
    try {
      const {
        ttl = OPTIMISTIC_LOCK_CONFIG.DEFAULT_TTL,
        retryCount = 3,
        retryDelay = 100,
        conflictStrategy = 'fail',
      } = options;

      let attempts = 0;
      
      while (attempts < retryCount) {
        attempts++;
        
        // Verificar se o lock já existe
        const existingLock = await this.redis.get(key);
        
        if (existingLock) {
          const existingVersion = parseInt(existingLock);
          
          if (existingVersion >= version) {
            // Conflito de versão
            if (conflictStrategy === 'force') {
              // Força a atualização
              await this.redis.setex(key, Math.ceil(ttl / 1000), version.toString());
              return {
                success: true,
                version,
                locked: true,
                conflict: true,
              };
            } else if (conflictStrategy === 'retry' && attempts < retryCount) {
              // Aguarda e tenta novamente
              await new Promise(resolve => setTimeout(resolve, retryDelay));
              continue;
            } else {
              // Falha
              return {
                success: false,
                version: existingVersion,
                locked: false,
                conflict: true,
                error: 'Version conflict detected',
              };
            }
          }
        }

        // Tentar obter o lock
        const lockAcquired = await this.redis.set(key, version.toString());
        
        if (lockAcquired) {
          return {
            success: true,
            version,
            locked: true,
            conflict: false,
          };
        }

        // Lock não foi obtido, aguardar e tentar novamente
        if (attempts < retryCount) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }

      return {
        success: false,
        version,
        locked: false,
        conflict: false,
        error: 'Failed to acquire lock after maximum retries',
      };
    } catch (error) {
      console.error('Erro ao obter lock:', error);
      return {
        success: false,
        version,
        locked: false,
        conflict: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Libera um lock
   */
  async releaseLock(key: string, version: number): Promise<boolean> {
    try {
      // Verificar se o lock ainda é válido
      const existingLock = await this.redis.get(key);
      
      if (!existingLock) {
        return true; // Lock já não existe
      }

      const existingVersion = parseInt(existingLock);
      
      if (existingVersion !== version) {
        console.warn(`Tentativa de liberar lock com versão incorreta. Esperado: ${version}, Atual: ${existingVersion}`);
        return false;
      }

      // Liberar o lock
      await this.redis.del(key);
      return true;
    } catch (error) {
      console.error('Erro ao liberar lock:', error);
      return false;
    }
  }

  /**
   * Renova um lock existente
   */
  async renewLock(
    key: string,
    version: number,
    ttl: number = OPTIMISTIC_LOCK_CONFIG.DEFAULT_TTL
  ): Promise<boolean> {
    try {
      // Verificar se o lock ainda é válido
      const existingLock = await this.redis.get(key);
      
      if (!existingLock) {
        return false; // Lock não existe
      }

      const existingVersion = parseInt(existingLock);
      
      if (existingVersion !== version) {
        return false; // Versão incorreta
      }

      // Renovar o lock
      await this.redis.pexpire(key, ttl);
      return true;
    } catch (error) {
      console.error('Erro ao renovar lock:', error);
      return false;
    }
  }

  /**
   * Verifica se um lock está ativo
   */
  async isLockActive(key: string): Promise<boolean> {
    try {
      const lock = await this.redis.get(key);
      return lock !== null;
    } catch (error) {
      console.error('Erro ao verificar status do lock:', error);
      return false;
    }
  }

  /**
   * Obtém informações de um lock
   */
  async getLockInfo(key: string): Promise<{
    active: boolean;
    version?: number;
    ttl?: number;
  }> {
    try {
      const lock = await this.redis.get(key);
      
      if (!lock) {
        return { active: false };
      }

      const version = parseInt(lock);
      const ttl = await this.redis.pttl(key);

      return {
        active: true,
        version,
        ttl: ttl > 0 ? ttl : undefined,
      };
    } catch (error) {
      console.error('Erro ao obter informações do lock:', error);
      return { active: false };
    }
  }

  /**
   * Limpa todos os locks de um tenant
   */
  async clearTenantLocks(tenantId: string): Promise<void> {
    try {
      const patterns = [
        `${OPTIMISTIC_LOCK_CONFIG.PREFIXES.APPOINTMENT}:${tenantId}:*`,
        `${OPTIMISTIC_LOCK_CONFIG.PREFIXES.PAYMENT}:${tenantId}:*`,
        `${OPTIMISTIC_LOCK_CONFIG.PREFIXES.RESOURCE}:${tenantId}:*`,
      ];

      for (const pattern of patterns) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      }

      console.log(`🧹 Locks limpos para tenant: ${tenantId}`);
    } catch (error) {
      console.error('Erro ao limpar locks do tenant:', error);
    }
  }

  /**
   * Limpa todos os locks expirados
   */
  async clearExpiredLocks(): Promise<void> {
    try {
      const patterns = [
        `${OPTIMISTIC_LOCK_CONFIG.PREFIXES.APPOINTMENT}:*`,
        `${OPTIMISTIC_LOCK_CONFIG.PREFIXES.PAYMENT}:*`,
        `${OPTIMISTIC_LOCK_CONFIG.PREFIXES.RESOURCE}:*`,
      ];

      for (const pattern of patterns) {
        const keys = await this.redis.keys(pattern);
        
        for (const key of keys) {
          const ttl = await this.redis.pttl(key);
          if (ttl <= 0) {
            await this.redis.del(key);
          }
        }
      }

      console.log('🧹 Locks expirados limpos');
    } catch (error) {
      console.error('Erro ao limpar locks expirados:', error);
    }
  }

  /**
   * Obtém estatísticas dos locks
   */
  async getLockStats(): Promise<{
    totalLocks: number;
    locksByType: Record<string, number>;
    memoryUsage: string;
  }> {
    try {
      const patterns = [
        `${OPTIMISTIC_LOCK_CONFIG.PREFIXES.APPOINTMENT}:*`,
        `${OPTIMISTIC_LOCK_CONFIG.PREFIXES.PAYMENT}:*`,
        `${OPTIMISTIC_LOCK_CONFIG.PREFIXES.RESOURCE}:*`,
      ];

      const locksByType: Record<string, number> = {};
      let totalLocks = 0;

      for (const pattern of patterns) {
        const keys = await this.redis.keys(pattern);
        const type = pattern.split(':')[1];
        locksByType[type] = keys.length;
        totalLocks += keys.length;
      }

      // Obtém informações de memória
      const info = await this.redis.info('memory');
      const memoryMatch = info.match(/used_memory_human:(\S+)/);
      const memoryUsage = memoryMatch ? memoryMatch[1] : 'N/A';

      return {
        totalLocks,
        locksByType,
        memoryUsage,
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas dos locks:', error);
      return {
        totalLocks: 0,
        locksByType: {},
        memoryUsage: 'N/A',
      };
    }
  }
}

// Instância singleton do serviço de locks otimistas
export const optimisticLockService = new OptimisticLockService();

// Função utilitária para criar resposta de conflito de lock
export function createLockConflictResponse(
  version: number,
  retryAfter?: number
): Response {
  const response = new Response(
    JSON.stringify({
      error: 'Lock conflict detected',
      message: 'The resource has been modified by another request. Please retry with the latest version.',
      version,
      retryAfter,
    }),
    {
      status: 409,
      headers: {
        'Content-Type': 'application/json',
        [OPTIMISTIC_LOCK_CONFIG.HEADERS.LOCK_VERSION]: version.toString(),
        [OPTIMISTIC_LOCK_CONFIG.HEADERS.LOCK_CONFLICT]: 'true',
        ...(retryAfter && {
          [OPTIMISTIC_LOCK_CONFIG.HEADERS.LOCK_RETRY_AFTER]: retryAfter.toString(),
        }),
      },
    }
  );

  return response;
}
