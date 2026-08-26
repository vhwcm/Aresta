import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

describe('Books Endpoints', () => {
  let createdBookId: number;

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    if (createdBookId) {
      await prisma.book.deleteMany({ where: { id: createdBookId } });
    }
    await prisma.$disconnect();
  });

  it('POST /api/books deve criar um novo livro', async () => {
    const res = await request(app)
      .post('/api/books')
      .send({
        title: 'Livro Teste Express',
        filePath: 'storage/epubs/5ca0e9_0c9dc557fbc54bf6baabb862a6457dbd.epub',
        coverPath: 'storage/covers/5ca0e9_0c9dc557fbc54bf6baabb862a6457dbd.png',
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.title).toBe('Livro Teste Express');
    createdBookId = res.body.id;
  });

  it('GET /api/books deve listar os livros', async () => {
    const res = await request(app).get('/api/books');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((b: any) => b.id === createdBookId)).toBe(true);
  });

  it('GET /api/books/:id deve retornar o livro específico', async () => {
    const res = await request(app).get(`/api/books/${createdBookId}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Livro Teste Express');
  });

  it('GET /api/books/:id/file deve retornar arquivo com content-type epub', async () => {
    const res = await request(app).get(`/api/books/${createdBookId}/file`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/epub+zip');
  });

  it('GET rotas estáticas /epubs, /pdfs e /covers devem servir arquivos', async () => {
    const epubRes = await request(app).get('/epubs/O-Alienista.epub');
    expect(epubRes.status).toBe(200);

    const pdfRes = await request(app).get('/pdfs/O-Alienista.pdf');
    expect(pdfRes.status).toBe(200);

    const coverRes = await request(app).get('/covers/O-Alienista.png');
    expect(coverRes.status).toBe(200);
  });

  it('DELETE /api/books/:id deve remover o livro', async () => {
    const res = await request(app).delete(`/api/books/${createdBookId}`);
    expect(res.status).toBe(204);

    const check = await request(app).get(`/api/books/${createdBookId}`);
    expect(check.status).toBe(404);
  });

  describe('UserBooks and lastAccessedAt', () => {
    let bookId: number;
    let userBookId: number;

    beforeAll(async () => {
      const b = await prisma.book.create({
        data: {
          title: 'Livro Teste UserBook',
          file_path: 'storage/books/test_ub.pdf',
          cover_path: 'storage/covers/test_ub.png',
        },
      });
      bookId = b.id;
    });

    afterAll(async () => {
      if (bookId) {
        await prisma.userBook.deleteMany({ where: { book_id: bookId } });
        await prisma.book.deleteMany({ where: { id: bookId } });
      }
    });

    it('POST /api/user-books deve criar item com lastAccessedAt', async () => {
      const res = await request(app)
        .post('/api/user-books')
        .send({
          bookId,
          status: 'LENDO',
          currentPage: 15,
        });

      expect(res.status).toBe(201);
      expect(res.body.bookId).toBe(bookId);
      expect(res.body.lastAccessedAt).toBeDefined();
      userBookId = res.body.id;
    });

    it('PATCH /api/user-books/:id/access deve atualizar lastAccessedAt', async () => {
      const res = await request(app).patch(`/api/user-books/${userBookId}/access`);
      expect(res.status).toBe(200);
      expect(res.body.lastAccessedAt).toBeDefined();
    });

    it('POST, PUT e DELETE /api/user-books/:id/themes deve gerenciar temas/tags do livro', async () => {
      // 1. Criar dois temas
      const theme1 = await prisma.theme.create({
        data: { user_id: 1, name: 'Psicologia & Loucura', color: '#10B981' },
      });
      const theme2 = await prisma.theme.create({
        data: { user_id: 1, name: 'Literatura Brasileira', color: '#6366F1' },
      });

      // 2. Adicionar theme1 via POST
      const postRes = await request(app)
        .post(`/api/user-books/${userBookId}/themes`)
        .send({ themeId: theme1.id });
      expect(postRes.status).toBe(200);
      expect(postRes.body.themes).toBeDefined();
      expect(postRes.body.themes.some((t: any) => t.id === theme1.id)).toBe(true);

      // 3. Atualizar lista total via PUT com theme1 e theme2
      const putRes = await request(app)
        .put(`/api/user-books/${userBookId}/themes`)
        .send({ themeIds: [theme1.id, theme2.id] });
      expect(putRes.status).toBe(200);
      expect(putRes.body.themes.length).toBe(2);

      // 4. GET /api/user-books deve retornar o livro com os temas
      const listRes = await request(app).get('/api/user-books');
      expect(listRes.status).toBe(200);
      const ub = listRes.body.find((b: any) => b.id === userBookId);
      expect(ub).toBeDefined();
      expect(ub.themes.length).toBe(2);

      // 5. Remover theme1 via DELETE
      const delRes = await request(app).delete(`/api/user-books/${userBookId}/themes/${theme1.id}`);
      expect(delRes.status).toBe(200);
      expect(delRes.body.themes.length).toBe(1);
      expect(delRes.body.themes[0].id).toBe(theme2.id);

      // Cleanup
      await prisma.theme.deleteMany({ where: { id: { in: [theme1.id, theme2.id] } } });
    });
  });
});

