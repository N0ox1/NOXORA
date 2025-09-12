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

interface AppointmentSlot {
  time: string;
  available: boolean;
  employee_id?: string;
}

async function noxoraFetchShop(slug: string) {
  try {
    const res = await fetch(`${process.env.BASE_URL || ''}/api/barbershop/public/${slug}`, { headers: { 'X-Tenant-Id': 'tnt_1' }, cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch {
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
              <div className="text-sm opacity-70">{s.duration_min} min · R$ {(s.price_cents/100).toFixed(2)}</div>
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
  
  const [barbershop, setBarbershop] = useState<any>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<AppointmentSlot[]>([]);
  const [clientInfo, setClientInfo] = useState({
    name: '',
    phone: '',
    email: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);

  // Mock data para desenvolvimento
  useEffect(() => {
    const mockBarbershop = {
      id: 'shop_1',
      name: 'Barber Labs Centro',
      description: 'Barbearia moderna no coração da cidade',
      address: 'Rua das Flores, 123 - Centro',
      phone: '+55 11 3000-0000',
      hours: 'Seg-Sex: 9h-19h, Sáb: 9h-17h',
      slug: slug
    };

    const mockServices: Service[] = [
      {
        id: 'srv_1',
        name: 'Corte Masculino',
        duration_min: 30,
        price_cents: 4500,
        description: 'Corte tradicional masculino com acabamento perfeito',
        is_active: true
      },
      {
        id: 'srv_2',
        name: 'Barba',
        duration_min: 20,
        price_cents: 2500,
        description: 'Acabamento de barba com navalha',
        is_active: true
      },
      {
        id: 'srv_3',
        name: 'Corte + Barba',
        duration_min: 45,
        price_cents: 6500,
        description: 'Combo completo de corte e barba',
        is_active: true
      }
    ];

    const mockEmployees: Employee[] = [
      {
        id: 'emp_1',
        name: 'Rafa',
        role: 'BARBER',
        avatar: '/avatars/rafa.jpg',
        active: true
      },
      {
        id: 'emp_2',
        name: 'João',
        role: 'BARBER',
        avatar: '/avatars/joao.jpg',
        active: true
      }
    ];

    setBarbershop(mockBarbershop);
    setServices(mockServices);
    setEmployees(mockEmployees);
    setIsLoading(false);
  }, [slug]);

  // Gerar slots de horário disponíveis
  useEffect(() => {
    if (selectedDate && selectedService && selectedEmployee) {
      const slots: AppointmentSlot[] = [];
      const startHour = 9;
      const endHour = 19;
      
      for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          slots.push({
            time,
            available: Math.random() > 0.3, // Mock: 70% disponível
            employee_id: selectedEmployee.id
          });
        }
      }
      
      setAvailableSlots(slots);
    }
  }, [selectedDate, selectedService, selectedEmployee]);

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setSelectedEmployee(null);
    setSelectedDate('');
    setSelectedTime('');
  };

  const handleEmployeeSelect = (employee: Employee) => {
    setSelectedEmployee(employee);
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
      // Simular criação de agendamento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert('Agendamento realizado com sucesso! Você receberá uma confirmação em breve.');
      
      // Reset form
      setSelectedService(null);
      setSelectedEmployee(null);
      setSelectedDate('');
      setSelectedTime('');
      setClientInfo({ name: '', phone: '', email: '' });
      
    } catch (error) {
      alert('Erro ao realizar agendamento. Tente novamente.');
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header da Barbearia */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{barbershop.name}</h1>
              <p className="text-gray-600 mt-1">{barbershop.description}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center text-gray-600">
                <PhoneIcon className="h-5 w-5 mr-2" />
                {barbershop.phone}
              </div>
              <div className="flex items-center text-gray-600 mt-1">
                <ClockIcon className="h-5 w-5 mr-2" />
                {barbershop.hours}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Esquerda - Seleção de Serviço e Funcionário */}
          <div className="lg:col-span-1 space-y-6">
            {/* Seleção de Serviço */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Escolha o Serviço</h2>
              <div className="space-y-3">
                {services.map((service) => (
                  <div
                    key={service.id}
                    onClick={() => handleServiceSelect(service)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedService?.id === service.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{service.name}</h3>
                        {service.description && (
                          <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-blue-600">
                          {formatPrice(service.price_cents)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDuration(service.duration_min)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Seleção de Funcionário */}
            {selectedService && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Escolha o Profissional</h2>
                <div className="space-y-3">
                  {employees.filter(emp => emp.active).map((employee) => (
                    <div
                      key={employee.id}
                      onClick={() => handleEmployeeSelect(employee)}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedEmployee?.id === employee.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                          <UserIcon className="h-6 w-6 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{employee.name}</h3>
                          <p className="text-sm text-gray-600">{employee.role}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Seleção de Data */}
            {selectedEmployee && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Escolha a Data</h2>
                <div className="grid grid-cols-7 gap-2">
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
                        className={`p-3 text-center rounded-lg border transition-all ${
                          selectedDate === dateStr
                            ? 'border-blue-500 bg-blue-500 text-white'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-xs font-medium">{dayName}</div>
                        <div className="text-lg font-semibold">{dayNumber}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Coluna Direita - Seleção de Horário e Formulário */}
          <div className="lg:col-span-2 space-y-6">
            {/* Seleção de Horário */}
            {selectedDate && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Horários Disponíveis para {new Date(selectedDate).toLocaleDateString('pt-BR')}
                </h2>
                <div className="grid grid-cols-4 gap-3">
                  {availableSlots.map((slot, index) => (
                    <button
                      key={index}
                      onClick={() => slot.available && handleTimeSelect(slot.time)}
                      disabled={!slot.available}
                      className={`p-3 text-center rounded-lg border transition-all ${
                        !slot.available
                          ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                          : selectedTime === slot.time
                          ? 'border-blue-500 bg-blue-500 text-white'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Formulário de Cliente */}
            {selectedTime && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Seus Dados</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      value={clientInfo.name}
                      onChange={(e) => handleClientInfoChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Seu nome completo"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefone *
                    </label>
                    <input
                      type="tel"
                      value={clientInfo.phone}
                      onChange={(e) => handleClientInfoChange('phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="(11) 90000-0000"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email (opcional)
                    </label>
                    <input
                      type="email"
                      value={clientInfo.email}
                      onChange={(e) => handleClientInfoChange('email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>

                {/* Resumo do Agendamento */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-3">Resumo do Agendamento</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Serviço:</span>
                      <span className="font-medium">{selectedService?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Profissional:</span>
                      <span className="font-medium">{selectedEmployee?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Data:</span>
                      <span className="font-medium">
                        {new Date(selectedDate).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Horário:</span>
                      <span className="font-medium">{selectedTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Duração:</span>
                      <span className="font-medium">{formatDuration(selectedService?.duration_min || 0)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="font-medium">Total:</span>
                      <span className="font-bold text-lg text-blue-600">
                        {formatPrice(selectedService?.price_cents || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Botão de Agendamento */}
                <button
                  onClick={handleBooking}
                  disabled={isBooking || !clientInfo.name || !clientInfo.phone}
                  className="w-full mt-6 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isBooking ? 'Agendando...' : 'Confirmar Agendamento'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
