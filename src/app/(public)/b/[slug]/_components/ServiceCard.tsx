"use client";
import React from 'react';
import { useRouter } from 'next/navigation';

type Props = { id: string; name: string; duration_min: number; price_cents: number; slug: string };

export function ServiceCard({ id, name, duration_min, price_cents, slug }: Props) {
 const price = (price_cents/100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
 const router = useRouter();
 const handleBook = () => {
 // Troque por rota de booking quando existir
 console.log('book', { serviceId: id, slug });
 router.prefetch(`/b/${slug}/services`);
 };
 return (
 <div className="rounded-2xl border p-4 shadow-sm flex items-center justify-between">
 <div>
 <h3 className="font-semibold text-lg">{name}</h3>
 <p className="text-sm text-neutral-600">{duration_min} min • {price}</p>
 </div>
 <button
 className="px-4 py-2 rounded-xl bg-black text-white text-sm"
 onClick={handleBook}
 >Agendar</button>
 </div>
 );
}

export function ServiceCardBookCTA({ slug, serviceId }: { slug: string; serviceId: string }) {
  "use client";
  const router = useRouter();
  return (
    <button className="px-4 py-2 rounded-xl bg-black text-white text-sm" onClick={() => router.push(`/b/${slug}/book?serviceId=${serviceId}`)}>
      Agendar
    </button>
  );
}
