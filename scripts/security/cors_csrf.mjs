import {log,fail,req,BASE_URL} from './common.mjs';

async function preflight(path){
  const res=await fetch(`${BASE_URL}${path}`,{method:'OPTIONS',headers:{origin:'https://example.com','access-control-request-method':'POST','access-control-request-headers':'content-type, authorization, x-tenant-id'}});
  return res;
}

(async()=>{
  log('🔒 CORS + security headers + CSRF quando aplicável');
  const pf=await preflight('/api/auth/login'); if(pf.status>=500) fail(`preflight ${pf.status}`);
  const aco=pf.headers.get('access-control-allow-origin'); if(!aco){ console.error('Headers recebidos:', Object.fromEntries(pf.headers)); fail('CORS: ACAO ausente'); }
  const res=await fetch(`${BASE_URL}/api/health`); const h=res.headers; if(!h.get('x-content-type-options')) fail('X-Content-Type-Options ausente'); if(!h.get('x-frame-options')) fail('X-Frame-Options ausente');
  const login=await fetch(`${BASE_URL}/api/auth/login`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:'x@y.z',password:'nope'})}); const sc=login.headers.get('set-cookie')||''; if(sc){ if(!/HttpOnly/i.test(sc)) fail('Cookie sem HttpOnly'); if(!/SameSite=(Lax|Strict|None)/i.test(sc)) fail('Cookie sem SameSite') }
  // CSRF web: best-effort (se houver página /login com token)
  try{const page=await fetch(`${BASE_URL}/login`); if(page.ok){const html=await page.text(); const hasCsrf=/csrf/i.test(html)||/name=["']csrf/.test(html); log(hasCsrf?'↷ CSRF presente na web':'↷ CSRF não aplicável/sem token visível')}}catch{}
  log('✅ CORS/headers ok');
})().catch(e=>fail(e.message));
