import { z } from 'zod';
import { exportSchema } from '#lib/contracts.ts';

const apiError = z.object({
  error: z.union([z.string(), z.object({ message: z.string(), code: z.string().optional() })]).optional(),
  message: z.string().optional()
});

export class RequestError extends Error {
  constructor(readonly status: number, message: string, readonly code?: string) {
    super(message);
    this.name = 'RequestError';
  }
}

export async function request(path: string, method = 'GET', body?: unknown): Promise<Response> {
  const response = await fetch(path, {
    method, credentials: 'same-origin',
    headers: body === undefined ? {} : { 'content-type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });
  if (!response.ok) {
    const parsed = apiError.safeParse(await response.json().catch(() => null));
    const error = parsed.success ? parsed.data.error : undefined;
    throw new RequestError(response.status,
      response.status === 401 ? (path === '/api/auth/sign-in/email'
        ? 'Email or password is incorrect.'
        : 'Your session has ended. Sign in again; your entered values remain here.') :
        typeof error === 'string' ? error :
          error?.message ?? (parsed.success ? parsed.data.message : undefined) ?? 'The request failed. Your entered values are preserved.',
      typeof error === 'object' ? error.code : undefined);
  }
  return response;
}

export async function loadState() {
  return exportSchema.parse(await (await request('/api/state')).json());
}

export function messageFor(error: unknown): string {
  return error instanceof Error ? error.message : 'The request failed. Please try again.';
}

export function timestamp(value: string): string {
  return new Date(value).toLocaleString('en-GB', {
    timeZone: 'UTC', dateStyle: 'medium', timeStyle: 'short'
  }) + ' UTC';
}
