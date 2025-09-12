'use client';

import React from 'react';
import { PricingCard } from './pricing-card';
import { billingService } from '@/lib/billing/billing-service';

interface PricingGridProps {
  currentPlan?: string;
  onPlanSelect?: (planCode: string) => void;
}

export function PricingGrid({ currentPlan, onPlanSelect }: PricingGridProps) {
  const plans = billingService.getPlans();
  
  // Marca o plano PRO como popular
  const popularPlanCode = 'PRO';
  
  const handlePlanSelect = (planCode: string) => {
    console.log(`Plano selecionado: ${planCode}`);
    onPlanSelect?.(planCode);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          Escolha o plano ideal para sua barbearia
        </h2>
        <p className="mt-4 text-lg text-gray-600">
          Comece grátis e escale conforme sua necessidade
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-6">
        {plans.map((plan: any) => (
          <PricingCard
            key={plan.code}
            plan={plan}
            isPopular={plan.code === popularPlanCode}
            currentPlan={currentPlan}
            onSelect={handlePlanSelect}
          />
        ))}
      </div>

      <div className="mt-12 text-center">
        <p className="text-sm text-gray-500">
          Todos os planos incluem suporte por email e atualizações gratuitas
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Cancele a qualquer momento sem taxas de cancelamento
        </p>
      </div>
    </div>
  );
}


