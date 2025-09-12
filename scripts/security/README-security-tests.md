# Security tests (Node)

## Rodar
```bash
npm run test:security
```

## Variáveis
```
set BASE_URL=http://localhost:3000
set E2E_EMAIL_OWNER=owner@noxora.dev
set E2E_PASSWORD_OWNER=owner123
set TENANT_ID=cmf...
# opcional: rota protegida para o middleware
set PROTECTED_PATH=/api/audit/logs?limit=1&offset=0
# opcional: e-mail/senha da conta a ser bloqueada (default = OWNER)
set LOCK_EMAIL=owner@noxora.dev
set LOCK_PASSWORD=owner123
# opcional: payload fraco para validar política de senha no /register
set REGISTER_WEAK_PAYLOAD={"email":"weak@x.y","password":"123456","name":"Weak","barbershopName":"Test","terms":true}
```
