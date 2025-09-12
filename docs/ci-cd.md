# Sistema de CI/CD

## Visão Geral

O sistema de CI/CD do Noxora implementa um pipeline completo de integração e deploy contínuo, garantindo qualidade de código, testes automatizados e deploy automático na Vercel.

## 🚀 Pipeline CI/CD

### Estrutura dos Jobs

O pipeline é dividido em 5 jobs principais:

1. **Quality** - Qualidade de código
2. **Database** - Setup do banco de dados
3. **Build** - Build da aplicação
4. **E2E** - Testes end-to-end
5. **Deploy** - Deploy para Vercel
6. **Notify** - Notificações de resultado

### Triggers

- **Push** para branches `main` e `develop`
- **Pull Request** para branches `main` e `develop`

## 📋 Job de Qualidade

### Funcionalidades

- ✅ **Lint**: Executa ESLint para verificar padrões de código
- ✅ **Type Check**: Verifica tipos TypeScript
- ✅ **Format Check**: Valida formatação com Prettier

### Configuração

```yaml
quality:
  runs-on: ubuntu-latest
  name: Code Quality
  
  steps:
  - uses: actions/checkout@v4
  - name: Setup Node.js 20.x
  - name: Setup pnpm 8.x
  - name: Install dependencies
  - name: Run linter
  - name: Run type check
  - name: Check formatting
```

## 🗄️ Job de Banco de Dados

### Funcionalidades

- ✅ **PostgreSQL**: Container com banco de teste
- ✅ **Prisma Generate**: Gera cliente Prisma
- ✅ **Migrations**: Executa migrações do banco
- ✅ **Seed Data**: Carrega dados de exemplo

### Serviços

```yaml
services:
  postgres:
    image: postgres:15
    env:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: noxora_test
    options: >-
      --health-cmd pg_isready
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5
    ports:
      - 5432:5432
```

### Variáveis de Ambiente

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/noxora_test
```

## 🔨 Job de Build

### Funcionalidades

- ✅ **Dependencies**: Instala dependências
- ✅ **Prisma Generate**: Gera cliente Prisma
- ✅ **Build**: Executa `npm run build`
- ✅ **Artifacts**: Upload dos arquivos de build

### Dependências

- **Needs**: `quality`, `database`
- **Artefatos**: `.next/` (retido por 1 dia)

## 🧪 Job de Testes E2E

### Funcionalidades

- ✅ **Playwright**: Testes end-to-end automatizados
- ✅ **PostgreSQL**: Banco de dados para testes
- ✅ **Redis**: Cache para testes
- ✅ **Reports**: Relatórios de teste

### Serviços

```yaml
services:
  postgres:
    image: postgres:15
    # ... configuração PostgreSQL
  
  redis:
    image: redis:7-alpine
    options: >-
      --health-cmd "redis-cli ping"
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5
    ports:
      - 6379:6379
```

### Testes Executados

1. **Fluxo de Booking** - Agendamento completo
2. **Health Check** - Verificação de saúde da aplicação
3. **Validações** - Campos obrigatórios e erros
4. **Responsividade** - Diferentes resoluções
5. **Performance** - Tempo de carregamento
6. **Acessibilidade** - Elementos básicos

### Timeout

- **15 minutos** para execução completa dos testes

## 🚀 Job de Deploy

### Funcionalidades

- ✅ **Vercel**: Deploy automático na plataforma
- ✅ **Production**: Deploy apenas na branch `main`
- ✅ **Health Check**: Verificação pós-deploy
- ✅ **Secrets**: Configuração segura

### Condições

```yaml
deploy:
  needs: [quality, database, build, e2e]
  if: github.ref == 'refs/heads/main' && github.event_name == 'push'
  environment: production
```

### Secrets Necessários

```bash
VERCEL_TOKEN=vercel_token_aqui
VERCEL_ORG_ID=org_id_aqui
VERCEL_PROJECT_ID=project_id_aqui
```

### Health Check

```yaml
- name: Run post-deploy health check
  run: |
    echo "Waiting for deployment to be ready..."
    sleep 30
    
    # Health check básico
    curl -f ${{ steps.deploy.outputs.preview-url }}/api/health || exit 1
    echo "✅ Health check passed"
