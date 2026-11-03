import { spyOn } from 'storybook/test';
import { sampleState } from './fixtures.ts';

// A browser HTTP seam only: real components still parse contracts, submit forms,
// retain their drafts, and execute the stale-review workflow.
export function mockApi(scenario: 'saved' | 'stale' | 'duplicate' | 'failed' = 'saved') {
  let mutations = 0;
  const latest = {
    ...sampleState,
    inventory: sampleState.inventory.map((record) => ({ ...record, quantity: 130000, revision: 4 }))
  };
  const fetchMock = spyOn(window, 'fetch').mockImplementation(async (input, init) => {
    const path = input instanceof Request ? new URL(input.url).pathname : new URL(String(input), window.location.origin).pathname;
    if (path === '/api/state') return Response.json(latest);
    mutations++;
    if (scenario === 'stale' && mutations === 1) {
      return Response.json({ error: { code: 'STALE_REVISION', message: 'This record changed in another session.' } }, { status: 409 });
    }
    if (scenario === 'duplicate') {
      return Response.json({ error: { code: 'DUPLICATE', message: 'This game ID already exists.' } }, { status: 409 });
    }
    if (scenario === 'failed') {
      return Response.json({ error: { code: 'INTERNAL_ERROR', message: 'The request failed. Your last saved data is preserved.' } }, { status: 500 });
    }
    if (path === '/api/auth/sign-in/email') return Response.json({ error: { message: 'Check your email and password.' } }, { status: 401 });
    if (!init?.body) return Response.json({ error: { code: 'VALIDATION_ERROR', message: 'Missing body.' } }, { status: 422 });
    return Response.json({ saved: true });
  });
  return () => fetchMock.mockRestore();
}
