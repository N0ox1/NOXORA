'use client';

import { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  CreditCardIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: 'STARTER' | 'PRO' | 'SCALE';
  status: 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'SUSPENDED';
  created_at: string;
  trial_ends_at?: string;
  subscription_ends_at?: string;
  barbershop_count: number;
  employee_count: number;
  client_count: number;
  monthly_revenue_cents: number;
}

interface PlanStats {
  STARTER: { count: number; revenue: number };
  PRO: { count: number; revenue: number };
  SCALE: { count: number; revenue: number };
}

export default function SuperAdminPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [planStats, setPlanStats] = useState<PlanStats>({
    STARTER: { count: 0, revenue: 0 },
    PRO: { count: 0, revenue: 0 },
    SCALE: { count: 0, revenue: 0 }
  });
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');

  // Mock data para desenvolvimento
  useEffect(() => {
    const mockTenants: Tenant[] = [
      {
        id: 'tnt_1',
        name: 'Barber Labs',
        slug: 'barber-labs',
        plan: 'PRO',
        status: 'TRIALING',
        created_at: '2024-01-15T10:00:00Z',
        trial_ends_at: '2024-02-15T10:00:00Z',
        barbershop_count: 2,
        employee_count: 8,
        client_count: 150,
        monthly_revenue_cents: 450000
      },
      {
        id: 'tnt_2',
        name: 'Corte & Estilo',
        slug: 'corte-estilo',
        plan: 'STARTER',
        status: 'ACTIVE',
        created_at: '2024-01-10T14:30:00Z',
        subscription_ends_at: '2025-01-10T14:30:00Z',
        barbershop_count: 1,
        employee_count: 3,
        client_count: 45,
        monthly_revenue_cents: 9900
      },
      {
        id: 'tnt_3',
        name: 'Barbearia Premium',
        slug: 'barbearia-premium',
        plan: 'SCALE',
        status: 'ACTIVE',
        created_at: '2023-12-01T09:00:00Z',
        subscription_ends_at: '2025-12-01T09:00:00Z',
        barbershop_count: 5,
        employee_count: 25,
        client_count: 500,
        monthly_revenue_cents: 2500000
      }
    ];

    setTenants(mockTenants);
    
    // Calcular estatísticas dos planos
    const stats = mockTenants.reduce((acc, tenant) => {
      acc[tenant.plan].count += 1;
      acc[tenant.plan].revenue += tenant.monthly_revenue_cents;
      return acc;
    }, {
      STARTER: { count: 0, revenue: 0 },
      PRO: { count: 0, revenue: 0 },
      SCALE: { count: 0, revenue: 0 }
    } as PlanStats);
    
    setPlanStats(stats);
  }, []);

  // Filtrar tenants
  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter;
    const matchesPlan = planFilter === 'all' || tenant.plan === planFilter;
    
    return matchesSearch && matchesStatus && matchesPlan;
  });

  // Handlers
  const handleEditTenant = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setShowTenantModal(true);
  };

  const handleDeleteTenant = (tenantId: string) => {
    if (confirm('Tem certeza que deseja excluir este tenant? Esta ação não pode ser desfeita.')) {
      setTenants(prev => prev.filter(t => t.id !== tenantId));
    }
  };

  const handleViewTenant = (tenant: Tenant) => {
    setSelectedTenant(tenant);
  };

  // Utilitários
  const formatCurrency = (cents: number) => {
    return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'TRIALING': return 'bg-blue-100 text-blue-800';
      case 'PAST_DUE': return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      case 'SUSPENDED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Ativo';
      case 'TRIALING': return 'Em Teste';
      case 'PAST_DUE': return 'Em Atraso';
      case 'CANCELLED': return 'Cancelado';
      case 'SUSPENDED': return 'Suspenso';
      default: return status;
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'STARTER': return 'bg-gray-100 text-gray-800';
      case 'PRO': return 'bg-blue-100 text-blue-800';
      case 'SCALE': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanText = (plan: string) => {
    switch (plan) {
      case 'STARTER': return 'Starter';
      case 'PRO': return 'Pro';
      case 'SCALE': return 'Scale';
      default: return plan;
    }
  };

  const getTotalRevenue = () => {
    return Object.values(planStats).reduce((total, plan) => total + plan.revenue, 0);
  };

  const getTotalTenants = () => {
    return Object.values(planStats).reduce((total, plan) => total + plan.count, 0);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Super Admin</h1>
              <p className="text-gray-600 mt-1">Visão global de todos os tenants</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Sistema Multi-Tenant</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BuildingOfficeIcon className="h-8 w-8 text-blue-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total de Tenants
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {getTotalTenants()}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CreditCardIcon className="h-8 w-8 text-green-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Receita Mensal
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatCurrency(getTotalRevenue())}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserGroupIcon className="h-8 w-8 text-yellow-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Tenants Ativos
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {tenants.filter(t => t.status === 'ACTIVE').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-8 w-8 text-purple-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Em Teste
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {tenants.filter(t => t.status === 'TRIALING').length}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Estatísticas por plano */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Estatísticas por Plano
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(planStats).map(([plan, stats]) => (
                <div key={plan} className="text-center">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-2 ${getPlanColor(plan)}`}>
                    {getPlanText(plan)}
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{stats.count}</div>
                  <div className="text-sm text-gray-500">tenants</div>
                  <div className="text-lg font-semibold text-green-600 mt-1">
                    {formatCurrency(stats.revenue)}
                  </div>
                  <div className="text-xs text-gray-500">receita mensal</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Filtros e busca */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar
                </label>
                <input
                  type="text"
                  placeholder="Nome ou slug do tenant..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos os status</option>
                  <option value="ACTIVE">Ativo</option>
                  <option value="TRIALING">Em Teste</option>
                  <option value="PAST_DUE">Em Atraso</option>
                  <option value="CANCELLED">Cancelado</option>
                  <option value="SUSPENDED">Suspenso</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plano
                </label>
                <select
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todos os planos</option>
                  <option value="STARTER">Starter</option>
                  <option value="PRO">Pro</option>
                  <option value="SCALE">Scale</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Tenants */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Tenants ({filteredTenants.length})
            </h3>
            
            {filteredTenants.length === 0 ? (
              <div className="text-center py-12">
                <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum tenant encontrado</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Tente ajustar os filtros de busca.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tenant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Plano
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Métricas
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Receita
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Criado em
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTenants.map((tenant) => (
                      <tr key={tenant.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                              <span className="text-sm font-medium text-gray-700">
                                {tenant.name.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{tenant.name}</div>
                              <div className="text-sm text-gray-500">@{tenant.slug}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPlanColor(tenant.plan)}`}>
                            {getPlanText(tenant.plan)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(tenant.status)}`}>
                            {getStatusText(tenant.status)}
                          </span>
                          {tenant.status === 'TRIALING' && tenant.trial_ends_at && (
                            <div className="text-xs text-gray-500 mt-1">
                              Teste até {formatDate(tenant.trial_ends_at)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="space-y-1">
                            <div>🏪 {tenant.barbershop_count} barbearias</div>
                            <div>👥 {tenant.employee_count} funcionários</div>
                            <div>👤 {tenant.client_count} clientes</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="font-medium text-green-600">
                            {formatCurrency(tenant.monthly_revenue_cents)}
                          </div>
                          <div className="text-xs text-gray-500">por mês</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(tenant.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleViewTenant(tenant)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                            title="Ver detalhes"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleEditTenant(tenant)}
                            className="text-green-600 hover:text-green-900 mr-3"
                            title="Editar"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTenant(tenant.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Excluir"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Detalhes do Tenant */}
      {selectedTenant && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Detalhes do Tenant: {selectedTenant.name}
                </h3>
                <button
                  onClick={() => setSelectedTenant(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nome</label>
                    <p className="text-sm text-gray-900">{selectedTenant.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Slug</label>
                    <p className="text-sm text-gray-900">@{selectedTenant.slug}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Plano</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPlanColor(selectedTenant.plan)}`}>
                      {getPlanText(selectedTenant.plan)}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedTenant.status)}`}>
                      {getStatusText(selectedTenant.status)}
                    </span>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Métricas</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{selectedTenant.barbershop_count}</div>
                      <div className="text-sm text-gray-600">Barbearias</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{selectedTenant.employee_count}</div>
                      <div className="text-sm text-gray-600">Funcionários</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{selectedTenant.client_count}</div>
                      <div className="text-sm text-gray-600">Clientes</div>
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Informações de Pagamento</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Receita Mensal</label>
                      <p className="text-lg font-semibold text-green-600">
                        {formatCurrency(selectedTenant.monthly_revenue_cents)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Criado em</label>
                      <p className="text-sm text-gray-900">{formatDate(selectedTenant.created_at)}</p>
                    </div>
                    {selectedTenant.trial_ends_at && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Teste até</label>
                        <p className="text-sm text-gray-900">{formatDate(selectedTenant.trial_ends_at)}</p>
                      </div>
                    )}
                    {selectedTenant.subscription_ends_at && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Assinatura até</label>
                        <p className="text-sm text-gray-900">{formatDate(selectedTenant.subscription_ends_at)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setSelectedTenant(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
