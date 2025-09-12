import { jwtVerify, JWTPayload } from 'jose';
const enc = new TextEncoder();
function secret(){const s=process.env.JWT_SECRET; if(!s) throw new Error('JWT_SECRET missing'); return enc.encode(s);} 
export type AccessPayload = JWTPayload & { tid:string; sub:string; role:string; typ:string; tdom?:string };
export async function verifyAccessEdge(token:string): Promise<AccessPayload> {
  const { payload } = await jwtVerify(token, secret());
  if ((payload as any).typ !== 'access') throw new Error('invalid_token_type');
  return payload as AccessPayload;
}
