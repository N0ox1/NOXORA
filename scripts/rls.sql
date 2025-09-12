-- =====================================================
-- ROW LEVEL SECURITY (RLS) PARA NOXORA
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbershops ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS PARA TABELA TENANTS
-- =====================================================

-- Usuários só podem ver seus próprios tenants
CREATE POLICY "tenants_select_policy" ON tenants
    FOR SELECT USING (id = current_setting('app.tenant_id')::text);

-- Usuários só podem inserir tenants com seu próprio ID
CREATE POLICY "tenants_insert_policy" ON tenants
    FOR INSERT WITH CHECK (id = current_setting('app.tenant_id')::text);

-- Usuários só podem atualizar seus próprios tenants
CREATE POLICY "tenants_update_policy" ON tenants
    FOR UPDATE USING (id = current_setting('app.tenant_id')::text);

-- Usuários só podem deletar seus próprios tenants
CREATE POLICY "tenants_delete_policy" ON tenants
    FOR DELETE USING (id = current_setting('app.tenant_id')::text);

-- =====================================================
-- POLÍTICAS PARA TABELA BARBERSHOPS
-- =====================================================

-- Usuários só podem ver barbearias do seu tenant
CREATE POLICY "barbershops_select_policy" ON barbershops
    FOR SELECT USING (tenant_id = current_setting('app.tenant_id')::text);

-- Usuários só podem inserir barbearias no seu tenant
CREATE POLICY "barbershops_insert_policy" ON barbershops
    FOR INSERT WITH CHECK (tenant_id = current_setting('app.tenant_id')::text);

-- Usuários só podem atualizar barbearias do seu tenant
CREATE POLICY "barbershops_update_policy" ON barbershops
    FOR UPDATE USING (tenant_id = current_setting('app.tenant_id')::text);

-- Usuários só podem deletar barbearias do seu tenant
CREATE POLICY "barbershops_delete_policy" ON barbershops
    FOR DELETE USING (tenant_id = current_setting('app.tenant_id')::text);

-- =====================================================
-- POLÍTICAS PARA TABELA EMPLOYEES
-- =====================================================

-- Usuários só podem ver funcionários do seu tenant
CREATE POLICY "employees_select_policy" ON employees
    FOR SELECT USING (tenant_id = current_setting('app.tenant_id')::text);

-- Usuários só podem inserir funcionários no seu tenant
CREATE POLICY "employees_insert_policy" ON employees
    FOR INSERT WITH CHECK (tenant_id = current_setting('app.tenant_id')::text);

-- Usuários só podem atualizar funcionários do seu tenant
CREATE POLICY "employees_update_policy" ON employees
    FOR UPDATE USING (tenant_id = current_setting('app.tenant_id')::text);

-- Usuários só podem deletar funcionários do seu tenant
CREATE POLICY "employees_delete_policy" ON employees
    FOR DELETE USING (tenant_id = current_setting('app.tenant_id')::text);

-- =====================================================
-- POLÍTICAS PARA TABELA SERVICES
-- =====================================================

-- Usuários só podem ver serviços do seu tenant
CREATE POLICY "services_select_policy" ON services
    FOR SELECT USING (tenant_id = current_setting('app.tenant_id')::text);

-- Usuários só podem inserir serviços no seu tenant
CREATE POLICY "services_insert_policy" ON services
    FOR INSERT WITH CHECK (tenant_id = current_setting('app.tenant_id')::text);

-- Usuários só podem atualizar serviços do seu tenant
CREATE POLICY "services_update_policy" ON services
    FOR UPDATE USING (tenant_id = current_setting('app.tenant_id')::text);

-- Usuários só podem deletar serviços do seu tenant
CREATE POLICY "services_delete_policy" ON services
    FOR DELETE USING (tenant_id = current_setting('app.tenant_id')::text);

-- =====================================================
-- POLÍTICAS PARA TABELA CLIENTS
-- =====================================================

-- Usuários só podem ver clientes do seu tenant
CREATE POLICY "clients_select_policy" ON clients
    FOR SELECT USING (tenant_id = current_setting('app.tenant_id')::text);

-- Usuários só podem inserir clientes no seu tenant
CREATE POLICY "clients_insert_policy" ON clients
    FOR INSERT WITH CHECK (tenant_id = current_setting('app.tenant_id')::text);

