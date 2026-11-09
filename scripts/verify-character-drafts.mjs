// Run against the existing Vite preview. Every write is intercepted in-browser.
import { chromium, expect } from '@playwright/test';
import { z } from 'zod';
import { sampleState } from '../.storybook/fixtures.ts';
import { fileURLToPath } from 'node:url';

const browser = await chromium.launch({ args: ['--no-sandbox'] });
const page = await browser.newPage();
/** @type {{revision: number; owned?: boolean}[]} */
const writes = [];
/** @type {string[]} */
const errors = [];
page.on('pageerror', error => errors.push(error.message));
await page.route('**/api/**', async route => {
  if (['GET', 'HEAD'].includes(route.request().method())) return route.continue();
  writes.push(z.object({ revision: z.number(), owned: z.boolean().optional() }).parse(route.request().postDataJSON()));
  await route.fulfill({ status: 409, json: { error: { code: 'STALE_REVISION', message: 'A newer value is saved. Reset to load it.' } } });
});
await page.route('**/game/characters-999999.png', route => route.fulfill({ status: 404, body: '' }));
await page.route('**/game/characters-10000089.png', route => route.fulfill({
  contentType: 'image/png', path: fileURLToPath(new URL('../static/game/characters-10000089.png', import.meta.url))
}));

/** @param {'build' | 'progression' | 'roster' | 'image'} mode */
async function render(mode) {
  await page.goto(`${process.env.QA_BASE_URL ?? 'http://localhost:4173'}/login`);
  await page.waitForLoadState('networkidle');
  const componentUrl = '/src/lib/testing/CharacterReviewHarness.svelte';
  await page.evaluate(async ({ mode, state, componentUrl }) => {
    const legacyUrl = '/node_modules/svelte/src/legacy/legacy-client.js';
    const { createClassComponent } = await import(legacyUrl);
    const { default: component } = await import(componentUrl);
    const target = document.createElement('section');
    document.body.appendChild(target);
    createClassComponent({ component, target, props: { mode, state } });
  }, { mode, state: sampleState, componentUrl });
}

try {
  await render('build');
  await page.getByLabel('Sands main stat', { exact: true }).selectOption('ATK%');
  await page.getByRole('button', { name: 'Load newer saved values' }).click();
  await page.getByRole('button', { name: 'Save build', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('A newer value is saved.');
  expect(writes.at(-1)).toMatchObject({ revision: 0 });
  await expect(page.getByLabel('Sands main stat', { exact: true })).toHaveValue('ATK%');
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(page.getByLabel('Sands main stat', { exact: true })).toHaveValue('DEF%');
  await page.getByLabel('Sands main stat', { exact: true }).selectOption('HP%');
  await page.getByRole('button', { name: 'Save build', exact: true }).click();
  await expect.poll(() => writes.length).toBe(2);
  expect(writes.at(-1)).toMatchObject({ revision: 1 });

  await render('progression');
  await page.getByLabel('Actual level', { exact: true }).fill('30');
  await page.getByRole('button', { name: 'Load newer saved values' }).click();
  await page.getByRole('button', { name: 'Save progression', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('A newer value is saved.');
  expect(writes.at(-1)).toMatchObject({ revision: 0, owned: true });
  await expect(page.getByLabel('Actual level', { exact: true })).toHaveValue('30');
  await page.getByRole('button', { name: 'Reset progression', exact: true }).click();
  await expect(page.getByLabel('Actual level', { exact: true })).toHaveValue('40');
  await page.getByRole('button', { name: 'Save progression', exact: true }).click();
  await expect.poll(() => writes.length).toBe(4);
  expect(writes.at(-1)).toMatchObject({ revision: 1, owned: false });

  await render('roster');
  const search = page.getByRole('searchbox', { name: 'Search characters', exact: true });
  await search.fill('Keqing');
  await page.getByRole('article', { name: 'Keqing', exact: true }).getByLabel('Sands main stat').selectOption('ATK%');
  await search.fill('Fischl');
  await search.fill('Keqing');
  await expect(page.getByRole('article', { name: 'Keqing', exact: true }).getByLabel('Sands main stat')).toHaveValue('ATK%');

  await render('image');
  await expect(page.getByText('—', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Load working image' }).click();
  const restoredImage = page.locator('img[src="/game/characters-10000089.png"]');
  await expect(restoredImage).toBeVisible();
  await expect.poll(() => restoredImage.evaluate(node => node instanceof HTMLImageElement ? node.naturalWidth : 0)).toBeGreaterThan(0);
  expect(errors).toEqual([]);
  console.log('Verified original draft revisions, filter draft retention, reset recovery, and image recovery. All four writes were intercepted.');
} finally {
  await browser.close();
}
