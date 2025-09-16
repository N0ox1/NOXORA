'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
// Removido apiFetch - usando fetch direto
import { useTenant } from '@/components/tenant/use-tenant';
import { toast } from 'react-hot-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Client { id: string; name: string; phone: string }

export default function ClientsPage() {
  const router = useRouter();
  const { tenantId } = useTenant('cmffwm0j20000uaoo2c4ugtvx');
  const [items, setItems] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    try {
      console.log('🔄 Carregando clientes...');
      const response = await fetch('/api/v1/clients', {
        headers: {
          'x-tenant-id': tenantId
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📋 Clientes carregados:', data);
        setItems(data);
      } else {
        console.error('❌ Erro na resposta:', response.status);
        toast.error('Erro ao carregar clientes');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar clientes:', error);
      toast.error('Erro ao carregar clientes');
    }
  }
  useEffect(() => { load(); }, [tenantId]);


  async function remove(id: string) {
    try {
      const response = await fetch(`/api/v1/clients/${id}`, {
        method: 'DELETE',
        headers: {
          'x-tenant-id': tenantId
        }
      });

      if (response.ok) {
        setItems(prev => prev.filter(i => i.id !== id));
        toast.success('Cliente removido com sucesso!');
      } else {
        toast.error('Erro ao remover cliente');
      }
    } catch (e: any) {
      console.error('Erro ao remover cliente:', e);
      toast.error(e.message);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com navegação */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
              className="flex items-center space-x-2"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Voltar ao Dashboard</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
              <p className="text-sm text-gray-600">Gerencie os clientes da barbearia</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Clientes Cadastrados</CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Os clientes são cadastrados automaticamente quando fazem agendamentos na página pública da barbearia.
            </p>
            <div className="mt-4">
              <Button
                onClick={() => window.open('/b/default-barbershop', '_blank')}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Ver Página Pública da Barbearia
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="divide-y border rounded">
              {items.map(c => (
                <div key={c.id} className="flex items-center justify-between p-3">
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-sm text-muted-foreground">{c.phone}</div>
                  </div>
                  <Button variant="destructive" onClick={() => remove(c.id)}>Excluir</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}











