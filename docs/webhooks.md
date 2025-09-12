# Sistema de Webhooks - Noxora

## Visão Geral

O sistema de webhooks do Noxora permite integração bidirecional com sistemas externos, recebendo notificações de serviços como Stripe e enviando eventos para aplicações de terceiros. O sistema oferece validação de segurança, retry automático e monitoramento completo.

## Arquitetura

### Componentes Principais

1. **WebhookService** - Serviço singleton para gerenciar webhooks
2. **API Endpoints** - Endpoints para receber e gerenciar webhooks
3. **Componentes React** - Interface para gerenciar assinaturas e visualizar estatísticas
4. **Sistema de Validação** - Verificação de assinaturas e timestamps

### Fluxo de Funcionamento

```
Sistema Externo → WebhookService → Processamento → Resposta
                ↓
            Redis (Logs + Status)
```

## Funcionalidades

### 1. Webhooks Inbound (Recebidos)

- **Stripe Integration**: Processamento de eventos de pagamento
- **Validação de Segurança**: Verificação de assinaturas
- **Eventos Suportados**: Checkout, assinaturas, falhas de pagamento
- **Logs Detalhados**: Rastreamento de todos os eventos recebidos

### 2. Webhooks Outbound (Enviados)

- **Eventos Personalizados**: Notificações sobre mudanças no sistema
- **Retry Automático**: Tentativas com backoff exponencial
- **Assinatura HMAC**: Validação de autenticidade
- **Headers Customizados**: Configuração flexível de requisições

### 3. Gestão de Assinaturas

- **CRUD Completo**: Criar, listar, atualizar e desativar webhooks
- **Configuração de Retry**: Parâmetros personalizáveis para tentativas
- **Validação de URL**: Verificação de URLs válidas
- **Isolamento por Tenant**: Cada tenant gerencia seus próprios webhooks

### 4. Monitoramento e Analytics

- **Estatísticas em Tempo Real**: Contadores de inbound/outbound
- **Taxa de Sucesso**: Métricas de entrega e falhas
- **Tempo de Processamento**: Performance dos webhooks
- **Logs Estruturados**: Histórico completo de todas as operações

## Configuração

### Arquivo de Configuração

```typescript
webhooks: {
  inbound: {
    stripe: {
      path: '/api/webhooks/stripe',
      events: [
        'checkout.session.completed',
        'customer.subscription.created',
        'customer.subscription.updated',
        'invoice.payment_failed'
      ],
    },
  },
  outbound: {
    appointment: {
      created: {
        payload_example: {
          id: 'app_1',
          tenant_id: 'tnt_1',
        },
      },
    },
  },
}
```

### Variáveis de Ambiente

```bash
# Stripe Webhook Secret
STRIPE_WEBHOOK_SECRET=whsec_seu_secret_aqui

# Redis para armazenamento de logs e status
REDIS_URL=redis://localhost:6379

# Configurações de retry padrão
WEBHOOK_MAX_RETRIES=3
WEBHOOK_INITIAL_DELAY=5000
WEBHOOK_MAX_DELAY=60000
```

## API Endpoints

### 1. Webhook Stripe (Inbound)

```http
POST /api/webhooks/stripe
Headers:
  stripe-signature: {assinatura}
  stripe-timestamp: {timestamp}

Body: {payload do Stripe}
```

**Eventos Suportados:**
- `checkout.session.completed` - Pagamento concluído
- `customer.subscription.created` - Assinatura criada
- `customer.subscription.updated` - Assinatura atualizada
- `invoice.payment_failed` - Falha no pagamento

### 2. Gerenciar Assinaturas

```http
POST /api/webhooks/subscriptions
Headers:
  X-Tenant-Id: {tenant_id}
  Authorization: Bearer {jwt_token}

Body:
{
  "event_type": "appointment.created",
  "url": "https://seu-sistema.com/webhook",
  "is_active": true,
  "secret": "chave_secreta_opcional",
  "headers": {"Authorization": "Bearer token"},
  "retry_config": {
    "max_attempts": 3,
    "initial_delay_ms": 5000,
    "max_delay_ms": 60000,
    "backoff_multiplier": 2
  }
}
```

