import { NextRequest, NextResponse } from 'next/server';
import { apiMiddleware, ApiMiddleware } from '@/lib/api/api-middleware';
import { reportingService } from '@/lib/reporting';
import { z } from 'zod';

// Schema de validação para parâmetros de query
const querySchema = z.object({
  tenant_id: z.string().min(1, 'ID do tenant é obrigatório'),
  barbershop_id: z.string().optional(),
  employee_id: z.string().optional(),
  service_id: z.string().optional(),
  status_in: z.string().optional(), // JSON string de array
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

async function handler(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const metricId = request.nextUrl.pathname.split('/').pop();

    if (!metricId) {
      return NextResponse.json(
        { error: 'ID da métrica é obrigatório' },
        { status: 400 }
      );
    }

    // Valida parâmetros da query
    const queryParams = Object.fromEntries(searchParams.entries());
    const validation = querySchema.safeParse(queryParams);

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Parâmetros inválidos',
          details: validation.error.errors 
        },
        { status: 400 }
      );
    }

    const { tenant_id, ...filters } = validation.data;

    // Converte filtros opcionais
    const processedFilters: any = {};
    
    if (filters.barbershop_id) {
      processedFilters.barbershop_id = filters.barbershop_id;
    }
    
    if (filters.employee_id) {
      processedFilters.employee_id = filters.employee_id;
    }
    
    if (filters.service_id) {
      processedFilters.service_id = filters.service_id;
    }
    
    if (filters.status_in) {
      try {
        processedFilters.status_in = JSON.parse(filters.status_in);
      } catch (error) {
        return NextResponse.json(
          { error: 'status_in deve ser um JSON válido' },
          { status: 400 }
        );
      }
    }
    
    if (filters.start_date) {
      processedFilters.start_date = filters.start_date;
    }
    
    if (filters.end_date) {
      processedFilters.end_date = filters.end_date;
    }

    // Calcula a métrica
    const metric = await reportingService.calculateMetric(
      metricId,
      tenant_id,
      processedFilters
    );

    return NextResponse.json({
      success: true,
      data: metric,
    });

  } catch (error) {
    console.error('Error calculating metric:', error);
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

export const GET = ApiMiddleware.withApi(handler);
