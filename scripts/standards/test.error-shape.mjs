const BASE=process.env.BASE_URL||'http://localhost:3000';

async function req(p,opts={}){
  const r=await fetch(`${BASE}${p}`,{
    headers:{'content-type':'application/json',...(opts.headers||{})},
    method:opts.method||'POST',
    body:opts.json?JSON.stringify(opts.json):undefined
  });
  let b=null;
  try{b=await r.json()}catch{}
  return{r,b}
}

(async()=>{
  const {r,b}=await req('/api/v1/auth/login',{json:{email:'x',password:'x'}});
  if(r.status<400){ 
    console.error('⚠ Esperado 4xx'); 
    process.exit(1); 
  }
  const ok=b&&(typeof b.error==='string'||(typeof b.code==='string'&&typeof b.message==='string'));
  if(!ok){ 
    console.error('❌ Erro fora do padrão {error} ou {code,message}:',b); 
    process.exit(1); 
  }
  console.log('✅ Erro padrão ok');
})().catch(e=>{console.error(e);process.exit(1)});
