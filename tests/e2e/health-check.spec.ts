import { test, expect } from '@playwright/test';

test.describe('Health Check E2E', () => {
  test('deve responder ao health check', async ({ page }) => {
    // Acessar página de health check
    await page.goto('/api/health');
    
    // Verificar se retorna 200
    const response = await page.waitForResponse('**/api/health');
    expect(response.status()).toBe(200);
    
    // Verificar conteúdo da resposta
    const body = await response.json();
    expect(body).toHaveProperty('status');
    expect(body.status).toBe('ok');
  });

  test('deve carregar página inicial', async ({ page }) => {
    await page.goto('/');
    
    // Verificar se a página carrega
    await expect(page).toHaveTitle(/Noxora/);
    
    // Verificar se não há erros no console
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Aguardar carregamento
    await page.waitForLoadState('networkidle');
    
    // Verificar se não há erros críticos
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('analytics') &&
      !error.includes('ads')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('deve ter performance aceitável', async ({ page }) => {
    // Configurar métricas de performance
    const metrics: any[] = [];
    page.on('worker', (worker: any) => {
      metrics.push(worker);
    });
    
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const endTime = Date.now();
    
    const loadTime = endTime - startTime;
    
    // Verificar se o tempo de carregamento é aceitável (< 5s)
    expect(loadTime).toBeLessThan(5000);
    
    // Verificar métricas de performance
    if (metrics.length > 0) {
      const lastMetric = metrics[metrics.length - 1];
      expect(lastMetric.metrics.Documents).toBeGreaterThan(0);
      expect(lastMetric.metrics.Frames).toBeGreaterThan(0);
    }
  });

  test('deve funcionar offline', async ({ page }) => {
    // Simular modo offline
    await page.context().setOffline(true);
    
    try {
      await page.goto('/');
      
      // Verificar se há tratamento para modo offline
      const offlineMessage = page.locator('text=offline, text=sem conexão, text=no internet');
      await expect(offlineMessage).toBeVisible();
    } finally {
      // Restaurar conexão
      await page.context().setOffline(false);
    }
  });

  test('deve ter acessibilidade básica', async ({ page }) => {
    await page.goto('/');
    
    // Verificar se há título da página
    await expect(page).toHaveTitle(/Noxora/);
    
    // Verificar se há elementos de navegação
    const nav = page.locator('nav, [role="navigation"]');
    await expect(nav).toBeVisible();
    
    // Verificar se há heading principal
    const mainHeading = page.locator('h1, h2, h3');
    await expect(mainHeading).toBeVisible();
    
    // Verificar se há links funcionais
    const links = page.locator('a[href]');
    await expect(links).toHaveCount(1);
  });

  test('deve funcionar em diferentes resoluções', async ({ page }) => {
    const resolutions = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 1366, height: 768, name: 'Laptop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' },
    ];
    
    for (const resolution of resolutions) {
      await page.setViewportSize(resolution);
      await page.goto('/');
      
      // Verificar se a página carrega em cada resolução
      await expect(page).toHaveTitle(/Noxora/);
      
      // Verificar se não há overflow horizontal
      const body = page.locator('body');
      const bodyBox = await body.boundingBox();
      expect(bodyBox?.width).toBeLessThanOrEqual(resolution.width);
    }
  });

  test('deve ter meta tags corretas', async ({ page }) => {
    await page.goto('/');
    
    // Verificar meta tags importantes
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toBeVisible();
    
    const charset = page.locator('meta[charset]');
    await expect(charset).toBeVisible();
    
    const description = page.locator('meta[name="description"]');
    if (await description.count() > 0) {
      await expect(description).toBeVisible();
    }
  });

  test('deve ter console limpo em produção', async ({ page }) => {
    // Simular ambiente de produção
    await page.addInitScript(() => {
      Object.defineProperty(window, 'location', {
        value: { hostname: 'noxora.com' },
        writable: true
      });
    });
    
    await page.goto('/');
    
    // Verificar se não há logs de debug em produção
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'log' && msg.text().includes('debug')) {
        consoleLogs.push(msg.text());
      }
    });
    
    await page.waitForLoadState('networkidle');
    
    // Em produção, não deve haver logs de debug
    expect(consoleLogs).toHaveLength(0);
  });
});
