'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/http';
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

interface Appt { id: string; startAt: string; endAt: string; status: 'PENDING' | 'CONFIRMED' | 'CANCELED'; serviceId: string; employeeId: string; clientName?: string; clientPhone?: string; barbershopId: string }
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

  async function loadServices() { try { const data = await apiFetch('/api/v1/services', { tenantId }); setSvcs(data); } catch { } }
  useEffect(() => { loadServices(); }, [tenantId]);

  async function createAppt() {
    if (!svc || !emp || !cliName || !cliPhone) { toast.error('Preencha todos os campos'); return; }
    try {
      const sel = svcs.find(s => s.id === svc);
      const start = new Date(range.s);
      start.setUTCHours(9, 0, 0, 0); // padrão 09:00
      const end = new Date(start);
      end.setUTCMinutes((sel?.durationMin ?? 60));
      await apiFetch('/api/v1/appointments', {
        tenantId,
        init: {
          method: 'POST', body: JSON.stringify({
            barbershopId: 'cmffwm0ks0002uaoot2x03802', // ID real da barbershop
            serviceId: svc,
            employeeId: emp,
            clientId: 'client-' + Date.now(), // Gerar ID temporário
            scheduledAt: start.toISOString(),
            notes: `Cliente: ${cliName}, Telefone: ${cliPhone}`
          })
        }
      });
      toast.success('Agendamento criado');
      setOpen(false); setSvc(''); setEmp(''); setCliName(''); setCliPhone('');
      await load();
    } catch (e: any) { toast.error(e.message || 'Falha ao criar'); }
  }

  const range = useMemo(() => { const s = startOfDay(new Date(start + 'T00:00:00.000Z')); const e = addDays(s, days); return { s, e }; }, [start, days]);

  async function load() {
    try {
      const qs = new URLSearchParams({ start: toISO(range.s), end: toISO(range.e) });
      if (filterEmp && filterEmp !== 'all') qs.set('employeeId', filterEmp);
      if (filterSvc && filterSvc !== 'all') qs.set('serviceId', filterSvc);
      const data = await apiFetch(`/api/v1/appointments/list?${qs.toString()}`, { tenantId });
      setItems(data.items);
    } catch (e: any) { toast.error(e.message || 'Falha ao carregar'); }
  }
  async function loadEmployees() {
    try { const data = await apiFetch('/api/v1/employees', { tenantId }); setEmployees(data as Employee[]); } catch { }
  }

  useEffect(() => { loadEmployees(); }, [tenantId]);
  useEffect(() => { load(); }, [tenantId, range, filterEmp, filterSvc]);

  const grouped = useMemo(() => { const m: Record<string, Appt[]> = {}; for (const a of items) { const k = a.startAt.substring(0, 10); (m[k] ||= []).push(a); } return m; }, [items]);

  async function cancel(id: string) {
    try {
      await apiFetch('/api/v1/appointments', { tenantId, init: { method: 'PUT', body: JSON.stringify({ id, status: 'CANCELED' }) } });
      toast.success('Agendamento cancelado');
      setItems(prev => prev.map(x => x.id === id ? { ...x, status: 'CANCELED' } : x));
    } catch (e: any) { toast.error(e.message || 'Erro ao cancelar'); }
  }

  function StatusBadge({ s }: { s: Appt['status'] }) { const v = s === 'CONFIRMED' ? 'default' : s === 'PENDING' ? 'secondary' : 'destructive'; return <Badge variant={v as any}>{s}</Badge>; }

  // === APPEND: map visual para status Prisma ===
  function statusVariant(s: 'PENDING' | 'CONFIRMED' | 'CANCELED') {
    if (s === 'CONFIRMED') return 'default';
    if (s === 'PENDING') return 'secondary';
    return 'destructive';
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
                            <div className="font-medium">{a.clientName || 'Cliente'}</div>
                            <div className="text-xs text-muted-foreground">{a.clientPhone || ''}</div>
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
