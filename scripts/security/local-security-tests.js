#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔒 Running Local Security Tests...\n');

// Test 1: npm audit
console.log('1️⃣ Running npm audit...');
try {
    execSync('npm audit --audit-level=high --json > npm-audit-results.json', { stdio: 'inherit' });
    console.log('✅ npm audit completed successfully\n');
} catch (error) {
    console.log('❌ npm audit found vulnerabilities\n');
    process.exit(1);
}

// Test 2: Semgrep
console.log('2️⃣ Running Semgrep SAST...');
try {
    execSync('npx semgrep scan --config p/ci --config p/security-audit --config p/owasp-top-ten --json --output=semgrep-results.json', { stdio: 'inherit' });
    console.log('✅ Semgrep scan completed successfully\n');
} catch (error) {
    console.log('❌ Semgrep found security issues\n');
    process.exit(1);
}

// Test 3: Trivy filesystem scan
console.log('3️⃣ Running Trivy filesystem scan...');
try {
    execSync('npx @aquasecurity/trivy fs . --severity HIGH,CRITICAL --format json --output trivy-results.json', { stdio: 'inherit' });
    console.log('✅ Trivy scan completed successfully\n');
} catch (error) {
    console.log('❌ Trivy found vulnerabilities\n');
    process.exit(1);
}

// Test 4: ZAP baseline (requires running application)
console.log('4️⃣ Running ZAP baseline scan...');
console.log('⚠️  Make sure the application is running on http://localhost:3000');
try {
    execSync('docker run --rm -t -v $(pwd):/zap/wrk/:rw -u zap owasp/zap2docker-stable zap-baseline.py -t http://127.0.0.1:3000 -r zap-results.html', { stdio: 'inherit' });
    console.log('✅ ZAP baseline scan completed successfully\n');
} catch (error) {
    console.log('❌ ZAP scan found issues\n');
    process.exit(1);
}

console.log('🎉 All security tests passed!');

















