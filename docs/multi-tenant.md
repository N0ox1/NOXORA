# 🏢 Sistema Multi-Tenant - Noxora

## 📋 Visão Geral

O Noxora implementa um **sistema multi-tenant robusto** que garante isolamento completo entre diferentes organizações (tenants). Cada tenant tem seus próprios dados, configurações e limites, com validação automática em todas as operações.

## 🚀 Características Principais

### **Isolamento Completo**
- **Dados isolados**: Cada tenant só acessa seus próprios dados
- **Configurações independentes**: Personalização por organização
- **Limites por plano**: Controle de recursos baseado no plano contratado

### **Múltiplas Estratégias de Resolução**
- **Header X-Tenant-Id**: Identificação direta via header HTTP
- **Subdomínio**: Resolução automática por subdomínio (ex: `tenant1.noxora.com`)
- **Domínio customizado**: Suporte a domínios próprios (ex: `barbearia.com`)

### **Validação Automática**
- **DTOs Zod**: Validação obrigatória de `tenant_id` em todas as operações
- **Verificação de acesso**: Bloqueio de tentativas de cross-tenant access
- **Middleware global**: Validação automática em todas as rotas da API

## 🏗️ Arquitetura

### **Camadas de Segurança**

```
┌─────────────────────────────────────┐
│           API Routes                │
├─────────────────────────────────────┤
│        Middleware Global            │
│    ┌─────────────────────────────┐  │
│    │     requireTenant()         │  │
│    │   Validação de Tenant       │  │
│    └─────────────────────────────┘  │
├─────────────────────────────────────┤
│        DTOs Zod                    │
│    ┌─────────────────────────────┐  │
│    │   Validação tenant_id       │  │
│    │   Validação de Dados        │  │
│    └─────────────────────────────┘  │
├─────────────────────────────────────┤
│        TenantService               │
│    ┌─────────────────────────────┐  │
│    │   Resolução de Tenant       │  │
│    │   Validação de Acesso       │  │
│    │   Controle de Limites       │  │
│    └─────────────────────────────┘  │
├─────────────────────────────────────┤
│        Database + RLS              │
│    ┌─────────────────────────────┐  │
│    │   Isolamento por tenant_id  │  │
│    │   Políticas de Segurança    │  │
│    └─────────────────────────────┘  │
└─────────────────────────────────────┘
```

### **Fluxo de Validação**

1. **Requisição chega** → Middleware global intercepta
2. **Resolução de tenant** → `TenantService.resolveTenant()`
3. **Validação de status** → Verifica se tenant está ativo
4. **DTO validation** → Valida `tenant_id` nos dados
5. **Verificação de acesso** → Confirma isolamento
6. **Processamento** → Executa operação se tudo estiver válido

## 📚 Uso da API

### **Identificação de Tenant**

#### Via Header (Recomendado)
```bash
curl -H "X-Tenant-Id: tenant_1" \
     -H "Content-Type: application/json" \
     http://localhost:3000/api/services
```

#### Via Subdomínio
```bash
curl -H "Content-Type: application/json" \
     http://tenant1.localhost:3000/api/services
```

#### Via Domínio Customizado
```bash
curl -H "Content-Type: application/json" \
     http://barbearia.com/api/services
```

### **Criação de Recursos**

Todos os DTOs exigem `tenant_id`:

```json
{
  "tenant_id": "tenant_1",
  "name": "Corte Masculino",
  "description": "Corte tradicional",
  "duration_min": 30,
  "price_cents": 4500,
  "barbershop_id": "shop_1"
}
```

### **Respostas da API**

```json
{
  "success": true,
  "data": [...],
  "tenant": {
    "id": "tenant_1",
    "name": "Barber Labs",
    "plan": "PRO"
  }
}
```

## 🔧 Configuração

### **Variáveis de Ambiente**

```bash
# Configuração de tenant (opcional)
TENANT_DEFAULT_ID=tenant_1
TENANT_DEFAULT_DOMAIN=localhost
```

### **Planos e Limites**

```typescript
const planLimits = {
  STARTER: { 
    barbershops: 1, 
    employees: 3, 
    clients: 100, 
    appointments: 1000, 
    storage: 100 
  },
  PRO: { 
    barbershops: 5, 
    employees: 20, 
    clients: 1000, 
    appointments: 10000, 
    storage: 500 
  },
  SCALE: { 
    barbershops: 20, 
    employees: 100, 
    clients: 10000, 
    appointments: 100000, 
    storage: 2000 
  }
};
```

