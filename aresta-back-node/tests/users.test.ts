import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

describe('Users Endpoints (Admin)', () => {
  let adminToken: string;
  let createdUserId: number;

  beforeAll(async () => {
    await prisma.$connect();
    const hash = await bcrypt.hash('orlaweb123123#', 10);
    await prisma.user.upsert({
      where: { email: 'viktor@aresta.org' },
      update: { name: 'viktor', password_hash: hash, role: 'ADMIN', is_active: true },
      create: { name: 'viktor', email: 'viktor@aresta.org', password_hash: hash, role: 'ADMIN', is_active: true },
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ login: 'viktor', password: 'orlaweb123123#' });

    adminToken = loginRes.body.token;
  });

  afterAll(async () => {
    if (createdUserId) {
      await prisma.user.deleteMany({ where: { id: createdUserId } });
    }
    await prisma.$disconnect();
  });

  it('GET /api/users sem token deve retornar 401', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });

  it('POST /api/users com token de admin deve criar novo usuário', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Novo Usuário Teste',
        email: 'novoteste@aresta.org',
        password: 'senhaSegura123',
        role: 'USER',
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.name).toBe('Novo Usuário Teste');
    createdUserId = res.body.id;
  });

  it('GET /api/users com token de admin deve listar usuários', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((u: any) => u.id === createdUserId)).toBe(true);
  });

  it('DELETE /api/users/:id deve remover o usuário', async () => {
    const res = await request(app)
      .delete(`/api/users/${createdUserId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(204);
  });
});

