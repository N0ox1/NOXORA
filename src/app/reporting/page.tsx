import React from 'react';
import { MetricDisplay } from '@/components/reporting/metric-display';
import { ReportGenerator } from '@/components/reporting/report-generator';
import { PerformanceOverview } from '@/components/reporting/performance-overview';

export default function ReportingPage() {
  const mockTenantId = 'barbearia-alfa';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Sistema de Relatórios
          </h1>
          <p className="mt-2 text-gray-600">
            Visualize métricas, gere relatórios e acompanhe o desempenho da sua barbearia
          </p>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Métricas Principais */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Métricas Principais
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricDisplay 
                  metricId="bookings_today"
                  title="Agendamentos Hoje"
                  tenantId={mockTenantId}
                />
                <MetricDisplay 
                  metricId="no_show_rate_7d"
                  title="Taxa de No-Show (7d)"
                  tenantId={mockTenantId}
                />
                <MetricDisplay 
                  metricId="revenue_estimate_30d"
                  title="Receita Estimada (30d)"
                  tenantId={mockTenantId}
                />
              </div>
            </div>
          </div>

          {/* Gerador de Relatórios */}
          <div className="lg:col-span-1">
            <ReportGenerator tenantId={mockTenantId} />
          </div>
        </div>

        {/* Visão Geral de Performance */}
        <div className="mt-8">
          <PerformanceOverview tenantId={mockTenantId} />
        </div>

        {/* Informações Adicionais */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Sobre o Sistema de Relatórios
          </h3>
          <div className="prose prose-sm text-gray-600">
            <p>
              O sistema de relatórios do Noxora oferece métricas em tempo real e análises 
              detalhadas para ajudar você a tomar decisões informadas sobre sua barbearia.
            </p>
            <ul className="mt-4 space-y-2">
              <li>
                <strong>Métricas em Tempo Real:</strong> Acompanhe agendamentos, receita e 
                performance dos funcionários
              </li>
              <li>
                <strong>Relatórios Personalizáveis:</strong> Gere relatórios com filtros 
                específicos por período, barbearia, funcionário ou serviço
              </li>
              <li>
                <strong>Cache Inteligente:</strong> Métricas são calculadas e armazenadas 
                em cache para performance otimizada
              </li>
              <li>
                <strong>Análise de Tendências:</strong> Compare períodos e identifique 
                padrões de crescimento
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
              <h4 className="font-medium text-blue-800">Calcular Métrica Específica</h4>
              <code className="block bg-blue-100 p-2 rounded text-sm text-blue-900 mt-1">
                GET /api/reporting/metrics/bookings_today?tenant_id=barbearia-alfa
              </code>
            </div>
            <div>
              <h4 className="font-medium text-blue-800">Gerar Relatório Completo</h4>
              <code className="block bg-blue-100 p-2 rounded text-sm text-blue-900 mt-1">
                POST /api/reporting/reports
                {`\n`}
                {`{\n`}
                {`  "tenant_id": "barbearia-alfa",\n`}
                {`  "filters": {\n`}
                {`    "date_range": {\n`}
                {`      "start": "2024-01-01T00:00:00Z",\n`}
                {`      "end": "2024-01-31T23:59:59Z"\n`}
                {`    }\n`}
                {`  }\n`}
                {`}`}
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
