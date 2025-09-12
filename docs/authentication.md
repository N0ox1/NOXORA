# 🔐 Sistema de Autenticação JWT

## 📋 Visão Geral

O sistema de autenticação do Noxora implementa JWT (JSON Web Tokens) com arquitetura de **access tokens curtos** e **refresh tokens httpOnly** para máxima segurança e performance.

## 🏗️ Arquitetura

### Tokens
- **Access Token**: JWT de 15 minutos para autenticação de API
- **Refresh Token**: JWT de 7 dias armazenado como cookie httpOnly
- **Rotação de Tokens**: Refresh tokens são renovados a cada uso

### Segurança
- **httpOnly Cookies**: Refresh tokens não acessíveis via JavaScript
- **HTTPS Only**: Cookies seguros em produção
- **SameSite**: Proteção contra CSRF
- **Expiração Automática**: Tokens expiram automaticamente

## 🔑 Funcionalidades

### 1. Sistema de Roles
```typescript
enum UserRole {
  OWNER = 'OWNER',        // Nível 5 - Acesso total
  MANAGER = 'MANAGER',    // Nível 4 - Gestão completa
  BARBER = 'BARBER',      // Nível 3 - Operações de barbearia
  ASSISTANT = 'ASSISTANT', // Nível 2 - Assistente
  CLIENT = 'CLIENT',      // Nível 1 - Cliente
}
```

### 2. Sistema de Permissões
```typescript
enum Permission {
  // Gestão de Barbearias
  BARBERSHOP_CREATE = 'barbershop:create',
  BARBERSHOP_READ = 'barbershop:read',
  BARBERSHOP_UPDATE = 'barbershop:update',
  BARBERSHOP_DELETE = 'barbershop:delete',
  
  // Gestão de Funcionários
  EMPLOYEE_CREATE = 'employee:create',
  EMPLOYEE_READ = 'employee:read',
  EMPLOYEE_UPDATE = 'employee:update',
  EMPLOYEE_DELETE = 'employee:delete',
  
  // E muito mais...
}
```

### 3. Mapeamento Role → Permissões
```typescript
const ROLE_PERMISSIONS = {
  [UserRole.OWNER]: [...Object.values(Permission)], // Todas as permissões
  [UserRole.MANAGER]: [/* Permissões de gestão */],
  [UserRole.BARBER]: [/* Permissões de barbeiro */],
  [UserRole.ASSISTANT]: [/* Permissões de assistente */],
  [UserRole.CLIENT]: [/* Permissões de cliente */],
};
```

## 🚀 Uso Rápido

### Login
```typescript
// POST /api/auth/login
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});

const { accessToken, user } = await response.json();
// refreshToken é automaticamente definido como cookie httpOnly
```

### Acesso a Rotas Protegidas
```typescript
// GET /api/admin/dashboard
const response = await fetch('/api/admin/dashboard', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
  },
});
```

### Refresh Token
```typescript
// POST /api/auth/refresh
const response = await fetch('/api/auth/refresh', {
  method: 'POST',
  // Cookies são enviados automaticamente
});

const { accessToken: newAccessToken } = await response.json();
```

### Logout
```typescript
// POST /api/auth/logout
await fetch('/api/auth/logout', {
  method: 'POST',
});
// refreshToken é automaticamente removido dos cookies
```

## 🔒 Middleware de Autenticação

### Middleware Base
```typescript
import { requireAuth } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  // Verificar autenticação
  const authCheck = await requireAuth()(request);
  if (authCheck) return authCheck; // Erro de autenticação
  
  // Usuário autenticado, continuar...
}
```

### Middleware com Role Específico
```typescript
import { requireRole } from '@/lib/auth/middleware';
import { UserRole } from '@/lib/auth/roles';

export async function GET(request: NextRequest) {
  // Verificar se usuário tem role MANAGER
  const authCheck = await requireRole(UserRole.MANAGER)(request);
  if (authCheck) return authCheck; // Erro de autorização
  
  // Usuário tem role adequado, continuar...
}
```

### Middleware com Permissão Específica
```typescript
import { requirePermission } from '@/lib/auth/middleware';
import { Permission } from '@/lib/auth/roles';

export async function GET(request: NextRequest) {
  // Verificar se usuário tem permissão USER_MANAGEMENT
  const authCheck = await requirePermission(Permission.USER_MANAGEMENT)(request);
  if (authCheck) return authCheck; // Erro de autorização
  
  // Usuário tem permissão adequada, continuar...
}
```

### Middleware com Role Mínimo
```typescript
import { requireMinRole } from '@/lib/auth/middleware';
import { UserRole } from '@/lib/auth/roles';

export async function GET(request: NextRequest) {
  // Verificar se usuário tem pelo menos role BARBER
  const authCheck = await requireMinRole(UserRole.BARBER)(request);
  if (authCheck) return authCheck; // Erro de autorização
  
  // Usuário tem role adequado, continuar...
}
```

## 📊 Contexto de Autenticação

### Acessando Dados do Usuário
```typescript
import { getAuthContext } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  const authContext = getAuthContext(request);
  
  if (authContext) {
    const { user, hasRole, hasPermission } = authContext;
    
    console.log('Usuário:', user.userId);
    console.log('Roles:', user.roles);
    console.log('Tem role BARBER?', hasRole(UserRole.BARBER));
    console.log('Tem permissão USER_MANAGEMENT?', hasPermission(Permission.USER_MANAGEMENT));
  }
}
```

