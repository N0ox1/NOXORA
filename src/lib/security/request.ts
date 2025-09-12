import crypto from 'crypto';

export function getRequestMeta(req: Request) {
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '0.0.0.0';
  return { requestId, ip };
}
