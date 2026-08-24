import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

describe('Health Check Endpoint', () => {
  beforeAll(async () => {
    await prisma.$connect();
    await prisma.appConfig.upsert({
      where: { key: 'version' },
      update: { value: '1.0.0' },
      create: { key: 'version', value: '1.0.0' },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('GET /api/health deve retornar status UP', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
    expect(res.body.schemaVersion).toBe('1.0.0');
  });

  it('GET /api-docs.json deve retornar a especificação Swagger OpenAPI', async () => {
    const res = await request(app).get('/api-docs.json');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.0.0');
    expect(res.body.info.title).toBe('Aresta API');
  });
});

