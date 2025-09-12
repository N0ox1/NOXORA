import { redis, withLock } from '../redis';
import { cacheReadThrough } from '../../cache';

describe('Mock Redis + Lock + Cache', () => {
  beforeEach(async () => {
    // Limpar o store antes de cada teste
    const keys = await redis.keys('*');
    for (const key of keys) {
      await redis.del(key);
    }
  });

  describe('cacheReadThrough', () => {
    it('primeira chamada retorna source=db', async () => {
      let callCount = 0;
      const loader = async () => {
        callCount++;
        return { data: 'test', id: callCount };
      };

      const result = await cacheReadThrough('test-key', 60, loader);
      
      expect(result.source).toBe('db');
      expect(result.data).toEqual({ data: 'test', id: 1 });
      expect(callCount).toBe(1);
    });

    it('segunda chamada retorna source=redis', async () => {
      let callCount = 0;
      const loader = async () => {
        callCount++;
        return { data: 'test', id: callCount };
      };

      // Primeira chamada
      await cacheReadThrough('test-key', 60, loader);
      
      // Segunda chamada
      const result = await cacheReadThrough('test-key', 60, loader);
      
      expect(result.source).toBe('redis');
      expect(result.data).toEqual({ data: 'test', id: 1 });
      expect(callCount).toBe(1); // Não deve chamar o loader novamente
    });
  });

  describe('withLock', () => {
    it('segunda execução concorrente no mesmo key lança erro { code: "LOCKED" }', async () => {
      const key = 'test-lock';
      const ttlSec = 5;
      
      // Primeira execução deve funcionar
      const firstExecution = withLock(key, ttlSec, async () => {
        // Simular trabalho que leva tempo
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'first';
      });

      // Segunda execução concorrente deve falhar
      const secondExecution = withLock(key, ttlSec, async () => {
        return 'second';
      });

      // Executar ambas
      const [firstResult, secondError] = await Promise.allSettled([
        firstExecution,
        secondExecution
      ]);

      expect(firstResult.status).toBe('fulfilled');
      expect(firstResult.value).toBe('first');
      
      expect(secondError.status).toBe('rejected');
      expect(secondError.reason.code).toBe('LOCKED');
      expect(secondError.reason.message).toBe('LOCKED');
    });

    it('deve liberar o lock após a execução', async () => {
      const key = 'test-lock-release';
      const ttlSec = 5;
      
      // Primeira execução
      await withLock(key, ttlSec, async () => {
        return 'done';
      });

      // Lock deve estar liberado, segunda execução deve funcionar
      const result = await withLock(key, ttlSec, async () => {
        return 'second';
      });

      expect(result).toBe('second');
    });
  });

  describe('Redis TTL', () => {
    it('deve expirar chaves após TTL', async () => {
      await redis.set('expire-test', 'value', 0.1); // 100ms
      
      // Deve existir imediatamente
      expect(await redis.get('expire-test')).toBe('value');
      
      // Aguardar expiração
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Deve ter expirado
      expect(await redis.get('expire-test')).toBe(null);
    });
  });

  describe('Redis setnx', () => {
    it('deve retornar false se key já existir', async () => {
      await redis.set('existing-key', 'value');
      
      const result = await redis.setnx('existing-key', 'new-value');
      expect(result).toBe(false);
      
      // Valor não deve ter mudado
      expect(await redis.get('existing-key')).toBe('value');
    });

    it('deve retornar true se key não existir', async () => {
      const result = await redis.setnx('new-key', 'value');
      expect(result).toBe(true);
      
      // Valor deve ter sido definido
      expect(await redis.get('new-key')).toBe('value');
    });
  });
});
