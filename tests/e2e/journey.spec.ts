import { test, expect } from '@playwright/test';
import { z } from 'zod';
import { readFile } from 'node:fs/promises';
import { exportSchema } from '../../src/lib/contracts';

const owner = z.object({
  OWNER_EMAIL: z.email(), OWNER_PASSWORD: z.string().min(12)
}).parse(process.env);

test('owner records actuals, independent targets, both conflict decisions and a validated export', async ({ page }, info) => {
  const suffix = info.project.name;
  const gameId = suffix === 'desktop' ? 10000021 : 10000014;
  const characterName = suffix === 'desktop' ? 'Amber' : 'Barbara';
  const materialId = suffix === 'desktop' ? 104003 : 104002;
  const materialName = suffix === 'desktop' ? 'Hero Wit' : 'Adventurer Experience';
  const consoleErrors: string[] = [];
  page.on('pageerror', (error) => consoleErrors.push(error.message));
  async function navigate(label: string) {
    if (info.project.name === 'mobile') {
      const menu = page.getByRole('button', { name: 'Menu', exact: true });
      await expect(menu).toBeEnabled();
      await menu.click();
      await expect(menu).toHaveAttribute('aria-expanded', 'true');
      await page.getByRole('navigation', { name: 'Mobile navigation' })
        .getByRole('link', { name: new RegExp(`^${label}`) }).click();
      await expect(menu).toHaveAttribute('aria-expanded', 'false');
    } else {
      await page.getByRole('navigation', { name: 'Main navigation' })
        .getByRole('link', { name: new RegExp(`^${label}`) }).click();
    }
    await expect(page).toHaveURL(new RegExp(`/${label.toLowerCase()}$`));
  }

  await test.step('sign in through the real owner form', async () => {
    await page.goto('/login');
    await page.getByLabel('Email', { exact: true }).fill(owner.OWNER_EMAIL);
    await page.getByLabel('Password', { exact: true }).fill(owner.OWNER_PASSWORD);
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page).toHaveURL(/\/profile$/);
    await expect(page.getByRole('heading', { name: 'Your traveler profile' })).toBeVisible();
    if (info.project.name === 'mobile') {
      const menu = page.getByRole('button', { name: 'Menu', exact: true });
      await expect(menu).toBeEnabled();
      await menu.click();
      await expect(menu).toHaveAttribute('aria-expanded', 'true');
      await menu.press('Escape');
      await expect(menu).toHaveAttribute('aria-expanded', 'false');
      await expect(menu).toBeFocused();
    }
    await page.screenshot({ path: info.outputPath('profile.png'), fullPage: true });
  });

  await test.step('persist an explicit server and profile', async () => {
    await page.getByLabel('Traveler name', { exact: true }).fill(`Traveler ${suffix}`);
    await page.getByRole('textbox', { name: /^Game UID \(optional\)/ }).fill('');
    await page.getByRole('combobox', { name: 'Server', exact: true }).selectOption('Asia');
    await page.getByRole('button', { name: 'Save profile', exact: true }).click();
    await expect(page.getByRole('status')).toContainText('Profile saved.');
    await page.reload();
    await expect(page.getByLabel('Traveler name', { exact: true })).toHaveValue(`Traveler ${suffix}`);
  });

  await test.step('record owned character actual progression', async () => {
    await navigate('Characters');
    await page.getByRole('button', { name: 'Add character', exact: true }).click();
    const form = page.getByRole('form', { name: 'Add character', exact: true });
    await form.getByLabel('Name', { exact: true }).fill(characterName);
    await form.getByLabel('Game ID', { exact: true }).fill(String(gameId));
    await form.getByLabel('Actual level', { exact: true }).fill('20');
    await form.getByLabel('Actual ascension', { exact: true }).fill('0');
    await form.getByRole('button', { name: 'Add actual record', exact: true }).click();
    await expect(page.getByRole('heading', { name: characterName, exact: true })).toBeVisible();
    await expect(page.getByText('Actual record saved.', { exact: true })).toBeVisible();
    await page.screenshot({ path: info.outputPath('characters.png'), fullPage: true });
  });

  await test.step('keep duplicate weapon instances distinct', async () => {
    await navigate('Weapons');
    await page.getByRole('button', { name: 'Add weapon instance', exact: true }).click();
    const form = page.getByRole('form', { name: 'Add weapon instance', exact: true });
    for (const copy of [1, 2]) {
      await form.getByLabel('Name', { exact: true }).fill(`Favonius Sword ${suffix}`);
      await form.getByLabel('Game ID', { exact: true }).fill('11401');
      await form.getByLabel('Actual level', { exact: true }).fill(String(copy * 10));
      const saved = page.waitForResponse((response) => response.url().endsWith('/api/weapons') && response.request().method() === 'POST');
      await form.getByRole('button', { name: 'Add actual record', exact: true }).click();
      expect((await saved).status()).toBe(200);
      await expect(form.getByRole('button', { name: 'Add actual record', exact: true })).toBeEnabled();
    }
    await expect(page.getByRole('heading', { name: `Favonius Sword ${suffix}`, exact: true })).toHaveCount(2);
  });

  await test.step('record a protected absolute material correction', async () => {
    await navigate('Inventory');
    await page.getByRole('button', { name: 'Add inventory item', exact: true }).click();
    const form = page.getByRole('form', { name: 'Add inventory item', exact: true });
    await form.getByLabel('Name', { exact: true }).fill(materialName);
    await form.getByLabel('Game ID', { exact: true }).fill(String(materialId));
    await form.getByLabel('Actual quantity (absolute total)', { exact: true }).fill('77');
    await form.getByRole('button', { name: 'Add actual record', exact: true }).click();
    await expect(page.getByRole('heading', { name: materialName, exact: true })).toBeVisible();
  });

  await test.step('save a target without updating the actual character', async () => {
    await navigate('Goals');
    await page.getByRole('button', { name: 'Add target', exact: true }).click();
    const form = page.getByRole('form', { name: 'Add target', exact: true });
    for (const name of [`Ascension plan ${suffix}`, `Alternate build ${suffix}`]) {
      await form.getByLabel('Target name', { exact: true }).fill(name);
      await form.getByRole('combobox', { name: /^Character or weapon instance/ }).selectOption({ label: `${characterName} / Lv. 20` });
      await form.getByLabel('Target level', { exact: true }).fill('80');
      await form.getByRole('button', { name: 'Save target', exact: true }).click();
      await expect(form.getByRole('status')).toContainText('Target saved.');
      await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
    }
    const target = page.getByRole('article').filter({ has: page.getByRole('heading', { name: `Ascension plan ${suffix}`, exact: true }) });
    await target.getByRole('button', { name: 'Edit target', exact: true }).click();
    await target.getByLabel('Mark this target completed', { exact: true }).check();
    await target.getByRole('button', { name: 'Save target', exact: true }).click();
    await expect(target.getByText(/^Completed /)).toBeVisible();
    await page.screenshot({ path: info.outputPath('goals.png'), fullPage: true });
    await navigate('Characters');
    const record = page.getByRole('article').filter({ has: page.getByRole('heading', { name: characterName, exact: true }) });
    await expect(record).toContainText('20 / 90');
    await expect(record).toContainText(`Ascension plan ${suffix}`);
  });

  await test.step('resolve both staged observation decisions explicitly', async () => {
    await navigate('Conflicts');
    for (const resolution of ['Keep manual value', 'Accept observation']) {
      const item = page.getByRole('combobox', { name: 'Inventory item', exact: true });
      const value = await item.locator('option').filter({ hasText: materialName }).getAttribute('value');
      expect(value).toBeTruthy();
      await item.selectOption(value ?? '');
      await page.getByLabel('Observed absolute quantity', { exact: true }).fill('20');
      const staged = page.waitForResponse((response) => response.url().endsWith('/api/conflicts/stage'));
      await page.getByRole('button', { name: 'Stage observation', exact: true }).click();
      expect((await staged).status()).toBe(200);
      const button = page.getByRole('button', { name: resolution, exact: true });
      await expect(button).toBeVisible();
      const resolved = page.waitForResponse((response) => response.url().endsWith('/resolve'));
      await button.click();
      expect((await resolved).status()).toBe(200);
      await expect(button).toHaveCount(0);
    }
    await page.screenshot({ path: info.outputPath('conflicts.png'), fullPage: true });
  });

  await test.step('download and validate personal data without secrets', async () => {
    await navigate('Export');
    const downloading = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Generate and download JSON', exact: true }).click();
    const download = await downloading;
    const path = info.outputPath('personal-export.json');
    await download.saveAs(path);
    const text = await readFile(path, 'utf8');
    const exported = exportSchema.parse(JSON.parse(text));
    expect(exported.characters.find((row) => row.gameId === gameId)?.level).toBe(20);
    expect(exported.inventory.find((row) => row.gameId === materialId)?.quantity).toBe(20);
    expect(exported.weapons.filter((row) => row.name === `Favonius Sword ${suffix}`)).toHaveLength(2);
    expect(exported.profile.lastExportGeneratedAt).toBe(exported.generatedAt);
    expect(text).not.toContain(owner.OWNER_EMAIL);
    expect(text).not.toContain(owner.OWNER_PASSWORD);
    await page.screenshot({ path: info.outputPath('export.png'), fullPage: true });
  });
  expect(consoleErrors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await test.step('sign out and reject a protected page', async () => {
    await page.getByRole('button', { name: 'Sign out', exact: true }).click();
    await expect(page).toHaveURL(/\/login$/);
    await page.goto('/characters');
    await expect(page).toHaveURL(/\/login$/);
  });
});
