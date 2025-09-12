'use client';

import React from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';
import type { BillingConfig as BillingPlanConfig } from '@/types/billing';

interface PricingCardProps {
  plan: BillingPlanConfig & {
    price_formatted: string;
    features: string[];
  };
  isPopular?: boolean;
  onSelect?: (planCode: string) => void;
  currentPlan?: string;
}

export function PricingCard({ plan, isPopular = false, onSelect, currentPlan }: PricingCardProps) {
  const isCurrentPlan = currentPlan === (plan as any).code;
  
  return (
    <div className={`relative rounded-lg shadow-lg p-6 ${
      isPopular 
        ? 'bg-primary-600 text-white border-2 border-primary-500' 
        : 'bg-white text-gray-900 border border-gray-200'
    }`}>
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-medium">
            Mais Popular
          </span>
        </div>
      )}
      
      <div className="text-center">
        <h3 className={`text-lg font-semibold ${
          isPopular ? 'text-white' : 'text-gray-900'
        }`}>
          {(plan as any).code}
        </h3>
        
        <div className="mt-4">
          <span className={`text-4xl font-extrabold ${
            isPopular ? 'text-white' : 'text-gray-900'
          }`}>
            {plan.price_formatted}
          </span>
          <span className={`text-lg ${
            isPopular ? 'text-primary-100' : 'text-gray-500'
          }`}>
            /mês
          </span>
        </div>
        
        <p className={`mt-2 text-sm ${
          isPopular ? 'text-primary-100' : 'text-gray-500'
        }`}>
          Até {(plan as any).limits?.shops || 0} barbearia{(plan as any).limits?.shops > 1 ? 's' : ''} e {(plan as any).limits?.employees || 0} funcionário{(plan as any).limits?.employees > 1 ? 's' : ''}
        </p>
      </div>
      
      <ul className="mt-6 space-y-3">
        {plan.features.map((feature: any, index: number) => (
          <li key={index} className="flex items-start">
            <CheckIcon className={`h-5 w-5 mr-3 mt-0.5 ${
              isPopular ? 'text-primary-200' : 'text-primary-500'
            }`} />
            <span className={`text-sm ${
              isPopular ? 'text-primary-100' : 'text-gray-600'
            }`}>
              {feature}
            </span>
          </li>
        ))}
      </ul>
      
      <div className="mt-8">
        {isCurrentPlan ? (
          <button
            disabled
            className={`w-full py-2 px-4 rounded-md font-medium ${
              isPopular
                ? 'bg-primary-700 text-primary-200 cursor-not-allowed'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            Plano Atual
          </button>
        ) : (
          <button
            onClick={() => onSelect?.((plan as any).code)}
            className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
              isPopular
                ? 'bg-white text-primary-600 hover:bg-primary-50'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            Selecionar Plano
          </button>
        )}
      </div>
    </div>
  );
}


