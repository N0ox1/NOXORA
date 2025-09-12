import { NextRequest, NextResponse } from 'next/server';
import { resolveTenantId } from '@/lib/tenant';

export async function getTenantId(req: NextRequest): Promise<string> {
  // Agora resolve id real a partir de id|slug|name.
  return resolveTenantId(req);
}

export function parsePagination(req: NextRequest) {
  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get('page') || '1'));
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize') || '20')));
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

export function jsonError(code: number, message: string, issues?: any) {
  return NextResponse.json({ error: message, issues }, { status: code });
}

export type HttpOptions = { headers?: Record<string,string>; cache?: RequestCache; next?: NextFetchRequestConfig };

export async function httpJson<T>(url: string, opts: HttpOptions = {}): Promise<T> {
 const tenant = process.env.NEXT_PUBLIC_TENANT_ID || 'tnt_1';
 const res = await fetch(url, {
 method: 'GET',
 headers: { 'X-Tenant-Id': tenant, ...(opts.headers||{}) },
 cache: opts.cache ?? 'no-store',
 next: opts.next
 });
 if (!res.ok) {
 const text = await res.text().catch(()=> '');
 throw new Error(`HTTP ${res.status} ${res.statusText} -> ${text}`);
 }
 return res.json() as Promise<T>;
}

export async function apiFetch(
  url: string, 
  options: { 
    tenantId: string; 
    init?: RequestInit 
  }
) {
  const { tenantId, init = {} } = options;
  
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-Id': tenantId,
      ...init.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}
