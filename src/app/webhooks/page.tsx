import React from 'react';
import { WebhookSubscriptionForm, WebhookStats } from '@/components/webhooks';

export default function WebhooksPage() {
  // Mock tenant ID para demonstração
  const mockTenantId = 'barbearia-alfa';

  const handleCreateSubscription = async (data: any) => {
    try {
      const response = await fetch('/api/webhooks/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Id': mockTenantId,
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar assinatura');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Sistema de Webhooks
          </h1>
          <p className="mt-2 text-gray-600">
            Gerencie webhooks para integração com sistemas externos
          </p>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulário de Assinatura */}
          <div>
            <WebhookSubscriptionForm 
              tenantId={mockTenantId}
              onSubmit={handleCreateSubscription}
            />
          </div>

          {/* Estatísticas */}
          <div>
            <WebhookStats tenantId={mockTenantId} />
          </div>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-12">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Sobre o Sistema de Webhooks
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  Webhooks Inbound (Recebidos)
                </h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• <strong>Stripe:</strong> Processamento de pagamentos</li>
                  <li>• <strong>Eventos:</strong> Checkout, assinaturas, falhas</li>
                  <li>• <strong>Segurança:</strong> Validação de assinatura</li>
                  <li>• <strong>Logs:</strong> Rastreamento completo</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  Webhooks Outbound (Enviados)
                </h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• <strong>Agendamentos:</strong> Notificação de criação</li>
                  <li>• <strong>Retry:</strong> Tentativas automáticas</li>
                  <li>• <strong>Assinatura:</strong> Validação HMAC</li>
                  <li>• <strong>Monitoramento:</strong> Status em tempo real</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="text-sm font-medium text-blue-800 mb-2">
                🔗 Como Usar
              </h3>
              <p className="text-sm text-blue-700">
                Configure webhooks para receber notificações em tempo real sobre eventos importantes 
                do sistema, como criação de agendamentos ou mudanças de status de pagamento.
              </p>
            </div>

            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <h3 className="text-sm font-medium text-yellow-800 mb-2">
                ⚠️ Importante
              </h3>
              <p className="text-sm text-yellow-700">
                Sempre use HTTPS para URLs de webhook e configure chaves secretas para 
                validar a autenticidade das requisições recebidas.
              </p>
            </div>
          </div>
        </div>

        {/* Exemplos de Uso */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Exemplos de Uso
            </h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-md">
                <h3 className="font-medium text-gray-800 mb-2">Integração com CRM</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Configure um webhook para <code className="bg-gray-200 px-1 rounded">appointment.created</code> 
                  que envie dados para seu sistema CRM quando um novo agendamento for criado.
                </p>
                <code className="text-xs text-gray-500">
                  POST https://seu-crm.com/webhook/noxora
                </code>
              </div>

              <div className="p-4 bg-gray-50 rounded-md">
                <h3 className="font-medium text-gray-800 mb-2">Notificações por Email</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Use webhooks para disparar emails personalizados ou notificações push 
                  quando eventos importantes acontecerem no sistema.
                </p>
                <code className="text-xs text-gray-500">
                  POST https://seu-email-service.com/webhook
                </code>
              </div>

              <div className="p-4 bg-gray-50 rounded-md">
                <h3 className="font-medium text-gray-800 mb-2">Sincronização de Dados</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Mantenha sistemas externos sincronizados recebendo atualizações 
                  em tempo real sobre mudanças no Noxora.
                </p>
                <code className="text-xs text-gray-500">
                  POST https://seu-sistema.com/api/sync
                </code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
