import React from 'react';
import { NotificationTest, QuotaDisplay } from '@/components/notifications';

export default function NotificationsPage() {
  // Mock tenant ID para demonstração
  const mockTenantId = 'barbearia-alfa';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Sistema de Notificações
          </h1>
          <p className="mt-2 text-gray-600">
            Teste e gerencie notificações para agendamentos e lembretes
          </p>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quota Display - 1 coluna */}
          <div className="lg:col-span-1">
            <QuotaDisplay tenantId={mockTenantId} />
          </div>

          {/* Notification Test - 2 colunas */}
          <div className="lg:col-span-2">
            <NotificationTest tenantId={mockTenantId} />
          </div>
        </div>

        {/* Informações Adicionais */}
        <div className="mt-12">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Sobre o Sistema de Notificações
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  Funcionalidades
                </h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Envio imediato de notificações</li>
                  <li>• Agendamento para envio futuro</li>
                  <li>• Múltiplos canais (Email e WhatsApp)</li>
                  <li>• Templates personalizáveis</li>
                  <li>• Controle de quota mensal</li>
                  <li>• Rastreamento de status</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  Tipos de Notificação
                </h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• <strong>Confirmação:</strong> Confirma agendamentos</li>
                  <li>• <strong>Lembrete:</strong> Lembra horários marcados</li>
                </ul>

                <h3 className="text-lg font-medium text-gray-800 mb-2 mt-4">
                  Canais Suportados
                </h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• <strong>Email:</strong> Para confirmações e lembretes</li>
                  <li>• <strong>WhatsApp:</strong> Para lembretes urgentes</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="text-sm font-medium text-blue-800 mb-2">
                💡 Dica de Uso
              </h3>
              <p className="text-sm text-blue-700">
                Use o sistema de agendamento para programar lembretes automáticos 
                antes dos horários marcados. Isso melhora significativamente a 
                taxa de comparecimento dos clientes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


