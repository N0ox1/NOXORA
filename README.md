# Noxora - Sistema de Gestão para Barbearias

Sistema multi-tenant para gestão de barbearias com arquitetura escalável e moderna.

## 🚀 Características

- **Multi-tenancy com Row Level Security (RLS)**
- **Next.js 15 com TypeScript**
- **PostgreSQL com Drizzle ORM**
- **Redis para cache**
- **Sistema de filas assíncronas**
- **Pagamentos via Stripe**
- **Observabilidade com OpenTelemetry e Sentry**
- **Rate limiting e cache headers**
- **Locks otimistas para operações críticas**
- **Tailwind CSS para UI**
- **Sistema de Auditoria Completo** 🔍✨

## 🏗️ Arquitetura

### Stack Tecnológica
- **Frontend**: Next.js 15, React 18, TypeScript
- **Backend**: Node.js 20.x, API Routes
- **Database**: PostgreSQL com Neon/Railway
- **Cache**: Redis com Upstash
- **Filas**: Vercel Queues ou Cloudflare Queues
- **Storage**: Cloudflare R2
- **Pagamentos**: Stripe
- **Observabilidade**: OpenTelemetry, Sentry

### Multi-tenancy
- Isolamento de dados por tenant usando RLS
- Header `X-Tenant-Id` obrigatório para APIs
- Rate limiting por tenant e global
- Cache isolado por tenant
- Locks otimistas isolados por tenant

## 📦 Instalação Rápida

### 🐳 Com Docker (Recomendado)

1. **Clone o repositório**
```bash
git clone <repository-url>
cd noxora
```

2. **Setup automático**
```bash
npm run setup:dev
```

Este comando irá:
- ✅ Verificar pré-requisitos (Docker, Node.js 20.x)
- ✅ Iniciar PostgreSQL e Redis
- ✅ Instalar dependências
- ✅ Configurar banco de dados
- ✅ Aplicar RLS e migrações
- ✅ Criar arquivo .env.local

3. **Iniciar desenvolvimento**
```bash
npm run dev
```

### 🔧 Setup Manual

1. **Instalar dependências**
```bash
npm install
```

2. **Configurar variáveis de ambiente**
```bash
cp env.example .env.local
# Edite .env.local com suas configurações
```

3. **Configurar banco de dados**
```bash
# Aplique o RLS SQL
npm run db:rls

# Execute as migrações
npm run db:migrate
```

4. **Iniciar servidor**
```bash
npm run dev
```

## 🔧 Configuração

### Variáveis de Ambiente

```env
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# Redis
UPSTASH_REDIS_REST_URL="https://your-redis-url.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-redis-token"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# JWT
JWT_SECRET="your-jwt-secret-key"

# Sentry
SENTRY_DSN="https://your-sentry-dsn.ingest.sentry.io/..."

# App
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

# Tenant
DEFAULT_TENANT_ID="default"
```

### Banco de Dados

O projeto usa **Row Level Security (RLS)** para isolamento multi-tenant:

```sql
-- Habilitar RLS em todas as tabelas
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbershops ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Políticas de isolamento por tenant
CREATE POLICY tenant_isolation_policy ON tenants
    FOR ALL USING (id = current_setting('app.tenant_id')::uuid);
```

### 🔍 Sistema de Auditoria

O Noxora inclui um **sistema de auditoria completo** para rastreabilidade e conformidade:

#### Características
- **Rastreamento Automático**: Todas as ações CRUD, logins, exportações
- **Dados Sensíveis Protegidos**: Senhas e tokens automaticamente mascarados
- **Middleware Integrado**: Auditoria automática em todas as APIs
- **Hook React**: `useAudit` para auditoria no frontend
- **Relatórios Inteligentes**: Estatísticas e recomendações automáticas

#### Uso Rápido
```typescript
// Backend - Auditoria automática
export const POST = auditCRUD.create('service')(ApiMiddleware.withApi(handler));

// Frontend - Hook de auditoria
const audit = useAudit({ tenantId, actorId, actorType: 'user' });
await audit.logCreate('service', 'service-123', serviceData);
```

