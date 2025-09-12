#!/usr/bin/env node

/**
 * Script para testar o sistema de autenticação JWT
 * Testa login, refresh token e acesso a rotas protegidas
 */

const BASE_URL = 'http://localhost:3000';

// Função para fazer requisições HTTP
async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();
    return { status: response.status, data, headers: response.headers };
  } catch (error) {
    return { error: error.message };
  }
}

// Função para testar login
async function testLogin() {
  console.log('🔐 Testando Login...');
  
  const loginData = {
    email: 'test@barbearia.com',
    password: 'senha123',
  };

  const result = await makeRequest(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify(loginData),
  });

  if (result.error) {
    console.error('❌ Erro no login:', result.error);
    return null;
  }

  if (result.status === 200) {
    console.log('✅ Login realizado com sucesso');
    console.log('📋 Dados do usuário:', result.data.user);
    console.log('🔑 Access Token:', result.data.accessToken);
    console.log('⏰ Expira em:', result.data.expiresIn);
    
    // Verificar se o refresh token foi definido como cookie
    const setCookieHeader = result.headers.get('set-cookie');
    if (setCookieHeader && setCookieHeader.includes('refreshToken')) {
      console.log('🍪 Refresh Token definido como cookie httpOnly');
    } else {
      console.log('⚠️  Refresh Token não encontrado nos cookies');
    }
    
    return result.data.accessToken;
  } else {
    console.error('❌ Falha no login:', result.status, result.data);
    return null;
  }
}

// Função para testar acesso a rota protegida
async function testProtectedRoute(token, route, description) {
  console.log(`\n🔒 Testando ${description}...`);
  
  const result = await makeRequest(`${BASE_URL}${route}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (result.error) {
    console.error(`❌ Erro ao acessar ${route}:`, result.error);
    return false;
  }

  if (result.status === 200) {
    console.log(`✅ ${description} acessado com sucesso`);
    console.log('📊 Dados recebidos:', result.data);
    return true;
  } else if (result.status === 401) {
    console.log(`❌ ${description} - Não autorizado (401)`);
    return false;
  } else if (result.status === 403) {
    console.log(`❌ ${description} - Acesso negado (403) - Sem permissão`);
    return false;
  } else {
    console.log(`❌ ${description} - Status inesperado:`, result.status, result.data);
    return false;
  }
}

// Função para testar refresh token
async function testRefreshToken() {
  console.log('\n🔄 Testando Refresh Token...');
  
  // Primeiro fazer login para obter cookies
  const loginResult = await makeRequest(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    body: JSON.stringify({
      email: 'test@barbearia.com',
      password: 'senha123',
    }),
  });

  if (loginResult.error || loginResult.status !== 200) {
    console.error('❌ Não foi possível fazer login para testar refresh');
    return false;
  }

  // Extrair cookies da resposta
  const setCookieHeader = loginResult.headers.get('set-cookie');
  if (!setCookieHeader) {
    console.error('❌ Cookies não encontrados na resposta de login');
    return false;
  }

  // Fazer requisição para refresh
  const refreshResult = await makeRequest(`${BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    headers: {
      'Cookie': setCookieHeader,
    },
  });

  if (refreshResult.error) {
    console.error('❌ Erro ao renovar token:', refreshResult.error);
    return false;
  }

  if (refreshResult.status === 200) {
    console.log('✅ Token renovado com sucesso');
    console.log('🔑 Novo Access Token:', refreshResult.data.accessToken);
    return true;
  } else {
    console.error('❌ Falha ao renovar token:', refreshResult.status, refreshResult.data);
    return false;
  }
}

// Função para testar logout
async function testLogout() {
  console.log('\n🚪 Testando Logout...');
  
  const result = await makeRequest(`${BASE_URL}/api/auth/logout`, {
    method: 'POST',
  });

  if (result.error) {
    console.error('❌ Erro no logout:', result.error);
    return false;
  }

  if (result.status === 200) {
    console.log('✅ Logout realizado com sucesso');
    
    // Verificar se o cookie foi removido
    const setCookieHeader = result.headers.get('set-cookie');
    if (setCookieHeader && setCookieHeader.includes('refreshToken=;')) {
      console.log('🍪 Refresh Token removido dos cookies');
    }
    
    return true;
  } else {
    console.error('❌ Falha no logout:', result.status, result.data);
    return false;
  }
}

// Função principal de teste
async function runTests() {
  console.log('🚀 Iniciando testes do sistema de autenticação...\n');

  // Teste 1: Login
  const accessToken = await testLogin();
  if (!accessToken) {
    console.log('\n❌ Testes interrompidos - Login falhou');
    return;
  }

  // Teste 2: Acesso a rotas protegidas
  await testProtectedRoute(accessToken, '/api/admin/dashboard', 'Dashboard Admin (requer MANAGER)');
  await testProtectedRoute(accessToken, '/api/admin/users', 'Gestão de Usuários (requer USER_MANAGEMENT)');
  await testProtectedRoute(accessToken, '/api/admin/analytics', 'Analytics (requer BARBER+)');

  // Teste 3: Refresh Token
  await testRefreshToken();

  // Teste 4: Logout
  await testLogout();

  // Teste 5: Tentativa de acesso após logout
  console.log('\n🔒 Testando acesso após logout...');
  const postLogoutResult = await makeRequest(`${BASE_URL}/api/admin/dashboard`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (postLogoutResult.status === 401) {
    console.log('✅ Acesso corretamente bloqueado após logout');
  } else {
    console.log('⚠️  Acesso ainda permitido após logout');
  }

  console.log('\n🎉 Testes concluídos!');
}

// Executar testes se o script for chamado diretamente
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };
