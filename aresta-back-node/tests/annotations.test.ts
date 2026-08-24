import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

describe('Annotations Endpoints & Graph Integration', () => {
  let testBookId: number;
  let testThemeId: number;
  let testThemeId2: number;
  let createdAnnotationId: number;

  beforeAll(async () => {
    await prisma.$connect();

    // Criar livro de teste se não houver
    const book = await prisma.book.create({
      data: {
        title: 'Livro de Teste Anotações',
        file_path: 'storage/books/test.epub',
      },
    });
    testBookId = book.id;

    // Criar temas de teste para vincular no grafo
    const theme1 = await prisma.theme.create({
      data: {
        user_id: 1,
        name: 'Tema Teste Anotação 1',
        color: '#3B82F6',
        description: 'Tema azul',
      },
    });
    testThemeId = theme1.id;

    const theme2 = await prisma.theme.create({
      data: {
        user_id: 1,
        name: 'Tema Teste Anotação 2',
        color: '#EC4899',
        description: 'Tema rosa',
      },
    });
    testThemeId2 = theme2.id;
  });

  afterAll(async () => {
    if (createdAnnotationId) {
      await prisma.annotation.deleteMany({ where: { id: createdAnnotationId } });
    }
    if (testThemeId) {
      await prisma.theme.deleteMany({ where: { id: { in: [testThemeId, testThemeId2] } } });
    }
    if (testBookId) {
      await prisma.book.deleteMany({ where: { id: testBookId } });
    }
    await prisma.$disconnect();
  });

  it('POST /api/annotations deve criar anotação de EPUB vinculada a um tema', async () => {
    const res = await request(app)
      .post('/api/annotations')
      .send({
        bookId: testBookId,
        cfi: 'epubcfi(/6/14[chapter_3]!/4/2/10/1:15,/4/2/10/1:58)',
        selectedText: 'Texto destacado de teste no EPUB',
        note: 'Minha reflexão crítica sobre o parágrafo',
        chapterTitle: 'Capítulo 3: Fundamentos',
        progress: 0.25,
        themeIds: [testThemeId],
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.cfi).toBe('epubcfi(/6/14[chapter_3]!/4/2/10/1:15,/4/2/10/1:58)');
    expect(res.body.selectedText).toBe('Texto destacado de teste no EPUB');
    expect(res.body.note).toBe('Minha reflexão crítica sobre o parágrafo');
    expect(res.body.themes).toHaveLength(1);
    expect(res.body.themes[0].id).toBe(testThemeId);
    expect(res.body.themes[0].color).toBe('#3B82F6');

    createdAnnotationId = res.body.id;
  });

  it('GET /api/annotations deve listar anotações com filtros de livro e tema', async () => {
    const res = await request(app)
      .get('/api/annotations')
      .query({ bookId: testBookId, themeId: testThemeId });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((a: any) => a.id === createdAnnotationId)).toBe(true);
  });

  it('GET /api/annotations/:id deve retornar os detalhes da anotação', async () => {
    const res = await request(app).get(`/api/annotations/${createdAnnotationId}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(createdAnnotationId);
    expect(res.body.bookTitle).toBe('Livro de Teste Anotações');
  });

  it('PUT /api/annotations/:id deve atualizar a anotação e re-sincronizar temas', async () => {
    const res = await request(app)
      .put(`/api/annotations/${createdAnnotationId}`)
      .send({
        note: 'Nota atualizada com novas ideias',
        progress: 0.30,
        themeIds: [testThemeId, testThemeId2],
      });

    expect(res.status).toBe(200);
    expect(res.body.note).toBe('Nota atualizada com novas ideias');
    expect(res.body.progress).toBe(0.30);
    expect(res.body.themes).toHaveLength(2);
  });

  it('GET /api/graph deve exibir as anotações vinculadas dentro do nó de tema', async () => {
    const res = await request(app).get('/api/graph');

    expect(res.status).toBe(200);
    const targetNode = res.body.nodes.find((n: any) => n.id === testThemeId);
    expect(targetNode).toBeDefined();
    expect(targetNode.annotations).toBeDefined();
    expect(targetNode.annotations.some((a: any) => a.id === createdAnnotationId)).toBe(true);
    expect(targetNode.annotations.find((a: any) => a.id === createdAnnotationId).cfi).toBe(
      'epubcfi(/6/14[chapter_3]!/4/2/10/1:15,/4/2/10/1:58)'
    );
  });

  it('DELETE /api/graph/nodes/:id/annotations/:annotationId deve desvincular do nó', async () => {
    const res = await request(app).delete(
      `/api/graph/nodes/${testThemeId}/annotations/${createdAnnotationId}`
    );

    expect(res.status).toBe(204);

    // Verificar se ainda tem o outro tema
    const check = await request(app).get(`/api/annotations/${createdAnnotationId}`);
    expect(check.body.themes).toHaveLength(1);
    expect(check.body.themes[0].id).toBe(testThemeId2);
  });

  it('POST /api/graph/nodes/:id/annotations/:annotationId deve revincular ao nó', async () => {
    const res = await request(app).post(
      `/api/graph/nodes/${testThemeId}/annotations/${createdAnnotationId}`
    );

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('DELETE /api/annotations/:id deve deletar a anotação', async () => {
    const res = await request(app).delete(`/api/annotations/${createdAnnotationId}`);
    expect(res.status).toBe(204);

    const check = await request(app).get(`/api/annotations/${createdAnnotationId}`);
    expect(check.status).toBe(404);
  });
});
