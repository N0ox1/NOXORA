import { BillingConfig, BillingPlan, BillingAddon, TenantUsage, BillingEnforcementResult, BillingCheckoutRequest, BillingCheckoutResponse } from '@/types/billing';
import { TenantService } from '@/lib/tenant';
import { randomBytes } from 'crypto';

// Carregar configuração de billing
import billingConfigData from '../../../config/billing.json';
const billingConfig = billingConfigData as BillingConfig;

export class BillingService {
  private config: BillingConfig;

  constructor() {
    this.config = billingConfig;
  }

  /**
   * Obtém todos os planos disponíveis
   */
  getPlans(): BillingPlan[] {
    return this.config.plans;
  }

  /**
   * Obtém todos os addons disponíveis
   */
  getAddons(): BillingAddon[] {
    return this.config.addons;
  }

  /**
   * Obtém plano por código
   */
  getPlanByCode(code: string): BillingPlan | undefined {
    return this.config.plans.find(plan => plan.code === code);
  }

  /**
   * Obtém addon por código
   */
  getAddonByCode(code: string): BillingAddon | undefined {
    return this.config.addons.find(addon => addon.code === code);
  }

  /**
   * Verifica se uma feature está disponível para um plano
   */
  isFeatureEnabled(planCode: string, feature: string): boolean {
    const featureFlags = this.config.feature_flags[feature];
    if (!featureFlags) return false;
    
    return featureFlags[planCode] || false;
  }

  /**
   * Obtém todas as features disponíveis para um plano
   */
  getPlanFeatures(planCode: string): Record<string, boolean> {
    const features: Record<string, boolean> = {};
    
    for (const [feature, planFlags] of Object.entries(this.config.feature_flags)) {
      features[feature] = planFlags[planCode] || false;
    }
    
    return features;
  }

  /**
   * Calcula preço total mensal para um plano + addons
   */
  calculateMonthlyPrice(planCode: string, addonCodes: string[] = []): number {
    const plan = this.getPlanByCode(planCode);
    if (!plan) return 0;

    let total = plan.price_month;

    for (const addonCode of addonCodes) {
      const addon = this.getAddonByCode(addonCode);
      if (addon) {
        total += addon.price_month;
      }
    }

    return total;
  }

  /**
   * Calcula preço total anual para um plano + addons
   */
  calculateYearlyPrice(planCode: string, addonCodes: string[] = []): number {
    const plan = this.getPlanByCode(planCode);
    if (!plan) return 0;

    let total = plan.price_year;

    for (const addonCode of addonCodes) {
      const addon = this.getAddonByCode(addonCode);
      if (addon) {
        total += addon.price_month * 12; // Addons são sempre mensais
      }
    }

    return total;
  }

  /**
   * Obtém uso atual de um tenant (mock - em produção viria do banco)
   */
  async getCurrentUsage(tenantId: string): Promise<TenantUsage> {
    // TODO: Implementar busca real no banco de dados
    // Por enquanto, retorna mock baseado no tenant
    const tenant = await TenantService.getTenantById(tenantId);
    
    if (!tenant) {
      throw new Error(`Tenant não encontrado: ${tenantId}`);
    }

    // Mock de uso baseado no plano atual
    const plan = this.getPlanByCode(tenant.plan);
    if (!plan) {
      throw new Error(`Plano não encontrado: ${tenant.plan}`);
    }

    // Simular uso baseado no plano (em produção seria real)
    const usageMultiplier = tenant.plan === 'STARTER' ? 0.3 : tenant.plan === 'PRO' ? 0.6 : 0.8;
    
    return {
      shops: Math.floor(plan.limits.shops * usageMultiplier),
      employees: Math.floor(plan.limits.employees * usageMultiplier),
      clients: Math.floor(plan.limits.clients * usageMultiplier),
      appointments_month: Math.floor(plan.limits.appointments_month * usageMultiplier),
      notifications_month: Math.floor(plan.limits.notifications_month * usageMultiplier),
      storage_gb: Math.floor(plan.limits.storage_gb * usageMultiplier),
      api_calls_month: Math.floor(plan.limits.api_calls_month * usageMultiplier),
    };
  }

