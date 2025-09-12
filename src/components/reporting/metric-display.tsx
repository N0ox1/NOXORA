'use client';

import React, { useState, useEffect } from 'react';
import { ArrowTrendingUpIcon as TrendingUpIcon, ArrowTrendingDownIcon as TrendingDownIcon, MinusIcon } from '@heroicons/react/24/outline';

interface MetricDisplayProps {
  metricId: string;
  title: string;
  tenantId: string;
}

interface MetricData {
  metric: string;
  value: number;
  formatted_value: string;
  metadata?: {
    trend?: 'up' | 'down' | 'stable';
    percentage?: number;
    last_updated: Date;
  };
}

export function MetricDisplay({ metricId, title, tenantId }: MetricDisplayProps) {
  const [metric, setMetric] = useState<MetricData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetric();
  }, [metricId, tenantId]);

  const fetchMetric = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/reporting/metrics/${metricId}?tenant_id=${tenantId}`
      );

      if (!response.ok) {
        throw new Error('Falha ao buscar métrica');
      }

      const result = await response.json();
      setMetric(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUpIcon className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDownIcon className="h-4 w-4 text-red-500" />;
      default:
        return <MinusIcon className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTrendColor = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-8 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-2">{title}</h3>
        <div className="text-red-600 text-sm">
          Erro: {error}
          <button
            onClick={fetchMetric}
            className="ml-2 text-blue-600 hover:text-blue-800 underline"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!metric) {
    return (
      <div className="bg-white rounded-lg border p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-2">{title}</h3>
        <div className="text-gray-500 text-sm">Nenhum dado disponível</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border p-4">
      <h3 className="text-sm font-medium text-gray-900 mb-2">{title}</h3>
      
      <div className="flex items-center justify-between">
        <div className="text-2xl font-bold text-gray-900">
          {metric.formatted_value}
        </div>
        
        {metric.metadata?.trend && (
          <div className="flex items-center space-x-1">
            {getTrendIcon(metric.metadata.trend)}
            {metric.metadata.percentage !== undefined && (
              <span className={`text-sm font-medium ${getTrendColor(metric.metadata.trend)}`}>
                {metric.metadata.percentage.toFixed(1)}%
              </span>
            )}
          </div>
        )}
      </div>

      {metric.metadata?.last_updated && (
        <div className="mt-2 text-xs text-gray-500">
          Atualizado: {new Date(metric.metadata.last_updated).toLocaleTimeString('pt-BR')}
        </div>
      )}

      <button
        onClick={fetchMetric}
        className="mt-3 text-xs text-blue-600 hover:text-blue-800 underline"
      >
        Atualizar
      </button>
    </div>
  );
}
