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
        filePath: 'storage/books/test.pdf',
        coverPath: 'storage/covers/test.png',
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
  });
});