## 🧪 Testes

### **Executar Testes Automáticos**

```bash
# Testar sistema multi-tenant
npm run tenant:test

# Testar sistema de autenticação
npm run auth:test

# Testar sistema de auditoria
npm run audit:test
```

### **Testes Manuais**

#### 1. Teste de Resolução por Header
```bash
curl -H "X-Tenant-Id: tenant_1" \
     http://localhost:3000/api/tenant/test
```

#### 2. Teste de Bloqueio sem Tenant
```bash
curl http://localhost:3000/api/services
# Deve retornar 400 com erro de tenant não identificado
```

#### 3. Teste de Validação de DTO
```bash
curl -X POST \
     -H "X-Tenant-Id: tenant_1" \
     -H "Content-Type: application/json" \
     -d '{"name":"Teste"}' \
     http://localhost:3000/api/services
# Deve retornar 400 com erro de tenant_id obrigatório
```

#### 4. Teste de Cross-Tenant Access
```bash
curl -H "X-Tenant-Id: tenant_1" \
     -X POST \
     -H "Content-Type: application/json" \
     -d '{"tenant_id":"tenant_2","name":"Teste"}' \
     http://localhost:3000/api/services
# Deve retornar 403 com erro de acesso negado
```

## 📊 Monitoramento

### **Headers de Resposta**

```http
X-Tenant-Id: tenant_1
X-Tenant-Name: Barber Labs
X-Tenant-Plan: PRO
```

### **Logs de Auditoria**

Todas as operações são automaticamente registradas com:
- `tenant_id` da operação
- Usuário que executou
- Recurso acessado
- Timestamp da operação

## 🚨 Tratamento de Erros

### **Códigos de Status**

- **400**: Tenant não identificado ou dados inválidos
- **403**: Acesso negado (tenant inativo ou cross-tenant)
- **500**: Erro interno do servidor

### **Mensagens de Erro**

```json
{
  "error": "Tenant não identificado. Forneça X-Tenant-Id ou use subdomínio válido."
}

{
  "error": "Acesso negado: tenant_id não corresponde ao tenant autenticado"
}

{
  "error": "Tenant inativo ou suspenso"
}
```

## 🔒 Segurança

### **Proteções Implementadas**

1. **Validação de Tenant**: Todas as requisições são validadas
2. **Isolamento de Dados**: RLS no banco + validação na aplicação
3. **Verificação de Acesso**: Middleware global + DTOs
4. **Auditoria Completa**: Log de todas as operações
5. **Rate Limiting**: Por tenant para prevenir abuso

### **Boas Práticas**

- ✅ Sempre incluir `X-Tenant-Id` em requisições
- ✅ Validar `tenant_id` em todos os DTOs
- ✅ Usar HTTPS em produção
- ✅ Implementar rotação de tokens
- ✅ Monitorar tentativas de cross-tenant access

## 📈 Performance

### **Otimizações**

- **Cache de Tenant**: Resolução em memória para tenants ativos
- **Índices Otimizados**: Por `tenant_id` em todas as tabelas
- **Validação Early**: Bloqueio rápido de requisições inválidas
- **Lazy Loading**: Configurações carregadas sob demanda

### **Métricas Recomendadas**

- Tempo de resolução de tenant
- Taxa de requisições bloqueadas
- Uso de recursos por tenant
- Tentativas de cross-tenant access

## 🔄 Migração e Deploy

### **Checklist de Deploy**

- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados com RLS ativo
- [ ] Middleware de tenant funcionando
- [ ] DTOs validando `tenant_id`
- [ ] Testes passando
- [ ] Monitoramento configurado

### **Rollback**

```bash
# Desabilitar middleware de tenant temporariamente
# Comentar requireTenant() no middleware.ts
# Reiniciar aplicação
```

## 📞 Suporte

### **Problemas Comuns**

1. **"Tenant não identificado"**
   - Verificar header `X-Tenant-Id`
   - Confirmar subdomínio/domínio

2. **"Acesso negado"**
   - Verificar se tenant está ativo
   - Confirmar `tenant_id` nos dados

3. **"Dados inválidos"**
   - Verificar se `tenant_id` está presente
   - Validar formato dos dados

### **Debug**

```bash
# Logs detalhados
DEBUG=tenant:* npm run dev

# Teste de conectividade
npm run tenant:test
```

---

**🎯 Sistema Multi-Tenant do Noxora**: Isolamento completo, segurança máxima, performance otimizada.
