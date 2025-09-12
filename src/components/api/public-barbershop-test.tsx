'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PublicBarbershopResponse } from '@/types/api';

export function PublicBarbershopTest() {
  const [slug, setSlug] = useState('barbearia-alfa');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PublicBarbershopResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchBarbershop = async () => {
    if (!slug.trim()) {
      setError('Slug é obrigatório');
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await fetch(`/api/barbershop/public/${slug}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Teste da API Pública de Barbearias</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Digite o slug da barbearia"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchBarbershop()}
            />
            <Button 
              onClick={fetchBarbershop}
              disabled={loading}
            >
              {loading ? 'Carregando...' : 'Buscar'}
            </Button>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 font-medium">Erro:</p>
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {data && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <h3 className="font-semibold text-green-800 mb-2">
                  Barbearia: {data.name}
                </h3>
                <div className="text-sm text-green-700 space-y-1">
                  <p><strong>Slug:</strong> {data.slug}</p>
                  <p><strong>Status:</strong> {data.is_active ? 'Ativa' : 'Inativa'}</p>
                  {data.description && <p><strong>Descrição:</strong> {data.description}</p>}
                  {data.address && <p><strong>Endereço:</strong> {data.address}</p>}
                  {data.phone && <p><strong>Telefone:</strong> {data.phone}</p>}
                  {data.email && <p><strong>Email:</strong> {data.email}</p>}
                </div>
              </div>

              {data.services.length > 0 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <h4 className="font-semibold text-blue-800 mb-2">
                    Serviços ({data.services.length})
                  </h4>
                  <div className="space-y-2">
                    {data.services.map((service) => (
                      <div key={service.id} className="text-sm text-blue-700">
                        <p><strong>{service.name}</strong></p>
                        <p>Duração: {service.duration_min} min</p>
                        <p>Preço: R$ {(service.price_cents / 100).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.employees.length > 0 && (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-md">
                  <h4 className="font-semibold text-purple-800 mb-2">
                    Funcionários ({data.employees.length})
                  </h4>
                  <div className="space-y-2">
                    {data.employees.map((employee) => (
                      <div key={employee.id} className="text-sm text-purple-700">
                        <p><strong>{employee.name}</strong></p>
                        <p>Função: {employee.role}</p>
                        <p>Status: {employee.is_active ? 'Ativo' : 'Inativo'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


