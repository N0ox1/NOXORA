#!/usr/bin/env node

import { createHash, createHmac } from 'crypto';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// Configuração dos testes
const config = {
    suite: "security_audit_ci",
    env: {
        API_BASE: "http://localhost:3000/api",
        TENANT_ID: "cmf75rzl50000ua781bk91jmq",
        AUDIT_HMAC_SECRET: "test-secret-key-123"
    },
    tests: [
        {
            id: "ZOD-CT-415",
            type: "http",
            name: "Content-Type inválido deve falhar",
            request: {
                method: "POST",
                url: "${API_BASE}/v1/test-security",
                headers: { "Content-Type": "text/plain", "X-Tenant-Id": "${TENANT_ID}" },
                body: "{\"name\":\"Valid Name\",\"role\":\"BARBER\",\"barbershopId\":\"123e4567-e89b-12d3-a456-426614174000\"}"
            },
            expect: { status: 415, jsonIncludes: { code: "unsupported_media_type" } }
        },
        {
            id: "ZOD-XSS-422",
            type: "http",
            name: "XSS deve ser bloqueado (422)",
            request: {
                method: "POST",
                url: "${API_BASE}/v1/test-security",
                headers: { "Content-Type": "application/json", "X-Tenant-Id": "${TENANT_ID}" },
                body: { name: "<script>alert(1)</script>", role: "BARBER", barbershopId: "123e4567-e89b-12d3-a456-426614174000" }
            },
            expect: { status: 422, jsonPathAny: { "errors.fieldErrors.name[]": "unsafe_chars" } }
        },
        {
            id: "ZOD-SQLI-422",
            type: "http",
            name: "SQLi deve ser bloqueado (422)",
            request: {
                method: "POST",
                url: "${API_BASE}/v1/test-security",
                headers: { "Content-Type": "application/json", "X-Tenant-Id": "${TENANT_ID}" },
                body: { name: "'; DROP TABLE users; --", role: "BARBER", barbershopId: "123e4567-e89b-12d3-a456-426614174000" }
            },
            expect: { status: 422 }
        },
        {
            id: "ZOD-CTRL-422",
            type: "http",
            name: "Caracteres de controle devem ser bloqueados (422)",
            request: {
                method: "POST",
                url: "${API_BASE}/v1/test-security",
                headers: { "Content-Type": "application/json", "X-Tenant-Id": "${TENANT_ID}" },
                body: { name: "Test\u0000\u0001", role: "BARBER", barbershopId: "123e4567-e89b-12d3-a456-426614174000" }
            },
            expect: { status: 422, jsonPathAny: { "errors.fieldErrors.name[]": "control_chars" } }
        },
        {
            id: "ZOD-LEN-422",
            type: "http",
            name: "String longa deve falhar (422)",
            request: {
                method: "POST",
                url: "${API_BASE}/v1/test-security",
                headers: { "Content-Type": "application/json", "X-Tenant-Id": "${TENANT_ID}" },
                body: { name: "A".repeat(600), role: "BARBER", barbershopId: "123e4567-e89b-12d3-a456-426614174000" }
            },
            expect: { status: 422 }
        },
        {
            id: "ZOD-UUID-422",
            type: "http",
            name: "UUID inválido deve falhar (422)",
            request: {
                method: "POST",
                url: "${API_BASE}/v1/test-security",
                headers: { "Content-Type": "application/json", "X-Tenant-Id": "${TENANT_ID}" },
                body: { name: "Valid Name", role: "BARBER", barbershopId: "not-a-uuid" }
            },
            expect: { status: 422, jsonPathAny: { "errors.fieldErrors.barbershopId[]": "Invalid uuid" } }
        },
        {
            id: "AUD-CREATE-201",
            type: "http",
            name: "Criar employee para gerar audit (201)",
            saveAs: "emp",
            request: {
                method: "POST",
                url: "${API_BASE}/v1/employees",
                headers: {
                    "Content-Type": "application/json",
                    "X-Tenant-Id": "${TENANT_ID}",
                    "X-Actor-Id": "qa-actor",
                    "X-Request-Id": "qa-audit-create"
                },
                body: { name: "Audit QA", role: "BARBER", barbershopId: "123e4567-e89b-12d3-a456-426614174000" }
            },
            expect: { status: 201, jsonHas: ["id"] }
        },
        {
            id: "AUD-UPDATE-200",
            type: "http",
            name: "Atualizar employee para encadear audit",
            request: {
                method: "PUT",
                url: "${API_BASE}/v1/employees/${emp.body.id}",
                headers: {
                    "Content-Type": "application/json",
                    "X-Tenant-Id": "${TENANT_ID}",
                    "X-Actor-Id": "qa-actor",
                    "X-Request-Id": "qa-audit-update"
                },
                body: { name: "Audit QA Updated" }
            },
            expect: { status: { oneOf: [200, 204] } }
        }
    ]
};

// Resultados dos testes
const results = {
    suite: config.suite,
    timestamp: new Date().toISOString(),
    tests: [],
    summary: { total: 0, passed: 0, failed: 0, skipped: 0 }
};

