import { test, expect } from '@playwright/test';

const open = async (page, type = 'butter', extras = []) => {
  await page.goto('/cake/');
  await page.getByRole('button', { name: 'Build my cake' }).first().click();
  await page.locator(`.picks.types input[value=${type}]`).check();
  for (const e of extras) await page.locator(`.picks.extras input[value=${e}]`).check();
  await page.locator('#to-calc').click();
};
const val = (page, id) => page.locator(`#in-${id}`).inputValue();

test('home explains baker\'s percentage, lists four types, no forbidden words, opens the picker', async ({ page }) => {
  await page.goto('/cake/');
  await expect(page.getByRole('heading', { name: "What is a baker's percentage?" })).toBeVisible();
  await expect(page.locator('#type-cards .enricher')).toHaveCount(4);
  expect((await page.content()).toLowerCase()).not.toMatch(/sourdough|levain|starter culture/);
  await page.getByRole('button', { name: 'Build my cake' }).first().click();
  await expect(page.locator('#picker')).toBeVisible();
  await expect(page.locator('.picks.types input')).toHaveCount(4);
  await page.locator('.picks.types input[value=chiffon]').check();
  await expect(page.locator('.picks.extras input')).toHaveCount(2); // cocoa, milk
  await page.locator('.picks.types input[value=butter]').check();
  await expect(page.locator('.picks.extras input')).toHaveCount(5);
});

test('flour given: Enter fills every blank with the type\'s recommended amounts', async ({ page }) => {
  await open(page);
  await page.fill('#in-flour', '250'); await page.press('#in-flour', 'Enter');
  expect(await val(page, 'butter')).toBe('125'); expect(await val(page, 'sugar')).toBe('275');
  expect(await val(page, 'egg')).toBe('125'); expect(await val(page, 'milk')).toBe('175');
  expect(await val(page, 'bakingpowder')).toBe('11.3');
  await expect(page.locator('#in-sugar')).toHaveClass(/auto/);
  await expect(page.locator('#ratio-line')).toContainText('110% sugar');
  await expect(page.locator('#total')).not.toHaveText('');
  await expect(page.locator('#warnings li')).toHaveCount(0);
});

test('flour blank: solved from the first ingredient you fill in', async ({ page }) => {
  await open(page);
  await page.fill('#in-egg', '100'); await page.press('#in-egg', 'Enter');
  expect(await val(page, 'flour')).toBe('200'); expect(await val(page, 'butter')).toBe('100');
  await expect(page.locator('#in-flour')).toHaveClass(/auto/);
  await page.fill('#in-flour', '400'); await page.press('#in-flour', 'Enter'); // editing flour rescales the rest
  expect(await val(page, 'butter')).toBe('200');
});

test('empty form: 250 g flour with a notice; pound cake is 1:1:1:1', async ({ page }) => {
  await open(page, 'pound');
  await page.press('#in-flour', 'Enter');
  expect(await val(page, 'flour')).toBe('250');
  for (const id of ['butter', 'sugar', 'egg']) expect(await val(page, id)).toBe('250');
  await expect(page.locator('#warnings')).toContainText('250 g flour');
  await expect(page.locator('#in-milk')).toHaveCount(0);
});

test('errors are clear and focus the field; balance warnings show', async ({ page }) => {
  await open(page);
  await page.fill('#in-sugar', '-5'); await page.press('#in-sugar', 'Enter');
  await expect(page.locator('#msg')).toContainText('enter a number'); await expect(page.locator('#in-sugar')).toHaveAttribute('aria-invalid', 'true');
  await page.fill('#in-sugar', 'abc'); await page.press('#in-sugar', 'Enter');
  await expect(page.locator('#msg')).toContainText('enter a number');
  await page.fill('#in-sugar', '60000'); await page.press('#in-sugar', 'Enter');
  await expect(page.locator('#msg')).toContainText('50 kg');
  await page.fill('#in-sugar', '50'); await page.fill('#in-flour', '200'); await page.press('#in-flour', 'Enter');
  await expect(page.locator('#msg')).toHaveText('');
  await expect(page.locator('#warnings')).toContainText('at least as much sugar as flour');
});

test('extras add rows; baking soda needs an acid; Change cake keeps typed values', async ({ page }) => {
  await open(page, 'butter', ['bakingsoda']);
  await expect(page.locator('#in-bakingsoda')).toBeVisible();
  await page.fill('#in-flour', '250'); await page.press('#in-flour', 'Enter');
  await expect(page.locator('#warnings')).toContainText('needs an acid');
  await page.locator('#change-cake').click();
  await expect(page.locator('#picker')).toBeVisible();
  await expect(page.locator('.picks.types input[value=butter]')).toBeChecked();
  await expect(page.locator('.picks.extras input[value=bakingsoda]')).toBeChecked();
  await page.locator('.picks.extras input[value=buttermilk]').check(); await page.locator('#to-calc').click();
  expect(await val(page, 'flour')).toBe('250');
  await page.press('#in-flour', 'Enter');
  await expect(page.locator('#warnings')).not.toContainText('needs an acid');
});

test('info tooltip explains an extra', async ({ page }) => {
  await open(page, 'butter'); await page.locator('#change-cake').click();
  await page.getByRole('button', { name: 'About Cocoa (natural)' }).click();
  await expect(page.locator('#tip-cocoa')).toBeVisible(); await expect(page.locator('#tip-cocoa')).toContainText('acidic');
  await page.keyboard.press('Escape'); await page.mouse.move(0, 0);
  await expect(page.locator('#tip-cocoa')).toBeHidden();
});

