import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

describe('Auth Endpoints', () => {
  beforeAll(async () => {
    await prisma.$connect();
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['novo_leitor@aresta.app', 'deletavel@aresta.app'],
        },
      },
    });
    const hash = await bcrypt.hash('orlaweb123123#', 10);
    await prisma.user.upsert({
      where: { email: 'viktor@aresta.org' },
      update: { name: 'viktor', password_hash: hash, role: 'ADMIN', is_active: true },
      create: { name: 'viktor', email: 'viktor@aresta.org', password_hash: hash, role: 'ADMIN', is_active: true },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['novo_leitor@aresta.app', 'deletavel@aresta.app'],
        },
      },
    });
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

  it('POST /api/auth/register deve cadastrar novo usuário com sucesso e retornar token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'novo_leitor',
        email: 'novo_leitor@aresta.app',
        password: 'senha_segura_123',
      });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.name).toBe('novo_leitor');
    expect(res.body.user.email).toBe('novo_leitor@aresta.app');
  });

  it('POST /api/auth/register deve falhar com e-mail duplicado', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'outro_nome',
        email: 'viktor@aresta.org',
        password: 'senha_segura_123',
      });

    expect(res.status).toBe(400);
  });

  it('DELETE /api/auth/me deve deletar a própria conta com sucesso', async () => {
    // 1. Cadastrar usuário temporário
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'usuario_deletavel',
        email: 'deletavel@aresta.app',
        password: 'senha_segura_123',
      });

    expect(regRes.status).toBe(201);
    const userToken = regRes.body.token;

    // 2. Deletar a conta do usuário
    const delRes = await request(app)
      .delete('/api/auth/me')
      .set('Authorization', `Bearer ${userToken}`);

    expect(delRes.status).toBe(204);

    // 3. Tentar logar com o usuário deletado deve falhar
    const loginAfterDel = await request(app)
      .post('/api/auth/login')
      .send({ login: 'deletavel@aresta.app', password: 'senha_segura_123' });

    expect(loginAfterDel.status).toBe(401);
  });
});

