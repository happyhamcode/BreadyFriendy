import { test, expect } from '@playwright/test';

const open = async (page, enrichers = []) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Build my dough' }).first().click();
  for (const e of enrichers) await page.locator(`.picks input[value=${e}]`).check();
  await page.locator('#to-calc').click();
};
const val = (page, id) => page.locator(`#in-${id}`).inputValue();

test('home has explanation, no sourdough, button opens picker', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'What is hydration?' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'What is enriched dough?' })).toBeVisible();
  expect((await page.content()).toLowerCase()).not.toContain('sourdough');
  await page.getByRole('button', { name: 'Build my dough' }).first().click();
  await expect(page.locator('#picker')).toBeVisible();
  await expect(page.locator('.picks input')).toHaveCount(9);
});

test('Enter fills blanks: flour + hydration solves water', async ({ page }) => {
  await open(page);
  await page.fill('#in-flour', '500'); await page.fill('#in-hydration', '65');
  await page.press('#in-hydration', 'Enter');
  expect(await val(page, 'water')).toBe('325');
  expect(await val(page, 'salt')).toBe('10');
  await expect(page.locator('#hydration-line')).toContainText('65.0%');
  await expect(page.locator('#in-water')).toHaveClass(/auto/);
});

test('hydration only: even split across liquids, flour defaults', async ({ page }) => {
  await open(page, ['milk', 'egg']);
  await page.fill('#in-hydration', '65'); await page.press('#in-hydration', 'Enter');
  expect(await val(page, 'flour')).toBe('500');
  expect(await val(page, 'water')).toBe(await val(page, 'milk'));
  expect(await val(page, 'milk')).toBe(await val(page, 'egg'));
  await expect(page.locator('#hydration-line')).toContainText('65.0%');
});

test('re-Enter after editing flour recomputes calculated fields', async ({ page }) => {
  await open(page);
  await page.fill('#in-flour', '500'); await page.fill('#in-hydration', '65'); await page.press('#in-hydration', 'Enter');
  await page.fill('#in-flour', '1000'); await page.press('#in-flour', 'Enter');
  expect(await val(page, 'water')).toBe('650');
  expect(await val(page, 'salt')).toBe('20');
});

test('reverse mode reports hydration into the field', async ({ page }) => {
  await open(page);
  await page.fill('#in-flour', '500'); await page.fill('#in-water', '300'); await page.press('#in-water', 'Enter');
  expect(await val(page, 'hydration')).toBe('60');
  await page.fill('#in-water', '350'); await page.press('#in-water', 'Enter');
  expect(await val(page, 'hydration')).toBe('70');
});

test('errors: nothing entered, conflict, enrichers too wet, junk', async ({ page }) => {
  await open(page, ['milk']);
  await page.press('#in-flour', 'Enter');
  await expect(page.locator('#msg')).toContainText(/flour/i);
  await page.fill('#in-flour', '500'); await page.press('#in-flour', 'Enter');
  await expect(page.locator('#msg')).toContainText(/water/i);
  await expect(page.locator('#in-water')).toHaveAttribute('aria-invalid', 'true');
  await page.fill('#in-water', '300'); await page.fill('#in-milk', '100'); await page.fill('#in-hydration', '50');
  await page.press('#in-hydration', 'Enter');
  await expect(page.locator('#msg')).toContainText(/give 77\.6% hydration/);
  await page.fill('#in-flour', '100'); await page.fill('#in-water', ''); await page.fill('#in-milk', '200');
  await page.fill('#in-hydration', '60'); await page.press('#in-hydration', 'Enter');
  await expect(page.locator('#msg')).toContainText(/already contain/);
  await page.fill('#in-flour', 'abc'); await page.press('#in-flour', 'Enter');
  await expect(page.locator('#msg')).toContainText(/number/);
  await page.fill('#in-flour', '-5'); await page.press('#in-flour', 'Enter');
  await expect(page.locator('#msg')).toContainText(/number/);
  await page.fill('#in-flour', '0'); await page.press('#in-flour', 'Enter');
  await expect(page.locator('#msg')).toContainText(/more than 0/);
  await expect(page.locator('#results')).toBeHidden();
});

test('convert widget fills grams', async ({ page }) => {
  await open(page, ['egg', 'butter']);
  await page.locator('[aria-controls=conv-flour]').click();
  await page.locator('#conv-flour input').fill('4'); await page.locator('#conv-flour select').selectOption('cup');
  await page.locator('#conv-flour button').click();
  expect(await val(page, 'flour')).toBe('480');
  await page.locator('[aria-controls=conv-egg]').click();
  await page.locator('#conv-egg input').fill('2'); await page.locator('#conv-egg select').selectOption('egg');
  await page.locator('#conv-egg button').click();
  expect(await val(page, 'egg')).toBe('100');
  await page.locator('[aria-controls=conv-butter]').click();
  await page.locator('#conv-butter input').fill('1/2'); await page.locator('#conv-butter select').selectOption('stick');
  await page.locator('#conv-butter button').click();
  expect(await val(page, 'butter')).toBe('56.5');
  await page.locator('[aria-controls=conv-flour]').click();
  await page.locator('#conv-flour input').fill('2/0'); await page.locator('#conv-flour button').click();
  await expect(page.locator('#conv-flour .conv-msg')).toContainText(/Enter an amount/);
});

test('yeast type changes default and shows equivalents', async ({ page }) => {
  await open(page);
  await page.selectOption('#yeast-type', 'fresh');
  await page.fill('#in-flour', '1000'); await page.fill('#in-hydration', '65'); await page.press('#in-hydration', 'Enter');
  expect(await val(page, 'yeast')).toBe('30');
  await expect(page.locator('#yeast-eq')).toContainText('Instant 10.0 g');
  expect(await val(page, 'water')).toBe('629');
});

test('scale and share link round trip', async ({ page, context }) => {
  await open(page, ['egg']);
  await page.fill('#in-flour', '500'); await page.fill('#in-egg', '100'); await page.fill('#in-hydration', '65');
  await page.press('#in-hydration', 'Enter');
  await page.fill('#scale-total', '1000'); await page.locator('#scale-form button[type=submit]').click();
  await expect(page.locator('#total')).toHaveText('1000 g');
  await page.fill('#scale-total', '-1'); await page.locator('#scale-form button[type=submit]').click();
  await expect(page.locator('#scale-msg')).toContainText(/positive/);
  await page.locator('#share').click();
  const url = await page.locator('#share-url').inputValue();
  expect(url).toContain('egg=100');
  const p2 = await context.newPage(); await p2.goto(url);
  await expect(p2.locator('#calc')).toBeVisible();
  await expect(p2.locator('#hydration-line')).toContainText('65.0%');
  expect(await p2.locator('#in-egg').inputValue()).toBe('100');
  const bad = await context.newPage(); await bad.goto('/?yt=x&h=abc&flour=1e9&egg=');
  await expect(bad.locator('#msg')).not.toHaveText('');
});

test('mobile: no horizontal scroll on any screen', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 700 });
  const overflow = () => page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  await page.goto('/'); expect(await overflow()).toBe(false);
  await open(page, ['egg', 'yolk', 'milk', 'cream', 'butter', 'oil', 'sugar', 'honey', 'milkpowder']);
  expect(await overflow()).toBe(false);
  await page.fill('#in-hydration', '65'); await page.press('#in-hydration', 'Enter');
  expect(await overflow()).toBe(false);
});

test('dark mode renders', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(bg).toBe('rgb(18, 38, 58)');
});
