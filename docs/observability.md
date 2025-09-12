# Sistema de Observabilidade - Noxora

## Visão Geral

O sistema de observabilidade do Noxora implementa três pilares fundamentais para monitoramento e rastreamento da aplicação:

1. **OpenTelemetry** - Distributed tracing e métricas
2. **Sentry** - Error tracking e performance monitoring
3. **Audit Logs** - Registro de ações críticas para compliance

## Arquitetura

### 1. OpenTelemetry

#### Configuração
- **Arquivo**: `src/lib/telemetry.ts`
- **SDK**: `@opentelemetry/sdk-node`
- **Instrumentação**: Auto-instrumentação Node.js
- **Exportador**: OTLP HTTP para coletor centralizado

#### Funcionalidades
- Tracing automático de requests HTTP
- Spans personalizados para operações críticas
- Atributos customizados (tenant_id, user_id, etc.)
- Contexto de tenant para isolamento
- Decorator `@traced` para métodos de classe

#### Uso Básico
```typescript
import { createSpan, addSpanAttributes, endSpan } from '@/lib/telemetry';

// Criar span manual
const span = createSpan('operation.name', { 'custom.attribute': 'value' });

try {
  // Operação
  addSpanAttributes({ 'result': 'success' });
  span.setStatus({ code: 1 }); // OK
} catch (error) {
  // Marcar como erro
  markSpanAsError(error, { 'error.type': 'validation' });
} finally {
  endSpan();
}
```

#### Decorator @traced
```typescript
import { traced } from '@/lib/telemetry';

class UserService {
  @traced('user.create')
  async createUser(userData: any) {
    // Método automaticamente rastreado
  }
}
```

### 2. Sentry

#### Configuração Frontend
- **Arquivo**: `sentry.client.config.js`
- **DSN**: `NEXT_PUBLIC_SENTRY_DSN`
- **Integrações**: Replay, Browser Tracing, Feedback
- **Performance**: Métricas automáticas (FID, LCP, CLS, TTFB)

#### Configuração Backend
- **Arquivo**: `sentry.server.config.js`
- **DSN**: `SENTRY_DSN`
- **Integrações**: Node Tracing, Console
- **Filtros**: Erros de validação, autenticação, rede

#### Funcionalidades
- Captura automática de erros
- Performance monitoring
- Session replay (frontend)
- Breadcrumbs para debugging
- Contexto de tenant e trace ID
- Filtros de dados sensíveis

#### Uso Básico
```typescript
import { captureError, setTenantContext, addBreadcrumb } from '@/lib/sentry';

// Configurar contexto
setTenantContext('tenant_id', 'tenant_name');

// Adicionar breadcrumb
addBreadcrumb('User action', 'user', { action: 'login' });

// Capturar erro
captureError(error, {
  tags: { type: 'api_error', endpoint: '/api/users' },
  extra: { requestData: request.body }
});
```

### 3. Audit Logs

#### Configuração
- **Arquivo**: `src/lib/audit/audit-service.ts`
- **Banco**: Prisma com tabela `auditLog`
- **Integração**: OpenTelemetry + Sentry
- **Retenção**: Configurável por tenant

#### Funcionalidades
- Log automático de ações CRUD
- Contexto completo (tenant, user, IP, user-agent)
- Trace ID e Span ID para correlação
- Filtros e consultas por tenant
- Estatísticas e relatórios
- Limpeza automática de logs antigos

#### Uso Básico
```typescript
import { AuditService } from '@/lib/audit';

// Log manual
await AuditService.log({
  tenantId: 'tnt_1',
  userId: 'user_123',
  action: 'CREATE',
  resource: 'USER',
  resourceId: 'user_456',
  details: { email: 'user@example.com' },
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
  traceId: 'abc123...',
  spanId: 'def456...'
});

// Métodos específicos
await AuditService.logCreate('tnt_1', 'USER', 'user_123', userData);
await AuditService.logUpdate('tnt_1', 'USER', 'user_123', changes);
await AuditService.logDelete('tnt_1', 'USER', 'user_123', reason);
await AuditService.logAuth('tnt_1', 'LOGIN', { method: 'password' });
```

#### Decorator @audited
```typescript
import { audited } from '@/lib/audit';

class UserService {
  @audited('CREATE', 'USER')
  async createUser(userData: any) {
    // Método automaticamente auditado
  }
}
```

## Middleware de Observabilidade

### Configuração
- **Arquivo**: `src/middleware.ts`
- **Integração**: OpenTelemetry + Sentry + Tenant + Rate Limit

### Funcionalidades
- Tracing automático de todos os requests
- Headers de trace ID e span ID
- Contexto de tenant em todos os spans
- Captura de erros no Sentry
- Headers de rate limit
- Verificação de limites de billing

### Headers Adicionados
```
X-Trace-Id: abc123def456...
X-Span-Id: def456...
X-Tenant-Id: tnt_1
X-Tenant-Slug: barber-labs-centro
X-RateLimit-Limit: 600
X-RateLimit-Remaining: 599
X-RateLimit-Reset: 60
```

