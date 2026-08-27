import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

describe('Graph Endpoints', () => {
  let createdNodeId: number;

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    if (createdNodeId) {
      await prisma.theme.deleteMany({ where: { id: createdNodeId } });
    }
    await prisma.$disconnect();
  });

  it('POST /api/graph/nodes deve criar um novo nó de tema', async () => {
    const res = await request(app)
      .post('/api/graph/nodes')
      .send({
        name: 'Tema Teste Node Express 2',
        color: '#10B981',
        description: 'Descrição de teste',
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.name).toBe('Tema Teste Node Express 2');
    createdNodeId = res.body.id;
  });

  it('GET /api/graph deve retornar a estrutura unificada com nós de temas e livros', async () => {
    const res = await request(app).get('/api/graph');
    expect(res.status).toBe(200);
    expect(res.body.nodes).toBeDefined();
    expect(res.body.edges).toBeDefined();
    expect(res.body.nodes.some((n: any) => n.rawId === createdNodeId && n.type === 'theme')).toBe(true);
    expect(res.body.nodes.some((n: any) => n.type === 'book')).toBe(true);
  });

  it('GET /api/graph/themes/:id/books deve listar os livros de um tema', async () => {
    const res = await request(app).get(`/api/graph/themes/1/books`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('PUT /api/graph/nodes/:id deve atualizar o nó', async () => {
    const res = await request(app)
      .put(`/api/graph/nodes/${createdNodeId}`)
      .send({
        name: 'Tema Teste Atualizado 2',
      });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Tema Teste Atualizado 2');
  });

  it('DELETE /api/graph/nodes/:id deve remover o nó', async () => {
    const res = await request(app).delete(`/api/graph/nodes/${createdNodeId}`);
    expect(res.status).toBe(204);
  });
});
