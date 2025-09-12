# Sistema de Billing - Noxora

## Visão Geral

O sistema de billing do Noxora implementa um sistema completo de planos, limites e cobrança com integração mock ao Stripe, feature flags baseados em planos, e enforce limits automático.

## Características

### Planos de Assinatura
- **STARTER**: R$ 49/mês - Para pequenas barbearias
- **PRO**: R$ 149/mês - Para barbearias em crescimento
- **SCALE**: R$ 299/mês - Para redes de barbearias

### Feature Flags
- **Multi-location**: Disponível nos planos PRO e SCALE
- **Advanced Reporting**: Disponível nos planos PRO e SCALE
- **SMS Notifications**: Disponível nos planos PRO e SCALE
- **Custom Branding**: Disponível nos planos PRO e SCALE
- **Priority Support**: Disponível apenas no plano SCALE
- **Webhooks**: Disponível nos planos PRO e SCALE
- **API Access**: Disponível nos planos PRO e SCALE

### Enforce Limits
- **Limites por plano**: Shops, funcionários, clientes, agendamentos
- **Limites de uso**: Notificações, storage, chamadas de API
- **Bloqueio automático**: Retorna 409 LIMIT_EXCEEDED quando excedido
- **Recomendações de upgrade**: Sugere planos superiores automaticamente

## Arquitetura

### Componentes Principais

#### 1. BillingService (`src/lib/billing/billing-service.ts`)
```typescript
export class BillingService {
  // Gerenciamento de planos
  getPlans(): BillingPlan[]
  getPlanByCode(code: string): BillingPlan | undefined
  
  // Feature flags
  isFeatureEnabled(planCode: string, feature: string): boolean
  getPlanFeatures(planCode: string): Record<string, boolean>
  
  // Cálculo de preços
  calculateMonthlyPrice(planCode: string, addonCodes?: string[]): number
  calculateYearlyPrice(planCode: string, addonCodes?: string[]): number
  
  // Enforce limits
  async enforceLimits(tenantId: string, action?: string): Promise<BillingEnforcementResult>
  
  // Checkout e webhooks
  async createCheckoutSession(request: BillingCheckoutRequest): Promise<BillingCheckoutResponse>
  async processWebhook(event: any): Promise<{ success: boolean; message: string }>
}
```

#### 2. Enforce Limits (`src/lib/billing/enforce-limits.ts`)
```typescript
// Middleware principal
export async function enforceBillingLimits(
  request: NextRequest,
  action?: string
): Promise<NextResponse | null>

// Middlewares específicos
export async function enforceBarbershopLimits(request: NextRequest): Promise<NextResponse | null>
export async function enforceEmployeeLimits(request: NextRequest): Promise<NextResponse | null>
export async function enforceClientLimits(request: NextRequest): Promise<NextResponse | null>
export async function enforceAppointmentLimits(request: NextRequest): Promise<NextResponse | null>

// Feature flags
export async function enforceFeatureFlag(
  request: NextRequest,
  feature: string
): Promise<NextResponse | null>
```

### Estrutura de Configuração

#### billing.json
```json
{
  "plans": [
    {
      "code": "STARTER",
      "name": "Starter",
      "price_month": 49,
      "price_year": 490,
      "limits": {
        "shops": 1,
        "employees": 3,
        "clients": 100,
        "appointments_month": 500
      },
      "features": {
        "multi_location": false,
        "advanced_reporting": false
      }
    }
  ],
  "feature_flags": {
    "multi_location": {
      "STARTER": false,
      "PRO": true,
      "SCALE": true
    }
  }
}
```

## Configuração

### Variáveis de Ambiente
```bash
# Stripe (em produção)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Billing
BILLING_TRIAL_DAYS=14
BILLING_GRACE_PERIOD_DAYS=7
BILLING_AUTO_UPGRADE=true
```

