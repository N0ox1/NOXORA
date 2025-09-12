# Sistema de Rate Limiting e Locks Otimistas

## Visão Geral

O sistema de rate limiting e locks otimistas do Noxora fornece proteção contra abuso de API e previne condições de corrida em operações críticas como agendamentos.

## Características

### Rate Limiting
- **Global**: 600 requisições por minuto por IP
- **Público**: 60 requisições por minuto por IP + tenant + slug
- **Por Endpoint**: Limites específicos para rotas sensíveis
  - Login: 10 req/min
  - Agendamentos: 30 req/min
  - Pagamentos: 20 req/min

### Locks Otimistas
- **Agendamentos**: TTL de 10 segundos
- **Pagamentos**: TTL de 30 segundos
- **Recursos**: TTL de 5 segundos
- **Retry automático** com backoff exponencial

## Arquitetura

### Componentes Principais

#### 1. RateLimitService (`src/lib/rate-limit.ts`)
```typescript
export class RateLimitService {
  // Rate limiting global
  async globalRateLimit(request: NextRequest): Promise<RateLimitResult | null>
  
  // Rate limiting público
  async publicRateLimit(request: NextRequest, tenantId: string, slug: string): Promise<RateLimitResult>
  
  // Rate limiting por endpoint
  async endpointRateLimit(request: NextRequest, endpoint: string, tenantId: string): Promise<RateLimitResult>
  
  // Estatísticas e limpeza
  async getRateLimitStats(): Promise<RateLimitStats>
  async clearAllRateLimits(): Promise<void>
}
```

#### 2. OptimisticLockService (`src/lib/optimistic-lock.ts`)
```typescript
export class OptimisticLockService {
  // Aquisição e liberação de locks
  async acquireLock(key: string, version: number, options?: LockOptions): Promise<LockResult>
  async releaseLock(key: string, version: number): Promise<boolean>
  
  // Verificação de disponibilidade
  async checkTimeSlotAvailability(tenantId: string, barbershopId: string, employeeId: string, startAt: Date, duration: number): Promise<TimeSlotAvailability>
  
  // Gerenciamento de locks
  async renewLock(key: string, version: number): Promise<boolean>
  async clearTenantLocks(tenantId: string): Promise<number>
}
```

### Estrutura de Chaves Redis

#### Rate Limiting
```
rate:global:{ip} -> contador de requisições
rate:public:{ip}:{tenantId}:{slug} -> contador de requisições públicas
rate:endpoint:{endpoint}:{tenantId} -> contador de requisições por endpoint
```

#### Locks Otimistas
```
lock:appointment:{tenantId}:{barbershopId}:{employeeId}:{startAt}-{endAt} -> informações do lock
lock:payment:{tenantId}:{paymentId} -> lock de pagamento
lock:resource:{tenantId}:{resourceType}:{resourceId} -> lock de recurso genérico
```

## Configuração

### Variáveis de Ambiente
```bash
# Redis
REDIS_URL=redis://localhost:6379

# Rate Limiting (opcional, usa valores padrão)
RATE_LIMIT_GLOBAL_REQUESTS=600
RATE_LIMIT_GLOBAL_WINDOW=60000
RATE_LIMIT_PUBLIC_REQUESTS=60
RATE_LIMIT_PUBLIC_WINDOW=60000

# Locks (opcional, usa valores padrão)
OPTIMISTIC_LOCK_DEFAULT_TTL=5000
OPTIMISTIC_LOCK_APPOINTMENT_TTL=10000
OPTIMISTIC_LOCK_PAYMENT_TTL=30000
```

### Configurações Padrão
```typescript
export const RATE_LIMIT_CONFIG = {
  GLOBAL: { 
    REQUESTS_PER_MINUTE: 600, 
    WINDOW_MS: 60 * 1000, 
    BURST: 100 
  },
  PUBLIC: { 
    REQUESTS_PER_MINUTE: 60, 
    WINDOW_MS: 60 * 1000, 
    BURST: 10 
  },
  ENDPOINTS: {
    LOGIN: { REQUESTS_PER_MINUTE: 10, WINDOW_MS: 60 * 1000, BURST: 5 },
    APPOINTMENTS: { REQUESTS_PER_MINUTE: 30, WINDOW_MS: 60 * 1000, BURST: 15 },
    PAYMENTS: { REQUESTS_PER_MINUTE: 20, WINDOW_MS: 60 * 1000, BURST: 10 },
  }
};

export const OPTIMISTIC_LOCK_CONFIG = {
  DEFAULT_TTL: 5000,
  APPOINTMENT_TTL: 10000,
  PAYMENT_TTL: 30000,
  RESOURCE_TTL: 5000,
};
```

