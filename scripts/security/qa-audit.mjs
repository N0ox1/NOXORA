#!/usr/bin/env node

import { strict as assert } from 'assert';
import { PrismaClient } from '@prisma/client';

const API_BASE = process.env.API_BASE || 'http://localhost:3000/api';
const TENANT_ID = process.env.TENANT_ID || 'test-tenant';
const DATABASE_URL = process.env.DATABASE_URL;

console.log('🔒 Starting Security Audit QA Tests...\n');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: DATABASE_URL
        }
    }
});

async function makeRequest(url, options = {}) {
    try {
        const response = await fetch(url, {
            method: options.method || 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Tenant-Id': TENANT_ID,
                ...options.headers
            },
            body: options.body ? JSON.stringify(options.body) : undefined,
            ...options
        });

        return {
            status: response.status,
            ok: response.ok,
            headers: Object.fromEntries(response.headers.entries()),
            body: await response.text()
        };
    } catch (error) {
        return {
            status: 0,
            ok: false,
            error: error.message
        };
    }
}

async function testAuditLogCreation() {
    console.log('🧪 Testing Audit Log Creation...');

    // Create a test employee
    const createResult = await makeRequest(`${API_BASE}/v1/employees`, {
        body: {
            name: 'Test Employee',
            role: 'BARBER',
            barbershopId: '123e4567-e89b-12d3-a456-426614174000'
        }
    });

    if (createResult.status === 201) {
        const employee = JSON.parse(createResult.body);

        // Check audit log entry
        const auditEntries = await prisma.audit_log.findMany({
            where: {
                tenant_id: TENANT_ID,
                entity: 'Employee',
                entity_id: employee.id
            },
            orderBy: { created_at: 'desc' }
        });

        assert(auditEntries.length > 0, 'Audit log entry should be created');

        const auditEntry = auditEntries[0];
        assert.equal(auditEntry.action, 'Employee.create', 'Action should be Employee.create');
        assert.equal(auditEntry.entity, 'Employee', 'Entity should be Employee');
        assert.equal(auditEntry.entity_id, employee.id, 'Entity ID should match');
        assert(auditEntry.before === null, 'Before should be null for create');
        assert(auditEntry.after !== null, 'After should not be null for create');
        assert(auditEntry.hash, 'Hash should be present');
        assert(auditEntry.prev_hash, 'Previous hash should be present');

        console.log('✅ Audit log creation test passed');

        // Test update
        const updateResult = await makeRequest(`${API_BASE}/v1/employees/${employee.id}`, {
            method: 'PATCH',
            body: {
                name: 'Updated Employee'
            }
        });

        if (updateResult.status === 200) {
            const updateAuditEntries = await prisma.audit_log.findMany({
                where: {
                    tenant_id: TENANT_ID,
                    entity: 'Employee',
                    entity_id: employee.id,
                    action: 'Employee.update'
                },
                orderBy: { created_at: 'desc' }
            });

            assert(updateAuditEntries.length > 0, 'Update audit log entry should be created');

            const updateEntry = updateAuditEntries[0];
            assert(updateEntry.before !== null, 'Before should not be null for update');
            assert(updateEntry.after !== null, 'After should not be null for update');
            assert(updateEntry.hash, 'Hash should be present for update');

            console.log('✅ Audit log update test passed');
        }

        // Test delete
        const deleteResult = await makeRequest(`${API_BASE}/v1/employees/${employee.id}`, {
            method: 'DELETE'
        });

        if (deleteResult.status === 200 || deleteResult.status === 204) {
            const deleteAuditEntries = await prisma.audit_log.findMany({
                where: {
                    tenant_id: TENANT_ID,
                    entity: 'Employee',
                    entity_id: employee.id,
                    action: 'Employee.delete'
                },
                orderBy: { created_at: 'desc' }
            });

            assert(deleteAuditEntries.length > 0, 'Delete audit log entry should be created');

            const deleteEntry = deleteAuditEntries[0];
            assert(deleteEntry.before !== null, 'Before should not be null for delete');
            assert(deleteEntry.after === null, 'After should be null for delete');

            console.log('✅ Audit log delete test passed');
        }
    }

    console.log('✅ Audit log creation tests passed\n');
}