### 3. Estatísticas

```http
GET /api/webhooks/stats
Headers:
  X-Tenant-Id: {tenant_id}
  Authorization: Bearer {jwt_token}
```

## Uso dos Componentes React

### WebhookSubscriptionForm

Formulário para criar novas assinaturas:

```tsx
import { WebhookSubscriptionForm } from '@/components/webhooks';

<WebhookSubscriptionForm 
  tenantId="barbearia-alfa"
  onSubmit={handleCreateSubscription}
/>
```

### WebhookStats

Componente para visualizar estatísticas:

```tsx
import { WebhookStats } from '@/components/webhooks';

<WebhookStats tenantId="barbearia-alfa" />
```

## Eventos Disponíveis

### 1. appointment.created

Disparado quando um novo agendamento é criado.

**Payload:**
```json
{
  "id": "webhook_1234567890_abc123",
  "tenant_id": "barbearia-alfa",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "event_type": "appointment.created",
  "data": {
    "id": "app_123",
    "tenant_id": "barbearia-alfa",
    "client_id": "client_456",
    "service_id": "service_789",
    "employee_id": "emp_101",
    "scheduled_for": "2024-01-20T14:00:00.000Z",
    "status": "confirmed"
  }
}
```

## Segurança

### Validação de Assinatura

#### Stripe (Inbound)
```typescript
// Validação automática usando webhook secret
const event = stripe.webhooks.constructEvent(
  payload,
  signature,
  webhookSecret
);
```

#### Outbound (HMAC)
```typescript
// Assinatura HMAC-SHA256
const signature = crypto
  .createHmac('sha256', secret)
  .update(`${timestamp}.${payload}`)
  .digest('hex');

// Headers enviados
X-Webhook-Signature: {signature}
X-Webhook-Timestamp: {timestamp}
```

### Validação de Timestamp

- **Tolerância**: 5 minutos (300 segundos)
- **Proteção**: Contra replay attacks
- **Configurável**: Parâmetro ajustável

## Sistema de Retry

### Configuração de Retry

```typescript
retry_config: {
  max_attempts: 3,           // Máximo de tentativas
  initial_delay_ms: 5000,    // Delay inicial (5s)
  max_delay_ms: 60000,       // Delay máximo (60s)
  backoff_multiplier: 2      // Multiplicador exponencial
}
```

### Algoritmo de Backoff

```
Tentativa 1: 5s
Tentativa 2: 10s (5 * 2)
Tentativa 3: 20s (10 * 2, limitado a 60s)
```

### Status de Entrega

- **pending**: Aguardando processamento
- **success**: Entregue com sucesso
- **failed**: Falha na entrega
- **retrying**: Tentando novamente

## Monitoramento e Logs

### Estrutura de Logs

```typescript
interface WebhookLog {
  id: string;
  webhook_id: string;
  event_type: string;
  direction: 'inbound' | 'outbound';
  status: 'success' | 'failed' | 'pending';
  payload_size: number;
  processing_time_ms: number;
  error_message?: string;
  created_at: Date;
}
```

### Métricas Disponíveis

- **Total de Webhooks**: Inbound e outbound
- **Taxa de Sucesso**: Percentual de entregas bem-sucedidas
- **Tempo de Processamento**: Latência média
- **Tentativas de Retry**: Contagem de retentativas

## Desenvolvimento

### Estrutura de Arquivos

```
src/
├── lib/webhooks/
│   ├── webhook-service.ts
│   └── index.ts
├── components/webhooks/
│   ├── webhook-subscription-form.tsx
│   ├── webhook-stats.tsx
│   └── index.ts
├── app/api/webhooks/
│   ├── stripe/route.ts
│   ├── subscriptions/route.ts
│   └── stats/route.ts
├── types/webhooks.ts
└── app/webhooks/page.tsx
```

### Adicionando Novos Eventos

1. **Atualizar tipos** em `src/types/webhooks.ts`
2. **Adicionar configuração** no arquivo de config
3. **Implementar handler** no `WebhookService`
4. **Atualizar componentes** de interface
5. **Adicionar validação** específica

