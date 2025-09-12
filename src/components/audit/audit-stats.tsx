'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheckIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon,
  UserIcon,
  DocumentTextIcon 
} from '@heroicons/react/24/outline';

interface AuditStatsProps {
  tenantId: string;
}

interface AuditStatsData {
  total_logs: number;
  logs_today: number;
  logs_this_week: number;
  logs_this_month: number;
  actions_distribution: Record<string, number>;
  entities_distribution: Record<string, number>;
  severity_distribution: Record<string, number>;
  status_distribution: Record<string, number>;
  top_actors: Array<{
    actor_id: string;
    actor_name: string;
    action_count: number;
  }>;
  top_entities: Array<{
    entity: string;
    action_count: number;
  }>;
}

export function AuditStats({ tenantId }: AuditStatsProps) {
  const [stats, setStats] = useState<AuditStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, [tenantId]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/audit/stats?tenant_id=${tenantId}`
      );

      if (!response.ok) {
        throw new Error('Falha ao buscar estatísticas');
      }

      const result = await response.json();
      setStats(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'text-red-600 bg-red-100';
      case 'HIGH':
        return 'text-orange-600 bg-orange-100';
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-100';
      case 'LOW':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Estatísticas de Auditoria
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Estatísticas de Auditoria
        </h2>
        <div className="text-red-600 text-center">
          Erro: {error}
          <button
            onClick={fetchStats}
            className="ml-2 text-blue-600 hover:text-blue-800 underline"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Estatísticas de Auditoria
        </h2>
        <div className="text-gray-500 text-center">Nenhuma estatística disponível</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Estatísticas de Auditoria
      </h2>
      
      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <DocumentTextIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-blue-600">
            {stats.total_logs.toLocaleString('pt-BR')}
          </div>
          <div className="text-sm text-blue-800">Total de Logs</div>
        </div>
        
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <UserIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-green-600">
            {stats.logs_today.toLocaleString('pt-BR')}
          </div>
          <div className="text-sm text-green-800">Logs Hoje</div>
        </div>
        
        <div className="text-center p-4 bg-yellow-50 rounded-lg">
          <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-yellow-600">
            {(stats.severity_distribution['CRITICAL'] || 0) + (stats.severity_distribution['HIGH'] || 0)}
          </div>
          <div className="text-sm text-yellow-800">Ações Críticas</div>
        </div>
        
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <ShieldCheckIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-purple-600">
            {stats.top_actors.length}
          </div>
          <div className="text-sm text-purple-800">Usuários Ativos</div>
        </div>
      </div>

      {/* Distribuições */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição por Severidade */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">
            Distribuição por Severidade
          </h3>
          <div className="space-y-2">
            {Object.entries(stats.severity_distribution).map(([severity, count]) => (
              <div key={severity} className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded text-sm font-medium ${getSeverityColor(severity)}`}>
                  {severity}
                </span>
                <span className="text-gray-600">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Atores */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">
            Top Usuários
          </h3>
          <div className="space-y-2">
            {stats.top_actors.slice(0, 5).map((actor, index) => (
              <div key={actor.actor_id} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {index + 1}. {actor.actor_name || actor.actor_id}
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {actor.action_count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 text-center">
        <button
          onClick={fetchStats}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Atualizar estatísticas
        </button>
      </div>
    </div>
  );
}
