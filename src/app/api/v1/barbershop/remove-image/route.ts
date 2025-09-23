import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function DELETE(request: NextRequest) {
    try {
        const tenantId = request.headers.get('x-tenant-id');

        if (!tenantId) {
            return NextResponse.json({ error: 'Tenant ID é obrigatório' }, { status: 400 });
        }

        const body = await request.json();
        const { type } = body;

        if (!type || !['logo', 'banner'].includes(type)) {
            return NextResponse.json({ error: 'Tipo de imagem inválido' }, { status: 400 });
        }

        // Buscar arquivo existente no diretório
        const uploadDir = join(process.cwd(), 'public', 'uploads', tenantId);

        if (!existsSync(uploadDir)) {
            return NextResponse.json({
                success: true,
                message: 'Nenhuma imagem encontrada'
            });
        }

        // Listar arquivos do diretório para encontrar o arquivo do tipo especificado
        const fs = require('fs');
        const files = fs.readdirSync(uploadDir);
        const targetFile = files.find((file: string) => file.startsWith(`${type}-`));

        if (targetFile) {
            const filePath = join(uploadDir, targetFile);
            if (existsSync(filePath)) {
                await unlink(filePath);
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Imagem removida com sucesso'
        });

    } catch (error) {
        console.error('Erro ao remover imagem:', error);
        return NextResponse.json({
            error: 'Erro interno do servidor'
        }, { status: 500 });
    }
}
