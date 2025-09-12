import { NextRequest, NextResponse } from 'next/server';

export type ApiHandler = (req: NextRequest) => Promise<NextResponse> | NextResponse;

export class ApiMiddleware {
  static withApi(handler: ApiHandler): ApiHandler {
    return async (req: NextRequest) => {
      try {
        const res = await handler(req);
        return res instanceof NextResponse ? res : NextResponse.json(res);
      } catch (err: any) {
        const status = err?.status || 500;
        const message = err?.message || 'Internal error';
        return NextResponse.json({ error: message }, { status });
      }
    };
  }
}
