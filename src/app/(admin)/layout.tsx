'use client';
import { Toaster } from 'react-hot-toast';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Toaster />
      <main className="mx-auto max-w-5xl p-6">{children}</main>
    </div>
  );
}