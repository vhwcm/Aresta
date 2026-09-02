import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

describe('Didactic Explainer Booklets & Append Restriction System', () => {
  let userToken: string;
  let testUserId: number;
  let normalBookId: number;
  let createdBookletBookId: number;
  let createdBookletId: string;

  beforeAll(async () => {
    await prisma.$connect();
    const hash = await bcrypt.hash('password123', 10);
    const user = await prisma.user.upsert({
      where: { email: 'didacticuser@aresta.org' },
      update: {
        name: 'Didactic Test User',
        password_hash: hash,
        role: 'USER',
        is_active: true,
      },
      create: {
        name: 'Didactic Test User',
        email: 'didacticuser@aresta.org',
        password_hash: hash,
        role: 'USER',
        is_active: true,
      },
    });

    testUserId = user.id;

    // Login para obter token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'didacticuser@aresta.org', password: 'password123' });

    userToken = loginRes.body.token;

    // Criar um livro convencional (EPUB) que NÃO é livreto didático
    const normalBook = await prisma.book.create({
      data: {
        title: 'Livro Tradicional de Exemplo',
        file_path: 'traditional-book.epub',
        format_type: 'EPUB',
        is_ai_generated: false,
      },
    });
    normalBookId = normalBook.id;
  });

  afterAll(async () => {
    // Limpeza de registros de teste
    if (createdBookletId) {
      await prisma.didacticBookletChapter.deleteMany({ where: { booklet_id: createdBookletId } });
      await prisma.didacticBooklet.deleteMany({ where: { id: createdBookletId } });
    }
    if (createdBookletBookId) {
      await prisma.userBook.deleteMany({ where: { book_id: createdBookletBookId } });
      await prisma.book.deleteMany({ where: { id: createdBookletBookId } });
    }
    if (normalBookId) {
      await prisma.book.deleteMany({ where: { id: normalBookId } });
    }
    await prisma.$disconnect();
  });

  it('1. Deve criar um livreto didático independente (Standalone Booklet) com sucesso', async () => {
    const res = await request(app)
      .post('/api/v1/didactic/booklets')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Caderno de Algoritmos & Estruturas de Dados',
        topic: 'Inversão de Árvores Binárias e Percurso em Profundidade',
        depth_level: 'standard',
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('book');
    expect(res.body).toHaveProperty('booklet');

    const { book, booklet } = res.body;
    expect(book.format_type).toBe('DIDACTIC');
    expect(book.is_ai_generated).toBe(true);
    expect(booklet.title).toBe('Caderno de Algoritmos & Estruturas de Dados');
    expect(booklet.chapters).toHaveLength(1);
    expect(booklet.chapters[0].order_index).toBe(1);
    expect(booklet.chapters[0].raw_markdown).toContain('```mermaid');

    createdBookletBookId = book.id;
    createdBookletId = booklet.id;
  });

  it('2. Deve anexar um segundo capítulo a um livreto didático existente com sucesso', async () => {
    const res = await request(app)
      .post(`/api/v1/didactic/booklets/${createdBookletBookId}/append`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        topic: 'Tabelas Hash e Algoritmos de Resolução de Colisão',
        title: 'Capítulo 2: Tabelas Hash e Colisões',
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('newChapter');
    expect(res.body.newChapter.order_index).toBe(2);
    expect(res.body.booklet.chapters).toHaveLength(2);
  });

  it('3. RESTRIÇÃO INEGOCIÁVEL: Deve REJEITAR com 422 qualquer tentativa de anexar em livro convencional (EPUB/PDF)', async () => {
    const res = await request(app)
      .post(`/api/v1/didactic/booklets/${normalBookId}/append`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        topic: 'Tentativa de anexar em livro tradicional',
      });

    expect(res.status).toBe(422);
    expect(res.body.error).toContain('CANNOT_APPEND_TO_NON_BOOKLET');
  });

  it('4. Deve listar os livretos didáticos do usuário', async () => {
    const res = await request(app)
      .get('/api/v1/didactic/booklets')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('booklets');
    expect(Array.isArray(res.body.booklets)).toBe(true);

    const found = res.body.booklets.find((b: any) => b.id === createdBookletId);
    expect(found).toBeDefined();
    expect(found.chapters).toHaveLength(2);
  });

  it('5. Deve obter o livreto didático completo por ID', async () => {
    const res = await request(app)
      .get(`/api/v1/didactic/booklets/${createdBookletBookId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('booklet');
    expect(res.body.booklet.chapters).toHaveLength(2);
    expect(res.body.booklet.chapters[0].order_index).toBe(1);
    expect(res.body.booklet.chapters[1].order_index).toBe(2);
  });
});
