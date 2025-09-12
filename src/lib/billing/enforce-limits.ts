import { NextRequest, NextResponse } from 'next/server';
import { billingService } from './billing-service';
import { getTenantFromRequest } from '@/lib/tenant';

/**
 * Middleware para enforce limits em operações críticas
 * Retorna 409 LIMIT_EXCEEDED quando os limites são excedidos
 */
export async function enforceBillingLimits(
  request: NextRequest,
  action?: string
): Promise<NextResponse | null> {
  try {
    // Obter tenant da requisição
    const tenant = getTenantFromRequest(request);
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant não identificado' },
        { status: 400 }
      );
    }

    // Verificar se o tenant está ativo
    if (!tenant.isActive || tenant.status === 'CANCELED') {
      return NextResponse.json(
        { 
          error: 'Tenant inativo',
          message: 'Sua conta está inativa ou foi cancelada. Entre em contato com o suporte.',
          tenant_status: tenant.status,
        },
        { status: 403 }
      );
    }

    // Verificar se está em período de graça
    if (tenant.status === 'PAST_DUE') {
      const config = await import('../../../config/billing.json');
      const gracePeriodDays = config.grace_period_days || 7;
      
      // TODO: Implementar verificação real de período de graça
      // Por enquanto, permite operações em período de graça
      console.log(`⚠️ Tenant ${tenant.id} em período de graça (${gracePeriodDays} dias)`);
    }

    // Enforce limits
    const enforcementResult = await billingService.enforceLimits(tenant.id, action);
    
    if (!enforcementResult.allowed) {
      console.log(`🚫 Limites excedidos para tenant ${tenant.id}:`, {
        exceeded_limits: enforcementResult.exceeded_limits,
        current_usage: enforcementResult.current_usage,
        plan_limits: enforcementResult.plan_limits,
        plan_code: enforcementResult.plan_code,
      });

      return NextResponse.json(
        {
          error: 'LIMIT_EXCEEDED',
          message: 'Você excedeu os limites do seu plano atual',
          details: {
            exceeded_limits: enforcementResult.exceeded_limits,
            current_usage: enforcementResult.current_usage,
            plan_limits: enforcementResult.plan_limits,
            plan_code: enforcementResult.plan_code,
          },
          upgrade_recommended: enforcementResult.upgrade_recommended,
          action_required: 'upgrade_plan',
          help_url: '/billing/upgrade',
        },
        { status: 409 }
      );
    }

    // Limites respeitados, permitir operação
    return null;

  } catch (error) {
    console.error('Erro ao enforce billing limits:', error);
    
    // Em caso de erro, permitir a operação (fail-open)
    console.warn('⚠️ Fail-open: permitindo operação devido a erro no enforce limits');
    return null;
  }
}

/**
 * Middleware específico para criação de barbershops
 */
export async function enforceBarbershopLimits(request: NextRequest): Promise<NextResponse | null> {
  return enforceBillingLimits(request, 'create_barbershop');
}

/**
 * Middleware específico para criação de funcionários
 */
export async function enforceEmployeeLimits(request: NextRequest): Promise<NextResponse | null> {
  return enforceBillingLimits(request, 'create_employee');
}

/**
 * Middleware específico para criação de clientes
 */
export async function enforceClientLimits(request: NextRequest): Promise<NextResponse | null> {
  return enforceBillingLimits(request, 'create_client');
}

/**
 * Middleware específico para criação de agendamentos
 */
export async function enforceAppointmentLimits(request: NextRequest): Promise<NextResponse | null> {
  return enforceBillingLimits(request, 'create_appointment');
}

/**
 * Middleware específico para envio de notificações
 */
export async function enforceNotificationLimits(request: NextRequest): Promise<NextResponse | null> {
  return enforceBillingLimits(request, 'send_notification');
}

/**
 * Middleware específico para uso de storage
 */
export async function enforceStorageLimits(request: NextRequest): Promise<NextResponse | null> {
  return enforceBillingLimits(request, 'use_storage');
}

/**
 * Middleware específico para chamadas de API
 */
export async function enforceAPILimits(request: NextRequest): Promise<NextResponse | null> {
  return enforceBillingLimits(request, 'api_call');
}

/**
 * Verifica se uma feature específica está habilitada para o tenant
 */
export async function enforceFeatureFlag(
  request: NextRequest,
  feature: string
): Promise<NextResponse | null> {
  try {
    const tenant = getTenantFromRequest(request);
    if (!tenant) {
      return NextResponse.json(
        { error: 'Tenant não identificado' },
        { status: 400 }
      );
    }

    const isFeatureEnabled = billingService.isFeatureEnabled(tenant.plan, feature);
    
    if (!isFeatureEnabled) {
      return NextResponse.json(
        {
          error: 'FEATURE_NOT_AVAILABLE',
          message: `A funcionalidade '${feature}' não está disponível no seu plano atual`,
          details: {
            feature,
            current_plan: tenant.plan,
            available_features: billingService.getPlanFeatures(tenant.plan),
          },
          action_required: 'upgrade_plan',
          help_url: '/billing/upgrade',
        },
        { status: 403 }
      );
    }

    return null;

  } catch (error) {
    console.error('Erro ao verificar feature flag:', error);
    return null;
  }
}

/**
 * Verifica múltiplas features de uma vez
 */
export async function enforceMultipleFeatures(
  request: NextRequest,
  features: string[]
): Promise<NextResponse | null> {
  for (const feature of features) {
    const result = await enforceFeatureFlag(request, feature);
    if (result) {
      return result;
    }
  }
  return null;
}

/**
 * Middleware para verificar se o tenant pode usar multi-location
 */
export async function enforceMultiLocationFeature(request: NextRequest): Promise<NextResponse | null> {
  return enforceFeatureFlag(request, 'multi_location');
}

/**
 * Middleware para verificar se o tenant pode usar relatórios avançados
 */
export async function enforceAdvancedReportingFeature(request: NextRequest): Promise<NextResponse | null> {
  return enforceFeatureFlag(request, 'advanced_reporting');
}

/**
 * Middleware para verificar se o tenant pode usar notificações SMS
 */
export async function enforceSMSNotificationsFeature(request: NextRequest): Promise<NextResponse | null> {
  return enforceFeatureFlag(request, 'sms_notifications');
}

/**
 * Middleware para verificar se o tenant pode usar custom branding
 */
export async function enforceCustomBrandingFeature(request: NextRequest): Promise<NextResponse | null> {
  return enforceFeatureFlag(request, 'custom_branding');
}

/**
 * Middleware para verificar se o tenant pode usar webhooks
 */
export async function enforceWebhooksFeature(request: NextRequest): Promise<NextResponse | null> {
  return enforceFeatureFlag(request, 'webhooks');
}

/**
 * Middleware para verificar se o tenant pode usar API access
 */
export async function enforceAPIAccessFeature(request: NextRequest): Promise<NextResponse | null> {
  return enforceFeatureFlag(request, 'api_access');
}
