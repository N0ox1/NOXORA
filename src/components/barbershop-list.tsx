'use client';

import { useTenant } from './providers/tenant-provider';
import { type Barbershop, type Employee, type Service } from '@/types/core';

export function BarbershopList() {
  const { currentTenant, isLoading } = useTenant();

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Carregando...</p>
      </div>
    );
  }

  if (!currentTenant) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Selecione uma barbearia para continuar</p>
      </div>
    );
  }

  // Mock data - em produção isso viria da API
  const mockBarbershops: Barbershop[] = [
    {
      id: '660e8400-e29b-41d4-a716-446655440000',
      tenantId: currentTenant.id,
      slug: 'central',
      name: 'Barbearia Central',
      description: 'Barbearia tradicional no centro da cidade',
      address: 'Rua das Flores, 123 - Centro',
      phone: '(11) 99999-9999',
      email: 'central@barbearia-alfa.com',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440001',
      tenantId: currentTenant.id,
      slug: 'moderna',
      name: 'Barbearia Moderna',
      description: 'Barbearia com estilo contemporâneo',
      address: 'Av. Paulista, 456 - Bela Vista',
      phone: '(11) 88888-8888',
      email: 'moderna@barbearia-alfa.com',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockEmployees: Employee[] = [
    {
      id: '770e8400-e29b-41d4-a716-446655440000',
      tenantId: currentTenant.id,
      barbershopId: '660e8400-e29b-41d4-a716-446655440000',
      name: 'João Silva',
      role: 'OWNER',
      email: 'joao@barbearia-alfa.com',
      phone: '(11) 99999-1111',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '770e8400-e29b-41d4-a716-446655440001',
      tenantId: currentTenant.id,
      barbershopId: '660e8400-e29b-41d4-a716-446655440000',
      name: 'Pedro Santos',
      role: 'BARBER',
      email: 'pedro@barbearia-alfa.com',
      phone: '(11) 99999-2222',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockServices: Service[] = [
    {
      id: '880e8400-e29b-41d4-a716-446655440000',
      tenantId: currentTenant.id,
      barbershopId: '660e8400-e29b-41d4-a716-446655440000',
      name: 'Corte Masculino',
      description: 'Corte tradicional masculino',
      durationMin: 30,
      priceCents: 3500,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '880e8400-e29b-41d4-a716-446655440001',
      tenantId: currentTenant.id,
      barbershopId: '660e8400-e29b-41d4-a716-446655440000',
      name: 'Barba',
      description: 'Fazer a barba',
      durationMin: 20,
      priceCents: 2500,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      OWNER: { color: 'bg-purple-100 text-purple-800', label: 'Proprietário' },
      MANAGER: { color: 'bg-blue-100 text-blue-800', label: 'Gerente' },
      BARBER: { color: 'bg-green-100 text-green-800', label: 'Barbeiro' },
      ASSISTANT: { color: 'bg-gray-100 text-gray-800', label: 'Assistente' },
    };
    
    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.ASSISTANT;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatPrice = (priceCents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(priceCents / 100);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Barbearias de {currentTenant.name}
        </h2>
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span>Plano: {currentTenant.plan}</span>
          <span>Status: {currentTenant.status}</span>
          <span>Domínio: {currentTenant.domain}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {mockBarbershops.map((barbershop) => {
          const barbershopEmployees = mockEmployees.filter(
            (emp) => emp.barbershopId === barbershop.id
          );
          const barbershopServices = mockServices.filter(
            (service) => service.barbershopId === barbershop.id
          );

          return (
            <div
              key={barbershop.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">
                    {barbershop.name}
                  </h3>
                  <p className="text-gray-600 text-sm">{barbershop.description}</p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  {barbershop.isActive ? 'Ativa' : 'Inativa'}
                </span>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-gray-500">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {barbershop.address}
                </div>

                <div className="flex items-center text-sm text-gray-500">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {barbershop.phone}
                </div>

                {barbershop.email && (
                  <div className="flex items-center text-sm text-gray-500">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {barbershop.email}
                  </div>
                )}
              </div>

              {/* Funcionários */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Funcionários</h4>
                <div className="space-y-2">
                  {barbershopEmployees.map((employee) => (
                    <div key={employee.id} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{employee.name}</span>
                      {getRoleBadge(employee.role)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Serviços */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Serviços</h4>
                <div className="space-y-2">
                  {barbershopServices.map((service) => (
                    <div key={service.id} className="flex items-center justify-between">
                      <div>
                        <span className="text-sm text-gray-600">{service.name}</span>
                        <span className="text-xs text-gray-400 ml-2">
                          {formatDuration(service.durationMin)}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {formatPrice(service.priceCents)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                  Agendar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
