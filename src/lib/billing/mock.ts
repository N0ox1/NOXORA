export type Plan = 'STARTER'|'PRO'|'SCALE';
export type BillingStatus = 'ACTIVE'|'TRIALING'|'PAST_DUE'|'CANCELED';
export type TenantBilling = { tenantId: string; plan: Plan; status: BillingStatus };

const ENTITLEMENTS: Record<Plan, { shopsAllowed: number; seatsAllowed: number; reminders_month: number }> = {
  STARTER: { shopsAllowed: 1,  seatsAllowed: 3,   reminders_month: 100 },
  PRO:     { shopsAllowed: 5,  seatsAllowed: 20,  reminders_month: 1000 },
  SCALE:   { shopsAllowed: 999,seatsAllowed: 999, reminders_month: 10000 }
};

const billingState = new Map<string, TenantBilling>();

export function seedBilling(entries: TenantBilling[]) {
  for (const e of entries) billingState.set(e.tenantId, e);
}

export function getBilling(tenantId: string): TenantBilling {
  return billingState.get(tenantId) ?? { tenantId, plan: 'STARTER', status: 'TRIALING' };
}

export function setPlan(tenantId: string, plan: Plan, status: BillingStatus = 'ACTIVE'): TenantBilling {
  const tb = { tenantId, plan, status } as TenantBilling;
  billingState.set(tenantId, tb);
  return tb;
}

export function getEntitlements(tenantId: string) {
  const plan = getBilling(tenantId).plan;
  return ENTITLEMENTS[plan];
}

export function enforceLimits(tenantId: string, counts: { shops?: number; seats?: number; remindersUsed?: number }) {
  const ent = getEntitlements(tenantId);
  if (counts.shops != null && counts.shops > ent.shopsAllowed)
    return { ok: false as const, code: 'LIMIT_EXCEEDED', field: 'shops', allowed: ent.shopsAllowed };
  if (counts.seats != null && counts.seats > ent.seatsAllowed)
    return { ok: false as const, code: 'LIMIT_EXCEEDED', field: 'employees', allowed: ent.seatsAllowed };
  if (counts.remindersUsed != null && counts.remindersUsed > ent.reminders_month)
    return { ok: false as const, code: 'LIMIT_EXCEEDED', field: 'reminders_month', allowed: ent.reminders_month };
  return { ok: true as const };
}

// Helpers para UI/API
export function plansList() {
  return [
    { code: 'STARTER', price_month: 49,  limits: ENTITLEMENTS.STARTER },
    { code: 'PRO',     price_month: 149, limits: ENTITLEMENTS.PRO     },
    { code: 'SCALE',   price_month: 399, limits: ENTITLEMENTS.SCALE   }
  ];
}
