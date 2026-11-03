import { redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit/hooks';
import { auth } from '#lib/server/account/auth.ts';

export const handle: Handle = async ({ event, resolve }) => {
  const path = event.url.pathname;
  const publicRoute = path === '/login' || path === '/api/health' || path.startsWith('/api/auth/');
  const session = await auth.api.getSession({ headers: event.request.headers });
  event.locals.ownerId = session?.user.id ?? null;
  if (!publicRoute && !event.locals.ownerId) {
    if (path.startsWith('/api/')) {
      return Response.json({ error: { code: 'UNAUTHORIZED', message: 'Sign in to continue.' } }, { status: 401 });
    }
    redirect(303, '/login');
  }
  if (path.startsWith('/api/') && !path.startsWith('/api/auth/') &&
      !['GET', 'HEAD', 'OPTIONS'].includes(event.request.method) &&
      event.request.headers.get('origin') !== event.url.origin) {
    return Response.json({ error: { code: 'FORBIDDEN', message: 'Same-origin request required.' } }, { status: 403 });
  }
  const response = await resolve(event);
  response.headers.set('x-content-type-options', 'nosniff');
  response.headers.set('x-frame-options', 'DENY');
  response.headers.set('referrer-policy', 'same-origin');
  response.headers.set('cache-control', 'no-store');
  if (event.url.protocol === 'https:') {
    response.headers.set('strict-transport-security', 'max-age=31536000');
  }
  return response;
};
