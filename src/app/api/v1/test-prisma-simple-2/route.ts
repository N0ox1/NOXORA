import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        console.log('=== TEST PRISMA SIMPLE 2 ===');
        
        // Teste 1: Listar barbershops
        console.log('1. Listando barbershops...');
        const barbershops = await prisma.barbershop.findMany({
            select: { id: true, name: true, tenantId: true },
            take: 5
        });
        console.log('Barbershops:', barbershops);
        
        // Teste 2: Buscar barbershop específico
        console.log('2. Buscando barbershop específico...');
        const shop = await prisma.barbershop.findUnique({ 
            where: { id: 'cmffwm0ks0002uaoot2x03802' }, 
            select: { tenantId: true } 
        });
        console.log('Shop encontrado:', shop);
        
        return NextResponse.json({ 
            ok: true,
            barbershops,
            shop
        });
    } catch (err: any) {
        console.error('ERRO PRISMA SIMPLE 2:', err);
        
        return NextResponse.json({ 
            error: err.message,
            code: err.code,
            meta: err.meta,
            stack: err.stack
        }, { status: 500 });
    }
}
