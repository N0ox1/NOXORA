-- S10 Security: Audit Log Table and Immutability Triggers
-- Creates immutable audit trail for all mutations

-- Create audit_log table
CREATE TABLE IF NOT EXISTS audit_log (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL,
  actor_id UUID,
  actor_role TEXT,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  before JSONB,
  after JSONB,
  ip INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  prev_hash TEXT,
  hash TEXT NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_tenant_time ON audit_log(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action, created_at DESC);

-- Revoke UPDATE/DELETE permissions from public
REVOKE UPDATE, DELETE ON audit_log FROM PUBLIC;

-- Function to block UPDATE/DELETE operations
CREATE OR REPLACE FUNCTION audit_log_block_ud() 
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only';
END;
$$ LANGUAGE plpgsql;

-- Create trigger to block updates/deletes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trg_audit_block_update'
  ) THEN
    CREATE TRIGGER trg_audit_block_update
      BEFORE UPDATE OR DELETE ON audit_log
      FOR EACH ROW
      EXECUTE FUNCTION audit_log_block_ud();
  END IF;
END $$;

-- Row Level Security for tenant isolation
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Policy for tenant-based access
CREATE POLICY audit_tenant_read ON audit_log 
  FOR SELECT 
  USING (tenant_id::text = current_setting('app.tenant_id', true));

-- Function to get previous hash for chain
CREATE OR REPLACE FUNCTION get_prev_hash(p_tenant_id UUID)
RETURNS TEXT AS $$
DECLARE
  prev_hash TEXT;
BEGIN
  SELECT hash INTO prev_hash
  FROM audit_log 
  WHERE tenant_id = p_tenant_id 
  ORDER BY created_at DESC, id DESC 
  LIMIT 1;
  
  RETURN COALESCE(prev_hash, 'genesis');
END;
$$ LANGUAGE plpgsql;

-- Function to calculate hash for audit entry
CREATE OR REPLACE FUNCTION calculate_audit_hash(
  p_prev_hash TEXT,
  p_tenant_id UUID,
  p_action TEXT,
  p_entity TEXT,
  p_entity_id UUID,
  p_created_at TIMESTAMPTZ,
  p_before JSONB,
  p_after JSONB,
  p_secret TEXT
)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(
    hmac(
      CONCAT(
        p_prev_hash, '|',
        p_tenant_id, '|',
        p_action, '|',
        p_entity, '|',
        COALESCE(p_entity_id::text, ''), '|',
        p_created_at, '|',
        COALESCE(jsonb_pretty(p_before), ''), '|',
        COALESCE(jsonb_pretty(p_after), '')
      ),
      p_secret,
      'sha256'
    ),
    'hex'
  );
END;
$$ LANGUAGE plpgsql;