  /**
   * Enforce limits para um tenant específico
   * Esta é a função principal que verifica se o tenant pode executar uma ação
   */
  async enforceLimits(tenantId: string, action?: string): Promise<BillingEnforcementResult> {
    try {
      // Obter tenant e seu plano atual
      const tenant = await TenantService.getTenantById(tenantId);
      if (!tenant) {
        throw new Error(`Tenant não encontrado: ${tenantId}`);
      }

      const plan = this.getPlanByCode(tenant.plan);
      if (!plan) {
        throw new Error(`Plano não encontrado: ${tenant.plan}`);
      }

      // Obter uso atual
      const currentUsage = await this.getCurrentUsage(tenantId);
      
      // Verificar limites excedidos
      const exceededLimits: string[] = [];
      
      if (currentUsage.shops >= plan.limits.shops) {
        exceededLimits.push('shops');
      }
      
      if (currentUsage.employees >= plan.limits.employees) {
        exceededLimits.push('employees');
      }
      
      if (currentUsage.clients >= plan.limits.clients) {
        exceededLimits.push('clients');
      }
      
      if (currentUsage.appointments_month >= plan.limits.appointments_month) {
        exceededLimits.push('appointments_month');
      }
      
      if (currentUsage.notifications_month >= plan.limits.notifications_month) {
        exceededLimits.push('notifications_month');
      }
      
      if (currentUsage.storage_gb >= plan.limits.storage_gb) {
        exceededLimits.push('storage_gb');
      }
      
      if (currentUsage.api_calls_month >= plan.limits.api_calls_month) {
        exceededLimits.push('api_calls_month');
      }

      // Verificar se algum limite foi excedido
      const allowed = exceededLimits.length === 0;

      // Gerar recomendação de upgrade se necessário
      let upgradeRecommendation;
      if (!allowed) {
        upgradeRecommendation = this.generateUpgradeRecommendation(tenant.plan, currentUsage);
      }

      return {
        allowed,
        exceeded_limits: exceededLimits,
        current_usage: currentUsage,
        plan_limits: plan.limits,
        plan_code: tenant.plan,
        upgrade_recommended: upgradeRecommendation,
      };

    } catch (error) {
      console.error('Erro ao enforce limits:', error);
      
      // Em caso de erro, permitir a ação (fail-open)
      return {
        allowed: true,
        exceeded_limits: [],
        current_usage: {
          shops: 0,
          employees: 0,
          clients: 0,
          appointments_month: 0,
          notifications_month: 0,
          storage_gb: 0,
          api_calls_month: 0,
        },
        plan_limits: this.config.plans[0].limits,
        plan_code: 'STARTER',
      };
    }
  }

  /**
   * Gera recomendação de upgrade baseada no uso atual
   */
  private generateUpgradeRecommendation(currentPlanCode: string, currentUsage: TenantUsage): {
    recommended: boolean;
    recommended_plan?: string;
    reason?: string;
  } {
    const currentPlan = this.getPlanByCode(currentPlanCode);
    if (!currentPlan) {
      return { recommended: false };
    }

    // Encontrar o próximo plano disponível
    const planOrder = ['STARTER', 'PRO', 'SCALE'];
    const currentIndex = planOrder.indexOf(currentPlanCode);
    
    if (currentIndex === -1 || currentIndex === planOrder.length - 1) {
      return { recommended: false }; // Já está no plano mais alto
    }

    const nextPlanCode = planOrder[currentIndex + 1];
    const nextPlan = this.getPlanByCode(nextPlanCode);
    
    if (!nextPlan) {
      return { recommended: false };
    }

    // Verificar se o próximo plano resolve os problemas atuais
    const wouldSolveLimits = 
      currentUsage.shops >= currentPlan.limits.shops ||
      currentUsage.employees >= currentPlan.limits.employees ||
      currentUsage.clients >= currentPlan.limits.clients ||
      currentUsage.appointments_month >= currentPlan.limits.appointments_month ||
      currentUsage.notifications_month >= currentPlan.limits.notifications_month ||
      currentUsage.storage_gb >= currentPlan.limits.storage_gb ||
      currentUsage.api_calls_month >= currentPlan.limits.api_calls_month;

    if (wouldSolveLimits) {
      return {
        recommended: true,
        recommended_plan: nextPlanCode,
        reason: `Seu uso atual excede os limites do plano ${currentPlanCode}. O plano ${nextPlanCode} oferece mais recursos.`,
      };
    }

    return { recommended: false };
  }

