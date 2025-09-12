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
  console.log('🔒 STRICT: update/delete só funcionam com tenant correto');
  const {access,tenantId} = await login();
  if(!tenantId) throw new Error('tenantId ausente do login');

  const created = await req('/api/services',{method:'POST',json:{name:'Strict '+Date.now(),durationMin:20,priceCents:2500},token:access,tenantId});
  if(!created.res.ok) throw new Error('create falhou');
  const id = created.body?.data?.id || created.body?.id || created.body?.service?.id;

  // tentativa de UPDATE com tenant errado
  const upWrong = await req(`/api/services/${id}`,{method:'PATCH',json:{name:'Hack'},token:access,tenantId:'wrong-tenant'});
  if(upWrong.res.status===200) throw new Error('update vazou com tenant errado');
  if(![400,401,403,404,409].includes(upWrong.res.status)) throw new Error('update wrong status inesperado '+upWrong.res.status);

  // DELETE com tenant errado
  const delWrong = await req(`/api/services/${id}`,{method:'DELETE',token:access,tenantId:'wrong-tenant'});
  if(delWrong.res.status===200) throw new Error('delete vazou com tenant errado');
  if(![400,401,403,404].includes(delWrong.res.status)) throw new Error('delete wrong status '+delWrong.res.status);

  // cleanup robusto
  const delOk = await req(`/api/services/${id}`,{method:'DELETE',token:access,tenantId});
  const okCodes = [200,202,204];
  if(!okCodes.includes(delOk.res.status)){
    // Se 404, confirme que não existe mais
    if(delOk.res.status===404){
      const list = await req('/api/services?limit=50',{token:access,tenantId});
      const stillThere = JSON.stringify(list.body||'').includes(id);
      if(!stillThere){ console.warn('↷ cleanup: 404 mas item já não existe'); }
      else { throw new Error('cleanup falhou: 404 e item ainda existe'); }
    } else {
      throw new Error('cleanup falhou: status '+delOk.res.status+' '+JSON.stringify(delOk.body));
    }
  }

  console.log('✅ STRICT: update/delete isolados por tenant.');
})().catch(e=>{ console.error('❌',e.message); process.exit(1); });