#### Configuração
```bash
# Configurar sistema de auditoria
npm run audit:setup

# Testar sistema
npm run audit:test

# Acessar dashboard
http://localhost:3000/audit
```

📚 **Documentação Completa**: [README-AUDIT.md](README-AUDIT.md) | [docs/audit.md](docs/audit.md) | [docs/seed-with-audit.md](docs/seed-with-audit.md) | [docs/database-rls.md](docs/database-rls.md) | [docs/authentication.md](docs/authentication.md) | [docs/multi-tenant.md](docs/multi-tenant.md) | [docs/cache-cdn.md](docs/cache-cdn.md)

### 🗄️ Sistema de Banco de Dados

O Noxora inclui um **sistema de banco PostgreSQL com Row Level Security (RLS)** para isolamento completo entre tenants:

#### Características
- **Prisma ORM**: Schema completo e tipado
- **Row Level Security**: Isolamento automático de dados por tenant
- **Políticas RLS**: Segurança em todas as operações CRUD
- **Índices Otimizados**: Performance para consultas complexas
- **Isolamento por Tenant**: Cada tenant só vê seus próprios dados
- **Funções de Controle**: Gerenciamento de sessão por tenant

#### Uso Rápido
```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Configurar tenant da sessão
await prisma.$executeRaw`SELECT set_tenant_id(${tenantId})`;

// Consultas isoladas automaticamente
const barbershops = await prisma.barbershop.findMany();
```

#### Configuração
```bash
# Configurar sistema de banco
npm run db:prisma:generate  # Gera cliente Prisma
npm run db:rls              # Aplica políticas RLS
npm run db:indices          # Cria índices de performance
npm run db:test-rls         # Testa isolamento por tenant
```

### 🔑 Sistema de Autenticação

O Noxora implementa **JWT** com **tokens de acesso curtos** e **refresh tokens httpOnly** para máxima segurança.

#### Características
- **JWT Access Tokens**: Tokens de 15 minutos para operações
- **Refresh Tokens**: Tokens de 7 dias em cookies httpOnly
- **Sistema de Roles**: OWNER, MANAGER, BARBER, ASSISTANT, CLIENT
- **Permissões Granulares**: Controle fino de acesso por recurso
- **Middleware de Proteção**: `requireAuth`, `requireRole`, `requirePermission`
- **Rotação de Tokens**: Refresh automático com segurança

#### Uso Rápido
```typescript
import { requireRole, UserRole } from '@/lib/auth';

// Proteger rota por role
export async function GET(request: NextRequest) {
  const authCheck = await requireRole(UserRole.MANAGER)(request);
  if (authCheck) return authCheck; // Erro de autorização
  
  // Rota protegida...
}
```

#### Configuração
```bash
# Configurar sistema de autenticação
npm run auth:test           # Testa fluxo de login/refresh/logout

# Configurar sistema multi-tenant
npm run tenant:test         # Testa isolamento e validação de tenant
```

## 🏢 Sistema Multi-Tenant

O Noxora implementa **isolamento completo** entre organizações com validação automática de tenant em todas as operações.

#### Características
- **Isolamento Total**: Cada tenant só acessa seus próprios dados
- **Múltiplas Estratégias**: Header X-Tenant-Id, subdomínio, domínio customizado
- **DTOs Zod**: Validação obrigatória de `tenant_id` em todas as operações
- **Middleware Global**: Validação automática em todas as rotas da API
- **Controle de Limites**: Planos STARTER, PRO, SCALE com recursos específicos
- **Auditoria Completa**: Log de todas as operações por tenant

#### Uso Rápido
```typescript
import { requireTenant, getTenantFromRequest } from '@/lib/tenant';

// Proteger rota por tenant
export async function GET(request: NextRequest) {
  const tenantCheck = await requireTenant()(request);
  if (tenantCheck) return tenantCheck; // Erro de tenant
  
  const tenant = getTenantFromRequest(request);
  // Rota protegida com acesso ao tenant...
}
```

