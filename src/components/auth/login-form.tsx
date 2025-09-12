'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { type LoginRequest } from '@/types/auth';

// Schema de validação
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
  tenantId: z.string().uuid('Tenant ID inválido'),
});

// Mock de tenants para demonstração
const mockTenants = [
  {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Barbearia Alfa',
    domain: 'barbearia-alfa.localhost',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Barbearia Beta',
    domain: 'barbearia-beta.localhost',
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'Barbearia Gama',
    domain: 'barbearia-gama.localhost',
  },
];

// Credenciais de teste
const testCredentials = [
  {
    email: 'joao@barbearia-alfa.com',
    password: 'senha123',
    tenantId: '550e8400-e29b-41d4-a716-446655440000',
    role: 'OWNER',
  },
  {
    email: 'pedro@barbearia-alfa.com',
    password: 'senha123',
    tenantId: '550e8400-e29b-41d4-a716-446655440000',
    role: 'BARBER',
  },
  {
    email: 'maria@barbearia-alfa.com',
    password: 'senha123',
    tenantId: '550e8400-e29b-41d4-a716-446655440000',
    role: 'ASSISTANT',
  },
];

export function LoginForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
    tenantId: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showTestCredentials, setShowTestCredentials] = useState(false);

  const handleInputChange = (field: keyof LoginRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Limpar erro do campo quando o usuário começa a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    try {
      loginSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro durante o login');
      }

      // Login bem-sucedido
      console.log('Login realizado com sucesso:', data);
      
      // Redirecionar para o dashboard
      router.push('/dashboard');
      
    } catch (error) {
      console.error('Erro no login:', error);
      setErrors({ 
        submit: error instanceof Error ? error.message : 'Erro durante o login' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fillTestCredentials = (credentials: typeof testCredentials[0]) => {
    setFormData({
      email: credentials.email,
      password: credentials.password,
      tenantId: credentials.tenantId,
    });
    setErrors({});
  };

  const getTenantName = (tenantId: string) => {
    const tenant = mockTenants.find(t => t.id === tenantId);
    return tenant ? tenant.name : 'Tenant não encontrado';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Noxora
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sistema de Gestão para Barbearias
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Seleção de Tenant */}
            <div>
              <label htmlFor="tenantId" className="block text-sm font-medium text-gray-700">
                Barbearia
              </label>
              <select
                id="tenantId"
                name="tenantId"
                value={formData.tenantId}
                onChange={(e) => handleInputChange('tenantId', e.target.value)}
                className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md ${
                  errors.tenantId ? 'border-red-300' : ''
                }`}
                required
              >
                <option value="">Selecione uma barbearia</option>
                {mockTenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name} ({tenant.domain})
                  </option>
                ))}
              </select>
              {errors.tenantId && (
                <p className="mt-1 text-sm text-red-600">{errors.tenantId}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                    errors.email ? 'border-red-300' : ''
                  }`}
                  placeholder="seu@email.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Senha */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                    errors.password ? 'border-red-300' : ''
                  }`}
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Credenciais de Teste */}
            <div className="border-t pt-4">
              <button
                type="button"
                onClick={() => setShowTestCredentials(!showTestCredentials)}
                className="text-sm text-primary-600 hover:text-primary-500"
              >
                {showTestCredentials ? 'Ocultar' : 'Mostrar'} credenciais de teste
              </button>
              
              {showTestCredentials && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-gray-500">
                    Use estas credenciais para testar o sistema:
                  </p>
                  {testCredentials.map((cred, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => fillTestCredentials(cred)}
                      className="block w-full text-left p-2 text-xs bg-gray-50 hover:bg-gray-100 rounded border"
                    >
                      <span className="font-medium">{cred.role}</span>: {cred.email}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Erro de submissão */}
            {errors.submit && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Erro no login
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{errors.submit}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Botão de Submit */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </button>
            </div>

            {/* Informações do tenant selecionado */}
            {formData.tenantId && (
              <div className="rounded-md bg-blue-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Barbearia selecionada
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p><strong>Nome:</strong> {getTenantName(formData.tenantId)}</p>
                      <p><strong>ID:</strong> {formData.tenantId}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </form>

          {/* Links úteis */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Sistema de autenticação
                </span>
              </div>
            </div>

            <div className="mt-6 text-center text-xs text-gray-500">
              <p>Este é um sistema de demonstração</p>
              <p>Use as credenciais de teste para acessar</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


