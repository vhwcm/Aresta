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
    expect(res.body.language).toBe('pt-BR');
    expect(res.body.epubFontSize).toBe(18);
    expect(res.body.epubFontFamily).toBe('newsreader');
    expect(res.body.themeMode).toBe('dark');
    expect(res.body.desktopHomeGraphOpen).toBe(true);
    expect(res.body.desktopReaderGraphOpen).toBe(true);
  });

  it('PUT /api/user-settings deve atualizar preferências do usuário', async () => {
    const res = await request(app)
      .put('/api/user-settings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        pageAnimationEnabled: false,
        language: 'en-US',
        epubFontSize: 24,
        epubFontFamily: 'merriweather',
        themeMode: 'light',
        desktopHomeGraphOpen: false,
        desktopReaderGraphOpen: false,
      });

    expect(res.status).toBe(200);
    expect(res.body.pageAnimationEnabled).toBe(false);
    expect(res.body.language).toBe('en-US');
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
    expect(getRes.body.themeMode).toBe('light');
    expect(getRes.body.desktopHomeGraphOpen).toBe(false);
    expect(getRes.body.desktopReaderGraphOpen).toBe(false);
    expect(getRes.body.epubFontFamily).toBe('merriweather');
  });
});