#### Configuração
```bash
# Configurar sistema multi-tenant
npm run tenant:test         # Testa isolamento e validação de tenant

# Testar sistema de rate limiting e locks
npm run rate-limit-lock:test # Testa rate limiting e locks otimistas

# Testar sistema de billing
npm run billing:test           # Testa checkout, webhooks e enforce limits

## 🚀 Sistema de Cache e CDN

O Noxora implementa um **sistema de cache Redis robusto** com estratégias read-through, write-through e write-behind, além de headers de CDN otimizados para máxima performance.

#### Características
- **Cache Read-Through**: Primeira requisição MISS → banco, segunda HIT → cache
- **Chaves Estruturadas**: Formato `{prefix}:{tenantId}:{identifier}`
- **TTL Configurável**: Diferentes tempos por tipo de dado (60s a 600s)
- **Headers CDN**: s-maxage=60, stale-while-revalidate=120
- **Invalidação Automática**: Cache removido após operações de escrita
- **Isolamento por Tenant**: Cache isolado entre organizações

#### Uso Rápido
```typescript
import { cacheService, CacheService, CACHE_CONFIG } from '@/lib/redis';

// Cache automático em rotas GET
const cacheResult = await cacheService.readThrough(
  CacheService.generateKey('srv', tenantId, 'list'),
  async () => await database.getServices(tenantId),
  CACHE_CONFIG.TTL.SERVICES
);
```

#### Configuração
```bash
# Configurar sistema de cache
npm run cache:test           # Testa read-through, TTL e headers CDN

## 🚀 Sistema de Rate Limiting e Locks Otimistas

O Noxora implementa **proteção robusta** contra abuso de API e condições de corrida em operações críticas.

#### Características
- **Rate Limiting Global**: 600 requisições por minuto por IP
- **Rate Limiting Público**: 60 req/min por IP + tenant + slug
- **Rate Limiting por Endpoint**: Limites específicos para rotas sensíveis
- **Locks Otimistas**: Prevenção de overbooking em agendamentos
- **Isolamento por Tenant**: Rate limits e locks isolados entre organizações
- **Headers Informativos**: X-RateLimit-* e X-Lock-* para monitoramento

#### Uso Rápido
```typescript
import { rateLimitService } from '@/lib/rate-limit';
import { optimisticLockService } from '@/lib/optimistic-lock';

// Rate limiting automático no middleware
// Locks otimistas em operações críticas
const lockResult = await optimisticLockService.acquireLock(
  lockKey, 
  Date.now(), 
  { ttl: 10000, retryCount: 2 }
);
```

#### Configuração
```bash
# Testar sistema de rate limiting e locks
npm run rate-limit-lock:test # Testa rate limiting e locks otimistas
```

## 🚀 Sistema de Billing e Enforce Limits

O Noxora implementa um **sistema de billing completo** com planos por assinatura, feature flags baseados em planos e enforce limits automático para controle de recursos.

#### Características
- **Planos Flexíveis**: STARTER (R$49), PRO (R$149), SCALE (R$299)
- **Feature Flags**: Funcionalidades habilitadas/desabilitadas por plano
- **Enforce Limits**: Bloqueio automático quando limites são excedidos
- **Checkout Mock Stripe**: Simulação completa de fluxo de pagamento
- **Webhooks**: Processamento de eventos de assinatura e pagamento
- **Recomendações de Upgrade**: Sugestões automáticas baseadas no uso

#### Uso Rápido
```typescript
import { enforceBillingLimits } from '@/lib/billing/enforce-limits';
import { billingService } from '@/lib/billing/billing-service';

// Enforce limits em rotas
const limitCheck = await enforceBillingLimits(request, 'create_service');
if (limitCheck) return limitCheck; // 409 LIMIT_EXCEEDED se necessário

// Verificar features disponíveis
const canUseMultiLocation = billingService.isFeatureEnabled(tenant.plan, 'multi_location');
```

