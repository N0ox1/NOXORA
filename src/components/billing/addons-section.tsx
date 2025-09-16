'use client';

import React from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { billingService } from '@/lib/billing/billing-service';

interface AddonsSectionProps {
  currentAddons?: string[];
  onAddonToggle?: (addonCode: string, enabled: boolean) => void;
}

export function AddonsSection({ currentAddons = [], onAddonToggle }: AddonsSectionProps) {
  const addons = billingService.getAddons().map(addon => ({
    ...addon,
    label: addon.name,
    price_formatted: `R$ ${addon.price_month}`,
    description: addon.name
  }));

  const handleAddonToggle = (addonCode: string) => {
    const isCurrentlyEnabled = currentAddons.includes(addonCode);
    onAddonToggle?.(addonCode, !isCurrentlyEnabled);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900">
          Addons Disponíveis
        </h3>
        <p className="mt-2 text-gray-600">
          Adicione funcionalidades extras ao seu plano
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {addons.map((addon: any) => {
          const isEnabled = currentAddons.includes(addon.code);
          
          return (
            <div
              key={addon.code}
              className={`relative rounded-lg border-2 p-6 transition-all ${
                isEnabled
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {addon.code.replace('_', ' ')}
                  </h4>
                  <p className="mt-2 text-sm text-gray-600">
                    {addon.description}
                  </p>
                  <div className="mt-4">
                    <span className="text-2xl font-bold text-primary-600">
                      {addon.price_formatted}
                    </span>
                    <span className="text-gray-500">/mês</span>
                  </div>
                </div>
                
                <button
                  onClick={() => handleAddonToggle(addon.code)}
                  className={`ml-4 p-2 rounded-full transition-colors ${
                    isEnabled
                      ? 'bg-primary-500 text-white hover:bg-primary-600'
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                  }`}
                  title={isEnabled ? 'Remover addon' : 'Adicionar addon'}
                >
                  <PlusIcon className={`h-5 w-5 ${
                    isEnabled ? 'rotate-45' : ''
                  }`} />
                </button>
              </div>
              
              {isEnabled && (
                <div className="mt-4 p-3 bg-primary-100 rounded-md">
                  <p className="text-sm text-primary-800 font-medium">
                    ✓ Addon ativo
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {addons.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            Nenhum addon disponível no momento
          </p>
        </div>
      )}
    </div>
  );
}


