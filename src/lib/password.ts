import { z } from 'zod';

export const PasswordPolicy = z.string().min(8).max(128).refine(v => /[a-z]/.test(v), { message: 'missing_lower' }).refine(v => /[A-Z]/.test(v), { message: 'missing_upper' }).refine(v => /\d/.test(v), { message: 'missing_digit' });

export function validatePassword(pw: string) {
  const res = PasswordPolicy.safeParse(pw);
  return { ok: res.success, errors: res.success ? [] : res.error.issues.map(i => i.message) };
}