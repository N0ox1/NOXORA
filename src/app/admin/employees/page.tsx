'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTenant } from '@/components/tenant/use-tenant';
import { toast } from 'react-hot-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Upload, Image as ImageIcon, Settings, Globe, Palette, ArrowLeft } from 'lucide-react';

interface BarbershopSettings {
  id: string;
  name: string;
  slug: string;
  description: string;
  logoUrl?: string;
  bannerUrl?: string;
  address: string;
  phone: string;
  email: string;
  instagram?: string;
  whatsapp?: string;
  workingHours: {
    monday: { open: string; close: string; closed: boolean };
    tuesday: { open: string; close: string; closed: boolean };
    wednesday: { open: string; close: string; closed: boolean };
    thursday: { open: string; close: string; closed: boolean };
    friday: { open: string; close: string; closed: boolean };
    saturday: { open: string; close: string; closed: boolean };
    sunday: { open: string; close: string; closed: boolean };
  };
}

export default function BarbershopSettingsPage() {
  const router = useRouter();
  const { tenantId } = useTenant('cmffwm0j20000uaoo2c4ugtvx');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Estado dos dados da barbearia
  const [settings, setSettings] = useState<BarbershopSettings>({
    id: '',
    name: 'Barber Labs Centro',
    slug: 'barber-labs-centro',
    description: 'A melhor barbearia do centro da cidade',
    logoUrl: '',
    bannerUrl: '',
    address: 'Rua das Flores, 123 - Centro',
    phone: '(11) 99999-9999',
    email: 'contato@barberlabs.com',
    instagram: '@barberlabs',
    whatsapp: '11999999999',
    workingHours: {
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '18:00', closed: false },
      friday: { open: '09:00', close: '19:00', closed: false },
      saturday: { open: '08:00', close: '17:00', closed: false },
      sunday: { open: '10:00', close: '16:00', closed: true }
    }
  });

  // Estados para upload de arquivos
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  // Carregar configurações
  async function loadSettings() {
    setLoading(true);
    try {
      const response = await fetch('/api/v1/barbershop/settings', {
        headers: { 'x-tenant-id': tenantId }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao carregar configurações');
      }

      const data = await response.json();

      // Parse workingHours se for string
      const workingHours = typeof data.workingHours === 'string'
        ? JSON.parse(data.workingHours)
        : data.workingHours;

      setSettings({
        id: data.id,
        name: data.name || 'Barber Labs Centro',
        slug: data.slug || 'barber-labs-centro',
        description: data.description || 'A melhor barbearia do centro da cidade',
        logoUrl: data.logoUrl || '',
        bannerUrl: data.bannerUrl || '',
        address: data.address || 'Rua das Flores, 123 - Centro',
        phone: data.phone || '(11) 99999-9999',
        email: data.email || 'contato@barberlabs.com',
        instagram: data.instagram || '@barberlabs',
        whatsapp: data.whatsapp || '11999999999',
        workingHours: workingHours || {
          monday: { open: '09:00', close: '18:00', closed: false },
          tuesday: { open: '09:00', close: '18:00', closed: false },
          wednesday: { open: '09:00', close: '18:00', closed: false },
          thursday: { open: '09:00', close: '18:00', closed: false },
          friday: { open: '09:00', close: '19:00', closed: false },
          saturday: { open: '08:00', close: '17:00', closed: false },
          sunday: { open: '10:00', close: '16:00', closed: true }
        }
      });

      console.log('✅ Configurações carregadas:', data);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  }

  // Salvar configurações
  async function saveSettings() {
    setSaving(true);
    try {
      const response = await fetch('/api/v1/barbershop/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId
        },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao salvar configurações');
      }

      const result = await response.json();
      console.log('✅ Configurações salvas:', result);
      toast.success('Configurações salvas com sucesso!');

      // Recarregar as configurações para garantir sincronização
      await loadSettings();
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  }

  // Upload de logo
  async function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    setLogoFile(file);

    // Simular upload
    const reader = new FileReader();
    reader.onload = (e) => {
      setSettings(prev => ({
        ...prev,
        logoUrl: e.target?.result as string
      }));
    };
    reader.readAsDataURL(file);

    toast.success('Logo carregada com sucesso!');
  }

  // Upload de banner
  async function handleBannerUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      toast.error('A imagem deve ter no máximo 10MB');
      return;
    }

    setBannerFile(file);

    // Simular upload
    const reader = new FileReader();
    reader.onload = (e) => {
      setSettings(prev => ({
        ...prev,
        bannerUrl: e.target?.result as string
      }));
    };
    reader.readAsDataURL(file);

    toast.success('Banner carregado com sucesso!');
  }

  // Atualizar horário de funcionamento
  function updateWorkingHours(day: keyof BarbershopSettings['workingHours'], field: 'open' | 'close' | 'closed', value: string | boolean) {
    setSettings(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: {
          ...prev.workingHours[day],
          [field]: value
        }
      }
    }));
  }

  useEffect(() => {
    loadSettings();
  }, [tenantId]);

  const days = [
    { key: 'monday', label: 'Segunda-feira' },
    { key: 'tuesday', label: 'Terça-feira' },
    { key: 'wednesday', label: 'Quarta-feira' },
    { key: 'thursday', label: 'Quinta-feira' },
    { key: 'friday', label: 'Sexta-feira' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' }
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2 hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Configurações da Barbearia</h1>
            <p className="text-gray-600">Gerencie as informações e aparência da sua barbearia</p>
          </div>
        </div>
        <Button onClick={saveSettings} disabled={saving} className="bg-[#01ABFE] hover:bg-[#0099E6]">
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações Básicas */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome da Barbearia</Label>
                  <Input
                    id="name"
                    value={settings.name}
                    onChange={(e) => setSettings(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Digite o nome da barbearia"
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Slug da URL</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">noxora.com/b/</span>
                    <Input
                      id="slug"
                      value={settings.slug}
                      onChange={(e) => setSettings(prev => ({ ...prev, slug: e.target.value }))}
                      placeholder="barber-labs-centro"
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    URL: noxora.com/b/{settings.slug}
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={settings.description}
                  onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva sua barbearia..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={settings.address}
                    onChange={(e) => setSettings(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Rua, número, bairro"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={settings.phone}
                    onChange={(e) => setSettings(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="contato@barbearia.com"
                  />
                </div>
                <div>
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    value={settings.instagram}
                    onChange={(e) => setSettings(prev => ({ ...prev, instagram: e.target.value }))}
                    placeholder="@barbearia"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Horário de Funcionamento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Horário de Funcionamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {days.map((day) => (
                  <div key={day.key} className="flex items-center gap-4">
                    <div className="w-32">
                      <Label className="text-sm font-medium">{day.label}</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!settings.workingHours[day.key].closed}
                        onChange={(e) => updateWorkingHours(day.key, 'closed', !e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-500">Aberto</span>
                    </div>
                    {!settings.workingHours[day.key].closed && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={settings.workingHours[day.key].open}
                          onChange={(e) => updateWorkingHours(day.key, 'open', e.target.value)}
                          className="w-32"
                        />
                        <span className="text-gray-500">até</span>
                        <Input
                          type="time"
                          value={settings.workingHours[day.key].close}
                          onChange={(e) => updateWorkingHours(day.key, 'close', e.target.value)}
                          className="w-32"
                        />
                      </div>
                    )}
                    {settings.workingHours[day.key].closed && (
                      <Badge variant="secondary">Fechado</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upload de Imagens */}
        <div className="space-y-6">
          {/* Logo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Logo da Barbearia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {settings.logoUrl && (
                <div className="aspect-square w-full max-w-48 mx-auto border rounded-lg overflow-hidden">
                  <img
                    src={settings.logoUrl}
                    alt="Logo da barbearia"
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="logo-upload" className="cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#01ABFE] transition-colors">
                    <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">
                      {logoFile ? logoFile.name : 'Clique para fazer upload da logo'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG até 5MB
                    </p>
                  </div>
                </Label>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </div>
            </CardContent>
          </Card>

          {/* Banner */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Banner da Página
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {settings.bannerUrl && (
                <div className="aspect-video w-full border rounded-lg overflow-hidden">
                  <img
                    src={settings.bannerUrl}
                    alt="Banner da barbearia"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div>
                <Label htmlFor="banner-upload" className="cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#01ABFE] transition-colors">
                    <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">
                      {bannerFile ? bannerFile.name : 'Clique para fazer upload do banner'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG até 10MB
                    </p>
                  </div>
                </Label>
                <input
                  id="banner-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleBannerUpload}
                  className="hidden"
                />
              </div>
            </CardContent>
          </Card>

          {/* Preview da URL */}
          <Card>
            <CardHeader>
              <CardTitle>Preview da URL</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">Sua barbearia estará disponível em:</p>
                <div className="bg-white border rounded p-3">
                  <code className="text-sm text-[#01ABFE]">
                    noxora.com/b/{settings.slug}
                  </code>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Os clientes poderão agendar horários através desta URL
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}