'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BellIcon, ExclamationTriangleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface QuotaDisplayProps {
  tenantId: string;
}

interface QuotaInfo {
  used: number;
  limit: number;
  exceeded: boolean;
}

export function QuotaDisplay({ tenantId }: QuotaDisplayProps) {
  const [quota, setQuota] = useState<QuotaInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuota = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/notifications/quota', {
        headers: {
          'X-Tenant-Id': tenantId,
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setQuota(data.quota);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar quota');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuota();
  }, [tenantId]);

  const getUsagePercentage = () => {
    if (!quota) return 0;
    return Math.round((quota.used / quota.limit) * 100);
  };

  const getUsageColor = () => {
    const percentage = getUsagePercentage();
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getUsageBadgeVariant = () => {
    const percentage = getUsagePercentage();
    if (percentage >= 90) return 'destructive';
    if (percentage >= 75) return 'secondary';
    return 'default';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BellIcon className="h-5 w-5" />
            <span>Quota de Notificações</span>
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
            <span>Erro ao Carregar Quota</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchQuota} variant="outline">
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!quota) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BellIcon className="h-5 w-5" />
            <span>Quota de Notificações</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Nenhuma informação de quota disponível</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BellIcon className="h-5 w-5" />
          <span>Quota de Notificações</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Status Geral */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Status:</span>
            <Badge variant={getUsageBadgeVariant()}>
              {quota.exceeded ? (
                <span className="flex items-center space-x-1">
                  <ExclamationTriangleIcon className="h-4 w-4" />
                  <span>Limite Excedido</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1">
                  <CheckCircleIcon className="h-4 w-4" />
                  <span>Dentro do Limite</span>
                </span>
              )}
            </Badge>
          </div>

          {/* Uso Atual */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Uso Atual:</span>
              <span className="font-medium">{quota.used} / {quota.limit}</span>
            </div>
            
            {/* Barra de Progresso */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  quota.exceeded ? 'bg-red-500' : 
                  getUsagePercentage() >= 75 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(getUsagePercentage(), 100)}%` }}
              ></div>
            </div>
            
            <div className="text-right">
              <span className={`text-sm font-medium ${getUsageColor()}`}>
                {getUsagePercentage()}%
              </span>
            </div>
          </div>

          {/* Restante */}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Restante:</span>
            <span className={`font-medium ${quota.exceeded ? 'text-red-600' : 'text-green-600'}`}>
              {Math.max(0, quota.limit - quota.used)}
            </span>
          </div>

          {/* Avisos */}
          {quota.exceeded && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center space-x-2">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                <span className="text-sm text-red-800 font-medium">
                  Limite de notificações excedido para este mês
                </span>
              </div>
              <p className="text-sm text-red-700 mt-1">
                Considere fazer upgrade do seu plano para aumentar o limite.
              </p>
            </div>
          )}

          {getUsagePercentage() >= 75 && !quota.exceeded && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-center space-x-2">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                <span className="text-sm text-yellow-800 font-medium">
                  Aproximando-se do limite
                </span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                Você está usando {getUsagePercentage()}% da sua quota mensal.
              </p>
            </div>
          )}

          {/* Botão de Atualizar */}
          <div className="pt-2">
            <Button onClick={fetchQuota} variant="outline" size="sm" className="w-full">
              Atualizar Quota
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


