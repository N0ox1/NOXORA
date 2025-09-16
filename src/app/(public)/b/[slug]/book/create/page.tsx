'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/http';

interface BookingFormData {
    clientName: string;
    clientPhone: string;
    clientEmail?: string;
    serviceId: string;
    barbershopId: string;
    employeeId: string;
    startAt: string;
    notes?: string;
}

export default function CreateBookingPage({
    searchParams
}: {
    searchParams: {
        service_id?: string;
        barbershop_id?: string;
        employee_id?: string;
        start_at?: string;
    }
}) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<BookingFormData>({
        clientName: '',
        clientPhone: '',
        clientEmail: '',
        serviceId: searchParams.service_id || '',
        barbershopId: searchParams.barbershop_id || '',
        employeeId: searchParams.employee_id || '',
        startAt: searchParams.start_at || '',
        notes: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.clientName || !formData.clientPhone) {
            alert('Nome completo e telefone são obrigatórios');
            return;
        }

        setLoading(true);

        try {
            // 1. Primeiro, criar/salvar o cliente
            const clientResponse = await apiFetch('/api/v1/clients', {
                tenantId: 'cmffwm0j20000uaoo2c4ugtvx', // Tenant fixo por enquanto
                init: {
                    method: 'POST',
                    body: JSON.stringify({
                        name: formData.clientName,
                        phone: formData.clientPhone,
                        email: formData.clientEmail || undefined,
                        notes: formData.notes || undefined
                    })
                }
            });

            // 2. Depois, criar o agendamento
            const appointmentResponse = await apiFetch('/api/v1/appointments', {
                tenantId: 'cmffwm0j20000uaoo2c4ugtvx',
                init: {
                    method: 'POST',
                    body: JSON.stringify({
                        barbershopId: formData.barbershopId,
                        serviceId: formData.serviceId,
                        employeeId: formData.employeeId,
                        clientId: clientResponse.client.id, // ID do cliente criado
                        scheduledAt: formData.startAt,
                        notes: `Cliente: ${formData.clientName}, Telefone: ${formData.clientPhone}`
                    })
                }
            });

            // 3. Redirecionar para página de sucesso
            router.push(`/b/${searchParams.barbershop_id || 'default'}/success?appointmentId=${appointmentResponse.id}`);

        } catch (error) {
            console.error('Erro ao criar agendamento:', error);
            alert('Erro ao criar agendamento. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-2xl mx-auto px-4">
                <div className="bg-white rounded-lg shadow-sm p-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-6">
                        Finalizar Agendamento
                    </h1>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nome Completo *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.clientName}
                                    onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Seu nome completo"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Telefone *
                                </label>
                                <input
                                    type="tel"
                                    required
                                    value={formData.clientPhone}
                                    onChange={(e) => setFormData(prev => ({ ...prev, clientPhone: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="(11) 99999-9999"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email (opcional)
                            </label>
                            <input
                                type="email"
                                value={formData.clientEmail}
                                onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="seu@email.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Observações (opcional)
                            </label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={3}
                                placeholder="Alguma observação especial..."
                            />
                        </div>

                        <div className="bg-blue-50 p-4 rounded-md">
                            <h3 className="font-medium text-blue-900 mb-2">Resumo do Agendamento</h3>
                            <div className="text-sm text-blue-800 space-y-1">
                                <p><strong>Serviço:</strong> {formData.serviceId}</p>
                                <p><strong>Barbeiro:</strong> {formData.employeeId}</p>
                                <p><strong>Data/Hora:</strong> {formData.startAt ? new Date(formData.startAt).toLocaleString('pt-BR') : 'Não selecionado'}</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Voltar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {loading ? 'Agendando...' : 'Confirmar Agendamento'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

