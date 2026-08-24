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
        name: 'Tema Teste Node Express',
        color: '#10B981',
        description: 'Descrição de teste',
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.name).toBe('Tema Teste Node Express');
    createdNodeId = res.body.id;
  });

  it('GET /api/graph deve retornar a estrutura de nós e conexões', async () => {
    const res = await request(app).get('/api/graph');
    expect(res.status).toBe(200);
    expect(res.body.nodes).toBeDefined();
    expect(res.body.edges).toBeDefined();
    expect(res.body.nodes.some((n: any) => n.id === createdNodeId)).toBe(true);
  });

  it('PUT /api/graph/nodes/:id deve atualizar o nó', async () => {
    const res = await request(app)
      .put(`/api/graph/nodes/${createdNodeId}`)
      .send({
        name: 'Tema Teste Atualizado',
      });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Tema Teste Atualizado');
  });

  it('DELETE /api/graph/nodes/:id deve remover o nó', async () => {
    const res = await request(app).delete(`/api/graph/nodes/${createdNodeId}`);
    expect(res.status).toBe(204);
  });
});

