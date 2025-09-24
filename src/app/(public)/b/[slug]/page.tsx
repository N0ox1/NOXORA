'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { CalendarDaysIcon, ClockIcon, UserIcon, PhoneIcon } from '@heroicons/react/24/outline';
import BookButton from '@/components/book-button';

interface Service {
  id: string;
  name: string;
  duration_min: number;
  price_cents: number;
  description?: string;
  is_active: boolean;
}

interface Employee {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  active: boolean;
}

interface BarbershopInfo {
  id: string;
  name: string;
  description?: string;
  slug: string;
  tenantId: string;
}

interface AppointmentSlot {
  time: string;
  available: boolean;
  employee_id?: string;
}

interface AvailabilityGroup {
  employeeId: string | null;
  employeeName: string;
  slots: AppointmentSlot[];
}

async function noxoraFetchShop(slug: string) {
  try {
    const res = await fetch(`/api/barbershop/public/${slug}`, { cache: 'no-store' });
    if (!res.ok) {
      console.error('❌ Falha ao carregar barbearia pública:', res.status, res.statusText);
      return null;
    }
    return res.json();
  } catch (e) {
    console.error('❌ Erro ao buscar barbearia pública:', e);
    return null;
  }
}

export async function NoxoraPublicServices({ slug }: { slug: string }) {
  const shop = await noxoraFetchShop(slug);
  if (!shop) return null;
  return (
    <section className="mt-6 space-y-3">
      <h2 className="text-lg font-medium">Serviços</h2>
      <ul className="space-y-3">
        {shop.services?.map((s: any) => (
          <li key={s.id} className="border rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="font-medium">{s.name}</div>
              <div className="text-sm opacity-70">{s.duration_min} min · R$ {(s.price_cents / 100).toFixed(2)}</div>
            </div>
            <BookButton serviceId={s.id} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function BarbershopPage() {
  const params = useParams();
  const slug = params.slug as string;

  // Evitar hydration mismatch: só renderizar após montar no cliente
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [barbershop, setBarbershop] = useState<BarbershopInfo | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employeePreference, setEmployeePreference] = useState<'specific' | 'any'>('any');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<AvailabilityGroup[]>([]);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [lastRandomSeed, setLastRandomSeed] = useState<number>(Date.now());
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [clientInfo, setClientInfo] = useState({
    name: '',
    phone: '',
    email: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);

  // Removidos mocks: sempre usar dados reais da API

  // Carregar dados reais da API pública
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setIsLoading(true);
        const data = await noxoraFetchShop(slug);
        if (!alive) return;
        if (data) {
          setBarbershop({
            id: data.id,
            name: data.name,
            description: data.description,
            slug: data.slug,
            tenantId: data.tenantId
          });
          setServices(data.services || []);
          const barbers = (data.employees || []).filter((emp: Employee) => emp.active && emp.role === 'BARBER');
          setEmployees(barbers);
        } else {
          setBarbershop(null);
          setServices([]);
          setEmployees([]);
        }
      } finally {
        if (alive) setIsLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [slug]);

  // Gerar slots de horário disponíveis
  useEffect(() => {
    if (!selectedDate || !selectedService || !barbershop) {
      setAvailableSlots([]);
      setAvailabilityError(null);
      return;
    }

    let alive = true;
    (async () => {
      try {
        setLoadingSlots(true);

        const employeeIds = employeePreference === 'any'
          ? employees.map(emp => emp.id)
          : selectedEmployee
            ? [selectedEmployee.id]
            : [];

        if (employeeIds.length === 0 && employeePreference === 'any') {
          const params = new URLSearchParams({
            date: selectedDate,
            barbershopId: barbershop.id,
            serviceId: selectedService.id,
          });
          const res = await fetch(`/api/v1/public/availability?${params.toString()}`, {
            cache: 'no-store',
            headers: {
              'x-tenant-id': barbershop.tenantId
            }
          });

          if (!alive) return;

          if (!res.ok) {
            console.error('Erro ao buscar disponibilidade (qualquer barbeiro):', res.status, res.statusText);
            setAvailableSlots([]);
            setAvailabilityError('Não foi possível carregar os horários disponíveis. Tente novamente em instantes.');
            return;
          }

          const data = await res.json();
          const grouped = new Map<string, AppointmentSlot[]>();

          (data.availableSlots || []).forEach((slot: any) => {
            const key = slot.time;
            const list = grouped.get(key) || [];
            list.push({
              time: slot.time,
              available: slot.available,
              employee_id: slot.employeeId || null
            });
            grouped.set(key, list);
          });

          const combined: AvailabilityGroup[] = Array.from(grouped.entries()).map(([time, slots]) => {
            return {
              employeeId: null,
              employeeName: slots.length > 1 ? 'Vários barbeiros' : 'Barbeiro disponível',
              slots: slots.map(slot => ({ ...slot, time }))
            };
          }).sort((a, b) => a.slots[0].time.localeCompare(b.slots[0].time));

          groups.push(...combined);
        } else {
          for (const id of employeeIds) {
            const params = new URLSearchParams({
              date: selectedDate,
              barbershopId: barbershop.id,
              employeeId: id,
              serviceId: selectedService.id,
            });
            const res = await fetch(`/api/v1/public/availability?${params.toString()}`, {
              cache: 'no-store',
              headers: {
                'x-tenant-id': barbershop.tenantId
              }
            });

            if (!alive) return;

            if (!res.ok) {
              console.error('Erro ao buscar disponibilidade:', id, res.status, res.statusText);
              setAvailableSlots([]);
              setAvailabilityError('Não foi possível carregar os horários disponíveis. Tente novamente em instantes.');
              return;
            }

            const data = await res.json();
            const slots = (data.availableSlots || []).map((slot: any) => ({
              time: slot.time,
              available: slot.available,
              employee_id: id
            }));
            const employeeName = employees.find(emp => emp.id === id)?.name || 'Barbeiro disponível';

            groups.push({
              employeeId: id,
              employeeName,
              slots
            });
          }
        }

        setAvailableSlots(groups);
        setAvailabilityError(null);
        setLastRandomSeed(Date.now());
      } catch (error) {
        if (!alive) return;
        console.error('Erro inesperado ao buscar disponibilidade:', error);
        setAvailableSlots([]);
        setAvailabilityError('Não foi possível carregar os horários disponíveis. Verifique sua conexão e tente novamente.');
      } finally {
        if (alive) setLoadingSlots(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [selectedDate, selectedService, selectedEmployee, barbershop, employeePreference, employees]);

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setSelectedEmployee(null);
    setEmployeePreference('any');
    setSelectedDate('');
    setSelectedTime('');
  };

  const handleEmployeeSelect = (employee: Employee) => {
    setEmployeePreference('specific');
    setSelectedEmployee(employee);
    setSelectedDate('');
    setSelectedTime('');
  };

  const handleAnyEmployeeSelect = () => {
    setEmployeePreference('any');
    setSelectedEmployee(null);
    setSelectedDate('');
    setSelectedTime('');
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTime('');
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleClientInfoChange = (field: string, value: string) => {
    setClientInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleBooking = async () => {
    if (!selectedService || !selectedEmployee || !selectedDate || !selectedTime || !clientInfo.name || !clientInfo.phone) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setIsBooking(true);

    try {
      console.log('=== INÍCIO DO AGENDAMENTO ===');
      console.log('Dados do cliente:', clientInfo);
      console.log('Serviço selecionado:', selectedService);
      console.log('Funcionário selecionado:', selectedEmployee);
      console.log('Data selecionada:', selectedDate);
      console.log('Hora selecionada:', selectedTime);

      // 1. Primeiro, criar o cliente
      console.log('Criando cliente...');
      const clientResponse = await fetch('http://localhost:3000/api/v1/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': 'cmffwm0j20000uaoo2c4ugtvx'
        },
        body: JSON.stringify({
          name: clientInfo.name.trim(),
          phone: clientInfo.phone.trim(),
          ...(clientInfo.email && clientInfo.email.trim().length > 0 ? { email: clientInfo.email.trim() } : {})
        })
      });

      if (!clientResponse.ok) {
        const error = await clientResponse.json();
        console.error('Erro ao criar cliente:', {
          status: clientResponse.status,
          statusText: clientResponse.statusText,
          error: error
        });
        throw new Error(`Erro ao criar cliente (${clientResponse.status}): ${error.message || error.code || 'Erro desconhecido'}`);
      }

      const client = await clientResponse.json();
      console.log('Cliente criado com sucesso:', client);

      // 2. Criar o agendamento
      console.log('Criando agendamento...');
      const appointmentData = {
        clientId: client.client.id,
        employeeId: selectedEmployee.id,
        serviceId: selectedService.id,
        barbershopId: 'cmffwm0ks0002uaoot2x03802', // ID real da barbearia
        scheduledAt: new Date(`${selectedDate}T${selectedTime}:00`).toISOString(),
        notes: `Cliente: ${clientInfo.name}, Telefone: ${clientInfo.phone}`
      };
      console.log('Dados do agendamento:', appointmentData);

      const appointmentResponse = await fetch('http://localhost:3000/api/v1/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': 'cmffwm0j20000uaoo2c4ugtvx'
        },
        body: JSON.stringify(appointmentData)
      });

      if (!appointmentResponse.ok) {
        const error = await appointmentResponse.json();
        console.error('Erro ao criar agendamento:', {
          status: appointmentResponse.status,
          statusText: appointmentResponse.statusText,
          error: error
        });
        throw new Error(`Erro ao criar agendamento (${appointmentResponse.status}): ${error.message || error.code || 'Erro desconhecido'}`);
      }

      const appointment = await appointmentResponse.json();
      console.log('Agendamento criado com sucesso:', appointment);

      alert('Agendamento realizado com sucesso! Você receberá uma confirmação em breve.');

      // Reset form
      setSelectedService(null);
      setSelectedEmployee(null);
      setSelectedDate('');
      setSelectedTime('');
      setClientInfo({ name: '', phone: '', email: '' });

    } catch (error: any) {
      console.error('Erro geral ao criar agendamento:', {
        message: error?.message || 'Erro desconhecido',
        stack: error?.stack,
        error: error
      });
      alert(`Erro ao realizar agendamento: ${error?.message || 'Erro desconhecido'}`);
    } finally {
      setIsBooking(false);
    }
  };

  const formatPrice = (priceCents: number) => {
    return `R$ ${(priceCents / 100).toFixed(2).replace('.', ',')}`;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h${mins > 0 ? ` ${mins}min` : ''}` : `${mins}min`;
  };

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#01ABFE]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header da Barbearia */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2 text-white">
              {barbershop?.name}
            </h1>
            <p className="text-gray-300 text-lg mb-8">{barbershop?.description}</p>

            {/* Progress Bar */}
            <div className="flex items-center justify-center space-x-4 mb-8">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${selectedService ? 'bg-[#01ABFE] text-white' : 'bg-gray-600 text-gray-300'
                  }`}>
                  1
                </div>
                <span className="ml-2 text-sm font-medium text-gray-300">Serviço</span>
              </div>
              <div className="w-8 h-0.5 bg-gray-600"></div>
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${selectedEmployee ? 'bg-[#01ABFE] text-white' : 'bg-gray-600 text-gray-300'
                  }`}>
                  2
                </div>
                <span className="ml-2 text-sm font-medium text-gray-300">Barbeiro</span>
              </div>
              <div className="w-8 h-0.5 bg-gray-600"></div>
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${selectedDate && selectedTime ? 'bg-[#01ABFE] text-white' : 'bg-gray-600 text-gray-300'
                  }`}>
                  3
                </div>
                <span className="ml-2 text-sm font-medium text-gray-300">Data & Hora</span>
              </div>
              <div className="w-8 h-0.5 bg-gray-600"></div>
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${clientInfo.name && clientInfo.phone ? 'bg-[#01ABFE] text-white' : 'bg-gray-600 text-gray-300'
                  }`}>
                  4
                </div>
                <span className="ml-2 text-sm font-medium text-gray-300">Resumo</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Etapa 1: Seleção de Serviço */}
        {!selectedService && (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-8">
            <h2 className="text-2xl font-semibold text-white mb-2">Escolha o Serviço</h2>
            <p className="text-gray-400 mb-6">Selecione o serviço desejado</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((service) => (
                <div
                  key={service.id}
                  onClick={() => handleServiceSelect(service)}
                  className="p-6 border border-gray-600 rounded-lg cursor-pointer transition-all hover:scale-105 bg-gray-700 hover:border-[#01ABFE]"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start">
                      <div className="w-12 h-12 bg-[#01ABFE]/20 rounded-lg flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-[#01ABFE]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-lg">{service.name}</h3>
                        {service.description && (
                          <p className="text-gray-400 text-sm mt-1">{service.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-[#01ABFE]">
                        {formatPrice(service.price_cents)}
                      </div>
                      <div className="text-sm text-gray-400">
                        {formatDuration(service.duration_min)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Etapa 2: Seleção de Funcionário */}
        {selectedService && !selectedEmployee && employeePreference === 'any' && (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-8">
            <h2 className="text-2xl font-semibold text-white mb-2">Escolha o Barbeiro</h2>
            <p className="text-gray-400 mb-6">Selecione o profissional ou siga sem preferência</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                onClick={handleAnyEmployeeSelect}
                className={`p-6 border ${employeePreference === 'any' ? 'border-[#01ABFE]' : 'border-gray-600'} rounded-lg cursor-pointer transition-all hover:scale-105 bg-gray-700`}
              >
                <div className="flex items-center">
                  <div className="w-16 h-16 bg-[#01ABFE]/20 rounded-full flex items-center justify-center mr-4">
                    <UserIcon className="h-8 w-8 text-[#01ABFE]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-lg">Sem preferência</h3>
                    <p className="text-gray-400 text-sm">Encontraremos o melhor horário disponível</p>
                  </div>
                </div>
              </div>
              {employees.filter(emp => emp.active).map((employee, idx) => (
                <div
                  key={employee.id}
                  onClick={() => handleEmployeeSelect(employee)}
                  className={`p-6 border ${employeePreference === 'specific' && selectedEmployee?.id === employee.id ? 'border-[#01ABFE]' : 'border-gray-600'} rounded-lg cursor-pointer transition-all hover:scale-105 bg-gray-700`}
                >
                  <div className="flex items-center">
                    <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mr-4">
                      <UserIcon className="h-8 w-8 text-gray-300" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-lg">{employee.name}</h3>
                      <p className="text-gray-400">Barbeiro</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedService && employeePreference === 'specific' && selectedEmployee && !selectedTime && (
          <div className="space-y-6">
            {/* Seleção de Data */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-8">
              <h2 className="text-2xl font-semibold text-white mb-2">Escolha a Data</h2>
              <p className="text-gray-400 mb-6">Selecione o dia desejado</p>
              <div className="grid grid-cols-7 gap-3">
                {Array.from({ length: 14 }, (_, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() + i);
                  const dateStr = date.toISOString().split('T')[0];
                  const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' });
                  const dayNumber = date.getDate();

                  return (
                    <button
                      key={i}
                      onClick={() => handleDateSelect(dateStr)}
                      className={`p-4 text-center rounded-lg border transition-all hover:scale-105 ${selectedDate === dateStr
                        ? 'border-[#01ABFE] bg-[#01ABFE] text-white'
                        : 'border-gray-600 bg-gray-700 hover:border-gray-500 text-white'
                        }`}
                    >
                      <div className="text-xs font-medium">{dayName}</div>
                      <div className="text-lg font-semibold">{dayNumber}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedDate && (
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-8">
                <h2 className="text-2xl font-semibold text-white mb-2">
                  Horários Disponíveis
                </h2>
                <p className="text-gray-400 mb-6">
                  {selectedDate
                    ? `Selecione o horário para ${(() => {
                      const parsed = new Date(selectedDate);
                      return Number.isNaN(parsed.getTime())
                        ? selectedDate
                        : parsed.toLocaleDateString('pt-BR');
                    })()}`
                    : 'Selecione o horário'}
                </p>
                <div className="grid grid-cols-4 gap-3">
                  {loadingSlots && (
                    <div className="col-span-4 text-sm text-gray-300">Carregando horários...</div>
                  )}
                  {availabilityError && !loadingSlots && (
                    <div className="col-span-4 text-sm text-red-400">{availabilityError}</div>
                  )}
                  {!availabilityError && !loadingSlots && availableSlots.length === 0 && (
                    <div className="col-span-4 text-sm text-gray-300">Nenhum horário disponível para este dia.</div>
                  )}
                  {availableSlots.map(group => (
                    <div key={group.employeeId || 'any'} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                      <h3 className="text-white font-medium text-sm mb-3">
                        {group.employeeId ? `Com ${group.employeeName}` : 'Melhor horário disponível'}
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {group.slots.length === 0 && (
                          <span className="col-span-2 text-xs text-gray-400">Sem horários disponíveis.</span>
                        )}
                        {group.slots.map((slot, index) => (
                          <button
                            key={`${group.employeeId || 'any'}-${index}`}
                            onClick={() => {
                              setSelectedTime(slot.time);
                              if (group.employeeId) {
                                setSelectedEmployee(employees.find(emp => emp.id === group.employeeId) || null);
                                setEmployeePreference('specific');
                              } else {
                                const options = slot.employee_id
                                  ? [slot.employee_id]
                                  : employees.map(emp => emp.id);
                                if (options.length > 0) {
                                  const randomIndex = Math.floor((lastRandomSeed + index) % options.length);
                                  const randomId = options[randomIndex];
                                  setSelectedEmployee(employees.find(emp => emp.id === randomId) || null);
                                }
                                setEmployeePreference('specific');
                              }
                            }}
                            className={`p-3 text-center rounded-lg border transition-all hover:scale-105 ${selectedTime === slot.time
                              ? 'border-[#01ABFE] bg-[#01ABFE] text-white'
                              : 'border-gray-600 bg-gray-700 hover:border-gray-500 text-white'}
                            `}
                          >
                            {slot.time}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {selectedService && employeePreference === 'any' && !selectedTime && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-8">
              <h2 className="text-2xl font-semibold text-white mb-2">Escolha a Data</h2>
              <p className="text-gray-400 mb-6">Selecione o dia desejado</p>
              <div className="grid grid-cols-7 gap-3">
                {Array.from({ length: 14 }, (_, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() + i);
                  const dateStr = date.toISOString().split('T')[0];
                  const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' });
                  const dayNumber = date.getDate();

                  return (
                    <button
                      key={i}
                      onClick={() => handleDateSelect(dateStr)}
                      className={`p-4 text-center rounded-lg border transition-all hover:scale-105 ${selectedDate === dateStr
                        ? 'border-[#01ABFE] bg-[#01ABFE] text-white'
                        : 'border-gray-600 bg-gray-700 hover:border-gray-500 text-white'
                        }`}
                    >
                      <div className="text-xs font-medium">{dayName}</div>
                      <div className="text-lg font-semibold">{dayNumber}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedDate && (
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-8">
                <h2 className="text-2xl font-semibold text-white mb-2">
                  Horários Disponíveis
                </h2>
                <p className="text-gray-400 mb-6">
                  {selectedDate
                    ? `Selecione o horário para ${(() => {
                      const parsed = new Date(selectedDate);
                      return Number.isNaN(parsed.getTime())
                        ? selectedDate
                        : parsed.toLocaleDateString('pt-BR');
                    })()}`
                    : 'Selecione o horário'}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {loadingSlots && (
                    <div className="col-span-full text-sm text-gray-300">Carregando horários...</div>
                  )}
                  {availabilityError && !loadingSlots && (
                    <div className="col-span-full text-sm text-red-400">{availabilityError}</div>
                  )}
                  {!availabilityError && !loadingSlots && availableSlots.length === 0 && (
                    <div className="col-span-full text-sm text-gray-300">Nenhum horário disponível para este dia.</div>
                  )}
                  {availableSlots.map(group => (
                    <div key={group.employeeId || 'any'} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                      <h3 className="text-white font-medium text-sm mb-3">
                        {group.employeeId ? `Com ${group.employeeName}` : 'Melhor horário disponível'}
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {group.slots.length === 0 && (
                          <span className="col-span-2 text-xs text-gray-400">Sem horários disponíveis.</span>
                        )}
                        {group.slots.map((slot, index) => (
                          <button
                            key={`${group.employeeId || 'any'}-${index}`}
                            onClick={() => {
                              setSelectedTime(slot.time);
                              if (group.employeeId) {
                                setSelectedEmployee(employees.find(emp => emp.id === group.employeeId) || null);
                                setEmployeePreference('specific');
                              } else {
                                const options = slot.employee_id
                                  ? [slot.employee_id]
                                  : employees.map(emp => emp.id);
                                if (options.length > 0) {
                                  const randomId = options[Math.floor(Math.random() * options.length)];
                                  setSelectedEmployee(employees.find(emp => emp.id === randomId) || null);
                                }
                                setEmployeePreference('specific');
                              }
                            }}
                            className={`p-3 text-center rounded-lg border transition-all hover:scale-105 ${selectedTime === slot.time
                              ? 'border-[#01ABFE] bg-[#01ABFE] text-white'
                              : 'border-gray-600 bg-gray-700 hover:border-gray-500 text-white'}
                            `}
                          >
                            {slot.time}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {selectedService && employeePreference === 'specific' && selectedEmployee && selectedDate && !selectedTime && (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-8">
            <h2 className="text-2xl font-semibold text-white mb-2">
              Horários Disponíveis
            </h2>
            <p className="text-gray-400 mb-6">
              {selectedDate
                ? `Selecione o horário para ${(() => {
                  const parsed = new Date(selectedDate);
                  return Number.isNaN(parsed.getTime())
                    ? selectedDate
                    : parsed.toLocaleDateString('pt-BR');
                })()}`
                : 'Selecione o horário'}
            </p>
            <div className="grid grid-cols-4 gap-3">
              {loadingSlots && (
                <div className="col-span-4 text-sm text-gray-300">Carregando horários...</div>
              )}
              {availabilityError && !loadingSlots && (
                <div className="col-span-4 text-sm text-red-400">{availabilityError}</div>
              )}
              {!availabilityError && !loadingSlots && availableSlots.length === 0 && (
                <div className="col-span-4 text-sm text-gray-300">Nenhum horário disponível para este dia.</div>
              )}
              {availableSlots
                .find(group => group.employeeId === selectedEmployee.id)?.slots.map((slot, index) => (
                  <button
                    key={index}
                    onClick={() => slot.available && handleTimeSelect(slot.time)}
                    disabled={!slot.available}
                    className={`p-3 text-center rounded-lg border transition-all hover:scale-105 ${!slot.available
                      ? 'border-gray-600 text-gray-500 cursor-not-allowed bg-gray-700'
                      : selectedTime === slot.time
                        ? 'border-[#01ABFE] bg-[#01ABFE] text-white'
                        : 'border-gray-600 bg-gray-700 hover:border-gray-500 text-white'}
                    `}
                  >
                    {slot.time}
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Etapa 4: Formulário e Resumo */}
        {selectedTime && (
          <div className="space-y-6">
            {/* Formulário de Cliente */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-8">
              <h2 className="text-2xl font-semibold text-white mb-2">Seus Dados</h2>
              <p className="text-gray-400 mb-6">Preencha suas informações para finalizar o agendamento</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={clientInfo.name}
                    onChange={(e) => handleClientInfoChange('name', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#01ABFE] focus:border-[#01ABFE]"
                    placeholder="Seu nome completo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Telefone *
                  </label>
                  <input
                    type="tel"
                    value={clientInfo.phone}
                    onChange={(e) => handleClientInfoChange('phone', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#01ABFE] focus:border-[#01ABFE]"
                    placeholder="(11) 90000-0000"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email (opcional)
                  </label>
                  <input
                    type="email"
                    value={clientInfo.email}
                    onChange={(e) => handleClientInfoChange('email', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#01ABFE] focus:border-[#01ABFE]"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>
            </div>

            {/* Resumo do Agendamento */}
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-8">
              <h2 className="text-2xl font-semibold text-white mb-2">Resumo do Agendamento</h2>
              <p className="text-gray-400 mb-6">Confira os detalhes antes de confirmar</p>
              <div className="bg-gray-700 rounded-lg p-6">
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Serviço:</span>
                    <span className="font-medium text-white text-lg">{selectedService?.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Profissional:</span>
                    <span className="font-medium text-white">
                      {employeePreference === 'any' && !selectedEmployee
                        ? 'Sem preferência'
                        : selectedEmployee?.name}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Data:</span>
                    <span className="font-medium text-white">
                      {selectedDate
                        ? (() => {
                          const parsed = new Date(selectedDate);
                          return Number.isNaN(parsed.getTime())
                            ? selectedDate
                            : parsed.toLocaleDateString('pt-BR');
                        })()
                        : '--/--/----'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Horário:</span>
                    <span className="font-medium text-white">{selectedTime}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Duração:</span>
                    <span className="font-medium text-white">{formatDuration(selectedService?.duration_min || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-gray-600">
                    <span className="font-semibold text-white text-lg">Total:</span>
                    <span className="font-bold text-2xl text-[#01ABFE]">
                      {formatPrice(selectedService?.price_cents || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botões de Navegação */}
              <div className="flex justify-between mt-8">
                <button
                  onClick={() => {
                    setSelectedTime('');
                    setClientInfo({ name: '', phone: '', email: '' });
                  }}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-500 transition-colors flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Voltar
                </button>
                <button
                  onClick={handleBooking}
                  disabled={isBooking || !clientInfo.name || !clientInfo.phone}
                  className="px-8 py-3 bg-[#01ABFE] text-white rounded-lg font-medium hover:bg-[#01ABFE]/90 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {isBooking ? 'Agendando...' : 'Confirmar Agendamento'}
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}