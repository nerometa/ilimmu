import { describe, expect, it } from 'vitest';
import { developmentOrigins } from '../../src/lib/server/account/origins';

describe('local development origins', () => {
  it('trusts both loopback names on only the configured port', () => {
    expect(developmentOrigins('http://127.0.0.1:4173', 'development')).toEqual([
      'http://localhost:4173', 'http://127.0.0.1:4173'
    ]);
  });
  it('adds no origins in production or for a non-loopback development URL', () => {
    expect(developmentOrigins('http://127.0.0.1:4173', 'production')).toEqual([]);
    expect(developmentOrigins('https://companion.example', 'development')).toEqual([]);
  });
});
