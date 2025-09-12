# Sistema de Auditoria do Noxora

## Visão Geral

O sistema de auditoria do Noxora é uma solução completa para rastrear e registrar todas as ações importantes realizadas no sistema. Ele fornece rastreabilidade completa, conformidade com regulamentações e ferramentas para análise de segurança.

## Características Principais

### 🔍 Rastreamento Automático
- **Ações CRUD**: Create, Read, Update, Delete de todas as entidades
- **Acesso ao Sistema**: Login, logout, sessões, tentativas de acesso
- **Operações de Dados**: Export, import, backup, restauração
- **Mudanças de Configuração**: Permissões, configurações do sistema

### 🛡️ Segurança e Privacidade
- **Dados Sensíveis Protegidos**: Senhas, tokens e informações confidenciais são automaticamente mascarados
- **Sanitização Automática**: Remoção de dados sensíveis antes do armazenamento
- **Controle de Acesso**: Logs são protegidos por permissões específicas

### 📊 Análise e Relatórios
- **Estatísticas em Tempo Real**: Distribuição de ações, usuários mais ativos
- **Filtros Avançados**: Por usuário, ação, entidade, período, severidade
- **Relatórios Personalizáveis**: Geração de relatórios com recomendações
- **Tendências e Padrões**: Identificação de comportamentos suspeitos

## Arquitetura

### Banco de Dados
```sql
CREATE TABLE audit_logs (
    id VARCHAR(256) PRIMARY KEY,
    tenant_id VARCHAR(256) NOT NULL,
    actor_id VARCHAR(256) NOT NULL,
    action VARCHAR(256) NOT NULL,
    entity VARCHAR(256) NOT NULL,
    entity_id VARCHAR(256) NOT NULL,
    ts TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    actor_type VARCHAR(50),
    actor_name VARCHAR(256),
    actor_email VARCHAR(256),
    ip_address VARCHAR(45),
    user_agent VARCHAR(512),
    session_id VARCHAR(256),
    request_id VARCHAR(256),
    changes JSONB,
    metadata JSONB,
    severity VARCHAR(50),
    status VARCHAR(50),
    error_message TEXT,
    stack_trace TEXT
);
```

### Índices para Performance
- `audit_tenant_id_idx`: Filtros por tenant
- `audit_actor_id_idx`: Busca por usuário
- `audit_entity_idx`: Filtros por entidade
- `audit_ts_idx`: Filtros por período
- `audit_action_idx`: Filtros por ação
- `audit_severity_idx`: Filtros por severidade

## Uso no Backend

### Middleware de Auditoria

#### Operações CRUD
```typescript
import { auditCRUD } from '@/lib/audit';

// Criar com auditoria
export const POST = auditCRUD.create('service')(ApiMiddleware.withApi(handler));

// Atualizar com auditoria
export const PUT = auditCRUD.update('service')(ApiMiddleware.withApi(handler));

// Deletar com auditoria
export const DELETE = auditCRUD.delete('service')(ApiMiddleware.withApi(handler));
```

#### Ações Específicas
```typescript
import { auditActions } from '@/lib/audit';

// Login com auditoria
export const POST = auditActions.login(ApiMiddleware.withApi(handler));

// Export com auditoria
export const GET = auditActions.export('appointment')(ApiMiddleware.withApi(handler));
```

#### Middleware Customizado
```typescript
import { withAudit } from '@/lib/audit';

export const POST = withAudit({
  action: 'APPROVE',
  entity: 'appointment',
  getEntityId: (request) => request.nextUrl.pathname.split('/').pop() || 'unknown',
  getChanges: (request, response) => [
    { field: 'status', old_value: 'PENDING', new_value: 'APPROVED' }
  ],
  getMetadata: (request) => ({
    reason: request.nextUrl.searchParams.get('reason'),
    approver_notes: request.nextUrl.searchParams.get('notes'),
  }),
})(ApiMiddleware.withApi(handler));
```

### Serviço de Auditoria
```typescript
import { auditService } from '@/lib/audit';

// Log manual
await auditService.log(
  {
    tenant_id: 'tenant-123',
    actor_id: 'user-456',
    actor_type: 'user',
    actor_name: 'João Silva',
    ip_address: '192.168.1.100',
  },
  'CREATE',
  'appointment',
  'appointment-789',
  [
    { field: 'client_id', old_value: null, new_value: 'client-123' },
    { field: 'service_id', old_value: null, new_value: 'service-456' },
  ],
  { source: 'api', priority: 'high' }
);
```

