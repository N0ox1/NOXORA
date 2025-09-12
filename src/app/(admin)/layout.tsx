'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Toaster } from 'react-hot-toast';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const links = [
    { href: '/agenda', label: 'Agenda' },
    { href: '/admin/clients', label: 'Clientes' },
    { href: '/admin/services', label: 'Serviços' },
    { href: '/admin/employees', label: 'Funcionários' }
  ];
  return (
    <div className="min-h-screen">
      <Toaster />
      <header className="border-b">
        <nav className="mx-auto max-w-5xl p-4 flex gap-4">
          {links.map(l => (
            <Link key={l.href} href={l.href} className={pathname===l.href? 'font-semibold' : 'text-muted-foreground'}>{l.label}</Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl p-6">{children}</main>
    </div>
  );
}









