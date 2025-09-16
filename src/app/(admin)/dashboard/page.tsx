'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserGroupIcon,
  CogIcon,
  CalendarDaysIcon,
  UsersIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { ImageIcon, Globe } from 'lucide-react';

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
  email: string;
  phone: string;
  active: boolean;
}

interface Appointment {
  id: string;
  startAt: string;
  endAt: string;
  status: 'CONFIRMED' | 'CANCELED';
  serviceId: string;
  employeeId: string;
  clientName?: string;
  clientPhone?: string;
  barbershopId: string;
  clients?: { name: string; phone: string };
  service?: { name: string };
  employee?: { name: string };
}

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
}




export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'services' | 'employees' | 'agenda' | 'configurations' | 'clients'>('services');
  const [services, setServices] = useState<Service[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [days, setDays] = useState<number>(7);
  const [filterEmp, setFilterEmp] = useState<string>('all');
  const [filterSvc, setFilterSvc] = useState<string>('all');

  // Estados para modais
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Funções de conversão de preço
  const reaisToCents = (reais: string): number => {
    const cleanValue = reais.replace(',', '.').replace(/[^\d.-]/g, '');
    const value = parseFloat(cleanValue) || 0;
    return Math.round(value * 100);
  };

  const centsToReais = (cents: number): string => {
    return (cents / 100).toFixed(2).replace('.', ',');
  };

  // Estados para formulários
  const [serviceForm, setServiceForm] = useState({
    name: '',
    duration_min: 30,
    price_cents: 0,
    price_reais: '0,00',
    description: '',
    is_active: true
  });

  const [employeeForm, setEmployeeForm] = useState({
    name: '',
    role: 'BARBER',
    email: '',
    phone: '',
    active: true
  });

  // Carregar dados reais do banco
  useEffect(() => {
    loadServices();
    loadEmployees();
    loadAppointments();
    loadClients();
  }, []);

  // Funções para carregar dados reais
  const loadServices = async () => {
    try {
      const response = await fetch('/api/v1/services', {
        headers: {
          'x-tenant-id': 'cmffwm0j20000uaoo2c4ugtvx' // Tenant ID fixo para desenvolvimento
        }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('📋 Dados recebidos da API:', data);
        const mappedServices = data.map((s: any) => ({
          id: s.id,
          name: s.name,
          duration_min: s.durationMin,
          price_cents: s.priceCents,
          description: '',
          is_active: s.isActive
        }));
        console.log('🔄 Serviços mapeados:', mappedServices);
        setServices(mappedServices);
      } else {
        console.error('❌ Erro na resposta da API:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await fetch('/api/v1/employees', {
        headers: {
          'x-tenant-id': 'cmffwm0j20000uaoo2c4ugtvx'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setEmployees(data.map((e: any) => ({
          id: e.id,
          name: e.name,
          role: e.role,
          email: e.email,
          phone: e.phone,
          active: e.active
        })));
      }
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error);
    }
  };

  const loadAppointments = async () => {
    try {
      const startDate = new Date(selectedDate);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + days);

      const qs = new URLSearchParams({
        start: startDate.toISOString(),
        end: endDate.toISOString()
      });

      if (filterEmp !== 'all') qs.set('employeeId', filterEmp);
      if (filterSvc !== 'all') qs.set('serviceId', filterSvc);

      const response = await fetch(`/api/v1/appointments/list?${qs.toString()}`, {
        headers: {
          'x-tenant-id': 'cmffwm0j20000uaoo2c4ugtvx'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const filteredItems = (data.items || []).filter((item: any) =>
          item.status === 'CONFIRMED'
        );
        setAppointments(filteredItems);
      }
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error);
    }
  };

  const loadClients = async () => {
    try {
      const response = await fetch('/api/v1/clients', {
        headers: {
          'x-tenant-id': 'cmffwm0j20000uaoo2c4ugtvx'
        }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('📋 Dados de clientes recebidos:', data);
        setClients(data.map((c: any) => ({
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          createdAt: c.createdAt
        })));
      } else {
        console.error('❌ Erro na resposta da API de clientes:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('❌ Resposta de erro:', errorText);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar clientes:', error);
    }
  };




  // Handlers para Services
  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Garantir que price_cents está atualizado
      const updatedServiceForm = {
        ...serviceForm,
        price_cents: reaisToCents(serviceForm.price_reais)
      };

      if (editingService) {
        // TODO: Implementar edição de serviço via API
        console.log('Edição de serviço não implementada ainda');
      } else {
        // Criar novo serviço no banco
        const response = await fetch('/api/v1/services', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': 'cmffwm0j20000uaoo2c4ugtvx'
          },
          body: JSON.stringify({
            barbershopId: 'cmffwm0ks0002uaoot2x03802', // ID real da barbearia do banco
            name: updatedServiceForm.name,
            durationMin: updatedServiceForm.duration_min,
            priceCents: updatedServiceForm.price_cents,
            isActive: updatedServiceForm.is_active
          })
        });

        if (response.ok) {
          // Recarregar serviços do banco
          await loadServices();
          toast.success('Serviço criado com sucesso!');
        } else {
          const error = await response.json();
          console.error('Erro detalhado:', error);
          if (error.errors) {
            // Erro de validação Zod
            const errorMessages = Object.values(error.errors).flat();
            toast.error(`Erro de validação: ${errorMessages.join(', ')}`);
          } else {
            toast.error(`Erro ao criar serviço: ${error.message || 'Erro desconhecido'}`);
          }
        }
      }

      setShowServiceModal(false);
      setEditingService(null);
      setServiceForm({ name: '', duration_min: 30, price_cents: 0, price_reais: '0,00', description: '', is_active: true });
    } catch (error) {
      console.error('Erro ao salvar serviço:', error);
      alert('Erro ao salvar serviço. Tente novamente.');
    }
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setServiceForm({
      name: service.name,
      duration_min: service.duration_min,
      price_cents: service.price_cents,
      price_reais: centsToReais(service.price_cents),
      description: service.description || '',
      is_active: service.is_active
    });
    setShowServiceModal(true);
  };

  const handleDeleteService = async (serviceId: string) => {
    if (confirm('Tem certeza que deseja excluir este serviço?')) {
      try {
        const response = await fetch(`/api/v1/services?id=${serviceId}`, {
          method: 'DELETE',
          headers: {
            'x-tenant-id': 'cmffwm0j20000uaoo2c4ugtvx'
          }
        });

        if (response.ok) {
          // Recarregar serviços do banco
          await loadServices();
          toast.success('Serviço excluído com sucesso!');
        } else {
          const error = await response.json();
          toast.error(`Erro ao excluir serviço: ${error.message || 'Erro desconhecido'}`);
        }
      } catch (error) {
        console.error('Erro ao excluir serviço:', error);
        toast.error('Erro ao excluir serviço. Tente novamente.');
      }
    }
  };

  // Handlers para Employees
  const handleEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingEmployee) {
      // Editar funcionário existente
      setEmployees(prev => prev.map(e =>
        e.id === editingEmployee.id
          ? { ...employeeForm, id: editingEmployee.id }
          : e
      ));
    } else {
      // Criar novo funcionário
      const newEmployee: Employee = {
        ...employeeForm,
        id: `emp_${Date.now()}`
      };
      setEmployees(prev => [...prev, newEmployee]);
    }

    setShowEmployeeModal(false);
    setEditingEmployee(null);
    setEmployeeForm({ name: '', role: 'BARBER', email: '', phone: '', active: true });
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setEmployeeForm({
      name: employee.name,
      role: employee.role,
      email: employee.email,
      phone: employee.phone,
      active: employee.active
    });
    setShowEmployeeModal(true);
  };

  const handleDeleteEmployee = (employeeId: string) => {
    if (confirm('Tem certeza que deseja excluir este funcionário?')) {
      setEmployees(prev => prev.filter(e => e.id !== employeeId));
    }
  };

  // Utilitários
  const formatPrice = (priceCents: number) => {
    return `R$ ${(priceCents / 100).toFixed(2).replace('.', ',')}`;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h${mins > 0 ? ` ${mins}min` : ''}` : `${mins}min`;
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-100 text-green-800';
      case 'CANCELED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'Confirmado';
      case 'CANCELED': return 'Cancelado';
      default: return status;
    }
  };




  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard Admin</h1>
              <p className="text-gray-600 mt-1">Gerencie sua barbearia</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('services')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'services'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <CogIcon className="h-5 w-5 inline mr-2" />
              Serviços
            </button>
            <button
              onClick={() => setActiveTab('employees')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'employees'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <UserGroupIcon className="h-5 w-5 inline mr-2" />
              Colaboradores
            </button>
            <button
              onClick={() => setActiveTab('agenda')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'agenda'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <CalendarDaysIcon className="h-5 w-5 inline mr-2" />
              Agenda
            </button>
            <button
              onClick={() => setActiveTab('configurations')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'configurations'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <CogIcon className="h-5 w-5 inline mr-2" />
              Configurações
            </button>
            <button
              onClick={() => setActiveTab('clients')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'clients'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <UsersIcon className="h-5 w-5 inline mr-2" />
              Clientes
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'services' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Serviços</h2>
              <button
                onClick={() => setShowServiceModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Novo Serviço
              </button>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Serviço
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duração
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Preço
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {services.map((service) => (
                    <tr key={service.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{service.name}</div>
                          {service.description && (
                            <div className="text-sm text-gray-500">{service.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDuration(service.duration_min)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatPrice(service.price_cents)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${service.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                          }`}>
                          {service.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEditService(service)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteService(service.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'employees' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Colaboradores</h2>
              <button
                onClick={() => setShowEmployeeModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Novo Funcionário
              </button>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Funcionário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cargo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contato
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {employees.map((employee) => (
                    <tr key={employee.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                            <span className="text-sm font-medium text-gray-700">
                              {employee.name.charAt(0)}
                            </span>
                          </div>
                          <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {employee.role}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{employee.email}</div>
                        <div className="text-sm text-gray-500">{employee.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${employee.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                          }`}>
                          {employee.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEditEmployee(employee)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEmployee(employee.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'agenda' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Agenda</h2>
            </div>

            {/* Filtros */}
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Inicial</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dias</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={days}
                    onChange={(e) => setDays(Math.max(1, Math.min(30, Number(e.target.value) || 7)))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Funcionário</label>
                  <select
                    value={filterEmp}
                    onChange={(e) => setFilterEmp(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Todos os funcionários</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Serviço</label>
                  <select
                    value={filterSvc}
                    onChange={(e) => setFilterSvc(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Todos os serviços</option>
                    {services.map(svc => (
                      <option key={svc.id} value={svc.id}>{svc.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <button
                  onClick={loadAppointments}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Recarregar
                </button>
              </div>
            </div>

            {/* Lista de agendamentos */}
            <div className="space-y-4">
              {Array.from({ length: days }).map((_, i) => {
                const currentDate = new Date(selectedDate);
                currentDate.setDate(currentDate.getDate() + i);
                const dateKey = currentDate.toISOString().substring(0, 10);
                const dayAppointments = appointments.filter(apt =>
                  apt.startAt.substring(0, 10) === dateKey
                ).sort((a, b) => a.startAt.localeCompare(b.startAt));

                return (
                  <div key={dateKey} className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900">
                        {formatDate(dateKey)} — {dayAppointments.length} agendamentos
                      </h3>
                    </div>
                    <div className="p-6">
                      {dayAppointments.length === 0 ? (
                        <div className="text-sm text-gray-500">Sem agendamentos</div>
                      ) : (
                        <div className="space-y-3">
                          {dayAppointments.map(appointment => (
                            <div key={appointment.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {formatTime(appointment.startAt)} - {formatTime(appointment.endAt)}
                                  </div>
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {appointment.clients?.name || 'Cliente'}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {appointment.clients?.phone || ''}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-sm text-gray-900">
                                    {appointment.service?.name || 'Serviço'}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {appointment.employee?.name || 'Funcionário'}
                                  </div>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                                    {getStatusText(appointment.status)}
                                  </span>
                                  <button
                                    onClick={() => {
                                      // Implementar cancelamento
                                      console.log('Cancelar agendamento:', appointment.id);
                                    }}
                                    className="text-red-600 hover:text-red-900 text-sm"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'configurations' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Configurações da Barbearia</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Informações Básicas */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Informações Básicas</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Barbearia</label>
                    <input
                      type="text"
                      defaultValue="Barber Labs Centro"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                    <input
                      type="text"
                      defaultValue="barber-labs-centro"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                    <textarea
                      defaultValue="A melhor barbearia do centro da cidade"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Contato */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Contato</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                    <input
                      type="text"
                      defaultValue="Rua Exemplo, 123 - Centro, Cidade"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                    <input
                      type="text"
                      defaultValue="(11) 98765-4321"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      defaultValue="contato@barberlabs.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
                    <input
                      type="text"
                      defaultValue="@barberlabs"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Logo e Banner */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Logo da Barbearia</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Upload do Logo</label>
                      <input
                        type="file"
                        accept="image/*"
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      <p className="text-xs text-gray-500 mt-1">PNG, JPG até 2MB. Recomendado: 200x200px</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Banner */}
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Banner da Barbearia</h3>
                <div className="space-y-4">
                  <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                    <div className="text-center">
                      <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Banner Preview</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Upload do Banner</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG até 5MB. Recomendado: 1200x400px</p>
                  </div>
                </div>
              </div>

              {/* Horário de Funcionamento */}
              <div className="bg-white shadow rounded-lg p-6 lg:col-span-2">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Horário de Funcionamento</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map((day, index) => (
                    <div key={day} className="flex items-center space-x-2">
                      <div className="w-20 text-sm font-medium text-gray-700">{day}</div>
                      <input
                        type="time"
                        defaultValue={index === 6 ? "00:00" : "09:00"}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <span className="text-gray-500">-</span>
                      <input
                        type="time"
                        defaultValue={index === 6 ? "00:00" : index === 5 ? "14:00" : "18:00"}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <input
                        type="checkbox"
                        defaultChecked={index === 6 ? false : true}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Preview da URL Pública */}
              <div className="bg-white shadow rounded-lg p-6 lg:col-span-2">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Preview da URL Pública</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Globe className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">URL da sua barbearia:</span>
                  </div>
                  <code className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    https://noxoraa.vercel.app/b/barber-labs-centro
                  </code>
                  <p className="text-xs text-gray-500 mt-2">
                    Esta é a URL que seus clientes usarão para fazer agendamentos.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Salvar Configurações
              </button>
            </div>
          </div>
        )}

        {activeTab === 'clients' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Clientes</h2>
              <button
                onClick={loadClients}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Recarregar
              </button>
            </div>

            {/* Debug info */}
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Debug:</strong> Total de clientes carregados: {clients.length}
              </p>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
              {clients.length === 0 ? (
                <div className="p-8 text-center">
                  <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum cliente encontrado</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Os clientes aparecerão aqui quando fizerem agendamentos.
                  </p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cliente
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Telefone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data de Cadastro
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {clients.map((client) => (
                      <tr key={client.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                              <span className="text-sm font-medium text-gray-700">
                                {client.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="text-sm font-medium text-gray-900">{client.name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {client.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {client.phone}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(client.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-blue-600 hover:text-blue-900 mr-3">
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-900">
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Modal de Serviço */}
      {showServiceModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingService ? 'Editar Serviço' : 'Novo Serviço'}
              </h3>
              <form onSubmit={handleServiceSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Serviço
                  </label>
                  <input
                    type="text"
                    value={serviceForm.name}
                    onChange={(e) => setServiceForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duração (minutos)
                  </label>
                  <input
                    type="number"
                    value={serviceForm.duration_min}
                    onChange={(e) => setServiceForm(prev => ({ ...prev, duration_min: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="15"
                    step="15"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preço (R$)
                  </label>
                  <input
                    type="text"
                    value={serviceForm.price_reais}
                    onChange={(e) => {
                      const value = e.target.value;
                      setServiceForm(prev => ({
                        ...prev,
                        price_reais: value,
                        price_cents: reaisToCents(value)
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0,00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={serviceForm.description}
                    onChange={(e) => setServiceForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={serviceForm.is_active}
                    onChange={(e) => setServiceForm(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Serviço ativo
                  </label>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowServiceModal(false);
                      setEditingService(null);
                      setServiceForm({ name: '', duration_min: 30, price_cents: 0, price_reais: '0,00', description: '', is_active: true });
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    {editingService ? 'Atualizar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Funcionário */}
      {showEmployeeModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingEmployee ? 'Editar Funcionário' : 'Novo Funcionário'}
              </h3>
              <form onSubmit={handleEmployeeSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={employeeForm.name}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cargo
                  </label>
                  <select
                    value={employeeForm.role}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="BARBER">Barbeiro</option>
                    <option value="RECEPTIONIST">Recepcionista</option>
                    <option value="MANAGER">Gerente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={employeeForm.email}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={employeeForm.phone}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={employeeForm.active}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, active: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Funcionário ativo
                  </label>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEmployeeModal(false);
                      setEditingEmployee(null);
                      setEmployeeForm({ name: '', role: 'BARBER', email: '', phone: '', active: true });
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    {editingEmployee ? 'Atualizar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
