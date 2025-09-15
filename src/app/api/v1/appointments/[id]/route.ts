export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { api } from '@/app/api/(helpers)/handler';
import { validate } from '@/lib/validate';
import { validateHeaders, validateParams } from '@/lib/validation/middleware';
import { idParam, appointmentUpdate } from '@/lib/validation/schemas';

export const { GET, PUT, DELETE } = api({
  GET: async (req: NextRequest, context?: { params: any }) => {
    const { params } = context || { params: {} };
    // Validate headers
    const headerError = validateHeaders(req);
    if (headerError) return headerError;

    // Validate params
    const paramResult = validateParams(idParam)(req, params);
    if (paramResult instanceof NextResponse) return paramResult;

    // TODO: Implement actual appointment retrieval with Prisma
    // This is a placeholder response
    return NextResponse.json({
      id: params.id,
      clientId: '123e4567-e89b-12d3-a456-426614174000',
      employeeId: '123e4567-e89b-12d3-a456-426614174000',
      serviceId: '123e4567-e89b-12d3-a456-426614174000',
      barbershopId: '123e4567-e89b-12d3-a456-426614174000',
      scheduledAt: new Date().toISOString(),
      notes: 'Appointment notes',
      createdAt: new Date().toISOString()
    }, { status: 200 });
  },

  PUT: async (req: NextRequest, context?: { params: any }) => {
    const { params } = context || { params: {} };
    // Validate headers
    const headerError = validateHeaders(req);
    if (headerError) return headerError;

    // Validate params
    const paramResult = validateParams(idParam)(req, params);
    if (paramResult instanceof NextResponse) return paramResult;

    // Validate body
    const data = await validate(req, appointmentUpdate);

    // TODO: Implement actual appointment update with Prisma
    // This is a placeholder response
    return NextResponse.json({
      id: params.id,
      ...data,
      updatedAt: new Date().toISOString()
    }, { status: 200 });
  },

  DELETE: async (req: NextRequest, context?: { params: any }) => {
    const { params } = context || { params: {} };
    // Validate headers
    const headerError = validateHeaders(req);
    if (headerError) return headerError;

    // Validate params
    const paramResult = validateParams(idParam)(req, params);
    if (paramResult instanceof NextResponse) return paramResult;

    // TODO: Implement actual appointment deletion with Prisma
    // This is a placeholder response
    return NextResponse.json({
      id: params.id,
      deleted: true,
      deletedAt: new Date().toISOString()
    }, { status: 200 });
  }
});