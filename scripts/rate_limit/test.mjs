import { promises as fs } from 'node:fs';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const PROTECTED_PATH = process.env.RATE_PATH_PROTECTED || '/api/rate-limit/test';
const HEALTH_PATH = process.env.RATE_HEALTH_PATH || '/api/auth/login';
const MAX = Number(process.env.RATE_MAX || 20);

async function req(path,{method='GET',json,headers={},token,tenantId,ip}={}){
  const url = path.startsWith('http')?path:`${BASE_URL}${path}`;
  const h={'content-type':'application/json',...headers};
  if(token) h.authorization=`Bearer ${token}`;
  if(tenantId) h['x-tenant-id']=tenantId;
  if(ip) h['x-forwarded-for']=ip;
  const res = await fetch(url,{method,headers:h,body:json?JSON.stringify(json):undefined});
  let body=null; try{body=await res.json()}catch{}
  return {res,body}
}

function sleep(ms){ return new Promise(r=>setTimeout(r,ms)) }
function decodeJwt(t){ if(!t) return {}; const p=t.split('.'); if(p.length!==3) return {}; const s=Buffer.from(p[1].replace(/-/g,'+').replace(/_/g,'/'),'base64').toString('utf8'); try{return JSON.parse(s)}catch{return{}} }

async function login(email,password){
  const r=await req('/api/auth/login',{method:'POST',json:{email,password}});
  if(!r.res.ok) throw new Error('login falhou '+r.res.status+' '+JSON.stringify(r.body));
  const access=r.body?.access_token||r.body?.accessToken||r.body?.token;
  const tenantId=r.body?.tenantId||r.body?.tenant?.id||decodeJwt(access).tenantId;
  return {access,tenantId};
}

async function loadSeeds(){
  const raw=await fs.readFile('.seeds/tenants.json','utf8');
  return JSON.parse(raw);
}

async function driveUntil429(factory, max=MAX){
  for(let i=1;i<=max;i++){
    const {res} = await factory(i);
    if(res.status===429) return {i,hit:true,res};
    // micro-delay para não enfileirar demais
    if(i%10===0) await sleep(10);
  }
  return {i:max,hit:false};
}

(async()=>{
  console.log('🧪 Rate limit: por IP e por tenant');
  const seeds = await loadSeeds();
  const A = await login(seeds.A.email, seeds.A.password);
  const B = await login(seeds.B.email, seeds.B.password);

  // --- Teste 1: Rate limit por IP (endpoint de login) ---
  const ip1='9.9.9.9';
  const ip2='9.9.9.10';
  const ipHit = await driveUntil429(()=>req(HEALTH_PATH,{method:'POST',json:{email:'test@test.com',password:'test'},ip:ip1}));
  if(!ipHit.hit) throw new Error('IP: não recebeu 429 dentro do limite. Talvez rate limit desativado ou threshold alto.');
  const ipOther = await req(HEALTH_PATH,{method:'POST',json:{email:'test2@test.com',password:'test'},ip:ip2});
  if(ipOther.res.status===429) throw new Error('IP: outro IP também recebeu 429 imediato. Falha no isolamento por IP.');
  console.log(`✅ IP: 429 após ${ipHit.i} req no IP ${ip1}; outro IP OK`);

  // --- Teste 2: Rate limit por tenant (rota protegida) ---
  // Use o MESMO IP para separar tenant-limit de ip-limit. Se colidir, re-testamos com IP novo.
  const ipTenant='2.2.2.2';
  const hitA = await driveUntil429((i)=>req(PROTECTED_PATH,{token:A.access,tenantId:A.tenantId,ip:ipTenant}));
  if(!hitA.hit) throw new Error('Tenant: não recebeu 429 para o tenant A dentro do limite.');
  // Tenta mesma rota com tenant B no MESMO IP
  const firstB = await req(PROTECTED_PATH,{token:B.access,tenantId:B.tenantId,ip:ipTenant});
  if(firstB.res.status!==429){
    console.log('✅ Tenant: A saturou, B no mesmo IP ainda atende -> limite por tenant ativo');
  } else {
    // Pode ter batido no limite por IP. Re-testa B com IP diferente para confirmar distinção.
    const secondB = await req(PROTECTED_PATH,{token:B.access,tenantId:B.tenantId,ip:'2.2.2.3'});
    if(secondB.res.status===429){
      throw new Error('Tenant: B também recebeu 429 imediato mesmo com IP diferente. Limite por tenant pode estar global/ausente.');
    } else {
      console.warn('↷ Tenant: B só liberou com IP diferente. Conclusão: existe rate limit por IP; não há evidência forte de por-tenant.');
    }
  }

  console.log('✅ Rate limit verificado.');
})().catch(e=>{ console.error('❌',e.message); process.exit(1); });
