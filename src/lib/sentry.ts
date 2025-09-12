export type SentryStub = { captureException: (e: unknown, meta?: any) => void; setContext: (k: string, v: any) => void };
const S: SentryStub = { captureException: () => {}, setContext: () => {} };
export function setTenantContext(tenantId: string) { /* no-op for type-check */ }
export default function captureError(err: unknown, _meta?: any) { /* no-op for type-check */ }