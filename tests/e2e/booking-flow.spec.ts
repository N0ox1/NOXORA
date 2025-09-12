import { test, expect } from '@playwright/test';

test.describe('Fluxo de Booking', () => {
  const TENANT_ID = 'tnt_1';
  const BARBERSHOP_SLUG = 'barber-labs-centro';

  test.beforeEach(async ({ page }) => {
    // Configurar tenant ID para todos os testes
    await page.setExtraHTTPHeaders({
      'X-Tenant-Id': TENANT_ID,
    });
  });

  test('deve permitir agendamento completo de appointment', async ({ page }) => {
    // 1. Acessar página pública da barbearia
    await page.goto(`/b/${BARBERSHOP_SLUG}`);
    
    // Aguardar carregamento da página
    await page.waitForLoadState('networkidle');
    
    // Verificar se a página carregou corretamente
    await expect(page.locator('h1')).toContainText('Barber Labs Centro');
    
    // 2. Selecionar serviço
    const serviceCard = page.locator('[data-testid="service-card"]').first();
    await expect(serviceCard).toBeVisible();
    await serviceCard.click();
    
    // Verificar se o serviço foi selecionado
    await expect(page.locator('[data-testid="selected-service"]')).toBeVisible();
    
    // 3. Selecionar funcionário
    const employeeCard = page.locator('[data-testid="employee-card"]').first();
    await expect(employeeCard).toBeVisible();
    await employeeCard.click();
    
    // Verificar se o funcionário foi selecionado
    await expect(page.locator('[data-testid="selected-employee"]')).toBeVisible();
    
    // 4. Selecionar data (amanhã)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const dateInput = page.locator('[data-testid="date-input"]');
    await dateInput.fill(tomorrowStr);
    
    // 5. Selecionar horário disponível
    const timeSlot = page.locator('[data-testid="time-slot"]').first();
    await expect(timeSlot).toBeVisible();
    await timeSlot.click();
    
    // Verificar se o horário foi selecionado
    await expect(page.locator('[data-testid="selected-time"]')).toBeVisible();
    
    // 6. Preencher dados do cliente
    const clientNameInput = page.locator('[data-testid="client-name"]');
    const clientPhoneInput = page.locator('[data-testid="client-phone"]');
    
    await clientNameInput.fill('João Silva');
    await clientPhoneInput.fill('+55 11 90000-0000');
    
    // 7. Confirmar agendamento
    const confirmButton = page.locator('[data-testid="confirm-booking"]');
    await expect(confirmButton).toBeEnabled();
    await confirmButton.click();
    
    // 8. Verificar confirmação
    await expect(page.locator('[data-testid="booking-success"]')).toBeVisible();
    await expect(page.locator('text=Agendamento confirmado')).toBeVisible();
    
    // 9. Verificar detalhes do appointment
    const appointmentDetails = page.locator('[data-testid="appointment-details"]');
    await expect(appointmentDetails).toBeVisible();
    await expect(appointmentDetails).toContainText('João Silva');
    await expect(appointmentDetails).toContainText('Corte Masculino');
  });

  test('deve validar campos obrigatórios', async ({ page }) => {
    await page.goto(`/b/${BARBERSHOP_SLUG}`);
    await page.waitForLoadState('networkidle');
    
    // Tentar confirmar sem preencher campos
    const confirmButton = page.locator('[data-testid="confirm-booking"]');
    await confirmButton.click();
    
    // Verificar mensagens de erro
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('text=Selecione um serviço')).toBeVisible();
  });

  test('deve mostrar horários disponíveis', async ({ page }) => {
    await page.goto(`/b/${BARBERSHOP_SLUG}`);
    await page.waitForLoadState('networkidle');
    
    // Selecionar serviço e funcionário
    await page.locator('[data-testid="service-card"]').first().click();
    await page.locator('[data-testid="employee-card"]').first().click();
    
    // Selecionar data
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    await page.locator('[data-testid="date-input"]').fill(tomorrowStr);
    
    // Verificar se horários aparecem
    const timeSlots = page.locator('[data-testid="time-slot"]');
    await expect(timeSlots).toHaveCount(8); // 8 horários disponíveis (9h às 17h)
    
    // Verificar se horários estão habilitados
    for (let i = 0; i < await timeSlots.count(); i++) {
      await expect(timeSlots.nth(i)).toBeEnabled();
    }
  });

  test('deve bloquear horários já ocupados', async ({ page }) => {
    await page.goto(`/b/${BARBERSHOP_SLUG}`);
    await page.waitForLoadState('networkidle');
    
    // Selecionar serviço e funcionário
    await page.locator('[data-testid="service-card"]').first().click();
    await page.locator('[data-testid="employee-card"]').first().click();
    
    // Selecionar data
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    await page.locator('[data-testid="date-input"]').fill(tomorrowStr);
    
    // Verificar se horários ocupados estão desabilitados
    const disabledTimeSlots = page.locator('[data-testid="time-slot"][disabled]');
    await expect(disabledTimeSlots).toBeVisible();
    
    // Tentar clicar em horário ocupado
    await disabledTimeSlots.first().click();
    
    // Verificar que não foi selecionado
    await expect(page.locator('[data-testid="selected-time"]')).not.toBeVisible();
  });

  test('deve mostrar informações da barbearia', async ({ page }) => {
    await page.goto(`/b/${BARBERSHOP_SLUG}`);
    await page.waitForLoadState('networkidle');
    
    // Verificar informações básicas
    await expect(page.locator('h1')).toContainText('Barber Labs Centro');
    await expect(page.locator('[data-testid="barbershop-description"]')).toBeVisible();
    
    // Verificar serviços disponíveis
    const services = page.locator('[data-testid="service-card"]');
    await expect(services).toHaveCount(1); // 1 serviço no seed
    
    // Verificar funcionários
    const employees = page.locator('[data-testid="employee-card"]');
    await expect(employees).toHaveCount(1); // 1 funcionário no seed
    
    // Verificar preços
    const servicePrice = page.locator('[data-testid="service-price"]').first();
    await expect(servicePrice).toContainText('R$ 45,00');
  });

  test('deve funcionar em dispositivos móveis', async ({ page }) => {
    // Configurar viewport móvel
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto(`/b/${BARBERSHOP_SLUG}`);
    await page.waitForLoadState('networkidle');
    
    // Verificar se elementos estão visíveis em mobile
    await expect(page.locator('[data-testid="service-card"]')).toBeVisible();
    await expect(page.locator('[data-testid="employee-card"]')).toBeVisible();
    
    // Verificar se formulário é responsivo
    const form = page.locator('[data-testid="booking-form"]');
    await expect(form).toBeVisible();
    
    // Verificar se botões são clicáveis em mobile
    const confirmButton = page.locator('[data-testid="confirm-booking"]');
    await expect(confirmButton).toBeVisible();
    await expect(confirmButton).toBeEnabled();
  });

  test('deve persistir dados durante navegação', async ({ page }) => {
    await page.goto(`/b/${BARBERSHOP_SLUG}`);
    await page.waitForLoadState('networkidle');
    
    // Selecionar serviço
    await page.locator('[data-testid="service-card"]').first().click();
    
    // Navegar para outra página e voltar
    await page.goto('/');
    await page.goto(`/b/${BARBERSHOP_SLUG}`);
    
    // Verificar se serviço ainda está selecionado
    await expect(page.locator('[data-testid="selected-service"]')).toBeVisible();
  });

  test('deve mostrar loading states', async ({ page }) => {
    // Interceptar requisições para simular delay
    await page.route('**/api/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.continue();
    });
    
    await page.goto(`/b/${BARBERSHOP_SLUG}`);
    
    // Verificar loading inicial
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
    
    // Aguardar carregamento
    await page.waitForLoadState('networkidle');
    
    // Verificar que loading desapareceu
    await expect(page.locator('[data-testid="loading-spinner"]')).not.toBeVisible();
  });

  test('deve lidar com erros de API', async ({ page }) => {
    // Interceptar API para simular erro
    await page.route('**/api/barbershop/public/**', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });
    
    await page.goto(`/b/${BARBERSHOP_SLUG}`);
    
    // Verificar mensagem de erro
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('text=Erro ao carregar dados')).toBeVisible();
    
    // Verificar botão de retry
    const retryButton = page.locator('[data-testid="retry-button"]');
    await expect(retryButton).toBeVisible();
  });
});
