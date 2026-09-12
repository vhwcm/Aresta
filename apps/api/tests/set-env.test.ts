import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import path from 'path';
import fs from 'fs';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { maskValue, formatEnvValue, parseEnvFile, updateEnvFile } = require('../../../scripts/set-env.js');

describe('set-env CLI utility', () => {
  const tempDir = path.join(__dirname, 'temp-env-test');
  const tempEnv = path.join(tempDir, '.env');
  const tempExample = path.join(tempDir, '.env.example');

  beforeEach(() => {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    fs.writeFileSync(tempExample, 'FOO=bar\nSECRET_KEY="1234567890"\n', 'utf-8');
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('masks sensitive keys and does not mask URLs or non-sensitive keys', () => {
    expect(maskValue('API_KEY', '1234567890abcdef')).toContain('...');
    expect(maskValue('JWT_SECRET', 'mysecretlongstring')).toContain('...');
    expect(maskValue('PASSWORD', 'pass')).toBe('********');
    expect(maskValue('NUXT_PUBLIC_AUTH_API_URL', 'http://localhost:3001')).toBe('http://localhost:3001');
    expect(maskValue('PORT', '3001')).toBe('3001');
  });

  it('formats boolean, numeric and string values correctly', () => {
    expect(formatEnvValue('true')).toBe('true');
    expect(formatEnvValue('false')).toBe('false');
    expect(formatEnvValue('3001')).toBe('3001');
    expect(formatEnvValue('hello world')).toBe('"hello world"');
    expect(formatEnvValue('"already_quoted"')).toBe('"already_quoted"');
  });

  it('creates .env from .env.example and updates existing key', () => {
    const target = {
      id: 'test',
      name: 'Test Env',
      envPath: tempEnv,
      examplePath: tempExample
    };

    const res = updateEnvFile(target, 'FOO', 'new_val');
    expect(res.updated).toBe(true);
    expect(res.previousVal).toBe('bar');

    const parsed = parseEnvFile(tempEnv);
    const fooEntry = parsed.find((p: any) => p.key === 'FOO');
    expect(fooEntry.value).toBe('new_val');
  });

  it('appends new key if not present', () => {
    const target = {
      id: 'test',
      name: 'Test Env',
      envPath: tempEnv,
      examplePath: tempExample
    };

    const res = updateEnvFile(target, 'NEW_VAR', 'created');
    expect(res.updated).toBe(false);

    const parsed = parseEnvFile(tempEnv);
    const newEntry = parsed.find((p: any) => p.key === 'NEW_VAR');
    expect(newEntry.value).toBe('created');
  });
});
