# Sistema de Notificações - Noxora

## Visão Geral

O sistema de notificações do Noxora é uma solução robusta para envio de comunicações automáticas para clientes, incluindo confirmações de agendamentos e lembretes. O sistema suporta múltiplos canais (email e WhatsApp) e oferece controle de quota mensal para lembretes.

## Arquitetura

### Componentes Principais

1. **NotificationService** - Serviço singleton para gerenciar notificações
2. **API Endpoints** - Endpoints REST para envio e consulta de notificações
3. **Componentes React** - Interface para teste e visualização de quota
4. **Sistema de Templates** - Templates personalizáveis com variáveis dinâmicas

### Fluxo de Funcionamento

```
Cliente → API → NotificationService → Canal (Email/WhatsApp) → Cliente
                ↓
            Redis (Status + Quota)
```

## Funcionalidades

### 1. Envio de Notificações

- **Confirmação de Agendamento**: Enviada imediatamente após confirmação
- **Lembrete de Agendamento**: Enviada antes do horário marcado
- **Múltiplos Canais**: Email e WhatsApp
- **Prioridades**: Baixa, Normal, Alta

### 2. Agendamento de Notificações

- **Envio Futuro**: Programar notificações para horários específicos
- **Processamento Automático**: Sistema verifica e envia notificações vencidas
- **Persistência**: Armazenamento no Redis com TTL configurável

### 3. Controle de Quota

- **Limite Mensal**: Controle de quantidade de lembretes por tenant
- **Monitoramento**: Visualização de uso atual vs. limite
- **Alertas**: Avisos quando próximo ou excedendo o limite
- **Integração com Billing**: Quotas baseadas no plano contratado

### 4. Rastreamento e Status

- **Status em Tempo Real**: Pending, Sent, Failed, Delivered
- **Histórico**: Tentativas, erros, sucessos
- **Logs Detalhados**: Rastreamento completo de todas as operações

## Configuração

### Arquivo de Configuração

```typescript
notifications: {
  channels: ['email', 'whatsapp'],
  templates: {
    appointment_confirmed: {
      text: 'Seu horário {{service}} em {{date}} foi confirmado.',
    },
    appointment_reminder: {
      text: 'Lembrete: {{service}} às {{time}}.',
    },
  },
  quotas: {
    reminders_month_default: 100,
  },
}
```

### Variáveis de Ambiente

```bash
# Redis para armazenamento de status e quota
REDIS_URL=redis://localhost:6379

# Configurações de email (futuro)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha

# Configurações do WhatsApp (futuro)
WHATSAPP_API_KEY=sua-chave-api
WHATSAPP_PHONE_NUMBER=seu-numero
```

## API Endpoints

### 1. Enviar Notificação

```http
POST /api/notifications/send
Headers:
  X-Tenant-Id: {tenant_id}
  Authorization: Bearer {jwt_token}

Body:
{
  "type": "appointment_confirmed",
  "recipient": "cliente@email.com",
  "channel": "email",
  "variables": {
    "service": "Corte + Barba",
    "date": "2024-01-15"
  },
  "priority": "normal",
  "scheduled_for": "2024-01-15T10:00:00Z" // opcional
}
```

### 2. Verificar Status

```http
GET /api/notifications/status/{notification_id}
Headers:
  X-Tenant-Id: {tenant_id}
  Authorization: Bearer {jwt_token}
```

### 3. Consultar Quota

```http
GET /api/notifications/quota
Headers:
  X-Tenant-Id: {tenant_id}
  Authorization: Bearer {jwt_token}
```

## Uso dos Componentes React

### NotificationTest

Componente para testar o envio de notificações:

```tsx
import { NotificationTest } from '@/components/notifications';

<NotificationTest tenantId="barbearia-alfa" />
```

### QuotaDisplay

Componente para visualizar quota e uso:

```tsx
import { QuotaDisplay } from '@/components/notifications';

<QuotaDisplay tenantId="barbearia-alfa" />
```

## Templates e Variáveis

### Template de Confirmação

```
"Seu horário {{service}} em {{date}} foi confirmado."
```

