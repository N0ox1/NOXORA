'use client';

import React from 'react';
import { 
  BuildingOfficeIcon, 
  UsersIcon, 
  CalendarIcon, 
  BellIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { billingService } from '@/lib/billing/billing-service';
import type { BillingPlan } from '@/types/billing';

interface BillingDashboardProps {
  currentPlan: BillingPlan;
  currentUsage: {
    shops: number;
    employees: number;
    appointments: number;
    reminders: number;
  };
  currentAddons?: string[];
}

export function BillingDashboard({ 
  currentPlan, 
  currentUsage, 
  currentAddons = [] 
}: BillingDashboardProps) {
      const plan = billingService.getPlans().find((p: any) => p.code === currentPlan) || null;
  const limits = plan ? plan.limits : null;
  const upgradeRecommendation = null as any;
  const nextPlan = (() => { const plans = billingService.getPlans(); const idx = plans.findIndex((p: any)=>p.code===currentPlan); return idx>=0 && idx<plans.length-1 ? plans[idx+1] : null; })();

  if (!plan || !limits) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">Plano não encontrado</p>
      </div>
    );
  }

  const isShopsExceeded = (limits as any).shops?.exceeded || false;
  const isEmployeesExceeded = (limits as any).employees?.exceeded || false;
  const hasWarnings = isShopsExceeded || isEmployeesExceeded;

  return (
    <div className="space-y-6">
      {/* Current Plan Info */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Plano Atual: {plan.code}
            </h3>
            <p className="text-gray-600">
              R$ {plan.price_month.toFixed(2)}/mês
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Próximo ciclo</p>
            <p className="text-sm font-medium text-gray-900">15 de Janeiro, 2025</p>
          </div>
        </div>
      </div>

      {/* Usage Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className={`p-2 rounded-md ${
              isShopsExceeded ? 'bg-red-100' : 'bg-green-100'
            }`}>
              <BuildingOfficeIcon className={`h-6 w-6 ${
                isShopsExceeded ? 'text-red-600' : 'text-green-600'
              }`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Barbearias</p>
              <p className="text-2xl font-semibold text-gray-900">
                {currentUsage.shops}/{plan.limits.shops}
              </p>
            </div>
          </div>
          {isShopsExceeded && (
            <div className="mt-2 flex items-center text-sm text-red-600">
              <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
              Limite excedido
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className={`p-2 rounded-md ${
              isEmployeesExceeded ? 'bg-red-100' : 'bg-green-100'
            }`}>
              <UsersIcon className={`h-6 w-6 ${
                isEmployeesExceeded ? 'text-red-600' : 'text-green-600'
              }`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Funcionários</p>
              <p className="text-2xl font-semibold text-gray-900">
                {currentUsage.employees}/{plan.limits.employees}
              </p>
            </div>
          </div>
          {isEmployeesExceeded && (
            <div className="mt-2 flex items-center text-sm text-red-600">
              <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
              Limite excedido
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-md bg-blue-100">
              <CalendarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Agendamentos</p>
              <p className="text-2xl font-semibold text-gray-900">
                {currentUsage.appointments}
              </p>
              <p className="text-sm text-gray-500">este mês</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 rounded-md bg-purple-100">
              <BellIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Lembretes</p>
              <p className="text-2xl font-semibold text-gray-900">
                {currentUsage.reminders}
              </p>
              <p className="text-sm text-gray-500">este mês</p>
            </div>
          </div>
        </div>
      </div>

      {/* Warnings and Recommendations */}
      {hasWarnings && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Limites do plano excedidos
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc pl-5 space-y-1">
                  {isShopsExceeded && (
                    <li>Você excedeu o limite de {plan.limits.shops} barbearia(s)</li>
                  )}
                  {isEmployeesExceeded && (
                    <li>Você excedeu o limite de {plan.limits.employees} funcionário(s)</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Recommendation */}
      {upgradeRecommendation && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <CheckCircleIcon className="h-5 w-5 text-blue-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Recomendação de Upgrade
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Considere fazer upgrade para o plano {upgradeRecommendation.code} 
                  (R$ {upgradeRecommendation.price_month.toFixed(2)}/mês) para acomodar seu uso atual.
                </p>
              </div>
              <div className="mt-3">
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
                  Ver Planos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current Addons */}
      {currentAddons.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Addons Ativos
          </h3>
          <div className="space-y-3">
            {currentAddons.map((addonCode) => {
              const addon = billingService.getAddons().find((a: any) => a.code === addonCode);
              if (!addon) return null;
              
              return (
                <div key={addonCode} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div>
                    <p className="font-medium text-gray-900">
                      {addon.code.replace('_', ' ')}
                    </p>
                    <p className="text-sm text-gray-600">
                      {(addon as any).description || addon.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {(addon as any).price_formatted || 'R$ 0,00'}/mês
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Next Plan Info */}
      {nextPlan && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Próximo Plano Disponível
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">
                {nextPlan.code} - R$ {nextPlan.price_month.toFixed(2)}/mês
              </p>
              <p className="text-sm text-gray-600">
                Limites: {nextPlan.limits.shops} barbearias, {nextPlan.limits.employees} funcionários
              </p>
            </div>
            <button className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700">
              Fazer Upgrade
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


