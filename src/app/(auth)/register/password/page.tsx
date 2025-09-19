'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/logo';

export default function PasswordPage() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<{
        password?: string;
        submit?: string;
    }>({});

    const handleBack = () => {
        router.back();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        // Validações
        if (!password) {
            setErrors({ password: 'Senha é obrigatória' });
            return;
        }

        if (password.length < 6) {
            setErrors({ password: 'Senha deve ter pelo menos 6 caracteres' });
            return;
        }

        setIsLoading(true);

        try {
            // Buscar dados do cadastro do localStorage (dados temporários)
            console.log('🔍 Buscando dados de cadastro no localStorage...');
            const registrationData = localStorage.getItem('registrationData');
            if (!registrationData) {
                console.error('❌ Dados de cadastro não encontrados no localStorage');
                throw new Error('Dados de cadastro não encontrados. Por favor, recomece o processo.');
            }

            const { userId, tenantId, barbershopId } = JSON.parse(registrationData);
            console.log('✅ Dados encontrados:', { userId, tenantId, barbershopId });

            // Chamar API para definir senha e fazer login automático
            console.log('🌐 Chamando API complete-registration...');
            const response = await fetch('/api/v1/auth/complete-registration', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId,
                    password, // Será hasheada no backend
                }),
            });

            console.log('📡 Resposta da API:', { status: response.status, ok: response.ok });

            const data = await response.json();
            console.log('📋 Dados da resposta:', data);

            if (!response.ok) {
                console.error('❌ Erro na API:', data);
                throw new Error(data.message || 'Erro ao finalizar cadastro');
            }

            // Limpar dados temporários do localStorage
            console.log('🧹 Limpando dados temporários...');
            localStorage.removeItem('registrationData');

            // Redirecionar para o painel admin
            console.log('🔄 Redirecionando para /admin...');
            router.push('/admin');

        } catch (error) {
            console.error('Erro ao finalizar cadastro:', error);
            setErrors({
                submit: error instanceof Error ? error.message : 'Erro ao finalizar cadastro'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-start justify-center pt-16 p-4">
            <div className="w-full max-w-2xl">
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <Logo width={220} height={70} />
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-2xl p-10 relative">
                    {/* Botão de voltar */}
                    <button
                        onClick={handleBack}
                        className="absolute left-6 top-6 p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    {/* Cabeçalho */}
                    <div className="text-center mb-12">
                        <p className="text-lg text-gray-500 mb-4">Informações adicionais</p>
                        <h1 className="text-2xl font-bold text-gray-900">Definir senha</h1>
                        <p className="text-sm text-gray-600 mt-2">Crie uma senha segura para sua conta</p>
                    </div>

                    {/* Formulário */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Campo de senha */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Senha
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (errors.password) {
                                            setErrors(prev => ({ ...prev, password: undefined }));
                                        }
                                    }}
                                    className={`w-full px-4 py-3 pr-12 rounded-lg border-2 transition-colors ${errors.password
                                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                                        : 'border-gray-200 focus:border-[#01ABFE] focus:ring-[#01ABFE]'
                                        } focus:outline-none focus:ring-2 focus:ring-opacity-20`}
                                    placeholder="Digite sua senha"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                    {showPassword ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                        </svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                            )}
                        </div>

                        {/* Botão de continuar */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full py-4 px-6 rounded-lg font-semibold text-white text-lg transition-all duration-200 ${!isLoading
                                ? 'bg-gradient-to-r from-[#6FD6FF] to-[#01ABFE] hover:opacity-90'
                                : 'bg-gray-300 cursor-not-allowed'
                                }`}
                        >
                            {isLoading ? 'Definindo senha...' : 'Finalizar cadastro'}
                        </button>

                        {/* Erro geral */}
                        {errors.submit && (
                            <div className="text-center">
                                <p className="text-sm text-red-600">{errors.submit}</p>
                            </div>
                        )}
                    </form>
                </div>

                {/* Indicador de progresso */}
                <div className="mt-12 flex justify-center">
                    <div className="flex space-x-4">
                        <div className="w-4 h-4 bg-[#01ABFE] rounded-full"></div>
                        <div className="w-4 h-4 bg-[#01ABFE] rounded-full"></div>
                        <div className="w-4 h-4 bg-[#01ABFE] rounded-full"></div>
                        <div className="w-4 h-4 bg-[#01ABFE] rounded-full"></div>
                        <div className="w-4 h-4 bg-[#01ABFE] rounded-full"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}