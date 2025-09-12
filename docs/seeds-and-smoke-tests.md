# Sistema de Seeds e Smoke Tests

## Visão Geral

O sistema de Seeds e Smoke Tests do Noxora é responsável por:
- **Carregar dados de exemplo** no banco PostgreSQL via Prisma
- **Validar funcionalidades principais** através de testes automatizados
- **Garantir qualidade** do sistema antes de deploy

## Arquivo seeds.json

### Estrutura dos Dados

```json
{
  "tenants": [
    { 
      "id": "tnt_1",
      "name": "Barber Labs",
      "plan": "PRO",
      "status": "TRIALING" 
    }
  ],
  "barbershops": [
    { 
      "id": "shop_1",
      "tenant_id": "tnt_1",
      "slug": "barber-labs-centro",
      "name": "Barber Labs Centro",
      "is_active": true 
    }
  ],
  "employees": [
    { 
      "id": "emp_1",
      "tenant_id": "tnt_1",
      "barbershop_id": "shop_1",
      "name": "Rafa",
      "role": "BARBER",
      "active": true 
    }
  ],
  "services": [
    { 
      "id": "srv_1",
      "tenant_id": "tnt_1",
      "barbershop_id": "shop_1",
      "name": "Corte Masculino",
      "duration_min": 30,
      "price_cents": 4500,
      "is_active": true 
    }
  ],
  "clients": [
    { 
      "id": "cli_1",
      "tenant_id": "tnt_1",
      "name": "João Silva",
      "phone": "+55 11 90000-0000" 
    }
  ],
  "appointments": [
    { 
      "id": "app_1",
      "tenant_id": "tnt_1",
      "barbershop_id": "shop_1",
      "employee_id": "emp_1",
      "client_id": "cli_1",
      "service_id": "srv_1",
      "status": "CONFIRMED" 
    }
  ]
}
```

### Campos dos Dados

#### Tenant
- `id`: Identificador único do tenant
- `name`: Nome da empresa/organização
- `plan`: Plano de assinatura (STARTER, PRO, SCALE)
- `status`: Status da conta (ACTIVE, PAST_DUE, CANCELED, TRIALING)

#### Barbershop
- `id`: Identificador único da barbearia
- `tenant_id`: Referência ao tenant
- `slug`: URL amigável da barbearia
- `name`: Nome da barbearia
- `is_active`: Se está ativa

#### Employee
- `id`: Identificador único do funcionário
- `tenant_id`: Referência ao tenant
- `barbershop_id`: Referência à barbearia
- `name`: Nome do funcionário
- `role`: Função (OWNER, MANAGER, BARBER, ASSISTANT)
- `active`: Se está ativo

#### Service
- `id`: Identificador único do serviço
- `tenant_id`: Referência ao tenant
- `barbershop_id`: Referência à barbearia
- `name`: Nome do serviço
- `duration_min`: Duração em minutos
- `price_cents`: Preço em centavos
- `is_active`: Se está ativo

#### Client
- `id`: Identificador único do cliente
- `tenant_id`: Referência ao tenant
- `name`: Nome do cliente
- `phone`: Telefone de contato

#### Appointment
- `id`: Identificador único do agendamento
- `tenant_id`: Referência ao tenant
- `barbershop_id`: Referência à barbearia
- `employee_id`: Referência ao funcionário
- `client_id`: Referência ao cliente
- `service_id`: Referência ao serviço
- `status`: Status do agendamento

## Scripts Disponíveis

### 1. Seed do Banco (Prisma)

```bash
npm run seed:prisma
```

**Funcionalidades:**
- ✅ Carrega dados do `seeds.json` no PostgreSQL
- ✅ Usa Prisma ORM para inserção segura
- ✅ Implementa `upsert` para evitar duplicatas
- ✅ Adiciona timestamps automáticos
- ✅ Valida relacionamentos entre entidades

**Saída esperada:**
```
🚀 Iniciando seed do banco de dados...
📝 Inserindo tenant...
✅ Tenant inserido: Barber Labs
📝 Inserindo barbershop...
✅ Barbershop inserida: Barber Labs Centro
📝 Inserindo employee...
✅ Employee inserido: Rafa
📝 Inserindo service...
✅ Service inserido: Corte Masculino
📝 Inserindo client...
✅ Client inserido: João Silva
📝 Inserindo appointment...
✅ Appointment inserido: app_1
```

### 2. Smoke Tests

```bash
npm run smoke:test
```

**Testes executados:**

#### Health Check
- ✅ `GET /api/health` retorna 200
- ✅ Valida se a API está respondendo

#### Barbershop Público
- ✅ `GET /api/barbershop/public/{slug}` retorna dados
- ✅ Headers de cache configurados
- ✅ Dados estruturados corretamente

