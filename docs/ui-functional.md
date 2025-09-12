# Sistema de UI Funcional

## Visão Geral

O sistema de UI funcional implementa três interfaces principais para diferentes tipos de usuários:

1. **Página Pública** (`/b/[slug]`) - Para clientes agendarem serviços
2. **Dashboard Admin** (`/admin/dashboard`) - Para administradores gerenciarem barbearias
3. **Super Admin** (`/admin/super-admin`) - Para administradores do sistema gerenciarem tenants

## Arquitetura

### Estrutura de Pastas

```
src/app/
├── (public)/
│   └── b/
│       └── [slug]/
│           └── page.tsx          # Página pública de agendamento
├── (admin)/
│   ├── dashboard/
│   │   └── page.tsx              # Dashboard admin
│   └── super-admin/
│       └── page.tsx              # Painel super admin
└── api/                          # APIs de backend
```

### Tecnologias Utilizadas

- **Next.js 15** - Framework React com App Router
- **React Hooks** - useState, useEffect para gerenciamento de estado
- **Tailwind CSS** - Estilização responsiva
- **Heroicons** - Ícones SVG
- **TypeScript** - Tipagem estática

## 1. Página Pública (/b/[slug])

### Funcionalidades

- **Seleção de Serviço**: Lista serviços disponíveis com preços e duração
- **Seleção de Profissional**: Escolha entre funcionários ativos
- **Seleção de Data**: Calendário de 14 dias com navegação
- **Seleção de Horário**: Slots disponíveis em grid responsivo
- **Formulário de Cliente**: Nome, telefone e email (opcional)
- **Resumo do Agendamento**: Confirmação visual antes de finalizar
- **Processo de Agendamento**: Simulação de criação com feedback

### Componentes Principais

```typescript
interface Service {
  id: string;
  name: string;
  duration_min: number;
  price_cents: number;
  description?: string;
  is_active: boolean;
}

interface Employee {
  id: string;
  name: string;
  role: string;
  active: boolean;
}

interface AppointmentSlot {
  time: string;
  available: boolean;
}
```

### Estados da Interface

- `barbershop` - Detalhes da barbearia
- `services` - Lista de serviços disponíveis
- `employees` - Lista de funcionários ativos
- `selectedService` - Serviço selecionado
- `selectedEmployee` - Funcionário selecionado
- `selectedDate` - Data selecionada
- `selectedTime` - Horário selecionado
- `clientInfo` - Informações do cliente
- `availableSlots` - Horários disponíveis

### Responsividade

- **Mobile First**: Layout adaptável para todos os dispositivos
- **Grid System**: Colunas que se ajustam automaticamente
- **Touch Friendly**: Botões e interações otimizados para touch
- **Breakpoints**: sm, md, lg para diferentes tamanhos de tela

## 2. Dashboard Admin (/admin/dashboard)

### Funcionalidades

- **Gestão de Serviços**: CRUD completo com modais
- **Gestão de Funcionários**: CRUD com diferentes cargos
- **Agenda Diária**: Visualização de agendamentos por data
- **Interface em Abas**: Organização clara por funcionalidade

### Abas Principais

#### Aba de Serviços
- Lista todos os serviços com informações detalhadas
- Botões para criar, editar e excluir
- Status visual (ativo/inativo)
- Preços em centavos com formatação brasileira

#### Aba de Funcionários
- Lista funcionários com avatares e informações de contato
- Diferentes cargos (Barbeiro, Recepcionista, Gerente)
- Status ativo/inativo
- Ações de edição e exclusão

#### Aba de Agenda
- Visualização por data específica
- Informações completas do agendamento
- Status coloridos (Confirmado, Pendente, Concluído, Cancelado)
- Ações para visualizar e editar

### Modais

#### Modal de Serviço
- Formulário com validação
- Campos: nome, duração, preço, descrição, status
- Validação de campos obrigatórios
- Botões de cancelar e salvar

#### Modal de Funcionário
- Formulário completo de cadastro
- Campos: nome, cargo, email, telefone, status
- Seleção de cargo via dropdown
- Validação de campos obrigatórios

### Funcionalidades de CRUD

- **Create**: Botão "Novo" abre modal vazio
- **Read**: Tabelas com informações organizadas
- **Update**: Botão de edição preenche modal
- **Delete**: Confirmação antes de excluir

## 3. Super Admin (/admin/super-admin)

### Funcionalidades

- **Visão Global**: Estatísticas de todos os tenants
- **Gestão de Tenants**: CRUD completo de organizações
- **Métricas de Negócio**: Receita, planos, status
- **Filtros Avançados**: Busca por nome, status e plano

### Dashboard de Estatísticas

#### Cards Principais
- **Total de Tenants**: Contagem geral
- **Receita Mensal**: Soma de todas as assinaturas
- **Tenants Ativos**: Contagem por status
- **Em Teste**: Contagem de trials

#### Estatísticas por Plano
- **Starter**: Tenants e receita do plano básico
- **Pro**: Tenants e receita do plano intermediário
- **Scale**: Tenants e receita do plano avançado

### Gestão de Tenants

