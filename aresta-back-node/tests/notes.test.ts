import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

describe('Notes & Composite Links Endpoints', () => {
  let createdNoteId: string;
  let defaultUserId: number = 1;

  beforeAll(async () => {
    await prisma.$connect();

    const user = await prisma.user.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        name: 'Test User Notes',
        email: 'test_notes@aresta.com',
      },
    });
    defaultUserId = user.id;
  });

  afterAll(async () => {
    if (createdNoteId) {
      await prisma.note.deleteMany({
        where: { id: createdNoteId },
      });
    }
    await prisma.$disconnect();
  });

  it('POST /api/notes deve criar uma nova nota com extração de links compostos', async () => {
    const res = await request(app)
      .post('/api/notes')
      .send({
        title: 'Arquitetura de Conhecimento',
        content: '# Resumo\nVeja o mapa mental em ![[canvas:canvas-uuid-123]] e o livro ![[book:10]].',
        folder: 'Estudos/Arquitetura',
        tags: ['arquitetura', 'design'],
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toBe('Arquitetura de Conhecimento');
    expect(res.body.userId).toBe(defaultUserId);
    expect(res.body.folder).toBe('Estudos/Arquitetura');
    expect(res.body.tags).toEqual(['arquitetura', 'design']);
    expect(res.body.links).toHaveLength(2);
    expect(res.body.links).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ targetType: 'CANVAS', targetId: 'canvas-uuid-123' }),
        expect.objectContaining({ targetType: 'BOOK', targetId: '10' }),
      ])
    );

    createdNoteId = res.body.id;
  });

  it('GET /api/notes deve listar as notas com paginação e filtros', async () => {
    const res = await request(app)
      .get('/api/notes')
      .query({ folder: 'Estudos/Arquitetura', page: 1, limit: 10 });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('notes');
    expect(Array.isArray(res.body.notes)).toBe(true);
    expect(res.body.notes.length).toBeGreaterThanOrEqual(1);
    expect(res.body.total).toBeGreaterThanOrEqual(1);
    expect(res.body.notes[0]).toHaveProperty('linksCount', 2);
  });

  it('GET /api/notes/folders deve retornar as pastas existentes', async () => {
    const res = await request(app).get('/api/notes/folders');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toContain('Estudos/Arquitetura');
  });

  it('GET /api/notes/:id deve retornar a nota completa com links', async () => {
    const res = await request(app).get(`/api/notes/${createdNoteId}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(createdNoteId);
    expect(res.body.title).toBe('Arquitetura de Conhecimento');
    expect(res.body.links).toHaveLength(2);
  });

  it('PUT /api/notes/:id deve atualizar a nota e sincronizar referências compostas', async () => {
    const res = await request(app)
      .put(`/api/notes/${createdNoteId}`)
      .send({
        title: 'Arquitetura Atualizada',
        content: '# Resumo Atualizado\nAgora temos apenas o canvas ![[canvas:canvas-uuid-999]].',
      });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Arquitetura Atualizada');
    expect(res.body.links).toHaveLength(1);
    expect(res.body.links[0]).toMatchObject({
      targetType: 'CANVAS',
      targetId: 'canvas-uuid-999',
    });
  });

  it('DELETE /api/notes/:id deve excluir a nota', async () => {
    const res = await request(app).delete(`/api/notes/${createdNoteId}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Nota excluída com sucesso');

    // Verificar se foi excluído mesmo
    const checkRes = await request(app).get(`/api/notes/${createdNoteId}`);
    expect(checkRes.status).toBe(404);
  });
});