**Variáveis Obrigatórias:**
- `{{service}}`: Nome do serviço
- `{{date}}`: Data do agendamento

### Template de Lembrete

```
"Lembrete: {{service}} às {{time}}."
```

**Variáveis Obrigatórias:**
- `{{service}}`: Nome do serviço
- `{{time}}`: Horário do agendamento

## Sistema de Quota

### Estrutura de Chaves Redis

```
quota_reminders:{tenant_id}:{YYYY-MM}
```

### Cálculo de Limite

```typescript
const totalLimit = planLimit + addonGrants;
const remaining = Math.max(0, totalLimit - currentUsage);
const exceeded = currentUsage >= totalLimit;
```

### Expiração Automática

- Quotas são resetadas automaticamente no final de cada mês
- TTL é calculado dinamicamente baseado na data atual

## Monitoramento e Logs

### Logs Estruturados

```typescript
logger.info('Notification sent successfully', {
  notificationId,
  type: request.type,
  channel: request.channel,
  recipient: request.recipient,
  tenant_id: request.tenant_id,
});
```

### Métricas Disponíveis

- Notificações enviadas por canal
- Taxa de sucesso/falha
- Uso de quota por tenant
- Tempo de processamento

## Segurança

### Autenticação

- Todas as operações requerem JWT válido
- Verificação de permissões baseada em roles
- Validação de tenant_id para isolamento

### Validação de Entrada

- Schema validation com Zod
- Sanitização de variáveis de template
- Verificação de limites de quota

### Rate Limiting

- Limite por tenant e por endpoint
- Proteção contra spam e abuso
- Configuração flexível por rota

## Desenvolvimento

### Estrutura de Arquivos

```
src/
├── lib/notifications/
│   ├── notification-service.ts
│   └── index.ts
├── components/notifications/
│   ├── notification-test.tsx
│   ├── quota-display.tsx
│   └── index.ts
├── app/api/notifications/
│   ├── send/route.ts
│   ├── status/[id]/route.ts
│   └── quota/route.ts
├── types/notifications.ts
└── app/notifications/page.tsx
```

### Adicionando Novos Tipos

1. **Atualizar tipos** em `src/types/notifications.ts`
2. **Adicionar template** na configuração
3. **Implementar validação** específica
4. **Atualizar componentes** de teste

### Adicionando Novos Canais

1. **Implementar método** no `NotificationService`
2. **Adicionar configurações** necessárias
3. **Atualizar validação** de canal
4. **Testar integração**

## Roadmap

### Fase 1 (Atual)
- ✅ Sistema básico de notificações
- ✅ Templates com variáveis
- ✅ Controle de quota
- ✅ API endpoints básicos

### Fase 2 (Próxima)
- 🔄 Integração com serviço de email real
- 🔄 Integração com API do WhatsApp
- 🔄 Dashboard de analytics
- 🔄 Relatórios de entrega

### Fase 3 (Futura)
- 📋 Notificações push
- 📋 SMS como canal adicional
- 📋 Machine learning para timing
- 📋 A/B testing de templates

## Troubleshooting

### Problemas Comuns

#### 1. Notificação não enviada

**Verificar:**
- Status da quota do tenant
- Configuração do canal
- Validação das variáveis do template
- Logs de erro no console

#### 2. Quota não atualizada

**Verificar:**
- Conexão com Redis
- Chave de quota correta
- Expiração da chave
- Logs de incremento

#### 3. Template não renderizado

**Verificar:**
- Variáveis obrigatórias fornecidas
- Formato do template
- Validação de entrada
- Logs de renderização

### Debug

```typescript
// Habilitar logs detalhados
logger.setLevel('debug');

// Verificar quota manualmente
const quota = await notificationService.checkQuotaForTenant(tenantId);
console.log('Quota atual:', quota);

// Verificar status de notificação
const status = await notificationService.getNotificationStatus(notificationId);
console.log('Status:', status);
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

### Contato

- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Email**: suporte@noxora.com.br

---

*Última atualização: Janeiro 2024*
*Versão: 1.0.0*