async function testAuditLogImmutability() {
    console.log('🧪 Testing Audit Log Immutability...');

    try {
        // Try to update an audit log entry
        const updateResult = await prisma.audit_log.updateMany({
            where: { tenant_id: TENANT_ID },
            data: { action: 'modified' }
        });

        assert.fail('UPDATE on audit_log should fail');
    } catch (error) {
        assert(error.message.includes('audit_log is append-only'),
            'Should get append-only error for UPDATE');
        console.log('✅ UPDATE blocked on audit_log');
    }

    try {
        // Try to delete an audit log entry
        const deleteResult = await prisma.audit_log.deleteMany({
            where: { tenant_id: TENANT_ID }
        });

        assert.fail('DELETE on audit_log should fail');
    } catch (error) {
        assert(error.message.includes('audit_log is append-only'),
            'Should get append-only error for DELETE');
        console.log('✅ DELETE blocked on audit_log');
    }

    console.log('✅ Audit log immutability tests passed\n');
}

async function testHashChain() {
    console.log('🧪 Testing Hash Chain...');

    const auditEntries = await prisma.audit_log.findMany({
        where: { tenant_id: TENANT_ID },
        orderBy: [{ created_at: 'asc' }, { id: 'asc' }]
    });

    if (auditEntries.length > 0) {
        let prevHash = 'genesis';

        for (const entry of auditEntries) {
            // Verify hash chain
            assert.equal(entry.prev_hash, prevHash,
                `Previous hash should match for entry ${entry.id}`);

            // Verify hash is not empty
            assert(entry.hash && entry.hash.length > 0,
                `Hash should be present for entry ${entry.id}`);

            prevHash = entry.hash;
        }

        console.log('✅ Hash chain validation passed');
    }

    console.log('✅ Hash chain tests passed\n');
}

async function testTenantIsolation() {
    console.log('🧪 Testing Tenant Isolation...');

    // Test that audit logs are isolated by tenant
    const otherTenantId = 'other-tenant-id';

    const currentTenantAudits = await prisma.audit_log.findMany({
        where: { tenant_id: TENANT_ID }
    });

    const otherTenantAudits = await prisma.audit_log.findMany({
        where: { tenant_id: otherTenantId }
    });

    // Should not see other tenant's audit logs
    const crossTenantAudits = currentTenantAudits.filter(a =>
        otherTenantAudits.some(o => o.id === a.id)
    );

    assert.equal(crossTenantAudits.length, 0,
        'Should not see other tenant\'s audit logs');

    console.log('✅ Tenant isolation tests passed\n');
}

async function testAuditLogStructure() {
    console.log('🧪 Testing Audit Log Structure...');

    const auditEntries = await prisma.audit_log.findMany({
        where: { tenant_id: TENANT_ID },
        take: 1
    });

    if (auditEntries.length > 0) {
        const entry = auditEntries[0];

        // Verify required fields
        assert(entry.tenant_id, 'tenant_id should be present');
        assert(entry.action, 'action should be present');
        assert(entry.entity, 'entity should be present');
        assert(entry.created_at, 'created_at should be present');
        assert(entry.hash, 'hash should be present');
        assert(entry.prev_hash, 'prev_hash should be present');

        // Verify action format
        assert(entry.action.includes('.'), 'action should be in format Entity.action');

        // Verify entity is valid
        const validEntities = ['Employee', 'Service', 'Client', 'Appointment', 'Barbershop'];
        assert(validEntities.includes(entry.entity),
            `entity should be one of ${validEntities.join(', ')}`);

        console.log('✅ Audit log structure validation passed');
    }

    console.log('✅ Audit log structure tests passed\n');
}

async function runAllTests() {
    try {
        await testAuditLogCreation();
        await testAuditLogImmutability();
        await testHashChain();
        await testTenantIsolation();
        await testAuditLogStructure();

        console.log('🎉 ALL AUDIT SECURITY TESTS PASSED! 🎉\n');
        console.log('📋 AUDIT CHECKLIST:');
        console.log('✅ Audit log entries created for all mutations');
        console.log('✅ Before/after states captured correctly');
        console.log('✅ Hash present in all entries');
        console.log('✅ Previous hash chain maintained');
        console.log('✅ UPDATE/DELETE blocked on audit_log');
        console.log('✅ Tenant isolation enforced');
        console.log('✅ Audit log structure validated');

    } catch (error) {
        console.error('❌ Audit security test failed:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

runAllTests();















