import { promises as fs } from 'node:fs';
const BASE_URL=process.env.BASE_URL||'http://localhost:3000';

async function req(path,{method='GET',json,headers={},token,tenantId}={}){const url=path.startsWith('http')?path:`${BASE_URL}${path}`;const h={'content-type':'application/json',...headers};if(token) h.authorization=`Bearer ${token}`;if(tenantId) h['x-tenant-id']=tenantId;const res=await fetch(url,{method,headers:h,body:json?JSON.stringify(json):undefined});let body=null;try{body=await res.json()}catch{}return{res,body}}
function decodeJwt(t){if(!t) return {};const p=t.split('.');if(p.length!==3) return {};const s=Buffer.from(p[1].replace(/-/g,'+').replace(/_/g,'/'),'base64').toString('utf8');try{return JSON.parse(s)}catch{return{}}}
async function login(email,password){const r=await req('/api/auth/login',{method:'POST',json:{email,password}});if(!r.res.ok) throw new Error('login falhou '+r.res.status+' '+JSON.stringify(r.body));const access=r.body?.access_token||r.body?.accessToken||r.body?.token;const tenantId=r.body?.tenantId||r.body?.tenant?.id||decodeJwt(access).tenantId;return {access,tenantId}}
function extractIds(body){if(!body) return [];if(Array.isArray(body)) return body.map(x=>x?.id).filter(Boolean);for(const k of Object.keys(body||{})){const v=body[k];if(Array.isArray(v)) return v.map(x=>x?.id).filter(Boolean)}return []}

async function loadSeedsOrEnv(){
  try{ const raw = await fs.readFile('.seeds/tenants.json','utf8'); return JSON.parse(raw) }catch{
    const A = { email: process.env.TENANT_A_EMAIL, password: process.env.TENANT_A_PASSWORD, tenantId: process.env.TENANT_A_ID, serviceId: process.env.TENANT_A_SERVICE_ID };
    const B = { email: process.env.TENANT_B_EMAIL, password: process.env.TENANT_B_PASSWORD, tenantId: process.env.TENANT_B_ID, serviceId: process.env.TENANT_B_SERVICE_ID };
    if (!A.email || !A.password || !A.tenantId || !A.serviceId || !B.email || !B.password || !B.tenantId || !B.serviceId) throw new Error('faltam seeds e variáveis TENANT_*');
    return { A, B };
  }
}

(async()=>{console.log('🔐 Cross-tenant checks');const data=await loadSeedsOrEnv();const Acred=await login(data.A.email,data.A.password);const Bcred=await login(data.B.email,data.B.password);
// 1) Token A + header A lendo id de B -> negar
const r1=await req(`/api/services/${data.B.serviceId}`,{token:Acred.access,tenantId:Acred.tenantId});if([200].includes(r1.res.status)) throw new Error('vazamento: A com header A leu id de B (200)');if(![401,403,404].includes(r1.res.status)) throw new Error('status inesperado r1: '+r1.res.status);
// 2) Token A + header B lendo id de B -> negar
const r2=await req(`/api/services/${data.B.serviceId}`,{token:Acred.access,tenantId:data.B.tenantId});if(r2.res.status===200) throw new Error('vazamento: A com header B leu id de B (200)');if(![401,403,404].includes(r2.res.status)) throw new Error('status inesperado r2: '+r2.res.status);
// 3) Token A + header B listando B -> se 200, lista deve ser vazia
const r3=await req('/api/services?limit=5',{token:Acred.access,tenantId:data.B.tenantId});if(r3.res.status===200){const ids=extractIds(r3.body);if(ids.length>0) throw new Error('vazamento: A listou recursos de B');}
// 4) simétrico com B
const r4=await req(`/api/services/${data.A.serviceId}`,{token:Bcred.access,tenantId:data.A.tenantId});if(r4.res.status===200) throw new Error('vazamento: B com header A leu id de A (200)');if(![401,403,404].includes(r4.res.status)) throw new Error('status inesperado r4: '+r4.res.status);
console.log('✅ Acesso cruzado negado (404/403)');})().catch(e=>{console.error('❌',e.message);process.exit(1)});
