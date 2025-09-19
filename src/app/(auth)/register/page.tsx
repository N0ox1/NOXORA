'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Phone, Mail, Building } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [hasDiscountCoupon, setHasDiscountCoupon] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [showTermsTooltip, setShowTermsTooltip] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation(); // Previne validação nativa do HTML5
    setIsLoading(true);
    setErrors({});

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      businessName: formData.get('businessName') as string,
      hasDiscountCoupon,
      couponCode: hasDiscountCoupon ? couponCode : '',
      terms: formData.get('terms') === 'on'
    };

    // Validações básicas
    const newErrors: { [key: string]: string } = {};

    if (!data.name.trim()) {
      newErrors.name = 'Nome completo é obrigatório';
    }

    if (!data.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!data.email.includes('@') || !data.email.includes('.')) {
      newErrors.email = 'Por favor, insira um email válido';
    }

    if (!data.phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório';
    } else if (data.phone.length < 14) { // (11) 99999-9999 = 14 caracteres
      newErrors.phone = 'Por favor, insira um telefone válido';
    }

    if (!data.businessName.trim()) {
      newErrors.businessName = 'Nome do negócio é obrigatório';
    }

    if (!data.terms) {
      setShowTermsTooltip(true);
      // Esconder o tooltip após 3 segundos
      setTimeout(() => setShowTermsTooltip(false), 3000);
    }

    if (Object.keys(newErrors).length > 0 || !data.terms) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/v1/auth/register-step1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone,
          businessName: data.businessName,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('Erro na API de registro:', result);

        // Tratar diferentes tipos de erro
        if (result.code === 'email_exists') {
          throw new Error('Este email já está cadastrado em nosso sistema. Tente fazer login ou use outro email.');
        } else if (result.code === 'phone_exists') {
          throw new Error('Este telefone já está cadastrado em nosso sistema. Use outro número de telefone.');
        } else {
          throw new Error(result.message || result.error || 'Erro durante o registro');
        }
      }

      // Primeira etapa do registro bem-sucedida
      console.log('Primeira etapa do registro realizada com sucesso:', result);

      // Verificar se estamos no cliente antes de acessar localStorage
      if (typeof window !== 'undefined') {
        // Salvar dados temporários no localStorage para uso posterior
        localStorage.setItem('registrationData', JSON.stringify({
          userId: result.data.userId,
          tenantId: result.data.tenantId,
          barbershopId: result.data.barbershopId,
          businessName: result.data.businessName,
          ownerName: result.data.ownerName
        }));
      }

      // Redirecionar diretamente para a próxima etapa
      router.push('/register/business-size');

    } catch (error) {
      console.error('Erro no registro:', error);
      setErrors({
        submit: error instanceof Error ? error.message : 'Erro durante o registro'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatPhone = (value: string) => {
    // Remove tudo que não é dígito
    const numbers = value.replace(/\D/g, '');

    // Aplica a máscara (11) 99999-9999
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    e.target.value = formatted;
    // Limpar erro quando o usuário começar a digitar
    if (errors.phone) {
      setErrors(prev => ({ ...prev, phone: undefined }));
    }
  };

  const handleInputChange = (field: string) => {
    // Limpar erro quando o usuário começar a digitar
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleTermsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Esconder tooltip quando o usuário marcar o checkbox
    if (e.target.checked) {
      setShowTermsTooltip(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Cadastrar Negócio
            </h1>
            <p className="text-gray-600">
              Junte-se à Noxora e expanda seu negócio
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* Nome Completo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome Completo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="name"
                  placeholder="Seu nome completo"
                  onChange={() => handleInputChange('name')}
                  className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#01ABFE] focus:border-[#01ABFE] ${errors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>
            </div>

            {/* Celular */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Celular
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  name="phone"
                  placeholder="(11) 99999-9999"
                  onChange={handlePhoneChange}
                  className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#01ABFE] focus:border-[#01ABFE] ${errors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  placeholder="seu@email.com"
                  onChange={() => handleInputChange('email')}
                  className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#01ABFE] focus:border-[#01ABFE] ${errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
            </div>

            {/* Nome do Negócio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Negócio
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="businessName"
                  placeholder="Nome da sua empresa"
                  onChange={() => handleInputChange('businessName')}
                  className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#01ABFE] focus:border-[#01ABFE] ${errors.businessName ? 'border-red-500' : 'border-gray-300'
                    }`}
                />
                {errors.businessName && (
                  <p className="mt-1 text-sm text-red-600">{errors.businessName}</p>
                )}
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-4">
              {/* Cupom de Desconto */}
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="hasDiscountCoupon"
                    checked={hasDiscountCoupon}
                    onChange={(e) => setHasDiscountCoupon(e.target.checked)}
                    className="h-4 w-4 text-[#01ABFE] focus:ring-[#01ABFE] border-gray-300 rounded"
                  />
                  <label htmlFor="hasDiscountCoupon" className="ml-2 block text-sm text-gray-700">
                    Tenho cupom de desconto
                  </label>
                </div>

                {/* Campo de Cupom - aparece quando checkbox está marcado */}
                {hasDiscountCoupon && (
                  <div className="ml-6">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Digite seu cupom de desconto"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#01ABFE] focus:border-[#01ABFE] text-sm"
                    />
                  </div>
                )}
              </div>

              {/* Termos de Uso */}
              <div className="flex items-start relative">
                <input
                  type="checkbox"
                  id="terms"
                  name="terms"
                  onChange={handleTermsChange}
                  className="h-4 w-4 mt-1 text-[#01ABFE] focus:ring-[#01ABFE] border-gray-300 rounded accent-[#01ABFE]"
                />
                <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                  Li e aceito os{' '}
                  <a href="#" className="text-[#01ABFE] hover:text-[#007FB8] underline">
                    termos de uso
                  </a>{' '}
                  e a{' '}
                  <a href="#" className="text-[#01ABFE] hover:text-[#007FB8] underline">
                    política de privacidade
                  </a>
                </label>

                {/* Tooltip moderno */}
                {showTermsTooltip && (
                  <div className="absolute top-0 left-0 transform -translate-y-full mb-2 z-10">
                    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 max-w-xs">
                      <div className="flex items-center space-x-2">
                        <div className="flex-shrink-0">
                          <div className="w-6 h-6 bg-[#01ABFE] rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                          </div>
                        </div>
                        <div className="text-sm text-gray-700">
                          <p className="font-medium">Aceite os termos para continuar</p>
                          <p className="text-gray-500">É necessário concordar com nossos termos de uso</p>
                        </div>
                      </div>
                      {/* Seta do tooltip */}
                      <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Botão de Cadastro */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center py-3 px-4 border-0 rounded-lg text-sm font-medium text-white focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:opacity-90"
              style={{
                background: 'linear-gradient(135deg, #6FD6FF, #01ABFE, #007FB8)',
                boxShadow: 'none'
              }}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Cadastrando...
                </>
              ) : (
                'Cadastrar Negócio'
              )}
            </button>

            {/* Erros */}
            {errors.submit && (
              <div className="text-red-600 text-sm text-center">
                {errors.submit}
              </div>
            )}


          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Já faz parte da Noxora?{' '}
              <a href="/login" className="text-[#01ABFE] hover:text-[#007FB8] font-medium">
                Acesse sua conta
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
