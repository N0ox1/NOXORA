# 🔄 Workflow de Sincronização

## Problema Resolvido
Evitar dessincronização entre ambiente local e produção (Vercel).

## Soluções Implementadas

### 1. Script de Verificação (`scripts/sync-check.mjs`)
Verifica automaticamente:
- ✅ Mudanças não commitadas
- ✅ Branch atual (deve ser `main`)
- ✅ Sincronização com `origin/main`
- ✅ Arquivos críticos presentes

### 2. Comandos Disponíveis

```bash
# Verificar sincronização
npm run sync:check

# Desenvolvimento com verificação automática
npm run dev:check

# Desenvolvimento normal (sem verificação)
npm run dev
```

### 3. Workflow Recomendado

#### Antes de começar a trabalhar:
```bash
# 1. Verificar sincronização
npm run sync:check

# 2. Se houver problemas, sincronizar
git pull origin main
```

#### Durante o desenvolvimento:
```bash
# Usar comando com verificação
npm run dev:check
```

#### Antes de fazer push:
```bash
# 1. Verificar sincronização
npm run sync:check

# 2. Fazer commit e push
git add .
git commit -m "descrição das mudanças"
git push origin main
```

### 4. Arquivos Críticos Monitorados
- `src/app/page.tsx` - Página principal
- `src/components/logo.tsx` - Componente da logo
- `next.config.js` - Configuração do Next.js
- `package.json` - Dependências e scripts

### 5. Troubleshooting

#### Erro: "Mudanças não commitadas"
```bash
git add .
git commit -m "sync changes"
git push origin main
```

#### Erro: "Branch atual não é main"
```bash
git checkout main
```

#### Erro: "Local não está sincronizado"
```bash
git pull origin main
```

## Benefícios
- ✅ Evita dessincronização local ↔ produção
- ✅ Detecção precoce de problemas
- ✅ Workflow automatizado
- ✅ Documentação clara