#### Configuração
```bash
# Testar sistema de billing
npm run billing:test           # Testa checkout, webhooks e enforce limits

# Testar sistema de notificações e jobs
npm run notifications:test     # Testa fila, processamento e jobs cron

## 🚀 Sistema de Notificações e Jobs

O Noxora implementa um **sistema completo de notificações assíncronas** com fila Redis, processamento automático e jobs cron para manutenção do sistema.

#### Características
- **Fila de Notificações**: Sistema Redis para processamento assíncrono
- **Jobs Cron**: Lembretes automáticos, reconciliação de billing, limpeza
- **Templates Inteligentes**: Substituição automática de variáveis
- **Múltiplos Canais**: SMS, Email e Push (mock para desenvolvimento)
- **Retry Automático**: Backoff exponencial com fallbacks
- **Integração Nativa**: Notificações automáticas ao criar agendamentos
- **Isolamento por Tenant**: Fila e processamento isolados entre organizações

#### Uso Rápido
```typescript
import { notificationQueueService } from '@/lib/notifications';
import { cronService } from '@/lib/jobs';

// Agendar notificação
const jobId = await notificationQueueService.enqueue({
  tenant_id: 'tnt_1',
  template: 'appointment_reminder',
  recipient: '+55 11 90000-0000',
  recipient_type: 'client',
  data: { client_name: 'João', time: '14:30' }
});

// Iniciar jobs cron
await cronService.initializeCronJobs();
```

#### Configuração
```bash
# Testar sistema de notificações e jobs
npm run notifications:test     # Testa fila, processamento e jobs cron
```

## 🚀 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor de desenvolvimento
npm run build            # Build para produção
npm run start            # Inicia servidor de produção
npm run lint             # Executa ESLint
npm run type-check       # Verifica tipos TypeScript

# Banco de Dados (Prisma + RLS)
npm run db:prisma:generate  # Gera cliente Prisma
npm run db:prisma:migrate   # Aplica migrações Prisma
npm run db:prisma:studio    # Abre Prisma Studio
npm run db:rls              # Aplica políticas RLS
npm run db:indices          # Cria índices de performance
npm run db:test-rls         # Testa isolamento por tenant

# Banco de Dados (Drizzle - Original)
npm run db:migrate       # Executa migrações
npm run db:studio        # Abre Drizzle Studio
npm run db:seed          # Popula banco com dados mock
npm run db:generate      # Gera migrações Drizzle
npm run db:push          # Aplica migrações ao banco
npm run db:status        # Verifica status das migrações

        # Auditoria
        npm run audit:setup      # Configura sistema de auditoria
        npm run audit:test       # Testa sistema de auditoria
        
        # Seed de Dados
        npm run seed:audit       # Insere dados com auditoria (Node.js)
        npm run seed:sql         # Insere dados com auditoria (SQL direto)
        npm run seed:audit:ps1   # Insere dados com auditoria (PowerShell)

# Docker
npm run docker:up        # Inicia serviços Docker
npm run docker:down      # Para serviços Docker
npm run docker:logs      # Visualiza logs
npm run docker:reset     # Reseta banco de dados

# Setup e Utilitários
npm run setup:dev        # Setup completo do ambiente
npm run health           # Health check da aplicação
```

## 🐳 Docker Compose

O projeto inclui um `docker-compose.yml` para desenvolvimento local:

```bash
# Iniciar serviços
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar serviços
docker-compose down

# Resetar banco
docker-compose down -v && docker-compose up -d
```

**Serviços disponíveis:**
- **PostgreSQL**: `localhost:5432`
- **Redis**: `localhost:6379`
- **Redis Commander**: `http://localhost:8081`

## 📁 Estrutura do Projeto

