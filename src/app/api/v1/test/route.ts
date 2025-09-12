import { NextRequest, NextResponse } from 'next/server';

const err = (code: string, message: string, status = 400, details?: any) => {
  const body: any = { code, message, requestId: crypto.randomUUID() };
  if (details) body.details = details;
  return NextResponse.json(body, { status });
};

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  if (sp.get('fail') === '1' || sp.get('boom') === '1') {
    return err('bad_request', 'Invalid test param', 400, { hint: 'use ?fail=0' });
  }
  return NextResponse.json({ ok: true });
}

export async function POST() {
  return err('method_not_allowed', 'Use GET', 405);
}


