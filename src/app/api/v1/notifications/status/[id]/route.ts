import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const notificationId = req.nextUrl.pathname.split('/').pop();

    if (!notificationId) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      );
    }

    const record = await prisma.auditLog.findUnique({
      where: { id: notificationId },
      select: {
        id: true,
        status: true,
        metadata: true,
        errorMessage: true,
        ts: true
      }
    });

    if (!record) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    const metadata = record.metadata as any || {};
    return NextResponse.json({
      id: record.id,
      status: record.status || metadata.status || 'unknown',
      attempts: metadata.attempts || 0,
      maxAttempts: metadata.maxAttempts || 5,
      error: record.errorMessage,
      createdAt: record.ts,
      updatedAt: record.ts
    });

  } catch (error) {
    console.error('Error getting notification status:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}


