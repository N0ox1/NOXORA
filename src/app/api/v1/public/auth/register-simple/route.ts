import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    console.log('🔍 Testando endpoint de registro...');
    
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');
    
    console.log('📝 Slug recebido:', slug);
    
    const body = await req.json();
    console.log('📝 Body recebido:', { email: body.email, password: '***' });

    return NextResponse.json({
      message: 'Endpoint de registro funcionando',
      slug,
      email: body.email
    });

  } catch (error) {
    console.error('❌ Erro no endpoint de registro:', error);
    return NextResponse.json(
      { message: 'Erro no endpoint de registro', error: error.message },
      { status: 500 }
    );
  }
}


