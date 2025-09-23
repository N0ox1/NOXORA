import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
    try {
        const tenantId = request.headers.get('x-tenant-id');

        if (!tenantId) {
            return NextResponse.json({ error: 'Tenant ID é obrigatório' }, { status: 400 });
        }

        const formData = await request.formData();
        const file = formData.get('image') as File;
        const type = formData.get('type') as string;

        if (!file) {
            return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
        }

        if (!type || !['logo', 'banner'].includes(type)) {
            return NextResponse.json({ error: 'Tipo de imagem inválido' }, { status: 400 });
        }

        // Validar tipo de arquivo
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Tipo de arquivo não permitido' }, { status: 400 });
        }

        // Validar tamanho do arquivo
        const maxSize = type === 'logo' ? 2 * 1024 * 1024 : 5 * 1024 * 1024; // 2MB para logo, 5MB para banner
        if (file.size > maxSize) {
            return NextResponse.json({
                error: `Arquivo muito grande. Máximo: ${type === 'logo' ? '2MB' : '5MB'}`
            }, { status: 400 });
        }

        // Criar diretório se não existir
        const uploadDir = join(process.cwd(), 'public', 'uploads', tenantId);
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        // Gerar nome único para o arquivo
        const timestamp = Date.now();
        const fileExtension = file.name.split('.').pop();
        const fileName = `${type}-${timestamp}.${fileExtension}`;
        const filePath = join(uploadDir, fileName);

        // Salvar arquivo
        const bytes = await file.arrayBuffer();
        await writeFile(filePath, Buffer.from(bytes));

        // Retornar URL pública
        const publicUrl = `/uploads/${tenantId}/${fileName}`;

        return NextResponse.json({
            success: true,
            url: publicUrl,
            fileName
        });

    } catch (error) {
        console.error('Erro no upload da imagem:', error);
        return NextResponse.json({
            error: 'Erro interno do servidor'
        }, { status: 500 });
    }
}
