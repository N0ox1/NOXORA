'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/logo';

export default function AddressPage() {
    const router = useRouter();
    const [cep, setCep] = useState('');
    const [address, setAddress] = useState({
        logradouro: '',
        bairro: '',
        cidade: '',
        uf: ''
    });
    const [numero, setNumero] = useState('');
    const [complemento, setComplemento] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [cepError, setCepError] = useState('');
    const [showAddressFields, setShowAddressFields] = useState(false);

    const handleBack = () => {
        router.back();
    };

    const formatCep = (value: string) => {
        // Remove tudo que não é dígito
        const numbers = value.replace(/\D/g, '');
        // Aplica a máscara do CEP
        return numbers.replace(/(\d{5})(\d{3})/, '$1-$2');
    };

    const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formattedCep = formatCep(e.target.value);
        setCep(formattedCep);
        setCepError('');

        console.log('CEP formatado:', formattedCep, 'Tamanho:', formattedCep.length);

        // Se o CEP tem 9 caracteres (com máscara), busca o endereço
        if (formattedCep.length === 9) {
            console.log('Buscando CEP:', formattedCep);
            searchCep(formattedCep);
        } else {
            setShowAddressFields(false);
        }
    };

    const searchCep = async (cepValue: string) => {
        setIsLoading(true);
        setCepError('');

        try {
            // Remove a máscara do CEP
            const cleanCep = cepValue.replace(/\D/g, '');
            console.log('CEP limpo para busca:', cleanCep);

            if (cleanCep.length !== 8) {
                setCepError('CEP deve ter 8 dígitos');
                setShowAddressFields(false);
                return;
            }

            // Busca do CEP usando ViaCEP
            const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
            console.log('Response status:', response.status);

            const data = await response.json();
            console.log('Dados retornados:', data);

            if (data.erro) {
                setCepError('CEP não encontrado');
                setShowAddressFields(false);
            } else {
                setAddress({
                    logradouro: data.logradouro || '',
                    bairro: data.bairro || '',
                    cidade: data.localidade || '',
                    uf: data.uf || ''
                });
                setShowAddressFields(true);
                console.log('Endereço encontrado:', data);
            }
        } catch (error) {
            console.error('Erro ao buscar CEP:', error);
            setCepError('Erro ao buscar CEP. Tente novamente.');
            setShowAddressFields(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleContinue = async () => {
        if (!cep || !showAddressFields || !numero) {
            return;
        }

        setIsLoading(true);

        try {
            // Buscar dados do cadastro do localStorage
            const registrationData = localStorage.getItem('registrationData');
            if (!registrationData) {
                throw new Error('Dados de cadastro não encontrados. Por favor, recomece o processo.');
            }

            const { barbershopId } = JSON.parse(registrationData);

            // Montar endereço completo
            const enderecoCompleto = `${address.logradouro}, ${numero}${complemento ? ', ' + complemento : ''}, ${address.bairro}, ${address.localidade} - ${address.uf}, ${cep}`;

            // Salvar endereço na barbearia
            const response = await fetch('/api/v1/barbershop/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    address: enderecoCompleto
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao salvar endereço');
            }

            console.log('Endereço salvo com sucesso:', enderecoCompleto);

            // Redirecionar para a próxima etapa (definir senha)
            router.push('/register/password');

        } catch (error) {
            console.error('Erro ao continuar:', error);
            alert(error instanceof Error ? error.message : 'Erro ao salvar endereço');
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
                        <h1 className="text-2xl font-bold text-gray-900">Endereço do seu negócio</h1>
                        <p className="text-sm text-gray-600 mt-2">Informe seu endereço para ser encontrado facilmente pelos clientes</p>
                    </div>

                    {/* Formulário */}
                    <div className="space-y-6">
                        {/* Campo CEP */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                CEP
                            </label>
                            <div className="flex gap-3">
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        value={cep}
                                        onChange={handleCepChange}
                                        placeholder="00000-000"
                                        maxLength={9}
                                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#01ABFE] focus:border-[#01ABFE] transition-colors ${cepError ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                    />
                                    {isLoading && (
                                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#01ABFE]"></div>
                                        </div>
                                    )}
                                </div>
                                <a
                                    href="https://buscacepinter.correios.com.br/app/endereco/index.php"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#01ABFE] hover:text-[#007FB8] text-sm self-center whitespace-nowrap"
                                >
                                    Não sei meu CEP
                                </a>
                            </div>
                            {cepError && (
                                <p className="text-red-500 text-sm mt-1">{cepError}</p>
                            )}
                        </div>

                        {/* Campos de endereço (aparecem após CEP válido) */}
                        {showAddressFields && (
                            <div className="space-y-4">
                                {/* Bairro e Logradouro */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Bairro
                                        </label>
                                        <input
                                            type="text"
                                            value={address.bairro}
                                            readOnly
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Logradouro
                                        </label>
                                        <input
                                            type="text"
                                            value={address.logradouro}
                                            readOnly
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                                        />
                                    </div>
                                </div>

                                {/* Número e Complemento */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Número
                                        </label>
                                        <input
                                            type="text"
                                            value={numero}
                                            onChange={(e) => setNumero(e.target.value)}
                                            placeholder="123"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01ABFE] focus:border-[#01ABFE] transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Complemento
                                        </label>
                                        <input
                                            type="text"
                                            value={complemento}
                                            onChange={(e) => setComplemento(e.target.value)}
                                            placeholder="Apto 101"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01ABFE] focus:border-[#01ABFE] transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Botão Continuar */}
                        <button
                            onClick={handleContinue}
                            disabled={!showAddressFields || !numero || isLoading}
                            className={`w-full py-4 px-6 rounded-lg font-semibold text-white text-lg transition-all duration-200 ${showAddressFields && numero && !isLoading
                                ? 'bg-gradient-to-r from-[#6FD6FF] to-[#01ABFE] hover:opacity-90'
                                : 'bg-gray-300 cursor-not-allowed'
                                }`}
                        >
                            {isLoading ? 'Processando...' : 'Continuar'}
                        </button>
                    </div>
                </div>

                {/* Indicador de progresso */}
                <div className="mt-12 flex justify-center">
                    <div className="flex space-x-4">
                        <div className="w-4 h-4 bg-[#01ABFE] rounded-full"></div>
                        <div className="w-4 h-4 bg-[#01ABFE] rounded-full"></div>
                        <div className="w-4 h-4 bg-[#01ABFE] rounded-full"></div>
                        <div className="w-4 h-4 bg-[#01ABFE] rounded-full"></div>
                        <div className="w-4 h-4 bg-gray-300 rounded-full"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
