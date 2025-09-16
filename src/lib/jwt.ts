import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import { randomUUID, createHash } from 'node:crypto';
import prisma from '@/lib/prisma';

const ALG = 'HS256';
const secret = () => new TextEncoder().encode(process.env.JWT_SECRET || 'noxora-super-secret-jwt-key-2025-development-only-32-chars');

export type AccessClaims = { sub: string; tenantId: string; role: string; jti: string } & JWTPayload;
export type RefreshClaims = { sub: string; tenantId: string; sessionId: string; jti: string } & JWTPayload;

const hashToken = (t: string) => createHash('sha256').update(t).digest('hex');

export async function signAccess(claims: Omit<AccessClaims, 'jti' | 'iat' | 'exp'>) {
  const jti = randomUUID();
  return new SignJWT({ ...claims, jti })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(secret());
}

export async function signRefresh(claims: Omit<RefreshClaims, 'jti' | 'iat' | 'exp'>, ttl: string = '30d') {
  const jti = randomUUID();
  const token = await new SignJWT({ ...claims, jti })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(ttl)
    .sign(secret());
  await prisma.refreshToken.create({
    data: {
      tenantId: (claims as any).tenantId,
      employeeId: (claims as any).sub,
      jti,
      // sessionId: (claims as any).sessionId,
      // tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
    }
  });
  return token;
}

export async function verifyAccess(token: string) {
  const { payload } = await jwtVerify(token, secret());
  return payload as AccessClaims;
}

export async function verifyRefresh(token: string) {
  const { payload } = await jwtVerify(token, secret());
  return payload as RefreshClaims;
}

export async function rotateRefresh(oldToken: string) {
  const payload = await verifyRefresh(oldToken);
  // tokens antigos sem jti/sessionId não são aceitos
  if (!payload.jti || !payload.sessionId) throw new Error('refresh_legacy_token');
  const tokenHash = hashToken(oldToken);
  const rec = await prisma.refreshToken.findFirst({
    where: {
      tenantId: payload.tenantId,
      employeeId: payload.sub,
      jti: payload.jti,
      // tokenHash,
      revokedAt: null
    }
  });
  if (!rec) {
    await prisma.refreshToken.updateMany({ where: { tenantId: payload.tenantId, employeeId: payload.sub, jti: payload.jti }, data: { revokedAt: new Date() } });
    throw new Error('refresh_reuse_detected');
  }
  await prisma.refreshToken.update({ where: { jti: rec.jti }, data: { revokedAt: new Date() } });
  const next = await signRefresh({ sub: payload.sub, tenantId: payload.tenantId, sessionId: payload.sessionId });
  return next;
}


