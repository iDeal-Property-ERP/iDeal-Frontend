import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const script = fileURLToPath(new URL('../../scripts/validate-production-env.mjs', import.meta.url));
const validEnvironment = {
  BACKEND_ORIGIN: 'http://backend:8000',
  NEXT_PUBLIC_API_URL: 'https://api.example.com/api/v1',
  NEXT_PUBLIC_APP_URL: 'https://example.com',
};

function validate(overrides: Record<string, string | undefined> = {}) {
  return spawnSync(process.execPath, [script], {
    env: { ...process.env, ...validEnvironment, ...overrides },
    encoding: 'utf-8',
  });
}

describe('production environment validator', () => {
  it('accepts explicit production build URLs', () => {
    expect(validate().status).toBe(0);
  });

  it('rejects missing production build URLs', () => {
    const result = validate({ BACKEND_ORIGIN: undefined });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('BACKEND_ORIGIN is required');
  });

  it('rejects loopback production URLs', () => {
    const result = validate({ NEXT_PUBLIC_API_URL: 'http://127.0.0.1:8000/api/v1' });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('NEXT_PUBLIC_API_URL must not use a loopback host');
  });

  it('rejects backend paths', () => {
    const result = validate({ BACKEND_ORIGIN: 'http://backend:8000/api' });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('BACKEND_ORIGIN must not include a path');
  });
});
