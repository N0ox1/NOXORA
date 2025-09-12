-- =====================================================
-- ÍNDICES ESPECÍFICOS PARA PERFORMANCE
-- =====================================================

-- Índice composto para (tenant_id, slug) em barbershops
-- Este índice é crucial para busca rápida de barbearias por slug dentro de um tenant
CREATE INDEX IF NOT EXISTS idx_barbershops_tenant_slug 
ON barbershops(tenant_id, slug);

-- Índice composto para (tenant_id, barbershop_id, start_at) em appointments
-- Este índice otimiza consultas de agendamentos por período em uma barbearia específica
CREATE INDEX IF NOT EXISTS idx_appointments_tenant_shop_start 
ON appointments(tenant_id, barbershop_id, start_at);

-- Índices adicionais para otimização de consultas comuns

-- Índice para busca de agendamentos por data (útil para calendários)
CREATE INDEX IF NOT EXISTS idx_appointments_start_at 
ON appointments(start_at);

-- Índice para busca de agendamentos por status
CREATE INDEX IF NOT EXISTS idx_appointments_status 
ON appointments(status);

-- Índice para busca de agendamentos por cliente
CREATE INDEX IF NOT EXISTS idx_appointments_client_id 
ON appointments(client_id);

-- Índice para busca de agendamentos por funcionário
CREATE INDEX IF NOT EXISTS idx_appointments_employee_id 
ON appointments(employee_id);

-- Índice para busca de funcionários por barbearia
CREATE INDEX IF NOT EXISTS idx_employees_barbershop_id 
ON employees(barbershop_id);

-- Índice para busca de serviços por barbearia
CREATE INDEX IF NOT EXISTS idx_services_barbershop_id 
ON services(barbershop_id);

-- Índice para busca de serviços ativos
CREATE INDEX IF NOT EXISTS idx_services_active 
ON services(is_active) WHERE is_active = true;

-- Índice para busca de funcionários ativos
CREATE INDEX IF NOT EXISTS idx_employees_active 
ON employees(active) WHERE active = true;

-- Índice para busca de barbearias ativas
CREATE INDEX IF NOT EXISTS idx_barbershops_active 
ON barbershops(is_active) WHERE is_active = true;

-- Índice para busca de tenants ativos
CREATE INDEX IF NOT EXISTS idx_tenants_active 
ON tenants(is_active) WHERE is_active = true;

-- =====================================================
-- VERIFICAÇÃO DOS ÍNDICES
-- =====================================================

-- Comando para verificar todos os índices criados:
-- SELECT 
--     schemaname,
--     tablename,
--     indexname,
--     indexdef
-- FROM pg_indexes 
-- WHERE schemaname = 'public' 
--     AND indexname LIKE 'idx_%'
-- ORDER BY tablename, indexname;

-- Comando para verificar o tamanho dos índices:
-- SELECT 
--     schemaname,
--     tablename,
--     indexname,
--     pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size
-- FROM pg_indexes 
-- WHERE schemaname = 'public' 
--     AND indexname LIKE 'idx_%'
-- ORDER BY tablename, indexname;
