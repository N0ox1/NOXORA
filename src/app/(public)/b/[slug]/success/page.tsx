'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function SuccessPage() {
    const searchParams = useSearchParams();
    const appointmentId = searchParams.get('appointmentId');

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
            <div className="max-w-md mx-auto px-4">
                <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Agendamento Confirmado!
                    </h1>

                    <p className="text-gray-600 mb-6">
                        Seu agendamento foi realizado com sucesso. Você receberá uma confirmação por telefone.
                    </p>

                    {appointmentId && (
                        <div className="bg-gray-50 p-4 rounded-md mb-6">
                            <p className="text-sm text-gray-600">
                                <strong>ID do Agendamento:</strong> {appointmentId}
                            </p>
                        </div>
                    )}

                    <div className="space-y-3">
                        <Link
                            href="/"
                            className="block w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            Voltar ao Início
                        </Link>

                        <button
                            onClick={() => window.print()}
                            className="block w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                        >
                            Imprimir Comprovante
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

