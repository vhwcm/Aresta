import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';
import { ocrClient } from '../src/services/ocr.client.js';

describe('OCR & Drawing Annotation Endpoints', () => {
  let testBookId: number;
  let testThemeId: number;
  let createdAnnotationId: number;

  const mockBase64Png =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  beforeAll(async () => {
    await prisma.$connect();

    const book = await prisma.book.create({
      data: {
        title: 'Livro Teste OCR',
        file_path: 'storage/epubs/test_ocr.epub',
      },
    });
    testBookId = book.id;

    const theme = await prisma.theme.create({
      data: {
        user_id: 1,
        name: 'Tema OCR Anotação',
        color: '#10B981',
      },
    });
    testThemeId = theme.id;
  });

  afterAll(async () => {
    if (createdAnnotationId) {
      await prisma.annotation.deleteMany({ where: { id: createdAnnotationId } });
    }
    if (testThemeId) {
      await prisma.theme.deleteMany({ where: { id: testThemeId } });
    }
    if (testBookId) {
      await prisma.book.deleteMany({ where: { id: testBookId } });
    }
    await prisma.$disconnect();
    vi.restoreAllMocks();
  });

  it('POST /api/ocr/transcribe deve retornar texto extraído via OCR', async () => {
    vi.spyOn(ocrClient, 'extractText').mockResolvedValueOnce({
      text: 'Texto manuscrito transcrito com sucesso!',
      modelUsed: 'gemini-2.5-flash',
    });

    const res = await request(app)
      .post('/api/ocr/transcribe')
      .send({
        imageBase64: mockBase64Png,
        mimeType: 'image/png',
      });

    expect(res.status).toBe(200);
    expect(res.body.text).toBe('Texto manuscrito transcrito com sucesso!');
    expect(res.body.modelUsed).toBe('gemini-2.5-flash');
  });

  it('POST /api/annotations/with-ocr deve transcrever imagem e persistir anotação', async () => {
    vi.spyOn(ocrClient, 'extractText').mockResolvedValueOnce({
      text: 'Ideia desenhada à mão sobre a tese do autor.',
      modelUsed: 'gemini-2.5-flash',
    });

    const res = await request(app)
      .post('/api/annotations/with-ocr')
      .send({
        bookId: testBookId,
        cfi: 'epubcfi(/6/8[ch2]!/4/2/10:5)',
        selectedText: 'Trecho do livro selecionado para anotação manual',
        chapterTitle: 'Capítulo 2: Dialética',
        progress: 0.45,
        themeIds: [testThemeId],
        imageBase64: mockBase64Png,
        mimeType: 'image/png',
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.note).toBe('Ideia desenhada à mão sobre a tese do autor.');
    expect(res.body.selectedText).toBe('Trecho do livro selecionado para anotação manual');
    expect(res.body.themes).toHaveLength(1);
    expect(res.body.themes[0].id).toBe(testThemeId);

    createdAnnotationId = res.body.id;
  });

  it('POST /api/annotations/with-ocr deve retornar 502 se o serviço OCR falhar', async () => {
    vi.spyOn(ocrClient, 'extractText').mockRejectedValueOnce(
      new Error('Microsserviço de OCR indisponível (conexão recusada).')
    );

    const res = await request(app)
      .post('/api/annotations/with-ocr')
      .send({
        bookId: testBookId,
        cfi: 'epubcfi(/6/8[ch2]!/4/2/10:5)',
        imageBase64: mockBase64Png,
      });

    expect(res.status).toBe(502);
    expect(res.body.error).toContain('OCR');
  });
});
