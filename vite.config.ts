import adapter from '@sveltejs/adapter-bun';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { z } from 'zod';

export default defineConfig(({ command }) => {
  // Kit 3 adapters use paths.origin, not the old runtime ORIGIN setting.
  const origin = command === 'build'
    ? z.url().refine((value) => new URL(value).origin === value, {
        message: 'ORIGIN must be an exact public origin without a trailing slash or path.'
      }).parse(process.env.ORIGIN)
    : undefined;
  return {
    plugins: [tailwindcss(), sveltekit({ adapter: adapter(), paths: { origin } })]
  };
});
