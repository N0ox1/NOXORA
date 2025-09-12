'use client';

import React from 'react';

interface PerformanceOverviewProps {
  tenantId: string;
}

export function PerformanceOverview({ tenantId }: PerformanceOverviewProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Visão Geral de Performance
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">--</div>
          <div className="text-sm text-blue-800">Total de Agendamentos</div>
        </div>
        
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">--</div>
          <div className="text-sm text-green-800">Taxa de Conclusão</div>
        </div>
        
        <div className="text-center p-4 bg-yellow-50 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">--</div>
          <div className="text-sm text-yellow-800">Receita Média</div>
        </div>
        
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">--</div>
          <div className="text-sm text-purple-800">Satisfação</div>
        </div>
      </div>

      <div className="mt-6 text-center text-sm text-gray-500">
        <p>Componente de performance em desenvolvimento</p>
        <p>Será integrado com o sistema de relatórios para mostrar métricas avançadas</p>
      </div>
    </div>
  );
}
