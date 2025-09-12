export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        databaseUrl: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
        nodeEnv: process.env.NODE_ENV,
        prismaClientEngineType: process.env.PRISMA_CLIENT_ENGINE_TYPE,
        prismaCliQueryEngineType: process.env.PRISMA_CLI_QUERY_ENGINE_TYPE
    });
}
