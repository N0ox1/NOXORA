'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/http';
import { useTenant } from '@/components/tenant/use-tenant';
import { toast } from 'react-hot-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Service { id: string; name: string; durationMin: number; priceCents: number }

export default function ServicesPage() {
  const { tenantId } = useTenant('TENANT_TEST');
  const [items, setItems] = useState<Service[]>([]);
  const [name, setName] = useState('');
  const [durationMin, setDurationMin] = useState<number>(30);
  const [priceReais, setPriceReais] = useState<string>('50,00');
  const [loading, setLoading] = useState(false);

  // Função para converter reais (string) para centavos (number)
  const reaisToCents = (reais: string): number => {
    const cleanValue = reais.replace(',', '.').replace(/[^\d.-]/g, '');
    const value = parseFloat(cleanValue) || 0;
    return Math.round(value * 100);
  };

  // Função para converter centavos (number) para reais (string)
  const centsToReais = (cents: number): string => {
    return (cents / 100).toFixed(2).replace('.', ',');
  };

  async function load() {
    const data = await apiFetch('/api/services', { tenantId });
    setItems(data);
  }
  useEffect(() => { load(); }, [tenantId]);

  async function create() {
    if (!name) return toast.error('Nome obrigatório');
    setLoading(true);
    try {
      const priceCents = reaisToCents(priceReais);
      await apiFetch('/api/services', { tenantId, init: { method: 'POST', body: JSON.stringify({ barbershopId: 'shop_1', name, durationMin, priceCents }) } });
      setName('');
      setPriceReais('50,00');
      await load();
      toast.success('Serviço criado');
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }

  async function remove(id: string) {
    try {
      await apiFetch(`/api/services?id=${id}`, { tenantId, init: { method: 'DELETE' } });
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <Card>
      <CardHeader><CardTitle>Serviços</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <Input placeholder="Nome" value={name} onChange={e => setName(e.target.value)} />
          <Input type="number" placeholder="Duração (min)" value={durationMin || ''} onChange={e => setDurationMin(Number(e.target.value) || 0)} />
          <Input placeholder="Preço (R$)" value={priceReais} onChange={e => setPriceReais(e.target.value)} />
          <Button onClick={create} disabled={loading}>{loading ? 'Criando...' : 'Criar'}</Button>
        </div>
        <div className="divide-y border rounded">
          {items.map(s => (
            <div key={s.id} className="flex items-center justify-between p-3">
              <div>
                <div className="font-medium">{s.name}</div>
                <div className="text-sm text-muted-foreground">{s.durationMin} min · R$ {centsToReais(s.priceCents)}</div>
              </div>
              <Button variant="destructive" onClick={() => remove(s.id)}>Excluir</Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}












