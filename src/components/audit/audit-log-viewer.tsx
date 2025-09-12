'use client';

import React from 'react';

interface AuditLogViewerProps {
  tenantId: string;
}

export function AuditLogViewer({ tenantId }: AuditLogViewerProps) {
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Logs de Auditoria
      </h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Timestamp
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Usuário
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ação
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Entidade
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Severidade
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr className="text-center">
              <td colSpan={6} className="px-6 py-12 text-gray-500">
                <div className="text-center">
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Visualizador de Logs em Desenvolvimento
                  </p>
                  <p className="text-sm text-gray-600">
                    Este componente será integrado com o sistema de auditoria para exibir logs em tempo real
                  </p>
                  <div className="mt-4 text-xs text-gray-400">
                    <p>Funcionalidades planejadas:</p>
                    <ul className="mt-2 space-y-1">
                      <li>• Paginação de logs</li>
                      <li>• Filtros avançados</li>
                      <li>• Detalhes de mudanças</li>
                      <li>• Exportação de logs</li>
                      <li>• Alertas de segurança</li>
                    </ul>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
