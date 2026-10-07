import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { solve, decodeShare, YEAST } from '../bread.js';
import { solveCake, decodeCakeShare } from '../cake.js';

const root = new URL('../', import.meta.url).pathname;
const pages = ['index.html', 'privacy.html', 'bread/index.html', 'cake/index.html', 'learn/index.html',
  ...readdirSync(`${root}learn`).filter((d) => statSync(`${root}learn/${d}`).isDirectory()).map((d) => `learn/${d}/index.html`)];
const html = (p) => readFileSync(`${root}${p}`, 'utf8');

test('there are 8 learn pages plus the index', () => assert.equal(pages.filter((p) => p.startsWith('learn/')).length, 9));

test('every internal link and asset in every page resolves to a real file', () => {
  for (const p of pages) {
    for (const m of html(p).matchAll(/(?:href|src)="(\/[^"#?]*)(?:[?#][^"]*)?"/g)) {
      const path = m[1];
      const file = path.endsWith('/') ? `${root}${path.slice(1)}index.html` : `${root}${path.slice(1)}`;
      assert.ok(existsSync(file), `${p} links to ${path}`);
    }
  }
});

test('every page has one h1 (privacy aside), a unique title and a description', () => {
  const titles = new Set();
  for (const p of pages) {
    const h = html(p);
    const t = h.match(/<title>([^<]+)<\/title>/)[1];
    assert.ok(!titles.has(t), `duplicate title ${t}`); titles.add(t);
    assert.match(h, /<meta name="description" content="[^"]{40,}/, p);
    if (p !== 'privacy.html') assert.equal((h.match(/<h1[ >]/g) || []).length, 1, p);
  }
});

test('every "try it" link on the learn pages loads and solves without an error', () => {
  let n = 0;
  for (const p of pages.filter((q) => q.startsWith('learn/'))) {
    for (const m of html(p).matchAll(/class="cta" href="(\/(?:bread|cake)\/)\?([^"]+)"/g)) {
      const q = m[2].replace(/&amp;/g, '&');
      if (m[1] === '/bread/') { const r = solve(decodeShare(q)); assert.equal(r.error, undefined, `${p}: ${q}`); }
      else { const s = decodeCakeShare(q); assert.ok(s.type, q); assert.equal(solveCake(s).error, undefined, `${p}: ${q}`); }
      n++;
    }
  }
  assert.ok(n >= 8, `only ${n} try links`);
});

test('learn pages quote the same numbers the solvers produce', () => {
  const a = solve({ amounts: { flour: 500, water: null, salt: null, yeast: null }, hydration: 65 });
  assert.deepEqual(a.recipe.map((r) => r.grams), [500, 325, 10, 10]);
  const b = solve({ amounts: { flour: 500, water: 100, salt: 10, yeast: 5, egg: 100, milk: 150 }, hydration: null });
  assert.equal(b.hydration.toFixed(1), '61.6');
  const c = solve({ amounts: { flour: 500, water: null, salt: null, yeast: null, egg: null, butter: null, sugar: null, milk: null }, hydration: 65 });
  assert.deepEqual(['egg', 'butter', 'sugar', 'milk', 'water'].map((id) => Math.round(c.recipe.find((r) => r.id === id).grams)), [75, 75, 50, 185, 94]);
  assert.equal(Math.round(c.total), 998);
  assert.equal((1800 / c.total).toFixed(2), '1.80');
  assert.equal(((9 / 8) ** 2).toFixed(2), '1.27'); assert.equal((117 / 64).toFixed(2), '1.83');
  assert.equal([YEAST.instant, YEAST.active, YEAST.fresh].map((y) => y.pct * 5).join(), '10,12.5,30');
  assert.equal((355 / 480 * 100).toFixed(0), '74'); assert.equal((355 / 548 * 100).toFixed(0), '65');
  const y = html('learn/yeast-conversion/index.html'); assert.match(y, /10 g instant yeast \(2%\), 12\.5 g active dry \(2\.5%\) or 30 g fresh \(6%\)/);
});