#### Tabela Principal
- **Tenant**: Nome e slug da organização
- **Plano**: Tipo de assinatura com cores
- **Status**: Estado atual com indicadores visuais
- **Métricas**: Contadores de barbearias, funcionários e clientes
- **Receita**: Valor mensal em reais
- **Criado em**: Data de criação
- **Ações**: Visualizar, editar e excluir

#### Filtros
- **Busca**: Por nome ou slug
- **Status**: Filtrar por estado (Ativo, Em Teste, etc.)
- **Plano**: Filtrar por tipo de assinatura

### Modal de Detalhes

- **Informações Básicas**: Nome, slug, plano, status
- **Métricas Detalhadas**: Contadores organizados
- **Informações de Pagamento**: Receita, datas de teste/assinatura
- **Layout Responsivo**: Grid adaptável para diferentes tamanhos

## 4. Características Técnicas

### Gerenciamento de Estado

- **useState**: Para estados locais dos componentes
- **useEffect**: Para inicialização e efeitos colaterais
- **Estado Centralizado**: Cada página gerencia seu próprio estado
- **Imutabilidade**: Uso de spread operator para atualizações

### Validação e Feedback

- **Validação em Tempo Real**: Campos obrigatórios destacados
- **Feedback Visual**: Estados de loading, sucesso e erro
- **Confirmações**: Diálogos para ações destrutivas
- **Mensagens de Status**: Notificações claras para o usuário

### Performance

- **Lazy Loading**: Componentes carregados sob demanda
- **Memoização**: Estados otimizados para evitar re-renders
- **Debounce**: Controle de inputs para melhor performance
- **Virtualização**: Para listas grandes (futuro)

### Acessibilidade

- **Semântica HTML**: Uso correto de tags e atributos
- **Navegação por Teclado**: Suporte completo a Tab e Enter
- **Contraste**: Cores que atendem padrões WCAG
- **Screen Readers**: Labels e descrições apropriadas

## 5. Testes

### Script de Teste Automatizado

```bash
npm run ui:test
```

#### Funcionalidades Testadas

- **Acessibilidade das Páginas**: Status 200 para todas as rotas
- **Elementos Essenciais**: Verificação de conteúdo crítico
- **Navegação**: Teste de todas as rotas principais
- **Responsividade**: Verificação de classes CSS responsivas

#### Cobertura de Testes

- ✅ Página pública com todos os elementos
- ✅ Dashboard admin com abas funcionais
- ✅ Super admin com estatísticas
- ✅ Navegação entre páginas
- ✅ Headers de responsividade

## 6. Dados Mock

### Serviços de Exemplo
- Corte Masculino (30min, R$ 45,00)
- Barba (20min, R$ 25,00)
- Corte + Barba (45min, R$ 65,00)

### Funcionários de Exemplo
- Rafa (Barbeiro)
- João (Barbeiro)

### Tenants de Exemplo
- Barber Labs (PRO, Em Teste)
- Corte & Estilo (STARTER, Ativo)
- Barbearia Premium (SCALE, Ativo)

## 7. Próximos Passos

### Integração com Backend
- [ ] Conectar APIs reais de serviços
- [ ] Integrar sistema de autenticação
- [ ] Implementar persistência de dados
- [ ] Adicionar validações do servidor

### Melhorias de UX
- [ ] Drag & Drop para agenda
- [ ] Calendário interativo
- [ ] Notificações em tempo real
- [ ] Modo escuro

### Funcionalidades Avançadas
- [ ] Upload de imagens
- [ ] Relatórios e gráficos
- [ ] Sistema de permissões
- [ ] Auditoria de ações

## 8. Comandos Úteis

### Desenvolvimento
```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Testar UI
npm run ui:test

# Verificar tipos TypeScript
npm run type-check

# Linting
npm run lint
```

### Build e Deploy
```bash
# Build de produção
npm run build

# Iniciar servidor de produção
npm start

# Análise de bundle
npm run analyze
```

## 9. Troubleshooting

### Problemas Comuns

#### Página não carrega
- Verificar se o servidor está rodando
- Confirmar rotas no Next.js
- Verificar console do navegador

#### Estilos não aplicam
- Confirmar instalação do Tailwind CSS
- Verificar importação do globals.css
- Limpar cache do navegador

#### Estados não atualizam
- Verificar uso correto do useState
- Confirmar que não há re-renders desnecessários
- Verificar dependências do useEffect

### Logs e Debug

- **Console do Navegador**: Para erros JavaScript
- **Network Tab**: Para problemas de API
- **React DevTools**: Para inspecionar estados
- **Lighthouse**: Para performance e acessibilidade

## 10. Contribuição

### Padrões de Código

- **TypeScript**: Sempre usar tipagem
- **ESLint**: Seguir regras configuradas
- **Prettier**: Formatação automática
- **Conventional Commits**: Padrão de commits

### Estrutura de Componentes

- **Props Interface**: Sempre definir tipos
- **Default Props**: Valores padrão quando apropriado
- **Error Boundaries**: Tratamento de erros
- **Loading States**: Estados de carregamento

### Testes

- **Unit Tests**: Para lógica de negócio
- **Integration Tests**: Para fluxos completos
- **E2E Tests**: Para cenários de usuário
- **Visual Regression**: Para mudanças de UI

---

**Status**: ✅ Implementado e Testado  
**Versão**: 1.0.0  
**Última Atualização**: Dezembro 2024
