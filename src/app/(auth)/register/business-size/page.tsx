'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/logo';

function BusinessSizeContent() {
    const router = useRouter();
    const [selectedSize, setSelectedSize] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSizeSelect = async (size: string) => {
        setSelectedSize(size);
        setIsLoading(true);

        try {
            // Aqui você pode salvar a informação do tamanho do negócio
            console.log('Tamanho do negócio selecionado:', size);

            // Simular um delay para mostrar o loading
            await new Promise(resolve => setTimeout(resolve, 800));

            // Redirecionar para a próxima etapa (número de profissionais)
            router.push('/register/professionals');

        } catch (error) {
            console.error('Erro ao continuar:', error);
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

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-2xl p-10">
                    {/* Cabeçalho */}
                    <div className="text-center mb-12">
                        <p className="text-lg text-gray-500 mb-4">Informações adicionais</p>
                        <h1 className="text-4xl font-bold text-gray-900">Tamanho do negócio</h1>
                    </div>

                    {/* Opções de seleção */}
                    <div className="space-y-6">
                        <button
                            onClick={() => handleSizeSelect('single')}
                            disabled={isLoading}
                            className={`w-full p-10 rounded-xl border-2 transition-all duration-200 relative ${selectedSize === 'single'
                                ? 'border-[#01ABFE] bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                                } ${isLoading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                        >
                            <div className="text-center">
                                <span className={`text-2xl font-medium ${selectedSize === 'single' ? 'text-[#01ABFE]' : 'text-gray-600'
                                    }`}>
                                    Estabelecimento único
                                </span>
                            </div>
                            {selectedSize === 'single' && (
                                <div className="absolute top-4 right-4">
                                    <div className="w-7 h-7 bg-[#01ABFE] rounded-full flex items-center justify-center">
                                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </div>
                            )}
                        </button>

                        <button
                            onClick={() => handleSizeSelect('chain')}
                            disabled={isLoading}
                            className={`w-full p-10 rounded-xl border-2 transition-all duration-200 relative ${selectedSize === 'chain'
                                ? 'border-[#01ABFE] bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                                } ${isLoading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                        >
                            <div className="text-center">
                                <span className={`text-2xl font-medium ${selectedSize === 'chain' ? 'text-[#01ABFE]' : 'text-gray-600'
                                    }`}>
                                    Rede ou Franquia
                                </span>
                            </div>
                            {selectedSize === 'chain' && (
                                <div className="absolute top-4 right-4">
                                    <div className="w-7 h-7 bg-[#01ABFE] rounded-full flex items-center justify-center">
                                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </div>
                            )}
                        </button>
                    </div>

                </div>

                {/* Indicador de progresso */}
                <div className="mt-12 flex justify-center">
                    <div className="flex space-x-4">
                        <div className="w-4 h-4 bg-[#01ABFE] rounded-full"></div>
                        <div className="w-4 h-4 bg-[#01ABFE] rounded-full"></div>
                        <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                        <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                        <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function BusinessSizePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#01ABFE] mx-auto mb-4"></div>
                    <p className="text-gray-600">Carregando...</p>
                </div>
            </div>
        }>
            <BusinessSizeContent />
        </Suspense>
    );
}
