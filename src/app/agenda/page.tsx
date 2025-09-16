'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
// Removido apiFetch - usando fetch direto
import { useTenant } from '@/components/tenant/use-tenant';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast, Toaster } from 'react-hot-toast';
import { startOfDay, addDays, toISO, fmtHM } from '@/lib/datetime';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
// === APPEND: imports para modal ===
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface Appt { id: string; startAt: string; endAt: string; status: 'CONFIRMED' | 'CANCELED'; serviceId: string; employeeId: string; clientName?: string; clientPhone?: string; barbershopId: string }
interface Employee { id: string; name: string }

export default function AgendaPage() {
  const router = useRouter();
  const { tenantId } = useTenant('cmffwm0j20000uaoo2c4ugtvx');
  const [start, setStart] = useState<string>(() => new Date().toISOString().substring(0, 10));
  const [days, setDays] = useState<number>(7);
  const [items, setItems] = useState<Appt[]>([]);
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeId, setEmployeeId] = useState<string>('');
  // estado do modal e formulário
  const [open, setOpen] = useState(false);
  const [svc, setSvc] = useState('');
  const [emp, setEmp] = useState('');
  const [cliName, setCliName] = useState('');
  const [cliPhone, setCliPhone] = useState('');
  const [svcs, setSvcs] = useState<{ id: string; name: string; durationMin: number }[]>([]);
  // === APPEND: estado de filtros de listagem ===
  const [filterEmp, setFilterEmp] = useState<string>('all');
  const [filterSvc, setFilterSvc] = useState<string>('all');

  async function loadServices() {
    try {
      const response = await fetch('/api/v1/services', {
        headers: { 'x-tenant-id': tenantId }
      });
      if (response.ok) {
        const data = await response.json();
        setSvcs(data);
      }
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
    }
  }

  async function loadEmployees() {
    try {
      const response = await fetch('/api/v1/employees', {
        headers: { 'x-tenant-id': tenantId }
      });
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error);
    }
  }

  async function load() {
    setLoading(true);
    try {
      const startDate = new Date(start);
      const endDate = addDays(startDate, days);

      const qs = new URLSearchParams({
        start: startOfDay(startDate).toISOString(),
        end: startOfDay(endDate).toISOString()
      });

      if (filterEmp !== 'all') qs.set('employeeId', filterEmp);
      if (filterSvc !== 'all') qs.set('serviceId', filterSvc);

      const response = await fetch(`/api/v1/appointments/list?${qs.toString()}`, {
        headers: { 'x-tenant-id': tenantId }
      });

      if (response.ok) {
        const data = await response.json();
        // Filtrar agendamentos cancelados - mostrar apenas CONFIRMED
        const filteredItems = (data.items || []).filter((item: any) =>
          item.status === 'CONFIRMED'
        );
        setItems(filteredItems);
      } else {
        toast.error('Erro ao carregar agendamentos');
      }
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
      toast.error('Erro ao carregar agendamentos');
    } finally {
      setLoading(false);
    }
  }

  async function createAppt() {
    if (!svc || !emp || !cliName || !cliPhone) {
      toast.error('Preencha todos os campos');
      return;
    }

    try {
      const startDate = new Date(start);
      const response = await fetch('/api/v1/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId
        },
        body: JSON.stringify({
          barbershopId: 'cmffwm0ks0002uaoot2x03802', // ID real da barbershop
          serviceId: svc,
          employeeId: emp,
          clientId: 'client-' + Date.now(), // Gerar ID temporário
          scheduledAt: startDate.toISOString(),
          notes: `Cliente: ${cliName}, Telefone: ${cliPhone}`
        })
      });

      if (response.ok) {
        toast.success('Agendamento criado com sucesso!');
        setOpen(false);
        setSvc('');
        setEmp('');
        setCliName('');
        setCliPhone('');
        load();
      } else {
        const error = await response.json();
        toast.error(`Erro: ${error.message || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      toast.error('Erro ao criar agendamento');
    }
  }

  async function cancel(id: string) {
    try {
      const response = await fetch(`/api/v1/appointments/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId
        }
      });

      if (response.ok) {
        toast.success('Agendamento cancelado!');
        load();
      } else {
        const error = await response.json();
        toast.error(`Erro ao cancelar agendamento: ${error.message || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error);
      toast.error('Erro ao cancelar agendamento');
    }
  }

  useEffect(() => {
    loadServices();
    loadEmployees();
    load();
  }, []);

  const range = useMemo(() => ({
    s: startOfDay(new Date(start)),
    e: addDays(startOfDay(new Date(start)), days)
  }), [start, days]);

  const grouped = useMemo(() => {
    const groups: Record<string, Appt[]> = {};
    items.forEach(item => {
      const key = item.startAt.substring(0, 10);
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return groups;
  }, [items]);

  function StatusBadge({ s }: { s: string }) {
    if (s === 'CONFIRMED') return <Badge className="bg-green-500">Confirmado</Badge>;
    if (s === 'CANCELED') return <Badge className="bg-red-500">Cancelado</Badge>;
    return <Badge className="bg-yellow-500">Pendente</Badge>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header com navegação */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
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
                <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
                <p className="text-sm text-gray-600">Gerencie os agendamentos da barbearia</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl p-6 space-y-6">
        <Toaster />
        <Card>
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle>Filtros e Período</CardTitle>
            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
              <div className="min-w-[220px]">
                <Select value={filterSvc} onValueChange={setFilterSvc}>
                  <SelectTrigger><SelectValue placeholder="Filtrar por serviço" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os serviços</SelectItem>
                    {svcs.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="min-w-[220px]">
                <Select value={filterEmp} onValueChange={setFilterEmp}>
                  <SelectTrigger><SelectValue placeholder="Filtrar por funcionário" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os funcionários</SelectItem>
                    {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button>Novo agendamento</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar agendamento</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-3 py-2">
                    <div className="grid gap-1">
                      <Label>Serviço</Label>
                      <Select value={svc} onValueChange={setSvc}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {svcs.map(s => <SelectItem key={s.id} value={s.id}>{s.name} · {s.durationMin}m</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-1">
                      <Label>Funcionário</Label>
                      <Select value={emp} onValueChange={setEmp}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="grid gap-1"><Label>Cliente</Label><Input value={cliName} onChange={e => setCliName(e.target.value)} placeholder="Nome" /></div>
                      <div className="grid gap-1"><Label>Telefone</Label><Input value={cliPhone} onChange={e => setCliPhone(e.target.value)} placeholder="+5511999999999" /></div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={createAppt}>Criar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="md:col-span-2">
              <div className="text-xs text-muted-foreground mb-1">Funcionário (ID)</div>
              <Input
                placeholder="Deixe vazio para todos"
                value={employeeId}
                onChange={e => setEmployeeId(e.target.value)}
              />
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Início</div>
              <Input type="date" value={start} onChange={e => setStart(e.target.value)} />
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Dias</div>
              <Input type="number" min={1} max={30} value={days} onChange={e => setDays(Math.max(1, Math.min(30, Number(e.target.value) || 7)))} />
            </div>
            <div className="flex items-end">
              <Button onClick={load} disabled={loading}>{loading ? 'Carregando...' : 'Recarregar'}</Button>
            </div>
          </CardContent>
        </Card>

        {Array.from({ length: days }).map((_, i) => {
          const d = addDays(range.s, i); const key = d.toISOString().substring(0, 10);
          const list = (grouped[key] || []).sort((a, b) => a.startAt.localeCompare(b.startAt));
          return (
            <Card key={key}>
              <CardHeader><CardTitle>{key} — {list.length} agendamentos</CardTitle></CardHeader>
              <CardContent>
                {list.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Sem agendamentos</div>
                ) : (
                  <div className="divide-y border rounded">
                    {list.map(a => {
                      const s = new Date(a.startAt), e = new Date(a.endAt); return (
                        <div key={a.id} className="p-3 grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                          <div className="md:col-span-3 font-medium">{fmtHM(s)}–{fmtHM(e)}</div>
                          <div className="md:col-span-4">
                            <div className="font-medium">{a.clients?.name || 'Cliente'}</div>
                            <div className="text-xs text-muted-foreground">{a.clients?.phone || ''}</div>
                          </div>
                          <div className="md:col-span-2"><StatusBadge s={a.status} /></div>
                          <div className="md:col-span-3 flex gap-2 justify-end">
                            <Button variant="destructive" disabled={a.status === 'CANCELED'} onClick={() => cancel(a.id)}>Cancelar</Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}