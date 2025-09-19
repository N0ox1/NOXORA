#!/usr/bin/env node

const fetch = require('node-fetch');

const API_BASE = process.env.API_BASE || 'http://localhost:3000/api';
const TENANT_ID = process.env.TENANT_ID || 'cmf75rzl50000ua781bk91jmq';

console.log('🔒 Running API Security Tests...\n');

async function makeRequest(url, options = {}) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Tenant-Id': TENANT_ID,
                ...options.headers
            },
            body: typeof options.body === 'string' ? options.body : JSON.stringify(options.body),
            ...options
        });

        const body = await response.text();
        return {
            status: response.status,
            ok: response.ok,
            body: body
        };
    } catch (error) {
        return {
            status: 0,
            ok: false,
            error: error.message
        };
    }
}

async function testEmployeesValidation() {
    console.log('🧪 Testing Employees API Validation...');

    // Test 1: Valid payload
    const validResult = await makeRequest(`${API_BASE}/v1/employees`, {
        body: {
            name: 'Valid Employee',
            role: 'BARBER',
            barbershopId: '123e4567-e89b-12d3-a456-426614174000'
        }
    });

    if (validResult.status === 201) {
        console.log('✅ Valid payload accepted');
    } else {
        console.log('❌ Valid payload rejected:', validResult.status);
    }

    // Test 2: XSS payload
    const xssResult = await makeRequest(`${API_BASE}/v1/employees`, {
        body: {
            name: '<img onerror=alert(1)>',
            role: 'BARBER',
            barbershopId: '123e4567-e89b-12d3-a456-426614174000'
        }
    });

    if (xssResult.status === 422) {
        console.log('✅ XSS payload rejected');
    } else {
        console.log('❌ XSS payload accepted:', xssResult.status);
    }

    // Test 3: SQL injection
    const sqlResult = await makeRequest(`${API_BASE}/v1/employees`, {
        body: {
            name: "'; DROP TABLE users; --",
            role: 'BARBER',
            barbershopId: '123e4567-e89b-12d3-a456-426614174000'
        }
    });

    if (sqlResult.status === 422) {
        console.log('✅ SQL injection rejected');
    } else {
        console.log('❌ SQL injection accepted:', sqlResult.status);
    }

    // Test 4: Invalid content type
    const contentTypeResult = await makeRequest(`${API_BASE}/v1/employees`, {
        headers: { 'Content-Type': 'text/plain' },
        body: 'invalid'
    });

    if (contentTypeResult.status === 415) {
        console.log('✅ Invalid content type rejected');
    } else {
        console.log('❌ Invalid content type accepted:', contentTypeResult.status);
    }

    // Test 5: Missing tenant header
    const tenantResult = await fetch(`${API_BASE}/v1/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Valid Employee',
            role: 'BARBER',
            barbershopId: '123e4567-e89b-12d3-a456-426614174000'
        })
    });

    if (tenantResult.status === 400) {
        console.log('✅ Missing tenant header rejected');
    } else {
        console.log('❌ Missing tenant header accepted:', tenantResult.status);
    }

    console.log('');
}

async function testReportingValidation() {
    console.log('🧪 Testing Reporting API Validation...');

    // Test 1: Invalid date format
    const invalidDateResult = await fetch(`${API_BASE}/v1/reporting/summary?day=2025-13-40`, {
        headers: { 'X-Tenant-Id': TENANT_ID }
    });

    if (invalidDateResult.status === 422) {
        console.log('✅ Invalid date format rejected');
    } else {
        console.log('❌ Invalid date format accepted:', invalidDateResult.status);
    }

    // Test 2: Valid date format
    const validDateResult = await fetch(`${API_BASE}/v1/reporting/summary?day=2025-09-10`, {
        headers: { 'X-Tenant-Id': TENANT_ID }
    });

    if (validDateResult.status === 200) {
        console.log('✅ Valid date format accepted');
    } else {
        console.log('❌ Valid date format rejected:', validDateResult.status);
    }

    console.log('');
}

async function testAvailabilityValidation() {
    console.log('🧪 Testing Availability API Validation...');

    // Test 1: Valid availability query
    const validResult = await fetch(`${API_BASE}/v1/availability?date=2025-09-10&employeeId=123e4567-e89b-12d3-a456-426614174000&serviceId=123e4567-e89b-12d3-a456-426614174000`, {
        headers: { 'X-Tenant-Id': TENANT_ID }
    });

    if (validResult.status === 200) {
        console.log('✅ Valid availability query accepted');
    } else {
        console.log('❌ Valid availability query rejected:', validResult.status);
    }

    // Test 2: Invalid UUID
    const invalidUuidResult = await fetch(`${API_BASE}/v1/availability?date=2025-09-10&employeeId=invalid-uuid`, {
        headers: { 'X-Tenant-Id': TENANT_ID }
    });

    if (invalidUuidResult.status === 422) {
        console.log('✅ Invalid UUID rejected');
    } else {
        console.log('❌ Invalid UUID accepted:', invalidUuidResult.status);
    }

    console.log('');
}

async function runAllTests() {
    try {
        await testEmployeesValidation();
        await testReportingValidation();
        await testAvailabilityValidation();

        console.log('🎉 All API security tests completed!');
    } catch (error) {
        console.error('❌ Test execution failed:', error.message);
        process.exit(1);
    }
}

runAllTests();