### Adicionando Novos Provedores

1. **Implementar validação** de assinatura
2. **Adicionar configurações** necessárias
3. **Criar endpoint** específico
4. **Implementar handlers** de eventos
5. **Testar integração**

## Roadmap

### Fase 1 (Atual)
- ✅ Webhooks Stripe (inbound)
- ✅ Webhooks de agendamentos (outbound)
- ✅ Sistema de retry básico
- ✅ Interface de gerenciamento

### Fase 2 (Próxima)
- 🔄 Webhooks para outros eventos (clientes, serviços)
- 🔄 Sistema de retry avançado com filas
- 🔄 Dashboard de analytics detalhado
- 🔄 Webhooks para múltiplos provedores

### Fase 3 (Futura)
- 📋 Webhooks em tempo real (WebSockets)
- 📋 Sistema de templates para payloads
- 📋 Rate limiting por assinatura
- 📋 A/B testing de webhooks

## Troubleshooting

### Problemas Comuns

#### 1. Webhook não recebido

**Verificar:**
- URL configurada corretamente
- Sistema externo acessível
- Firewall/network permitindo conexões
- Logs de erro no console

#### 2. Falha na validação de assinatura

**Verificar:**
- Chave secreta configurada
- Formato da assinatura
- Timestamp válido
- Payload não modificado

#### 3. Retry não funcionando

**Verificar:**
- Configuração de retry
- Sistema de filas funcionando
- Logs de tentativas
- Status de entrega

### Debug

```typescript
// Habilitar logs detalhados
logger.setLevel('debug');

// Verificar assinatura manualmente
const validation = validateWebhookSignature(
  signature,
  payload,
  secret,
  timestamp
);
console.log('Validation result:', validation);

// Verificar estatísticas
const stats = await webhookService.getWebhookStats(tenantId);
console.log('Webhook stats:', stats);
```

## Exemplos de Integração

### 1. Integração com CRM

```typescript
// Configurar webhook para agendamentos
const subscription = await webhookService.createSubscription({
  event_type: 'appointment.created',
  url: 'https://seu-crm.com/webhook/noxora',
  secret: 'crm_secret_key',
  is_active: true,
  retry_config: {
    max_attempts: 5,
    initial_delay_ms: 10000,
    max_delay_ms: 300000,
    backoff_multiplier: 2
  }
});
```

### 2. Notificações por Email

```typescript
// Webhook para serviço de email
const emailWebhook = await webhookService.createSubscription({
  event_type: 'appointment.created',
  url: 'https://seu-email-service.com/webhook',
  headers: {
    'Authorization': 'Bearer email_service_token',
    'X-Service': 'email'
  },
  is_active: true
});
```

### 3. Sincronização com Sistema Externo

```typescript
// Webhook para sincronização
const syncWebhook = await webhookService.createSubscription({
  event_type: 'appointment.created',
  url: 'https://seu-sistema.com/api/sync/appointments',
  secret: 'sync_secret_key',
  is_active: true,
  retry_config: {
    max_attempts: 10,
    initial_delay_ms: 5000,
    max_delay_ms: 600000,
    backoff_multiplier: 1.5
  }
});
```

## Contribuição

### Padrões de Código

- **TypeScript**: Tipagem estrita obrigatória
- **ESLint**: Seguir regras configuradas
- **Prettier**: Formatação automática
- **Tests**: Cobertura mínima de 80%

### Processo de Desenvolvimento

1. **Fork** do repositório
2. **Branch** para feature/fix
3. **Desenvolvimento** seguindo padrões
4. **Testes** locais
5. **Pull Request** com descrição detalhada
6. **Code Review** obrigatório
7. **Merge** após aprovação

## Suporte

### Documentação Adicional

- [API Reference](./api.md)
- [Authentication](./auth.md)
- [Database Schema](./database.md)
- [Notifications](./notifications.md)

### Contato

- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Email**: suporte@noxora.com.br

---

*Última atualização: Janeiro 2024*
*Versão: 1.0.0*
