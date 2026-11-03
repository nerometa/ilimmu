import { defineConfig, devices } from '@playwright/test';
import { z } from 'zod';

process.env.OWNER_EMAIL ??= 'owner@example.test';
process.env.OWNER_PASSWORD ??= crypto.randomUUID();
process.env.QA_DATABASE_NAME ??= `companion_e2e_${crypto.randomUUID().replaceAll('-', '')}`;
const database = new URL(z.url().parse(process.env.DATABASE_URL));
if (!['127.0.0.1', 'localhost', '[::1]'].includes(database.hostname)) {
  throw new Error('Browser QA requires a local PostgreSQL server, never a remote production database.');
}
database.pathname = `/${process.env.QA_DATABASE_NAME}`;
process.env.DATABASE_URL = database.toString();
process.env.QA_DISPOSABLE_DATABASE = 'true';
const baseURL = process.env.QA_BASE_URL ?? 'http://127.0.0.1:4173';
process.env.QA_BASE_URL = baseURL;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    actionTimeout: 10000,
    baseURL, trace: 'retain-on-failure', screenshot: 'only-on-failure',
    launchOptions: {
      args: ['--no-sandbox'],
      ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {})
    }
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', testIgnore: 'security.spec.ts', use: { ...devices['Pixel 7'] } }
  ],
  webServer: {
    command: 'bun scripts/e2e-server.ts',
    url: `${baseURL}/api/health`,
    reuseExistingServer: false,
    gracefulShutdown: { signal: 'SIGTERM', timeout: 10000 },
    timeout: 30000
  }
});
