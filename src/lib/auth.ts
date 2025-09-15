import { SignJWT, jwtVerify, JWTPayload, errors } from 'jose';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'node:crypto';
import { env } from '@/lib/env';

const enc=new TextEncoder();
const ACCESS_TTL=15*60; // 15m
const REFRESH_TTL=30*24*60*60; // 30d
function secret(){return enc.encode(env().JWT_SECRET);} 

export async function signAccess(payload:{ sub:string; tid:string; role:string; tdom?:string }){
  return new SignJWT({ ...payload, typ:'access' } as JWTPayload)
    .setProtectedHeader({ alg:'HS256' }).setIssuedAt().setExpirationTime(ACCESS_TTL).sign(secret());
}

export async function signRefresh(payload:{ sub:string; tid:string; role:string; tdom?:string }){
  const jti=randomUUID();
  const exp=new Date(Date.now()+REFRESH_TTL*1000);
  const token=await new SignJWT({ ...payload, typ:'refresh', jti } as JWTPayload)
    .setProtectedHeader({ alg:'HS256' }).setIssuedAt().setExpirationTime(REFRESH_TTL).sign(secret());
  await prisma.refreshToken.create({ data:{ jti, tenantId: payload.tid, employeeId: payload.sub, expiresAt: exp } });
  return { token, jti, exp };
}

export async function verifyJWT<T=JWTPayload>(token:string){ const { payload }=await jwtVerify(token, secret()); return payload as T & JWTPayload; }

export async function rotateRefresh(oldToken:string){
  const { jti, sub, tid, role, tdom } = (await verifyJWT(oldToken)) as any;
  if(!jti||!sub||!tid) throw new Error('invalid_refresh');
  const row=await prisma.refreshToken.findFirst({ where:{ jti, tenantId: tid } });
  if(!row||row.revokedAt||row.expiresAt<new Date()) throw new Error('refresh_revoked');
  await prisma.refreshToken.updateMany({ where:{ jti, tenantId: tid }, data:{ revokedAt: new Date() } });
  const access=await signAccess({ sub, tid, role, tdom });
  const refresh=await signRefresh({ sub, tid, role, tdom });
  return { access, refresh };
}

export async function revokeRefresh(token:string){
  try{ const { jti, tid }=await verifyJWT<any>(token); if(!jti||!tid) return; await prisma.refreshToken.updateMany({ where:{ jti, tenantId: tid }, data:{ revokedAt: new Date() } }).catch(()=>{}); }
  catch(e){ if(!(e instanceof errors.JOSEError)) throw e; }
}
