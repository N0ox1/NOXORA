export const runtime = 'nodejs';

import { NextRequest } from 'next/server';

// Store para manter conexões ativas por tenant
const connections = new Map<string, Set<ReadableStreamDefaultController>>();

export async function GET(req: NextRequest) {
    const tenantId = req.nextUrl.searchParams.get('tenantId');

    if (!tenantId) {
        return new Response('Tenant ID required', { status: 400 });
    }

    // Headers para Server-Sent Events
    const headers = new Headers({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
    });

    return new Response(
        new ReadableStream({
            start(controller) {
                // Adicionar conexão ao tenant
                if (!connections.has(tenantId)) {
                    connections.set(tenantId, new Set());
                }
                connections.get(tenantId)!.add(controller);

                // Enviar evento de conexão
                const connectEvent = {
                    type: 'connected',
                    message: 'Conexão estabelecida',
                    timestamp: new Date().toISOString()
                };
                controller.enqueue(`data: ${JSON.stringify(connectEvent)}\n\n`);

                // Cleanup quando conexão for fechada
                req.signal.addEventListener('abort', () => {
                    const tenantConnections = connections.get(tenantId);
                    if (tenantConnections) {
                        tenantConnections.delete(controller);
                        if (tenantConnections.size === 0) {
                            connections.delete(tenantId);
                        }
                    }
                    controller.close();
                });
            }
        }),
        { headers }
    );
}

// Função para notificar todos os clientes de um tenant
export function notifyTenant(tenantId: string, event: any) {
    const tenantConnections = connections.get(tenantId);
    if (!tenantConnections) return;

    const message = `data: ${JSON.stringify(event)}\n\n`;

    for (const controller of tenantConnections) {
        try {
            controller.enqueue(message);
        } catch (error) {
            // Remove conexões mortas
            tenantConnections.delete(controller);
        }
    }

    // Limpa conexões vazias
    if (tenantConnections.size === 0) {
        connections.delete(tenantId);
    }
}