test('convert widget fills grams (cocoa half cup = 42 g)', async ({ page }) => {
  await open(page, 'butter', ['cocoa']);
  await page.locator('#in-cocoa').locator('xpath=..').locator('.conv-toggle').click();
  await page.locator('#conv-cocoa input').fill('1/2'); await page.locator('#conv-cocoa select').selectOption('cup');
  await page.locator('#conv-cocoa button').click();
  expect(await val(page, 'cocoa')).toBe('42');
  await page.locator('#in-cocoa').locator('xpath=..').locator('.conv-toggle').click();
  await page.locator('#conv-cocoa input').fill('x'); await page.locator('#conv-cocoa button').click();
  await expect(page.locator('#conv-cocoa .conv-msg')).toContainText('Enter an amount');
});

test('pan scaling, multiplier, reset and errors', async ({ page }) => {
  await open(page);
  await page.fill('#in-flour', '200'); await page.press('#in-flour', 'Enter');
  const total0 = await page.locator('#total').textContent();
  await page.fill('#pan-from-a', '8'); await page.fill('#pan-to-a', '9');
  await page.locator('#pan-form button[type=submit]').click();
  await expect(page.locator('#results-body tr').first()).toContainText('253'); // 200 x 81/64
  await expect(page.locator('#warnings')).toContainText('Bake time');
  await page.locator('#scale-reset').click();
  await expect(page.locator('#total')).toHaveText(total0);
  await page.locator('#pan-to-shape').selectOption('rect'); await expect(page.locator('#pan-to-b')).toBeVisible();
  await page.fill('#pan-from-a', '8'); await page.locator('#pan-from-shape').selectOption('square');
  await page.fill('#pan-to-a', '9'); await page.fill('#pan-to-b', '13');
  await page.locator('#pan-form button[type=submit]').click();
  await expect(page.locator('#results-body tr').first()).toContainText('366'); // 200 x 117/64
  await page.fill('#pan-to-a', ''); await page.locator('#pan-form button[type=submit]').click();
  await expect(page.locator('#scale-msg')).toContainText('pan sizes');
  await page.fill('#mult', '1/2'); await page.locator('#mult-form button[type=submit]').click();
  await expect(page.locator('#results-body tr').first()).toContainText('100');
  await page.fill('#mult', '0'); await page.locator('#mult-form button[type=submit]').click();
  await expect(page.locator('#scale-msg')).toContainText('positive');
});

test('recipe shows kitchen measures as fractions, never decimals', async ({ page }) => {
  await open(page);
  await page.fill('#in-flour', '250'); await page.press('#in-flour', 'Enter');
  const text = await page.locator('#results-body .src').allTextContents();
  expect(text.join('|')).toMatch(/eggs?/); expect(text.join('|')).toMatch(/tsp/);
  for (const t of text) expect(t).not.toMatch(/\d\.\d/);
});

test('share link round trip, tampered link, and brand link goes up to the site home', async ({ page, context }) => {
  await open(page);
  await page.fill('#in-flour', '250'); await page.fill('#in-egg', '100'); await page.press('#in-egg', 'Enter');
  await page.locator('#share').click();
  const url = await page.locator('#share-url').inputValue();
  expect(url).toContain('/cake/?t=butter'); expect(url).toContain('egg=100');
  const p2 = await context.newPage(); await p2.goto(url);
  await expect(p2.locator('#calc')).toBeVisible();
  expect(await p2.locator('#in-egg').inputValue()).toBe('100'); expect(await p2.locator('#in-butter').inputValue()).toBe('125');
  const bad = await context.newPage(); await bad.goto('/cake/?t=butter&flour=1e9&egg=');
  await expect(bad.locator('#msg')).not.toHaveText('');
  const junk = await context.newPage(); await junk.goto('/cake/?t=zzz&flour=5');
  await expect(junk.locator('#home')).toBeVisible();
  await expect(page.locator('.brand')).toHaveAttribute('href', '../');
});

test('dark mode renders', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/cake/');
  expect(await page.evaluate(() => getComputedStyle(document.querySelector('.paper')).backgroundColor)).toBe('rgb(20, 40, 60)');
});

for (const [name, w, h] of [['phone', 375, 700], ['small phone', 320, 640], ['tablet', 820, 1100], ['laptop', 1280, 800], ['wide', 1920, 1080]]) {
  test(`cake ${name} ${w}px: every screen fits, desktop shows results beside the form`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    const overflow = () => page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    await page.goto('/cake/'); expect(await overflow()).toBe(false);
    await page.getByRole('button', { name: 'Build my cake' }).first().click(); expect(await overflow()).toBe(false);
    await page.getByRole('button', { name: 'About Cocoa (natural)' }).click(); expect(await overflow()).toBe(false);
    await page.mouse.move(0, 0); await page.keyboard.press('Escape');
    for (const e of ['buttermilk', 'sourcream', 'cocoa', 'bakingsoda', 'oil']) await page.locator(`.picks.extras input[value=${e}]`).check();
    await page.locator('#to-calc').click(); expect(await overflow()).toBe(false);
    await page.fill('#in-flour', '250'); await page.press('#in-flour', 'Enter');
    await page.locator('#pan-to-shape').selectOption('rect');
    expect(await overflow()).toBe(false);
    const [f, r] = await Promise.all([page.locator('#calc-form-card').boundingBox(), page.locator('#results').boundingBox()]);
    if (w >= 1024) expect(Math.abs(f.y - r.y)).toBeLessThan(40); else expect(r.y).toBeGreaterThan(f.y + f.height - 5);
  });
}
