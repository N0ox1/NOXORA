export const BASE_URL=process.env.BASE_URL||'http://localhost:3000';
export const OWNER_EMAIL=process.env.E2E_EMAIL_OWNER||'owner@noxora.dev';
export const OWNER_PASSWORD=process.env.E2E_PASSWORD_OWNER||'owner123';

export function log(s){console.log(s)}
export function fail(s){console.error(s);process.exitCode=1;throw new Error(s)}

export async function req(path,{method='GET',json,headers={},token,tenantId}={}){
  const url=path.startsWith('http')?path:`${BASE_URL}${path}`;
  const h={'content-type':'application/json',...headers};
  if(token) h.authorization=`Bearer ${token}`;
  if(tenantId) h['x-tenant-id']=tenantId;
  const res=await fetch(url,{method,headers:h,body:json?JSON.stringify(json):undefined});
  let body=null; try{body=await res.json()}catch{}
  return {res,body}
}

export function decodeJwt(tok){if(!tok) return {};const p=tok.split('.');if(p.length!==3) return {};const b=Buffer.from(p[1].replace(/-/g,'+').replace(/_/g,'/'),'base64').toString('utf8');try{return JSON.parse(b)}catch{return {}}}

function parseRegisterPayload(){try{return process.env.REGISTER_PAYLOAD?JSON.parse(process.env.REGISTER_PAYLOAD):null}catch{return null}}

export async function loginOrRegister(email=OWNER_EMAIL,password=OWNER_PASSWORD){
  const loginResp=await req('/api/auth/login',{method:'POST',json:{email,password}});
  if(loginResp.res.ok){
    const access=loginResp.body?.access_token||loginResp.body?.accessToken||loginResp.body?.token;const refresh=loginResp.body?.refresh_token||loginResp.body?.refreshToken;let tenantId=loginResp.body?.tenantId||loginResp.body?.tenant?.id||decodeJwt(access).tenantId||process.env.TENANT_ID; if(!access||!refresh) fail('tokens ausentes');
    return {access,refresh,tenantId}
  }
  const st=loginResp.res.status; const err=loginResp.body?.error||'';
  if(st===423||err==='locked'||err==='account_locked'){ fail('conta bloqueada (423). Defina E2E_EMAIL_OWNER/LOCK_EMAIL para outra conta ou rode lockout com LOCK_USE_OWNER=false)') }
  const payload=parseRegisterPayload();
  if(!payload){ fail(`login falhou ${st} ${JSON.stringify(loginResp.body)} e REGISTER_PAYLOAD não foi informado para registrar uma conta de teste`) }
  const reg=await req('/api/auth/register',{method:'POST',json:payload});
  if(!reg.res.ok) fail(`register failed ${reg.res.status} ${JSON.stringify(reg.body)}`);
  const access=reg.body?.access_token||reg.body?.accessToken||reg.body?.token;const refresh=reg.body?.refresh_token||reg.body?.refreshToken;let tenantId=reg.body?.tenantId||reg.body?.tenant?.id||decodeJwt(access).tenantId||process.env.TENANT_ID; if(!access||!refresh) fail('tokens ausentes (register)');
  return {access,refresh,tenantId}
}

export async function refreshSmart(refreshToken){
  let r=await req('/api/auth/refresh',{method:'POST',json:{refresh_token:refreshToken}}); if(r.res.ok) return r.body;
  r=await req('/api/auth/refresh',{method:'POST',json:{refreshToken:refreshToken}}); if(r.res.ok) return r.body;
  r=await req('/api/auth/refresh',{method:'POST',headers:{'x-refresh-token':refreshToken}}); if(r.res.ok) return r.body;
  r=await req('/api/auth/refresh',{method:'POST',headers:{cookie:`refresh_token=${refreshToken}`}}); if(r.res.ok) return r.body;
  fail(`refresh failed ${r.res.status} ${JSON.stringify(r.body)}`)
}
