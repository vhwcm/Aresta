import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

describe('Canvas Endpoints', () => {
  let createdCanvasId: string;
  let defaultUserId: number = 1;

  beforeAll(async () => {
    await prisma.$connect();

    // Garantir que existe o usuário padrão ID 1
    const user = await prisma.user.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        name: 'Test User',
        email: 'test_canvas@aresta.com',
      },
    });
    defaultUserId = user.id;
  });

  afterAll(async () => {
    if (createdCanvasId) {
      await prisma.canvas.deleteMany({
        where: { id: createdCanvasId },
      });
    }
    await prisma.$disconnect();
  });

  it('POST /api/canvases deve criar um novo quadro', async () => {
    const res = await request(app)
      .post('/api/canvases')
      .send({
        title: 'Meu Mapa de Ideias',
        description: 'Quadro infinito de teste',
        data: JSON.stringify({
          nodes: [
            { id: '1', type: 'text', x: 100, y: 100, width: 200, height: 100, text: 'Nota Inicial' }
          ],
          edges: [],
          viewport: { x: 0, y: 0, zoom: 1 }
        })
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toBe('Meu Mapa de Ideias');
    expect(res.body.userId).toBe(defaultUserId);

    createdCanvasId = res.body.id;
  });

  it('GET /api/canvases deve listar os quadros do usuário com contagem de nós', async () => {
    const res = await request(app).get('/api/canvases');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const found = res.body.find((c: any) => c.id === createdCanvasId);
    expect(found).toBeDefined();
    expect(found.title).toBe('Meu Mapa de Ideias');
    expect(found.nodeCount).toBe(1);
    expect(found.edgeCount).toBe(0);
  });

  it('GET /api/canvases/:id deve retornar o quadro completo com data JSON', async () => {
    const res = await request(app).get(`/api/canvases/${createdCanvasId}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(createdCanvasId);
    expect(res.body.title).toBe('Meu Mapa de Ideias');
    const parsedData = JSON.parse(res.body.data);
    expect(parsedData.nodes).toHaveLength(1);
    expect(parsedData.nodes[0].text).toBe('Nota Inicial');
  });

  it('PUT /api/canvases/:id deve atualizar título e payload de dados (autosave)', async () => {
    const updatedData = JSON.stringify({
      nodes: [
        { id: '1', type: 'text', x: 100, y: 100, width: 200, height: 100, text: 'Nota Atualizada' },
        { id: '2', type: 'shape', shape: 'ellipse', x: 400, y: 100, width: 150, height: 80, text: 'Forma 2' }
      ],
      edges: [
        { id: 'e1', fromNode: '1', fromSide: 'right', toNode: '2', toSide: 'left' }
      ],
      viewport: { x: 50, y: 50, zoom: 1.2 }
    });

    const res = await request(app)
      .put(`/api/canvases/${createdCanvasId}`)
      .send({
        title: 'Mapa Atualizado',
        data: updatedData
      });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Mapa Atualizado');

    const checkRes = await request(app).get(`/api/canvases/${createdCanvasId}`);
    const parsed = JSON.parse(checkRes.body.data);
    expect(parsed.nodes).toHaveLength(2);
    expect(parsed.edges).toHaveLength(1);
  });

  it('POST /api/canvases/:id/duplicate deve duplicar o quadro', async () => {
    const res = await request(app).post(`/api/canvases/${createdCanvasId}/duplicate`);

    expect(res.status).toBe(201);
    expect(res.body.title).toContain('(Cópia)');
    expect(res.body.id).not.toBe(createdCanvasId);

    // Limpar o duplicado
    await prisma.canvas.delete({ where: { id: res.body.id } });
  });

  it('DELETE /api/canvases/:id deve excluir o quadro', async () => {
    const res = await request(app).delete(`/api/canvases/${createdCanvasId}`);

    expect(res.status).toBe(200);

    const checkRes = await request(app).get(`/api/canvases/${createdCanvasId}`);
    expect(checkRes.status).toBe(404);
  });
});
