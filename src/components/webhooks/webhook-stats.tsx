'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LinkIcon, 
  ArrowDownIcon, 
  ArrowUpIcon, 
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';

interface WebhookStatsProps {
  tenantId: string;
}

interface WebhookStats {
  totalInbound: number;
  totalOutbound: number;
  successRate: number;
  averageProcessingTime: number;
}

export function WebhookStats({ tenantId }: WebhookStatsProps) {
  const [stats, setStats] = useState<WebhookStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/webhooks/stats', {
        headers: {
          'X-Tenant-Id': tenantId,
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [tenantId]);

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSuccessRateBadgeVariant = (rate: number) => {
    if (rate >= 90) return 'default';
    if (rate >= 75) return 'secondary';
    return 'destructive';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <LinkIcon className="h-5 w-5" />
            <span>Estatísticas de Webhooks</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-red-800">
            <ExclamationTriangleIcon className="h-5 w-5" />
            <span>Erro ao Carregar Estatísticas</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchStats} variant="outline">
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <LinkIcon className="h-5 w-5" />
            <span>Estatísticas de Webhooks</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Nenhuma estatística disponível</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <LinkIcon className="h-5 w-5" />
          <span>Estatísticas de Webhooks</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Resumo Geral */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <ArrowDownIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {stats.totalInbound}
              </div>
              <div className="text-sm text-blue-700">Webhooks Recebidos</div>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <ArrowUpIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-600">
                {stats.totalOutbound}
              </div>
              <div className="text-sm text-green-700">Webhooks Enviados</div>
            </div>
          </div>

          {/* Taxa de Sucesso */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Taxa de Sucesso:</span>
              <Badge variant={getSuccessRateBadgeVariant(stats.successRate)}>
                {stats.successRate}%
              </Badge>
            </div>
            
            {/* Barra de Progresso */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  stats.successRate >= 90 ? 'bg-green-500' : 
                  stats.successRate >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${stats.successRate}%` }}
              ></div>
            </div>
            
            <div className="text-right">
              <span className={`text-sm font-medium ${getSuccessRateColor(stats.successRate)}`}>
                {stats.successRate}% de sucesso
              </span>
            </div>
          </div>

          {/* Tempo de Processamento */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Tempo Médio de Processamento:</span>
              <div className="flex items-center space-x-1">
                <ClockIcon className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">
                  {stats.averageProcessingTime}ms
                </span>
              </div>
            </div>
          </div>

          {/* Status Geral */}
          <div className="pt-2">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <span className="text-sm font-medium text-gray-700">Status:</span>
              <div className="flex items-center space-x-2">
                {stats.successRate >= 90 ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                ) : (
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                )}
                <span className={`text-sm font-medium ${
                  stats.successRate >= 90 ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {stats.successRate >= 90 ? 'Excelente' : 'Atenção Necessária'}
                </span>
              </div>
            </div>
          </div>

          {/* Botão de Atualizar */}
          <div className="pt-2">
            <Button onClick={fetchStats} variant="outline" size="sm" className="w-full">
              Atualizar Estatísticas
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
