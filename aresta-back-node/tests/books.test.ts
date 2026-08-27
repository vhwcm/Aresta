import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { env } from '../src/config/env.js';

describe('Books Endpoints', () => {
  let createdBookId: number;
  const adminToken = jwt.sign(
    { userId: 1, email: 'viktor@aresta.org', role: 'ADMIN', name: 'viktor' },
    env.JWT_SECRET
  );

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

  it('POST /api/books/admin-upload deve criar livro com autor e metadados com token de admin', async () => {
    const res = await request(app)
      .post('/api/books/admin-upload')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Livro Admin Upload Teste',
        author: 'Viktor Autor Teste',
        summary: 'Resumo teste administrativo',
        filePath: 'storage/epubs/O-Alienista.epub',
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.author).toBe('Viktor Autor Teste');
    expect(res.body.summary).toBe('Resumo teste administrativo');

    // Cleanup
    await prisma.book.deleteMany({ where: { id: res.body.id } });
  });

  it('GET /api/books deve listar os livros com temas e autor', async () => {
    const res = await request(app).get('/api/books');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((b: any) => b.id === createdBookId)).toBe(true);
  });

  it('GET /api/books/:id deve retornar o livro específico com autor e temas', async () => {
    const res = await request(app).get(`/api/books/${createdBookId}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Livro Teste Express');
    expect(res.body.author).toBeDefined();
  });

  it('GET /api/books/:id/file deve retornar arquivo com content-type epub', async () => {
    const res = await request(app).get(`/api/books/${createdBookId}/file`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/epub+zip');
  });

  it('DELETE /api/books/:id deve remover o livro quando autenticado como admin', async () => {
    const res = await request(app)
      .delete(`/api/books/${createdBookId}`)
      .set('Authorization', `Bearer ${adminToken}`);
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