#### CRUD de Services
- ✅ `POST /api/services` cria serviço autenticado
- ✅ `GET /api/services` lista serviços
- ✅ `PUT /api/services/{id}` atualiza serviço
- ✅ `DELETE /api/services/{id}` remove serviço

#### Booking de Appointments
- ✅ Criação de appointment bem-sucedida
- ✅ `POST /api/appointments` com duplicata retorna 409
- ✅ Validação de conflitos de horário

#### Validação de Cache
- ✅ Primeira requisição é MISS (do banco)
- ✅ Segunda requisição é HIT (do cache)
- ✅ Headers de CDN configurados

#### Locks Otimistas
- ✅ Requisições simultâneas processadas
- ✅ Pelo menos uma requisição com sucesso
- ✅ Pelo menos uma requisição com conflito

### 3. Setup Completo

```bash
npm run setup:complete
```

**Funcionalidades:**
- ✅ Executa seed do banco
- ✅ Aguarda processamento
- ✅ Executa todos os smoke tests
- ✅ Relatório completo de resultados

## Configuração

### Variáveis de Ambiente

```bash
# URL do banco PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/noxora"

# URL base da aplicação (para smoke tests)
BASE_URL="http://localhost:3000"

# Timeout dos testes (em ms)
TEST_TIMEOUT=10000
```

### Dependências

```json
{
  "dependencies": {
    "@prisma/client": "^6.14.0",
    "axios": "^1.0.0"
  }
}
```

## Estrutura de Arquivos

```
scripts/
├── seed-prisma.js          # Script de seed para Prisma
├── smoke-tests.js          # Script de smoke tests
├── setup-and-test.js       # Script completo de setup
└── seeds.json              # Dados de exemplo

docs/
└── seeds-and-smoke-tests.md # Esta documentação
```

## Casos de Uso

### 1. Desenvolvimento Local

```bash
# 1. Configurar banco
npm run db:prisma:migrate

# 2. Executar setup completo
npm run setup:complete

# 3. Verificar resultados
npm run smoke:test
```

### 2. CI/CD Pipeline

```bash
# 1. Build da aplicação
npm run build

# 2. Executar smoke tests
npm run smoke:test

# 3. Deploy se testes passarem
```

### 3. Debug de Problemas

```bash
# 1. Verificar dados no banco
npm run db:prisma:studio

# 2. Executar testes específicos
node scripts/smoke-tests.js

# 3. Verificar logs da aplicação
npm run dev
```

## Troubleshooting

### Problemas Comuns

#### 1. Erro de Conexão com Banco

```bash
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solução:**
- Verificar se PostgreSQL está rodando
- Verificar `DATABASE_URL` no `.env.local`
- Executar `docker-compose up -d` se usando Docker

#### 2. Erro de Migração

```bash
Error: P1001: Can't reach database server
```

**Solução:**
- Verificar conectividade com banco
- Executar `npm run db:prisma:migrate`
- Verificar permissões do usuário

#### 3. Testes Falhando

```bash
❌ Alguns testes falharam
```

**Solução:**
- Verificar se aplicação está rodando (`npm run dev`)
- Verificar logs de erro específicos
- Executar testes individualmente para debug

### Logs e Debug

#### Verbose Mode

```bash
# Habilitar logs detalhados
DEBUG=* npm run smoke:test
```

#### Teste Individual

```bash
# Testar apenas health check
node -e "
const { testHealth } = require('./scripts/smoke-tests');
testHealth().then(console.log);
"
```

## Monitoramento

### Métricas de Sucesso

- **Taxa de Sucesso**: % de testes passando
- **Tempo de Execução**: Duração total dos testes
- **Cobertura**: Funcionalidades testadas

### Alertas

- ❌ Testes falhando
- ⚠️ Tempo de resposta alto
- 🔴 Erros de conectividade

## Próximos Passos

### Melhorias Planejadas

1. **Testes de Performance**
   - Load testing com múltiplas requisições
   - Métricas de tempo de resposta
   - Testes de concorrência

2. **Testes de Integração**
   - Testes com Redis
   - Testes com Stripe (webhooks)
   - Testes de notificações

3. **Automação Avançada**
   - Execução automática em CI/CD
   - Relatórios detalhados
   - Notificações de falha

### Contribuição

Para contribuir com melhorias:

1. Fork do repositório
2. Criar branch para feature
3. Implementar melhorias
4. Adicionar testes
5. Submeter pull request

## Conclusão

O sistema de Seeds e Smoke Tests garante que:

- ✅ **Dados de exemplo** estão sempre disponíveis
- ✅ **Funcionalidades principais** funcionam corretamente
- ✅ **Qualidade** é mantida em cada deploy
- ✅ **Debug** é facilitado com dados consistentes
- ✅ **CI/CD** pode validar o sistema automaticamente

Este sistema é fundamental para o desenvolvimento e manutenção do Noxora, garantindo estabilidade e confiabilidade.