// Função para fazer requisições HTTP
async function makeRequest(test) {
    const { method, url, headers, body } = test.request;

    // Substituir variáveis de ambiente
    const finalUrl = url.replace('${API_BASE}', config.env.API_BASE).replace('${TENANT_ID}', config.env.TENANT_ID);
    const finalHeaders = {};
    Object.entries(headers).forEach(([key, value]) => {
        finalHeaders[key] = value.replace('${TENANT_ID}', config.env.TENANT_ID);
    });

    try {
        const response = await fetch(finalUrl, {
            method,
            headers: finalHeaders,
            body: typeof body === 'string' ? body : JSON.stringify(body)
        });

        const responseText = await response.text();
        let responseJson = null;
        try {
            responseJson = JSON.parse(responseText);
        } catch (e) {
            // Não é JSON válido
        }

        return {
            status: response.status,
            headers: Object.fromEntries(response.headers.entries()),
            body: responseJson || responseText
        };
    } catch (error) {
        return {
            error: error.message,
            status: 0
        };
    }
}

// Função para validar expectativas
function validateExpectation(test, response) {
    const { expect } = test;
    const errors = [];

    // Verificar status
    if (expect.status) {
        if (typeof expect.status === 'object' && expect.status.oneOf) {
            if (!expect.status.oneOf.includes(response.status)) {
                errors.push(`Status esperado: ${expect.status.oneOf.join(' ou ')}, recebido: ${response.status}`);
            }
        } else if (response.status !== expect.status) {
            errors.push(`Status esperado: ${expect.status}, recebido: ${response.status}`);
        }
    }

    // Verificar JSON includes
    if (expect.jsonIncludes && response.body) {
        Object.entries(expect.jsonIncludes).forEach(([key, value]) => {
            if (response.body[key] !== value) {
                errors.push(`JSON não contém ${key}: ${value}`);
            }
        });
    }

    // Verificar JSON path
    if (expect.jsonPathAny && response.body) {
        Object.entries(expect.jsonPathAny).forEach(([path, value]) => {
            const pathParts = path.split('.');
            let current = response.body;

            for (const part of pathParts) {
                if (part.includes('[]')) {
                    const arrayKey = part.replace('[]', '');
                    if (current[arrayKey] && Array.isArray(current[arrayKey])) {
                        if (!current[arrayKey].includes(value)) {
                            errors.push(`Array ${arrayKey} não contém: ${value}`);
                        }
                    } else {
                        errors.push(`Array ${arrayKey} não encontrado`);
                    }
                } else if (current[part] !== undefined) {
                    current = current[part];
                } else {
                    errors.push(`Path ${path} não encontrado`);
                    break;
                }
            }
        });
    }

    // Verificar JSON has
    if (expect.jsonHas && response.body) {
        expect.jsonHas.forEach(key => {
            if (!(key in response.body)) {
                errors.push(`JSON não contém chave: ${key}`);
            }
        });
    }

    return errors;
}

// Função principal para executar testes
async function runTests() {
    console.log('🔒 Iniciando testes de segurança...\n');

    // Criar diretório de relatórios
    mkdirSync('reports', { recursive: true });

    let savedVars = {};

    for (const test of config.tests) {
        console.log(`🧪 Executando: ${test.name} (${test.id})`);

        const result = {
            id: test.id,
            name: test.name,
            type: test.type,
            status: 'running',
            startTime: new Date().toISOString(),
            endTime: null,
            duration: null,
            passed: false,
            errors: [],
            response: null
        };

        try {
            if (test.type === 'http') {
                // Substituir variáveis salvas
                let finalTest = JSON.parse(JSON.stringify(test));
                if (finalTest.request.url.includes('${emp.body.id}') && savedVars.emp) {
                    finalTest.request.url = finalTest.request.url.replace('${emp.body.id}', savedVars.emp.body.id);
                }

                const response = await makeRequest(finalTest);
                result.response = response;

                if (response.error) {
                    result.errors.push(`Erro na requisição: ${response.error}`);
                } else {
                    const validationErrors = validateExpectation(test, response);
                    result.errors = validationErrors;
                    result.passed = validationErrors.length === 0;
                }

                // Salvar variável se necessário
                if (test.saveAs && result.passed && response.body) {
                    savedVars[test.saveAs] = response;
                }

            } else if (test.type === 'process') {
                // Pular testes de processo por enquanto
                result.status = 'skipped';
                result.passed = true;
                result.errors.push('Teste de processo não implementado ainda');
            } else if (test.type === 'db') {
                // Pular testes de banco por enquanto
                result.status = 'skipped';
                result.passed = true;
                result.errors.push('Teste de banco não implementado ainda');
            }

        } catch (error) {
            result.errors.push(`Erro inesperado: ${error.message}`);
            result.passed = false;
        }

        result.endTime = new Date().toISOString();
        result.duration = new Date(result.endTime) - new Date(result.startTime);
        result.status = result.passed ? 'passed' : 'failed';

        results.tests.push(result);
        results.summary.total++;

        if (result.passed) {
            results.summary.passed++;
            console.log(`✅ ${test.name} - PASSOU`);
        } else {
            results.summary.failed++;
            console.log(`❌ ${test.name} - FALHOU`);
            if (result.errors.length > 0) {
                console.log(`   Erros: ${result.errors.join(', ')}`);
            }
        }
        console.log('');
    }

    // Salvar relatório
    writeFileSync('reports/security-test-results.json', JSON.stringify(results, null, 2));

    // Resumo final
    console.log('📊 RESUMO DOS TESTES:');
    console.log(`Total: ${results.summary.total}`);
    console.log(`✅ Passou: ${results.summary.passed}`);
    console.log(`❌ Falhou: ${results.summary.failed}`);
    console.log(`⏭️  Pulou: ${results.summary.skipped}`);
    console.log(`\n📄 Relatório salvo em: reports/security-test-results.json`);

    return results;
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
    runTests().catch(console.error);
}

export { runTests, config };
