# Testes de Segurança - Noxora

## Visão Geral
Testes de segurança focados em:
- JWT rotação/revogação
- X-Tenant-Id vs jwt.tenantId
- CORS/headers/CSRF básico
- Lockout/reset de senha
- RBAC (casos positivos)

## Pré-requisitos
- API rodando em http://localhost:3000 (ou defina BASE_URL)
- Usuário OWNER disponível ou deixe o teste registrar um novo

## Variáveis de Ambiente
```bash
# opcional
set BASE_URL=http://localhost:3000
set E2E_EMAIL_OWNER=owner@noxora.dev
set E2E_PASSWORD_OWNER=owner123
# se quiser forçar um tenant
set TENANT_ID=tenant_123
```

## Como Executar
```bash
# Executar todos os testes de segurança
npm run test:security

# Ou executar diretamente
node scripts/test.security.mjs
```

## Testes Incluídos

### 1. Health Check
- Verifica se a API está respondendo

### 2. Autenticação
- Registro de novo usuário ou login
- Validação de tokens

### 3. JWT Structure
- Verifica se o JWT contém `jti` e `tenantId`
- Valida consistência do tenantId

### 4. Token Rotation
- Testa rotação de refresh tokens
- Verifica revogação de tokens antigos
- Valida funcionamento de novos tokens

### 5. Tenant Middleware
- Testa mismatch de X-Tenant-Id (deve falhar)
- Testa match de X-Tenant-Id (deve funcionar)

### 6. CORS e Headers
- Testa preflight CORS
- Verifica headers de segurança:
  - x-content-type-options
  - x-frame-options

### 7. Lockout Policy
- Testa bloqueio após múltiplas tentativas de login
- Verifica status de lockout

### 8. Password Reset
- Testa fluxo de reset de senha
- Verifica endpoint de forgot password

## Estrutura do Projeto
```
scripts/
├── test.security.mjs          # Teste principal de segurança
├── test.rbac.mjs             # Testes de RBAC existentes
├── test.lockout.mjs          # Testes de lockout existentes
├── test.cors.mjs             # Testes de CORS existentes
└── README-security-tests.md  # Este arquivo
```

## Ajustes Necessários
- Se sua rota protegida não for `/api/audit/logs`, ajuste `PROTECTED_PATH` no script
- Para testar RBAC negativo, crie um usuário BARBER e habilite os casos no `test.rbac.mjs`
- Ajuste as rotas de API conforme necessário

## Logs e Debug
O script fornece logs detalhados de cada teste:
- ✅ Sucesso
- ⚠️ Aviso (não crítico)
- ❌ Erro (falha do teste)

## Integração com CI/CD
Para usar em pipelines:
```bash
# Instalar dependências
npm install

# Executar testes de segurança
npm run test:security
```













