import { promises as fs } from 'node:fs';
const BASE=process.env.BASE_URL||'http://localhost:3000';
const PAGINATION_PATH=process.env.PAGINATION_PATH||'/api/v1/services';

function dec(t){if(!t)return{};const p=t.split('.');if(p.length!==3)return{};try{return JSON.parse(Buffer.from(p[1].replace(/-/g,'+').replace(/_/g,'/'),'base64').toString('utf8'))}catch{return{}}}

async function req(p,{headers={},json,method='GET'}={}){
  const r=await fetch(`${BASE}${p}`,{method,headers:{'content-type':'application/json',...headers},body:json?JSON.stringify(json):undefined});
  let b=null;
  try{b=await r.json()}catch{}
  return{r,b}
}

(async()=>{
  const seeds=JSON.parse(await fs.readFile('.seeds/tenants.json','utf8'));
  const login=await req('/api/v1/auth/login',{method:'POST',json:{email:seeds.A.email,password:seeds.A.password}});
  if(!login.r.ok){ console.error('login falhou',login.r.status,login.b); process.exit(1); }
  const tok=login.b.access_token||login.b.accessToken||login.b.token; 
  const tid=login.b.tenantId||login.b.tenant?.id||dec(tok).tenantId;
  if(!tok||!tid){ console.error('sem token/tenantId', {hasTok:!!tok, tid}); process.exit(1); }
  const h={ authorization:`Bearer ${tok}`, 'x-tenant-id':tid };
  const {r,b}=await req(`${PAGINATION_PATH}?page=1&pageSize=2`,{headers:h});
  if(r.status===401){ console.error('401 mesmo autenticado', b); process.exit(1); }
  const ok=b&&Number.isInteger(b.page)&&Number.isInteger(b.pageSize)&&Number.isInteger(b.total)&&Array.isArray(b.items);
  if(!ok){ console.error('Paginação fora do padrão {page,pageSize,total,items}', b); process.exit(1); }
  console.log('✅ Paginação ok');
})().catch(e=>{console.error(e);process.exit(1)});
