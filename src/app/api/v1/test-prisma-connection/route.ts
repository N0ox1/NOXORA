import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET() {
    const count = await prisma.barbershop.count();
    return NextResponse.json({ ok: true, barbershops: count });
}
