-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set audit HMAC secret (should be set via environment variable)
-- ALTER DATABASE neondb SET app.audit_hmac = 'your-secret-key-here';

-- Function to block UPDATE/DELETE on audit_log
CREATE OR REPLACE FUNCTION audit_log_block_ud() 
RETURNS trigger AS $$
BEGIN 
  RAISE EXCEPTION 'audit_log is append-only';
END;
$$ LANGUAGE plpgsql;

-- Trigger to prevent UPDATE/DELETE on audit_log
CREATE TRIGGER audit_log_no_update 
BEFORE UPDATE OR DELETE ON audit_log 
FOR EACH ROW EXECUTE FUNCTION audit_log_block_ud();

-- Function to audit employees table
CREATE OR REPLACE FUNCTION t_employees_audit() 
RETURNS trigger AS $$
DECLARE 
  payload jsonb;
  prev text;
  secret text := current_setting('app.audit_hmac', true);
  new_hash text;
BEGIN 
  -- Build payload based on operation
  IF TG_OP = 'INSERT' THEN 
    payload := jsonb_build_object(
      'name', NEW.name,
      'role', NEW.role,
      'email', NEW.email,
      'barbershopId', NEW.barbershop_id
    );
  ELSIF TG_OP = 'UPDATE' THEN 
    payload := jsonb_build_object(
      'name', NEW.name,
      'role', NEW.role,
      'email', NEW.email,
      'barbershopId', NEW.barbershop_id
    );
  ELSE -- DELETE
    payload := jsonb_build_object(
      'name', OLD.name,
      'role', OLD.role,
      'email', OLD.email,
      'barbershopId', OLD.barbershop_id
    );
  END IF;

  -- Get previous hash for this entity
  SELECT hash INTO prev 
  FROM audit_log 
  WHERE tenant_id = COALESCE(NEW.tenant_id, OLD.tenant_id) 
    AND entity = 'employee' 
    AND entity_id = COALESCE(NEW.id, OLD.id) 
  ORDER BY created_at DESC 
  LIMIT 1;

  -- Calculate new hash
  new_hash := encode(
    hmac(
      (COALESCE(prev, '') || payload::text)::bytea, 
      secret::bytea, 
      'sha256'
    ), 
    'hex'
  );

  -- Insert audit log entry
  INSERT INTO audit_log (
    id, tenant_id, actor_id, action, entity, entity_id, 
    before, after, ip, user_agent, prev_hash, hash
  ) VALUES (
    gen_random_uuid()::text,
    COALESCE(NEW.tenant_id, OLD.tenant_id),
    COALESCE(current_setting('app.actor', true), 'system'),
    TG_OP,
    'employee',
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END,
    current_setting('app.ip', true),
    current_setting('app.ua', true),
    COALESCE(prev, ''),
    new_hash
  );

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for employees table
CREATE TRIGGER employees_audit_aiud 
AFTER INSERT OR UPDATE OR DELETE ON employees 
FOR EACH ROW EXECUTE FUNCTION t_employees_audit();

-- Function to audit services table
CREATE OR REPLACE FUNCTION t_services_audit() 
RETURNS trigger AS $$
DECLARE 
  payload jsonb;
  prev text;
  secret text := current_setting('app.audit_hmac', true);
  new_hash text;