-- Usuários só podem atualizar clientes do seu tenant
CREATE POLICY "clients_update_policy" ON clients
    FOR UPDATE USING (tenant_id = current_setting('app.tenant_id')::text);

-- Usuários só podem deletar clientes do seu tenant
CREATE POLICY "clients_delete_policy" ON clients
    FOR DELETE USING (tenant_id = current_setting('app.tenant_id')::text);

-- =====================================================
-- POLÍTICAS PARA TABELA APPOINTMENTS
-- =====================================================

-- Usuários só podem ver agendamentos do seu tenant
CREATE POLICY "appointments_select_policy" ON appointments
    FOR SELECT USING (tenant_id = current_setting('app.tenant_id')::text);

-- Usuários só podem inserir agendamentos no seu tenant
CREATE POLICY "appointments_insert_policy" ON appointments
    FOR INSERT WITH CHECK (tenant_id = current_setting('app.tenant_id')::text);

-- Usuários só podem atualizar agendamentos do seu tenant
CREATE POLICY "appointments_update_policy" ON appointments
    FOR UPDATE USING (tenant_id = current_setting('app.tenant_id')::text);

-- Usuários só podem deletar agendamentos do seu tenant
CREATE POLICY "appointments_delete_policy" ON appointments
    FOR DELETE USING (tenant_id = current_setting('app.tenant_id')::text);

-- =====================================================
-- POLÍTICAS PARA TABELA AUDIT_LOGS
-- =====================================================

-- Usuários só podem ver logs de auditoria do seu tenant
CREATE POLICY "audit_logs_select_policy" ON audit_logs
    FOR SELECT USING (tenant_id = current_setting('app.tenant_id')::text);

-- Usuários só podem inserir logs de auditoria no seu tenant
CREATE POLICY "audit_logs_insert_policy" ON audit_logs
    FOR INSERT WITH CHECK (tenant_id = current_setting('app.tenant_id')::text);

-- Usuários só podem atualizar logs de auditoria do seu tenant
CREATE POLICY "audit_logs_update_policy" ON audit_logs
    FOR UPDATE USING (tenant_id = current_setting('app.tenant_id')::text);

-- Usuários só podem deletar logs de auditoria do seu tenant
CREATE POLICY "audit_logs_delete_policy" ON audit_logs
    FOR DELETE USING (tenant_id = current_setting('app.tenant_id')::text);

-- =====================================================
-- FUNÇÃO PARA DEFINIR TENANT_ID
-- =====================================================

-- Função para definir o tenant_id atual na sessão
CREATE OR REPLACE FUNCTION set_tenant_id(tenant_id text)
RETURNS void AS $$
BEGIN
    PERFORM set_config('app.tenant_id', tenant_id, false);
END;
$$ LANGUAGE plpgsql;

-- Função para obter o tenant_id atual da sessão
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS text AS $$
BEGIN
    RETURN current_setting('app.tenant_id', true);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ÍNDICES ADICIONAIS PARA PERFORMANCE
-- =====================================================

-- Índice composto para (tenant_id, slug) em barbershops
CREATE INDEX IF NOT EXISTS idx_barbershops_tenant_slug 
ON barbershops(tenant_id, slug);

-- Índice composto para (tenant_id, barbershop_id, start_at) em appointments
CREATE INDEX IF NOT EXISTS idx_appointments_tenant_shop_start 
ON appointments(tenant_id, barbershop_id, start_at);

-- Índice para busca por data em appointments
CREATE INDEX IF NOT EXISTS idx_appointments_start_at 
ON appointments(start_at);

-- Índice para busca por status em appointments
CREATE INDEX IF NOT EXISTS idx_appointments_status 
ON appointments(status);

-- Índice para busca por cliente em appointments
CREATE INDEX IF NOT EXISTS idx_appointments_client_id 
ON appointments(client_id);

-- Índice para busca por funcionário em appointments
CREATE INDEX IF NOT EXISTS idx_appointments_employee_id 
ON appointments(employee_id);

-- =====================================================
-- VERIFICAÇÃO DAS POLÍTICAS
-- =====================================================

-- Comando para verificar se as políticas foram criadas
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
-- ORDER BY tablename, policyname;

-- Comando para verificar se RLS está habilitado
-- SELECT schemaname, tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
-- ORDER BY tablename;