## Uso

### Rate Limiting no Middleware
```typescript
// src/middleware.ts
export async function middleware(request: NextRequest) {
  // 1. Rate Limiting Global
  const globalRateLimit = await rateLimitService.globalRateLimit(request);
  if (globalRateLimit) {
    return createRateLimitResponse(globalRateLimit);
  }

  // 2. Rate Limiting por Endpoint
  if (pathname.startsWith('/api/appointments')) {
    const endpointRateLimit = await rateLimitService.endpointRateLimit(request, 'APPOINTMENTS', tenantId);
    if (endpointRateLimit.conflict) {
      return createRateLimitResponse(endpointRateLimit);
    }
  }

  // 3. Rate Limiting Público
  if (pathname.startsWith('/api/services') || pathname.startsWith('/api/employees')) {
    const publicRateLimit = await rateLimitService.publicRateLimit(request, tenantId, slug);
    if (publicRateLimit.conflict) {
      return createRateLimitResponse(publicRateLimit);
    }
  }
}
```

### Locks Otimistas em Agendamentos
```typescript
// src/app/api/appointments/route.ts
export async function POST(request: NextRequest) {
  // 1. Verificar disponibilidade do slot
  const availability = await optimisticLockService.checkTimeSlotAvailability(
    tenantId, barbershopId, employeeId, startAt, duration
  );
  
  if (!availability.available) {
    return NextResponse.json(
      { error: 'Horário não disponível', conflict: true },
      { status: 409 }
    );
  }

  // 2. Tentar obter lock
  const lockKey = OptimisticLockService.generateAppointmentLockKey(
    tenantId, barbershopId, employeeId, startAt, endAt
  );
  
  const lockResult = await optimisticLockService.acquireLock(lockKey, Date.now(), {
    ttl: 10000,
    retryCount: 2,
    retryDelay: 100,
  });

  if (!lockResult.success) {
    return createLockConflictResponse(lockResult.version);
  }

  try {
    // 3. Verificar novamente disponibilidade (double-check)
    const finalAvailability = await optimisticLockService.checkTimeSlotAvailability(
      tenantId, barbershopId, employeeId, startAt, duration
    );
    
    if (!finalAvailability.available) {
      await optimisticLockService.releaseLock(lockKey, lockResult.version);
      return NextResponse.json(
        { error: 'Horário não disponível', conflict: true },
        { status: 409 }
      );
    }

    // 4. Criar agendamento
    // ... lógica de criação

    // 5. Liberar lock
    await optimisticLockService.releaseLock(lockKey, lockResult.version);
    
    return NextResponse.json(appointment, { status: 201 });
  } catch (error) {
    await optimisticLockService.releaseLock(lockKey, lockResult.version);
    throw error;
  }
}
```

## Headers de Resposta

### Rate Limiting
```
X-RateLimit-Limit: 600
X-RateLimit-Remaining: 599
X-RateLimit-Reset: 1640995200
Retry-After: 60
```

### Locks Otimistas
```
X-Lock-Version: 1640995200000
X-Lock-Expires: 1640995210000
```

## Monitoramento

### Estatísticas de Rate Limiting
```typescript
const stats = await rateLimitService.getRateLimitStats();
console.log(stats);
// {
//   global: { total: 150, limited: 5, success: 145 },
//   public: { total: 80, limited: 12, success: 68 },
//   endpoints: { ... }
// }
```

### Estatísticas de Locks
```typescript
const stats = await optimisticLockService.getLockStats();
console.log(stats);
// {
//   total: 25,
//   active: 8,
//   expired: 17,
//   conflicts: 12,
//   success: 13
// }
```

## Testes

### Script de Teste Automatizado
```bash
# Executar todos os testes
npm run rate-limit-lock:test

# Ou executar diretamente
node scripts/test-rate-limit-locks.js
```

### Testes Manuais

#### 1. Testar Rate Limiting Global
```bash
# Fazer múltiplas requisições para exceder o limite
for i in {1..10}; do
  curl -H "X-Tenant-Id: tenant_1" http://localhost:3000/api/services
  sleep 0.1
done
```

