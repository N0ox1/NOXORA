# 🚀 Sistema de Cache e CDN - Noxora

## 📋 Visão Geral

O Noxora implementa um **sistema de cache Redis robusto** com estratégias read-through, write-through e write-behind, além de headers de CDN otimizados para máxima performance e escalabilidade.

## 🎯 Características Principais

### **Cache Read-Through**
- **Primeira requisição**: MISS → busca no banco → armazena no cache
- **Requisições subsequentes**: HIT → retorna do cache
- **TTL configurável**: Diferentes tempos para diferentes tipos de dados
- **Chaves estruturadas**: `{prefix}:{tenantId}:{identifier}`

### **Headers de CDN Otimizados**
- **s-maxage=60**: Cache público por 60 segundos
- **stale-while-revalidate=120**: Permite servir conteúdo desatualizado por 2 minutos
- **Vary: X-Tenant-Id**: Cache isolado por tenant
- **Cache-Control**: Headers padrão para diferentes cenários

### **Estratégias de Cache**
- **Read-Through**: Cache automático em leituras
- **Write-Through**: Cache atualizado imediatamente em escritas
- **Write-Behind**: Cache atualizado em background (assíncrono)
- **Invalidação Inteligente**: Remove cache relacionado automaticamente

## 🏗️ Arquitetura

### **Estrutura de Chaves**
```
bs:{tenantId}:{slug}          # Barbearias (60s)
srv:{tenantId}:{serviceId}    # Serviços (120s)
emp:{tenantId}:{employeeId}   # Funcionários (180s)
cli:{tenantId}:{clientId}     # Clientes (300s)
apt:{tenantId}:{appointmentId} # Agendamentos (30s)
tnt:{tenantId}                # Informações do tenant (600s)
```

### **TTL por Tipo de Dado**
```typescript
TTL: {
  PUBLIC_ROUTES: 60,    // 60 segundos para rotas públicas
  BARBERSHOP: 60,       // 60 segundos para dados de barbearia
  SERVICES: 120,         // 2 minutos para serviços
  EMPLOYEES: 180,        // 3 minutos para funcionários
  CLIENTS: 300,          // 5 minutos para clientes
  APPOINTMENTS: 30,      // 30 segundos para agendamentos
  TENANT_INFO: 600,      // 10 minutos para informações do tenant
}
```

## 🚀 Uso Rápido

### **Cache Read-Through Automático**
```typescript
import { cacheService, CacheService, CACHE_CONFIG } from '@/lib/redis';

// Cache automático em rotas GET
const cacheResult = await cacheService.readThrough(
  CacheService.generateKey('srv', tenantId, 'list'),
  async () => {
    // Função que busca dados do banco
    return await database.getServices(tenantId);
  },
  CACHE_CONFIG.TTL.SERVICES
);

// Resultado inclui origem dos dados
console.log(cacheResult.source); // 'cache' ou 'database'
```

### **Headers de CDN Automáticos**
```typescript
import { getCDNHeaders } from '@/lib/redis';

// Headers para rotas públicas
const response = NextResponse.json(data);
const cdnHeaders = getCDNHeaders(CACHE_CONFIG.TTL.SERVICES);

Object.entries(cdnHeaders).forEach(([key, value]) => {
  response.headers.set(key, value);
});
```

### **Invalidação de Cache**
```typescript
// Invalidar cache relacionado após operações de escrita
await cacheService.invalidateRelated(tenantId, 'service');

// Invalidar cache específico
await cacheService.delByPattern(`srv:${tenantId}:*`);
```

## 📊 Monitoramento e Métricas

### **Estatísticas do Cache**
```typescript
const stats = await cacheService.getStats();
console.log({
  totalKeys: stats.totalKeys,
  memoryUsage: stats.memoryUsage,
  hitRate: stats.hitRate,
  keysByPrefix: stats.keysByPrefix,
});
```

### **Headers de Debug**
- **X-Cache-Source**: Origem dos dados (cache/database/miss)
- **X-Cache-Key**: Chave utilizada no cache
- **X-Cache-TTL**: TTL restante da chave

## 🧪 Testando o Sistema

### **Script de Teste Automático**
```bash
# Testar todo o sistema de cache
npm run cache:test

# Testar rota específica
curl -H "X-Tenant-Id: tenant_1" http://localhost:3000/api/cache/test
```

### **Testes Incluídos**
1. **Cache Read-Through**: Primeira requisição MISS, segunda HIT
2. **Diferentes Tipos**: Serviços, funcionários, clientes
3. **Invalidação**: Cache removido após operações de escrita
4. **Operações**: Set, get, del, invalidate, clear
5. **Headers CDN**: Verificação de headers de cache

### **Exemplo de Teste Manual**
```bash
# Primeira requisição (MISS)
curl -H "X-Tenant-Id: tenant_1" http://localhost:3000/api/services

# Segunda requisição (HIT)
curl -H "X-Tenant-Id: tenant_1" http://localhost:3000/api/services

# Verificar headers de cache
curl -I -H "X-Tenant-Id: tenant_1" http://localhost:3000/api/services
```