```

## 📢 Job de Notificação

### Funcionalidades

- ✅ **Success**: Notifica sucesso do pipeline
- ✅ **Failure**: Notifica falhas com detalhes
- ✅ **Always**: Executa independente do resultado

### Mensagens

```yaml
- name: Notify success
  if: success()
  run: |
    echo "🎉 CI/CD Pipeline completed successfully!"
    echo "✅ All jobs passed"
    echo "🚀 Application deployed to production"

- name: Notify failure
  if: failure()
  run: |
    echo "❌ CI/CD Pipeline failed!"
    echo "🔍 Check the logs above for details"
    exit 1
```

## 🧪 Testes E2E com Playwright

### Configuração

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'dot' : 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Configurações para CI
    ...(process.env.CI && {
      headless: true,
      slowMo: 0,
    }),
  },
});
```

### Estrutura de Testes

```
tests/
├── e2e/
│   ├── booking-flow.spec.ts    # Fluxo de agendamento
│   └── health-check.spec.ts    # Verificação de saúde
```

### Testes de Booking

#### Cenários Testados

1. **Agendamento Completo**
   - Seleção de serviço
   - Seleção de funcionário
   - Seleção de data/horário
   - Preenchimento de dados do cliente
   - Confirmação do agendamento

2. **Validações**
   - Campos obrigatórios
   - Horários disponíveis
   - Horários ocupados
   - Tratamento de erros

3. **Responsividade**
   - Diferentes resoluções
   - Dispositivos móveis
   - Navegação entre páginas

4. **Performance**
   - Tempo de carregamento
   - Loading states
   - Tratamento offline

### Testes de Health Check

#### Cenários Testados

1. **API Health**
   - Resposta 200
   - Conteúdo correto
   - Performance aceitável

2. **Página Inicial**
   - Carregamento sem erros
   - Console limpo
   - Meta tags corretas

3. **Acessibilidade**
   - Título da página
   - Navegação
   - Headings
   - Links funcionais

## 🌐 Deploy na Vercel

### Configuração

```json
// vercel.json
{
  "version": 2,
  "name": "noxora",
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

### Headers de Segurança

```json
"headers": [
  {
    "source": "/(.*)",
    "headers": [
      {
        "key": "X-Frame-Options",
        "value": "DENY"
      },
      {
        "key": "X-Content-Type-Options",
        "value": "nosniff"
      },
      {
        "key": "Referrer-Policy",
        "value": "strict-origin-when-cross-origin"
      }
    ]
  }
]
```

### Rewrites e Redirects

```json
"rewrites": [
  {
    "source": "/b/(.*)",
    "destination": "/b/[slug]"
  },
  {
    "source": "/admin/(.*)",
    "destination": "/admin/[path]"
  }
],
"redirects": [
  {
    "source": "/",
    "destination": "/b/barber-labs-centro",
    "permanent": false
  }
]
```

## 📜 Scripts Disponíveis

### CI/CD

```bash
# Executar pipeline completo
git push origin main

# Verificar status dos jobs
# Acessar: https://github.com/[user]/noxora/actions
```

### Testes E2E

```bash
# Executar todos os testes
npm run test:e2e

# Interface visual
npm run test:e2e:ui

# Modo headed (com browser visível)
npm run test:e2e:headed

# Debug
npm run test:e2e:debug

# Instalar browsers
npm run test:e2e:install

# Ver relatório
npm run test:e2e:report
```

### Formatação

```bash
# Verificar formatação
npm run format:check

# Corrigir formatação
npm run format:fix
```

### Deploy Manual

```bash
# Deploy para produção
./scripts/deploy.sh production

# Deploy para preview
./scripts/deploy.sh preview
```

## 🔧 Configuração Local

### Pré-requisitos

1. **Node.js 20.x**
2. **pnpm 8.x**
3. **Vercel CLI**
4. **Git**

### Setup

```bash
# 1. Instalar dependências
pnpm install

# 2. Configurar Vercel
vercel login
vercel link

# 3. Instalar browsers do Playwright
pnpm run test:e2e:install