## APIs de Observabilidade

### 1. Audit Logs
- **GET** `/api/audit` - Consultar logs com filtros
- **POST** `/api/audit` - Criar log manual
- **GET** `/api/audit/stats` - Estatísticas por tenant

### 2. Parâmetros de Query
```typescript
interface AuditQuery {
  tenant_id: string;        // Obrigatório
  user_id?: string;         // Opcional
  action?: string;          // Opcional
  resource?: string;        // Opcional
  resource_id?: string;     // Opcional
  start_date?: string;      // Opcional (ISO)
  end_date?: string;        // Opcional (ISO)
  limit?: number;           // Padrão: 100
  offset?: number;          // Padrão: 0
}
```

### 3. Exemplo de Uso
```bash
# Consultar logs de criação de usuários
GET /api/audit?tenant_id=tnt_1&action=CREATE&resource=USER&limit=50

# Estatísticas dos últimos 7 dias
GET /api/audit/stats?tenant_id=tnt_1&days=7
```

## Configuração de Ambiente

### Variáveis de Ambiente
```bash
# OpenTelemetry
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318/v1/traces

# Sentry
SENTRY_DSN=https://your-dsn@your-org.ingest.sentry.io/your-project
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@your-org.ingest.sentry.io/your-project

# App
APP_VERSION=1.0.0
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### Dependências
```json
{
  "@opentelemetry/sdk-node": "^0.48.0",
  "@opentelemetry/auto-instrumentations-node": "^0.40.0",
  "@opentelemetry/exporter-trace-otlp-http": "^0.48.0",
  "@sentry/nextjs": "^7.0.0"
}
```

## Testes

### Script de Teste
```bash
npm run observability:test
```

### Testes Incluídos
1. **OpenTelemetry Tracing**
   - Headers de trace ID e span ID
   - Formato correto dos IDs
   - Rastreamento automático

2. **Contexto de Tenant**
   - Headers de tenant ID e slug
   - Valores corretos retornados
   - Isolamento por tenant

3. **Audit Logs**
   - Proteção de endpoints
   - Validação de autenticação
   - Criação de logs

4. **Rate Limit Headers**
   - Headers de limite
   - Valores numéricos válidos
   - Formato correto

5. **Tratamento de Erros**
   - Trace ID em respostas de erro
   - Captura automática no Sentry
   - Contexto completo

6. **Monitoramento de Performance**
   - Rastreamento de duração
   - Métricas de performance
   - Thresholds aceitáveis

## Monitoramento e Alertas

### Métricas Principais
- **Latência**: Tempo de resposta por endpoint
- **Throughput**: Requests por segundo
- **Error Rate**: Taxa de erros por tenant
- **Audit Volume**: Volume de logs por período

### Alertas Recomendados
- Latência > 1s para endpoints críticos
- Error rate > 5% por tenant
- Falha na criação de audit logs
- Quota de tracing excedida

## Troubleshooting

### Problemas Comuns

#### 1. Traces não aparecem no coletor
```bash
# Verificar endpoint
echo $OTEL_EXPORTER_OTLP_ENDPOINT

# Verificar conectividade
curl $OTEL_EXPORTER_OTLP_ENDPOINT/health
```

#### 2. Sentry não captura erros
```bash
# Verificar DSN
echo $SENTRY_DSN

# Verificar logs do Sentry
# Verificar filtros de erro
```

#### 3. Audit logs não são criados
```bash
# Verificar banco de dados
# Verificar permissões
# Verificar integração com Prisma
```

### Logs de Debug
```typescript
// Habilitar debug do OpenTelemetry
process.env.OTEL_LOG_LEVEL = 'DEBUG';

// Habilitar debug do Sentry
Sentry.init({ debug: true });
```

## Próximos Passos

### Melhorias Planejadas
1. **Métricas Customizadas**
   - Business metrics por tenant
   - KPIs de negócio
   - Alertas inteligentes

2. **Dashboards**
   - Grafana para métricas
   - Kibana para logs
   - Sentry para performance

3. **Integração com APM**
   - New Relic
   - DataDog
   - AppDynamics

4. **Machine Learning**
   - Anomaly detection
   - Predictive scaling
   - Auto-remediation

### Roadmap
- **Q1**: Métricas customizadas e dashboards
- **Q2**: Integração com APM externo
- **Q3**: Machine learning e automação
- **Q4**: Observabilidade completa e SLOs

## Conclusão

O sistema de observabilidade do Noxora fornece uma base sólida para monitoramento, debugging e compliance. Com OpenTelemetry para tracing, Sentry para error tracking e audit logs para compliance, a aplicação está preparada para ambientes de produção em escala.

A integração automática com o middleware garante que todos os requests sejam rastreados e auditados, enquanto as APIs permitem consultas e análises detalhadas dos dados de observabilidade.