### Configurações Padrão
```typescript
export const BILLING_CONFIG = {
  TRIAL_DAYS: 14,
  GRACE_PERIOD_DAYS: 7,
  AUTO_UPGRADE: true,
  DOWNGRADE_RESTRICTIONS: {
    MIN_USAGE_PERIOD_DAYS: 30,
    REQUIRE_MANUAL_APPROVAL: false,
  },
};
```

## Uso

### Enforce Limits em Rotas
```typescript
// src/app/api/services/route.ts
export async function POST(request: NextRequest) {
  // ... validação de tenant

  // Enforce billing limits para criação de serviços
  const limitCheck = await enforceBillingLimits(request, 'create_service');
  if (limitCheck) {
    return limitCheck; // Retorna 409 LIMIT_EXCEEDED se necessário
  }

  // ... lógica de criação
}
```

### Feature Flags
```typescript
// Verificar se feature está disponível
const canUseMultiLocation = billingService.isFeatureEnabled(tenant.plan, 'multi_location');

if (!canUseMultiLocation) {
  return NextResponse.json(
    { error: 'FEATURE_NOT_AVAILABLE', message: 'Multi-location não disponível no seu plano' },
    { status: 403 }
  );
}
```

### Checkout
```typescript
// Criar sessão de checkout
const checkoutRequest: BillingCheckoutRequest = {
  tenant_id: tenant.id,
  plan_code: 'PRO',
  billing_cycle: 'monthly',
  addons: ['REMINDERS_300'],
  customer_email: 'user@example.com',
  customer_name: 'User Name',
  success_url: 'https://example.com/success',
  cancel_url: 'https://example.com/cancel',
};

const checkoutResponse = await billingService.createCheckoutSession(checkoutRequest);
```

## Rotas da API

### Checkout
```bash
# Obter informações de checkout
GET /api/billing/checkout

# Criar sessão de checkout
POST /api/billing/checkout
{
  "plan_code": "PRO",
  "billing_cycle": "monthly",
  "addons": ["REMINDERS_300"],
  "customer_email": "user@example.com",
  "customer_name": "User Name",
  "success_url": "https://example.com/success",
  "cancel_url": "https://example.com/cancel"
}
```

### Webhooks Stripe
```bash
# Processar webhook
POST /api/webhooks/stripe

# Testar webhooks
GET /api/webhooks/stripe?action=test
```

### Testes
```bash
# Rota de teste de billing
GET /api/billing/test

# Testar enforce limits
POST /api/billing/test
{
  "action": "test_enforce_limits"
}

# Testar feature flags
POST /api/billing/test
{
  "action": "test_feature_flags",
  "data": {
    "features": ["multi_location", "advanced_reporting"]
  }
}
```

## Enforce Limits

### Como Funciona
1. **Verificação de Tenant**: Obtém informações do tenant da requisição
2. **Verificação de Status**: Confirma se o tenant está ativo
3. **Análise de Uso**: Compara uso atual com limites do plano
4. **Decisão**: Permite ou bloqueia a operação
5. **Resposta**: Retorna 409 LIMIT_EXCEEDED se necessário

### Exemplo de Resposta de Limite Excedido
```json
{
  "error": "LIMIT_EXCEEDED",
  "message": "Você excedeu os limites do seu plano atual",
  "details": {
    "exceeded_limits": ["shops", "employees"],
    "current_usage": {
      "shops": 2,
      "employees": 5
    },
    "plan_limits": {
      "shops": 1,
      "employees": 3
    },
    "plan_code": "STARTER"
  },
  "upgrade_recommended": {
    "recommended": true,
    "recommended_plan": "PRO",
    "reason": "Seu uso atual excede os limites do plano STARTER. O plano PRO oferece mais recursos."
  },
  "action_required": "upgrade_plan",
  "help_url": "/billing/upgrade"
}
```

## Webhooks

### Eventos Suportados
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

