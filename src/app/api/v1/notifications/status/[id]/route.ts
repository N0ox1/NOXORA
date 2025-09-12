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

    const record = await prisma.outbox.findUnique({
      where: { id: notificationId },
      select: {
        id: true,
        status: true,
        attempts: true,
        maxAttempts: true,
        error: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!record) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: record.id,
      status: record.status,
      attempts: record.attempts,
      maxAttempts: record.maxAttempts,
      error: record.error,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
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