```
src/
├── app/                    # App Router do Next.js
│   ├── globals.css        # Estilos globais (apenas Tailwind)
│   ├── layout.tsx         # Layout principal
│   ├── page.tsx           # Página inicial
│   └── api/               # API Routes
│       └── health/        # Health check endpoint
├── components/             # Componentes React
│   ├── providers/         # Context providers
│   ├── tenant-selector.tsx
│   └── barbershop-list.tsx
├── lib/                   # Utilitários e configurações
│   ├── db/               # Banco de dados
│   │   ├── schema.ts     # Schema Drizzle
│   │   └── index.ts      # Conexão DB
│   ├── redis.ts          # Configuração Redis
│   ├── stripe.ts         # Configuração Stripe
│   ├── telemetry.ts      # OpenTelemetry
│   ├── queue.ts          # Sistema de filas
│   ├── middleware.ts     # Middleware Next.js
│   ├── config.ts         # Configuração centralizada
│   └── logger.ts         # Sistema de logging
└── types/                 # Tipos TypeScript

scripts/
├── rls.sql               # Script SQL para RLS
├── init-db.sql           # Dados mock para desenvolvimento
└── dev-setup.sh          # Script de setup automático

docker-compose.yml         # Serviços de desenvolvimento
infra.json                 # Configuração de infraestrutura
drizzle.config.ts          # Configuração Drizzle
tailwind.config.js         # Configuração Tailwind
next.config.js            # Configuração Next.js
```

## 🔒 Segurança

- **Row Level Security (RLS)** para isolamento de dados
- **Rate limiting** por IP e tenant
- **Headers de segurança** configurados
- **Validação de tenant** obrigatória
- **Isolamento de cache** por tenant

## 📊 Observabilidade

- **OpenTelemetry** para tracing distribuído
- **Sentry** para monitoramento de erros
- **Logs estruturados** com contexto de tenant
- **Métricas de performance** automáticas
- **Health check endpoint** para monitoramento

### Health Check

Acesse `/api/health` para verificar o status dos serviços:

```bash
curl http://localhost:3000/api/health
```

## 🚀 Deploy

### Vercel
```bash
npm run build
vercel --prod
```

### Railway
```bash
railway up
```

### Variáveis de Ambiente de Produção
- Configure todas as variáveis necessárias
- Use secrets para chaves sensíveis
- Configure domínios customizados por tenant

## 📈 Escalabilidade

### Estratégias Implementadas
1. **Cache First**: Redis para dados frequentemente acessados
2. **Outbox Queue**: Processamento assíncrono de eventos
3. **Read Replicas**: Banco de leitura separado
4. **Partition by Tenant**: Dados isolados por tenant
5. **ClickHouse Reports**: Analytics em banco separado

### Índices de Performance
```sql
-- Índices otimizados para consultas multi-tenant
CREATE UNIQUE INDEX idx_barbershops_tenant_slug ON barbershops(tenant_id, slug);
CREATE INDEX idx_appointments_tenant_barbershop_start ON appointments(tenant_id, barbershop_id, start_at);
CREATE INDEX idx_services_tenant_barbershop_active ON services(tenant_id, barbershop_id, is_active);
```

## 🧪 Desenvolvimento

### Ambiente Local
- **Setup automático** com `npm run setup:dev`
- **Docker Compose** para serviços
- **Dados mock** pré-carregados
- **Hot reload** com Next.js
- **TypeScript** com verificação de tipos

### Debugging
- **Logs estruturados** com contexto
- **Health check** em tempo real
- **Redis Commander** para cache
- **Drizzle Studio** para banco

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🆘 Suporte

Para suporte, abra uma issue no repositório ou entre em contato com a equipe de desenvolvimento.

---

**Desenvolvido com ❤️ para barbearias modernas**

## Sistema de UI Funcional

O sistema de UI funcional implementa interfaces completas para diferentes tipos de usuários:

### 🎯 Funcionalidades Implementadas

- **Página Pública** (`/b/[slug]`) - Clientes podem agendar serviços ponta a ponta
- **Dashboard Admin** (`/admin/dashboard`) - CRUD completo de serviços, funcionários e agenda diária
- **Super Admin** (`/admin/super-admin`) - Visão global de todos os tenants, status e planos

### 🚀 Características

- **Interface Responsiva**: Mobile-first com Tailwind CSS
- **Gerenciamento de Estado**: React Hooks para estado local
- **CRUD Completo**: Create, Read, Update, Delete para todas as entidades
- **Modais Interativos**: Formulários para criação e edição
- **Filtros Avançados**: Busca e filtros por múltiplos critérios
- **Estatísticas Visuais**: Cards e gráficos para métricas de negócio

