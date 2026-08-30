import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

describe('UserSettings Endpoints', () => {
  let userToken: string;
  let testUserId: number;

  beforeAll(async () => {
    await prisma.$connect();
    const hash = await bcrypt.hash('testpass123', 10);
    const user = await prisma.user.upsert({
      where: { email: 'settings_test@aresta.org' },
      update: { name: 'Settings Tester', password_hash: hash, role: 'USER', is_active: true },
      create: { name: 'Settings Tester', email: 'settings_test@aresta.org', password_hash: hash, role: 'USER', is_active: true },
    });
    testUserId = user.id;

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ login: 'settings_test@aresta.org', password: 'testpass123' });

    userToken = loginRes.body.token;
  });

  afterAll(async () => {
    if (testUserId) {
      await prisma.userSettings.deleteMany({ where: { user_id: testUserId } });
      await prisma.user.deleteMany({ where: { id: testUserId } });
    }
    await prisma.$disconnect();
  });

  it('GET /api/user-settings sem token deve retornar preferências do usuário padrão (200)', async () => {
    const res = await request(app).get('/api/user-settings');
    expect(res.status).toBe(200);
    expect(res.body.language).toBeDefined();
    expect(res.body.epubFontSize).toBeDefined();
  });

  it('GET /api/user-settings com token deve retornar preferências padrão', async () => {
    const res = await request(app)
      .get('/api/user-settings')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.pageAnimationEnabled).toBe(true);
    expect(res.body.pageCreaseEnabled).toBe(true);
    expect(res.body.language).toBe('pt-BR');
    expect(res.body.nativeLanguage).toBe('pt-BR');
    expect(res.body.targetTranslationLanguage).toBe('en');
    expect(res.body.epubFontSize).toBe(18);
    expect(res.body.epubFontFamily).toBe('newsreader');
    expect(res.body.themeMode).toBe('dark');
    expect(res.body.desktopHomeGraphOpen).toBe(false);
    expect(res.body.desktopReaderGraphOpen).toBe(false);
  });

  it('PUT /api/user-settings deve atualizar preferências do usuário', async () => {
    const res = await request(app)
      .put('/api/user-settings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        pageAnimationEnabled: false,
        pageCreaseEnabled: false,
        language: 'en-US',
        nativeLanguage: 'es',
        targetTranslationLanguage: 'pt-BR',
        epubFontSize: 24,
        epubFontFamily: 'merriweather',
        themeMode: 'light',
        desktopHomeGraphOpen: false,
        desktopReaderGraphOpen: false,
      });

    expect(res.status).toBe(200);
    expect(res.body.pageAnimationEnabled).toBe(false);
    expect(res.body.pageCreaseEnabled).toBe(false);
    expect(res.body.language).toBe('en-US');
    expect(res.body.nativeLanguage).toBe('es');
    expect(res.body.targetTranslationLanguage).toBe('pt-BR');
    expect(res.body.epubFontSize).toBe(24);
    expect(res.body.epubFontFamily).toBe('merriweather');
    expect(res.body.themeMode).toBe('light');
    expect(res.body.desktopHomeGraphOpen).toBe(false);
    expect(res.body.desktopReaderGraphOpen).toBe(false);

    // Confirmar via GET subsequente
    const getRes = await request(app)
      .get('/api/user-settings')
      .set('Authorization', `Bearer ${userToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.pageCreaseEnabled).toBe(false);
    expect(getRes.body.nativeLanguage).toBe('es');
    expect(getRes.body.targetTranslationLanguage).toBe('pt-BR');
    expect(getRes.body.themeMode).toBe('light');
    expect(getRes.body.desktopHomeGraphOpen).toBe(false);
    expect(getRes.body.desktopReaderGraphOpen).toBe(false);
    expect(getRes.body.epubFontFamily).toBe('merriweather');
  });

  it('PUT /api/user-settings deve retornar 400 se pageAnimationEnabled for false e pageCreaseEnabled for true', async () => {
    const res = await request(app)
      .put('/api/user-settings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        pageAnimationEnabled: false,
        pageCreaseEnabled: true,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('efeitos de livro');
  });

  it('PUT /api/user-settings deve normalizar pageCreaseEnabled para false se pageAnimationEnabled for desativado', async () => {
    // Primeiro ativa animação e vinco
    await request(app)
      .put('/api/user-settings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        pageAnimationEnabled: true,
        pageCreaseEnabled: true,
      });

    // Depois desativa animação sem explicitar crease
    const res = await request(app)
      .put('/api/user-settings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        pageAnimationEnabled: false,
      });

    expect(res.status).toBe(200);
    expect(res.body.pageAnimationEnabled).toBe(false);
    expect(res.body.pageCreaseEnabled).toBe(false);
  });
});

