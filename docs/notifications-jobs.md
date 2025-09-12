# Sistema de Notificações e Jobs

## Visão Geral

O sistema de notificações e jobs do Noxora é responsável por gerenciar comunicações automáticas com clientes, funcionários e administradores, além de executar tarefas agendadas (cron jobs) para manutenção e reconciliação do sistema.

## Características Principais

### 🚀 **Fila de Notificações**
- Sistema de fila baseado em Redis para processamento assíncrono
- Priorização por urgência (low, normal, high, critical)
- Retry automático com backoff exponencial
- Agendamento de notificações futuras
- Isolamento por tenant

### ⏰ **Jobs Cron**
- `send_reminders`: Envia lembretes de agendamentos (a cada hora)
- `billing_reconciliation`: Reconciliação de billing (diariamente às 2h)
- `cleanup_old_jobs`: Limpeza de jobs antigos (semanalmente)

### 📧 **Canais de Notificação**
- **SMS**: Para lembretes urgentes e confirmações
- **Email**: Para notificações de billing e administrativas
- **Push**: Para notificações em tempo real (futuro)

### 🎯 **Templates Inteligentes**
- Substituição automática de variáveis
- Configuração flexível de conteúdo
- Suporte a múltiplos idiomas (pt-BR por padrão)

## Arquitetura

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   API Routes    │───▶│  Notification    │───▶│   Redis Queue   │
│                 │    │     Queue        │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   Processor      │
                       │   Service        │
                       └──────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │   Cron Service   │
                       │   (Jobs)         │
                       └──────────────────┘
```

## Configuração

### `config/notifications.json`

```json
{
  "templates": {
    "appointment_reminder": {
      "title": "Lembrete de Agendamento",
      "body": "Olá {client_name}, você tem um agendamento amanhã às {time}...",
      "type": "SMS",
      "priority": "high",
      "delay_hours": 24
    }
  },
  "channels": {
    "SMS": {
      "provider": "mock",
      "rate_limit": 10,
      "retry_attempts": 3
    }
  },
  "scheduling": {
    "reminder_lead_time_hours": 24,
    "confirmation_delay_minutes": 5
  }
}
```

## Uso

### 1. **Criar Notificação**

```typescript
import { notificationQueueService } from '@/lib/notifications';

const jobId = await notificationQueueService.enqueue({
  tenant_id: 'tnt_1',
  template: 'appointment_confirmation',
  recipient: '+55 11 90000-0000',
  recipient_type: 'client',
  data: {
    client_name: 'João Silva',
    employee_name: 'Rafa',
    service_name: 'Corte Masculino',
    date: '15/12/2024',
    time: '14:30'
  },
  priority: 'normal'
});
```

### 2. **Agendar Lembretes Automaticamente**

```typescript
// Ao criar um agendamento
const reminderJobIds = await notificationQueueService.scheduleAppointmentReminders(
  tenantId,
  {
    client_name: 'João Silva',
    employee_name: 'Rafa',
    service_name: 'Corte Masculino',
    appointment_time: new Date('2024-12-16T14:30:00'),
    client_phone: '+55 11 90000-0000'
  }
);
```

### 3. **Iniciar Processador**

```typescript
import { notificationProcessorService } from '@/lib/notifications';

// Iniciar processamento automático
notificationProcessorService.startProcessing(5000); // 5s de intervalo

// Processar todos os jobs pendentes manualmente
const result = await notificationProcessorService.processAllPendingJobs();
```

### 4. **Gerenciar Jobs Cron**

```typescript
import { cronService } from '@/lib/jobs';

// Inicializar todos os jobs cron
await cronService.initializeCronJobs();

// Parar todos os jobs
cronService.stopAllJobs();

// Verificar status
const status = await cronService.getJobsStatus();
```

## API Routes

### `GET /api/notifications`
- `?action=stats` - Estatísticas da fila
- `?action=processing` - Jobs em processamento
- `?action=failed` - Jobs falhados
- `?action=cron_status` - Status dos jobs cron
- `?action=processor_status` - Status do processador

### `POST /api/notifications`
- Criar nova notificação
- Executar ações de controle

### `POST /api/notifications/test`
- `test_notification` - Criar notificação de teste
- `test_reminder` - Agendar lembrete de teste
- `test_confirmation` - Agendar confirmação de teste
- `test_processor` - Testar processador
- `test_cron` - Testar jobs cron
- `test_billing_notification` - Testar notificação de billing
- `clear_queue` - Limpar fila
- `get_full_status` - Status completo

## Integração com Agendamentos

O sistema de notificações é automaticamente integrado com a criação de agendamentos:

```typescript
// Em src/app/api/appointments/route.ts
// Após criar o agendamento com sucesso:

// 1. Agendar confirmação imediata
const confirmationJobId = await notificationQueueService.scheduleAppointmentConfirmation(
  tenant.id,
  appointmentData
);

