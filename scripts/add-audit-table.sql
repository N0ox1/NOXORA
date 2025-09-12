-- Script para adicionar a tabela audit_logs ao banco de dados existente
-- Execute este script após criar a migração do Drizzle

-- Criar a tabela audit_logs
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

-- Adicionar comentários para documentação
COMMENT ON TABLE audit_logs IS 'Tabela para armazenar logs de auditoria do sistema';
COMMENT ON COLUMN audit_logs.id IS 'ID único do log de auditoria';
COMMENT ON COLUMN audit_logs.tenant_id IS 'ID do tenant associado ao log';
COMMENT ON COLUMN audit_logs.actor_id IS 'ID do usuário/sistema que executou a ação';
COMMENT ON COLUMN audit_logs.action IS 'Tipo de ação executada (CREATE, UPDATE, DELETE, etc.)';
COMMENT ON COLUMN audit_logs.entity IS 'Tipo de entidade afetada (user, barbershop, etc.)';
COMMENT ON COLUMN audit_logs.entity_id IS 'ID da entidade afetada';
COMMENT ON COLUMN audit_logs.ts IS 'Timestamp da ação';
COMMENT ON COLUMN audit_logs.actor_type IS 'Tipo do ator (user, system, api)';
COMMENT ON COLUMN audit_logs.actor_name IS 'Nome do ator';
COMMENT ON COLUMN audit_logs.actor_email IS 'Email do ator';
COMMENT ON COLUMN audit_logs.ip_address IS 'Endereço IP do ator';
COMMENT ON COLUMN audit_logs.user_agent IS 'User agent do navegador';
COMMENT ON COLUMN audit_logs.session_id IS 'ID da sessão';
COMMENT ON COLUMN audit_logs.request_id IS 'ID da requisição';
COMMENT ON COLUMN audit_logs.changes IS 'Mudanças realizadas na entidade';
COMMENT ON COLUMN audit_logs.metadata IS 'Metadados adicionais';
COMMENT ON COLUMN audit_logs.severity IS 'Nível de severidade da ação';
COMMENT ON COLUMN audit_logs.status IS 'Status da execução da ação';
COMMENT ON COLUMN audit_logs.error_message IS 'Mensagem de erro (se houver)';
COMMENT ON COLUMN audit_logs.stack_trace IS 'Stack trace do erro (se houver)';

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
