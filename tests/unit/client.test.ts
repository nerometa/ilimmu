import { afterEach, describe, expect, it, vi } from 'vitest';
import { request } from '../../src/lib/client';

afterEach(() => vi.unstubAllGlobals());

describe('request authentication errors', () => {
  it('explains rejected credentials without claiming a session expired', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({
      code: 'INVALID_EMAIL_OR_PASSWORD', message: 'Invalid email or password'
    }, { status: 401 })));

    await expect(request('/api/auth/sign-in/email', 'POST', {
      email: 'owner@example.test', password: 'incorrect-password'
    })).rejects.toMatchObject({ status: 401, message: 'Email or password is incorrect.' });
  });

  it('still explains expired sessions on protected account requests', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({
      error: 'Unauthorized'
    }, { status: 401 })));

    await expect(request('/api/state')).rejects.toMatchObject({
      status: 401,
      message: 'Your session has ended. Sign in again; your entered values remain here.'
    });
  });
});
