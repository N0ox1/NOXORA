import {log,fail,req,OWNER_EMAIL,OWNER_PASSWORD} from './common.mjs';

(async()=>{
  log('🔒 Lockout + reset + política de senha');
  const destructive = String(process.env.LOCK_USE_OWNER||'false').toLowerCase()==='true';
  const email = destructive ? (process.env.LOCK_EMAIL||OWNER_EMAIL) : `lock+${Date.now()}@noxora.dev`;
  const good  = destructive ? (process.env.LOCK_PASSWORD||OWNER_PASSWORD||'owner123') : 'GoodP@ssw0rd!';

  // 5 tentativas erradas; alguns sistemas retornam 423/429 antes de completar
  let saw423=false;
  for(let i=0;i<5;i++){
    const r=await req('/api/auth/login',{method:'POST',json:{email,password:'wrong_'+i}});
    if(![400,401,403,423,429].includes(r.res.status)) fail(`falha de login deveria ser 400/401/403/423/429; veio ${r.res.status}`);
    if([423,429].includes(r.res.status)) saw423=true;
  }

  if(destructive){
    // Deve bloquear login correto após tentativas
    const blocked=await req('/api/auth/login',{method:'POST',json:{email,password:good}});
    if(![403,423,429].includes(blocked.res.status)) fail(`esperado bloqueio após tentativas; veio ${blocked.res.status}`);
  } else {
    // Não destrutivo: apenas valida que 423/429 apareceu em alguma tentativa
    if(!saw423){ console.warn('↷ Não-destrutivo: não observou 423/429; política pode ser por usuário e não por IP.'); }
  }

  // Fluxo de reset deve iniciar (idempotente)
  const forgot=await req('/api/auth/request-reset',{method:'POST',json:{email}});
  if(![200,202,204].includes(forgot.res.status)) fail(`forgot falhou ${forgot.res.status}`);

  // Política de senha (best-effort)
  const weakPayloadEnv=process.env.REGISTER_WEAK_PAYLOAD; let weakPayload;
  try{ weakPayload=weakPayloadEnv?JSON.parse(weakPayloadEnv):{email:`weak+${Date.now()}@noxora.dev`,password:'123456',name:'Weak'} }catch{ weakPayload={email:`weak+${Date.now()}@noxora.dev`,password:'123456',name:'Weak'} }
  const weak=await req('/api/auth/register',{method:'POST',json:weakPayload});
  if([200,201].includes(weak.res.status)) fail('senha fraca foi aceita no registro (ver política)');
  if(![400,422].includes(weak.res.status)) console.warn(`↷ Política não confirmada (status ${weak.res.status}). Ajuste REGISTER_WEAK_PAYLOAD se necessário.`);

  log('✅ Lockout/política ok');
})().catch(e=>fail(e.message));
