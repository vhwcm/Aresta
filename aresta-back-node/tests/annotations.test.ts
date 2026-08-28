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

    // Criar livro de teste
    const book = await prisma.book.create({
      data: {
        title: 'Livro de Teste Anotações',
        file_path: 'storage/epubs/test.epub',
      },
    });
    testBookId = book.id;

    // Criar temas de teste globais
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const theme1 = await prisma.theme.create({
      data: {
        name: `Tema Teste Anotação 101 ${uniqueSuffix}`,
        color: '#3B82F6',
        description: 'Tema azul',
      },
    });
    testThemeId = theme1.id;

    const theme2 = await prisma.theme.create({
      data: {
        name: `Tema Teste Anotação 102 ${uniqueSuffix}`,
        color: '#EC4899',
        description: 'Tema rosa',
      },
    });
    testThemeId2 = theme2.id;

    // Vincular temas ao livro
    await prisma.bookTheme.createMany({
      data: [
        { book_id: testBookId, theme_id: testThemeId },
        { book_id: testBookId, theme_id: testThemeId2 },
      ],
    });
  });

  afterAll(async () => {
    if (createdAnnotationId) {
      await prisma.annotation.deleteMany({ where: { id: createdAnnotationId } });
    }
    if (testBookId) {
      await prisma.book.deleteMany({ where: { id: testBookId } });
    }
    if (testThemeId) {
      await prisma.theme.deleteMany({ where: { id: { in: [testThemeId, testThemeId2] } } });
    }
    await prisma.$disconnect();
  });

  it('POST /api/annotations deve criar anotação de EPUB vinculada a um tema do livro', async () => {
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

  it('POST /api/annotations deve permitir criar "Anotação Solta" (sem CFI e sem selectedText)', async () => {
    const res = await request(app)
      .post('/api/annotations')
      .send({
        bookId: testBookId,
        note: 'Esta é uma anotação solta sobre o livro inteiro',
        themeIds: [testThemeId2],
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.cfi).toBeNull();
    expect(res.body.note).toBe('Esta é uma anotação solta sobre o livro inteiro');
    expect(res.body.themes[0].id).toBe(testThemeId2);

    // Cleanup
    await prisma.annotation.delete({ where: { id: res.body.id } });
  });

  it('POST /api/annotations deve rejeitar vínculo com tema que não pertence ao livro', async () => {
    // Criar tema avulso sem vínculo com o livro
    const unlinkedTheme = await prisma.theme.create({
      data: { name: 'Tema Desconexo 999', color: '#999999' },
    });

    const res = await request(app)
      .post('/api/annotations')
      .send({
        bookId: testBookId,
        note: 'Tentativa de vincular tema inválido',
        themeIds: [unlinkedTheme.id],
      });

    expect(res.status).toBe(400);

    // Cleanup
    await prisma.theme.delete({ where: { id: unlinkedTheme.id } });
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

  it('DELETE /api/annotations/:id deve deletar a anotação', async () => {
    const res = await request(app).delete(`/api/annotations/${createdAnnotationId}`);
    expect(res.status).toBe(204);

    const check = await request(app).get(`/api/annotations/${createdAnnotationId}`);
    expect(check.status).toBe(404);
  });
});
