import { decode } from 'node:querystring';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const EMAIL = process.env.E2E_EMAIL_OWNER || 'owner@noxora.dev';
const PASSWORD = process.env.E2E_PASSWORD_OWNER || 'owner123';

async function req(path,{method='GET',json,headers={},token,tenantId}={}){
  const url = path.startsWith('http')?path:`${BASE_URL}${path}`;
  const h={'content-type':'application/json',...headers};
  if(token) h.authorization = `Bearer ${token}`;
  if(tenantId) h['x-tenant-id']=tenantId;
  const res = await fetch(url,{method,headers:h,body:json?JSON.stringify(json):undefined});
  let body=null; try{ body=await res.json(); }catch{}
  return {res,body};
}

function decodeJwt(t){ if(!t) return {}; const p=t.split('.'); if(p.length!==3) return {}; const s=Buffer.from(p[1].replace(/-/g,'+').replace(/_/g,'/'),'base64').toString('utf8'); try{return JSON.parse(s)}catch{return{}} }

async function login(){
  const r=await req('/api/auth/login',{method:'POST',json:{email:EMAIL,password:PASSWORD}});
  if(!r.res.ok){ throw new Error('login falhou '+r.res.status+' '+JSON.stringify(r.body)); }
  const access=r.body?.access_token||r.body?.accessToken||r.body?.token;
  const tenantId=r.body?.tenantId||r.body?.tenant?.id||decodeJwt(access).tenantId;
  return {access,tenantId};
}

(async()=>{
  console.log('🔎 Teste API multi-tenant (read/write isolados)');
  const {access,tenantId} = await login();
  if(!tenantId) throw new Error('tenantId ausente do login');

  const svcBody = { name: 'GuardTest '+Date.now(), durationMin: 15, priceCents: 1999 };
  const created = await req('/api/services',{method:'POST',json:svcBody,token:access,tenantId});
  if(!created.res.ok) throw new Error('create service falhou '+created.res.status+' '+JSON.stringify(created.body));
  const id = created.body?.data?.id || created.body?.id || created.body?.service?.id;

  // leitura no tenant correto
  const listOk = await req('/api/services?limit=50',{token:access,tenantId});
  if(!listOk.res.ok) throw new Error('list ok falhou '+listOk.res.status);
  const found = JSON.stringify(listOk.body).includes(id);
  if(!found) throw new Error('service criado não apareceu no próprio tenant');

  // leitura usando tenant errado
  const mismatch = await req('/api/services?limit=50',{token:access,tenantId:'wrong-tenant'});
  if(mismatch.res.status===200){
    const leak = JSON.stringify(mismatch.body).includes(id);
    if(leak) throw new Error('vazamento: item visível com X-Tenant-Id errado');
  } else if([400,401,403,404].includes(mismatch.res.status)) {
    // ok, rota bloqueia
  } else {
    throw new Error('resposta inesperada no mismatch: '+mismatch.res.status);
  }

  console.log('✅ API: sem vazamento entre tenants (create/list).');
})().catch(e=>{ console.error('❌',e.message); process.exit(1); });
