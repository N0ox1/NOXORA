'use client';

import React from 'react';

interface AuditFiltersProps {
  tenantId: string;
}

export function AuditFilters({ tenantId }: AuditFiltersProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Filtros de Auditoria
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ação
          </label>
          <select className="w-full border border-gray-300 rounded-md px-3 py-2">
            <option value="">Todas as ações</option>
            <option value="CREATE">Criar</option>
            <option value="UPDATE">Atualizar</option>
            <option value="DELETE">Deletar</option>
            <option value="LOGIN">Login</option>
            <option value="LOGOUT">Logout</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Entidade
          </label>
          <select className="w-full border border-gray-300 rounded-md px-3 py-2">
            <option value="">Todas as entidades</option>
            <option value="user">Usuário</option>
            <option value="barbershop">Barbearia</option>
            <option value="appointment">Agendamento</option>
            <option value="service">Serviço</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Severidade
          </label>
          <select className="w-full border border-gray-300 rounded-md px-3 py-2">
            <option value="">Todas as severidades</option>
            <option value="LOW">Baixa</option>
            <option value="MEDIUM">Média</option>
            <option value="HIGH">Alta</option>
            <option value="CRITICAL">Crítica</option>
          </select>
        </div>
      </div>
      
      <div className="mt-4 text-center text-sm text-gray-500">
        <p>Componente de filtros em desenvolvimento</p>
        <p>Será integrado com o sistema de auditoria para filtrar logs</p>
      </div>
    </div>
  );
}
