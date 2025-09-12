import React from 'react';
import { PublicBarbershopTest } from '@/components/api/public-barbershop-test';

export default function ApiTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Teste das APIs
          </h1>
          <p className="mt-2 text-gray-600">
            Teste as diferentes APIs do sistema Noxora
          </p>
        </div>

        <div className="space-y-8">
          {/* API Pública de Barbearias */}
          <PublicBarbershopTest />

          {/* Informações sobre as APIs */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              APIs Disponíveis
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900">APIs Públicas</h3>
                <ul className="mt-2 text-sm text-gray-600 space-y-1">
                  <li>• <code>GET /api/health</code> - Status do sistema</li>
                  <li>• <code>GET /api/barbershop/public/{'{slug}'}</code> - Informações públicas da barbearia</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-gray-900">APIs Autenticadas</h3>
                <ul className="mt-2 text-sm text-gray-600 space-y-1">
                  <li>• <code>POST /api/auth/register</code> - Registro de usuário</li>
                  <li>• <code>POST /api/auth/login</code> - Login de usuário</li>
                  <li>• <code>POST /api/services</code> - Criação de serviços (requer SERVICE_CRUD)</li>
                  <li>• <code>POST /api/appointments</code> - Criação de agendamentos (requer APPOINTMENT_CRUD)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-medium text-gray-900">Headers Obrigatórios</h3>
                <ul className="mt-2 text-sm text-gray-600 space-y-1">
                  <li>• <code>X-Tenant-Id</code> - ID do tenant (para APIs que requerem tenant)</li>
                  <li>• <code>Authorization: Bearer {'<jwt>'}</code> - Token JWT (para APIs autenticadas)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Exemplos de uso */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Exemplos de Uso
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900">Health Check</h3>
                <pre className="mt-2 p-3 bg-gray-100 rounded text-sm overflow-x-auto">
{`curl -X GET /api/health`}
                </pre>
              </div>

              <div>
                <h3 className="font-medium text-gray-900">Buscar Barbearia Pública</h3>
                <pre className="mt-2 p-3 bg-gray-100 rounded text-sm overflow-x-auto">
{`curl -X GET /api/barbershop/public/barbearia-alfa`}
                </pre>
              </div>

              <div>
                <h3 className="font-medium text-gray-900">Criar Serviço (Autenticado)</h3>
                <pre className="mt-2 p-3 bg-gray-100 rounded text-sm overflow-x-auto">
{`curl -X POST /api/services \\
  -H "X-Tenant-Id: tenant-123" \\
  -H "Authorization: Bearer <jwt>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Corte Masculino",
    "duration_min": 30,
    "price_cents": 2500,
    "description": "Corte tradicional masculino"
  }'`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