  /**
   * Cria sessão de checkout (mock Stripe)
   */
  async createCheckoutSession(request: BillingCheckoutRequest): Promise<BillingCheckoutResponse> {
    try {
      // Validar dados da requisição
      if (!request.tenant_id || !request.plan_code || !request.customer_email) {
        throw new Error('Dados obrigatórios não fornecidos');
      }

      const plan = this.getPlanByCode(request.plan_code);
      if (!plan) {
        throw new Error(`Plano inválido: ${request.plan_code}`);
      }

      // Validar addons
      const validAddons: BillingAddon[] = [];
      if (request.addons) {
        for (const addonCode of request.addons) {
          const addon = this.getAddonByCode(addonCode);
          if (addon) {
            validAddons.push(addon);
          }
        }
      }

      // Calcular preço total
      const amountTotal = request.billing_cycle === 'monthly' 
        ? this.calculateMonthlyPrice(request.plan_code, request.addons)
        : this.calculateYearlyPrice(request.plan_code, request.addons);

      // Gerar IDs mock usando crypto seguro
      const randomSuffix = randomBytes(6).toString('hex');
      const sessionId = `cs_${Date.now()}_${randomSuffix}`;
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos

      // Em produção, aqui seria criada uma sessão real no Stripe
      const checkoutUrl = `/billing/checkout/success?session_id=${sessionId}`;

      return {
        success: true,
        checkout_url: checkoutUrl,
        session_id: sessionId,
        amount_total: amountTotal,
        currency: plan.currency,
        expires_at: expiresAt.toISOString(),
      };

    } catch (error) {
      console.error('Erro ao criar sessão de checkout:', error);
      throw error;
    }
  }

  /**
   * Processa webhook do Stripe (mock)
   */
  async processWebhook(event: any): Promise<{ success: boolean; message: string }> {
    try {
      const eventType = event.type;
      const eventData = event.data.object;

      console.log(`📨 Processando webhook: ${eventType}`);

      switch (eventType) {
        case 'checkout.session.completed':
          return await this.handleCheckoutCompleted(eventData);
        
        case 'customer.subscription.created':
          return await this.handleSubscriptionCreated(eventData);
        
        case 'customer.subscription.updated':
          return await this.handleSubscriptionUpdated(eventData);
        
        case 'customer.subscription.deleted':
          return await this.handleSubscriptionDeleted(eventData);
        
        case 'invoice.payment_succeeded':
          return await this.handlePaymentSucceeded(eventData);
        
        case 'invoice.payment_failed':
          return await this.handlePaymentFailed(eventData);
        
        default:
          console.log(`⚠️ Webhook não processado: ${eventType}`);
          return { success: true, message: 'Webhook não processado' };
      }

    } catch (error) {
      console.error('Erro ao processar webhook:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      return { success: false, message: `Erro: ${errorMessage}` };
    }
  }

  /**
   * Handlers para diferentes tipos de webhook
   */
  private async handleCheckoutCompleted(session: any): Promise<{ success: boolean; message: string }> {
    const tenantId = session.metadata?.tenant_id;
    const planCode = session.metadata?.plan_code;
    
    if (tenantId && planCode) {
      // Atualizar tenant com novo plano
      // TODO: Implementar atualização real no banco
      console.log(`✅ Checkout completado para tenant ${tenantId}, plano ${planCode}`);
      return { success: true, message: 'Checkout processado com sucesso' };
    }
    
    return { success: false, message: 'Dados de tenant não encontrados' };
  }

  private async handleSubscriptionCreated(subscription: any): Promise<{ success: boolean; message: string }> {
    console.log(`✅ Nova assinatura criada: ${subscription.id}`);
    return { success: true, message: 'Assinatura criada' };
  }

  private async handleSubscriptionUpdated(subscription: any): Promise<{ success: boolean; message: string }> {
    console.log(`🔄 Assinatura atualizada: ${subscription.id}`);
    return { success: true, message: 'Assinatura atualizada' };
  }

  private async handleSubscriptionDeleted(subscription: any): Promise<{ success: boolean; message: string }> {
    console.log(`❌ Assinatura cancelada: ${subscription.id}`);
    return { success: true, message: 'Assinatura cancelada' };
  }

  private async handlePaymentSucceeded(invoice: any): Promise<{ success: boolean; message: string }> {
    console.log(`💰 Pagamento realizado: ${invoice.id}`);
    return { success: true, message: 'Pagamento processado' };
  }

  private async handlePaymentFailed(invoice: any): Promise<{ success: boolean; message: string }> {
    console.log(`💸 Pagamento falhou: ${invoice.id}`);
    return { success: true, message: 'Falha no pagamento registrada' };
  }

  /**
   * Obtém métricas de billing
   */
  async getBillingMetrics(): Promise<any> {
    // TODO: Implementar métricas reais do banco
    return {
      total_revenue: 0,
      monthly_recurring_revenue: 0,
      active_subscriptions: 0,
      churn_rate: 0,
      average_revenue_per_user: 0,
      plan_distribution: {},
      top_plans: [],
    };
  }
}

// Instância singleton do serviço de billing
export const billingService = new BillingService();


