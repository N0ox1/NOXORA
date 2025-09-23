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
  const [userInfo, setUserInfo] = useState<{ tenantId: string; barbershopId: string } | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

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
        loadConfigurations()
      ]).then(() => {
        setIsLoadingData(false);
        setLastUpdate(new Date());
      }).catch((error) => {
        console.error('Erro ao carregar dados:', error);
        setIsLoadingData(false);
      });
    }
  }, [userInfo]);

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
        loadConfigurations()
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
      const response = await fetch('/api/v1/auth/me', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        console.log('👤 Usuário carregado:', data);
        setUserInfo({
          tenantId: data.user.tenantId,
          barbershopId: data.user.barbershopId
        });
      } else {
        console.error('Erro ao carregar informações do usuário');
      }
    } catch (error) {
      console.error('Erro ao carregar informações do usuário:', error);
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
      const response = await fetch('/api/v1/barbershop/upload-image', {
        method: 'POST',
        headers: {
          'x-tenant-id': userInfo.tenantId || ''
        },
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

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '-') // Substitui espaços por hífens
      .replace(/-+/g, '-') // Remove hífens duplicados
      .trim();
  };

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
    const newSlug = generateSlug(name);
    setConfigurations(prev => ({
      ...prev,
      name,
      slug: newSlug
    }));
    triggerAutoSave();
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
      const response = await fetch('/api/v1/barbershop/settings', {
        headers: { 'x-tenant-id': userInfo?.tenantId || '' },
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
          const newConfig = {
            ...prev,
            name: data.name || prev.name,
            slug: data.slug || prev.slug,
            description: data.description || prev.description,
            address: data.address || prev.address,
            phone: data.phone || prev.phone,
            email: data.email || prev.email,
            instagram: (() => {
              const newInstagram = data.instagram !== undefined ? data.instagram : prev.instagram;
              console.log('📱 Atualizando Instagram:', {
                dataInstagram: data.instagram,
                prevInstagram: prev.instagram,
                newInstagram: newInstagram,
                dataInstagramType: typeof data.instagram
              });
              return newInstagram;
            })(),
            // Atualizar URLs do servidor
            logoUrl: data.logoUrl !== undefined ? data.logoUrl : prev.logoUrl,
            bannerUrl: data.bannerUrl !== undefined ? data.bannerUrl : prev.bannerUrl,
            openingHours: workingHours ? Object.keys(workingHours).reduce((acc: any, day) => {
              const dayData = workingHours[day];
              return {
                ...acc,
                [day]: {
                  ...dayData,
                  open: formatTimeString(dayData.open),
                  close: formatTimeString(dayData.close)
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

          // Não limpar inputs de arquivo aqui - manter seleção do usuário

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

  const saveConfigurations = async (isAutoSave = false, typeToRemove?: string, imageUrl?: string, imageType?: 'logo' | 'banner', instagramValue?: string) => {
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
        name: configurations.name,
        slug: configurations.slug,
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

      const response = await fetch('/api/v1/barbershop/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': userInfo?.tenantId || ''
        },
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
      {/* Menu Lateral Vertical */}
      <div className="w-72 bg-black shadow-2xl border-r border-gray-800 flex flex-col flex-shrink-0">
        {/* Header do Menu */}
        <div className="p-6 border-b border-gray-800">
          <div className="text-center">
            <h1 className="text-xl font-bold text-white">
              {configurations.name}
            </h1>
            <p className="text-gray-300 text-sm">Dashboard Admin</p>
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
          <div className="px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-white">
                  {activeTab === 'services' && 'Serviços'}
                  {activeTab === 'employees' && 'Funcionários'}
                  {activeTab === 'agenda' && 'Agenda'}
                  {activeTab === 'clients' && 'Clientes'}
                  {activeTab === 'subscriptions' && 'Assinaturas'}
                  {activeTab === 'plan' && 'Meu Plano'}
                  {activeTab === 'configurations' && 'Configurações'}
                </h2>
                <p className="text-slate-400 mt-1">
                  {activeTab === 'services' && 'Gerencie os serviços oferecidos pela sua barbearia'}
                  {activeTab === 'employees' && 'Administre sua equipe de funcionários'}
                  {activeTab === 'agenda' && 'Visualize e gerencie os agendamentos'}
                  {activeTab === 'clients' && 'Controle sua base de clientes'}
                  {activeTab === 'subscriptions' && 'Configure planos de assinatura para seus clientes'}
                  {activeTab === 'plan' && 'Gerencie sua assinatura da plataforma Noxora'}
                  {activeTab === 'configurations' && 'Configure as opções da sua barbearia'}
                </p>
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
              <div className="flex h-full w-full">
                {/* Sidebar com Calendário e Filtros */}
                <div className="w-80 bg-black border-r border-gray-800 p-4 space-y-4">
                  {/* Calendário */}
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
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
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-white">
                      <CogIcon className="w-5 h-5" />
                      <span className="font-medium">Buscar e Agendar</span>
                    </div>

                    <div className="flex items-center space-x-2 text-white">
                      <CogIcon className="w-5 h-5" />
                      <span className="font-medium">Seleção de Profissionais</span>
                    </div>

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
                      <label className="block text-xs text-slate-400 mb-1">Fechamento de Conta</label>
                      <select className="w-full px-2 py-1.5 bg-gray-900 border border-gray-700 rounded text-white text-xs">
                        <option>Todos</option>
                        <option>Pago</option>
                        <option>Pendente</option>
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
                      <div className="flex items-center space-x-4">
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

                  {/* Cabeçalho dos Profissionais */}
                  <div className="bg-gray-900 border-b border-gray-800">
                    <div className="flex">
                      <div className="w-20 bg-gray-900 border-r border-gray-800 p-3">
                        <div className="text-xs text-gray-400 text-center">Profissional</div>
                      </div>
                      <div className="flex-1 bg-gray-900 p-3">
                        <div className="flex items-center">
                          <span className="text-white font-medium">vitor</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Grade da Agenda */}
                  <div className="flex" style={{ height: '600px' }}>
                    {/* Coluna de Horários */}
                    <div className="w-20 bg-slate-800 border-r border-slate-700">
                      {(() => {
                        const { startHour, endHour, isClosed } = getOperatingHours();

                        if (isClosed) {
                          return (
                            <div className="h-16 flex items-center justify-center text-sm text-slate-500">
                              Fechado
                            </div>
                          );
                        }

                        const hours = [];
                        const totalHours = endHour - startHour + 1;
                        const slotHeight = `calc(600px / ${totalHours})`; // Altura fixa de 600px dividida pelas horas

                        for (let hour = startHour; hour <= endHour; hour++) {
                          const isSpecial = hour === startHour || hour === endHour;
                          hours.push(
                            <div
                              key={hour}
                              className={`border-b border-slate-700 flex items-start justify-center text-xs pt-1 ${isSpecial
                                ? 'bg-[#01ABFE]/20 text-[#01ABFE]'
                                : 'text-slate-400'
                                }`}
                              style={{ height: slotHeight }}
                            >
                              {hour}h
                            </div>
                          );
                        }
                        return hours;
                      })()}
                    </div>

                    {/* Coluna de Agendamentos */}
                    <div className="flex-1 relative">

                      {/* Grade de horários */}
                      {(() => {
                        const { startHour, endHour, isClosed } = getOperatingHours();

                        if (isClosed) {
                          return (
                            <div className="h-16 border-b border-slate-700 border-dashed relative flex items-center justify-center">
                              <span className="text-slate-500 text-sm">Estabelecimento fechado</span>
                            </div>
                          );
                        }

                        const timeSlots = [];
                        const totalHours = endHour - startHour + 1;
                        const slotHeight = `calc(600px / ${totalHours})`; // Altura fixa de 600px dividida pelas horas

                        for (let hour = startHour; hour <= endHour; hour++) {
                          const isLastHour = hour === endHour;
                          timeSlots.push(
                            <div
                              key={hour}
                              className="relative"
                              style={{ height: slotHeight }}
                            >
                              {/* Linha sólida na parte superior (divisão entre horários) */}
                              <div className="absolute top-0 left-0 right-0 h-px bg-gray-700"></div>

                              {/* Linha pontilhada no meio da hora (9:30) */}
                              <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-700 border-dashed border-t"></div>

                              {/* Linha sólida na parte inferior (exceto na última hora) */}
                              {!isLastHour && (
                                <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-700"></div>
                              )}

                              {/* Aqui ficariam os agendamentos */}
                            </div>
                          );
                        }
                        return timeSlots;
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
                          value={configurations.name}
                          onChange={(e) => handleSlugChange(e.target.value)}
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
                            value={configurations.slug}
                            onChange={(e) => handleConfigChange('slug', e.target.value)}
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
                          value={configurations.description}
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
                          value={configurations.address}
                          onChange={(e) => handleConfigChange('address', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Rua, número - Bairro, Cidade"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                        <input
                          type="text"
                          value={configurations.phone}
                          onChange={(e) => handleConfigChange('phone', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="(11) 99999-9999"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          value={configurations.email}
                          onChange={(e) => handleConfigChange('email', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="contato@barbearia.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Link do Instagram</label>
                        <input
                          type="text"
                          value={configurations.instagram}
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
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG até 5MB. Recomendado: 1200x400px</p>
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
                                  value={dayConfig.open}
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
                                  value={dayConfig.close}
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
                                  onChange={(e) => handleConfigChange('openingHours', {
                                    ...configurations.openingHours,
                                    [dayKey]: { ...dayConfig, closed: !e.target.checked }
                                  })}
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
                        className="h-4 w-4 text-gray-400 focus:ring-gray-600 border-gray-600 rounded"
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

          {/* Modal de Confirmação de Exclusão */}
          {/* Seção de Assinaturas */}
          {activeTab === 'subscriptions' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Gerenciar Assinaturas</h2>
                  <p className="text-gray-600 mt-1">Configure planos de assinatura para seus clientes</p>
                </div>
                <button className="bg-gradient-to-r from-pink-500 to-pink-600 text-white px-6 py-3 rounded-xl font-medium hover:from-pink-600 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                  <PlusIcon className="h-5 w-5 inline mr-2" />
                  Nova Assinatura
                </button>
              </div>

              {/* Cards de Assinaturas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
                {/* Plano Básico */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                      <span className="text-white text-xl font-bold">B</span>
                    </div>
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Ativo</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Plano Básico</h3>
                  <p className="text-gray-600 text-sm mb-4">1 corte por mês + desconto em produtos</p>
                  <div className="flex items-baseline mb-4">
                    <span className="text-3xl font-bold text-gray-900">R$ 29</span>
                    <span className="text-gray-600 ml-1">/mês</span>
                  </div>
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      1 corte por mês
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      10% desconto em produtos
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Agendamento prioritário
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                      Editar
                    </button>
                    <button className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors">
                      Ver Assinantes
                    </button>
                  </div>
                </div>

                {/* Plano Premium */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 p-6 hover:shadow-xl transition-all duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <span className="text-white text-xl font-bold">P</span>
                    </div>
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Ativo</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Plano Premium</h3>
                  <p className="text-gray-600 text-sm mb-4">3 cortes por mês + produtos inclusos</p>
                  <div className="flex items-baseline mb-4">
                    <span className="text-3xl font-bold text-gray-900">R$ 79</span>
                    <span className="text-gray-600 ml-1">/mês</span>
                  </div>
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      3 cortes por mês
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Produtos inclusos
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Agendamento flexível
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                      Editar
                    </button>
                    <button className="flex-1 bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-600 transition-colors">
                      Ver Assinantes
                    </button>
                  </div>
                </div>

                {/* Adicionar Novo Plano */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300 p-6 hover:border-gray-400 transition-all duration-200 cursor-pointer">
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-12 h-12 bg-gray-300 rounded-xl flex items-center justify-center mb-4">
                      <PlusIcon className="h-6 w-6 text-gray-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Criar Novo Plano</h3>
                    <p className="text-gray-600 text-sm">Adicione um novo plano de assinatura</p>
                  </div>
                </div>
              </div>

              {/* Estatísticas de Assinaturas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-8">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total de Assinantes</p>
                      <p className="text-2xl font-bold text-gray-900">47</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Receita Mensal</p>
                      <p className="text-2xl font-bold text-gray-900">R$ 3.247</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Crescimento</p>
                      <p className="text-2xl font-bold text-gray-900">+12%</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Taxa de Retenção</p>
                      <p className="text-2xl font-bold text-gray-900">89%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Seção de Meu Plano */}
          {activeTab === 'plan' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Meu Plano Noxora</h2>
                  <p className="text-gray-600 mt-1">Gerencie sua assinatura da plataforma</p>
                </div>
              </div>

              {/* Plano Atual */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-2xl p-8 text-white">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Plano Starter</h3>
                    <p className="text-[#01ABFE]">Ideal para barbearias iniciantes</p>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold">R$ 97</div>
                    <div className="text-[#01ABFE]">/mês</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-white/20 rounded-lg p-4">
                    <div className="text-sm text-[#01ABFE] mb-1">Funcionários</div>
                    <div className="text-2xl font-bold">Até 3</div>
                  </div>
                  <div className="bg-white/20 rounded-lg p-4">
                    <div className="text-sm text-[#01ABFE] mb-1">Agendamentos</div>
                    <div className="text-2xl font-bold">Ilimitados</div>
                  </div>
                  <div className="bg-white/20 rounded-lg p-4">
                    <div className="text-sm text-[#01ABFE] mb-1">Suporte</div>
                    <div className="text-2xl font-bold">24/7</div>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-[#0099E6] transition-colors border border-[#0099E6]">
                    Alterar Plano
                  </button>
                  <button className="bg-white/20 text-white px-6 py-3 rounded-lg font-medium hover:bg-white/30 transition-colors">
                    Ver Detalhes
                  </button>
                </div>
              </div>

              {/* Comparação de Planos */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Compare os Planos</h3>

                <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {/* Plano Starter */}
                  <div className="border-2 border-slate-600 rounded-xl p-6 relative">
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-full">Atual</span>
                    </div>
                    <div className="text-center mb-4">
                      <h4 className="text-lg font-bold text-gray-900">Starter</h4>
                      <div className="text-3xl font-bold text-gray-900 mt-2">R$ 97</div>
                      <div className="text-gray-600">/mês</div>
                    </div>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-center">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Até 3 funcionários
                      </li>
                      <li className="flex items-center">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Agendamentos ilimitados
                      </li>
                      <li className="flex items-center">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Suporte por email
                      </li>
                    </ul>
                  </div>

                  {/* Plano Professional */}
                  <div className="border-2 border-gray-200 rounded-xl p-6">
                    <div className="text-center mb-4">
                      <h4 className="text-lg font-bold text-gray-900">Professional</h4>
                      <div className="text-3xl font-bold text-gray-900 mt-2">R$ 197</div>
                      <div className="text-gray-600">/mês</div>
                    </div>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-center">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Até 10 funcionários
                      </li>
                      <li className="flex items-center">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Relatórios avançados
                      </li>
                      <li className="flex items-center">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Suporte prioritário
                      </li>
                    </ul>
                    <button className="w-full mt-4 bg-gray-800 text-white py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors border border-gray-700">
                      Fazer Upgrade
                    </button>
                  </div>

                  {/* Plano Enterprise */}
                  <div className="border-2 border-gray-200 rounded-xl p-6">
                    <div className="text-center mb-4">
                      <h4 className="text-lg font-bold text-gray-900">Enterprise</h4>
                      <div className="text-3xl font-bold text-gray-900 mt-2">R$ 397</div>
                      <div className="text-gray-600">/mês</div>
                    </div>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-center">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Funcionários ilimitados
                      </li>
                      <li className="flex items-center">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        API personalizada
                      </li>
                      <li className="flex items-center">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Suporte dedicado
                      </li>
                    </ul>
                    <button className="w-full mt-4 bg-gray-200 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors">
                      Contatar Vendas
                    </button>
                  </div>
                </div>
              </div>

              {/* Informações de Cobrança */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Informações de Cobrança</h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Próxima Cobrança</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Data</span>
                        <span className="font-medium">15 de Outubro, 2024</span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-gray-600">Valor</span>
                        <span className="font-bold text-lg">R$ 97,00</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Método de Pagamento</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-[#6FD6FF] rounded-lg flex items-center justify-center mr-3">
                          <svg className="w-5 h-5 text-[#01ABFE]" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm0 2v12h16V6H4zm2 2h12v2H6V8zm0 4h12v2H6v-2z" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-medium">Cartão terminado em 4242</div>
                          <div className="text-sm text-gray-600">Visa •••• 4242</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex space-x-4">
                  <button className="bg-gray-800 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors border border-gray-700">
                    Alterar Método de Pagamento
                  </button>
                  <button className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                    Baixar Fatura
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
        </div>
      </div>
    </div>
  );
}
