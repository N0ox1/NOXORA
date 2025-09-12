'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { type Tenant } from '@/types/core';

interface TenantContextType {
  currentTenant: Tenant | null;
  setCurrentTenant: (tenant: Tenant | null) => void;
  isLoading: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Carregar tenant padrão ou baseado no domínio
    const loadDefaultTenant = async () => {
      try {
        // Aqui você pode implementar lógica para detectar o tenant
        // baseado no domínio ou outras estratégias
        const defaultTenant: Tenant = {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'Barbearia Alfa',
          plan: 'PRO',
          status: 'ACTIVE',
          domain: 'barbearia-alfa.localhost',
          settings: { theme: 'dark', currency: 'BRL' },
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        setCurrentTenant(defaultTenant);
      } catch (error) {
        console.error('Erro ao carregar tenant:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDefaultTenant();
  }, []);

  return (
    <TenantContext.Provider value={{ currentTenant, setCurrentTenant, isLoading }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant deve ser usado dentro de um TenantProvider');
  }
  return context;
}
