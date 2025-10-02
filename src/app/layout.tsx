import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Noxora - Sistema de Gestão para Barbearias',
  description: 'Gerencie agendamentos, clientes, funcionários e faturamento de forma simples e eficiente.',
  keywords: 'barbearia, agendamento, gestão, sistema, software',
  authors: [{ name: 'Noxora Team' }],
  robots: 'index, follow',
  openGraph: {
    title: 'Noxora - Sistema de Gestão para Barbearias',
    description: 'Gerencie agendamentos, clientes, funcionários e faturamento de forma simples e eficiente.',
    type: 'website',
    locale: 'pt_BR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Noxora - Sistema de Gestão para Barbearias',
    description: 'Gerencie agendamentos, clientes, funcionários e faturamento de forma simples e eficiente.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className} suppressHydrationWarning={true}>
        {children}
      </body>
    </html>
  );
}

