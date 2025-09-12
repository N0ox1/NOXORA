# Sistema de Billing - Noxora

## Visão Geral

O sistema de billing do Noxora gerencia planos de assinatura, addons e verificação de limites para tenants. Ele é baseado no arquivo `billing.json` e integra com o sistema de multi-tenancy existente.

## Estrutura de Arquivos

```
src/
├── types/
│   └── billing.ts              # Tipos e interfaces do sistema de billing
├── lib/
│   ├── billing/
│   │   ├── billing-service.ts  # Serviço principal de billing
│   │   └── index.ts            # Exportações do módulo
│   └── config.ts               # Configurações de billing
└── components/
    └── billing/
        ├── pricing-card.tsx     # Card individual de plano
        ├── pricing-grid.tsx     # Grid de todos os planos
        ├── addons-section.tsx   # Seção de addons
        ├── billing-dashboard.tsx # Dashboard de uso e limites
        └── index.ts             # Exportações dos componentes
```

## Planos Disponíveis

### STARTER - R$ 49/mês
- **Limites:**
  - 1 barbearia
  - 3 funcionários
- **Funcionalidades:**
  - Agendamentos ilimitados
  - Relatórios básicos
  - Suporte por email

### PRO - R$ 149/mês
- **Limites:**
  - 5 barbearias
  - 20 funcionários
- **Funcionalidades:**
  - Todas do STARTER
  - Relatórios avançados
  - Suporte prioritário

### SCALE - R$ 399/mês
- **Limites:**
  - 999 barbearias
  - 999 funcionários
- **Funcionalidades:**
  - Todas do PRO
  - API personalizada
  - Suporte dedicado

## Addons

### REMINDERS_300 - R$ 19/mês
- **Funcionalidade:** 300 lembretes por mês
- **Uso:** Envio de SMS/email para confirmar agendamentos

## Funcionalidades do Sistema

### 1. Verificação de Limites
- Monitora uso atual vs. limites do plano
- Alerta quando limites são excedidos
- Recomenda upgrades quando necessário

### 2. Gestão de Planos
- Upgrade/downgrade de planos
- Cálculo de preços com addons
- Histórico de mudanças

### 3. Dashboard de Uso
- Métricas em tempo real
- Alertas visuais para limites
- Recomendações de otimização

## Uso da API

### BillingService

```typescript
import { billingService } from '@/lib/billing';

// Obter planos disponíveis
const plans = billingService.getAvailablePlans();

// Verificar limites
const limits = billingService.checkPlanLimits('PRO', {
  shops: 3,
  employees: 15
});

// Verificar se pode criar barbearia
const canCreate = billingService.canCreateBarbershop('STARTER', 1);

// Obter recomendação de upgrade
const recommendation = billingService.getUpgradeRecommendation('STARTER', {
  shops: 2,
  employees: 5
});
```

### Componentes React

```typescript
import { PricingGrid, AddonsSection, BillingDashboard } from '@/components/billing';

// Grid de planos
<PricingGrid 
  currentPlan="PRO"
  onPlanSelect={(planCode) => console.log(planCode)}
/>

// Dashboard de uso
<BillingDashboard
  currentPlan="PRO"
  currentUsage={{
    shops: 3,
    employees: 15,
    appointments: 150,
    reminders: 200
  }}
  currentAddons={['REMINDERS_300']}
/>
```

## Integração com Stripe

### Configurações Mock
```typescript
const stripeMock = {
  prices: {
    STARTER: 'price_mock_starter',
    PRO: 'price_mock_pro',
    SCALE: 'price_mock_scale'
  },
  customer_id: 'cus_mock_123',
  subscription_id: 'sub_mock_123'
};
```

### Webhooks (Futuro)
- Criação de assinaturas
- Mudanças de plano
- Pagamentos processados
- Cancelamentos

## Validações e Segurança

### 1. Verificação de Limites
- Validação antes de criar recursos
- Middleware para verificar permissões
- Logs de tentativas de exceder limites

### 2. Controle de Acesso
- Apenas OWNER pode gerenciar billing
- Auditoria de mudanças de plano
- Histórico de transações

## Monitoramento e Alertas

### 1. Métricas de Uso
- Contagem de recursos por tenant
- Tendências de crescimento
- Alertas de limite próximo

### 2. Notificações
- Email quando limite é excedido
- Alertas no dashboard
- Recomendações de upgrade

## Desenvolvimento

### 1. Adicionar Novo Plano
```typescript
// Em src/lib/config.ts
billing: {
  plans: [
    // ... planos existentes
    {
      code: 'ENTERPRISE',
      price_month: 799,
      limits: { shops: 9999, employees: 9999 }
    }
  ]
}
```

### 2. Adicionar Novo Addon
```typescript
// Em src/lib/config.ts
billing: {
  addons: [
    // ... addons existentes
    {
      code: 'ANALYTICS_ADVANCED',
      price_month: 29,
      grants: { analytics_level: 'advanced' }
    }
  ]
}
```

### 3. Testes
```bash
# Executar testes de billing
npm run test:billing

# Testar limites
npm run test:limits

# Testar upgrades
npm run test:upgrades
```

## Roadmap

### Fase 1 (Atual)
- ✅ Sistema básico de planos
- ✅ Verificação de limites
- ✅ Dashboard de uso
- ✅ Componentes de UI

### Fase 2 (Próxima)
- 🔄 Integração com Stripe real
- 🔄 Webhooks de pagamento
- 🔄 Sistema de faturas
- 🔄 Relatórios de faturamento

### Fase 3 (Futura)
- 📋 Sistema de cupons
- 📋 Planos anuais com desconto
- 📋 Marketplace de addons
- 📋 Sistema de afiliados

## Troubleshooting

### Problemas Comuns

1. **Limites não sendo verificados**
   - Verificar se `billingService` está sendo usado
   - Confirmar se plano está sendo passado corretamente

2. **Componentes não renderizando**
   - Verificar imports dos componentes
   - Confirmar se `billingService` está funcionando

3. **Erros de tipo**
   - Verificar se `BillingPlan` está sendo usado corretamente
   - Confirmar se interfaces estão sendo implementadas

### Logs Úteis
```typescript
// Habilitar logs de billing
console.log('Plano atual:', currentPlan);
console.log('Uso atual:', currentUsage);
console.log('Limites:', limits);
console.log('Recomendação:', upgradeRecommendation);
```

## Suporte

Para dúvidas sobre o sistema de billing:
1. Verificar esta documentação
2. Consultar logs do sistema
3. Verificar configurações em `billing.json`
4. Abrir issue no repositório


