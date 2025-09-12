'use client';

import React, { useState } from 'react';

interface ReportGeneratorProps {
  tenantId: string;
}

export function ReportGenerator({ tenantId }: ReportGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const generateReport = async () => {
    try {
      setLoading(true);
      setMessage(null);

      const response = await fetch('/api/reporting/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenant_id: tenantId,
          name: 'Relatório Personalizado',
          filters: {
            date_range: {
              start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
              end: new Date().toISOString(),
            },
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao gerar relatório');
      }

      const result = await response.json();
      setMessage(`Relatório gerado com sucesso! ID: ${result.data.id}`);
    } catch (error) {
      setMessage(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Gerador de Relatórios
      </h2>
      
      <button
        onClick={generateReport}
        disabled={loading}
        className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Gerando...' : 'Gerar Relatório (Últimos 30 dias)'}
      </button>

      {message && (
        <div className="mt-4 p-3 rounded-md bg-gray-100 text-sm">
          {message}
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500">
        <p>Gera um relatório completo com todas as métricas configuradas.</p>
        <p className="mt-1">Os relatórios são cacheados para melhor performance.</p>
      </div>
    </div>
  );
}