### 📱 Páginas Principais

1. **Página Pública** - Seleção de serviço, funcionário, data, horário e formulário de cliente
2. **Dashboard Admin** - Gestão de serviços, funcionários e visualização de agenda
3. **Super Admin** - Estatísticas globais, gestão de tenants e métricas de receita

### 🧪 Testes

```bash
# Testar todas as funcionalidades da UI
npm run ui:test
```

### 📚 Documentação

- [Documentação Completa da UI](docs/ui-functional.md)

---

**Status**: ✅ Sistema de UI completamente implementado e testado

## Sistema de Observabilidade

O sistema de observabilidade implementa monitoramento completo e rastreamento distribuído:

### 🔍 Funcionalidades Implementadas

- **OpenTelemetry**: Distributed tracing automático com contexto de tenant
- **Sentry**: Error tracking e performance monitoring para frontend e backend
- **Audit Logs**: Registro completo de ações críticas para compliance

### 🚀 Características

- **Tracing Automático**: Todos os requests rastreados com trace ID e span ID
- **Contexto de Tenant**: Isolamento completo entre organizações
- **Headers de Observabilidade**: X-Trace-Id, X-Span-Id, X-Tenant-Id
- **APIs de Audit**: Consulta e criação de logs de auditoria
- **Integração com Middleware**: Observabilidade em todas as rotas
- **Performance Monitoring**: Métricas automáticas de latência e throughput

### 🧪 Testes

```bash
# Testar sistema de observabilidade
npm run observability:test
```

### 📚 Documentação

- [Documentação Completa da Observabilidade](docs/observability.md)

---

**Status**: ✅ Sistema de observabilidade completamente implementado e testado

---

## Sistema de Seeds e Smoke Tests

O sistema de seeds e smoke tests garante dados de exemplo e validação de funcionalidades:

### 🌱 Funcionalidades Implementadas

- **Seeds Automáticos**: Carregamento de dados de exemplo no PostgreSQL via Prisma
- **Smoke Tests**: Validação completa de health, público, CRUD e booking
- **Validação de Cache**: Verificação de headers X-Cache-Source e CDN
- **Locks Otimistas**: Teste de conflitos e prevenção de overbooking

### 🚀 Características

- **Dados Consistentes**: Tenant, barbershop, employees, services, clients e appointments
- **Testes Automatizados**: Validação de todas as funcionalidades principais
- **Relatórios Detalhados**: Resultados com sucesso/falha e métricas de tempo
- **Setup Completo**: Script único para seed + testes
- **Integração Prisma**: Uso de upsert para evitar duplicatas

### 🧪 Testes

```bash
# Executar setup completo (seed + testes)
npm run setup:complete

# Apenas carregar seeds no banco
npm run seed:prisma

# Apenas executar smoke tests
npm run smoke:test
```

### 📚 Documentação

- [Documentação Completa dos Seeds e Smoke Tests](docs/seeds-and-smoke-tests.md)

---

**Status**: ✅ Sistema de seeds e smoke tests completamente implementado e testado

---

## Sistema de CI/CD

O sistema de CI/CD implementa pipeline completo de integração e deploy contínuo:

### 🚀 Funcionalidades Implementadas

- **Pipeline GitHub Actions**: Jobs de qualidade, banco, build, testes E2E e deploy
- **Testes E2E Playwright**: Validação completa do fluxo de booking
- **Deploy Automático Vercel**: Deploy automático na branch main
- **Health Checks**: Verificação pós-deploy e monitoramento

### 🧪 Testes E2E

```bash
# Executar testes end-to-end
npm run test:e2e

# Interface visual dos testes
npm run test:e2e:ui

# Ver relatórios
npm run test:e2e:report
```

### 📚 Documentação

- [Documentação Completa do CI/CD](docs/ci-cd.md)

---

**Status**: ✅ Sistema de CI/CD completamente implementado e testado
