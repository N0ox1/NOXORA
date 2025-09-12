# Sistema de API - Noxora

## Visão Geral

O sistema de API do Noxora fornece endpoints públicos e autenticados para gerenciar barbearias, serviços, agendamentos e autenticação. Ele é baseado no arquivo `api.json` e integra com o sistema de autenticação JWT e multi-tenancy existente.

## Estrutura de Arquivos

```
src/
├── types/
│   └── api.ts                    # Tipos e interfaces da API
├── lib/
│   ├── api/
│   │   ├── api-middleware.ts     # Middleware principal da API
│   │   └── index.ts              # Exportações do módulo
│   └── config.ts                 # Configurações da API
├── app/
│   └── api/
│       ├── health/route.ts       # Health check
│       ├── barbershop/
│       │   └── public/
│       │       └── [slug]/
│       │           └── route.ts  # API pública de barbearias
│       ├── services/route.ts     # Gerenciamento de serviços
│       └── appointments/route.ts # Gerenciamento de agendamentos
└── components/
    └── api/
        └── public-barbershop-test.tsx # Componente de teste
```

## Headers Obrigatórios

### X-Tenant-Id
- **Descrição:** Identificador único do tenant
- **Uso:** Obrigatório para APIs que requerem contexto de tenant
- **Exemplo:** `X-Tenant-Id: tenant-123`

### Authorization
- **Descrição:** Token JWT para autenticação
- **Formato:** `Bearer <jwt>`
- **Uso:** Obrigatório para APIs autenticadas
- **Exemplo:** `Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## Endpoints Públicos

### 1. Health Check
```http
GET /api/health
```

**Descrição:** Verifica o status de saúde do sistema

**Resposta:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "stripe": "healthy"
  }
}
```

**Headers de Cache:**
- `s-maxage: 60`
- `stale-while-revalidate: 120`

### 2. Barbearia Pública
```http
GET /api/barbershop/public/{slug}
```

**Descrição:** Obtém informações públicas de uma barbearia

**Parâmetros:**
- `slug` - Identificador único da barbearia

**Resposta:**
```json
{
  "id": "uuid",
  "slug": "barbearia-alfa",
  "name": "Barbearia Alfa",
  "description": "Barbearia tradicional",
  "address": "Rua das Flores, 123",
  "phone": "(11) 99999-9999",
  "email": "contato@barbeariaalfa.com",
  "is_active": true,
  "services": [
    {
      "id": "uuid",
      "name": "Corte Masculino",
      "duration_min": 30,
      "price_cents": 2500,
      "is_active": true
    }
  ],
  "employees": [
    {
      "id": "uuid",
      "name": "João Silva",
      "role": "BARBER",
      "is_active": true
    }
  ]
}
```

## Endpoints Autenticados

### 1. Registro de Usuário
```http
POST /api/auth/register
```

**Descrição:** Registra um novo usuário no sistema

**Body:**
```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "password": "senha123",
  "tenant_id": "tenant-123"
}
```

### 2. Login de Usuário
```http
POST /api/auth/login
```

**Descrição:** Autentica um usuário e retorna tokens JWT

**Body:**
```json
{
  "email": "joao@email.com",
  "password": "senha123",
  "tenant_id": "tenant-123"
}
```

### 3. Criação de Serviços
```http
POST /api/services
```

**Descrição:** Cria um novo serviço (requer permissão SERVICE_CRUD)

**Headers:**
- `X-Tenant-Id: tenant-123`
- `Authorization: Bearer <jwt>`

**Body:**
```json
{
  "name": "Corte Masculino",
  "duration_min": 30,
  "price_cents": 2500,
  "description": "Corte tradicional masculino",
  "is_active": true
}
```

### 4. Criação de Agendamentos
```http
POST /api/appointments
```

**Descrição:** Cria um novo agendamento (requer permissão APPOINTMENT_CRUD)

**Headers:**
- `X-Tenant-Id: tenant-123`
- `Authorization: Bearer <jwt>`

**Body:**
```json
{
  "barbershop_id": "uuid",
  "employee_id": "uuid",
  "client_id": "uuid",
  "service_id": "uuid",
  "start_at": "2024-01-15T14:00:00.000Z",
  "notes": "Cliente preferencial"
}
```

## Middleware de API

### Funcionalidades
1. **Validação de Rotas:** Verifica se a rota e método são válidos
2. **Validação de Headers:** Verifica headers obrigatórios
3. **Autenticação:** Valida tokens JWT
4. **Autorização:** Verifica permissões do usuário
5. **Logging:** Registra todas as requisições e respostas
6. **Headers de Resposta:** Adiciona headers padrão

### Uso
```typescript
import { apiMiddleware } from '@/lib/api';

// Wrapper automático
export const GET = apiMiddleware.withApi(handler);

// Ou uso manual
const middleware = ApiMiddleware.getInstance();
const response = await middleware.handle(request, () => handler(request));
```

## Validação de Rotas