### Processamento
```typescript
// Cada evento é processado por um handler específico
switch (eventType) {
  case 'checkout.session.completed':
    return await handleCheckoutCompleted(eventData);
  
  case 'customer.subscription.updated':
    return await handleSubscriptionUpdated(eventData);
  
  // ... outros eventos
}
```

## Testes

### Script de Teste Automatizado
```bash
# Executar todos os testes
npm run billing:test

# Ou executar diretamente
node scripts/test-billing.js
```

### Testes Disponíveis
1. **Rota de Teste de Billing**: Verifica funcionamento básico
2. **Checkout**: Testa criação de sessões de checkout
3. **Webhooks**: Testa processamento de eventos Stripe
4. **Enforce Limits**: Testa bloqueio por limites excedidos
5. **Feature Flags**: Testa disponibilidade de features por plano
6. **Simulação de Uso**: Testa diferentes cenários de uso
7. **Recomendação de Upgrade**: Testa sugestões automáticas
8. **Simulação de Checkout**: Testa fluxo completo de checkout

## Monitoramento

### Métricas Disponíveis
- **Total de Revenue**: Receita total da plataforma
- **MRR**: Monthly Recurring Revenue
- **Assinaturas Ativas**: Número de tenants ativos
- **Churn Rate**: Taxa de cancelamento
- **ARPU**: Average Revenue Per User
- **Distribuição de Planos**: Quantidade por plano
- **Top Planos**: Planos mais populares

### Logs
```typescript
// Logs automáticos para operações importantes
console.log(`🛒 Checkout iniciado para tenant ${tenantId}:`, {
  current_plan: tenant.plan,
  requested_plan: checkoutData.plan_code,
  amount: checkoutResponse.amount_total,
});

console.log(`🚫 Limites excedidos para tenant ${tenantId}:`, {
  exceeded_limits: enforcementResult.exceeded_limits,
  current_usage: enforcementResult.current_usage,
});
```

## Segurança

### Validações
- **Tenant ID**: Verificação obrigatória em todas as operações
- **Plano Válido**: Validação de códigos de plano
- **Addons Válidos**: Verificação de addons disponíveis
- **Downgrade Restrictions**: Controle de mudanças de plano

### Fail-Open
- Em caso de erro no enforce limits, a operação é permitida
- Logs detalhados para auditoria
- Monitoramento de falhas

## Deploy e Produção

### Configurações de Produção
```bash
# Stripe real
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Billing mais restritivo
BILLING_TRIAL_DAYS=7
BILLING_GRACE_PERIOD_DAYS=3
BILLING_AUTO_UPGRADE=false
```

### Monitoramento em Produção
- **Alertas**: Limites excedidos, falhas de pagamento
- **Dashboards**: Métricas de revenue e churn
- **Webhooks**: Verificação de assinatura Stripe
- **Logs**: Auditoria completa de operações

## Troubleshooting

### Problemas Comuns

#### 1. Limites Sempre Excedidos
```bash
# Verificar configuração de planos
GET /api/billing/test

# Verificar uso atual
POST /api/billing/test
{
  "action": "test_usage_simulation"
}
```

#### 2. Feature Flags Não Funcionando
```bash
# Verificar features disponíveis
POST /api/billing/test
{
  "action": "test_feature_flags"
}
```

#### 3. Webhooks Não Processando
```bash
# Testar webhooks
GET /api/webhooks/stripe?action=test

# Verificar logs do servidor
```

### Debug
```typescript
// Habilitar logs detalhados
console.log('Enforce limits:', {
  tenantId,
  action,
  result: enforcementResult,
  timestamp: new Date().toISOString()
});

console.log('Feature flag check:', {
  planCode: tenant.plan,
  feature,
  enabled: billingService.isFeatureEnabled(tenant.plan, feature),
});
```

## Conclusão

O sistema de billing do Noxora fornece uma base sólida para monetização com controle granular de recursos por plano, enforce limits automático e integração flexível com gateways de pagamento. A arquitetura é escalável e permite fácil adição de novos planos e features.