# 4. Executar testes localmente
pnpm run test:e2e
```

### Variáveis de Ambiente

```bash
# .env.local
DATABASE_URL=postgresql://user:password@localhost:5432/noxora
REDIS_URL=redis://localhost:6379
NODE_ENV=development
```

## 🚨 Troubleshooting

### Problemas Comuns

#### 1. Pipeline Falhando

**Sintomas:**
- Job `quality` falhando
- Lint ou type check com erro

**Solução:**
```bash
# Corrigir lint
npm run lint -- --fix

# Verificar tipos
npm run type-check

# Verificar formatação
npm run format:fix
```

#### 2. Testes E2E Falhando

**Sintomas:**
- Job `e2e` falhando
- Timeout nos testes

**Solução:**
```bash
# Executar testes localmente
npm run test:e2e

# Ver relatório detalhado
npm run test:e2e:report

# Debug interativo
npm run test:e2e:debug
```

#### 3. Deploy Falhando

**Sintomas:**
- Job `deploy` falhando
- Erro de autenticação Vercel

**Solução:**
```bash
# Verificar login Vercel
vercel whoami

# Re-autenticar
vercel login

# Verificar projeto
vercel project ls
```

#### 4. Banco de Dados

**Sintomas:**
- Job `database` falhando
- Erro de conexão PostgreSQL

**Solução:**
- Verificar se container PostgreSQL está rodando
- Verificar variáveis de ambiente
- Verificar permissões do usuário

### Logs e Debug

#### GitHub Actions

```bash
# Acessar logs dos jobs
# https://github.com/[user]/noxora/actions/runs/[run_id]

# Download de artifacts
# https://github.com/[user]/noxora/actions/runs/[run_id]/artifacts
```

#### Playwright

```bash
# Relatório HTML
npm run test:e2e:report

# Screenshots de falha
# tests-results/screenshots/

# Vídeos de falha
# tests-results/videos/

# Traces
# tests-results/traces/
```

## 📊 Métricas e Monitoramento

### Métricas de Pipeline

- **Tempo de Execução**: Duração total do pipeline
- **Taxa de Sucesso**: % de jobs passando
- **Tempo de Deploy**: Duração do deploy até produção
- **Tempo de Testes**: Duração dos testes E2E

### Métricas de Aplicação

- **Health Check**: Status da API
- **Performance**: Tempo de resposta
- **Disponibilidade**: Uptime da aplicação
- **Erros**: Taxa de erro em produção

### Alertas

- ❌ Pipeline falhando
- ⚠️ Testes demorando muito
- 🔴 Deploy falhando
- 🟡 Performance degradada

## 🔮 Próximos Passos

### Melhorias Planejadas

1. **Notificações Avançadas**
   - Slack/Discord integration
   - Email notifications
   - Status badges

2. **Testes de Performance**
   - Lighthouse CI
   - Bundle analysis
   - Core Web Vitals

3. **Segurança**
   - SAST scanning
   - Dependency scanning
   - Container scanning

4. **Monitoramento**
   - APM integration
   - Error tracking
   - Performance monitoring

### Automação

1. **Auto-merge**
   - Dependabot integration
   - Auto-merge em PRs aprovados
   - Deploy automático em staging

2. **Rollback**
   - Deploy automático em caso de falha
   - Health check contínuo
   - Rollback automático

## 📚 Recursos Adicionais

### Documentação

- [GitHub Actions](https://docs.github.com/en/actions)
- [Playwright](https://playwright.dev/)
- [Vercel](https://vercel.com/docs)
- [Prisma](https://www.prisma.io/docs/)

### Ferramentas

- **CI/CD**: GitHub Actions
- **Testes**: Playwright
- **Deploy**: Vercel
- **Banco**: PostgreSQL
- **Cache**: Redis
- **ORM**: Prisma

## 🎯 Conclusão

O sistema de CI/CD do Noxora garante:

- ✅ **Qualidade**: Lint, type check e formatação
- ✅ **Testes**: E2E automatizados com Playwright
- ✅ **Deploy**: Automático e seguro na Vercel
- ✅ **Monitoramento**: Health checks e notificações
- ✅ **Confiança**: Pipeline verde em cada push

Este sistema é fundamental para manter a qualidade e confiabilidade da aplicação, permitindo deploys rápidos e seguros.