// 2. Agendar lembrete para 24h antes
const reminderJobIds = await notificationQueueService.scheduleAppointmentReminders(
  tenant.id,
  appointmentData
);
```

## Monitoramento e Estatísticas

### Métricas Disponíveis
- Jobs enfileirados
- Jobs processados com sucesso
- Jobs falhados
- Jobs em retry
- Tempo médio de processamento
- Taxa de sucesso por canal

### Logs
- Criação de jobs
- Processamento de notificações
- Falhas e retries
- Execução de jobs cron
- Limpeza automática

## Jobs Cron Detalhados

### 1. **send_reminders** (A cada hora)
- Busca agendamentos nas próximas 24h
- Cria jobs de lembrete para clientes
- Respeita configurações de lead time

### 2. **billing_reconciliation** (Diariamente às 2h)
- Verifica status de todos os tenants
- Envia notificações de limite excedido
- Alerta sobre trial terminando
- Processa faturas vencidas

### 3. **cleanup_old_jobs** (Semanalmente)
- Remove jobs antigos (>30 dias)
- Limpa estatísticas obsoletas
- Otimiza uso de memória Redis

## Tratamento de Erros

### Estratégias de Retry
- **SMS**: 3 tentativas, delay de 5-15 minutos
- **Email**: 3 tentativas, delay de 15-45 minutos
- **Push**: 2 tentativas, delay de 10-20 minutos

### Fallbacks
- Jobs falhados são movidos para fila de falhas
- Notificações críticas têm prioridade máxima
- Sistema continua funcionando mesmo com falhas parciais

## Segurança

### Isolamento por Tenant
- Todas as notificações são isoladas por `tenant_id`
- Jobs cron processam apenas tenants ativos
- Validação de permissões em todas as operações

### Rate Limiting
- Limites por canal (SMS: 10/min, Email: 100/min)
- Proteção contra spam e abuso
- Throttling automático por tenant

## Performance

### Otimizações
- Processamento em lote para jobs similares
- Cache de templates e configurações
- Limpeza automática de dados antigos
- Processamento assíncrono não-bloqueante

### Escalabilidade
- Fila Redis distribuída
- Múltiplos workers podem processar
- Balanceamento de carga automático
- Monitoramento de performance em tempo real

## Testes

### Script de Teste Automatizado

```bash
npm run notifications:test
```

### Testes Disponíveis
1. Status inicial do sistema
2. Criação de notificações
3. Agendamento de lembretes
4. Processamento de notificações
5. Jobs cron
6. Notificações de billing
7. Estatísticas
8. Status completo
9. Integração com agendamentos
10. Limpeza da fila

## Troubleshooting

### Problemas Comuns

#### 1. **Notificações não sendo enviadas**
- Verificar se o processador está rodando
- Checar logs de erro
- Validar configuração de templates
- Verificar conectividade Redis

#### 2. **Jobs cron não executando**
- Verificar se `cronService.initializeCronJobs()` foi chamado
- Validar expressões cron
- Checar logs de execução
- Verificar permissões de sistema

#### 3. **Fila acumulando jobs**
- Verificar se o processador está ativo
- Analisar jobs falhados
- Validar configurações de retry
- Considerar aumentar workers

### Comandos de Debug

```bash
# Ver status do processador
curl "http://localhost:3000/api/notifications?action=processor_status"

# Ver estatísticas da fila
curl "http://localhost:3000/api/notifications?action=stats"

# Testar criação de notificação
curl -X POST "http://localhost:3000/api/notifications/test" \
  -H "X-Tenant-Id: tnt_1" \
  -d '{"action": "test_notification"}'
```

## Roadmap

### Funcionalidades Futuras
- [ ] Notificações push em tempo real
- [ ] Integração com WhatsApp Business API
- [ ] Templates HTML para emails
- [ ] Dashboard de monitoramento
- [ ] Webhooks para notificações
- [ ] Personalização por usuário
- [ ] A/B testing de templates
- [ ] Analytics de engajamento

### Melhorias Técnicas
- [ ] Biblioteca `node-cron` para expressões cron robustas
- [ ] Sistema de dead letter queue
- [ ] Compressão de payloads
- [ ] Cache distribuído
- [ ] Métricas Prometheus
- [ ] Alertas automáticos
- [ ] Backup automático de configurações

## Conclusão

O sistema de notificações e jobs do Noxora fornece uma base sólida para comunicação automatizada com clientes e manutenção do sistema. Com arquitetura escalável, tratamento robusto de erros e integração nativa com o sistema de agendamentos, ele garante que as comunicações sejam entregues de forma confiável e oportuna.

Para dúvidas ou suporte, consulte a documentação da API ou entre em contato com a equipe de desenvolvimento.
