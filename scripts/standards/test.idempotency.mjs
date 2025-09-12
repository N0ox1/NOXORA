import { promises as fs } from 'node:fs';
const BASE=process.env.BASE_URL||'http://localhost:3000';
const LOGIN_PATH=process.env.LOGIN_PATH||'/api/v1/auth/login';
const CREATE_PATH=process.env.IDEMPOTENCY_CREATE_PATH||'/api/v1/services';

function uuid(){return crypto.randomUUID()}
function dec(t){if(!t)return{};const p=t.split('.');if(p.length!==3)return{};try{return JSON.parse(Buffer.from(p[1].replace(/-/g,'+').replace(/_/g,'/'),'base64').toString('utf8'))}catch{return{}}}

async function req(p,{m='GET',h={},j}={}){
  const r=await fetch(`${BASE}${p}`,{method:m,headers:{'content-type':'application/json',...h},body:j?JSON.stringify(j):undefined});
  let b=null;
  try{b=await r.json()}catch{}
  return{r,b}
}

(async()=>{
  const seeds=JSON.parse(await fs.readFile('.seeds/tenants.json','utf8'));
  const login=await req(LOGIN_PATH,{m:'POST',j:{email:seeds.A.email,password:seeds.A.password}});
  if(!login.r.ok){ console.error('login falhou',login.r.status,login.b); process.exit(1); }
  const tok=login.b.access_token||login.b.accessToken||login.b.token; 
  const tid=login.b.tenantId||login.b.tenant?.id||dec(tok).tenantId;
  const key=uuid(); 
  const payload={name:'Idem '+Date.now(),durationMin:10,priceCents:1000};
  const h={'authorization':`Bearer ${tok}`,'x-tenant-id':tid,'idempotency-key':key};

  // 1) primeira tentativa
  let a=await req(CREATE_PATH,{m:'POST',h,j:payload});
  if(!(a.r.status===200||a.r.status===201)){
    console.error('❌ primeiro POST falhou', a.r.status, a.b); process.exit(1);
  }
  const id=a.b?.id||a.b?.service?.id;

  // 2) repetição com mesma key (deve ser 200/208/409)
  const b=await req(CREATE_PATH,{m:'POST',h,j:payload});
  if(b.r.status===201){ console.error('❌ repetição criou novamente', b.b); process.exit(1); }
  if(!(b.r.status===200||b.r.status===208||b.r.status===409)){
    console.error('❌ status inesperado na repetição', b.r.status, b.b); process.exit(1);
  }
  const id2=b.b?.id||b.b?.service?.id; if(id&&id2&&id!==id2){ console.error('❌ ids diferentes na mesma key', {id,id2}); process.exit(1); }

  // 3) mesma key com payload diferente => conflito
  const c=await req(CREATE_PATH,{m:'POST',h,j:{...payload,name:'Outro'}});
  if(!(c.r.status===409||c.r.status===422)){
    console.error('❌ esperado 409/422 na mesma key com payload diferente', c.r.status, c.b); process.exit(1);
  }
  console.log('✅ Idempotência ok');
})().catch(e=>{console.error(e);process.exit(1)});
