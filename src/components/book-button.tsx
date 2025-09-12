'use client';
import { useState, useTransition } from 'react';

type Props = { serviceId: string; barbershopId?: string; employeeId?: string };

export default function BookButton({ serviceId, barbershopId = 'shop_1', employeeId = 'emp_1' }: Props) {
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center gap-2">
      <button
        className="px-3 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-60"
        disabled={pending}
        onClick={() => {
          setMsg(null);
          start(async () => {
            const startAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
            const res = await fetch('/api/appointments', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'X-Tenant-Id': 'tnt_1' },
              body: JSON.stringify({ barbershop_id: barbershopId, employee_id: employeeId, service_id: serviceId, start_at: startAt })
            });
            setMsg(res.ok ? 'Agendado' : 'Erro ao agendar');
          });
        }}
      >{pending ? 'Agendando...' : 'Agendar'}</button>
      {msg && <span className="text-sm opacity-70">{msg}</span>}
    </div>
  );
}
