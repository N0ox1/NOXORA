'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

interface SubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: SubscriptionData) => Promise<void>;
    subscription?: SubscriptionData | null;
    mode: 'create' | 'edit';
}

interface SubscriptionData {
    id?: string;
    name: string;
    description?: string;
    priceCents: number;
    durationDays: number;
    services: string[];
    benefits: string[];
    isActive: boolean;
}

export default function SubscriptionModal({
    isOpen,
    onClose,
    onSave,
    subscription,
    mode
}: SubscriptionModalProps) {
    const [formData, setFormData] = useState<SubscriptionData>({
        name: '',
        description: '',
        priceCents: 0,
        durationDays: 30,
        services: [],
        benefits: [],
        isActive: true,
    });

    const [newService, setNewService] = useState('');
    const [newBenefit, setNewBenefit] = useState('');
    const [priceInput, setPriceInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (subscription && mode === 'edit') {
            setFormData(subscription);
            setPriceInput(
                subscription.priceCents ? (subscription.priceCents / 100).toFixed(2) : ''
            );
        } else {
            setFormData({
                name: '',
                description: '',
                priceCents: 0,
                durationDays: 30,
                services: [],
                benefits: [],
                isActive: true,
            });
            setPriceInput('');
        }
    }, [subscription, mode]);

    const handlePriceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = event.target.value;

        if (!/^[0-9]*[.,]?[0-9]*$/.test(rawValue) && rawValue !== '') {
            return;
        }

        setPriceInput(rawValue);

        const normalizedValue = rawValue.replace(',', '.');
        const numericValue = parseFloat(normalizedValue);

        setFormData(prev => ({
            ...prev,
            priceCents: rawValue === '' || isNaN(numericValue)
                ? 0
                : Math.round(numericValue * 100)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error('Erro ao salvar assinatura:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const addService = () => {
        if (newService.trim()) {
            setFormData(prev => ({
                ...prev,
                services: [...prev.services, newService.trim()]
            }));
            setNewService('');
        }
    };

    const removeService = (index: number) => {
        setFormData(prev => ({
            ...prev,
            services: prev.services.filter((_, i) => i !== index)
        }));
    };

    const addBenefit = () => {
        if (newBenefit.trim()) {
            setFormData(prev => ({
                ...prev,
                benefits: [...prev.benefits, newBenefit.trim()]
            }));
            setNewBenefit('');
        }
    };

    const removeBenefit = (index: number) => {
        setFormData(prev => ({
            ...prev,
            benefits: prev.benefits.filter((_, i) => i !== index)
        }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-gray-900">
                            {mode === 'create' ? 'Criar Nova Assinatura' : 'Editar Assinatura'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <XMarkIcon className="h-6 w-6 text-gray-500" />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Nome */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Nome do Plano *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01ABFE] focus:border-transparent"
                            placeholder="Ex: Plano Básico"
                            required
                        />
                    </div>

                    {/* Descrição */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Descrição
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01ABFE] focus:border-transparent"
                            placeholder="Descreva o que está incluído neste plano"
                            rows={3}
                        />
                    </div>

                    {/* Preço e Duração */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Preço (R$) *
                            </label>
                            <input
                                type="text"
                                inputMode="decimal"
                                value={priceInput}
                                onChange={handlePriceChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01ABFE] focus:border-transparent"
                                placeholder="29.00"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Duração (dias) *
                            </label>
                            <select
                                value={formData.durationDays}
                                onChange={(e) => setFormData(prev => ({ ...prev, durationDays: parseInt(e.target.value) }))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01ABFE] focus:border-transparent"
                                required
                            >
                                <option value={30}>30 dias (Mensal)</option>
                                <option value={90}>90 dias (Trimestral)</option>
                                <option value={180}>180 dias (Semestral)</option>
                                <option value={365}>365 dias (Anual)</option>
                            </select>
                        </div>
                    </div>

                    {/* Serviços Inclusos */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Serviços Inclusos
                        </label>
                        <div className="space-y-3">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newService}
                                    onChange={(e) => setNewService(e.target.value)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01ABFE] focus:border-transparent"
                                    placeholder="Ex: Corte de cabelo"
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addService())}
                                />
                                <button
                                    type="button"
                                    onClick={addService}
                                    className="px-4 py-2 bg-[#01ABFE] text-white rounded-lg hover:bg-[#0099E6] transition-colors"
                                >
                                    <PlusIcon className="h-5 w-5" />
                                </button>
                            </div>

                            {formData.services.map((service, index) => (
                                <div key={index} className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                                    <span className="flex-1 text-gray-700">{service}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeService(index)}
                                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Benefícios */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Benefícios
                        </label>
                        <div className="space-y-3">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newBenefit}
                                    onChange={(e) => setNewBenefit(e.target.value)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#01ABFE] focus:border-transparent"
                                    placeholder="Ex: Agendamento prioritário"
                                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBenefit())}
                                />
                                <button
                                    type="button"
                                    onClick={addBenefit}
                                    className="px-4 py-2 bg-[#01ABFE] text-white rounded-lg hover:bg-[#0099E6] transition-colors"
                                >
                                    <PlusIcon className="h-5 w-5" />
                                </button>
                            </div>

                            {formData.benefits.map((benefit, index) => (
                                <div key={index} className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                                    <span className="flex-1 text-gray-700">{benefit}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeBenefit(index)}
                                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={formData.isActive}
                            onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                            className="h-4 w-4 text-[#01ABFE] focus:ring-[#01ABFE] border-gray-300 rounded"
                        />
                        <label htmlFor="isActive" className="text-sm font-semibold text-gray-700">
                            Plano ativo
                        </label>
                    </div>

                    {/* Botões */}
                    <div className="flex gap-4 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 px-6 py-3 bg-[#01ABFE] text-white rounded-lg hover:bg-[#0099E6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Salvando...' : (mode === 'create' ? 'Criar Assinatura' : 'Salvar Alterações')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
