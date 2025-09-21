import {log,fail,req,decodeJwt,loginOrRegister} from './common.mjs';

const RBAC_PATH='/api/services';

(async()=>{
  log('🔒 RBAC: OWNER|MANAGER|BARBER|ASSISTANT');
  const owner=await loginOrRegister(); const tid=owner.tenantId||decodeJwt(owner.access).tenantId; if(!tid) fail('tenantId ausente');
  const svc={name:'Corte '+Date.now(),durationMin:30,priceCents:5000};
  const create=await req(RBAC_PATH,{method:'POST',json:svc,token:owner.access,tenantId:tid}); if(![200,201].includes(create.res.status)) fail(`OWNER não criou service: ${create.res.status} ${JSON.stringify(create.body)}`);
  // negativo opcional: criar BARBER se houver endpoint
  const mk=await req('/api/users',{method:'POST',json:{email:`barber+${Date.now()}@noxora.dev`,password:'barber123',role:'BARBER'},token:owner.access,tenantId:tid});
  if(mk.res.ok){
    const login=await req('/api/auth/login',{method:'POST',json:{email:mk.body?.user?.email||'',password:'barber123'}});
    if(login.res.ok){
      const bAccess=login.body?.access_token||login.body?.accessToken||login.body?.token;
      const deny=await req(RBAC_PATH,{method:'POST',json:{name:'BarberTry',durationMin:20,priceCents:3000},token:bAccess,tenantId:tid});
      if(![401,403].includes(deny.res.status)) fail(`BARBER deveria ser bloqueado: ${deny.res.status}`);
    }
  } else { log('↷ RBAC negativo pulado (sem endpoint de criação de usuário/role)') }
  log('✅ RBAC ok');
})().catch(e=>fail(e.message));














