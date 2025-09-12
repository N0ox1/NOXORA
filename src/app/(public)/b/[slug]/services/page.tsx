import { httpJson } from '@/lib/http';
import { ServiceCard, ServiceCardBookCTA } from '../_components/ServiceCard';
import Link from 'next/link';

type PublicShop = { tenant_id: string; slug: string; name: string; services: { id: string; name: string; duration_min: number; price_cents: number }[] };

export const revalidate = 0;

export default async function Page({ params }: { params: { slug: string } }) {
 const { slug } = await Promise.resolve(params);
 const data = await httpJson<PublicShop>(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/barbershop/public/${slug}`);
 return (
 <main className="max-w-3xl mx-auto p-6 space-y-6">
 <header className="space-y-1">
 <Link href={`/b/${slug}`} className="text-sm text-neutral-500">← Voltar</Link>
 <h1 className="text-2xl font-bold">{data.name} • Serviços</h1>
 </header>
 <section className="grid gap-4">
 {data.services.map((s) => (
          <div key={s.id} className="grid gap-3">
            <ServiceCard slug={slug} {...s} />
            <ServiceCardBookCTA slug={slug} serviceId={s.id} />
          </div>
 ))}
 </section>
 </main>
 );
}
