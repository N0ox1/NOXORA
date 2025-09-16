'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/http';
import { useTenant } from '@/components/tenant/use-tenant';
import { toast } from 'react-hot-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Client { id: string; name: string; phone: string }

export default function ClientsPage(){
  const { tenantId } = useTenant('TENANT_TEST');
  const [items, setItems] = useState<Client[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  async function load(){
    const data = await apiFetch('/api/clients', { tenantId });
    setItems(data);
  }
  useEffect(()=>{ load(); },[tenantId]);

  async function create(){
    if(!name || !phone) return toast.error('Nome e telefone');
    setLoading(true);
    try{
      await apiFetch('/api/clients', { tenantId, init:{ method:'POST', body: JSON.stringify({ name, phone }) }});
      setName(''); setPhone('');
      await load();
      toast.success('Cliente criado');
    }catch(e:any){ toast.error(e.message); }
    finally{ setLoading(false); }
  }

  async function remove(id:string){
    try{
      await apiFetch(`/api/clients?id=${id}`, { tenantId, init:{ method:'DELETE' }});
      setItems(prev=>prev.filter(i=>i.id!==id));
    }catch(e:any){ toast.error(e.message); }
  }

  return (
    <Card>
      <CardHeader><CardTitle>Clientes</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input placeholder="Nome" value={name} onChange={e=>setName(e.target.value)} />
          <Input placeholder="Telefone" value={phone} onChange={e=>setPhone(e.target.value)} />
          <Button onClick={create} disabled={loading}>{loading?'Criando...':'Criar'}</Button>
        </div>
        <div className="divide-y border rounded">
          {items.map(c=> (
            <div key={c.id} className="flex items-center justify-between p-3">
              <div>
                <div className="font-medium">{c.name}</div>
                <div className="text-sm text-muted-foreground">{c.phone}</div>
              </div>
              <Button variant="destructive" onClick={()=>remove(c.id)}>Excluir</Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}










