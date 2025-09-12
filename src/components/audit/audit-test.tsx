'use client';

import React, { useState } from 'react';
import { useAudit } from '@/hooks/use-audit';

export function AuditTest() {
  const [tenantId, setTenantId] = useState('barbearia-alfa');
  const [userId, setUserId] = useState('user-001');
  const [userName, setUserName] = useState('João Silva');
  const [userEmail, setUserEmail] = useState('joao@barbearia.com');

  // Hook de auditoria
  const audit = useAudit({
    tenantId,
    actorId: userId,
    actorType: 'user',
    actorName: userName,
    actorEmail: userEmail,
  });

  const [logs, setLogs] = useState<Array<{
    action: string;
    entity: string;
    entityId: string;
    timestamp: string;
    details: any;
  }>>([]);

  const addLog = (action: string, entity: string, entityId: string, details?: any) => {
    const log = {
      action,
      entity,
      entityId,
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      details,
    };
    setLogs(prev => [log, ...prev.slice(0, 9)]); // Mantém apenas os últimos 10 logs
  };

  const handleCreateService = async () => {
    const entityId = `service_${Date.now()}`;
    const serviceData = {
      name: 'Corte Masculino',
      duration: 30,
      price: 25.00,
    };

    await audit.logCreate('service', entityId, serviceData);
    addLog('CREATE', 'service', entityId, serviceData);
  };

  const handleUpdateService = async () => {
    const entityId = `service_${Date.now()}`;
    const oldData = { price: 25.00 };
    const newData = { price: 30.00 };
    const changes = [
      { field: 'price', old_value: oldData.price, new_value: newData.price }
    ];

    await audit.logUpdate('service', entityId, changes, oldData, newData);
    addLog('UPDATE', 'service', entityId, { changes, oldData, newData });
  };

  const handleDeleteService = async () => {
    const entityId = `service_${Date.now()}`;
    const deletedData = { name: 'Corte Masculino', price: 30.00 };

    await audit.logDelete('service', entityId, deletedData);
    addLog('DELETE', 'service', entityId, { deletedData });
  };

  const handleLogin = async () => {
    const success = Math.random() > 0.3; // 70% de chance de sucesso
    const metadata = {
      ip: '192.168.1.100',
      userAgent: 'Mozilla/5.0...',
      success,
    };

    await audit.logLogin(userId, success, metadata);
    addLog('LOGIN', 'user', userId, { success, metadata });
  };

  const handleLogout = async () => {
    const metadata = {
      sessionDuration: '2h 30m',
      reason: 'user_request',
    };

    await audit.logLogout(userId, metadata);
    addLog('LOGOUT', 'user', userId, { metadata });
  };

  const handleExport = async () => {
    const exportType = 'appointments';
    const filters = { date: '2024-01-01', status: 'confirmed' };

    await audit.logExport('appointment', exportType, filters);
    addLog('EXPORT', 'appointment', 'export_operation', { exportType, filters });
  };

  const handleImport = async () => {
    const importType = 'clients';
    const recordCount = Math.floor(Math.random() * 100) + 10;

    await audit.logImport('client', importType, recordCount);
    addLog('IMPORT', 'client', 'import_operation', { importType, recordCount });
  };

  const handleCustomAction = async () => {
    const entityId = `custom_${Date.now()}`;
    const metadata = {
      custom_field: 'valor_personalizado',
      priority: 'high',
    };

    await audit.logAction('ASSIGN', 'appointment', entityId, undefined, metadata);
    addLog('ASSIGN', 'appointment', entityId, { metadata });
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="space-y-6">
      {/* Configuração */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Configuração de Auditoria
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tenant ID
            </label>
            <input
              type="text"
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              User ID
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Usuário
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email do Usuário
            </label>
            <input
              type="text"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
        </div>
      </div>

      {/* Ações de Auditoria */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Ações de Auditoria
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={handleCreateService}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm"
          >
            Criar Serviço
          </button>
          <button
            onClick={handleUpdateService}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
          >
            Atualizar Serviço
          </button>
          <button
            onClick={handleDeleteService}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm"
          >
            Deletar Serviço
          </button>
          <button
            onClick={handleLogin}
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 text-sm"
          >
            Login
          </button>
          <button
            onClick={handleLogout}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 text-sm"
          >
            Logout
          </button>
          <button
            onClick={handleExport}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm"
          >
            Exportar
          </button>
          <button
            onClick={handleImport}
            className="bg-pink-600 text-white px-4 py-2 rounded-md hover:bg-pink-700 text-sm"
          >
            Importar
          </button>
          <button
            onClick={handleCustomAction}
            className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 text-sm"
          >
            Ação Customizada
          </button>
        </div>
      </div>

      {/* Logs de Auditoria */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Logs de Auditoria (Frontend)
          </h2>
          <button
            onClick={clearLogs}
            className="text-sm text-gray-600 hover:text-gray-800 underline"
          >
            Limpar Logs
          </button>
        </div>
        
        {logs.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>Nenhum log de auditoria ainda.</p>
            <p className="text-sm">Execute algumas ações acima para ver os logs.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      log.action === 'CREATE' ? 'bg-green-100 text-green-800' :
                      log.action === 'UPDATE' ? 'bg-blue-100 text-blue-800' :
                      log.action === 'DELETE' ? 'bg-red-100 text-red-800' :
                      log.action === 'LOGIN' ? 'bg-purple-100 text-purple-800' :
                      log.action === 'LOGOUT' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {log.action}
                    </span>
                    <span className="text-sm font-medium text-gray-700">
                      {log.entity}
                    </span>
                    <span className="text-xs text-gray-500">
                      ID: {log.entityId}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {log.timestamp}
                  </span>
                </div>
                {log.details && (
                  <div className="text-sm text-gray-600">
                    <pre className="whitespace-pre-wrap text-xs">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Informações */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          Como Funciona a Auditoria
        </h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>
            <strong>Hook useAudit:</strong> Fornece métodos para registrar ações de auditoria no frontend.
          </p>
          <p>
            <strong>Logs Locais:</strong> Os logs são exibidos aqui para demonstração. Em produção, 
            seriam enviados para a API de auditoria.
          </p>
          <p>
            <strong>Console:</strong> Verifique o console do navegador para ver os logs detalhados.
          </p>
          <p>
            <strong>Integração:</strong> Este hook pode ser usado em qualquer componente React para 
            registrar ações importantes do usuário.
          </p>
        </div>
      </div>
    </div>
  );
}
