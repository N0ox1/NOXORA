import {log,fail,req,decodeJwt,loginOrRegister} from './common.mjs';

const PATH=process.env.PROTECTED_PATH||'/api/audit/logs?limit=1&offset=0';

(async()=>{
  log('🔒 Middleware: X-Tenant-Id === jwt.tenantId');
  const {access,tenantId}=await loginOrRegister();
  const jwtTid=tenantId||decodeJwt(access).tenantId; if(!jwtTid) fail('tenantId ausente');

  const bad=await req(PATH,{token:access,tenantId:'wrong-tenant'});
  if(![401,403].includes(bad.res.status)){
    console.warn(`↷ Tenant errado retornou: ${bad.res.status} (esperado 401/403). Pode indicar middleware inativo nesta rota: ${PATH}`);
  }

  const ok=await req(PATH,{token:access,tenantId:jwtTid});
  if(![200,204].includes(ok.res.status)) fail(`esperado 200/204; veio ${ok.res.status} ${JSON.stringify(ok.body)}`);
  log('✅ Tenant header ok');
})().catch(e=>fail(e.message));