### Mapeamento de Validações
```typescript
export const ROUTE_VALIDATIONS = {
  '/api/health': {
    requiresAuth: false,
    requiresTenant: false,
    allowedMethods: ['GET'],
    rateLimit: { windowMs: 60000, max: 100 }
  },
  '/api/barbershop/public/{slug}': {
    requiresAuth: false,
    requiresTenant: false,
    allowedMethods: ['GET'],
    rateLimit: { windowMs: 60000, max: 60 }
  },
  '/api/services': {
    requiresAuth: true,
    requiresTenant: true,
    allowedMethods: ['POST'],
    permissions: ['SERVICE_CRUD']
  },
  '/api/appointments': {
    requiresAuth: true,
    requiresTenant: true,
    allowedMethods: ['POST'],
    permissions: ['APPOINTMENT_CRUD']
  }
};
```

## Rate Limiting

### Configurações por Endpoint
- **Health Check:** 100 req/min
- **Barbearia Pública:** 60 req/min
- **Registro:** 10 req/min
- **Login:** 20 req/min
- **APIs Autenticadas:** Sem limite específico (controlado por usuário)

## Tratamento de Erros

### Formato Padrão
```json
{
  "error": true,
  "message": "Descrição do erro",
  "statusCode": 400,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "requestId": "req_1705312200000_abc123",
  "path": "/api/error"
}
```

### Códigos de Status
- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Dados inválidos
- `401` - Não autenticado
- `403` - Sem permissão
- `404` - Não encontrado
- `409` - Conflito
- `500` - Erro interno

## Headers de Resposta

### Padrão
- `X-Request-ID` - ID único da requisição
- `X-API-Version` - Versão da API
- `X-Response-Time` - Tempo de resposta

### Cache (quando aplicável)
- `Cache-Control` - Controle de cache
- `s-maxage` - Tempo de cache no CDN
- `stale-while-revalidate` - Tempo de revalidação

## Segurança

### 1. Validação de Input
- Schema validation com Zod
- Sanitização de dados
- Validação de tipos

### 2. Autenticação
- JWT tokens
- Verificação de assinatura
- Validação de expiração

### 3. Autorização
- Role-based access control (RBAC)
- Verificação de permissões
- Isolamento por tenant

### 4. Rate Limiting
- Limites por IP
- Limites por usuário
- Proteção contra abuso

## Monitoramento

### 1. Logs
- Todas as requisições
- Tempo de resposta
- Erros e exceções
- Request ID para rastreamento

### 2. Métricas
- Latência por endpoint
- Taxa de erro
- Uso de recursos
- Performance geral

### 3. Alertas
- Erros 5xx
- Latência alta
- Rate limit excedido
- Falhas de autenticação

## Testes

### Página de Teste
- URL: `/api-test`
- Testa endpoints públicos
- Exemplos de uso
- Documentação interativa

### Componentes de Teste
- `PublicBarbershopTest` - Testa API de barbearias
- Validação de respostas
- Tratamento de erros
- Interface amigável

## Desenvolvimento

### 1. Adicionar Novo Endpoint
```typescript
// 1. Definir validação em ROUTE_VALIDATIONS
// 2. Criar arquivo de rota
// 3. Usar apiMiddleware.withApi()
// 4. Adicionar tipos em api.ts
```

### 2. Adicionar Nova Permissão
```typescript
// 1. Definir em auth.ts
// 2. Adicionar em ROUTE_VALIDATIONS
// 3. Verificar no middleware
// 4. Testar com usuário adequado
```

### 3. Configurações
```typescript
// Em src/lib/config.ts
api: {
  headers: {
    tenant: 'X-Tenant-Id',
    auth: 'Authorization: Bearer <jwt>',
  },
  // ... outras configurações
}
```

## Roadmap

### Fase 1 (Atual)
- ✅ Endpoints básicos
- ✅ Middleware de validação
- ✅ Sistema de permissões
- ✅ Rate limiting

### Fase 2 (Próxima)
- 🔄 Documentação OpenAPI/Swagger
- 🔄 Versionamento de API
- 🔄 Webhooks
- 🔄 GraphQL

### Fase 3 (Futura)
- 📋 API Gateway
- 📋 Cache distribuído
- 📋 Métricas avançadas
- 📋 Auto-scaling

## Troubleshooting

### Problemas Comuns

1. **Erro 401 - Não autenticado**
   - Verificar se o token JWT é válido
   - Confirmar se não expirou
   - Verificar formato do header Authorization

2. **Erro 403 - Sem permissão**
   - Verificar permissões do usuário
   - Confirmar se o tenant está correto
   - Verificar se o usuário tem a role adequada

3. **Erro 400 - Header obrigatório**
   - Verificar se X-Tenant-Id está presente
   - Confirmar se o valor é válido
   - Verificar se o tenant existe

4. **Rate limit excedido**
   - Aguardar o período de reset
   - Verificar limites configurados
   - Considerar implementar retry com backoff

### Logs Úteis
```typescript
// Habilitar logs detalhados
console.log('Request:', {
  method: request.method,
  path: request.nextUrl.pathname,
  headers: Object.fromEntries(request.headers),
  user: (request as any).user
});
```

## Suporte

Para dúvidas sobre o sistema de API:
1. Verificar esta documentação
2. Consultar logs do sistema
3. Verificar configurações em `api.json`
4. Testar endpoints na página `/api-test`
5. Abrir issue no repositório