BEGIN 
  -- Build payload based on operation
  IF TG_OP = 'INSERT' THEN 
    payload := jsonb_build_object(
      'name', NEW.name,
      'description', NEW.description,
      'durationMin', NEW.duration_min,
      'priceCents', NEW.price_cents,
      'barbershopId', NEW.barbershop_id
    );
  ELSIF TG_OP = 'UPDATE' THEN 
    payload := jsonb_build_object(
      'name', NEW.name,
      'description', NEW.description,
      'durationMin', NEW.duration_min,
      'priceCents', NEW.price_cents,
      'barbershopId', NEW.barbershop_id
    );
  ELSE -- DELETE
    payload := jsonb_build_object(
      'name', OLD.name,
      'description', OLD.description,
      'durationMin', OLD.duration_min,
      'priceCents', OLD.price_cents,
      'barbershopId', OLD.barbershop_id
    );
  END IF;

  -- Get previous hash for this entity
  SELECT hash INTO prev 
  FROM audit_log 
  WHERE tenant_id = COALESCE(NEW.tenant_id, OLD.tenant_id) 
    AND entity = 'service' 
    AND entity_id = COALESCE(NEW.id, OLD.id) 
  ORDER BY created_at DESC 
  LIMIT 1;

  -- Calculate new hash
  new_hash := encode(
    hmac(
      (COALESCE(prev, '') || payload::text)::bytea, 
      secret::bytea, 
      'sha256'
    ), 
    'hex'
  );

  -- Insert audit log entry
  INSERT INTO audit_log (
    id, tenant_id, actor_id, action, entity, entity_id, 
    before, after, ip, user_agent, prev_hash, hash
  ) VALUES (
    gen_random_uuid()::text,
    COALESCE(NEW.tenant_id, OLD.tenant_id),
    COALESCE(current_setting('app.actor', true), 'system'),
    TG_OP,
    'service',
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END,
    current_setting('app.ip', true),
    current_setting('app.ua', true),
    COALESCE(prev, ''),
    new_hash
  );

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for services table
CREATE TRIGGER services_audit_aiud 
AFTER INSERT OR UPDATE OR DELETE ON services 
FOR EACH ROW EXECUTE FUNCTION t_services_audit();

-- Function to audit appointments table
CREATE OR REPLACE FUNCTION t_appointments_audit() 
RETURNS trigger AS $$
DECLARE 
  payload jsonb;
  prev text;
  secret text := current_setting('app.audit_hmac', true);
  new_hash text;
BEGIN 
  -- Build payload based on operation
  IF TG_OP = 'INSERT' THEN 
    payload := jsonb_build_object(
      'clientId', NEW.client_id,
      'employeeId', NEW.employee_id,
      'serviceId', NEW.service_id,
      'barbershopId', NEW.barbershop_id,
      'startAt', NEW.start_at,
      'endAt', NEW.end_at,
      'status', NEW.status
    );
  ELSIF TG_OP = 'UPDATE' THEN 
    payload := jsonb_build_object(
      'clientId', NEW.client_id,
      'employeeId', NEW.employee_id,
      'serviceId', NEW.service_id,
      'barbershopId', NEW.barbershop_id,
      'startAt', NEW.start_at,
      'endAt', NEW.end_at,
      'status', NEW.status
    );
  ELSE -- DELETE
    payload := jsonb_build_object(
      'clientId', OLD.client_id,
      'employeeId', OLD.employee_id,
      'serviceId', OLD.service_id,
      'barbershopId', OLD.barbershop_id,
      'startAt', OLD.start_at,
      'endAt', OLD.end_at,
      'status', OLD.status
    );
  END IF;

  -- Get previous hash for this entity
  SELECT hash INTO prev 
  FROM audit_log 
  WHERE tenant_id = COALESCE(NEW.tenant_id, OLD.tenant_id) 
    AND entity = 'appointment' 
    AND entity_id = COALESCE(NEW.id, OLD.id) 
  ORDER BY created_at DESC 
  LIMIT 1;

  -- Calculate new hash
  new_hash := encode(
    hmac(
      (COALESCE(prev, '') || payload::text)::bytea, 
      secret::bytea, 
      'sha256'
    ), 
    'hex'
  );

  -- Insert audit log entry
  INSERT INTO audit_log (
    id, tenant_id, actor_id, action, entity, entity_id, 
    before, after, ip, user_agent, prev_hash, hash
  ) VALUES (
    gen_random_uuid()::text,
    COALESCE(NEW.tenant_id, OLD.tenant_id),
    COALESCE(current_setting('app.actor', true), 'system'),
    TG_OP,
    'appointment',
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END,
    current_setting('app.ip', true),
    current_setting('app.ua', true),
    COALESCE(prev, ''),
    new_hash
  );

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for appointments table
CREATE TRIGGER appointments_audit_aiud 
AFTER INSERT OR UPDATE OR DELETE ON appointments 
FOR EACH ROW EXECUTE FUNCTION t_appointments_audit();









