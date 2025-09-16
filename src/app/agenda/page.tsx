'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTenant } from '@/components/tenant/use-tenant';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast, Toaster } from 'react-hot-toast';
import { addDays, format, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Service {
  id: string;
  name: string;
  durationMin: number;
  priceCents: number;
}

interface Employee {
  id: string;
  name: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

type Step = 'service' | 'barber' | 'datetime' | 'summary';

export default function BookingPage() {
  const router = useRouter();
  const { tenantId } = useTenant('cmffwm0j20000uaoo2c4ugtvx');
  
  // Estados do fluxo
  const [currentStep, setCurrentStep] = useState<Step>('service');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [clientPhone, setClientPhone] = useState<string>('');
  
  // Dados
  const [services, setServices] = useState<Service[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    loadServices();
    loadEmployees();
  }, []);

  // Carregar horários quando data for selecionada
  useEffect(() => {
    if (selectedDate && selectedEmployee) {
      loadTimeSlots();
    }
  }, [selectedDate, selectedEmployee]);

  async function loadServices() {
    try {
      const response = await fetch('/api/v1/services', {
        headers: { 'x-tenant-id': tenantId }
      });
      if (response.ok) {
        const data = await response.json();
        setServices(data);
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

  async function loadTimeSlots() {
    // Simular carregamento de horários disponíveis
    const slots = [];
    for (let hour = 8; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push({
          time,
          available: Math.random() > 0.3 // 70% de chance de estar disponível
        });
      }
    }
    setTimeSlots(slots);
  }

  function formatPrice(cents: number): string {
    return `R$ ${(cents / 100).toFixed(0)}`;
  }

  function formatDuration(minutes: number): string {
    return `${minutes} min`;
  }

  function getStepNumber(step: Step): number {
    const steps = ['service', 'barber', 'datetime', 'summary'];
    return steps.indexOf(step) + 1;
  }

  function canProceed(): boolean {
    switch (currentStep) {
      case 'service':
        return selectedService !== null;
      case 'barber':
        return selectedEmployee !== null;
      case 'datetime':
        return selectedDate !== '' && selectedTime !== '';
      case 'summary':
        return clientName !== '' && clientPhone !== '';
      default:
        return false;
    }
  }

  function handleNext() {
    if (!canProceed()) return;

    switch (currentStep) {
      case 'service':
        setCurrentStep('barber');
        break;
      case 'barber':
        setCurrentStep('datetime');
        break;
      case 'datetime':
        setCurrentStep('summary');
        break;
      case 'summary':
        handleSubmit();
        break;
    }
  }

  function handleBack() {
    switch (currentStep) {
      case 'service':
        router.push('/dashboard');
        break;
      case 'barber':
        setCurrentStep('service');
        break;
      case 'datetime':
        setCurrentStep('barber');
        break;
      case 'summary':
        setCurrentStep('datetime');
        break;
    }
  }

  async function handleSubmit() {
    if (!selectedService || !selectedEmployee || !selectedDate || !selectedTime || !clientName || !clientPhone) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      const startAt = new Date(`${selectedDate}T${selectedTime}:00`);
      const endAt = new Date(startAt.getTime() + selectedService.durationMin * 60000);

      const response = await fetch('/api/v1/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId
        },
        body: JSON.stringify({
          barbershopId: 'cmffwm0ks0002uaoot2x03802',
          serviceId: selectedService.id,
          employeeId: selectedEmployee.id,
          clientId: `client-${Date.now()}`,
          scheduledAt: startAt.toISOString(),
          notes: `Cliente: ${clientName}, Telefone: ${clientPhone}`
        })
      });

      if (response.ok) {
        toast.success('Agendamento realizado com sucesso!');
        router.push('/dashboard');
      } else {
        const error = await response.json();
        toast.error(`Erro: ${error.message || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      toast.error('Erro ao criar agendamento');
    } finally {
      setLoading(false);
    }
  }

  const steps = [
    { id: 'service', label: 'Serviço', icon: '✂️' },
    { id: 'barber', label: 'Barbeiro', icon: '👨‍💼' },
    { id: 'datetime', label: 'Data & Hora', icon: '📅' },
    { id: 'summary', label: 'Resumo', icon: '✅' }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Toaster />
      
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-2">
              Barbearia <span className="text-yellow-400">Moderna</span>
            </h1>
            <p className="text-gray-300 text-lg">
              Agende seu horário de forma rápida e fácil
            </p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex justify-center space-x-8">
            {steps.map((step, index) => {
              const isActive = currentStep === step.id;
              const isCompleted = getStepNumber(currentStep) > getStepNumber(step.id as Step);
              
              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mb-2
                    ${isActive ? 'bg-yellow-400 text-gray-900' : 
                      isCompleted ? 'bg-green-500 text-white' : 
                      'bg-gray-600 text-gray-400'}
                  `}>
                    {isCompleted ? '✓' : step.icon}
                  </div>
                  <span className={`text-sm font-medium ${
                    isActive ? 'text-yellow-400' : 
                    isCompleted ? 'text-green-400' : 
                    'text-gray-400'
                  }`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-8">
            
            {/* Step 1: Service Selection */}
            {currentStep === 'service' && (
              <div>
                <h2 className="text-2xl font-bold mb-2">Escolha o Serviço</h2>
                <p className="text-gray-400 mb-8">Selecione o serviço desejado</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {services.map((service) => (
                    <Card 
                      key={service.id}
                      className={`
                        cursor-pointer transition-all duration-200 hover:scale-105
                        ${selectedService?.id === service.id 
                          ? 'border-yellow-400 bg-yellow-400/10' 
                          : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                        }
                      `}
                      onClick={() => setSelectedService(service)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="text-3xl">✂️</div>
                          {service.name === 'Corte + Barba' && (
                            <Badge className="bg-yellow-400 text-gray-900">Popular</Badge>
                          )}
                        </div>
                        <h3 className="text-xl font-bold mb-2">{service.name}</h3>
                        <div className="flex justify-between items-center">
                          <span className="text-2xl font-bold text-yellow-400">
                            {formatPrice(service.priceCents)}
                          </span>
                          <span className="text-gray-400">
                            {formatDuration(service.durationMin)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Barber Selection */}
            {currentStep === 'barber' && (
              <div>
                <h2 className="text-2xl font-bold mb-2">Escolha o Barbeiro</h2>
                <p className="text-gray-400 mb-8">Selecione o profissional</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {employees.map((employee) => (
                    <Card 
                      key={employee.id}
                      className={`
                        cursor-pointer transition-all duration-200 hover:scale-105
                        ${selectedEmployee?.id === employee.id 
                          ? 'border-yellow-400 bg-yellow-400/10' 
                          : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                        }
                      `}
                      onClick={() => setSelectedEmployee(employee)}
                    >
                      <CardContent className="p-6">
                        <div className="text-3xl mb-4">👨‍💼</div>
                        <h3 className="text-xl font-bold">{employee.name}</h3>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Date & Time Selection */}
            {currentStep === 'datetime' && (
              <div>
                <h2 className="text-2xl font-bold mb-2">Data & Hora</h2>
                <p className="text-gray-400 mb-8">Escolha quando deseja ser atendido</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Date Selection */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Selecione a Data</h3>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full p-4 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                    />
                  </div>
                  
                  {/* Time Selection */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Selecione o Horário</h3>
                    <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                      {timeSlots.map((slot) => (
                        <button
                          key={slot.time}
                          disabled={!slot.available}
                          onClick={() => setSelectedTime(slot.time)}
                          className={`
                            p-3 rounded-lg text-sm font-medium transition-all
                            ${!slot.available 
                              ? 'bg-gray-600 text-gray-500 cursor-not-allowed' 
                              : selectedTime === slot.time
                                ? 'bg-yellow-400 text-gray-900'
                                : 'bg-gray-700 text-white hover:bg-gray-600'
                            }
                          `}
                        >
                          {slot.time}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Summary */}
            {currentStep === 'summary' && (
              <div>
                <h2 className="text-2xl font-bold mb-2">Resumo do Agendamento</h2>
                <p className="text-gray-400 mb-8">Confira os dados antes de confirmar</p>
                
                <div className="space-y-6">
                  {/* Service Summary */}
                  <div className="bg-gray-700 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Serviço</h3>
                    <div className="flex justify-between items-center">
                      <span>{selectedService?.name}</span>
                      <span className="text-yellow-400 font-bold">
                        {selectedService && formatPrice(selectedService.priceCents)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      Duração: {selectedService && formatDuration(selectedService.durationMin)}
                    </div>
                  </div>

                  {/* Employee Summary */}
                  <div className="bg-gray-700 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Barbeiro</h3>
                    <span>{selectedEmployee?.name}</span>
                  </div>

                  {/* Date & Time Summary */}
                  <div className="bg-gray-700 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Data & Hora</h3>
                    <span>
                      {selectedDate && format(new Date(selectedDate), 'dd/MM/yyyy', { locale: ptBR })} às {selectedTime}
                    </span>
                  </div>

                  {/* Client Info */}
                  <div className="bg-gray-700 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">Seus Dados</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Nome</label>
                        <input
                          type="text"
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          className="w-full p-3 bg-gray-600 border border-gray-500 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                          placeholder="Seu nome completo"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">Telefone</label>
                        <input
                          type="tel"
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                          className="w-full p-3 bg-gray-600 border border-gray-500 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                          placeholder="(11) 99999-9999"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-700">
              <Button
                onClick={handleBack}
                variant="outline"
                className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
              >
                ← Voltar
              </Button>
              
              <Button
                onClick={handleNext}
                disabled={!canProceed() || loading}
                className="bg-yellow-400 text-gray-900 hover:bg-yellow-500 font-semibold px-8"
              >
                {loading ? 'Processando...' : 
                 currentStep === 'summary' ? 'Confirmar Agendamento' : 'Continuar →'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}