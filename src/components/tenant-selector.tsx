'use client';

import { useState } from 'react';
import { useTenant } from './providers/tenant-provider';
import { type Tenant, type TenantPlan, type TenantStatus } from '@/types/core';

export function TenantSelector() {
  const { currentTenant, setCurrentTenant } = useTenant();
  const [isOpen, setIsOpen] = useState(false);

  const mockTenants: Tenant[] = [
    {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Barbearia Alfa',
      plan: 'PRO',
      status: 'ACTIVE',
      domain: 'barbearia-alfa.localhost',
      settings: { theme: 'dark', currency: 'BRL' },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'Barbearia Beta',
      plan: 'STARTER',
      status: 'ACTIVE',
      domain: 'barbearia-beta.localhost',
      settings: { theme: 'light', currency: 'BRL' },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      name: 'Barbearia Gama',
      plan: 'SCALE',
      status: 'ACTIVE',
      domain: 'barbearia-gama.localhost',
      settings: { theme: 'dark', currency: 'BRL' },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const getPlanBadge = (plan: TenantPlan) => {
    const planConfig = {
      STARTER: { color: 'bg-gray-100 text-gray-800', label: 'Starter' },
      PRO: { color: 'bg-blue-100 text-blue-800', label: 'Pro' },
      SCALE: { color: 'bg-purple-100 text-purple-800', label: 'Scale' },
    };
    
    const config = planConfig[plan];
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getStatusBadge = (status: TenantStatus) => {
    const statusConfig = {
      ACTIVE: { color: 'bg-green-100 text-green-800', label: 'Ativo' },
      PAST_DUE: { color: 'bg-yellow-100 text-yellow-800', label: 'Vencido' },
      CANCELED: { color: 'bg-red-100 text-red-800', label: 'Cancelado' },
      TRIALING: { color: 'bg-blue-100 text-blue-800', label: 'Teste' },
    };
    
    const config = statusConfig[status];
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="relative mb-8">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full max-w-md mx-auto px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <div className="flex items-center space-x-3">
          <span className="text-gray-700">
            {currentTenant ? currentTenant.name : 'Selecionar Barbearia'}
          </span>
          {currentTenant && (
            <div className="flex space-x-1">
              {getPlanBadge(currentTenant.plan)}
              {getStatusBadge(currentTenant.status)}
            </div>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 w-full max-w-md bg-white border border-gray-300 rounded-lg shadow-lg z-10">
          {mockTenants.map((tenant) => (
            <button
              key={tenant.id}
              onClick={() => {
                setCurrentTenant(tenant);
                setIsOpen(false);
              }}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{tenant.name}</div>
                  <div className="text-sm text-gray-500">{tenant.domain}</div>
                </div>
                <div className="flex flex-col space-y-1">
                  {getPlanBadge(tenant.plan)}
                  {getStatusBadge(tenant.status)}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
