'use client';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AdminPage() {
  const sections = [
    { href: '/admin/clients', label: 'Clientes', description: 'Gerenciar clientes' },
    { href: '/admin/services', label: 'Serviços', description: 'Gerenciar serviços' },
    { href: '/admin/employees', label: 'Funcionários', description: 'Gerenciar funcionários' },
    { href: '/agenda', label: 'Agenda', description: 'Visualizar agenda' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Painel Administrativo</h1>
        <p className="text-muted-foreground">Gerencie sua barbearia</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {sections.map(section => (
          <Card key={section.href} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">{section.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{section.description}</p>
              <Button asChild className="w-full">
                <Link href={section.href}>Acessar</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}