## ⚙️ Configuração

### **Variáveis de Ambiente**
```bash
# Redis
REDIS_URL=redis://localhost:6379

# Configurações de cache (opcional)
CACHE_TTL_PUBLIC=60
CACHE_TTL_SERVICES=120
CACHE_TTL_EMPLOYEES=180
```

### **Personalização de TTL**
```typescript
// TTL personalizado para rota específica
const cacheResult = await cacheService.readThrough(
  key,
  fetchFunction,
  300 // 5 minutos personalizados
);

// Headers de CDN personalizados
const cdnHeaders = getCDNHeaders(300);
```

## 🔧 Operações Avançadas

### **Cache Write-Through**
```typescript
// Atualizar cache imediatamente
await cacheService.writeThrough(key, data, ttl);
```

### **Cache Write-Behind**
```typescript
// Atualizar cache em background
await cacheService.writeBehind(key, data, ttl);
```

### **Invalidação por Padrão**
```typescript
// Remover todas as chaves de um tipo
await cacheService.delByPattern(`srv:${tenantId}:*`);

// Remover múltiplas chaves
await cacheService.delMultiple([key1, key2, key3]);
```

### **Renovação de TTL**
```typescript
// Renovar TTL de uma chave
await cacheService.renewTTL(key, newTTL);

// Verificar TTL restante
const ttl = await cacheService.getTTL(key);
```

## 🚨 Tratamento de Erros

### **Fallback Automático**
- Se o Redis falhar, o sistema continua funcionando
- Dados são buscados diretamente do banco
- Logs de erro são registrados para monitoramento

### **Recuperação**
```typescript
try {
  const data = await cacheService.get(key);
  return data;
} catch (error) {
  console.error('Erro no cache, buscando do banco:', error);
  // Fallback para banco de dados
  return await fetchFromDatabase();
}
```

## 📈 Performance e Escalabilidade

### **Benefícios**
- **Latência reduzida**: Respostas em milissegundos
- **Throughput aumentado**: Mais requisições por segundo
- **Carga reduzida no banco**: Menos consultas desnecessárias
- **Escalabilidade**: Suporte a múltiplas instâncias

### **Métricas de Performance**
- **Hit Rate**: Porcentagem de requisições servidas do cache
- **Latência**: Tempo de resposta com e sem cache
- **Throughput**: Requisições por segundo suportadas
- **Uso de memória**: Consumo de RAM do Redis

## 🔒 Segurança

### **Isolamento por Tenant**
- Chaves de cache incluem `tenantId`
- Cache isolado entre diferentes organizações
- Headers `Vary: X-Tenant-Id` para isolamento de CDN

### **Validação de Dados**
- Dados são validados antes de serem armazenados
- TTL máximo para evitar acúmulo de dados
- Limpeza automática de chaves expiradas

## 🚀 Deploy e Produção

### **Redis em Produção**
- **Redis Cluster**: Para alta disponibilidade
- **Redis Sentinel**: Para failover automático
- **Redis Enterprise**: Para recursos avançados

### **CDN em Produção**
- **Cloudflare**: Headers otimizados automaticamente
- **AWS CloudFront**: Configuração de cache edge
- **Vercel Edge**: Cache global automático

### **Monitoramento**
- **Redis INFO**: Métricas de memória e performance
- **Logs estruturados**: Rastreamento de operações
- **Alertas**: Notificações de falhas

## 📚 Referências

### **Documentação Relacionada**
- [Sistema Multi-Tenant](multi-tenant.md)
- [Sistema de Autenticação](authentication.md)
- [Banco de Dados e RLS](database-rls.md)

### **Comandos Úteis**
```bash
# Testar sistema de cache
npm run cache:test

# Verificar status do Redis
redis-cli ping

# Monitorar operações Redis
redis-cli monitor

# Limpar todo o cache
redis-cli flushall
```

### **Troubleshooting**
- **Cache não funcionando**: Verificar conexão Redis
- **TTL incorreto**: Verificar configurações de cache
- **Headers faltando**: Verificar implementação de rotas
- **Performance baixa**: Verificar hit rate e configurações

---

## ✅ Checklist de Implementação

- [x] **Cache Read-Through**: Implementado em rotas públicas
- [x] **Chaves Estruturadas**: Formato `{prefix}:{tenantId}:{identifier}`
- [x] **TTL Configurável**: Diferentes tempos por tipo de dado
- [x] **Headers CDN**: s-maxage=60, stale-while-revalidate=120
- [x] **Invalidação Automática**: Cache removido após operações de escrita
- [x] **Isolamento por Tenant**: Cache isolado entre organizações
- [x] **Fallback Automático**: Sistema funciona mesmo com Redis indisponível
- [x] **Monitoramento**: Headers de debug e estatísticas
- [x] **Testes Automatizados**: Scripts de validação completos
- [x] **Documentação**: Guia completo de uso e configuração

O sistema de cache está **100% implementado** e pronto para produção! 🎉
