import {log,fail,req,decodeJwt,loginOrRegister,refreshSmart} from './common.mjs';

(async()=>{
  log('🔒 JWT: rotação e revogação por jti');
  const health=await req('/api/health'); if(![200,204].includes(health.res.status)) fail('API down');
  const {access,refresh,tenantId}=await loginOrRegister();
  const beforeJti=decodeJwt(refresh).jti; if(!beforeJti) fail('refresh sem jti');
  const refreshed=await refreshSmart(refresh);
  const newAccess=refreshed?.access_token||refreshed?.accessToken||refreshed?.token; const newRefresh=refreshed?.refresh_token||refreshed?.refreshToken;
  if(!newAccess||!newRefresh) fail('refresh não retornou tokens');
  const afterJti=decodeJwt(newRefresh).jti; if(!afterJti||afterJti===beforeJti) fail('jti não rotacionou');
  // refresh antigo deve falhar
  const old=await req('/api/auth/refresh',{method:'POST',json:{refresh_token:refresh}}); if(old.res.ok) fail('refresh antigo não revogado');
  // access novo em rota protegida
  const tid=tenantId||decodeJwt(newAccess).tenantId; if(!tid) fail('tenantId ausente');
  const check=await req('/api/audit/logs?limit=1&offset=0',{token:newAccess,tenantId:tid}); if(![200,204].includes(check.res.status)) fail(`rota protegida falhou ${check.res.status} ${JSON.stringify(check.body)}`);
  log('✅ JWT ok');
})().catch(e=>fail(e.message));













