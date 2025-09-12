/* Robust refresh fallback: body.refresh_token | body.refreshToken | header x-refresh-token | Cookie */
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const EMAIL = process.env.E2E_EMAIL_OWNER || 'owner@noxora.dev';
const PASSWORD = process.env.E2E_PASSWORD_OWNER || 'owner123';

async function req(path, { method = 'GET', body, headers = {}, token, tenantId } = {}) {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  const h = { 'content-type': 'application/json', ...headers };
  if (token) h.authorization = `Bearer ${token}`;
  if (tenantId) h['x-tenant-id'] = tenantId;
  const res = await fetch(url, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
  let json = null; try { json = await res.json(); } catch {}
  return { res, json };
}

function decodeJwt(token) {
  if (!token || token.split('.').length !== 3) return {};
  const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  const str = Buffer.from(b64, 'base64').toString('utf8');
  try { return JSON.parse(str); } catch { return {}; }
}

async function login(email, password) {
  const { res, json } = await req('/api/auth/login', { method: 'POST', body: { email, password } });
  if (!res.ok) throw new Error(`login failed ${res.status} ${JSON.stringify(json)}`);
  return json;
}

async function refreshSmart(refreshToken) {
  // 1) body.refresh_token
  let r = await req('/api/auth/refresh', { method: 'POST', body: { refresh_token: refreshToken } });
  if (r.res.ok) return r.json;
  // 2) body.refreshToken
  r = await req('/api/auth/refresh', { method: 'POST', body: { refreshToken: refreshToken } });
  if (r.res.ok) return r.json;
  // 3) header x-refresh-token
  r = await req('/api/auth/refresh', { method: 'POST', headers: { 'x-refresh-token': refreshToken } });
  if (r.res.ok) return r.json;
  // 4) Cookie refresh_token
  r = await req('/api/auth/refresh', { method: 'POST', headers: { cookie: `refresh_token=${refreshToken}` } });
  if (r.res.ok) return r.json;
  // 5) Cookie refreshToken (alguns sistemas)
  r = await req('/api/auth/refresh', { method: 'POST', headers: { cookie: `refreshToken=${refreshToken}` } });
  if (r.res.ok) return r.json;
  throw new Error(`refresh failed ${r.res.status} ${JSON.stringify(r.json)}`);
}

(async () => {
  console.log('🔒 Iniciando Testes de Segurança...');

  console.log('\n1️⃣ Testando health check...');
  const health = await req('/api/health');
  if (![200, 204].includes(health.res.status)) throw new Error('API down');
  console.log('✅ API está funcionando');

  console.log('\n2️⃣ Testando registro/login...');
  let auth;
  try {
    auth = await login(EMAIL, PASSWORD);
  } catch (e) {
    // tenta registrar se login falhar
    const reg = await req('/api/auth/register', { method: 'POST', body: { email: EMAIL, password: PASSWORD, name: 'Seed Shop ' + Date.now() } });
    if (!reg.res.ok) throw e;
    auth = reg.json;
  }
  const access = auth.access_token || auth.accessToken || auth.token;
  let refreshTok = auth.refresh_token || auth.refreshToken;
  let tenantId = auth.tenantId || auth?.tenant?.id;
  if (!access || !refreshTok) throw new Error('tokens ausentes no login');
  // Deriva tenantId do JWT se a API não retornou
  tenantId = tenantId || decodeJwt(access).tenantId || process.env.TENANT_ID;
  console.log('✅ Usuário logado com sucesso');
  if (!tenantId) console.warn('   Aviso: tenantId não veio da API; usando o do JWT se existir.');
  if (tenantId) console.log('   Tenant ID:', tenantId);

  console.log('\n3️⃣ Testando estrutura do JWT...');
  const payload = decodeJwt(access);
  if (!payload.jti) throw new Error('access sem jti');
  if (!payload.tenantId) throw new Error('access sem tenantId');
  if (tenantId && payload.tenantId !== tenantId) throw new Error('tenantId do JWT difere do esperado');
  console.log('✅ JWT tem estrutura correta');

  console.log('\n4️⃣ Testando rotação de refresh token...');
  const beforeJti = decodeJwt(refreshTok).jti;
  const refreshed = await refreshSmart(refreshTok);
  const newAccess = refreshed.access_token || refreshed.accessToken || refreshed.token;
  const newRefresh = refreshed.refresh_token || refreshed.refreshToken;
  if (!newAccess || !newRefresh) throw new Error('refresh não retornou tokens');
  const afterJti = decodeJwt(newRefresh).jti;
  if (!afterJti || afterJti === beforeJti) throw new Error('refresh não rotacionou jti');

  // antigo deve falhar agora
  const retryOld = await req('/api/auth/refresh', { method: 'POST', body: { refresh_token: refreshTok } });
  if (retryOld.res.ok) throw new Error('refresh antigo não foi revogado');

  // novo access funciona em rota protegida; use tenant se exigido
  const tid = tenantId || decodeJwt(newAccess).tenantId || process.env.TENANT_ID;
  if (!tid) throw new Error('tenantId ausente para chamada protegida');
  const protectedCheck = await req('/api/audit/logs?limit=5&offset=0', { method: 'GET', token: newAccess, tenantId: tid });
  if (![200, 204].includes(protectedCheck.res.status)) {
    let body = '';
    try { body = JSON.stringify(protectedCheck.json); } catch {}
    throw new Error(`access novo não autorizou em rota protegida: ${protectedCheck.res.status} ${body} (X-Tenant-Id enviado: ${tid || 'null'})`);
  }
  console.log('✅ Rotação e revogação OK');

  console.log('\n✅ Todos os testes passaram');
})().catch((err) => {
  console.error('\n❌ Erro durante os testes:', err.message);
  if (err.stack) console.error(err.stack.split('\n')[1]?.trim());
  process.exit(1);
});