## Uso no Frontend

### Hook useAudit
```typescript
import { useAudit } from '@/hooks/use-audit';

function MyComponent() {
  const audit = useAudit({
    tenantId: 'tenant-123',
    actorId: 'user-456',
    actorType: 'user',
    actorName: 'João Silva',
    actorEmail: 'joao@example.com',
  });

  const handleCreateService = async () => {
    await audit.logCreate('service', 'service-123', {
      name: 'Corte Masculino',
      price: 25.00,
    });
  };

  const handleUpdateService = async () => {
    await audit.logUpdate('service', 'service-123', [
      { field: 'price', old_value: 25.00, new_value: 30.00 }
    ]);
  };

  const handleLogin = async () => {
    await audit.logLogin('user-456', true, {
      ip: '192.168.1.100',
      userAgent: navigator.userAgent,
    });
  };
}
```

## Configuração

### Configuração do Sistema
```typescript
// src/lib/config.ts
audit: {
  enabled: true,
  log_levels: [
    'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT',
    'EXPORT', 'IMPORT', 'APPROVE', 'REJECT', 'ASSIGN',
    'UNASSIGN', 'ENABLE', 'DISABLE', 'ARCHIVE', 'RESTORE'
  ],
  sensitive_fields: ['password', 'token', 'secret', 'key', 'credential'],
  retention_days: 365,
  max_log_size: 100, // MB
  compression_enabled: true,
  encryption_enabled: false,
  real_time_logging: true,
  batch_size: 100,
  flush_interval: 5000, // 5 segundos
  entities: [
    'tenant', 'barbershop', 'employee', 'service', 'client',
    'appointment', 'user', 'role', 'permission', 'billing_plan',
    'notification', 'webhook', 'report', 'metric'
  ],
}
```

### Configuração de Retenção
```typescript
// Política de retenção por entidade
const retentionPolicy = {
  user: { retention_days: 2555, archive_after_days: 365 },
  appointment: { retention_days: 1825, archive_after_days: 90 },
  audit_log: { retention_days: 2555, archive_after_days: 365 },
};
```

## APIs Disponíveis

### Buscar Logs
```http
GET /api/audit/logs?tenant_id=tenant-123&action=DELETE&limit=50
```

**Parâmetros:**
- `tenant_id` (obrigatório): ID do tenant
- `actor_id`: ID do usuário
- `action`: Ação específica ou array JSON
- `entity`: Entidade específica ou array JSON
- `entity_id`: ID da entidade
- `start_date`: Data de início (ISO)
- `end_date`: Data de fim (ISO)
- `severity`: LOW, MEDIUM, HIGH, CRITICAL
- `status`: SUCCESS, FAILURE, PENDING
- `actor_type`: user, system, api
- `search`: Busca por texto
- `limit`: Limite de resultados (padrão: 100)
- `offset`: Offset para paginação

### Estatísticas
```http
GET /api/audit/stats?tenant_id=tenant-123&start_date=2024-01-01
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "total_logs": 1250,
    "logs_today": 45,
    "logs_this_week": 320,
    "logs_this_month": 1250,
    "actions_distribution": {
      "CREATE": 450,
      "UPDATE": 600,
      "DELETE": 50,
      "LOGIN": 100,
      "LOGOUT": 50
    },
    "entities_distribution": {
      "appointment": 800,
      "service": 200,
      "client": 150,
      "user": 100
    },
    "severity_distribution": {
      "LOW": 800,
      "MEDIUM": 300,
      "HIGH": 100,
      "CRITICAL": 50
    },
    "top_actors": [
      { "actor_id": "user-123", "actor_name": "João Silva", "action_count": 150 },
      { "actor_id": "user-456", "actor_name": "Maria Santos", "action_count": 120 }
    ]
  }
}
```

## Monitoramento e Alertas

### Alertas Automáticos
- **Ações Críticas**: DELETE, APPROVE, REJECT
- **Falhas de Auditoria**: Logs com status FAILURE
- **Padrões Suspeitos**: Muitas ações de alta severidade
- **Acesso Não Autorizado**: Tentativas de acesso sem permissão