### Verificações de Segurança
```typescript
const authContext = getAuthContext(request);

// Verificar role específico
if (!authContext.hasRole(UserRole.MANAGER)) {
  return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
}

// Verificar permissão específica
if (!authContext.hasPermission(Permission.USER_MANAGEMENT)) {
  return NextResponse.json({ error: 'Permissão insuficiente' }, { status: 403 });
}

// Verificar múltiplos roles
if (!authContext.hasAnyRole([UserRole.MANAGER, UserRole.OWNER])) {
  return NextResponse.json({ error: 'Role insuficiente' }, { status: 403 });
}

// Verificar múltiplas permissões
if (!authContext.hasAnyPermission([Permission.USER_MANAGEMENT, Permission.SYSTEM_SETTINGS])) {
  return NextResponse.json({ error: 'Permissões insuficientes' }, { status: 403 });
}
```

## 🧪 Testando o Sistema

### Script de Teste Automatizado
```bash
# Executar todos os testes de autenticação
npm run auth:test
```

### Testes Manuais
```bash
# 1. Fazer login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"senha123"}'

# 2. Usar access token para acessar rota protegida
curl http://localhost:3000/api/admin/dashboard \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN_AQUI"

# 3. Renovar token
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Cookie: refreshToken=SEU_REFRESH_TOKEN_AQUI"

# 4. Fazer logout
curl -X POST http://localhost:3000/api/auth/logout
```

## 🔧 Configuração

### Variáveis de Ambiente
```env
# JWT
JWT_SECRET="your-super-secret-jwt-key-here"

# App
NODE_ENV="development"
```

### Configurações JWT
```typescript
// src/lib/auth/jwt.ts
const ACCESS_TOKEN_EXPIRY = '15m';  // 15 minutos
const REFRESH_TOKEN_EXPIRY = '7d';  // 7 dias
```

## 📈 Monitoramento e Debug

### Verificar Token
```typescript
import { JWTService } from '@/lib/auth/jwt';

// Decodificar token sem verificar (para debug)
const payload = JWTService.decodeToken(token);
console.log('Payload do token:', payload);
```

### Verificar Cookies
```typescript
// No browser
document.cookie; // Não deve mostrar refreshToken (httpOnly)

// No servidor
import { JWTService } from '@/lib/auth/jwt';
const refreshToken = JWTService.getRefreshTokenFromCookieServer();
```

## 🚨 Troubleshooting

### Problemas Comuns

#### 1. Token Expirado
```typescript
// Erro: "Token de acesso inválido ou expirado"
// Solução: Usar refresh token para obter novo access token
const response = await fetch('/api/auth/refresh', { method: 'POST' });
```

#### 2. Cookie Não Definido
```typescript
// Verificar se o cookie está sendo definido corretamente
const setCookieHeader = response.headers.get('set-cookie');
console.log('Cookies definidos:', setCookieHeader);
```

#### 3. Permissão Insuficiente
```typescript
// Verificar se o usuário tem o role/permissão necessário
const authContext = getAuthContext(request);
console.log('Roles do usuário:', authContext.user.roles);
console.log('Permissões do usuário:', authContext.user.permissions);
```

### Logs de Debug
```typescript
// Habilitar logs detalhados
console.log('Token recebido:', token);
console.log('Payload decodificado:', JWTService.decodeToken(token));
console.log('Contexto de autenticação:', getAuthContext(request));
```

## 🔄 Migrações e Atualizações

### Adicionar Nova Permissão
```typescript
// 1. Adicionar ao enum Permission
enum Permission {
  // ... permissões existentes
  NEW_FEATURE_ACCESS = 'new-feature:access',
}

// 2. Adicionar aos roles apropriados
const ROLE_PERMISSIONS = {
  [UserRole.MANAGER]: [
    // ... permissões existentes
    Permission.NEW_FEATURE_ACCESS,
  ],
};
```

### Adicionar Novo Role
```typescript
// 1. Adicionar ao enum UserRole
enum UserRole {
  // ... roles existentes
  SUPERVISOR = 'SUPERVISOR',
}

// 2. Definir permissões do novo role
const ROLE_PERMISSIONS = {
  // ... roles existentes
  [UserRole.SUPERVISOR]: [
    Permission.BARBERSHOP_READ,
    Permission.EMPLOYEE_READ,
    Permission.REPORTS_READ,
    // ... outras permissões
  ],
};
```

## 📚 Recursos Adicionais

### Documentação JWT
- [JWT.io](https://jwt.io/) - Debugger e documentação
- [RFC 7519](https://tools.ietf.org/html/rfc7519) - Especificação oficial

### Segurança
- [OWASP JWT Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Developers_Cheat_Sheet.html)
- [JWT Security Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)

### Bibliotecas
- [jose](https://github.com/panva/jose) - Biblioteca JWT moderna
- [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) - Biblioteca clássica

## ✅ Checklist de Implementação

- [x] Sistema JWT implementado
- [x] Access tokens curtos (15 min)
- [x] Refresh tokens httpOnly (7 dias)
- [x] Sistema de roles hierárquico
- [x] Sistema de permissões granulares
- [x] Middleware de autenticação
- [x] Middleware de autorização
- [x] Rotas protegidas implementadas
- [x] Scripts de teste criados
- [x] Documentação completa
- [x] Rotação de tokens
- [x] Logout seguro

## 🎯 Próximos Passos

1. **Integrar com banco de dados** para usuários reais
2. **Implementar blacklist** para tokens revogados
3. **Adicionar rate limiting** para endpoints de auth
4. **Implementar 2FA** para maior segurança
5. **Adicionar auditoria** para ações de autenticação
6. **Implementar sessões simultâneas** limitadas
7. **Adicionar notificações** de login suspeito
