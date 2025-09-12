# Sistema de Auditoria do Noxora

## 🚀 Configuração Rápida

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Variáveis de Ambiente
```bash
cp .env.example .env
# Editar .env e configurar DATABASE_URL
```

### 3. Executar Migrações
```bash
npm run audit:setup
```

### 4. Testar o Sistema
```bash
npm run dev
# Acessar http://localhost:3000/audit
```

## 📋 O que foi Implementado

### ✅ Backend Completo
- **AuditService**: Serviço principal de auditoria com processamento em lote
- **Middleware de Auditoria**: Integração automática com APIs
- **APIs de Auditoria**: Endpoints para logs e estatísticas
- **Schema do Banco**: Tabela `audit_logs` com índices otimizados
- **Sanitização**: Proteção automática de dados sensíveis

### ✅ Frontend Completo
- **Hook useAudit**: React hook para auditoria no frontend
- **Componentes de Auditoria**: Interface completa para visualização
- **Página de Auditoria**: Dashboard com estatísticas e logs
- **Componente de Teste**: Demonstração interativa das funcionalidades

### ✅ Configuração e Scripts
- **Scripts de Migração**: Automatização da configuração do banco
- **Configuração Centralizada**: Arquivo de configuração unificado
- **Documentação Completa**: Guias de uso e implementação

## 🔧 Como Usar

### No Backend (APIs)

#### Auditoria Automática CRUD
```typescript
import { auditCRUD } from '@/lib/audit';

// Criar com auditoria automática
export const POST = auditCRUD.create('service')(ApiMiddleware.withApi(handler));

// Atualizar com auditoria automática
export const PUT = auditCRUD.update('service')(ApiMiddleware.withApi(handler));

// Deletar com auditoria automática
export const DELETE = auditCRUD.delete('service')(ApiMiddleware.withApi(handler));
```

#### Auditoria de Ações Específicas
```typescript
import { auditActions } from '@/lib/audit';

// Login com auditoria
export const POST = auditActions.login(ApiMiddleware.withApi(handler));

// Export com auditoria
export const GET = auditActions.export('appointment')(ApiMiddleware.withApi(handler));
```

#### Auditoria Customizada
```typescript
import { withAudit } from '@/lib/audit';

export const POST = withAudit({
  action: 'APPROVE',
  entity: 'appointment',
  getEntityId: (request) => request.nextUrl.pathname.split('/').pop() || 'unknown',
  getChanges: (request) => [
    { field: 'status', old_value: 'PENDING', new_value: 'APPROVED' }
  ],
  getMetadata: (request) => ({
    reason: request.nextUrl.searchParams.get('reason'),
  }),
})(ApiMiddleware.withApi(handler));
```

### No Frontend (React)

#### Hook useAudit
```typescript
import { useAudit } from '@/hooks/use-audit';

function MyComponent() {
  const audit = useAudit({
    tenantId: 'tenant-123',
    actorId: 'user-456',
    actorType: 'user',
    actorName: 'João Silva',
  });

  const handleCreate = async () => {
    await audit.logCreate('service', 'service-123', {
      name: 'Corte Masculino',
      price: 25.00,
    });
  };

  const handleLogin = async () => {
    await audit.logLogin('user-456', true, {
      ip: '192.168.1.100',
      userAgent: navigator.userAgent,
    });
  };
}
```

## 📊 APIs Disponíveis

### Buscar Logs de Auditoria
```http
GET /api/audit/logs?tenant_id=tenant-123&action=DELETE&limit=50
```

### Obter Estatísticas
```http
GET /api/audit/stats?tenant_id=tenant-123&start_date=2024-01-01
```

## 🗄️ Estrutura do Banco

### Tabela audit_logs
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

## 🎯 Funcionalidades Principais

### 🔍 Rastreamento Automático
- **Ações CRUD**: Create, Read, Update, Delete
- **Acesso ao Sistema**: Login, logout, sessões
- **Operações de Dados**: Export, import, backup
- **Mudanças de Configuração**: Permissões, configurações

### 🛡️ Segurança
- **Dados Sensíveis Protegidos**: Senhas e tokens mascarados
- **Sanitização Automática**: Remoção de informações confidenciais
- **Controle de Acesso**: Logs protegidos por permissões

### 📈 Análise
- **Estatísticas em Tempo Real**: Distribuição de ações
- **Filtros Avançados**: Por usuário, ação, entidade, período
- **Relatórios**: Geração automática com recomendações
- **Tendências**: Identificação de padrões suspeitos

## 🚀 Comandos Úteis

### Desenvolvimento
```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Verificar tipos TypeScript
npm run type-check

# Executar linting
npm run lint
```

### Banco de Dados
```bash
# Gerar migrações
npm run db:generate

# Aplicar migrações
npm run db:push

# Visualizar banco
npm run db:studio

# Verificar status
npm run db:status
```

### Auditoria
```bash
# Configurar sistema de auditoria
npm run audit:setup

# Testar sistema de auditoria
npm run audit:test
```

### Seed de Dados com Auditoria
```bash
# Usando Node.js (recomendado)
npm run seed:audit

# Usando SQL direto
npm run seed:sql

# Usando PowerShell (Windows)
npm run seed:audit:ps1
```

### Docker
```bash
# Iniciar serviços
npm run docker:up

# Parar serviços
npm run docker:down

# Ver logs
npm run docker:logs

# Reset completo
npm run docker:reset
```

## 📁 Estrutura de Arquivos

```
src/
├── lib/
│   ├── audit/
│   │   ├── audit-service.ts      # Serviço principal de auditoria
│   │   ├── audit-middleware.ts   # Middleware para APIs
│   │   └── index.ts              # Exportações
│   ├── db/
│   │   └── schema.ts             # Schema com tabela audit_logs
│   └── config.ts                 # Configuração de auditoria
├── types/
│   └── audit.ts                  # Tipos TypeScript
├── hooks/
│   └── use-audit.ts              # Hook React para auditoria
├── components/
│   └── audit/                    # Componentes de auditoria
│       ├── audit-stats.tsx       # Estatísticas
│       ├── audit-filters.tsx     # Filtros
│       ├── audit-log-viewer.tsx  # Visualizador de logs
│       ├── audit-test.tsx        # Componente de teste
│       └── index.ts              # Exportações
└── app/
    ├── audit/
    │   └── page.tsx              # Página principal de auditoria
    └── api/
        └── audit/                 # APIs de auditoria
            ├── logs/route.ts      # Buscar logs
            └── stats/route.ts     # Estatísticas

scripts/
├── run-migrations.ps1            # Script PowerShell para migrações
├── run-migrations.sh             # Script Bash para migrações
└── init-db.sql                   # Script de inicialização do banco

docs/
└── audit.md                      # Documentação completa
```

## 🔧 Configuração

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
}
```

## 🧪 Testando

### 1. Acessar a Página de Auditoria
```
http://localhost:3000/audit
```

### 2. Usar o Componente de Teste
- Configurar tenant ID e informações do usuário
- Executar diferentes ações de auditoria
- Ver logs em tempo real
- Verificar console do navegador

### 3. Testar APIs
```bash
# Buscar logs
curl "http://localhost:3000/api/audit/logs?tenant_id=barbearia-alfa"

# Obter estatísticas
curl "http://localhost:3000/api/audit/stats?tenant_id=barbearia-alfa"
```

## 🚨 Troubleshooting

### Problemas Comuns

#### Logs não estão sendo criados
1. Verificar se a auditoria está habilitada em `src/lib/config.ts`
2. Verificar permissões do usuário
3. Verificar conectividade com o banco de dados
4. Verificar logs de erro do sistema

#### Erro de TypeScript
1. Executar `npm run type-check`
2. Verificar se todos os tipos estão importados corretamente
3. Verificar se o schema está atualizado

#### Problemas de Banco de Dados
1. Executar `npm run audit:setup`
2. Verificar se a tabela `audit_logs` foi criada
3. Verificar se os índices estão funcionando

## 📚 Documentação Adicional

- **Documentação Completa**: [docs/audit.md](docs/audit.md)
- **Tipos TypeScript**: [src/types/audit.ts](src/types/audit.ts)
- **Serviço de Auditoria**: [src/lib/audit/audit-service.ts](src/lib/audit/audit-service.ts)
- **Middleware**: [src/lib/audit/audit-middleware.ts](src/lib/audit/audit-middleware.ts)

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/audit-improvement`)
3. Commit suas mudanças (`git commit -am 'Add audit feature'`)
4. Push para a branch (`git push origin feature/audit-improvement`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🆘 Suporte

Se você encontrar algum problema ou tiver dúvidas:

1. Verifique a documentação em [docs/audit.md](docs/audit.md)
2. Abra uma issue no GitHub
3. Consulte os logs de erro do sistema
4. Verifique se todas as dependências estão instaladas

---

**Sistema de Auditoria do Noxora** - Rastreabilidade completa e conformidade garantida! 🔍✨
