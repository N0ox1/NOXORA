import { NextRequest, NextResponse } from 'next/server';
import { stripe, stripeConfig } from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const { customerId, returnUrl } = await req.json();
    const tenantId = req.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json(
        { code: 'missing_tenant', message: 'X-Tenant-Id required' },
        { status: 400 }
      );
    }

    if (!customerId) {
      return NextResponse.json(
        { code: 'missing_customer', message: 'customerId is required' },
        { status: 400 }
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || stripeConfig.billingPortal.returnUrl,
    });

    return NextResponse.json({
      url: session.url,
    });

  } catch (error) {
    console.error('Error creating billing portal session:', error);
    
    return NextResponse.json(
      { 
        code: 'portal_error',
        message: 'Failed to create billing portal session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}





