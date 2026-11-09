import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

test('static roster, one persisted build, artifact modes and profile progression',async({page},info)=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/login');
  await page.getByLabel('Email',{exact:true}).fill(process.env.OWNER_EMAIL??'');
  await page.getByLabel('Password',{exact:true}).fill(process.env.OWNER_PASSWORD??'');
  await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await expect(page).toHaveURL(/\/profile$/);
  await page.goto('/characters');
  await expect(page.getByRole('button',{name:'Add character',exact:true})).toHaveCount(0);
  await page.getByRole('searchbox',{name:'Search characters',exact:true}).fill('Traveler');
  await expect(page.getByRole('article')).toHaveCount(7);
  await expect(page.getByRole('article',{name:'Traveler (Anemo)',exact:true})).toHaveCount(1);
  await expect(page.getByRole('article',{name:'Aether',exact:true})).toHaveCount(0);
  await page.getByRole('searchbox',{name:'Search characters',exact:true}).fill('Furina');
  const row=page.getByRole('article',{name:'Furina',exact:true});
  if(!await row.getByRole('switch').isChecked()){await row.getByRole('switch').click();await expect(row.getByRole('switch')).toBeChecked();await expect(row.getByRole('switch')).toBeEnabled();}
  await row.getByRole('button',{name:/Choose weapon:/}).click();
  let dialog=page.getByRole('dialog',{name:'Choose weapon',exact:true});
  await dialog.getByRole('searchbox').fill('Fleuve Cendre');
  await dialog.getByRole('button',{name:'Fleuve Cendre Ferryman',exact:true}).click();
  await row.getByRole('button',{name:/Choose artifacts:/}).click();
  dialog=page.getByRole('dialog',{name:'Choose artifacts',exact:true});
  await dialog.getByRole('button',{name:'4 pieces',exact:true}).click();
  await dialog.getByRole('searchbox').fill("Silken Moon's Serenade");
  await expect(dialog.getByRole('button',{name:"Silken Moon's Serenade",exact:true})).toBeVisible();
  await dialog.getByRole('searchbox').fill('Golden Troupe');
  await dialog.getByRole('button',{name:'Golden Troupe',exact:true}).click();
  await row.getByLabel('Sands main stat',{exact:true}).selectOption({label:'HP%'});
  await expect(row.getByLabel('Sands main stat').locator('option')).not.toContainText(['CRIT Rate']);
  await row.getByLabel('Goblet main stat',{exact:true}).selectOption({label:'Hydro DMG Bonus'});
  await row.getByLabel('Circlet main stat',{exact:true}).selectOption({label:'CRIT Rate'});
  await row.getByRole('button',{name:'Save build',exact:true}).click();
  await expect(row.getByRole('button',{name:'Save build',exact:true})).toHaveCount(0);
  await page.reload();await page.getByRole('searchbox',{name:'Search characters',exact:true}).fill('Furina');
  await expect(row.getByLabel('Sands main stat')).toHaveValue('HP%');
  if(info.project.name==='desktop'){
    await row.getByRole('button',{name:/Choose weapon:/}).hover();
    await expect(page.getByRole('tooltip').filter({hasText:'Fleuve Cendre Ferryman'})).toBeVisible();
    await page.screenshot({path:'.impeccable/review/weapon-hover-desktop.png',fullPage:true});
    await page.keyboard.press('Escape');
  }
  await row.getByRole('button',{name:/Choose artifacts:/}).click();
  dialog=page.getByRole('dialog',{name:'Choose artifacts',exact:true});
  await dialog.getByRole('button',{name:'2 pieces + 2 pieces',exact:true}).click();
  await dialog.screenshot({path:`.impeccable/review/effects-${info.project.name}.png`});
  await dialog.getByRole('searchbox').fill('HP +20%');
  await dialog.locator('.effect-choice').filter({hasText:'HP +20%'}).click();
  await dialog.locator('.effect-choice').filter({hasText:'HP +20%'}).click();
  await dialog.getByRole('button',{name:'Use these effects',exact:true}).click();
  await row.getByRole('button',{name:'Save build',exact:true}).click();
  await expect(row.getByRole('button',{name:'Save build',exact:true})).toHaveCount(0);
  await row.getByRole('link',{name:'Open Furina profile',exact:true}).click();
  await page.getByLabel('Actual level',{exact:true}).fill('80');
  await page.getByRole('combobox',{name:'Ascension',exact:true}).selectOption('6');
  await page.getByLabel('Normal attack',{exact:true}).fill('6');
  await page.getByLabel('Elemental skill',{exact:true}).fill('9');
  await page.getByLabel('Elemental burst',{exact:true}).fill('10');
  await page.getByRole('button',{name:'Save progression',exact:true}).click();
  await expect(page.getByText('Progression saved.',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Weapon & artifacts',exact:true}).click();
  await page.getByLabel('Weapon level',{exact:true}).fill('80');
  await page.getByRole('combobox',{name:'Weapon ascension',exact:true}).selectOption('6');
  await page.getByRole('combobox',{name:'Refinement',exact:true}).selectOption('5');
  if(await page.getByRole('button',{name:'Save build',exact:true}).count()){await page.getByRole('button',{name:'Save build',exact:true}).click();await expect(page.getByRole('button',{name:'Save build',exact:true})).toHaveCount(0);}
  await page.reload();await expect(page.getByLabel('Actual level',{exact:true})).toHaveValue('80');
  await mkdir('.impeccable/review',{recursive:true});
  await page.getByRole('heading',{name:'Furina',exact:true}).click();
  await page.screenshot({path:`.impeccable/review/profile-${info.project.name}.png`,fullPage:true});
  await page.goto('/characters');await page.getByRole('combobox',{name:'Ownership',exact:true}).selectOption('owned');
  await page.screenshot({path:`.impeccable/review/${info.project.name}.png`,fullPage:true});
  if(info.project.name==='desktop'){await page.setViewportSize({width:1860,height:932});await page.screenshot({path:'.impeccable/review/user-1860.png',fullPage:true});await page.setViewportSize({width:1280,height:720});}
  if(info.project.name==='mobile'){await row.getByLabel('Sands main stat').selectOption({label:'Elemental Mastery'});await row.getByLabel('Goblet main stat').selectOption({label:'Physical DMG Bonus'});await row.getByLabel('Circlet main stat').selectOption({label:'Healing Bonus'});await page.screenshot({path:'.impeccable/review/mobile-long-stats.png',fullPage:true});await row.getByRole('button',{name:'Reset',exact:true}).click();}
  await row.getByRole('switch').click();await expect(row).toHaveCount(0);
  await page.getByRole('combobox',{name:'Ownership',exact:true}).selectOption('all');await page.getByRole('searchbox',{name:'Search characters',exact:true}).fill('Furina');
  await expect(row).toContainText('Fleuve Cendre Ferryman');await row.getByRole('switch').click();await expect(row).toContainText('Lv. 80');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
