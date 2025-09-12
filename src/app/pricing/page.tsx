import React from 'react';
import { PricingGrid } from '@/components/billing/pricing-grid';
import { AddonsSection } from '@/components/billing/addons-section';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <h1 className="text-4xl font-extrabold text-gray-900 text-center">
              Planos e Preços
            </h1>
            <p className="mt-4 text-xl text-gray-600 text-center max-w-3xl mx-auto">
              Escolha o plano ideal para sua barbearia e escale conforme sua necessidade
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="py-12">
        {/* Pricing Grid */}
        <PricingGrid />
        
        {/* Addons Section */}
        <div className="mt-20">
          <AddonsSection />
        </div>

        {/* FAQ Section */}
        <div className="mt-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-extrabold text-gray-900">
                Perguntas Frequentes
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Posso cancelar a qualquer momento?
                </h3>
                <p className="text-gray-600">
                  Sim! Você pode cancelar sua assinatura a qualquer momento sem taxas de cancelamento.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Posso mudar de plano?
                </h3>
                <p className="text-gray-600">
                  Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Há um período de teste?
                </h3>
                <p className="text-gray-600">
                  Oferecemos um período de teste gratuito de 7 dias para todos os planos.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Que métodos de pagamento aceitam?
                </h3>
                <p className="text-gray-600">
                  Aceitamos todos os principais cartões de crédito e débito através do Stripe.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-primary-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-white">
                Pronto para começar?
              </h2>
              <p className="mt-4 text-xl text-primary-100">
                Comece seu período de teste gratuito hoje mesmo
              </p>
              <div className="mt-8">
                <button className="bg-white text-primary-600 px-8 py-3 rounded-md font-medium hover:bg-primary-50 transition-colors">
                  Começar Agora
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


