'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

interface WebhookSubscriptionFormProps {
  tenantId: string;
  onSubmit: (data: any) => Promise<void>;
}

export function WebhookSubscriptionForm({ tenantId, onSubmit }: WebhookSubscriptionFormProps) {
  const [formData, setFormData] = useState({
    event_type: 'appointment.created' as const,
    url: '',
    is_active: true,
    secret: '',
    headers: '',
    retry_config: {
      max_attempts: 3,
      initial_delay_ms: 5000,
      max_delay_ms: 60000,
      backoff_multiplier: 2,
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith('retry_config.')) {
      const retryField = field.replace('retry_config.', '');
      setFormData(prev => ({
        ...prev,
        retry_config: {
          ...prev.retry_config,
          [retryField]: value,
        },
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Preparar dados para envio
      const submitData = {
        ...formData,
        headers: formData.headers ? JSON.parse(formData.headers) : undefined,
      };

      await onSubmit(submitData);
      setSuccess('Assinatura de webhook criada com sucesso!');
      
      // Limpar formulário
      setFormData({
        event_type: 'appointment.created',
        url: '',
        is_active: true,
        secret: '',
        headers: '',
        retry_config: {
          max_attempts: 3,
          initial_delay_ms: 5000,
          max_delay_ms: 60000,
          backoff_multiplier: 2,
        },
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      event_type: 'appointment.created',
      url: '',
      is_active: true,
      secret: '',
      headers: '',
      retry_config: {
        max_attempts: 3,
        initial_delay_ms: 5000,
        max_delay_ms: 60000,
        backoff_multiplier: 2,
      },
    });
    setError(null);
    setSuccess(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova Assinatura de Webhook</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo de Evento */}
          <div className="space-y-2">
            <Label htmlFor="event_type">Tipo de Evento</Label>
            <Select
              value={formData.event_type}
              onValueChange={(value) => handleInputChange('event_type', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="appointment.created">Agendamento Criado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* URL */}
          <div className="space-y-2">
            <Label htmlFor="url">URL do Webhook</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://seu-sistema.com/webhook"
              value={formData.url}
              onChange={(e) => handleInputChange('url', e.target.value)}
              required
            />
            <p className="text-sm text-gray-500">
              URL para onde os webhooks serão enviados
            </p>
          </div>

          {/* Ativo */}
          <div className="flex items-center space-x-2">
            <Switch
  
              checked={formData.is_active}
              onChange={(checked: boolean) => handleInputChange('is_active', checked)}
            />
            <Label htmlFor="is_active">Ativo</Label>
          </div>

          {/* Chave Secreta */}
          <div className="space-y-2">
            <Label htmlFor="secret">Chave Secreta (opcional)</Label>
            <Input
              id="secret"
              type="password"
              placeholder="Chave para assinatura HMAC"
              value={formData.secret}
              onChange={(e) => handleInputChange('secret', e.target.value)}
            />
            <p className="text-sm text-gray-500">
              Chave para validar a autenticidade dos webhooks
            </p>
          </div>

          {/* Headers Customizados */}
          <div className="space-y-2">
            <Label htmlFor="headers">Headers Customizados (opcional)</Label>
            <Textarea
              id="headers"
              placeholder='{"Authorization": "Bearer token", "X-Custom": "value"}'
              value={formData.headers}
              onChange={(e) => handleInputChange('headers', e.target.value)}
              rows={3}
            />
            <p className="text-sm text-gray-500">
              Headers adicionais em formato JSON
            </p>
          </div>

          {/* Configuração de Retry */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Configuração de Retry</Label>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max_attempts">Máximo de Tentativas</Label>
                <Input
                  id="max_attempts"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.retry_config.max_attempts}
                  onChange={(e) => handleInputChange('retry_config.max_attempts', parseInt(e.target.value))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="initial_delay">Delay Inicial (ms)</Label>
                <Input
                  id="initial_delay"
                  type="number"
                  min="1000"
                  max="60000"
                  step="1000"
                  value={formData.retry_config.initial_delay_ms}
                  onChange={(e) => handleInputChange('retry_config.initial_delay_ms', parseInt(e.target.value))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="max_delay">Delay Máximo (ms)</Label>
                <Input
                  id="max_delay"
                  type="number"
                  min="10000"
                  max="300000"
                  step="1000"
                  value={formData.retry_config.max_delay_ms}
                  onChange={(e) => handleInputChange('retry_config.max_delay_ms', parseInt(e.target.value))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="backoff_multiplier">Multiplicador de Backoff</Label>
                <Input
                  id="backoff_multiplier"
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  value={formData.retry_config.backoff_multiplier}
                  onChange={(e) => handleInputChange('retry_config.backoff_multiplier', parseFloat(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex space-x-2 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Criando...' : 'Criar Assinatura'}
            </Button>
            <Button type="button" variant="outline" onClick={resetForm}>
              Limpar
            </Button>
          </div>
        </form>

        {/* Mensagens de Feedback */}
        {success && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
