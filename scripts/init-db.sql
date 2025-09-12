-- Script de inicialização do banco de dados para desenvolvimento
-- Este script é executado automaticamente quando o container PostgreSQL é criado

-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Inserir tenant padrão
INSERT INTO tenants (id, name, plan, status, domain, settings, is_active, created_at, updated_at)
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'Barbearia Alfa',
    'PRO',
    'ACTIVE',
    'barbearia-alfa.localhost',
    '{"theme": "dark", "currency": "BRL", "timezone": "America/Sao_Paulo"}',
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO tenants (id, name, plan, status, domain, settings, is_active, created_at, updated_at)
VALUES (
    '550e8400-e29b-41d4-a716-446655440001',
    'Barbearia Beta',
    'STARTER',
    'ACTIVE',
    'barbearia-beta.localhost',
    '{"theme": "light", "currency": "BRL", "timezone": "America/Sao_Paulo"}',
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO tenants (id, name, plan, status, domain, settings, is_active, created_at, updated_at)
VALUES (
    '550e8400-e29b-41d4-a716-446655440002',
    'Barbearia Gama',
    'SCALE',
    'ACTIVE',
    'barbearia-gama.localhost',
    '{"theme": "dark", "currency": "BRL", "timezone": "America/Sao_Paulo"}',
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Inserir barbearias para o tenant Alfa
INSERT INTO barbershops (id, tenant_id, slug, name, description, address, phone, email, is_active, created_at, updated_at)
VALUES (
    '660e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440000',
    'central',
    'Barbearia Central',
    'Barbearia tradicional no centro da cidade',
    'Rua das Flores, 123 - Centro',
    '(11) 99999-9999',
    'central@barbearia-alfa.com',
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO barbershops (id, tenant_id, slug, name, description, address, phone, email, is_active, created_at, updated_at)
VALUES (
    '660e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440000',
    'moderna',
    'Barbearia Moderna',
    'Barbearia com estilo contemporâneo',
    'Av. Paulista, 456 - Bela Vista',
    '(11) 88888-8888',
    'moderna@barbearia-alfa.com',
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Inserir funcionários para a Barbearia Central
INSERT INTO employees (id, tenant_id, barbershop_id, name, role, email, phone, active, created_at, updated_at)
VALUES (
    '770e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440000',
    '660e8400-e29b-41d4-a716-446655440000',
    'João Silva',
    'OWNER',
    'joao@barbearia-alfa.com',
    '(11) 99999-1111',
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO employees (id, tenant_id, barbershop_id, name, role, email, phone, active, created_at, updated_at)
VALUES (
    '770e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440000',
    '660e8400-e29b-41d4-a716-446655440000',
    'Pedro Santos',
    'BARBER',
    'pedro@barbearia-alfa.com',
    '(11) 99999-2222',
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO employees (id, tenant_id, barbershop_id, name, role, email, phone, active, created_at, updated_at)
VALUES (
    '770e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440000',
    '660e8400-e29b-41d4-a716-446655440000',
    'Maria Costa',
    'ASSISTANT',
    'maria@barbearia-alfa.com',
    '(11) 99999-3333',
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Inserir serviços para a Barbearia Central
INSERT INTO services (id, tenant_id, barbershop_id, name, description, duration_min, price_cents, is_active, created_at, updated_at)
VALUES (
    '880e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440000',
    '660e8400-e29b-41d4-a716-446655440000',
    'Corte Masculino',
    'Corte tradicional masculino',
    30,
    3500,
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO services (id, tenant_id, barbershop_id, name, description, duration_min, price_cents, is_active, created_at, updated_at)
VALUES (
    '880e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440000',
    '660e8400-e29b-41d4-a716-446655440000',
    'Barba',
    'Fazer a barba',
    20,
    2500,
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO services (id, tenant_id, barbershop_id, name, description, duration_min, price_cents, is_active, created_at, updated_at)
VALUES (
    '880e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440000',
    '660e8400-e29b-41d4-a716-446655440000',
    'Sobrancelha',
    'Ajuste de sobrancelha',
    15,
    1500,
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO services (id, tenant_id, barbershop_id, name, description, duration_min, price_cents, is_active, created_at, updated_at)
VALUES (
    '880e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440000',
    '660e8400-e29b-41d4-a716-446655440000',
    'Corte + Barba',
    'Corte masculino com barba',
    45,
    5500,
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Inserir clientes
INSERT INTO clients (id, tenant_id, name, phone, email, notes, created_at, updated_at)
VALUES (
    '990e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440000',
    'Carlos Oliveira',
    '(11) 99999-4444',
    'carlos@email.com',
    'Cliente preferencial',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO clients (id, tenant_id, name, phone, email, notes, created_at, updated_at)
VALUES (
    '990e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440000',
    'Roberto Lima',
    '(11) 99999-5555',
    'roberto@email.com',
    'Gosta de cortes modernos',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO clients (id, tenant_id, name, phone, email, notes, created_at, updated_at)
VALUES (
    '990e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440000',
    'Fernando Silva',
    '(11) 99999-6666',
    'fernando@email.com',
    'Cliente novo',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Inserir alguns agendamentos de exemplo
INSERT INTO appointments (id, tenant_id, barbershop_id, employee_id, client_id, service_id, start_at, end_at, status, notes, created_at, updated_at)
VALUES (
    'aa0e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440000',
    '660e8400-e29b-41d4-a716-446655440000',
    '770e8400-e29b-41d4-a716-446655440001',
    '990e8400-e29b-41d4-a716-446655440000',
    '880e8400-e29b-41d4-a716-446655440000',
    NOW() + INTERVAL '1 day' + INTERVAL '9 hours',
    NOW() + INTERVAL '1 day' + INTERVAL '9 hours' + INTERVAL '30 minutes',
    'CONFIRMED',
    'Cliente preferencial',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO appointments (id, tenant_id, barbershop_id, employee_id, client_id, service_id, start_at, end_at, status, notes, created_at, updated_at)
VALUES (
    'aa0e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440000',
    '660e8400-e29b-41d4-a716-446655440000',
    '770e8400-e29b-41d4-a716-446655440001',
    '990e8400-e29b-41d4-a716-446655440001',
    '880e8400-e29b-41d4-a716-446655440003',
    NOW() + INTERVAL '1 day' + INTERVAL '10 hours',
    NOW() + INTERVAL '1 day' + INTERVAL '10 hours' + INTERVAL '45 minutes',
    'PENDING',
    'Primeira vez',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO appointments (id, tenant_id, barbershop_id, employee_id, client_id, service_id, start_at, end_at, status, notes, created_at, updated_at)
VALUES (
    'aa0e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440000',
    '660e8400-e29b-41d4-a716-446655440000',
    '770e8400-e29b-41d4-a716-446655440000',
    '990e8400-e29b-41d4-a716-446655440002',
    '880e8400-e29b-41d4-a716-446655440001',
    NOW() + INTERVAL '2 days' + INTERVAL '14 hours',
    NOW() + INTERVAL '2 days' + INTERVAL '14 hours' + INTERVAL '20 minutes',
    'PENDING',
    'Apenas barba',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Comentários para documentação
COMMENT ON TABLE tenants IS 'Tabela de tenants para isolamento multi-tenant';
COMMENT ON TABLE barbershops IS 'Barbearias associadas a um tenant';
COMMENT ON TABLE employees IS 'Funcionários das barbearias';
COMMENT ON TABLE services IS 'Serviços oferecidos pelas barbearias';
COMMENT ON TABLE clients IS 'Clientes dos tenants';
COMMENT ON TABLE appointments IS 'Agendamentos de clientes';

-- Log de inicialização
INSERT INTO tenants (id, name, plan, status, domain, settings, is_active, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    'Sistema',
    'STARTER',
    'ACTIVE',
    'system.localhost',
    '{"type": "system"}',
    false,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Criar tabela de logs de auditoria
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(256) PRIMARY KEY,
    tenant_id VARCHAR(256) NOT NULL,
    actor_id VARCHAR(256) NOT NULL,
    action VARCHAR(256) NOT NULL,
    entity VARCHAR(256) NOT NULL,
    entity_id VARCHAR(256) NOT NULL,
    ts TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    actor_type VARCHAR(50),
    actor_name VARCHAR(256),
    actor_email VARCHAR(256),
    ip_address VARCHAR(45),
    user_agent VARCHAR(512),
    session_id VARCHAR(256),
    request_id VARCHAR(256),
    changes JSONB,
    metadata JSONB,
    severity VARCHAR(50),
    status VARCHAR(50),
    error_message TEXT,
    stack_trace TEXT
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS audit_tenant_id_idx ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS audit_actor_id_idx ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS audit_entity_idx ON audit_logs(entity);
CREATE INDEX IF NOT EXISTS audit_entity_id_idx ON audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS audit_ts_idx ON audit_logs(ts);
CREATE INDEX IF NOT EXISTS audit_action_idx ON audit_logs(action);
CREATE INDEX IF NOT EXISTS audit_severity_idx ON audit_logs(severity);

-- Inserir alguns logs de exemplo para teste
INSERT INTO audit_logs (id, tenant_id, actor_id, action, entity, entity_id, actor_type, actor_name, severity, status) VALUES
(
    'audit_example_001',
    '550e8400-e29b-41d4-a716-446655440000',
    'system',
    'CREATE',
    'tenant',
    '550e8400-e29b-41d4-a716-446655440000',
    'system',
    'Sistema',
    'MEDIUM',
    'SUCCESS'
),
(
    'audit_example_002',
    '550e8400-e29b-41d4-a716-446655440000',
    'system',
    'CREATE',
    'barbershop',
    '660e8400-e29b-41d4-a716-446655440000',
    'system',
    'Sistema',
    'MEDIUM',
    'SUCCESS'
),
(
    'audit_example_003',
    '550e8400-e29b-41d4-a716-446655440000',
    'system',
    'CREATE',
    'employee',
    '770e8400-e29b-41d4-a716-446655440000',
    'system',
    'Sistema',
    'MEDIUM',
    'SUCCESS'
) ON CONFLICT (id) DO NOTHING;
