'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/logo';

export default function ProfessionalsPage() {
    const router = useRouter();
    const [selectedProfessionals, setSelectedProfessionals] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    const professionalOptions = [
        { value: '1', label: '1 profissional' },
        { value: '2', label: '2 profissionais' },
        { value: '3-4', label: '3 a 4 profissionais' },
        { value: '5-10', label: '5 a 10 profissionais' },
        { value: '11-30', label: '11 a 30 profissionais' },
        { value: '30+', label: 'Mais de 30 profissionais' }
    ];

    const handleProfessionalsSelect = async (value: string) => {
        setSelectedProfessionals(value);
        setIsLoading(true);

        try {
            // Aqui você pode salvar a informação do número de profissionais
            console.log('Número de profissionais selecionado:', value);

            // Simular um delay para mostrar o loading
            await new Promise(resolve => setTimeout(resolve, 800));

            // Redirecionar para a próxima etapa (endereço)
            router.push('/register/address');

        } catch (error) {
            console.error('Erro ao continuar:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBack = () => {
        router.back();
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
                        <h1 className="text-2xl font-bold text-gray-900">Número de profissionais que fazem atendimento em seu negócio</h1>
                    </div>

                    {/* Opções de seleção */}
                    <div className="grid grid-cols-2 gap-4">
                        {professionalOptions.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => handleProfessionalsSelect(option.value)}
                                disabled={isLoading}
                                className={`p-6 rounded-xl border-2 transition-all duration-200 relative ${selectedProfessionals === option.value
                                    ? 'border-[#01ABFE] bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                    } ${isLoading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                            >
                                <div className="text-center">
                                    <span className={`text-lg font-medium ${selectedProfessionals === option.value ? 'text-[#01ABFE]' : 'text-gray-600'
                                        }`}>
                                        {option.label}
                                    </span>
                                </div>
                                {selectedProfessionals === option.value && (
                                    <div className="absolute top-3 right-3">
                                        <div className="w-6 h-6 bg-[#01ABFE] rounded-full flex items-center justify-center">
                                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Indicador de progresso */}
                <div className="mt-12 flex justify-center">
                    <div className="flex space-x-4">
                        <div className="w-4 h-4 bg-[#01ABFE] rounded-full"></div>
                        <div className="w-4 h-4 bg-[#01ABFE] rounded-full"></div>
                        <div className="w-4 h-4 bg-[#01ABFE] rounded-full"></div>
                        <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                        <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
