import React from 'react';
import { AuditLogViewer } from '@/components/audit/audit-log-viewer';
import { AuditStats } from '@/components/audit/audit-stats';
import { AuditFilters } from '@/components/audit/audit-filters';
import { AuditTest } from '@/components/audit/audit-test';

export default function AuditPage() {
  const mockTenantId = 'barbearia-alfa';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Sistema de Auditoria
          </h1>
          <p className="mt-2 text-gray-600">
            Monitore todas as ações e mudanças no sistema com logs detalhados de auditoria
          </p>
        </div>

        {/* Estatísticas */}
        <div className="mb-8">
          <AuditStats tenantId={mockTenantId} />
        </div>

        {/* Filtros */}
        <div className="mb-8">
          <AuditFilters tenantId={mockTenantId} />
        </div>

        {/* Visualizador de Logs */}
        <div className="bg-white rounded-lg shadow mb-8">
          <AuditLogViewer tenantId={mockTenantId} />
        </div>

        {/* Teste de Auditoria */}
        <div className="mb-8">
          <AuditTest />
        </div>

        {/* Informações Adicionais */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Sobre o Sistema de Auditoria
          </h3>
          <div className="prose prose-sm text-gray-600">
            <p>
              O sistema de auditoria do Noxora registra automaticamente todas as ações
              importantes realizadas no sistema, fornecendo rastreabilidade completa e
              conformidade com regulamentações.
            </p>
            <ul className="mt-4 space-y-2">
              <li>
                <strong>Rastreamento Automático:</strong> Todas as ações CRUD, logins,
                exportações e mudanças de configuração são registradas automaticamente
              </li>
              <li>
                <strong>Dados Sensíveis Protegidos:</strong> Senhas, tokens e informações
                confidenciais são automaticamente mascarados nos logs
              </li>
              <li>
                <strong>Filtros Avançados:</strong> Busque logs por usuário, ação, entidade,
                período e severidade
              </li>
              <li>
                <strong>Retenção Configurável:</strong> Logs são mantidos conforme política
                de retenção configurável
              </li>
              <li>
                <strong>Análise de Segurança:</strong> Identifique padrões suspeitos e
                ações críticas automaticamente
              </li>
            </ul>
          </div>
        </div>

        {/* Exemplos de Uso */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            Exemplos de Uso das APIs
          </h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-blue-800">Buscar Logs de Auditoria</h4>
              <code className="block bg-blue-100 p-2 rounded text-sm text-blue-900 mt-1">
                GET /api/audit/logs?tenant_id=barbearia-alfa&action=DELETE&limit=50
              </code>
            </div>
            <div>
              <h4 className="font-medium text-blue-800">Obter Estatísticas</h4>
              <code className="block bg-blue-100 p-2 rounded text-sm text-blue-900 mt-1">
                GET /api/audit/stats?tenant_id=barbearia-alfa&start_date=2024-01-01
              </code>
            </div>
            <div>
              <h4 className="font-medium text-blue-800">Filtrar por Período</h4>
              <code className="block bg-blue-100 p-2 rounded text-sm text-blue-900 mt-1">
                GET /api/audit/logs?tenant_id=barbearia-alfa&start_date=2024-01-01&end_date=2024-01-31
              </code>
            </div>
          </div>
        </div>

        {/* Ações Auditadas */}
        <div className="mt-8 bg-green-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-4">
            Ações Auditadas Automaticamente
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-green-100 rounded-lg">
              <div className="text-lg font-semibold text-green-800">CRUD</div>
              <div className="text-sm text-green-600">Create, Read, Update, Delete</div>
            </div>
            <div className="text-center p-3 bg-green-100 rounded-lg">
              <div className="text-lg font-semibold text-green-800">Acesso</div>
              <div className="text-sm text-green-600">Login, Logout, Sessões</div>
            </div>
            <div className="text-center p-3 bg-green-100 rounded-lg">
              <div className="text-lg font-semibold text-green-800">Dados</div>
              <div className="text-sm text-green-600">Export, Import, Backup</div>
            </div>
            <div className="text-center p-3 bg-green-100 rounded-lg">
              <div className="text-lg font-semibold text-green-800">Sistema</div>
              <div className="text-sm text-green-600">Configurações, Permissões</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