#### 2. Testar Locks Otimistas
```bash
# Duas requisições simultâneas para o mesmo horário
curl -X POST -H "X-Tenant-Id: tenant_1" \
  -d '{"start_at": "2024-01-01T10:00:00Z", "duration": 30}' \
  http://localhost:3000/api/appointments &

curl -X POST -H "X-Tenant-Id: tenant_1" \
  -d '{"start_at": "2024-01-01T10:00:00Z", "duration": 30}' \
  http://localhost:3000/api/appointments &

wait
```

### Rota de Teste
```bash
# Obter estatísticas
GET /api/rate-limit/test

# Testar rate limiting
POST /api/rate-limit/test
{
  "action": "test_rate_limit"
}

# Testar locks
POST /api/rate-limit/test
{
  "action": "test_lock",
  "data": {
    "resourceType": "appointment",
    "resourceId": "test-slot"
  }
}

# Testar agendamentos concorrentes
POST /api/rate-limit/test
{
  "action": "test_concurrent_appointments",
  "data": {
    "startAt": "2024-01-01T10:00:00Z",
    "duration": 30
  }
}
```

## Performance

### Métricas Esperadas
- **Rate Limiting**: < 1ms por verificação
- **Locks**: < 2ms para aquisição/liberação
- **Conflitos**: < 5ms para detecção

### Otimizações
- **Pipeline Redis**: Múltiplas operações em uma única conexão
- **TTL automático**: Limpeza automática de locks expirados
- **Retry inteligente**: Backoff exponencial para locks concorrentes

## Segurança

### Proteções
- **Isolamento por tenant**: Rate limits e locks isolados por tenant
- **Validação de entrada**: Verificação de parâmetros antes de aplicar locks
- **Timeouts**: TTLs configuráveis para evitar deadlocks

### Limitações
- **Rate limiting por IP**: Pode ser contornado com proxies
- **Locks Redis**: Dependência de um serviço externo
- **Race conditions**: Possibilidade em cenários extremos de alta concorrência

## Troubleshooting

### Problemas Comuns

#### 1. Rate Limiting Muito Restritivo
```bash
# Verificar configurações
curl -H "X-Tenant-Id: tenant_1" http://localhost:3000/api/rate-limit/test

# Limpar rate limits se necessário
POST /api/rate-limit/test
{
  "action": "clear_rate_limits"
}
```

#### 2. Locks Não Liberados
```bash
# Verificar locks ativos
GET /api/rate-limit/test

# Limpar locks se necessário
POST /api/rate-limit/test
{
  "action": "clear_locks"
}
```

#### 3. Conflitos Excessivos
```typescript
// Aumentar TTL dos locks
const lockResult = await optimisticLockService.acquireLock(key, version, {
  ttl: 15000, // 15 segundos em vez de 10
  retryCount: 3, // Mais tentativas
  retryDelay: 200, // Delay maior entre tentativas
});
```

### Logs e Debug
```typescript
// Habilitar logs detalhados
console.log('Rate limiting:', {
  ip: clientIP,
  tenantId,
  endpoint,
  result: rateLimitResult
});

console.log('Lock operation:', {
  key: lockKey,
  version,
  result: lockResult,
  timestamp: new Date().toISOString()
});
```

## Deploy e Produção

### Configurações de Produção
```bash
# Redis cluster para alta disponibilidade
REDIS_URL=redis://cluster-redis:6379

# Rate limits mais restritivos
RATE_LIMIT_GLOBAL_REQUESTS=300
RATE_LIMIT_PUBLIC_REQUESTS=30

# TTLs mais longos para locks
OPTIMISTIC_LOCK_APPOINTMENT_TTL=15000
OPTIMISTIC_LOCK_PAYMENT_TTL=45000
```

### Monitoramento em Produção
- **Métricas Redis**: Uso de memória, conexões, latência
- **Alertas**: Rate limits excedidos, locks não liberados
- **Dashboards**: Grafana com métricas em tempo real

### Backup e Recuperação
- **Redis RDB**: Backup automático a cada hora
- **Redis AOF**: Log de operações para recuperação
- **Failover**: Redis Sentinel para alta disponibilidade

## Conclusão

O sistema de rate limiting e locks otimistas fornece uma base sólida para proteger a API contra abuso e garantir consistência em operações críticas. A implementação é eficiente, configurável e integrada ao middleware global da aplicação.
