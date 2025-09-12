import { cacheService } from '../../src/lib/cache/redis.js';

async function testCache() {
    console.log('🧪 Testing cache directly...');

    try {
        // Testar set
        console.log('📝 Setting cache...');
        await cacheService.set('/test', { message: 'Hello World' }, { id: '123' });
        console.log('✅ Cache set');

        // Testar get
        console.log('📖 Getting cache...');
        const result = await cacheService.get('/test', { id: '123' });
        console.log('📖 Cache result:', result);

        if (result) {
            console.log('✅ Cache working!');
        } else {
            console.log('❌ Cache not working');
        }

        // Testar stats
        console.log('📊 Cache stats:');
        const stats = await cacheService.getStats();
        console.log(stats);

    } catch (error) {
        console.error('❌ Cache test failed:', error);
    }
}

testCache();