### Relatórios de Segurança
- **Relatório Diário**: Resumo das ações do dia
- **Relatório Semanal**: Tendências e padrões
- **Relatório Mensal**: Análise completa com recomendações
- **Relatório de Incidentes**: Detalhes de ações críticas

## Conformidade e Regulamentações

### LGPD (Lei Geral de Proteção de Dados)
- **Rastreabilidade**: Todas as ações são registradas
- **Consentimento**: Logs de consentimento e revogação
- **Acesso aos Dados**: Logs de solicitações de acesso
- **Exclusão**: Logs de exclusão de dados pessoais

### SOX (Sarbanes-Oxley)
- **Controle de Acesso**: Logs de mudanças de permissões
- **Integridade de Dados**: Logs de modificações críticas
- **Auditoria Financeira**: Logs de operações financeiras

### ISO 27001
- **Gestão de Incidentes**: Logs de incidentes de segurança
- **Controle de Acesso**: Logs de autenticação e autorização
- **Gestão de Mudanças**: Logs de mudanças no sistema

## Performance e Escalabilidade

### Otimizações
- **Processamento em Lote**: Logs são processados em lotes para melhor performance
- **Cache Redis**: Cache para consultas frequentes
- **Índices Otimizados**: Índices específicos para filtros comuns
- **Compressão**: Logs antigos são comprimidos automaticamente

### Limites e Quotas
- **Tamanho Máximo**: 100MB por log
- **Taxa de Logs**: 1000 logs por segundo por tenant
- **Retenção**: Configurável por entidade
- **Arquivamento**: Logs antigos são arquivados automaticamente

## Troubleshooting

### Problemas Comuns

#### Logs não estão sendo criados
1. Verificar se a auditoria está habilitada
2. Verificar permissões do usuário
3. Verificar conectividade com o banco de dados
4. Verificar logs de erro do sistema

#### Performance lenta
1. Verificar índices do banco de dados
2. Verificar configuração de batch processing
3. Verificar uso de cache Redis
4. Verificar queries de auditoria

#### Logs corrompidos
1. Verificar integridade do banco de dados
2. Verificar logs de erro de auditoria
3. Verificar configuração de sanitização
4. Verificar versão do sistema

### Logs de Debug
```typescript
// Habilitar logs de debug
if (process.env.NODE_ENV === 'development') {
  console.log('🔍 AUDIT:', formatAuditMessage(auditLog));
}
```

## Exemplos de Implementação

### Auditoria de Login
```typescript
// src/app/api/auth/login/route.ts
export const POST = auditActions.login(ApiMiddleware.withApi(async (request) => {
  // ... lógica de login
  
  // Auditoria automática
  return NextResponse.json({ success: true });
}));
```

### Auditoria de Criação de Serviço
```typescript
// src/app/api/services/route.ts
export const POST = auditCRUD.create('service')(ApiMiddleware.withApi(async (request) => {
  // ... lógica de criação
  
  // Adiciona ID da entidade criada ao header para auditoria
  const response = NextResponse.json({ success: true });
  response.headers.set('X-Entity-Id', newService.id);
  return response;
}));
```

### Auditoria Customizada
```typescript
// src/app/api/appointments/approve/route.ts
export const POST = withAudit({
  action: 'APPROVE',
  entity: 'appointment',
  getEntityId: (request) => request.nextUrl.pathname.split('/').pop() || 'unknown',
  getChanges: (request) => [
    { field: 'status', old_value: 'PENDING', new_value: 'APPROVED' },
    { field: 'approved_at', old_value: null, new_value: new Date().toISOString() },
  ],
  getMetadata: (request) => ({
    approver_id: request.headers.get('X-User-Id'),
    approval_reason: request.nextUrl.searchParams.get('reason'),
  }),
})(ApiMiddleware.withApi(handler));
```

## Conclusão

O sistema de auditoria do Noxora fornece uma solução robusta e escalável para rastrear todas as ações importantes do sistema. Com sua arquitetura modular, configuração flexível e integração transparente, ele atende às necessidades de conformidade, segurança e análise de negócios.

Para mais informações ou suporte, consulte a documentação da API ou entre em contato com a equipe de desenvolvimento.
