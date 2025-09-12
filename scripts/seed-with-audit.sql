-- Script para inserir dados de seed com auditoria automática
-- Este script deve ser executado após a criação da tabela audit_logs

-- Inserir tenant
INSERT INTO tenants (id, name, plan, status, created_at, updated_at) VALUES
('tnt_1', 'Barber Labs', 'PRO', 'TRIALING', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Log de auditoria para criação do tenant
INSERT INTO audit_logs (id, tenant_id, actor_id, action, entity, entity_id, actor_type, actor_name, severity, status, ts) VALUES
('audit_seed_tenant_001', 'tnt_1', 'system', 'CREATE', 'tenant', 'tnt_1', 'system', 'Sistema de Seed', 'MEDIUM', 'SUCCESS', NOW())
ON CONFLICT (id) DO NOTHING;

-- Inserir barbershop
INSERT INTO barbershops (id, tenant_id, slug, name, is_active, created_at, updated_at) VALUES
('shop_1', 'tnt_1', 'barber-labs-centro', 'Barber Labs Centro', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Log de auditoria para criação da barbershop
INSERT INTO audit_logs (id, tenant_id, actor_id, action, entity, entity_id, actor_type, actor_name, severity, status, ts) VALUES
('audit_seed_barbershop_001', 'tnt_1', 'system', 'CREATE', 'barbershop', 'shop_1', 'system', 'Sistema de Seed', 'MEDIUM', 'SUCCESS', NOW())
ON CONFLICT (id) DO NOTHING;

-- Inserir employee
INSERT INTO employees (id, tenant_id, barbershop_id, name, role, active, created_at, updated_at) VALUES
('emp_1', 'tnt_1', 'shop_1', 'Rafa', 'BARBER', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Log de auditoria para criação do employee
INSERT INTO audit_logs (id, tenant_id, actor_id, action, entity, entity_id, actor_type, actor_name, severity, status, ts) VALUES
('audit_seed_employee_001', 'tnt_1', 'system', 'CREATE', 'employee', 'emp_1', 'system', 'Sistema de Seed', 'MEDIUM', 'SUCCESS', NOW())
ON CONFLICT (id) DO NOTHING;

-- Inserir service
INSERT INTO services (id, tenant_id, barbershop_id, name, duration_min, price_cents, is_active, created_at, updated_at) VALUES
('srv_1', 'tnt_1', 'shop_1', 'Corte Masculino', 30, 4500, true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Log de auditoria para criação do service
INSERT INTO audit_logs (id, tenant_id, actor_id, action, entity, entity_id, actor_type, actor_name, severity, status, ts) VALUES
('audit_seed_service_001', 'tnt_1', 'system', 'CREATE', 'service', 'srv_1', 'system', 'Sistema de Seed', 'MEDIUM', 'SUCCESS', NOW())
ON CONFLICT (id) DO NOTHING;

-- Inserir client
INSERT INTO clients (id, tenant_id, name, phone, created_at, updated_at) VALUES
('cli_1', 'tnt_1', 'João Silva', '+55 11 90000-0000', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Log de auditoria para criação do client
INSERT INTO audit_logs (id, tenant_id, actor_id, action, entity, entity_id, actor_type, actor_name, severity, status, ts) VALUES
('audit_seed_client_001', 'tnt_1', 'system', 'CREATE', 'client', 'cli_1', 'system', 'Sistema de Seed', 'MEDIUM', 'SUCCESS', NOW())
ON CONFLICT (id) DO NOTHING;

-- Inserir appointment
INSERT INTO appointments (id, tenant_id, barbershop_id, employee_id, client_id, service_id, status, created_at, updated_at) VALUES
('app_1', 'tnt_1', 'shop_1', 'emp_1', 'cli_1', 'srv_1', 'CONFIRMED', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Log de auditoria para criação do appointment
INSERT INTO audit_logs (id, tenant_id, actor_id, action, entity, entity_id, actor_type, actor_name, severity, status, ts) VALUES
('audit_seed_appointment_001', 'tnt_1', 'system', 'CREATE', 'appointment', 'app_1', 'system', 'Sistema de Seed', 'MEDIUM', 'SUCCESS', NOW())
ON CONFLICT (id) DO NOTHING;

-- Log de auditoria para confirmação do appointment
INSERT INTO audit_logs (id, tenant_id, actor_id, action, entity, entity_id, actor_type, actor_name, severity, status, ts, changes, metadata) VALUES
('audit_seed_appointment_confirm_001', 'tnt_1', 'system', 'UPDATE', 'appointment', 'app_1', 'system', 'Sistema de Seed', 'MEDIUM', 'SUCCESS', NOW(), 
 '[{"field": "status", "old_value": "PENDING", "new_value": "CONFIRMED"}]',
 '{"action_type": "confirmation", "source": "seed_script", "timestamp": "' || NOW()::text || '"}')
ON CONFLICT (id) DO NOTHING;

-- Verificar dados inseridos
SELECT 'Tenants' as table_name, count(*) as count FROM tenants
UNION ALL
SELECT 'Barbershops', count(*) FROM barbershops
UNION ALL
SELECT 'Employees', count(*) FROM employees
UNION ALL
SELECT 'Services', count(*) FROM services
UNION ALL
SELECT 'Clients', count(*) FROM clients
UNION ALL
SELECT 'Appointments', count(*) FROM appointments
UNION ALL
SELECT 'Audit Logs', count(*) FROM audit_logs;
