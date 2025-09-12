#!/usr/bin/env node

/**
 * Test script for audit integration
 * Tests audit log creation and hash chain verification
 */

import { prisma } from '../src/lib/prisma.ts';
import crypto from 'crypto';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TENANT_ID = 'test-tenant-audit-' + Date.now();
const ACTOR_ID = 'test-actor-' + Date.now();

console.log('🔍 Testing Audit Integration...\n');

// Test data
const testEmployee = {
    name: 'Audit Test Employee',
    role: 'BARBER',
    barbershopId: '123e4567-e89b-12d3-a456-426614174000'
};

// Helper function to make API calls
async function apiCall(method, endpoint, data = null, headers = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const defaultHeaders = {
        'Content-Type': 'application/json',
        'X-Tenant-Id': TENANT_ID,
        'X-Actor-Id': ACTOR_ID,
        'X-Actor-Role': 'ADMIN',
        ...headers
    };

    const options = {
        method,
        headers: defaultHeaders,
        ...(data && { body: JSON.stringify(data) })
    };

    try {
        const response = await fetch(url, options);
        const responseData = await response.json();

        return {
            status: response.status,
            data: responseData,
            success: response.ok
        };
    } catch (error) {
        console.error(`❌ API call failed: ${error.message}`);
        return { success: false, error: error.message };
    }
}

// Verify hash chain
async function verifyHashChain(tenantId) {
    console.log('🔗 Verifying hash chain...');

    const auditLogs = await prisma.auditLog.findMany({
        where: { tenant_id: tenantId },
        orderBy: [{ created_at: 'asc' }, { id: 'asc' }]
    });

    if (auditLogs.length === 0) {
        console.log('❌ No audit logs found');
        return false;
    }

    let prevHash = 'genesis';
    let isValid = true;

    for (let i = 0; i < auditLogs.length; i++) {
        const log = auditLogs[i];

        // Calculate expected hash
        const secret = process.env.AUDIT_HMAC_SECRET || 'test-secret';
        const data = [
            prevHash,
            log.tenant_id,
            log.action,
            log.entity,
            log.entity_id || '',
            log.before ? JSON.stringify(log.before, null, 2) : '',
            log.after ? JSON.stringify(log.after, null, 2) : ''
        ].join('|');

        const expectedHash = crypto.createHmac('sha256', secret).update(data).digest('hex');

        if (log.hash !== expectedHash) {
            console.log(`❌ Hash mismatch at log ${i + 1}:`);
            console.log(`   Expected: ${expectedHash}`);
            console.log(`   Actual:   ${log.hash}`);
            isValid = false;
        } else {
            console.log(`✅ Log ${i + 1} hash verified`);
        }

        prevHash = log.hash;
    }

    return isValid;
}

// Main test function
async function runTests() {
    try {
        console.log(`📋 Test Configuration:`);
        console.log(`   Base URL: ${BASE_URL}`);
        console.log(`   Tenant ID: ${TENANT_ID}`);
        console.log(`   Actor ID: ${ACTOR_ID}\n`);

        // Test 1: Create employee
        console.log('1️⃣ Testing employee creation...');
        const createResult = await apiCall('POST', '/api/v1/employees', testEmployee);

        if (!createResult.success) {
            console.log(`❌ Employee creation failed: ${createResult.error || createResult.data}`);
            return;
        }

        console.log(`✅ Employee created (${createResult.status})`);
        console.log(`   Response: ${JSON.stringify(createResult.data, null, 2)}\n`);

        // Test 2: Update employee
        console.log('2️⃣ Testing employee update...');
        const employeeId = createResult.data.id;
        const updateData = { name: 'Updated Employee Name' };

        const updateResult = await apiCall('PUT', `/api/v1/employees/${employeeId}`, updateData);

        if (!updateResult.success) {
            console.log(`❌ Employee update failed: ${updateResult.error || updateResult.data}`);
            return;
        }

        console.log(`✅ Employee updated (${updateResult.status})`);
        console.log(`   Response: ${JSON.stringify(updateResult.data, null, 2)}\n`);

        // Test 3: Delete employee
        console.log('3️⃣ Testing employee deletion...');
        const deleteResult = await apiCall('DELETE', `/api/v1/employees/${employeeId}`);

        if (!deleteResult.success) {
            console.log(`❌ Employee deletion failed: ${deleteResult.error || deleteResult.data}`);
            return;
        }

        console.log(`✅ Employee deleted (${deleteResult.status})`);
        console.log(`   Response: ${JSON.stringify(deleteResult.data, null, 2)}\n`);

        // Test 4: Verify audit logs
        console.log('4️⃣ Checking audit logs...');
        const auditLogs = await prisma.auditLog.findMany({
            where: { tenant_id: TENANT_ID },
            orderBy: [{ created_at: 'asc' }, { id: 'asc' }]
        });

        console.log(`📊 Found ${auditLogs.length} audit log entries:`);
        auditLogs.forEach((log, index) => {
            console.log(`   ${index + 1}. ${log.action} on ${log.entity} (${log.entity_id})`);
            console.log(`      Hash: ${log.hash.substring(0, 16)}...`);
            console.log(`      Time: ${log.created_at}`);
        });
        console.log('');

        // Test 5: Verify hash chain
        const isChainValid = await verifyHashChain(TENANT_ID);

        if (isChainValid) {
            console.log('✅ Hash chain verification passed!');
        } else {
            console.log('❌ Hash chain verification failed!');
        }

        // Test 6: Test rollback detection
        console.log('\n5️⃣ Testing rollback detection...');

        // Try to create a log with invalid hash (simulating tampering)
        const lastLog = auditLogs[auditLogs.length - 1];
        if (lastLog) {
            const tamperedHash = 'tampered-hash-' + Date.now();

            try {
                await prisma.auditLog.create({
                    data: {
                        tenant_id: TENANT_ID,
                        actor_id: 'tamperer',
                        action: 'tamper',
                        entity: 'test',
                        entity_id: 'tampered',
                        before: null,
                        after: { tampered: true },
                        ip: '127.0.0.1',
                        user_agent: 'tamper-test',
                        prev_hash: lastLog.hash,
                        hash: tamperedHash
                    }
                });

                console.log('⚠️  Tampered log created (this should be detected)');

                // Verify chain again - should fail
                const isChainStillValid = await verifyHashChain(TENANT_ID);
                if (!isChainStillValid) {
                    console.log('✅ Rollback detection working - chain broken after tampering');
                } else {
                    console.log('❌ Rollback detection failed - chain still valid after tampering');
                }
            } catch (error) {
                console.log(`❌ Failed to create tampered log: ${error.message}`);
            }
        }

        console.log('\n🎉 Audit integration test completed!');

    } catch (error) {
        console.error('❌ Test failed with error:', error);
    } finally {
        // Cleanup
        try {
            await prisma.auditLog.deleteMany({
                where: { tenant_id: TENANT_ID }
            });
            console.log('🧹 Cleaned up test data');
        } catch (error) {
            console.log('⚠️  Failed to cleanup test data:', error.message);
        }

        await prisma.$disconnect();
    }
}

// Run tests
runTests().catch(console.error);
