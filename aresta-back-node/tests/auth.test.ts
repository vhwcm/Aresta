import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

describe('Auth Endpoints', () => {
  beforeAll(async () => {
    await prisma.$connect();
    const hash = await bcrypt.hash('orlaweb123123#', 10);
    await prisma.user.upsert({
      where: { email: 'viktor@aresta.org' },
      update: { name: 'viktor', password_hash: hash, role: 'ADMIN', is_active: true },
      create: { name: 'viktor', email: 'viktor@aresta.org', password_hash: hash, role: 'ADMIN', is_active: true },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('POST /api/auth/login deve autenticar com sucesso para viktor', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ login: 'viktor', password: 'orlaweb123123#' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.name).toBe('viktor');
    expect(res.body.user.role).toBe('ADMIN');
  });

  it('POST /api/auth/login deve falhar com senha incorreta', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ login: 'viktor', password: 'senha_errada' });

    expect(res.status).toBe(401);
  });

  it('GET /api/auth/me deve retornar dados do usuário autenticado', async () => {
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ login: 'viktor', password: 'orlaweb123123#' });

    const token = loginRes.body.token;

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.email).toBe('viktor@aresta.org');
  });
});

