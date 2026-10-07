import { test, expect } from '@playwright/test';

const open = async (page, enrichers = []) => {
  await page.goto('/bread/');
  await page.getByRole('button', { name: 'Build my dough' }).first().click();
  for (const e of enrichers) await page.locator(`.picks input[value=${e}]`).check();
  await page.locator('#to-calc').click();
};
const val = (page, id) => page.locator(`#in-${id}`).inputValue();

test('home has explanation, no sourdough, button opens picker', async ({ page }) => {
  await page.goto('/bread/');
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

test('hydration only: recommended enrichers, water fills the rest', async ({ page }) => {
  await open(page, ['milk', 'egg']);
  await page.fill('#in-hydration', '65'); await page.press('#in-hydration', 'Enter');
  expect(await val(page, 'flour')).toBe('500');
  expect(await val(page, 'egg')).toBe('75');       // 15% of flour
  expect(await val(page, 'milk')).toBe('184.7');   // half of the water
  expect(await val(page, 'water')).toBe('105.5');
  expect(await val(page, 'salt')).toBe('10');
  await expect(page.locator('#hydration-line')).toContainText('65.0%');
  await expect(page.locator('#results-body tr', { hasText: 'Whole egg' })).toContainText('(recommended)');
  await expect(page.locator('#results-body tr', { hasText: 'Water' }).first()).toContainText('(calculated)');
});

test('empty form: recommended amounts, 65% hydration, 500 g flour', async ({ page }) => {
  await open(page, ['egg', 'butter']);
  await page.press('#in-flour', 'Enter');
  expect(await val(page, 'flour')).toBe('500'); expect(await val(page, 'hydration')).toBe('65');
  expect(await val(page, 'egg')).toBe('75'); expect(await val(page, 'butter')).toBe('60');
  await expect(page.locator('#warnings')).toContainText('recommended 65%');
  await page.fill('#in-flour', '1000'); await page.press('#in-flour', 'Enter');   // everything calculated rescales
  expect(await val(page, 'egg')).toBe('150'); expect(await val(page, 'butter')).toBe('120');
});

test('bread examples: home list, demo slider, calculator guide and result line', async ({ page }) => {
  await page.goto('/bread/');
  for (const w of ['Brioche', 'Challah', 'Neapolitan-style pizza', 'classic French bread', 'Ciabatta', 'focaccia']) await expect(page.locator('.ranges')).toContainText(w);
  await expect(page.locator('.hero #demo-range')).toHaveCount(0);   // demo is not next to the Build button
  await page.locator('#demo-range').fill('82');
  await expect(page.locator('#demo-breads')).toContainText('Ciabatta'); await expect(page.locator('#demo-feel')).toHaveText('Very wet');
  await page.locator('#demo-range').fill('50'); await expect(page.locator('#demo-breads')).toContainText('Brioche');
  await page.getByRole('button', { name: 'Build my dough' }).first().click(); await page.locator('#to-calc').click();
  await page.locator('.guide summary').click();
  await expect(page.locator('#guide-list li')).toHaveCount(7); await expect(page.locator('#guide-list li.on')).toHaveCount(0);
  await page.fill('#in-hydration', '58'); await expect(page.locator('#guide-list li.on')).toContainText('Challah');
  await page.fill('#in-hydration', '66'); await expect(page.locator('#guide-list li.on')).toContainText('French');
  await page.fill('#in-flour', '500'); await page.press('#in-flour', 'Enter');
  await expect(page.locator('#res-bracket')).toContainText('66.0%'); await expect(page.locator('#res-bracket')).toContainText('Soft and workable');
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

test('errors: conflict, enrichers too wet, junk', async ({ page }) => {
  await open(page, ['milk']);
  await page.fill('#in-water', '300'); await page.fill('#in-milk', '100'); await page.fill('#in-flour', '500'); await page.fill('#in-hydration', '50');
  await page.press('#in-hydration', 'Enter');
  await expect(page.locator('#msg')).toContainText(/give 77\.6% hydration/);
  await expect(page.locator('#in-hydration')).toHaveAttribute('aria-invalid', 'true');
  await page.fill('#in-flour', '100'); await page.fill('#in-water', ''); await page.fill('#in-milk', '200');
  await page.fill('#in-hydration', '60'); await page.press('#in-hydration', 'Enter');
  await expect(page.locator('#msg')).toContainText(/already contain/);
  await page.fill('#in-hydration', ''); await page.press('#in-hydration', 'Enter');
  await expect(page.locator('#msg')).toContainText(/recommended 65%/);
  await page.fill('#in-milk', ''); await page.fill('#in-flour', 'abc'); await page.press('#in-flour', 'Enter');
  await expect(page.locator('#msg')).toContainText(/number/);
  await page.fill('#in-flour', '-5'); await page.press('#in-flour', 'Enter');
  await expect(page.locator('#msg')).toContainText(/number/);
  await page.fill('#in-flour', '0'); await page.press('#in-flour', 'Enter');
  await expect(page.locator('#msg')).toContainText(/more than 0/);
  await page.fill('#in-flour', '500'); await page.fill('#in-hydration', '151'); await page.press('#in-hydration', 'Enter');
  await expect(page.locator('#msg')).toContainText(/between 1% and 150%/);
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
  const bad = await context.newPage(); await bad.goto('/bread/?yt=x&h=abc&flour=1e9&egg=');
  await expect(bad.locator('#msg')).not.toHaveText('');
});

test('dark mode renders', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/bread/');
  const bg = await page.evaluate(() => getComputedStyle(document.querySelector('.paper')).backgroundColor);
  expect(bg).toBe('rgb(20, 40, 60)');
});

test('brand link goes to the site home from calculator and privacy; nav marks the current section', async ({ page }) => {
  await open(page, ['egg']);
  await expect(page.locator('#calc')).toBeVisible();
  await expect(page.locator('.topnav a[aria-current=page]')).toHaveText('Bread');
  await page.locator('.brand').click();
  await expect(page).toHaveURL(/localhost:4173\/$/);
  await expect(page.getByRole('heading', { name: 'Bake by math', level: 1 })).toBeVisible();
  await page.goto('/privacy.html'); await page.locator('.brand').click();
  await expect(page).toHaveURL(/localhost:4173\/$/);
});

test('picker: tooltips show enricher info + water, clear and reset work', async ({ page }) => {
  await page.goto('/bread/');
  await page.getByRole('button', { name: 'Build my dough' }).first().click();
  const tip = page.locator('#tip-milk');
  await expect(tip).toBeHidden();
  await page.getByRole('button', { name: 'About Whole milk' }).click();
  await expect(tip).toBeVisible(); await expect(tip).toContainText('Does:'); await expect(tip).toContainText('Use when:');
  await expect(tip).toContainText('88 g of water');
  await page.mouse.move(0, 0); await page.keyboard.press('Escape'); await expect(tip).toBeHidden();
  await page.getByRole('button', { name: 'About Butter' }).click(); await page.getByRole('button', { name: 'About Oil' }).click();
  await expect(page.locator('#tip-butter')).toBeHidden(); await expect(page.locator('#tip-oil')).toContainText('no water');
  await expect(page.locator('.pick-tag').first()).toHaveText('76% water');
  await page.locator('.picks input[value=egg]').check(); await page.locator('.picks input[value=milk]').check();
  await page.locator('#clear-picks').click();
  await expect(page.locator('.picks input:checked')).toHaveCount(0);
  await page.locator('.picks input[value=egg]').check(); await page.locator('#to-calc').click();
  await expect(page.locator('#in-egg')).toBeVisible();
  await expect(page.locator('.picks input:checked')).toHaveCount(0);        // reset after Open calculator
  await page.locator('#change-enrichers').click();                          // but Change enrichers shows the active set
  await expect(page.locator('.picks input[value=egg]')).toBeChecked();
  await page.locator('[data-go-home]').click();
  await page.getByRole('button', { name: 'Build my dough' }).first().click(); // fresh start from home
  await expect(page.locator('.picks input:checked')).toHaveCount(0);
});

test('recipe shows kitchen measures as fractions, never decimals', async ({ page }) => {
  await open(page, ['egg', 'milk', 'butter', 'sugar']);
  await page.fill('#in-flour', '500'); await page.fill('#in-hydration', '65'); await page.press('#in-hydration', 'Enter');
  const hints = await page.locator('#results-body .src').allTextContents();
  expect(hints.length).toBe(8);
  for (const h of hints) expect(h).not.toMatch(/\d\.\d/);
  expect(hints.join('|')).toMatch(/cup/); expect(hints.join('|')).toMatch(/tsp/); expect(hints.join('|')).toMatch(/[¼½¾⅓⅔]/);
  expect(await page.locator('#results-body tr').first().locator('.src').textContent()).toBe('4 ¼ cups');
});

test('hero slider updates grams', async ({ page }) => {
  await page.goto('/bread/');
  await page.locator('#demo-range').fill('80');
  await expect(page.locator('#demo-h')).toHaveText('80%'); await expect(page.locator('#demo-water')).toHaveText('400 g');
});

for (const [name, w, h] of [['phone', 375, 700], ['small phone', 320, 640], ['tablet', 820, 1100], ['laptop', 1280, 800], ['wide', 1920, 1080]]) {
  test(`${name} ${w}px: every screen fits, desktop shows results beside the form`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    const overflow = () => page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    await page.goto('/bread/'); expect(await overflow()).toBe(false);
    await page.getByRole('button', { name: 'Build my dough' }).first().click(); expect(await overflow()).toBe(false);
    await page.getByRole('button', { name: 'About Whole milk' }).click(); expect(await overflow()).toBe(false);
    await page.mouse.move(0, 0); await page.keyboard.press('Escape');
    for (const e of ['egg', 'yolk', 'milk', 'cream', 'butter', 'oil', 'sugar', 'honey', 'milkpowder']) await page.locator(`.picks input[value=${e}]`).check();
    await page.locator('#to-calc').click(); expect(await overflow()).toBe(false);
    await page.fill('#in-hydration', '65'); await page.press('#in-hydration', 'Enter');
    expect(await overflow()).toBe(false);
    const [f, r] = await Promise.all([page.locator('#calc-form-card').boundingBox(), page.locator('#results').boundingBox()]);
    if (w >= 1024) expect(Math.abs(f.y - r.y)).toBeLessThan(40); else expect(r.y).toBeGreaterThan(f.y + f.height - 5);
  });
}

test('explanation columns keep padding on both sides of the divider', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/bread/');
  const [a, b] = await page.locator('.explain > article').evaluateAll((els) => els.map((e) => parseFloat(getComputedStyle(e).paddingRight) + parseFloat(getComputedStyle(e).paddingLeft)));
  expect(a).toBeGreaterThanOrEqual(28); expect(b).toBeGreaterThanOrEqual(28);
  const gap = await page.locator('.explain > article').nth(1).evaluate((e) => e.querySelector('h2').getBoundingClientRect().left - e.getBoundingClientRect().left);
  expect(gap).toBeGreaterThanOrEqual(28);
});

test('old share links on / forward to /bread/ with the recipe solved', async ({ page }) => {
  await page.goto('/?yt=instant&h=65&flour=500&water=&egg=100');
  await expect(page).toHaveURL(/\/bread\/\?/);
  await expect(page.locator('#hydration-line')).toContainText('65.0%');
  expect(await page.locator('#in-egg').inputValue()).toBe('100');
});

test('site home links to bread, cake and every learn page; learn pages render and link back', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.enricher a.cta')).toHaveCount(2);
  const links = await page.locator('.learn-list a').evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  expect(links).toHaveLength(8);
  for (const href of links) {
    const r = await page.goto(href); expect(r.status(), href).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('.topnav a[aria-current=page]')).toHaveText('Learn');
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), href).toBe(false);
  }
  await page.goto('/learn/'); await page.locator('.learn-list a').first().click(); await expect(page).toHaveURL(/learn\/bakers-percentage\//);
  await page.locator('.try-link a').first().click(); await expect(page.locator('#hydration-line')).toContainText('65.0%');
});

test('site home, learn index and a learn page fit a 320px phone', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  for (const u of ['/', '/learn/', '/learn/measuring/', '/cake/', '/bread/']) {
    await page.goto(u);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), u).toBe(false);
    expect(await page.locator('.brand span').evaluate((s) => s.getBoundingClientRect().height < 30), u).toBe(true); // brand stays on one line
  }
});
