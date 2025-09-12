'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { notificationService } from '@/lib/notifications';
import type { NotificationRequest, NotificationResponse } from '@/types/notifications';

interface NotificationTestProps {
  tenantId: string;
}

export function NotificationTest({ tenantId }: NotificationTestProps) {
  const [formData, setFormData] = useState({
    type: 'appointment_confirmed' as const,
    recipient: '',
    channel: 'email' as const,
    service: '',
    date: '',
    time: '',
    barbershop_id: '',
    appointment_id: '',
    priority: 'normal' as const,
    scheduled_for: '',
  });

  const [isScheduled, setIsScheduled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<NotificationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // Preparar variáveis baseadas no tipo de notificação
      const variables: Record<string, string> = {};
      if (formData.type === 'appointment_confirmed') {
        variables.service = formData.service;
        variables.date = formData.date;
      } else if (formData.type === 'appointment_reminder') {
        variables.service = formData.service;
        variables.time = formData.time;
      }

      const request: NotificationRequest = {
        id: crypto.randomUUID(),
        template: formData.type,
        recipient: formData.recipient,
        channel: (formData.channel?.toUpperCase?.() as any),
        params: variables,
        tenant_id: tenantId,
        barbershop_id: formData.barbershop_id || undefined,
        appointment_id: formData.appointment_id || undefined,
        priority: formData.priority,
        scheduled_for: isScheduled && formData.scheduled_for ? new Date(formData.scheduled_for) : undefined,
      };

      let response: NotificationResponse;

      if (isScheduled && formData.scheduled_for) {
        response = await notificationService.scheduleNotification(
          request,
          new Date(formData.scheduled_for)
        );
      } else {
        response = await notificationService.sendNotification(request);
      }

      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'appointment_confirmed',
      recipient: '',
      channel: 'email',
      service: '',
      date: '',
      time: '',
      barbershop_id: '',
      appointment_id: '',
      priority: 'normal',
      scheduled_for: '',
    });
    setIsScheduled(false);
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Teste de Notificações</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tipo de Notificação */}
            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Notificação</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleInputChange('type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="appointment_confirmed">Confirmação de Agendamento</SelectItem>
                  <SelectItem value="appointment_reminder">Lembrete de Agendamento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Canal */}
            <div className="space-y-2">
              <Label htmlFor="channel">Canal</Label>
              <Select
                value={formData.channel}
                onValueChange={(value) => handleInputChange('channel', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Destinatário */}
            <div className="space-y-2">
              <Label htmlFor="recipient">
                Destinatário ({formData.channel === 'email' ? 'Email' : 'Telefone'})
              </Label>
              <Input
                id="recipient"
                type={formData.channel === 'email' ? 'email' : 'tel'}
                placeholder={formData.channel === 'email' ? 'cliente@email.com' : '+5511999999999'}
                value={formData.recipient}
                onChange={(e) => handleInputChange('recipient', e.target.value)}
                required
              />
            </div>

            {/* Serviço */}
            <div className="space-y-2">
              <Label htmlFor="service">Serviço</Label>
              <Input
                id="service"
                placeholder="Corte + Barba"
                value={formData.service}
                onChange={(e) => handleInputChange('service', e.target.value)}
                required
              />
            </div>

            {/* Data/Hora baseada no tipo */}
            {formData.type === 'appointment_confirmed' ? (
              <div className="space-y-2">
                <Label htmlFor="date">Data</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  required
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="time">Horário</Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => handleInputChange('time', e.target.value)}
                  required
                />
              </div>
            )}

            {/* Campos opcionais */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="barbershop_id">ID da Barbearia (opcional)</Label>
                <Input
                  id="barbershop_id"
                  placeholder="uuid da barbearia"
                  value={formData.barbershop_id}
                  onChange={(e) => handleInputChange('barbershop_id', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="appointment_id">ID do Agendamento (opcional)</Label>
                <Input
                  id="appointment_id"
                  placeholder="uuid do agendamento"
                  value={formData.appointment_id}
                  onChange={(e) => handleInputChange('appointment_id', e.target.value)}
                />
              </div>
            </div>

            {/* Prioridade */}
            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => handleInputChange('priority', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Agendamento */}
            <div className="flex items-center space-x-2">
              <Switch
    
                checked={isScheduled}
                onChange={setIsScheduled}
              />
              <Label htmlFor="scheduled">Agendar para envio futuro</Label>
            </div>

            {isScheduled && (
              <div className="space-y-2">
                <Label htmlFor="scheduled_for">Data/Hora para envio</Label>
                <Input
                  id="scheduled_for"
                  type="datetime-local"
                  value={formData.scheduled_for}
                  onChange={(e) => handleInputChange('scheduled_for', e.target.value)}
                  required={isScheduled}
                />
              </div>
            )}

            {/* Botões */}
            <div className="flex space-x-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Enviando...' : 'Enviar Notificação'}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Limpar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Resultado */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Resultado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>ID:</strong> {result.id}</p>
              <p><strong>Status:</strong> {result.status}</p>
              <p><strong>Mensagem:</strong> {String(result.message || '')}</p>
              {Boolean(result?.sent_at) && (
                <p><strong>Enviado em:</strong> {new Date(String(result.sent_at)).toLocaleString('pt-BR')}</p>
              )}
              {Boolean(result?.error) && (
                <p className="text-red-600"><strong>Erro:</strong> {String((result as any).error)}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Erro */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Erro</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


