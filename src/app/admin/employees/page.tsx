'use client';
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/http';
import { useTenant } from '@/components/tenant/use-tenant';
import { toast } from 'react-hot-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Employee { id: string; name: string; role: string }

export default function EmployeesPage(){
  const { tenantId } = useTenant('TENANT_TEST');
  const [items, setItems] = useState<Employee[]>([]);
  const [name, setName] = useState('');
  const [role, setRole] = useState('BARBER');
  const [loading, setLoading] = useState(false);

  async function load(){
    const data = await apiFetch('/api/employees', { tenantId });
    setItems(data);
  }
  useEffect(()=>{ load(); },[tenantId]);

  async function create(){
    if(!name) return toast.error('Nome obrigatório');
    setLoading(true);
    try{
      await apiFetch('/api/employees', { tenantId, init:{ method:'POST', body: JSON.stringify({ barbershopId:'shop_1', name, role }) }});
      setName('');
      await load();
      toast.success('Funcionário criado');
    }catch(e:any){ toast.error(e.message); }
    finally{ setLoading(false); }
  }

  async function remove(id:string){
    try{
      await apiFetch(`/api/employees?id=${id}`, { tenantId, init:{ method:'DELETE' }});
      setItems(prev=>prev.filter(i=>i.id!==id));
    }catch(e:any){ toast.error(e.message); }
  }

  return (
    <Card>
      <CardHeader><CardTitle>Funcionários</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Input placeholder="Nome" value={name} onChange={e=>setName(e.target.value)} />
          <Input placeholder="Cargo" value={role} onChange={e=>setRole(e.target.value)} />
          <Button onClick={create} disabled={loading}>{loading?'Criando...':'Criar'}</Button>
        </div>
        <div className="divide-y border rounded">
          {items.map(emp=> (
            <div key={emp.id} className="flex items-center justify-between p-3">
              <div>
                <div className="font-medium">{emp.name}</div>
                <div className="text-sm text-muted-foreground">{emp.role}</div>
              </div>
              <Button variant="destructive" onClick={()=>remove(emp.id)}>Excluir</Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}










