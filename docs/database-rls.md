# 🗄️ Banco de Dados e Row Level Security (RLS)

## 📋 Visão Geral

Este documento descreve a implementação do banco de dados PostgreSQL com Row Level Security (RLS) para garantir isolamento completo entre tenants no sistema Noxora.

## 🏗️ Arquitetura do Banco

### Schema Prisma
- **Arquivo**: `prisma/schema.prisma`
- **ORM**: Prisma Client v6.14.0
- **Banco**: PostgreSQL

### Tabelas Principais
1. **`tenants`** - Isolamento multi-tenant
2. **`barbershops`** - Barbearias por tenant
3. **`employees`** - Funcionários por barbearia
4. **`services`** - Serviços oferecidos
5. **`clients`** - Clientes por tenant
6. **`appointments`** - Agendamentos
7. **`audit_logs`** - Logs de auditoria

## 🔒 Row Level Security (RLS)

### Políticas Implementadas

#### Para todas as tabelas:
- **SELECT**: Apenas dados do tenant atual
- **INSERT**: Apenas com tenant_id correto
- **UPDATE**: Apenas dados do tenant atual
- **DELETE**: Apenas dados do tenant atual

### Funções de Controle
```sql
-- Definir tenant_id da sessão
SELECT set_tenant_id('tenant_123');

-- Obter tenant_id atual
SELECT get_current_tenant_id();
```

## 📊 Índices de Performance

### Índices Compostos
- `(tenant_id, slug)` em `barbershops`
- `(tenant_id, barbershop_id, start_at)` em `appointments`

### Índices Simples
- `tenant_id` em todas as tabelas
- `start_at` em `appointments`
- `status` em `appointments`
- `is_active` em tabelas relevantes

## 🚀 Scripts Disponíveis

### Configuração RLS
```bash
# Aplicar políticas RLS
npm run db:rls

# Aplicar índices de performance
npm run db:indices

# Testar isolamento por tenant
npm run db:test-rls
```

### Prisma
```bash
# Gerar cliente Prisma
npm run db:prisma:generate

# Aplicar migrações
npm run db:prisma:migrate

# Abrir Prisma Studio
npm run db:prisma:studio
```

### Drizzle (ORIGINAL)
```bash
# Migrações Drizzle
npm run db:migrate
npm run db:generate
npm run db:push
```

## 🧪 Testando o Sistema

### Script de Teste RLS
Execute `scripts/test-rls.sql` para verificar:

1. **Isolamento por Tenant**
   - Dados do tenant_1 não são visíveis para tenant_2
   - Cada tenant só vê seus próprios dados

2. **Políticas de Segurança**
   - Tentativas de acesso cruzado são bloqueadas
   - Inserções respeitam o tenant_id da sessão

3. **Performance dos Índices**
   - Consultas são otimizadas por tenant
   - Buscas por slug e datas são rápidas

### Exemplo de Teste
```sql
-- Configurar tenant_1
SELECT set_tenant_id('tenant_1');

-- Inserir dados
INSERT INTO barbershops (id, tenant_id, slug, name) 
VALUES ('shop_1', 'tenant_1', 'barbearia-1', 'Barbearia 1');

-- Verificar isolamento
SELECT * FROM barbershops; -- Só mostra dados do tenant_1

-- Mudar para tenant_2
SELECT set_tenant_id('tenant_2');

-- Verificar isolamento
SELECT * FROM barbershops; -- Só mostra dados do tenant_2
```

## 🔧 Configuração do Ambiente

### Variáveis de Ambiente
```env
DATABASE_URL="postgresql://user:password@localhost:5432/noxora?schema=public"
```

### Conexão com Banco
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Exemplo de uso com tenant
await prisma.$executeRaw`SELECT set_tenant_id(${tenantId})`;
const barbershops = await prisma.barbershop.findMany();
```

## 📈 Monitoramento e Performance

### Verificar Políticas RLS
```sql
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
```

### Verificar Índices
```sql
SELECT tablename, indexname, indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND indexname LIKE 'idx_%';
```

### Verificar RLS Habilitado
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

## 🚨 Troubleshooting

### Problemas Comuns

#### 1. Erro de Tenant não Configurado
```sql
-- Solução: Configurar tenant_id antes das consultas
SELECT set_tenant_id('seu_tenant_id');
```

#### 2. Políticas RLS não Aplicadas
```bash
# Verificar se o script foi executado
npm run db:rls
npm run db:indices
```

#### 3. Performance Lenta
```bash
# Verificar se os índices foram criados
npm run db:indices
```

### Logs de Erro
- Verificar logs do PostgreSQL
- Usar `EXPLAIN ANALYZE` para consultas lentas
- Monitorar uso de índices

## 🔄 Migrações e Atualizações

### Nova Migração Prisma
```bash
# Criar nova migração
npx prisma migrate dev --create-only --name nome_da_migracao

# Aplicar migração
npx prisma migrate deploy
```

### Atualizar Schema
```bash
# Regenerar cliente após mudanças
npx prisma generate
```

## 📚 Recursos Adicionais

### Documentação Prisma
- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Prisma Studio](https://www.prisma.io/docs/concepts/components/prisma-studio)

### PostgreSQL RLS
- [Row Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Security Policies](https://www.postgresql.org/docs/current/sql-createpolicy.html)

### Performance
- [PostgreSQL Indexes](https://www.postgresql.org/docs/current/indexes.html)
- [Query Planning](https://www.postgresql.org/docs/current/using-explain.html)

## ✅ Checklist de Implementação

- [x] Schema Prisma criado
- [x] Políticas RLS implementadas
- [x] Índices de performance criados
- [x] Funções de controle de tenant
- [x] Scripts de teste criados
- [x] Documentação completa
- [x] Cliente Prisma gerado
- [x] Scripts npm configurados

## 🎯 Próximos Passos

1. **Testar em ambiente de desenvolvimento**
2. **Configurar banco de produção**
3. **Implementar backup automático**
4. **Monitorar performance em produção**
5. **Documentar procedimentos de manutenção**
