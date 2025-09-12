import { httpJson } from "@/lib/http";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function getShop(slug: string) {
  const h = await headers();
  const tenantId = h.get("X-Tenant-Id") || process.env.NEXT_PUBLIC_TENANT_ID || "tnt_1";
  return httpJson<any>(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/barbershop/public/${slug}`, { headers: { "X-Tenant-Id": tenantId } });
}

export default async function Page({ searchParams, params }: { searchParams: { serviceId?: string }, params: { slug: string } }) {
  const { slug } = await Promise.resolve(params);
  const serviceId = searchParams?.serviceId || "";
  const shop = await getShop(slug);
  const service = shop.services.find((s: any) => s.id === serviceId);
  if (!service) redirect(`/b/${slug}/services`);

  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Agendar: {service.name}</h1>
      <form action={`/b/${slug}/book/create`} method="post" className="grid gap-4">
        <input type="hidden" name="service_id" value={service.id} />
        <input type="hidden" name="barbershop_id" value="shop_1" />
        <label className="grid gap-1">
          <span className="text-sm">Barbeiro</span>
          <select name="employee_id" className="border rounded-md p-2">
            <option value="emp_1">Barbeiro 1</option>
            <option value="emp_2">Barbeiro 2</option>
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-sm">Horário</span>
          <input name="start_at" type="datetime-local" className="border rounded-md p-2" required />
        </label>
        <button className="px-4 py-2 rounded-xl bg-black text-white text-sm" type="submit">Confirmar</button>
      </form>
    </main>
  );
}

