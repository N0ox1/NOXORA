# Seed com Auditoria - Noxora

## Visão Geral

O sistema de seed com auditoria do Noxora permite inserir dados de exemplo no banco de dados enquanto registra automaticamente todas as ações no sistema de auditoria. Isso é útil para:

- **Desenvolvimento**: Testar funcionalidades com dados realistas
- **Demonstração**: Mostrar o sistema funcionando com dados de exemplo
- **Testes**: Validar o sistema de auditoria com dados conhecidos
- **Treinamento**: Permitir que usuários explorem o sistema com dados seguros

## Arquivo seeds.json

O arquivo `seeds.json` contém os dados de exemplo que serão inseridos:

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

## Scripts Disponíveis

### 1. Seed via Node.js (Recomendado)

```bash
npm run seed:audit
```

**Características:**
- ✅ Usa o sistema de auditoria nativo
- ✅ Validação de dados
- ✅ Tratamento de erros robusto
- ✅ Logs detalhados no console
- ✅ Integração completa com o sistema

**Saída esperada:**
```
🚀 Iniciando seed com auditoria...
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
📝 Registrando confirmação do appointment...
✅ Confirmação do appointment registrada

📊 Resumo dos dados inseridos:
   • Tenants: 1
   • Barbershops: 1
   • Employees: 1
   • Services: 1
   • Clients: 1
   • Appointments: 1

🎉 Seed com auditoria concluído com sucesso!
🔍 Verifique os logs de auditoria em: http://localhost:3000/audit
```

### 2. Seed via SQL Direto

```bash
npm run seed:sql
```

**Características:**
- ✅ Execução direta no banco
- ✅ Mais rápido para grandes volumes
- ✅ Logs de auditoria em SQL
- ✅ Controle total sobre a execução

**Requisitos:**
- `psql` instalado e configurado
- `DATABASE_URL` configurada
- Tabela `audit_logs` criada

### 3. Seed via PowerShell (Windows)

```bash
npm run seed:audit:ps1
```

**Características:**
- ✅ Interface amigável para Windows
- ✅ Execução do script Node.js
- ✅ Verificação de variáveis de ambiente
- ✅ Instruções claras de uso

## Logs de Auditoria Gerados

### 1. Criação de Tenant
```json
{
  "id": "audit_seed_tenant_001",
  "tenant_id": "tnt_1",
  "actor_id": "system",
  "action": "CREATE",
  "entity": "tenant",
  "entity_id": "tnt_1",
  "actor_type": "system",
  "actor_name": "Sistema de Seed",
  "severity": "MEDIUM",
  "status": "SUCCESS",
  "changes": [
    {"field": "name", "old_value": null, "new_value": "Barber Labs"},
    {"field": "plan", "old_value": null, "new_value": "PRO"},
    {"field": "status", "old_value": null, "new_value": "TRIALING"}
  ],
  "metadata": {"source": "seed_script", "priority": "medium"}
}
```

### 2. Criação de Barbershop
```json
{
  "id": "audit_seed_barbershop_001",
  "tenant_id": "tnt_1",
  "actor_id": "system",
  "action": "CREATE",
  "entity": "barbershop",
  "entity_id": "shop_1",
  "actor_type": "system",
  "actor_name": "Sistema de Seed",
  "severity": "MEDIUM",
  "status": "SUCCESS",
  "changes": [
    {"field": "name", "old_value": null, "new_value": "Barber Labs Centro"},
    {"field": "slug", "old_value": null, "new_value": "barber-labs-centro"},
    {"field": "is_active", "old_value": null, "new_value": true}
  ],
  "metadata": {"source": "seed_script", "priority": "medium"}
}
```

