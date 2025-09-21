import { NextResponse } from 'next/server';

export const dynamic = 'force-static';
export const revalidate = 0;

const doc = {
    openapi: '3.1.0',
    info: { title: 'Noxora API', version: '1.0.0' },
    servers: [{ url: '/api' }],
    paths: {
        '/v1/services': {
            get: {
                summary: 'Listar serviços',
                parameters: [
                    { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1 }, example: 1 },
                    { name: 'pageSize', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100 }, example: 20 }
                ],
                responses: {
                    '200': {
                        description: 'OK',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        page: { type: 'integer' },
                                        pageSize: { type: 'integer' },
                                        total: { type: 'integer' },
                                        items: {
                                            type: 'array',
                                            items: {
                                                type: 'object',
                                                properties: {
                                                    id: { type: 'string' },
                                                    name: { type: 'string' },
                                                    durationMin: { type: 'integer' },
                                                    priceCents: { type: 'integer' },
                                                    isActive: { type: 'boolean' }
                                                },
                                                required: ['id', 'name']
                                            }
                                        }
                                    },
                                    required: ['page', 'pageSize', 'total', 'items']
                                },
                                examples: {
                                    exemplo: {
                                        value: { page: 1, pageSize: 2, total: 10, items: [{ id: 'svc_1', name: 'Corte', durationMin: 30, priceCents: 5000, isActive: true }] }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            post: {
                summary: 'Criar serviço (idempotente)',
                parameters: [{ name: 'Idempotency-Key', in: 'header', required: true, schema: { type: 'string' } }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    name: { type: 'string' },
                                    durationMin: { type: 'integer' },
                                    priceCents: { type: 'integer' }
                                },
                                required: ['name', 'durationMin', 'priceCents']
                            },
                            examples: { exemplo: { value: { name: 'Corte', durationMin: 30, priceCents: 5000 } } }
                        }
                    }
                },
                responses: {
                    '201': { description: 'Criado', content: { 'application/json': { examples: { exemplo: { value: { ok: true, id: 'svc_new' } } } } } },
                    '409': { description: 'Idempotency conflict', content: { 'application/json': { examples: { exemplo: { value: { code: 'idempotency_conflict', message: 'Same key different payload' } } } } } },
                    '400': { description: 'Bad request', content: { 'application/json': { examples: { exemplo: { value: { code: 'bad_request', message: '...' } } } } } }
                }
            }
        }
    },
    components: {}
};

export function GET() {
    return NextResponse.json(doc, {
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'content-type, authorization, x-tenant-id'
        }
    });
}













