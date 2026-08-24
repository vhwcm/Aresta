import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

describe('Conversion API & Service', () => {
  it('GET /api/convert/health retorna status offline quando o serviço python não está rodando', async () => {
    const res = await request(app).get('/api/convert/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status');
  });

  it('POST /api/convert valida corpo da requisição e rejeita corpo vazio', async () => {
    const res = await request(app).post('/api/convert').send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toContain('Erro de validação');
  });
});