### 3. Confirmação de Appointment
```json
{
  "id": "audit_seed_appointment_confirm_001",
  "tenant_id": "tnt_1",
  "actor_id": "system",
  "action": "UPDATE",
  "entity": "appointment",
  "entity_id": "app_1",
  "actor_type": "system",
  "actor_name": "Sistema de Seed",
  "severity": "MEDIUM",
  "status": "SUCCESS",
  "changes": [
    {"field": "status", "old_value": "PENDING", "new_value": "CONFIRMED"}
  ],
  "metadata": {
    "source": "seed_script",
    "priority": "medium",
    "action_type": "confirmation"
  }
}
```

## Verificação dos Resultados

### 1. Dashboard de Auditoria
Acesse `http://localhost:3000/audit` para ver:
- Estatísticas dos logs criados
- Filtros por entidade e ação
- Visualização detalhada dos logs

### 2. APIs de Auditoria
```bash
# Buscar logs do tenant
curl "http://localhost:3000/api/audit/logs?tenant_id=tnt_1"

# Estatísticas do tenant
curl "http://localhost:3000/api/audit/stats?tenant_id=tnt_1"

# Logs específicos de criação
curl "http://localhost:3000/api/audit/logs?tenant_id=tnt_1&action=CREATE"
```

### 3. Drizzle Studio
```bash
npm run db:studio
```
Visualize diretamente no banco:
- Tabelas populadas
- Logs de auditoria
- Relacionamentos entre entidades

## Personalização

### 1. Adicionar Novos Dados
Edite o `seeds.json` para incluir mais entidades:

```json
{
  "tenants": [
    { "id": "tnt_1", "name": "Barber Labs", "plan": "PRO", "status": "TRIALING" },
    { "id": "tnt_2", "name": "Corte & Cia", "plan": "BASIC", "status": "ACTIVE" }
  ]
}
```

### 2. Modificar Script de Auditoria
Edite `scripts/seed-with-audit.js` para:
- Adicionar novos campos de auditoria
- Modificar a severidade dos logs
- Incluir metadados personalizados

### 3. Criar Scripts Específicos
```javascript
// scripts/seed-tenants-only.js
async function seedTenantsOnly() {
  // Lógica específica para tenants
}
```

## Troubleshooting

### Problemas Comuns

#### 1. Erro de Conexão com Banco
```bash
❌ Erro durante o seed: connect ECONNREFUSED
```
**Solução:**
- Verificar se o banco está rodando
- Verificar `DATABASE_URL` no `.env`
- Executar `npm run docker:up` se usar Docker

#### 2. Tabela audit_logs não existe
```bash
❌ relation "audit_logs" does not exist
```
**Solução:**
- Executar `npm run audit:setup` primeiro
- Verificar se as migrações foram aplicadas

#### 3. Erro de Permissão
```bash
❌ permission denied for table tenants
```
**Solução:**
- Verificar permissões do usuário do banco
- Executar `npm run db:rls` para aplicar RLS

### Logs de Debug

Para habilitar logs detalhados:

```bash
# Windows
set DEBUG=audit:*
npm run seed:audit

# Linux/Mac
DEBUG=audit:* npm run seed:audit
```

## Integração com CI/CD

### 1. GitHub Actions
```yaml
- name: Seed Database
  run: |
    npm run seed:audit
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### 2. Docker
```dockerfile
COPY scripts/seed-with-audit.js /app/scripts/
RUN npm run seed:audit
```

### 3. Scripts de Deploy
```bash
#!/bin/bash
npm run audit:setup
npm run seed:audit
npm run audit:test
```

## Conclusão

O sistema de seed com auditoria do Noxora fornece uma maneira robusta e rastreável de popular o banco de dados com dados de exemplo. Todos os dados inseridos são automaticamente registrados no sistema de auditoria, permitindo rastreabilidade completa e conformidade com regulamentações.

Para mais informações, consulte:
- [README-AUDIT.md](README-AUDIT.md) - Guia rápido de auditoria
- [docs/audit.md](docs/audit.md) - Documentação completa de auditoria
- [scripts/seed-with-audit.js](scripts/seed-with-audit.js) - Script principal de seed
