import { employeeUpdate } from '../src/lib/validation/schemas';

// Test the schema directly
const testData = { name: 'Updated Employee Name' };

console.log('Testing employeeUpdate schema...');
console.log('Input:', testData);

try {
    const result = employeeUpdate.parse(testData);
    console.log('✅ Validation passed:', result);
} catch (error) {
    console.log('❌ Validation failed:', error);
}

