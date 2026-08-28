import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { flashcardRAGService } from '../src/services/flashcardRAG.service.js';

describe('Flashcards RAG & Spaced Repetition System', () => {
  let userToken: string;
  let testUserId: number;
  let testBookId: number;
  let testAnnotationId1: number;
  let testAnnotationId2: number;
  let testFlashcardId: number;

  beforeAll(async () => {
    await prisma.$connect();
    const hash = await bcrypt.hash('password123', 10);
    const user = await prisma.user.upsert({
      where: { email: 'flashcarduser@aresta.org' },
      update: {
        name: 'Flashcard Test User',
        password_hash: hash,
        role: 'USER',
        is_active: true,
      },
      create: {
        name: 'Flashcard Test User',
        email: 'flashcarduser@aresta.org',
        password_hash: hash,
        role: 'USER',
        is_active: true,
      },
    });

    testUserId = user.id;

    // Criar um livro de teste
    const book = await prisma.book.create({
      data: {
        title: 'A Estrutura das Revoluções Científicas',
        file_path: 'test-kuhn.epub',
      },
    });
    testBookId = book.id;

    // Criar anotações de teste
    const ann1 = await prisma.annotation.create({
      data: {
        user_id: testUserId,
        book_id: testBookId,
        selected_text: 'A ciência normal consiste na realização da promessa de um paradigma.',
        note: 'Conceito de ciência normal e resolução de quebra-cabeças.',
        chapter_title: 'Capítulo II: O Caminho para a Ciência Normal',
      },
    });
    testAnnotationId1 = ann1.id;

    const ann2 = await prisma.annotation.create({
      data: {
        user_id: testUserId,
        book_id: testBookId,
        selected_text: 'A transição de um paradigma em crise para um novo é uma revolução.',
        note: 'Mudança de paradigma e crise epistêmica.',
        chapter_title: 'Capítulo IX: A Natureza das Revoluções Científicas',
      },
    });
    testAnnotationId2 = ann2.id;

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ login: 'flashcarduser@aresta.org', password: 'password123' });

    userToken = loginRes.body.token;
  });

  afterAll(async () => {
    if (testUserId) {
      await prisma.dailyDeckCard.deleteMany({ where: { user_id: testUserId } });
      await prisma.flashcard.deleteMany({ where: { user_id: testUserId } });
      await prisma.annotationTheme.deleteMany({ where: { annotation: { user_id: testUserId } } });
      await prisma.annotation.deleteMany({ where: { user_id: testUserId } });
      await prisma.dailyActivity.deleteMany({ where: { user_id: testUserId } });
      await prisma.user.deleteMany({ where: { id: testUserId } });
    }
    if (testBookId) {
      await prisma.bookTheme.deleteMany({ where: { book_id: testBookId } });
      await prisma.book.deleteMany({ where: { id: testBookId } });
    }
    await prisma.$disconnect();
  });

  it('RAG Service: deve calcular similaridade de cosseno com precisão', () => {
    const vecA = [1, 0, 0];
    const vecB = [1, 0, 0];
    const vecC = [0, 1, 0];

    expect(flashcardRAGService.cosineSimilarity(vecA, vecB)).toBeCloseTo(1.0);
    expect(flashcardRAGService.cosineSimilarity(vecA, vecC)).toBeCloseTo(0.0);
  });

  it('RAG Service: deve gerar flashcard 1:1 persistente para anotação com arquétipo pedagógico', async () => {
    const card = await flashcardRAGService.generateFlashcardForAnnotation(testUserId, testAnnotationId1);

    expect(card).toBeDefined();
    expect(card.annotation_id).toBe(testAnnotationId1);
    expect(card.question).toBeDefined();
    expect(card.answer).toBeDefined();
    expect(['REAL_SITUATION', 'CONCEPT_RECALL', 'CONCEPT_UNION']).toContain(card.card_type);
    expect(card.repetition_level).toBe(1);

    testFlashcardId = card.id;

    // Custo zero: Gerar novamente deve retornar exatamente o mesmo card sem duplicar
    const secondCall = await flashcardRAGService.generateFlashcardForAnnotation(testUserId, testAnnotationId1);
    expect(secondCall.id).toBe(card.id);
  });

  it('GET /api/v1/flashcards/daily deve retornar o deck diário de cards para o usuário', async () => {
    const res = await request(app)
      .get('/api/v1/flashcards/daily')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.date).toBeDefined();
    expect(res.body.totalCards).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(res.body.cards)).toBe(true);
    expect(res.body.cards[0].question).toBeDefined();
    expect(res.body.cards[0].answer).toBeDefined();
  });

  it('GET /api/v1/flashcards/daily/first deve retornar o primeiro card para a Home', async () => {
    const res = await request(app)
      .get('/api/v1/flashcards/daily/first')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.card).toBeDefined();
    expect(res.body.card.id).toBeDefined();
    expect(res.body.card.bookTitle).toBe('A Estrutura das Revoluções Científicas');
  });

  it('POST /api/v1/flashcards/:id/review deve processar autoavaliação (Bom), atualizar repetição espaçada e streak', async () => {
    const res = await request(app)
      .post(`/api/v1/flashcards/${testFlashcardId}/review`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ rating: 'good' });

    expect(res.status).toBe(200);
    expect(res.body.flashcard).toBeDefined();
    expect(res.body.flashcard.repetitionLevel).toBeGreaterThan(1);
    expect(res.body.flashcard.isReviewed).toBe(true);
    expect(res.body.flashcard.rating).toBe('good');
    expect(res.body.streak).toBeDefined();
    expect(res.body.streak.today.flashcardsReviewed).toBeGreaterThanOrEqual(1);
  });

  it('POST /api/v1/flashcards/generate-batch deve processar anotações pendentes em lote', async () => {
    const res = await request(app)
      .post('/api/v1/flashcards/generate-batch')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ limit: 10 });

    expect(res.status).toBe(200);
    expect(res.body.totalPendingFound).toBeDefined();
    expect(res.body.totalGenerated).toBeDefined();
  });
});
