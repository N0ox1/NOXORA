'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CogIcon,
  UsersIcon,
  MagnifyingGlassIcon,
  WrenchScrewdriverIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  CreditCardIcon,
  StarIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { ImageIcon, Globe, TrendingUp, DollarSign, Users, BarChart3 } from 'lucide-react';
import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import SubscriptionModal from '@/components/subscriptions/subscription-modal';

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
  const [activeTab, setActiveTab] = useState<'services' | 'employees' | 'agenda' | 'configurations' | 'clients' | 'subscriptions' | 'plan'>('services');
  const [services, setServices] = useState<Service[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [days, setDays] = useState<number>(7);
  const [filterEmp, setFilterEmp] = useState<string>('all');
  const [filterSvc, setFilterSvc] = useState<string>('all');
  const [agendaHeight, setAgendaHeight] = useState<number>(900);

  // Função para formatar horário HH:mm
  const formatTime = (h: string | number, m: string | number): string => {
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
  };

  // Função para formatar string de horário
  const formatTimeString = (timeString: string): string => {
    if (!timeString) {
      return timeString;
    }

    // Se tem ':', formatar normalmente
    if (timeString.includes(':')) {
      const [hours, minutes] = timeString.split(':');
      if (hours && minutes) {
        return formatTime(hours, minutes);
      }
    }

    // Se não tem ':', assumir que é só horas e adicionar ':00'
    if (timeString.length <= 2) {
      return formatTime(timeString, '0');
    }

    // Se tem 3 dígitos sem ':', assumir HMM e converter para 0H:MM
    if (timeString.length === 3 && !timeString.includes(':')) {
      const hours = timeString.slice(0, 1);
      const minutes = timeString.slice(1);
      return formatTime(hours, minutes);
    }

    // Se tem 4 dígitos sem ':', assumir HHMM e converter para HH:MM
    if (timeString.length === 4 && !timeString.includes(':')) {
      const hours = timeString.slice(0, 2);
      const minutes = timeString.slice(2);
      return formatTime(hours, minutes);
    }

    return timeString;
  };

  // Máscara: mantém ':' fixo e aceita até 4 dígitos (HHMM)
  const maskHHmm = (raw: string): string => {
    const digits = raw.replace(/\D/g, '').slice(0, 4);
    const hours = digits.slice(0, 2);
    const minutes = digits.slice(2, 4);

    if (hours.length === 0 && minutes.length === 0) {
      return '';
    }

    // Monta valor mantendo ':' fixo; permite estados intermediários (ex: 09:, 09:3)
    return `${hours}${':'}${minutes}`;
  };

  const isCompleteHHmm = (value: string): boolean => {
    return /^\d{2}:\d{2}$/.test(value);
  };

  const allTimesComplete = (): boolean => {
    const values = Object.values(configurations.openingHours);
    return values.every(v => v.closed || (isCompleteHHmm(v.open) && isCompleteHHmm(v.close)));
  };

  const dayTimesComplete = (day: string): boolean => {
    const dayData = configurations.openingHours[day as keyof typeof configurations.openingHours];
    if (!dayData) return false;
    return dayData.closed || (isCompleteHHmm(dayData.open) && isCompleteHHmm(dayData.close));
  };

  // Função para obter horários de funcionamento do dia selecionado
  const getOperatingHours = () => {
    const [year, month, day] = selectedDate.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const dayOfWeek = date.getDay(); // 0 = domingo, 1 = segunda, etc.

    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek];
    const dayConfig = configurations.openingHours[dayName as keyof typeof configurations.openingHours];

    if (dayConfig.closed) {
      return { startHour: 0, endHour: 0, isClosed: true };
    }

    const startHour = parseInt(dayConfig.open.split(':')[0]);
    const endHour = parseInt(dayConfig.close.split(':')[0]);

    return { startHour, endHour, isClosed: false };
  };

  // Estados para configurações
  const [configurations, setConfigurations] = useState({
    name: '',
    slug: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    instagram: '',
    logoFile: null as File | null,
    bannerFile: null as File | null,
    logoUrl: '',
    bannerUrl: '',
    openingHours: {
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '18:00', closed: false },
      friday: { open: '09:00', close: '18:00', closed: false },
      saturday: { open: '09:00', close: '14:00', closed: false },
      sunday: { open: '00:00', close: '00:00', closed: true },
    }
  });
  const [savingConfig, setSavingConfig] = useState(false);
  const [imagesToRemove, setImagesToRemove] = useState<Set<string>>(new Set());
  const [isRemovingImages, setIsRemovingImages] = useState(false);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  const instagramRef = useRef<string>('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [lastEdited, setLastEdited] = useState<{ day: string; field: 'open' | 'close' } | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [userInfo, setUserInfo] = useState<{
    tenantId: string;
    barbershopId: string;
    tenantPlan?: 'STARTER' | 'PRO' | 'SCALE';
    tenantStatus?: 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'TRIALING';
    tenantCreatedAt?: string;
  } | null>(null);
  const [trialTimeLeft, setTrialTimeLeft] = useState<{ days: number; hours: number; expired: boolean } | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Função para calcular tempo restante do trial
  const calculateTrialTimeLeft = (createdAt: string) => {
    const trialDays = 5;
    const createdAtDate = new Date(createdAt);
    const now = new Date();
    const trialEndTime = new Date(createdAtDate.getTime() + (trialDays * 24 * 60 * 60 * 1000));
    const timeLeft = trialEndTime.getTime() - now.getTime();

    if (timeLeft <= 0) {
      return { days: 0, hours: 0, expired: true };
    }

    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    return { days, hours, expired: false };
  };

  // useEffect para atualizar contagem regressiva em tempo real
  useEffect(() => {
    if (!userInfo?.tenantCreatedAt) return;

    const updateTrialTime = () => {
      const timeLeft = calculateTrialTimeLeft(userInfo.tenantCreatedAt!);
      setTrialTimeLeft(timeLeft);
    };

    // Atualizar imediatamente
    updateTrialTime();

    // Atualizar a cada minuto
    const interval = setInterval(updateTrialTime, 60000);

    return () => clearInterval(interval);
  }, [userInfo?.tenantCreatedAt]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Estados para assinaturas
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<any | null>(null);
  const [isLoadingSubscriptions, setIsLoadingSubscriptions] = useState(false);

  // CSS para garantir uso de toda a largura
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .dashboard-container {
        width: 100vw !important;
        max-width: none !important;
      }
        .dashboard-content {
          width: calc(100vw - 288px) !important;
          max-width: none !important;
          min-width: 0 !important;
          flex: 1 !important;
        }
    `;
    document.head.appendChild(style);
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  // Cleanup do timeout de auto-save
  useEffect(() => {
    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, [autoSaveTimeout]);

  // Carregar aba ativa do localStorage após hidratação
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTab = localStorage.getItem('activeTab') as any;
      if (savedTab) {
        setActiveTab(savedTab);
      }
    }
  }, []);

  // Salvar aba ativa no localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('activeTab', activeTab);
    }
  }, [activeTab]);

  // Debug de renderização
  useEffect(() => {
    console.log('🔍 Renderização logo:', {
      logoUrl: configurations.logoUrl,
      logoFile: configurations.logoFile,
      showRemoveButton: !!configurations.logoUrl
    });
  }, [configurations.logoUrl, configurations.logoFile]);

  useEffect(() => {
    console.log('🔍 Renderização banner:', {
      bannerUrl: configurations.bannerUrl,
      bannerFile: configurations.bannerFile,
      showRemoveButton: !!configurations.bannerUrl
    });
  }, [configurations.bannerUrl, configurations.bannerFile]);

  // Estados para modais
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Estados para modal de confirmação
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
    loadUserInfo();
  }, []);

  useEffect(() => {
    if (userInfo) {
      console.log('🔄 useEffect userInfo executado - carregando dados...', { isRemovingImages });
      setIsLoadingData(true);

      // Carregar todos os dados em paralelo para melhor performance
      Promise.all([
        loadServices(),
        loadEmployees(),
        loadAppointments(),
        loadClients(),
        loadConfigurations(),
        loadSubscriptions()
      ]).then(() => {
        setIsLoadingData(false);
        setLastUpdate(new Date());
      }).catch((error) => {
        console.error('Erro ao carregar dados:', error);
        setIsLoadingData(false);
      });
    }
  }, [userInfo]);

  // Atualização em tempo real via Server-Sent Events
  useEffect(() => {
    if (!userInfo) return;

    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connect = () => {
      if (eventSource) {
        eventSource.close();
      }

      eventSource = new EventSource(`/api/v1/realtime?tenantId=${userInfo.tenantId}`);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'appointment_created') {
            // Apenas recarregar agendamentos silenciosamente
            loadAppointments();
          }
        } catch (error) {
          console.error('Erro ao processar evento em tempo real:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('Erro na conexão em tempo real:', error);
        eventSource?.close();

        // Reconectar após 10 segundos apenas se não estiver fechando
        if (!reconnectTimeout) {
          reconnectTimeout = setTimeout(() => {
            reconnectTimeout = null;
            connect();
          }, 10000);
        }
      };

      eventSource.onopen = () => {
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
          reconnectTimeout = null;
        }
      };
    };

    connect();

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [userInfo]);


  // Funções para gerenciar assinaturas
  const loadSubscriptions = async () => {
    if (!userInfo) return;

    setIsLoadingSubscriptions(true);
    try {
      const response = await fetch('/api/v1/subscriptions', {
        headers: {
          'x-tenant-id': userInfo.tenantId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data);
      } else {
        console.error('Erro ao carregar assinaturas');
      }
    } catch (error) {
      console.error('Erro ao carregar assinaturas:', error);
    } finally {
      setIsLoadingSubscriptions(false);
    }
  };

  const handleCreateSubscription = async (data: any) => {
    if (!userInfo) return;

    try {
      const response = await fetch('/api/v1/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': userInfo.tenantId,
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await loadSubscriptions();
        toast.success('Assinatura criada com sucesso!');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erro ao criar assinatura');
      }
    } catch (error) {
      console.error('Erro ao criar assinatura:', error);
      toast.error('Erro ao criar assinatura');
    }
  };

  const handleUpdateSubscription = async (data: any) => {
    if (!userInfo || !editingSubscription) return;

    try {
      const response = await fetch(`/api/v1/subscriptions/${editingSubscription.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': userInfo.tenantId,
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await loadSubscriptions();
        toast.success('Assinatura atualizada com sucesso!');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erro ao atualizar assinatura');
      }
    } catch (error) {
      console.error('Erro ao atualizar assinatura:', error);
      toast.error('Erro ao atualizar assinatura');
    }
  };

  const handleSaveSubscription = async (data: any) => {
    if (editingSubscription) {
      await handleUpdateSubscription(data);
    } else {
      await handleCreateSubscription(data);
    }
  };

  const openCreateSubscription = () => {
    setEditingSubscription(null);
    setShowSubscriptionModal(true);
  };

  const openEditSubscription = (subscription: any) => {
    setEditingSubscription(subscription);
    setShowSubscriptionModal(true);
  };

  const handleDeleteSubscription = async (subscription: any) => {
    if (!userInfo) return;
    try {
      const res = await fetch(`/api/v1/subscriptions/${subscription.id}`, {
        method: 'DELETE',
        headers: {
          'x-tenant-id': userInfo.tenantId,
        }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.message || 'Erro ao excluir assinatura';
        toast.error(msg);
        return;
      }
      toast.success('Assinatura excluída com sucesso!');
      await loadSubscriptions();
    } catch (err) {
      console.error('Erro ao excluir assinatura:', err);
      toast.error('Erro ao excluir assinatura');
    }
  };

  // Função para atualizar dados manualmente
  const refreshData = async () => {
    if (!userInfo) return;

    setIsLoadingData(true);
    try {
      await Promise.all([
        loadServices(),
        loadEmployees(),
        loadAppointments(),
        loadClients(),
        loadConfigurations(),
        loadSubscriptions()
      ]);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Função específica para atualizar agenda
  const refreshAgenda = async () => {
    if (!userInfo) return;

    setIsLoadingData(true);
    try {
      await Promise.all([
        loadAppointments(),
        loadConfigurations()
      ]);
      const updateTime = new Date();
      setLastUpdate(updateTime);
      console.log('Agenda atualizada em:', updateTime.toLocaleString('pt-BR'));
      toast.success('Agenda atualizada!');
    } catch (error) {
      console.error('Erro ao atualizar agenda:', error);
      toast.error('Erro ao atualizar agenda');
    } finally {
      setIsLoadingData(false);
    }
  };

  // Funções para carregar dados reais
  const loadUserInfo = async () => {
    try {
      console.log('🔍 Carregando informações do usuário...');

      // Tentar obter token do localStorage primeiro
      const token = localStorage.getItem('access_token');

      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/v1/auth/me', {
        credentials: 'include',
        headers
      });

      if (response.ok) {
        const data = await response.json();
        console.log('👤 Usuário carregado:', data);
        setUserInfo({
          tenantId: data.user.tenantId,
          barbershopId: data.user.barbershopId,
          tenantPlan: data.tenant?.plan,
          tenantStatus: data.tenant?.status,
          tenantCreatedAt: data.tenant?.createdAt
        });
      } else {
        console.error('Erro ao carregar informações do usuário:', response.status, response.statusText);
        if (response.status === 401) {
          // Sessão inválida/expirada: exigir login novamente
          window.location.href = '/login';
          return;
        }
        throw new Error('Falha ao carregar usuário');
      }
    } catch (error) {
      console.error('Erro ao carregar informações do usuário:', error);
      // Redirecionar para login se não for possível obter usuário
      window.location.href = '/login';
    }
  };

  const loadServices = async () => {
    if (!userInfo) return;

    try {
      const response = await fetch('/api/v1/services', {
        headers: {
          'x-tenant-id': userInfo?.tenantId || ''
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        const mappedServices = data.map((s: any) => ({
          id: s.id,
          name: s.name,
          duration_min: s.durationMin,
          price_cents: s.priceCents,
          description: '',
          is_active: s.isActive
        }));
        setServices(mappedServices);
      } else {
        console.error('Erro ao carregar serviços');
      }
    } catch (error) {
      console.error('Erro ao carregar serviços:', error);
    }
  };

  const loadEmployees = async () => {
    if (!userInfo) return;

    try {
      const response = await fetch('/api/v1/employees', {
        headers: {
          'x-tenant-id': userInfo?.tenantId || ''
        },
        credentials: 'include'
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
    if (!userInfo) return;

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
          'x-tenant-id': userInfo?.tenantId || ''
        },
        credentials: 'include'
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
    if (!userInfo) return;

    try {
      const response = await fetch('/api/v1/clients', {
        headers: {
          'x-tenant-id': userInfo?.tenantId || ''
        },
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
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
            'x-tenant-id': userInfo?.tenantId || ''
          },
          body: JSON.stringify({
            barbershopId: userInfo?.barbershopId || '',
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
            'x-tenant-id': userInfo?.tenantId || ''
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
  const handleEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Verificar limite de barbeiros apenas para criação de novos barbeiros
      if (!editingEmployee && employeeForm.role === 'BARBER') {
        const currentBarbers = (employees || []).filter(e => e.role === 'BARBER' && e.active);
        if (currentBarbers.length >= 15) {
          toast.error('Limite máximo de 15 barbeiros atingido! Não é possível criar mais barbeiros.');
          return;
        }
      }

      if (editingEmployee) {
        // Editar funcionário existente
        const response = await fetch(`/api/v1/employees/${editingEmployee.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': userInfo?.tenantId || ''
          },
          body: JSON.stringify(employeeForm)
        });

        if (!response.ok) {
          throw new Error('Erro ao atualizar funcionário');
        }

        toast.success('Funcionário atualizado com sucesso!');
      } else {
        // Criar novo funcionário
        const response = await fetch('/api/v1/employees', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': userInfo?.tenantId || ''
          },
          body: JSON.stringify({
            ...employeeForm,
            barbershopId: userInfo?.barbershopId || ''
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erro ao criar funcionário');
        }

        toast.success('Funcionário criado com sucesso!');
      }

      // Recarregar lista de funcionários
      await loadEmployees();

      setShowEmployeeModal(false);
      setEditingEmployee(null);
      setEmployeeForm({ name: '', role: 'BARBER', email: '', phone: '', active: true });
    } catch (error) {
      console.error('Erro ao salvar funcionário:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar funcionário');
    }
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

  const handleDeleteEmployee = (employee: Employee) => {
    setEmployeeToDelete(employee);
    setShowDeleteModal(true);
  };

  const confirmDeleteEmployee = async () => {
    if (!employeeToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/v1/employees/${employeeToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'x-tenant-id': userInfo?.tenantId || ''
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao excluir funcionário');
      }

      toast.success('Funcionário excluído com sucesso!');

      // Recarregar lista de funcionários
      await loadEmployees();

      // Fechar modal
      setShowDeleteModal(false);
      setEmployeeToDelete(null);
    } catch (error) {
      console.error('Erro ao excluir funcionário:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao excluir funcionário');
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDeleteEmployee = () => {
    setShowDeleteModal(false);
    setEmployeeToDelete(null);
    setIsDeleting(false);
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

  // Funções para configurações
  const handleConfigChange = (field: string, value: any) => {
    console.log('📝 handleConfigChange chamado:', { field, value });
    setConfigurations(prev => ({
      ...prev,
      [field]: value
    }));

    // Atualizar ref para Instagram
    if (field === 'instagram') {
      instagramRef.current = value;
      console.log('📱 Instagram ref atualizada:', value);
    }

    triggerAutoSave();
  };

  const handleFileChange = async (field: 'logoFile' | 'bannerFile', file: File | null) => {
    console.log('📁 handleFileChange chamado:', { field, file: file?.name });

    setConfigurations(prev => ({
      ...prev,
      [field]: file
    }));

    // Remover da lista de remoção se uma nova imagem for selecionada
    if (file) {
      const type = field === 'logoFile' ? 'logo' : 'banner';
      setImagesToRemove(prev => {
        const newSet = new Set(prev);
        newSet.delete(type);
        return newSet;
      });

      // Criar preview imediato da imagem selecionada
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const urlField = field === 'logoFile' ? 'logoUrl' : 'bannerUrl';
        console.log('🖼️ Preview criado:', { urlField, result: result.substring(0, 50) + '...' });
        setConfigurations(prev => ({
          ...prev,
          [urlField]: result
        }));
      };
      reader.readAsDataURL(file);

      // Fazer upload imediato da imagem
      try {
        const uploadedUrl = await uploadImage(file, type);
        if (uploadedUrl) {
          const urlField = field === 'logoFile' ? 'logoUrl' : 'bannerUrl';
          console.log('✅ Upload concluído:', { urlField, uploadedUrl });
          setConfigurations(prev => ({
            ...prev,
            [urlField]: uploadedUrl
          }));
          toast.success('Imagem carregada automaticamente!');

          // Salvar automaticamente após upload
          console.log('💾 Salvando automaticamente após upload...');
          setTimeout(() => {
            saveConfigurations(true, undefined, uploadedUrl, type === 'logo' ? 'logo' : 'banner');
          }, 100);
        }
      } catch (error) {
        console.error('Erro no upload automático:', error);
      }
    }
  };

  // Função para fazer upload de imagem
  const uploadImage = async (file: File, type: 'logo' | 'banner') => {
    if (!userInfo) return null;

    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', type);

    try {
      const uploadHeaders: any = { 'x-tenant-id': userInfo.tenantId || '' };
      try { const at = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null; if (at) uploadHeaders['Authorization'] = `Bearer ${at}`; } catch { }
      const response = await fetch('/api/v1/barbershop/upload-image', {
        method: 'POST',
        headers: uploadHeaders,
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        let serverMessage = 'Erro ao fazer upload da imagem';
        try {
          const data = await response.json();
          if (data?.error) serverMessage = data.error;
        } catch (_) {
          // ignore parse error and use default message
        }
        throw new Error(serverMessage);
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Erro no upload:', error);
      const message = error instanceof Error ? error.message : 'Erro ao fazer upload da imagem';
      toast.error(message);
      return null;
    }
  };

  // Função para remover imagem
  const removeImage = (type: 'logo' | 'banner') => {
    console.log('🗑️ removeImage chamado:', { type });

    // Marcar para remoção
    setImagesToRemove(prev => {
      const newSet = new Set(prev);
      newSet.add(type);
      console.log('➕ Adicionando à lista de remoção:', { type, newSet: Array.from(newSet) });
      return newSet;
    });
    setIsRemovingImages(true);

    // Limpar a URL e arquivo imediatamente
    const urlField = type === 'logo' ? 'logoUrl' : 'bannerUrl';
    console.log('🧹 Limpando estado local:', { urlField });

    setConfigurations(prev => ({
      ...prev,
      [`${type}File`]: null,
      [urlField]: ''
    }));

    // Limpar o input de arquivo
    if (type === 'logo' && logoInputRef.current) {
      logoInputRef.current.value = '';
    } else if (type === 'banner' && bannerInputRef.current) {
      bannerInputRef.current.value = '';
    }

    // Aguardar um tick para garantir que o estado seja atualizado
    setTimeout(() => {
      console.log('⏰ Executando auto-save após remoção...');
      // Chamar saveConfigurations diretamente com o tipo marcado para remoção
      saveConfigurations(true, type);
    }, 0);

    toast.success('Imagem removida!');
  };

  // Slug acompanha EXATAMENTE o nome digitado (sem normalizações)
  const generateSlug = (name: string) => (name ?? '');

  // Função de auto-save com debounce
  const triggerAutoSave = () => {
    console.log('⏰ triggerAutoSave chamado');

    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    const timeout = setTimeout(async () => {
      // Usar ref para capturar o valor atual do Instagram
      const currentInstagram = instagramRef.current;
      console.log('⏰ Auto-save executando...', {
        imagesToRemove: Array.from(imagesToRemove),
        lastEdited,
        currentInstagram,
        configurationsInstagram: configurations.instagram
      });
      if (lastEdited) {
        if (dayTimesComplete(lastEdited.day)) {
          await saveConfigurations(true, undefined, undefined, undefined, currentInstagram); // true = auto-save mode
        } else {
          console.log('⏭️ Auto-save adiado: dia editado incompleto', lastEdited);
        }
      } else if (allTimesComplete()) {
        await saveConfigurations(true, undefined, undefined, undefined, currentInstagram);
      } else {
        console.log('⏭️ Auto-save adiado: horários incompletos');
      }
    }, 2000); // 2 segundos de delay

    setAutoSaveTimeout(timeout);
  };

  const handleSlugChange = (name: string) => {
    // Atualiza imediatamente o input sem salvar enquanto digita
    const newSlug = generateSlug(name);
    setConfigurations(prev => ({ ...prev, name, slug: newSlug }));
  };

  const normalizeInstagramUrl = (value: string): string => {
    if (!value) return '';
    const trimmed = value.trim();
    // já é URL
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    // remove @ e espaços
    const handle = trimmed.replace(/^@+/, '').split(/[\s/]/)[0];
    return `https://instagram.com/${handle}`;
  };

  // Carregar configurações
  const loadConfigurations = async () => {
    if (!userInfo) return;

    console.log('🔄 Carregando configurações...', new Error().stack);
    try {
      const headersLoad: any = { 'x-tenant-id': userInfo?.tenantId || '' };
      try { const at = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null; if (at) headersLoad['Authorization'] = `Bearer ${at}`; } catch { }
      const response = await fetch('/api/v1/barbershop/settings', {
        headers: headersLoad,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao carregar configurações');
      }

      const data = await response.json();

      console.log('📊 Dados carregados do servidor:', {
        name: data.name,
        slug: data.slug,
        description: data.description,
        address: data.address,
        phone: data.phone,
        email: data.email,
        instagram: data.instagram,
        instagramType: typeof data.instagram,
        logoUrl: data.logoUrl,
        bannerUrl: data.bannerUrl,
        workingHours: data.workingHours
      });
      console.log('⏰ Horários de funcionamento do servidor:', data.workingHours);

      console.log('🖼️ URLs de imagem do servidor:', {
        logoUrl: data.logoUrl,
        bannerUrl: data.bannerUrl,
        logoUrlType: typeof data.logoUrl,
        bannerUrlType: typeof data.bannerUrl
      });

      // Parse workingHours se for string
      const workingHours = typeof data.workingHours === 'string'
        ? JSON.parse(data.workingHours)
        : data.workingHours;

      // Só atualizar se não houver mudanças locais pendentes
      const hasLocalChanges = configurations.logoFile || configurations.bannerFile || imagesToRemove.size > 0 || isRemovingImages;

      console.log('🔍 Verificando mudanças locais:', {
        hasLocalChanges,
        logoFile: !!configurations.logoFile,
        bannerFile: !!configurations.bannerFile,
        imagesToRemove: Array.from(imagesToRemove),
        isRemovingImages,
        currentLogoUrl: configurations.logoUrl,
        currentBannerUrl: configurations.bannerUrl
      });

      if (!hasLocalChanges) {
        console.log('✅ Atualizando configurações do servidor...');
        setConfigurations(prev => {
          const safeString = (v: any, fallback: string) => (typeof v === 'string' ? v : fallback);
          const newConfig = {
            ...prev,
            name: safeString(data.name, prev.name || ''),
            slug: safeString(data.slug, prev.slug || ''),
            description: safeString(data.description, prev.description || ''),
            address: safeString(data.address, prev.address || ''),
            phone: safeString(data.phone, prev.phone || ''),
            email: safeString(data.email, prev.email || ''),
            instagram: safeString(data.instagram, prev.instagram || ''),
            // Atualizar URLs do servidor sem permitir null
            logoUrl: safeString(data.logoUrl, prev.logoUrl || ''),
            bannerUrl: safeString(data.bannerUrl, prev.bannerUrl || ''),
            openingHours: workingHours ? Object.keys(workingHours).reduce((acc: any, day) => {
              const dayData = workingHours[day] || {};
              return {
                ...acc,
                [day]: {
                  ...dayData,
                  open: formatTimeString((dayData as any).open || '09:00'),
                  close: formatTimeString((dayData as any).close || '18:00')
                }
              };
            }, {}) : prev.openingHours
          };
          console.log('🔄 Configurações atualizadas:', {
            logoUrl: newConfig.logoUrl,
            bannerUrl: newConfig.bannerUrl,
            prevLogoUrl: prev.logoUrl,
            dataLogoUrl: data.logoUrl,
            instagram: newConfig.instagram
          });

          // Atualizar ref do Instagram
          instagramRef.current = newConfig.instagram;

          return newConfig;
        });
      } else {
        console.log('⚠️ Ignorando carregamento de configurações - há mudanças locais pendentes');
      }

      // NÃO limpar imagesToRemove aqui - pode estar sendo limpo muito cedo
      // setImagesToRemove(new Set());



    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      // Não mostrar toast de erro para não incomodar o usuário
    }
  };

  const saveConfigurations = async (
    isAutoSave = false,
    typeToRemove?: string,
    imageUrl?: string,
    imageType?: 'logo' | 'banner',
    instagramValue?: string,
    nameOverride?: string,
    slugOverride?: string
  ) => {
    if (!userInfo) return;

    console.log('💾 Salvando configurações...', { isAutoSave });
    if (!isAutoSave) {
      setSavingConfig(true);
    }
    try {
      // Se não é uma remoção de imagem, garantir que horários estão completos
      if (!typeToRemove) {
        if (lastEdited) {
          if (!dayTimesComplete(lastEdited.day)) {
            console.log('⏭️ Salvamento cancelado: dia editado incompleto', lastEdited);
            return;
          }
        } else if (!allTimesComplete()) {
          console.log('⏭️ Salvamento cancelado: horários incompletos');
          return;
        }
      }
      // Formatar horários antes de enviar
      const normalizedHours = Object.keys(configurations.openingHours).reduce((acc: any, day) => {
        const dayData = configurations.openingHours[day as keyof typeof configurations.openingHours];
        return {
          ...acc,
          [day]: {
            ...dayData,
            open: formatTimeString(dayData.open),
            close: formatTimeString(dayData.close)
          }
        };
      }, {});
      // Fazer upload das imagens se houver arquivos selecionados
      let logoUrl = configurations.logoUrl;
      let bannerUrl = configurations.bannerUrl;

      // Se uma URL de imagem foi passada como parâmetro, usar ela
      if (imageUrl && imageType) {
        if (imageType === 'logo') {
          logoUrl = imageUrl;
          console.log('✅ Usando logoUrl passada como parâmetro:', logoUrl);
        } else if (imageType === 'banner') {
          bannerUrl = imageUrl;
          console.log('✅ Usando bannerUrl passada como parâmetro:', bannerUrl);
        }
      }

      console.log('🖼️ Salvando configurações com imagens:', {
        logoFile: !!configurations.logoFile,
        bannerFile: !!configurations.bannerFile,
        logoUrl: configurations.logoUrl,
        bannerUrl: configurations.bannerUrl,
        imagesToRemove: Array.from(imagesToRemove)
      });

      if (configurations.logoFile && !imagesToRemove.has('logo') && typeToRemove !== 'logo') {
        console.log('📤 Fazendo upload da logo...');
        const uploadedLogoUrl = await uploadImage(configurations.logoFile, 'logo');
        if (uploadedLogoUrl) {
          logoUrl = uploadedLogoUrl;
          console.log('✅ Logo uploadada:', uploadedLogoUrl);
        }
      } else if (imagesToRemove.has('logo') || typeToRemove === 'logo') {
        console.log('⏭️ Pulando upload da logo - marcada para remoção');
      }

      if (configurations.bannerFile && !imagesToRemove.has('banner') && typeToRemove !== 'banner') {
        console.log('📤 Fazendo upload do banner...');
        const uploadedBannerUrl = await uploadImage(configurations.bannerFile, 'banner');
        if (uploadedBannerUrl) {
          bannerUrl = uploadedBannerUrl;
          console.log('✅ Banner uploadado:', uploadedBannerUrl);
        }
      } else if (imagesToRemove.has('banner') || typeToRemove === 'banner') {
        console.log('⏭️ Pulando upload do banner - marcado para remoção');
      }

      console.log('💾 Enviando dados para API:', {
        logoUrl,
        bannerUrl,
        name: configurations.name,
        slug: configurations.slug,
        description: configurations.description,
        address: configurations.address,
        phone: configurations.phone,
        email: configurations.email,
        workingHours: normalizedHours,
        instagram: normalizeInstagramUrl(configurations.instagram)
      });
      console.log('⏰ Horários sendo enviados:', normalizedHours);

      // Verificar se logoUrl está sendo enviado corretamente
      if (logoUrl) {
        console.log('✅ LogoUrl sendo enviado para API:', logoUrl);
      } else {
        console.log('❌ LogoUrl está vazio - não será salvo');
      }

      const payload: any = {
        name: nameOverride ?? configurations.name,
        slug: slugOverride ?? configurations.slug,
        description: configurations.description,
        address: configurations.address,
        phone: configurations.phone,
        email: configurations.email,
        workingHours: normalizedHours
      };
      // instagram: sempre enviar (pode ser string vazia para limpar)
      const instagramToUse = instagramValue !== undefined ? instagramValue : configurations.instagram;
      const normalizedInsta = normalizeInstagramUrl(instagramToUse);
      payload.instagram = normalizedInsta || '';
      console.log('📱 Instagram no payload:', {
        instagramValue,
        configurationsInstagram: configurations.instagram,
        instagramToUse,
        original: instagramToUse,
        normalized: normalizedInsta,
        final: payload.instagram
      });
      // logo/banner: enviar apenas quando existir valor ou quando explicitamente removido
      if (typeToRemove === 'logo') {
        payload.logoUrl = '';
      } else if (logoUrl) {
        payload.logoUrl = logoUrl;
      }
      if (typeToRemove === 'banner') {
        payload.bannerUrl = '';
      } else if (bannerUrl) {
        payload.bannerUrl = bannerUrl;
      }

      const headersPut: any = {
        'Content-Type': 'application/json',
        'x-tenant-id': userInfo?.tenantId || ''
      };
      try { const at = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null; if (at) headersPut['Authorization'] = `Bearer ${at}`; } catch { }
      const response = await fetch('/api/v1/barbershop/settings', {
        method: 'PUT',
        headers: headersPut,
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao salvar configurações');
      }

      // Remover imagens marcadas para remoção do servidor
      const removedImages = new Set<string>();

      // Se typeToRemove foi passado, remover essa imagem
      if (typeToRemove) {
        try {
          await fetch('/api/v1/barbershop/remove-image', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'x-tenant-id': userInfo.tenantId || ''
            },
            credentials: 'include',
            body: JSON.stringify({ type: typeToRemove })
          });
          console.log(`🗑️ Imagem ${typeToRemove} removida do servidor`);
          removedImages.add(typeToRemove);
        } catch (error) {
          console.error(`Erro ao remover imagem ${typeToRemove}:`, error);
        }
      }

      // Remover outras imagens marcadas para remoção
      for (const typeToRemoveItem of imagesToRemove) {
        if (typeToRemoveItem !== typeToRemove) {
          try {
            await fetch('/api/v1/barbershop/remove-image', {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                'x-tenant-id': userInfo.tenantId || ''
              },
              credentials: 'include',
              body: JSON.stringify({ type: typeToRemoveItem })
            });
            console.log(`🗑️ Imagem ${typeToRemoveItem} removida do servidor`);
            removedImages.add(typeToRemoveItem);
          } catch (error) {
            console.error(`Erro ao remover imagem ${typeToRemoveItem}:`, error);
          }
        }
      }

      // Limpar apenas as imagens que foram realmente removidas do servidor
      console.log('🧹 Limpando imagens removidas:', {
        removedImages: Array.from(removedImages),
        remainingImages: Array.from(imagesToRemove).filter(type => !removedImages.has(type))
      });

      setImagesToRemove(prev => {
        const newSet = new Set(prev);
        removedImages.forEach(type => newSet.delete(type));
        return newSet;
      });

      // Desativar flag de remoção após salvar com delay
      setTimeout(() => {
        setIsRemovingImages(false);
        console.log('✅ Flag de remoção desativado');
      }, 1000); // 1 segundo de delay

      // Atualizar estado local com as URLs das imagens
      // Se a imagem foi realmente removida do servidor, limpar a URL
      const finalLogoUrl = (removedImages.has('logo') || typeToRemove === 'logo') ? '' : logoUrl;
      const finalBannerUrl = (removedImages.has('banner') || typeToRemove === 'banner') ? '' : bannerUrl;

      console.log('🔄 Atualizando estado local:', {
        finalLogoUrl,
        finalBannerUrl,
        removedImages: Array.from(removedImages)
      });

      setConfigurations(prev => ({
        ...prev,
        logoUrl: finalLogoUrl,
        bannerUrl: finalBannerUrl,
        logoFile: null,
        bannerFile: null
      }));

      // Não limpar inputs de arquivo após salvar - manter seleção do usuário

      // NÃO limpar imagesToRemove aqui - deixar para ser limpo apenas quando realmente salvar
      // setImagesToRemove(new Set());

      // Atualizar timestamp do último salvamento
      setLastSaved(new Date());

      if (!isAutoSave) {
        toast.success('Configurações salvas com sucesso!');
      } else {
        // Toast sutil para auto-save
        toast.success('Salvo automaticamente', { duration: 1500 });
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      if (!isAutoSave) {
        toast.error(error instanceof Error ? error.message : 'Erro ao salvar configurações');
      } else {
        toast.error('Erro no auto-save', { duration: 2000 });
      }
    } finally {
      if (!isAutoSave) {
        setSavingConfig(false);
      }
    }
  };




  return (
    <div className="min-h-screen w-full bg-black flex dashboard-container">
      {/* Banner Trial / Planos */}
      {(() => {
        const tenantStatus = (userInfo as any)?.tenantStatus || (userInfo as any)?.status;
        const isTrialActive = tenantStatus === 'TRIALING' || (trialTimeLeft && !trialTimeLeft.expired);

        if (isTrialActive && trialTimeLeft && !trialTimeLeft.expired) {
          return (
            <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
              <div className="bg-indigo-600/90 text-white px-4 py-2 rounded shadow-lg flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  {trialTimeLeft.days > 0 && `${trialTimeLeft.days} dia${trialTimeLeft.days === 1 ? '' : 's'}`}
                  {trialTimeLeft.days > 0 && trialTimeLeft.hours > 0 && ' e '}
                  {trialTimeLeft.hours > 0 && `${trialTimeLeft.hours}h`}
                  {trialTimeLeft.days === 0 && trialTimeLeft.hours === 0 && 'Menos de 1h'} restantes
                </span>
              </div>
            </div>
          );
        }
        // Trial expirado - mostrar bloqueio
        if (trialTimeLeft && trialTimeLeft.expired) {
          return (
            <>
              {/* Banner de aviso */}
              <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
                <div className="bg-amber-600/90 text-white px-4 py-2 rounded shadow-lg flex items-center gap-3">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856C18.403 20 20 18.403 20 16.586V7.414C20 5.597 18.403 4 16.586 4H7.414C5.597 4 4 5.597 4 7.414v9.172C4 18.403 5.597 20 7.414 20z" />
                  </svg>
                  <span>Período grátis encerrado. Escolha um plano para continuar.</span>
                  <button
                    onClick={() => setShowSubscriptionModal(true)}
                    className="bg-white/90 text-amber-700 px-3 py-1 rounded font-medium hover:bg-white"
                  >
                    Assinar agora
                  </button>
                </div>
              </div>

              {/* Overlay de bloqueio */}
              <div className="fixed inset-0 bg-black/80 z-40 flex items-center justify-center">
                <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
                  <div className="mb-6">
                    <svg className="w-16 h-16 text-amber-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856C18.403 20 20 18.403 20 16.586V7.414C20 5.597 18.403 4 16.586 4H7.414C5.597 4 4 5.597 4 7.414v9.172C4 18.403 5.597 20 7.414 20z" />
                    </svg>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Período Grátis Encerrado</h2>
                    <p className="text-gray-600 mb-6">
                      Seu período de teste de 5 dias chegou ao fim. Para continuar usando a plataforma,
                      escolha um dos nossos planos.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg text-left">
                      <h3 className="font-semibold text-gray-900 mb-2">Planos Disponíveis:</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>• Plano Simples:</span>
                          <span className="font-medium">1-3 barbeiros</span>
                        </div>
                        <div className="flex justify-between">
                          <span>• Plano Intermediário:</span>
                          <span className="font-medium">1-8 barbeiros</span>
                        </div>
                        <div className="flex justify-between">
                          <span>• Plano Premium:</span>
                          <span className="font-medium">até 15 barbeiros</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setShowSubscriptionModal(true)}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      Escolher Plano Agora
                    </button>

                    <button
                      onClick={async () => {
                        try {
                          await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' });
                        } catch { }
                        try { if (typeof window !== 'undefined') localStorage.removeItem('access_token'); } catch { }
                        window.location.href = '/login';
                      }}
                      className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
                    >
                      Sair da Conta
                    </button>
                  </div>
                </div>
              </div>
            </>
          );
        }

        // Caso padrão - não mostrar banner se não há trial
        return null;
      })()}
      {/* Menu Lateral Vertical */}
      <div className="w-72 bg-black shadow-2xl border-r border-gray-800 flex flex-col flex-shrink-0">
        {/* Header do Menu */}
        <div className="p-6 border-b border-gray-800">
          <div className="text-center">
            <h1 className="text-xl font-bold text-white">
              {configurations.name}
            </h1>
            <p className="text-gray-300 text-sm">{configurations.name || 'Dashboard'}</p>
          </div>
        </div>

        {/* Status e Loading */}
        <div className="px-6 py-4 border-b border-gray-800">
          {isLoadingData && (
            <div className="flex items-center text-[#01ABFE] bg-[#01ABFE]/20 px-4 py-3 rounded-lg mb-3">
              <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm font-medium">Carregando dados...</span>
            </div>
          )}

          <div className="flex items-center space-x-2 bg-emerald-900/20 px-4 py-3 rounded-lg">
            <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
            <span className="text-sm text-emerald-400 font-medium">Sistema Online</span>
          </div>
        </div>

        {/* Menu de Navegação Vertical */}
        <nav className="flex-1 px-6 py-6 space-y-3">
          {[
            { id: 'services', name: 'Serviços', icon: WrenchScrewdriverIcon, color: 'indigo', description: 'Gerencie seus serviços' },
            { id: 'employees', name: 'Funcionários', icon: UserGroupIcon, color: 'emerald', description: 'Equipe e colaboradores' },
            { id: 'agenda', name: 'Agenda', icon: CalendarDaysIcon, color: 'blue', description: 'Agendamentos e horários' },
            { id: 'clients', name: 'Clientes', icon: UsersIcon, color: 'amber', description: 'Base de clientes' },
            { id: 'subscriptions', name: 'Assinaturas', icon: CreditCardIcon, color: 'purple', description: 'Planos para clientes' },
            { id: 'plan', name: 'Meu Plano', icon: StarIcon, color: 'violet', description: 'Sua assinatura Noxora' },
            { id: 'configurations', name: 'Configurações', icon: Cog6ToothIcon, color: 'slate', description: 'Configurações gerais' }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            const colorClasses = {
              indigo: isActive ? 'bg-gray-900 text-white shadow-lg border border-gray-700' : 'text-gray-300 hover:bg-gray-900 hover:text-white hover:border-gray-700 border border-transparent',
              emerald: isActive ? 'bg-gray-900 text-white shadow-lg border border-gray-700' : 'text-gray-300 hover:bg-gray-900 hover:text-white hover:border-gray-700 border border-transparent',
              blue: isActive ? 'bg-gray-900 text-white shadow-lg border border-gray-700' : 'text-gray-300 hover:bg-gray-900 hover:text-white hover:border-gray-700 border border-transparent',
              amber: isActive ? 'bg-gray-900 text-white shadow-lg border border-gray-700' : 'text-gray-300 hover:bg-gray-900 hover:text-white hover:border-gray-700 border border-transparent',
              purple: isActive ? 'bg-gray-900 text-white shadow-lg border border-gray-700' : 'text-gray-300 hover:bg-gray-900 hover:text-white hover:border-gray-700 border border-transparent',
              violet: isActive ? 'bg-gray-900 text-white shadow-lg border border-gray-700' : 'text-gray-300 hover:bg-gray-900 hover:text-white hover:border-gray-700 border border-transparent',
              slate: isActive ? 'bg-gray-900 text-white shadow-lg border border-gray-700' : 'text-gray-300 hover:bg-gray-900 hover:text-white hover:border-gray-700 border border-transparent'
            };

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center space-x-4 px-6 py-5 rounded-xl font-medium transition-all duration-200 group ${colorClasses[tab.color as keyof typeof colorClasses]
                  } ${isActive ? 'shadow-lg transform scale-105' : 'hover:scale-105'}`}
              >
                <tab.icon className="w-6 h-6" />
                <div className="flex-1 text-left">
                  <div className="font-semibold">{tab.name}</div>
                  <div className={`text-xs ${isActive ? 'text-white/80' : 'text-gray-400'}`}>
                    {tab.description}
                  </div>
                </div>
                {isActive && (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer do Menu */}
        <div className="p-6 border-t border-gray-800">
          <div className="bg-gray-900 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-300">Última atualização</div>
              <button
                onClick={refreshData}
                disabled={isLoadingData}
                className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                title="Atualizar dados"
              >
                <svg
                  className={`w-4 h-4 ${isLoadingData ? 'animate-spin' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            <div className="text-xs text-slate-400">
              {lastUpdate ? (
                <>
                  {lastUpdate.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })} às {lastUpdate.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </>
              ) : (
                'Carregando...'
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col">
        {/* Header do Conteúdo */}
        <div className="bg-slate-800/80 backdrop-blur-sm shadow-lg border-b border-slate-700/50">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {activeTab === 'services' && 'Serviços'}
                  {activeTab === 'employees' && 'Funcionários'}
                  {activeTab === 'agenda' && 'Agenda'}
                  {activeTab === 'clients' && 'Clientes'}
                  {activeTab === 'subscriptions' && 'Assinaturas'}
                  {activeTab === 'configurations' && 'Configurações'}
                  {activeTab === 'plan' && 'Meu Plano'}
                </h2>
                <p className="text-slate-400 mt-0.5 text-sm">
                  {activeTab === 'services' && 'Gerencie os serviços oferecidos pela sua barbearia'}
                  {activeTab === 'employees' && 'Administre sua equipe de funcionários'}
                  {activeTab === 'agenda' && 'Visualize e gerencie os agendamentos'}
                  {activeTab === 'clients' && 'Controle sua base de clientes'}
                  {activeTab === 'subscriptions' && 'Configure planos de assinatura para seus clientes'}
                  {activeTab === 'configurations' && 'Configure as opções da sua barbearia'}
                  {activeTab === 'plan' && 'Gerencie sua assinatura da plataforma Noxora'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={async () => {
                    try {
                      await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' });
                    } catch { }
                    try { if (typeof window !== 'undefined') localStorage.removeItem('access_token'); } catch { }
                    window.location.href = '/login';
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg border border-red-500/50 transition-colors"
                >
                  Sair
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Área de Conteúdo */}
        <div className="flex-1 p-10 overflow-y-auto dashboard-content bg-black">
          <div className="w-full">
            {/* Tab Content */}
            {activeTab === 'services' && (
              <div>
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl font-bold text-white">Serviços</h2>
                  <button
                    onClick={() => setShowServiceModal(true)}
                    className="bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-700 border border-gray-700 flex items-center font-medium transition-colors"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Novo Serviço
                  </button>
                </div>

                <div className="bg-slate-800 shadow-lg rounded-xl overflow-hidden border border-slate-700">
                  <table className="w-full divide-y divide-gray-200">
                    <thead className="bg-gray-900">
                      <tr>
                        <th className="px-8 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Serviço
                        </th>
                        <th className="px-8 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Duração
                        </th>
                        <th className="px-8 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Preço
                        </th>
                        <th className="px-8 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-8 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-slate-800 divide-y divide-slate-700">
                      {services.map((service) => (
                        <tr key={service.id}>
                          <td className="px-8 py-5 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-white">{service.name}</div>
                              {service.description && (
                                <div className="text-sm text-slate-400">{service.description}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-8 py-5 whitespace-nowrap text-sm text-white">
                            {formatDuration(service.duration_min)}
                          </td>
                          <td className="px-8 py-5 whitespace-nowrap text-sm text-white">
                            {formatPrice(service.price_cents)}
                          </td>
                          <td className="px-8 py-5 whitespace-nowrap">
                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${service.is_active
                              ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/20'
                              : 'bg-red-900/30 text-red-400 border border-red-500/20'
                              }`}>
                              {service.is_active ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td className="px-8 py-5 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleEditService(service)}
                              className="text-gray-400 hover:text-white mr-3 transition-colors"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteService(service.id)}
                              className="text-red-400 hover:text-red-300 transition-colors"
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
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl font-bold text-white">Colaboradores</h2>
                  <button
                    onClick={() => setShowEmployeeModal(true)}
                    className="bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-700 border border-gray-700 flex items-center font-medium transition-colors"
                  >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Novo Funcionário
                  </button>
                </div>

                <div className="bg-slate-800 shadow-lg rounded-xl overflow-hidden border border-slate-700">
                  <table className="w-full divide-y divide-gray-200">
                    <thead className="bg-gray-900">
                      <tr>
                        <th className="px-8 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Funcionário
                        </th>
                        <th className="px-8 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Cargo
                        </th>
                        <th className="px-8 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Contato
                        </th>
                        <th className="px-8 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-8 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-slate-800 divide-y divide-slate-700">
                      {employees.map((employee) => (
                        <tr key={employee.id}>
                          <td className="px-8 py-5 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                                <span className="text-sm font-medium text-gray-700">
                                  {employee.name.charAt(0)}
                                </span>
                              </div>
                              <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                            </div>
                          </td>
                          <td className="px-8 py-5 whitespace-nowrap text-sm text-white">
                            {employee.role}
                          </td>
                          <td className="px-8 py-5 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{employee.email}</div>
                            <div className="text-sm text-gray-500">{employee.phone}</div>
                          </td>
                          <td className="px-8 py-5 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${employee.active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                              }`}>
                              {employee.active ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td className="px-8 py-5 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleEditEmployee(employee)}
                              className="text-gray-400 hover:text-white mr-3 transition-colors"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteEmployee(employee)}
                              className="text-red-400 hover:text-red-300 transition-colors"
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
              <div className="flex h-full w-full -mt-4">
                {/* Sidebar com Calendário e Filtros */}
                <div className="w-80 bg-black border-r border-gray-800 p-4 space-y-4">
                  {/* Calendário */}
                  <div className="bg-white rounded-lg p-3 border border-gray-200 -ml-6">
                    <div className="text-center mb-3">
                      <h3 className="text-base font-semibold text-black">
                        setembro de 2025
                      </h3>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-xs">
                      {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                        <div key={day} className="text-slate-400 text-center py-1 text-xs">{day}</div>
                      ))}
                      {(() => {
                        // Forçar setembro de 2025 para o calendário
                        const year = 2025;
                        const month = 8; // Setembro (0-indexed)
                        const daysInMonth = new Date(year, month + 1, 0).getDate();
                        const firstDayOfMonth = new Date(year, month, 1).getDay();

                        const days = [];

                        // Dias vazios do início do mês
                        for (let i = 0; i < firstDayOfMonth; i++) {
                          days.push(<div key={`empty-${i}`} className="py-1"></div>);
                        }

                        // Dias do mês
                        for (let day = 1; day <= daysInMonth; day++) {
                          const currentDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                          const isSelected = currentDate === selectedDate;
                          days.push(
                            <button
                              key={day}
                              onClick={() => {
                                setSelectedDate(currentDate);
                              }}
                              className={`text-center py-1 rounded text-xs transition-colors ${isSelected
                                ? 'bg-[#01ABFE] text-white border border-[#0099E6]'
                                : 'text-[#01ABFE] hover:bg-[#6FD6FF]'
                                }`}
                            >
                              {day}
                            </button>
                          );
                        }

                        return days;
                      })()}
                    </div>
                  </div>

                  {/* Filtros */}
                  <div className="space-y-3 -ml-6">

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Nome do profissional</label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          className="flex-1 px-2 py-1.5 bg-gray-900 border border-gray-700 rounded text-white text-xs"
                          placeholder="Digite o nome"
                        />
                        <button className="px-2 py-1.5 bg-blue-600 text-white rounded text-xs">Todos</button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Status do Agendamento</label>
                      <select className="w-full px-2 py-1.5 bg-gray-900 border border-gray-700 rounded text-white text-xs">
                        <option>Todos</option>
                        <option>Confirmado</option>
                        <option>Pendente</option>
                        <option>Cancelado</option>
                      </select>
                    </div>


                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Tamanho da agenda</label>
                      <select className="w-full px-2 py-1.5 bg-gray-900 border border-gray-700 rounded text-white text-xs">
                        <option>Padrão</option>
                        <option>Compacta</option>
                        <option>Ampliada</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Exibição da agenda</label>
                      <select className="w-full px-2 py-1.5 bg-gray-900 border border-gray-700 rounded text-white text-xs">
                        <option>Dia</option>
                        <option>Semana</option>
                        <option>Mês</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Área Principal da Agenda */}
                <div className="flex-1 bg-slate-900">
                  {/* Header da Agenda */}
                  <div className="bg-slate-800 border-b border-slate-700 p-6">
                    <div className="flex items-center justify-between">
                      <div className="text-center">
                        <h2 className="text-lg font-bold text-white">
                          {(() => {
                            const [year, month, day] = selectedDate.split('-');
                            const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                            return `${date.getDate()} ${date.toLocaleDateString('pt-BR', { month: 'short' })} ${date.getFullYear()}`;
                          })()}
                        </h2>
                        <p className="text-sm text-slate-400">
                          {(() => {
                            const [year, month, day] = selectedDate.split('-');
                            const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                            return date.toLocaleDateString('pt-BR', { weekday: 'long' });
                          })()}
                        </p>
                        {(() => {
                          const { isClosed } = getOperatingHours();
                          if (isClosed) {
                            return <p className="text-xs text-red-400 mt-1">🔒 Fechado</p>;
                          }
                          return null;
                        })()}
                      </div>
                      <div className="flex-1 flex justify-center">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Buscar clientes agendados hoje"
                            className="w-80 px-4 py-2 pl-10 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400"
                          />
                          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium bg-green-600 text-white">
                          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                          <span>Tempo Real</span>
                        </div>
                        <button
                          onClick={refreshAgenda}
                          disabled={isLoadingData}
                          className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                          title="Atualizar agenda"
                        >
                          <svg
                            className={`w-5 h-5 ${isLoadingData ? 'animate-spin' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                        <button className="bg-gray-800 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors border border-gray-700">
                          + Agendar
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Cabeçalho dos Profissionais (colunas com rolagem horizontal) */}
                  <div className="bg-gray-900 border-b border-gray-800 overflow-x-auto">
                    <div className="min-w-full">
                      {/* Indicador de quantidade de barbeiros */}
                      {(() => {
                        const barbers = (employees || []).filter(e => e.role === 'BARBER' && e.active);
                        if (barbers.length > 8) {
                          return (
                            <div className="bg-blue-900/30 border-b border-blue-800 px-4 py-2">
                              <div className="text-xs text-blue-300 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                {barbers.length} barbeiros ativos • Layout otimizado para até 15 barbeiros
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                      {(() => {
                        const barbers = (employees || []).filter(e => e.role === 'BARBER' && e.active);
                        // Calcular largura dinâmica otimizada para máximo 15 barbeiros
                        const getColW = (n: number) => {
                          if (n === 0) return 0;

                          // Largura mínima e máxima otimizada para até 15 barbeiros
                          const minWidth = 120; // Mínimo confortável para legibilidade
                          const maxWidth = 500; // Máximo para aproveitar bem o espaço

                          // Calcular largura baseada no espaço disponível
                          const availableWidth = 1400 - 80; // 80px para coluna de horários, mais espaço total
                          const calculatedWidth = Math.floor(availableWidth / n);

                          // Aplicar limites e ajustar para casos especiais
                          let finalWidth = Math.max(minWidth, Math.min(maxWidth, calculatedWidth));

                          // Otimizações específicas para diferentes quantidades
                          if (n === 1) finalWidth = Math.min(600, availableWidth); // Um barbeiro ocupa bem o espaço
                          if (n === 2) finalWidth = Math.min(500, Math.floor(availableWidth / 2)); // Dois barbeiros bem distribuídos
                          if (n === 3) finalWidth = Math.min(400, Math.floor(availableWidth / 3)); // Três barbeiros confortáveis
                          if (n >= 4 && n <= 6) finalWidth = Math.min(300, Math.floor(availableWidth / n)); // 4-6 barbeiros: bom espaço
                          if (n >= 7 && n <= 10) finalWidth = Math.min(200, Math.floor(availableWidth / n)); // 7-10 barbeiros: espaço adequado
                          if (n >= 11 && n <= 15) finalWidth = Math.min(150, Math.floor(availableWidth / n)); // 11-15 barbeiros: compacto mas legível

                          return finalWidth;
                        };
                        const COL_W = getColW(barbers.length);
                        if (barbers.length === 0) {
                          return (
                            <div className="flex">
                              <div className="w-20 bg-gray-900 border-r border-gray-800 p-2">
                                <div className="text-xs text-gray-400 text-center">Profissional</div>
                              </div>
                              <div className="flex-1 p-2">
                                <span className="text-slate-400 text-sm">Nenhum barbeiro ativo</span>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div
                            className="grid"
                            style={{
                              gridTemplateColumns: `80px repeat(${barbers.length}, 1fr)`,
                              minWidth: `${80 + (barbers.length * 120)}px`, // Largura mínima otimizada para até 15 barbeiros
                              maxWidth: barbers.length > 8 ? 'none' : '100%' // Scroll horizontal para 9+ barbeiros
                            }}
                          >
                            <div className="bg-gray-900 border-r border-gray-800 p-2 text-xs text-gray-400 text-center">Profissional</div>
                            {barbers.map(emp => (
                              <div key={emp.id} className="p-2 text-white font-medium text-xs text-center border-r border-gray-800 truncate">
                                {emp.name}
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Grade da Agenda com rolagem horizontal e múltiplas colunas */}
                  <div className="overflow-x-auto">
                    <div className="min-w-full">
                      {(() => {
                        const { startHour, endHour, isClosed } = getOperatingHours();
                        if (isClosed) {
                          return (
                            <div className="h-16 border-b border-slate-700 border-dashed relative flex items-center justify-center">
                              <span className="text-slate-500 text-sm">Estabelecimento fechado</span>
                            </div>
                          );
                        }

                        const barbers = (employees || []).filter(e => e.role === 'BARBER' && e.active);
                        // Calcular largura dinâmica otimizada para máximo 15 barbeiros
                        const getColW = (n: number) => {
                          if (n === 0) return 0;

                          // Largura mínima e máxima otimizada para até 15 barbeiros
                          const minWidth = 120; // Mínimo confortável para legibilidade
                          const maxWidth = 500; // Máximo para aproveitar bem o espaço

                          // Calcular largura baseada no espaço disponível
                          const availableWidth = 1400 - 80; // 80px para coluna de horários, mais espaço total
                          const calculatedWidth = Math.floor(availableWidth / n);

                          // Aplicar limites e ajustar para casos especiais
                          let finalWidth = Math.max(minWidth, Math.min(maxWidth, calculatedWidth));

                          // Otimizações específicas para diferentes quantidades
                          if (n === 1) finalWidth = Math.min(600, availableWidth); // Um barbeiro ocupa bem o espaço
                          if (n === 2) finalWidth = Math.min(500, Math.floor(availableWidth / 2)); // Dois barbeiros bem distribuídos
                          if (n === 3) finalWidth = Math.min(400, Math.floor(availableWidth / 3)); // Três barbeiros confortáveis
                          if (n >= 4 && n <= 6) finalWidth = Math.min(300, Math.floor(availableWidth / n)); // 4-6 barbeiros: bom espaço
                          if (n >= 7 && n <= 10) finalWidth = Math.min(200, Math.floor(availableWidth / n)); // 7-10 barbeiros: espaço adequado
                          if (n >= 11 && n <= 15) finalWidth = Math.min(150, Math.floor(availableWidth / n)); // 11-15 barbeiros: compacto mas legível

                          return finalWidth;
                        };
                        const COL_W = getColW(barbers.length);
                        const totalHours = endHour - startHour + 1;
                        // Altura fixa da agenda (se ajusta ao viewport, mas é fixa por dia)
                        const DEFAULT_HEIGHT = 880; // altura base
                        const heightFromViewport = typeof window !== 'undefined'
                          ? Math.max(730, Math.min(1030, window.innerHeight - 170))
                          : DEFAULT_HEIGHT;
                        const containerHeight = heightFromViewport;
                        const slotHeight = `${containerHeight / totalHours}px`;

                        const sameDay = (iso: string) => {
                          const d = new Date(iso);
                          const yyyy = d.getFullYear();
                          const mm = String(d.getMonth() + 1).padStart(2, '0');
                          const dd = String(d.getDate()).padStart(2, '0');
                          return `${yyyy}-${mm}-${dd}` === selectedDate;
                        };

                        return (
                          <div
                            className="grid relative"
                            style={{
                              gridTemplateColumns: `80px repeat(${barbers.length}, 1fr)`,
                              height: `${containerHeight}px`,
                              minWidth: `${80 + (barbers.length * 120)}px` // Largura mínima para evitar colunas muito estreitas
                            }}
                          >
                            {/* Coluna fixa de horários */}
                            <div className="bg-slate-800 border-r border-slate-700">
                              {Array.from({ length: totalHours }).map((_, idx) => {
                                const hour = startHour + idx;
                                const isSpecial = hour === startHour || hour === endHour;
                                return (
                                  <div
                                    key={hour}
                                    className={`border-b border-slate-700 flex items-start justify-center text-xs pt-1 ${isSpecial ? 'bg-[#01ABFE]/20 text-[#01ABFE]' : 'text-slate-400'}`}
                                    style={{ height: slotHeight }}
                                  >
                                    {hour}h
                                  </div>
                                );
                              })}
                            </div>

                            {/* Colunas de agenda por barbeiro */}
                            {barbers.map(emp => (
                              <div key={emp.id} className="relative border-r border-slate-700">
                                {/* Linhas de hora no fundo de cada coluna */}
                                {Array.from({ length: totalHours }).map((_, idx) => {
                                  const hour = startHour + idx;
                                  const isLastHour = hour === endHour;
                                  return (
                                    <div key={hour} className="relative" style={{ height: slotHeight }}>
                                      <div className="absolute top-0 left-0 right-0 h-px bg-gray-700"></div>
                                      <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-700 border-dashed border-t"></div>
                                      {!isLastHour && <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-700"></div>}
                                    </div>
                                  );
                                })}

                                {/* Agendamentos deste barbeiro */}
                                {(appointments || [])
                                  .filter(a => a.status === 'CONFIRMED' && a.employeeId === emp.id && sameDay(a.startAt))
                                  .map(appt => {
                                    const start = new Date(appt.startAt);
                                    const end = new Date(appt.endAt);
                                    const startHoursFromOpen = (start.getHours() + start.getMinutes() / 60) - startHour;
                                    const durationHours = Math.max(0.25, (end.getTime() - start.getTime()) / 3600000);
                                    const top = Math.max(0, (startHoursFromOpen / totalHours) * containerHeight);
                                    const height = Math.max(22, (durationHours / totalHours) * containerHeight);
                                    return (
                                      <div
                                        key={appt.id}
                                        className="absolute left-1 right-1 rounded border border-sky-700 bg-sky-600/30 text-sky-100 px-1 py-0.5 overflow-hidden"
                                        style={{ top: `${top}px`, height: `${height}px` }}
                                        title={`${emp.name || ''} • ${appt.service?.name || ''}`}
                                      >
                                        <div className="text-[11px] font-medium leading-4 truncate">{appt.service?.name || 'Serviço'}</div>
                                        <div className="text-[10px] opacity-80 leading-4 truncate">{(appt.clients?.name ? appt.clients.name + ' • ' : '') + (start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))}</div>
                                      </div>
                                    );
                                  })}
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'configurations' && (
              <div>
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl font-bold text-white">Configurações da Barbearia</h2>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-8">
                  {/* Informações Básicas */}
                  <div className="bg-white shadow-lg rounded-xl p-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Informações Básicas</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Barbearia</label>
                        <input
                          type="text"
                          value={configurations.name || ''}
                          onChange={(e) => handleSlugChange(e.target.value)}
                          onBlur={() => saveConfigurations(false, undefined, undefined, undefined, undefined, configurations.name, configurations.slug)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Digite o nome da barbearia"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL)</label>
                        <div className="flex">
                          <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                            noxoraa.vercel.app/b/
                          </span>
                          <input
                            type="text"
                            value={configurations.slug || ''}
                            onChange={(e) => { handleConfigChange('slug', generateSlug(e.target.value)); }}
                            onBlur={() => saveConfigurations(false, undefined, undefined, undefined, undefined, configurations.name, configurations.slug)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="slug-da-barbearia"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          O slug é gerado automaticamente baseado no nome, mas você pode editá-lo
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                        <textarea
                          value={configurations.description || ''}
                          onChange={(e) => handleConfigChange('description', e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Descreva sua barbearia"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contato */}
                  <div className="bg-white shadow-lg rounded-xl p-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Contato</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                        <input
                          type="text"
                          value={configurations.address || ''}
                          onChange={(e) => handleConfigChange('address', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Rua, número - Bairro, Cidade"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                        <input
                          type="text"
                          value={configurations.phone || ''}
                          onChange={(e) => handleConfigChange('phone', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="(11) 99999-9999"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          value={configurations.email || ''}
                          onChange={(e) => handleConfigChange('email', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="contato@barbearia.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Link do Instagram</label>
                        <input
                          type="text"
                          value={configurations.instagram || ''}
                          onChange={(e) => handleConfigChange('instagram', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="https://instagram.com/suapagina"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Logo e Banner */}
                  <div className="bg-white shadow-lg rounded-xl p-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Logo da Barbearia</h3>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 overflow-hidden">
                          {configurations.logoUrl ? (
                            <img
                              src={configurations.logoUrl}
                              alt="Logo da barbearia"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="h-8 w-8 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Upload do Logo</label>
                          <div className="flex space-x-2">
                            <input
                              ref={logoInputRef}
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                console.log('📁 Input onChange chamado:', { files: e.target.files, fileName: e.target.files?.[0]?.name });
                                handleFileChange('logoFile', e.target.files?.[0] || null);
                              }}
                              className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-[#4fc9ff] file:text-white hover:file:bg-blue-600"
                            />
                            {configurations.logoUrl && (
                              <button
                                onClick={() => removeImage('logo')}
                                className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                              >
                                Remover
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">PNG, JPG até 2MB. Recomendado: 200x200px</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Banner */}
                  <div className="bg-white shadow-lg rounded-xl p-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Banner da Barbearia</h3>
                    <div className="space-y-4">
                      <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 overflow-hidden">
                        {configurations.bannerUrl ? (
                          <img
                            src={configurations.bannerUrl}
                            alt="Banner da barbearia"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center">
                            <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">Banner Preview</p>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Upload do Banner</label>
                        <div className="flex space-x-2">
                          <input
                            ref={bannerInputRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileChange('bannerFile', e.target.files?.[0] || null)}
                            className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-[#4fc9ff] file:text-white hover:file:bg-blue-600"
                          />
                          {configurations.bannerUrl && (
                            <button
                              onClick={() => removeImage('banner')}
                              className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                            >
                              Remover
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Largura: Mínimo 800px, ideal 1200px+<br />Altura: Mínimo 600px, ideal 800px+<br />Formato: JPG ou PNG</p>
                      </div>
                    </div>
                  </div>

                  {/* Horário de Funcionamento */}
                  <div className="bg-white shadow-lg rounded-xl p-8 lg:col-span-2 border border-gray-200">
                    <h3 className="text-lg font-medium text-black mb-6">Horário de Funcionamento</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-6">
                      {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map((day, index) => {
                        const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                        const dayKey = dayNames[index];
                        const dayConfig = configurations.openingHours[dayKey as keyof typeof configurations.openingHours];

                        return (
                          <div key={day} className="space-y-3">
                            <div className="text-sm font-medium text-black text-center">{day}</div>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="text"
                                  placeholder="09:00"
                                  value={dayConfig.open || ''}
                                  maxLength={5}
                                  onChange={(e) => {
                                    const value = maskHHmm(e.target.value);
                                    setLastEdited({ day: dayKey, field: 'open' });
                                    console.log(`⏰ Input ${dayKey} OPEN - valor:`, value);
                                    handleConfigChange('openingHours', {
                                      ...configurations.openingHours,
                                      [dayKey]: { ...dayConfig, open: value }
                                    });
                                    if (isCompleteHHmm(value)) {
                                      setTimeout(() => saveConfigurations(true), 0);
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    // Permitir apenas números, backspace, delete, arrow keys
                                    if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                                      e.preventDefault();
                                    }
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 bg-white text-black rounded text-sm focus:ring-2 focus:ring-[#4FC9FF] focus:border-[#4FC9FF] font-mono"
                                  onBlur={() => {
                                    setLastEdited({ day: dayKey, field: 'open' });
                                    if (dayTimesComplete(dayKey)) {
                                      saveConfigurations(true);
                                    }
                                  }}
                                />
                              </div>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="text"
                                  placeholder="18:00"
                                  value={dayConfig.close || ''}
                                  maxLength={5}
                                  onChange={(e) => {
                                    const value = maskHHmm(e.target.value);
                                    setLastEdited({ day: dayKey, field: 'close' });
                                    console.log(`⏰ Input ${dayKey} CLOSE - valor:`, value);
                                    handleConfigChange('openingHours', {
                                      ...configurations.openingHours,
                                      [dayKey]: { ...dayConfig, close: value }
                                    });
                                    if (isCompleteHHmm(value)) {
                                      setTimeout(() => saveConfigurations(true), 0);
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    // Permitir apenas números, backspace, delete, arrow keys
                                    if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                                      e.preventDefault();
                                    }
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 bg-white text-black rounded text-sm focus:ring-2 focus:ring-[#4FC9FF] focus:border-[#4FC9FF] font-mono"
                                  onBlur={() => {
                                    setLastEdited({ day: dayKey, field: 'close' });
                                    if (dayTimesComplete(dayKey)) {
                                      saveConfigurations(true);
                                    }
                                  }}
                                />
                              </div>
                              <div className="flex items-center justify-center">
                                <input
                                  type="checkbox"
                                  checked={!dayConfig.closed}
                                  onChange={(e) => {
                                    handleConfigChange('openingHours', {
                                      ...configurations.openingHours,
                                      [dayKey]: { ...dayConfig, closed: !e.target.checked }
                                    });
                                    // Disparar salvamento automático quando checkbox muda
                                    setTimeout(() => saveConfigurations(true), 0);
                                  }}
                                  className="h-4 w-4 text-[#4FC9FF] focus:ring-[#4FC9FF] border-gray-300 rounded bg-white"
                                />
                                <span className="ml-2 text-xs text-gray-600">Aberto</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Página pública da sua barbearia */}
                  <div className="bg-white shadow rounded-lg p-6 lg:col-span-2">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Página pública da sua barbearia</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Globe className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">URL da sua barbearia:</span>
                      </div>
                      <a
                        href={`https://noxoraa.vercel.app/b/${configurations.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-white bg-[#4FC9FF] px-2 py-1 rounded hover:bg-[#3AB3E8] transition-colors cursor-pointer inline-block"
                      >
                        https://noxoraa.vercel.app/b/{configurations.slug}
                      </a>
                      <p className="text-xs text-gray-500 mt-2">
                        Esta é a URL que seus clientes usarão para fazer agendamentos.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status do Auto-Save */}
                <div className="mt-6 flex justify-center">
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    {savingConfig ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                        <span>Salvando...</span>
                      </>
                    ) : lastSaved ? (
                      <>
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Última alteração salva em {lastSaved.toLocaleTimeString('pt-BR')}</span>
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                        <span>Alterações serão salvas automaticamente</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'clients' && (
              <div>
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-3xl font-bold text-white">Clientes</h2>
                  <button
                    onClick={loadClients}
                    className="bg-gray-800 text-white px-6 py-3 rounded-lg hover:bg-gray-700 border border-gray-700 flex items-center font-medium transition-colors"
                  >
                    Recarregar
                  </button>
                </div>

                {/* Debug info */}
                <div className="mb-4 p-4 bg-amber-900/20 border border-amber-500/20 rounded-lg">
                  <p className="text-sm text-amber-400">
                    <strong>Debug:</strong> Total de clientes carregados: {clients.length}
                  </p>
                </div>

                <div className="bg-slate-800 shadow-lg rounded-xl overflow-hidden border border-slate-700">
                  {clients.length === 0 ? (
                    <div className="p-8 text-center">
                      <UsersIcon className="mx-auto h-12 w-12 text-slate-400" />
                      <h3 className="mt-2 text-sm font-medium text-white">Nenhum cliente encontrado</h3>
                      <p className="mt-1 text-sm text-slate-400">
                        Os clientes aparecerão aqui quando fizerem agendamentos.
                      </p>
                    </div>
                  ) : (
                    <table className="w-full divide-y divide-slate-700">
                      <thead className="bg-gray-900">
                        <tr>
                          <th className="px-8 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                            Cliente
                          </th>
                          <th className="px-8 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-8 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                            Telefone
                          </th>
                          <th className="px-8 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                            Data de Cadastro
                          </th>
                          <th className="px-8 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-slate-800 divide-y divide-slate-700">
                        {clients.map((client) => (
                          <tr key={client.id}>
                            <td className="px-8 py-5 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                                  <span className="text-sm font-medium text-white">
                                    {client.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div className="text-sm font-medium text-white">{client.name}</div>
                              </div>
                            </td>
                            <td className="px-8 py-5 whitespace-nowrap text-sm text-white">
                              {client.email}
                            </td>
                            <td className="px-8 py-5 whitespace-nowrap text-sm text-white">
                              {client.phone}
                            </td>
                            <td className="px-8 py-5 whitespace-nowrap text-sm text-white">
                              {formatDate(client.createdAt)}
                            </td>
                            <td className="px-8 py-5 whitespace-nowrap text-sm font-medium">
                              <button className="text-[#01ABFE] hover:text-[#0099E6] mr-3">
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
                        value={serviceForm.name || ''}
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
                        value={serviceForm.duration_min || 0}
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
                        value={serviceForm.price_reais || '0,00'}
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
                        value={serviceForm.description || ''}
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
                        className="h-4 w-4 text-gray-400 focus:ring-gray-600 border-gray-600 rounded"
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
                        value={employeeForm.name || ''}
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
                        value={employeeForm.role || 'BARBER'}
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
                        value={employeeForm.email || ''}
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
                        value={employeeForm.phone || ''}
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
                        className="h-4 w-4 text-gray-400 focus:ring-gray-600 border-gray-600 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-900">
                        Funcionário ativo
                      </label>
                    </div>

                    {/* Aviso sobre limite de barbeiros */}
                    {!editingEmployee && employeeForm.role === 'BARBER' && (employees || []).filter(e => e.role === 'BARBER' && e.active).length >= 15 && (
                      <div className="bg-red-50 border border-red-200 rounded-md p-3">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">
                              Limite de barbeiros atingido
                            </h3>
                            <div className="mt-2 text-sm text-red-700">
                              <p>Você já possui 15 barbeiros ativos. Não é possível criar mais barbeiros.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
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
                        disabled={!editingEmployee && employeeForm.role === 'BARBER' && (employees || []).filter(e => e.role === 'BARBER' && e.active).length >= 15}
                        className={`px-4 py-2 text-sm font-medium text-white rounded-md ${!editingEmployee && employeeForm.role === 'BARBER' && (employees || []).filter(e => e.role === 'BARBER' && e.active).length >= 15
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700'
                          }`}
                      >
                        {editingEmployee ? 'Atualizar' : 'Criar'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Modal de Confirmação de Exclusão */}
          {/* Seção de Assinaturas */}
          {activeTab === 'subscriptions' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Gerenciar Assinaturas</h2>
                  <p className="text-gray-600 mt-2 text-lg">Configure planos de assinatura para seus clientes</p>
                </div>
                <button
                  onClick={openCreateSubscription}
                  className="bg-[#01ABFE] text-white px-8 py-4 rounded-xl font-semibold hover:bg-[#0099E6] transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <PlusIcon className="h-5 w-5 inline mr-2" />
                  Nova Assinatura
                </button>
              </div>

              {/* Cards de Assinaturas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {isLoadingSubscriptions ? (
                  <div className="col-span-full text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#01ABFE]"></div>
                    <p className="mt-4 text-gray-600">Carregando assinaturas...</p>
                  </div>
                ) : subscriptions.length === 0 ? (
                  /* Estado Vazio - Nenhum Plano Criado */
                  <div className="col-span-full">
                    <div className="bg-gradient-to-br from-[#01ABFE]/5 to-[#6FD6FF]/5 rounded-2xl border-2 border-dashed border-[#01ABFE]/30 p-12 text-center">
                      <div className="w-20 h-20 bg-[#01ABFE]/20 rounded-xl flex items-center justify-center mx-auto mb-6">
                        <CreditCardIcon className="h-10 w-10 text-[#01ABFE]" />
                      </div>
                      <h3 className="text-2xl font-semibold text-gray-900 mb-3">Nenhum Plano de Assinatura</h3>
                      <p className="text-gray-600 mb-8 text-lg">Crie seu primeiro plano de assinatura para começar a oferecer serviços recorrentes aos seus clientes</p>
                      <button
                        onClick={openCreateSubscription}
                        className="bg-[#01ABFE] text-white px-8 py-4 rounded-xl font-semibold hover:bg-[#0099E6] transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        <PlusIcon className="h-5 w-5 inline mr-2" />
                        Criar Primeiro Plano
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Lista de Assinaturas */
                  subscriptions.map((subscription) => (
                    <div key={subscription.id} className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 hover:shadow-2xl transition-all duration-200 hover:border-[#01ABFE]/30">
                      <div className="flex items-center justify-between mb-6">
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6FD6FF, #01ABFE)' }}>
                          <span className="text-white text-xl font-bold">{subscription.name.charAt(0)}</span>
                        </div>
                        <span className={`text-sm font-semibold px-3 py-1 rounded-full ${subscription.isActive
                          ? 'bg-[#01ABFE]/10 text-[#01ABFE]'
                          : 'bg-gray-100 text-gray-600'
                          }`}>
                          {subscription.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">{subscription.name}</h3>
                      <p className="text-gray-600 mb-6">{subscription.description || 'Sem descrição'}</p>
                      <div className="flex items-baseline mb-6">
                        <span className="text-4xl font-bold text-[#01ABFE]">R$ {(subscription.priceCents / 100).toFixed(2)}</span>
                        <span className="text-gray-600 ml-2 text-lg">/{subscription.durationDays === 30 ? 'mês' : subscription.durationDays === 90 ? 'trimestre' : subscription.durationDays === 365 ? 'ano' : `${subscription.durationDays} dias`}</span>
                      </div>

                      {/* Serviços */}
                      {subscription.services && subscription.services.length > 0 && (
                        <div className="space-y-2 mb-6">
                          <h4 className="text-sm font-semibold text-gray-700">Serviços Inclusos:</h4>
                          {subscription.services.slice(0, 3).map((service: string, index: number) => (
                            <div key={index} className="flex items-center text-gray-700">
                              <svg className="w-4 h-4 text-[#01ABFE] mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              <span className="text-sm">{service}</span>
                            </div>
                          ))}
                          {subscription.services.length > 3 && (
                            <p className="text-sm text-gray-500">+{subscription.services.length - 3} mais</p>
                          )}
                        </div>
                      )}

                      {/* Benefícios */}
                      {subscription.benefits && subscription.benefits.length > 0 && (
                        <div className="space-y-2 mb-6">
                          <h4 className="text-sm font-semibold text-gray-700">Benefícios:</h4>
                          {subscription.benefits.slice(0, 2).map((benefit: string, index: number) => (
                            <div key={index} className="flex items-center text-gray-700">
                              <svg className="w-4 h-4 text-[#01ABFE] mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              <span className="text-sm">{benefit}</span>
                            </div>
                          ))}
                          {subscription.benefits.length > 2 && (
                            <p className="text-sm text-gray-500">+{subscription.benefits.length - 2} mais</p>
                          )}
                        </div>
                      )}

                      <div className="flex space-x-3">
                        <button
                          onClick={() => openEditSubscription(subscription)}
                          className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteSubscription(subscription)}
                          className="flex-1 bg-red-50 text-red-700 px-4 py-3 rounded-lg font-semibold hover:bg-red-100 transition-colors"
                        >
                          Excluir
                        </button>
                        <button className="flex-1 bg-[#01ABFE] text-white px-4 py-3 rounded-lg font-semibold hover:bg-[#0099E6] transition-colors">
                          Ver Assinantes ({subscription.clientSubscriptions?.length || 0})
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Estatísticas de Assinaturas - Será exibido quando houver dados */}
              {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
                  <div className="flex items-center">
                    <div className="w-14 h-14 bg-[#01ABFE] rounded-xl flex items-center justify-center">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="ml-6">
                      <p className="text-sm font-medium text-gray-600 mb-1">Total de Assinantes</p>
                      <p className="text-3xl font-bold text-gray-900">0</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
                  <div className="flex items-center">
                    <div className="w-14 h-14 bg-[#6FD6FF] rounded-xl flex items-center justify-center">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div className="ml-6">
                      <p className="text-sm font-medium text-gray-600 mb-1">Receita Mensal</p>
                      <p className="text-3xl font-bold text-gray-900">R$ 0</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
                  <div className="flex items-center">
                    <div className="w-14 h-14 bg-[#007FB8] rounded-xl flex items-center justify-center">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div className="ml-6">
                      <p className="text-sm font-medium text-gray-600 mb-1">Crescimento</p>
                      <p className="text-3xl font-bold text-gray-900">0%</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
                  <div className="flex items-center">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6FD6FF, #01ABFE)' }}>
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="ml-6">
                      <p className="text-sm font-medium text-gray-600 mb-1">Taxa de Retenção</p>
                      <p className="text-3xl font-bold text-gray-900">0%</p>
                    </div>
                  </div>
                </div>
              </div> */}
            </div>
          )}

          {/* Seção de Meu Plano */}
          {activeTab === 'plan' && (
            <div className="space-y-8">
              {/* Plano Atual - Card Principal */}
              <div className="rounded-2xl shadow-xl p-8 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #6FD6FF, #01ABFE, #007FB8)' }}>
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                        <span className="text-sm font-medium text-white/90">Plano Ativo</span>
                      </div>
                      <h3 className="text-3xl font-bold mb-2">Plano Starter</h3>
                      <p className="text-white/90 text-lg">Ideal para barbearias iniciantes</p>
                    </div>
                    <div className="text-right">
                      <div className="text-5xl font-bold mb-1">R$ 97</div>
                      <div className="text-white/90 text-lg">/mês</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg p-6 border border-white/30">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-white/30 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-white/90">Funcionários</span>
                      </div>
                      <div className="text-2xl font-bold">Até 3</div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg p-6 border border-white/30">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-white/30 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-white/90">Agendamentos</span>
                      </div>
                      <div className="text-2xl font-bold">Ilimitados</div>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg p-6 border border-white/30">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-white/30 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-2 0c0 .993-.241 1.929-.668 2.754l-1.524-1.525a3.997 3.997 0 00.078-2.183l1.562-1.562C15.759 8.071 16 9.007 16 10zm-5.165 3.913l1.58 1.58A5.98 5.98 0 0110 16a5.976 5.976 0 01-2.516-.552l1.562-1.562a4.006 4.006 0 001.789.027zm-4.677-2.56a1 1 0 00-1.414-1.414l-.705.705a2 2 0 00-.547 1.458l.705.705a1 1 0 001.414-1.414l-.705-.705zM4 10a5.99 5.99 0 015.98-5.98l-.705.705a4.006 4.006 0 00-1.789.027l-1.562-1.562A5.976 5.976 0 004 10zm6.98-5.98l.705.705a4.006 4.006 0 011.789-.027l1.562 1.562A5.976 5.976 0 0016 10a5.99 5.99 0 00-5.98-5.98z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-white/90">Suporte</span>
                      </div>
                      <div className="text-2xl font-bold">24/7</div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <button className="bg-white text-[#01ABFE] px-8 py-4 rounded-lg font-semibold hover:bg-white/90 transition-all duration-200 shadow-lg hover:shadow-xl">
                      Alterar Plano
                    </button>
                    <button className="bg-white/20 backdrop-blur-sm text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/30 transition-all duration-200 border border-white/30">
                      Ver Detalhes Completos
                    </button>
                  </div>
                </div>
              </div>

              {/* Comparação de Planos */}
              <div className="bg-white rounded-3xl shadow-xl p-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Compare os Planos</h3>
                  <p className="text-gray-600">Escolha o plano ideal para o crescimento da sua barbearia</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Plano Starter */}
                  <div className="border-2 border-[#01ABFE] rounded-xl p-8 relative bg-gradient-to-b from-[#01ABFE]/5 to-white">
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-[#01ABFE] text-white text-sm font-semibold px-4 py-2 rounded-full shadow-lg">Seu Plano Atual</span>
                    </div>
                    <div className="text-center mb-6">
                      <h4 className="text-xl font-bold text-gray-900 mb-2">Starter</h4>
                      <div className="text-4xl font-bold text-[#01ABFE] mb-1">R$ 97</div>
                      <div className="text-gray-600">/mês</div>
                    </div>
                    <ul className="space-y-4 mb-8">
                      <li className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-[#01ABFE] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700">Até 3 funcionários</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-[#01ABFE] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700">Agendamentos ilimitados</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-[#01ABFE] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700">Suporte por email</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-[#01ABFE] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700">Relatórios básicos</span>
                      </li>
                    </ul>
                    <button className="w-full bg-[#01ABFE] text-white py-3 rounded-lg font-semibold hover:bg-[#0099E6] transition-colors">
                      Plano Atual
                    </button>
                  </div>

                  {/* Plano Professional */}
                  <div className="border-2 border-gray-200 rounded-xl p-8 hover:border-[#01ABFE] transition-all duration-200 hover:shadow-lg">
                    <div className="text-center mb-6">
                      <h4 className="text-xl font-bold text-gray-900 mb-2">Professional</h4>
                      <div className="text-4xl font-bold text-[#01ABFE] mb-1">R$ 197</div>
                      <div className="text-gray-600">/mês</div>
                    </div>
                    <ul className="space-y-4 mb-8">
                      <li className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-[#01ABFE] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700">Até 10 funcionários</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-[#01ABFE] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700">Relatórios avançados</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-[#01ABFE] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700">Suporte prioritário</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-[#01ABFE] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700">Integração com WhatsApp</span>
                      </li>
                    </ul>
                    <button className="w-full bg-[#01ABFE] text-white py-3 rounded-lg font-semibold hover:bg-[#0099E6] transition-colors">
                      Fazer Upgrade
                    </button>
                  </div>

                  {/* Plano Enterprise */}
                  <div className="border-2 border-gray-200 rounded-xl p-8 hover:border-[#01ABFE] transition-all duration-200 hover:shadow-lg">
                    <div className="text-center mb-6">
                      <h4 className="text-xl font-bold text-gray-900 mb-2">Enterprise</h4>
                      <div className="text-4xl font-bold text-[#01ABFE] mb-1">R$ 397</div>
                      <div className="text-gray-600">/mês</div>
                    </div>
                    <ul className="space-y-4 mb-8">
                      <li className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-[#01ABFE] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700">Funcionários ilimitados</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-[#01ABFE] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700">API personalizada</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-[#01ABFE] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700">Suporte dedicado</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-[#01ABFE] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-700">Treinamento personalizado</span>
                      </li>
                    </ul>
                    <button className="w-full bg-[#007FB8] text-white py-3 rounded-lg font-semibold hover:bg-[#006699] transition-colors">
                      Contatar Vendas
                    </button>
                  </div>
                </div>
              </div>

              {/* Informações de Cobrança */}
              <div className="bg-white rounded-3xl shadow-xl p-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Informações de Cobrança</h3>
                  <p className="text-gray-600">Gerencie seus pagamentos e faturas</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-gradient-to-br from-[#01ABFE]/5 to-[#6FD6FF]/5 rounded-xl p-6 border border-[#01ABFE]/20">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-[#01ABFE] rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">Próxima Cobrança</h4>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Data</span>
                        <span className="font-semibold text-gray-900">15 de Outubro, 2024</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Valor</span>
                        <span className="font-bold text-xl text-[#01ABFE]">R$ 97,00</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Status</span>
                        <span className="bg-[#01ABFE]/10 text-[#01ABFE] px-3 py-1 rounded-full text-sm font-medium">Ativo</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-gray-50 to-[#01ABFE]/5 rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-[#007FB8] rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm0 2v12h16V6H4zm2 2h12v2H6V8zm0 4h12v2H6v-2z" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">Método de Pagamento</h4>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #6FD6FF, #01ABFE)' }}>
                        <svg className="w-6 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm0 2v12h16V6H4zm2 2h12v2H6V8zm0 4h12v2H6v-2z" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">Cartão terminado em 4242</div>
                        <div className="text-sm text-gray-600">Visa •••• 4242</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                  <button className="bg-[#01ABFE] text-white px-8 py-3 rounded-lg font-semibold hover:bg-[#0099E6] transition-colors shadow-lg hover:shadow-xl">
                    Alterar Método de Pagamento
                  </button>
                  <button className="bg-gray-100 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors border border-gray-300">
                    Baixar Fatura
                  </button>
                  <button className="bg-gray-50 text-gray-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors border border-gray-200">
                    Histórico de Pagamentos
                  </button>
                </div>
              </div>
            </div>
          )}

          <ConfirmationModal
            isOpen={showDeleteModal}
            onClose={cancelDeleteEmployee}
            onConfirm={confirmDeleteEmployee}
            title="Excluir Funcionário"
            message={`Tem certeza que deseja excluir o funcionário "${employeeToDelete?.name}"? Esta ação não pode ser desfeita.`}
            confirmText="Excluir"
            cancelText="Cancelar"
            type="danger"
            isLoading={isDeleting}
          />

          <SubscriptionModal
            isOpen={showSubscriptionModal}
            onClose={() => setShowSubscriptionModal(false)}
            onSave={handleSaveSubscription}
            subscription={editingSubscription}
            mode={editingSubscription ? 'edit' : 'create'}
          />
        </div>
      </div>
    </div>
  );
}
