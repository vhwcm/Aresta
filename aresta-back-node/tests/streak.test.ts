import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

describe('Streak & Daily Activity Endpoints', () => {
  let userToken: string;
  let testUserId: number;

  beforeAll(async () => {
    await prisma.$connect();
    const hash = await bcrypt.hash('password123', 10);
    const user = await prisma.user.upsert({
      where: { email: 'streakuser@aresta.org' },
      update: {
        name: 'streakuser',
        password_hash: hash,
        role: 'USER',
        is_active: true,
        current_streak: 0,
        longest_streak: 0,
        streak_freeze_count: 1,
        target_streak_days: 7
      },
      create: {
        name: 'streakuser',
        email: 'streakuser@aresta.org',
        password_hash: hash,
        role: 'USER',
        is_active: true,
        current_streak: 0,
        longest_streak: 0,
        streak_freeze_count: 1,
        target_streak_days: 7
      }
    });

    testUserId = user.id;

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ login: 'streakuser@aresta.org', password: 'password123' });

    userToken = loginRes.body.token;
  });

  afterAll(async () => {
    if (testUserId) {
      await prisma.dailyActivity.deleteMany({ where: { user_id: testUserId } });
      await prisma.user.deleteMany({ where: { id: testUserId } });
    }
    await prisma.$disconnect();
  });

  it('GET /api/users/me/streak deve retornar o status inicial da ofensiva', async () => {
    const res = await request(app)
      .get('/api/users/me/streak')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.currentStreak).toBeDefined();
    expect(res.body.targetStreakDays).toBe(7);
    expect(res.body.today).toBeDefined();
    expect(res.body.today.requiredReadingSeconds).toBe(600);
    expect(res.body.today.requiredFlashcards).toBe(5);
    expect(Array.isArray(res.body.weeklyActivity)).toBe(true);
    expect(res.body.weeklyActivity.length).toBe(7);
  });

  it('POST /api/users/me/activity/reading-time deve rejeitar pulso maior que 300s (5 min por página)', async () => {
    const res = await request(app)
      .post('/api/users/me/activity/reading-time')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ reading_seconds: 400 });

    expect(res.status).toBe(400);
  });

  it('POST /api/users/me/activity/reading-time deve registrar tempo de leitura', async () => {
    const res = await request(app)
      .post('/api/users/me/activity/reading-time')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ reading_seconds: 300 });

    expect(res.status).toBe(200);
    expect(res.body.status.today.readingSeconds).toBeGreaterThanOrEqual(300);
    expect(res.body.justCompleted).toBe(false);
  });

  it('POST /api/users/me/activity/flashcard-review deve registrar revisão de flashcard', async () => {
    const res = await request(app)
      .post('/api/users/me/activity/flashcard-review')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ count: 4 });

    expect(res.status).toBe(200);
    expect(res.body.status.today.flashcardsReviewed).toBeGreaterThanOrEqual(4);
    expect(res.body.justCompleted).toBe(false);
  });

  it('Completar os 600s de leitura e 5 flashcards deve avançar a ofensiva', async () => {
    // Adiciona mais 300s de leitura (totalizando 600s)
    await request(app)
      .post('/api/users/me/activity/reading-time')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ reading_seconds: 300 });

    // Adiciona o 5º flashcard (completando a meta)
    const res = await request(app)
      .post('/api/users/me/activity/flashcard-review')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ count: 1 });

    expect(res.status).toBe(200);
    expect(res.body.justCompleted).toBe(true);
    expect(res.body.status.currentStreak).toBe(1);
    expect(res.body.status.isGoalReachedToday).toBe(true);
  });

  it('PATCH /api/users/me/streak/target deve atualizar a meta de dias', async () => {
    const res = await request(app)
      .patch('/api/users/me/streak/target')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ target_days: 14 });

    expect(res.status).toBe(200);
    expect(res.body.targetStreakDays).toBe(14);
  });
});
