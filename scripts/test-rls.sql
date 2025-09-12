-- =====================================================
-- TESTE DAS POLÍTICAS RLS - ISOLAMENTO POR TENANT
-- =====================================================

-- 1. CONFIGURAR TENANT_ID PARA TESTE
SELECT set_tenant_id('tenant_1');

-- 2. VERIFICAR TENANT_ID ATUAL
SELECT get_current_tenant_id() as current_tenant;

-- 3. TESTAR INSERÇÃO DE DADOS PARA O TENANT_1
INSERT INTO tenants (id, name, plan, status) 
VALUES ('tenant_1', 'Barbearia Teste 1', 'PRO', 'ACTIVE');

INSERT INTO barbershops (id, tenant_id, slug, name) 
VALUES ('shop_1', 'tenant_1', 'barbearia-teste-1', 'Barbearia Teste 1');

INSERT INTO employees (id, tenant_id, barbershop_id, name, role) 
VALUES ('emp_1', 'tenant_1', 'shop_1', 'João Silva', 'BARBER');

INSERT INTO services (id, tenant_id, barbershop_id, name, duration_min, price_cents) 
VALUES ('srv_1', 'tenant_1', 'shop_1', 'Corte Masculino', 30, 4500);

INSERT INTO clients (id, tenant_id, name, phone) 
VALUES ('cli_1', 'tenant_1', 'Pedro Santos', '+55 11 90000-0001');

INSERT INTO appointments (id, tenant_id, barbershop_id, employee_id, client_id, service_id, start_at, end_at) 
VALUES ('app_1', 'tenant_1', 'shop_1', 'emp_1', 'cli_1', 'srv_1', 
        '2024-12-01 10:00:00', '2024-12-01 10:30:00');

-- 4. TESTAR INSERÇÃO DE DADOS PARA O TENANT_2
SELECT set_tenant_id('tenant_2');

INSERT INTO tenants (id, name, plan, status) 
VALUES ('tenant_2', 'Barbearia Teste 2', 'STARTER', 'ACTIVE');

INSERT INTO barbershops (id, tenant_id, slug, name) 
VALUES ('shop_2', 'tenant_2', 'barbearia-teste-2', 'Barbearia Teste 2');

INSERT INTO employees (id, tenant_id, barbershop_id, name, role) 
VALUES ('emp_2', 'tenant_2', 'shop_2', 'Maria Silva', 'BARBER');

INSERT INTO services (id, tenant_id, barbershop_id, name, duration_min, price_cents) 
VALUES ('srv_2', 'tenant_2', 'shop_2', 'Corte Feminino', 45, 6000);

INSERT INTO clients (id, tenant_id, name, phone) 
VALUES ('cli_2', 'tenant_2', 'Ana Costa', '+55 11 90000-0002');

INSERT INTO appointments (id, tenant_id, barbershop_id, employee_id, client_id, service_id, start_at, end_at) 
VALUES ('app_2', 'tenant_2', 'shop_2', 'emp_2', 'cli_2', 'srv_2', 
        '2024-12-01 14:00:00', '2024-12-01 14:45:00');

-- 5. TESTAR ISOLAMENTO - VOLTAR PARA TENANT_1
SELECT set_tenant_id('tenant_1');

-- 6. VERIFICAR QUE SÓ VEMOS DADOS DO TENANT_1
SELECT '=== TENANTS ===' as info;
SELECT id, name, plan, status FROM tenants;

SELECT '=== BARBERSHOPS ===' as info;
SELECT id, tenant_id, slug, name FROM barbershops;

SELECT '=== EMPLOYEES ===' as info;
SELECT id, tenant_id, barbershop_id, name, role FROM employees;

SELECT '=== SERVICES ===' as info;
SELECT id, tenant_id, barbershop_id, name, duration_min, price_cents FROM services;

SELECT '=== CLIENTS ===' as info;
SELECT id, tenant_id, name, phone FROM clients;

SELECT '=== APPOINTMENTS ===' as info;
SELECT id, tenant_id, barbershop_id, employee_id, client_id, service_id, start_at FROM appointments;

-- 7. TESTAR ISOLAMENTO - IR PARA TENANT_2
SELECT set_tenant_id('tenant_2');

-- 8. VERIFICAR QUE SÓ VEMOS DADOS DO TENANT_2
SELECT '=== TENANTS (TENANT_2) ===' as info;
SELECT id, name, plan, status FROM tenants;

SELECT '=== BARBERSHOPS (TENANT_2) ===' as info;
SELECT id, tenant_id, slug, name FROM barbershops;

SELECT '=== EMPLOYEES (TENANT_2) ===' as info;
SELECT id, tenant_id, barbershop_id, name, role FROM employees;

SELECT '=== SERVICES (TENANT_2) ===' as info;
SELECT id, tenant_id, barbershop_id, name, duration_min, price_cents FROM services;

SELECT '=== CLIENTS (TENANT_2) ===' as info;
SELECT id, tenant_id, name, phone FROM clients;

SELECT '=== APPOINTMENTS (TENANT_2) ===' as info;
SELECT id, tenant_id, barbershop_id, employee_id, client_id, service_id, start_at FROM appointments;

-- 9. TESTAR TENTATIVA DE ACESSO CRUZADO
SELECT '=== TESTE DE ACESSO CRUZADO ===' as info;

-- Tentar ver dados do tenant_1 estando no tenant_2 (deve retornar vazio)
SELECT set_tenant_id('tenant_2');
SELECT COUNT(*) as tentativa_acesso_tenant_1 FROM tenants WHERE id = 'tenant_1';

-- 10. VERIFICAR POLÍTICAS RLS
SELECT '=== VERIFICAÇÃO DAS POLÍTICAS RLS ===' as info;

SELECT schemaname, tablename, policyname, permissive, cmd, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- 11. VERIFICAR SE RLS ESTÁ HABILITADO
SELECT '=== VERIFICAÇÃO RLS HABILITADO ===' as info;

SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- 12. VERIFICAR ÍNDICES CRIADOS
SELECT '=== VERIFICAÇÃO DOS ÍNDICES ===' as info;

SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- 13. LIMPEZA DOS DADOS DE TESTE
-- SELECT '=== LIMPEZA DOS DADOS DE TESTE ===' as info;
-- DELETE FROM appointments WHERE tenant_id IN ('tenant_1', 'tenant_2');
-- DELETE FROM clients WHERE tenant_id IN ('tenant_1', 'tenant_2');
-- DELETE FROM services WHERE tenant_id IN ('tenant_1', 'tenant_2');
-- DELETE FROM employees WHERE tenant_id IN ('tenant_1', 'tenant_2');
-- DELETE FROM barbershops WHERE tenant_id IN ('tenant_1', 'tenant_2');
-- DELETE FROM tenants WHERE id IN ('tenant_1', 'tenant_2');
