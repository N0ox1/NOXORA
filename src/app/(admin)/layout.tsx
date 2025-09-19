'use client';
import { Toaster } from 'react-hot-toast';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full">
      <Toaster />
      <main className="w-full">{children}</main>
    </div>
  );
}