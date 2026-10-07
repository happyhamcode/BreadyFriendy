import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { solve, scale, BRACKETS, bracketFor, DEFAULT_HYDRATION, parseAmount, toGrams, unitsFor, friendly, toFraction, encodeShare, decodeShare, ING, YEAST, ENRICHERS } from '../bread.js';

const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) <= eps, `${a} !~ ${b}`);
const get = (r, id) => r.recipe.find((x) => x.id === id);
const ok = (r) => { assert.equal(r.error, undefined, r.error?.message); return r; };
const bad = (r, field) => { assert.ok(r.error, 'expected error'); if (field) assert.equal(r.error.field, field); return r; };

test('lean dough: 500 flour 65% -> 325 water', () => {
  const r = ok(solve({ amounts: { flour: 500, water: null, salt: 10, yeast: 5 }, hydration: 65 }));
  near(get(r, 'water').grams, 325); near(r.hydration, 65);
  assert.ok(get(r, 'water').auto);
});

test('all-milk brioche: water 0, milk solved', () => {
  const r = ok(solve({ amounts: { flour: 500, water: 0, milk: null, salt: 10, yeast: 5 }, hydration: 60 }));
  near(get(r, 'milk').grams * 0.88, 300); near(r.hydration, 60);
});

test('eggs + butter + sugar, water solved; true water counted', () => {
  const r = ok(solve({ amounts: { flour: 500, water: null, egg: 100, butter: 100, sugar: 50, salt: 10, yeast: 5 }, hydration: 60 }));
  near(get(r, 'water').grams, 300 - 76 - 16); near(r.hydration, 60);
});

test('hydration only: flour defaults, enrichers take recommended amounts, water fills the rest', () => {
  const r = ok(solve({ amounts: { water: null, milk: null, egg: null, butter: null }, hydration: 65 }));
  assert.ok(r.flourDefaulted); near(get(r, 'flour').grams, 500);
  near(get(r, 'egg').grams, 75);                         // 15% of flour
  near(get(r, 'milk').grams, (0.5 * 0.65 * 500) / 0.88); // supplies half of the total water
  near(get(r, 'butter').grams, 60); near(get(r, 'salt').grams, 10); near(get(r, 'yeast').grams, 5);
  near(r.hydration, 65);
  near(get(r, 'water').grams, 325 - 75 * 0.76 - 0.5 * 325 - 60 * 0.16);
  assert.equal(get(r, 'egg').how, 'recommended'); assert.equal(get(r, 'water').how, 'solved');
  assert.ok(r.warnings.some((w) => /used 500/.test(w)));
});

test('hydration only, no enrichers', () => {
  const r = ok(solve({ amounts: {}, hydration: 70 }));
  near(get(r, 'water').grams, 350); near(get(r, 'flour').grams, 500);
});

test('reverse: hydration blank reports it', () => {
  const r = ok(solve({ amounts: { flour: 500, water: 200, milk: 100, salt: 10, yeast: 5 }, hydration: null }));
  near(r.hydration, (200 + 88) / 5);
});

test('hydration blank: flour is required; blank water uses the recommended hydration', () => {
  bad(solve({ amounts: { flour: null, water: 300 }, hydration: null }), 'flour');
  const r = ok(solve({ amounts: { flour: 500, water: null }, hydration: null }));
  assert.ok(r.hydrationDefaulted); near(get(r, 'water').grams, 325); near(r.hydration, 65);
  assert.ok(r.warnings.some((w) => /recommended 65%/.test(w)));
  assert.ok(!ok(solve({ amounts: { flour: 500, water: 325 }, hydration: null })).hydrationDefaulted);
});

test('hydration blank: blank salt/yeast/butter get defaults', () => {
  const r = ok(solve({ amounts: { flour: 1000, water: 600, butter: null }, hydration: null }));
  near(get(r, 'salt').grams, 20); near(get(r, 'butter').grams, 120); near(r.hydration, 61.92);
});

test('solve flour from known liquids', () => {
  const r = ok(solve({ amounts: { flour: null, water: 300, salt: 10, yeast: 5 }, hydration: 60 }));
  near(get(r, 'flour').grams, 500); assert.ok(!r.flourDefaulted);
});

test('solve flour accounts for default-% butter water', () => {
  const r = ok(solve({ amounts: { flour: null, water: 300, butter: null }, hydration: 60 }));
  near(r.hydration, 60); near(get(r, 'flour').grams, 300 / (0.6 - 0.12 * 0.16));
});

test('solve flour: nothing to solve from', () => {
  bad(solve({ amounts: { flour: null, water: 0 }, hydration: 60 }), 'flour');
});

test('every recommended amount, with no hydration entered', () => {
  const a = { flour: 1000, water: 650, egg: null, yolk: null, milk: null, cream: null, butter: null, oil: null, sugar: null, honey: null, milkpowder: null, salt: null, yeast: null };
  const r = ok(solve({ amounts: a, hydration: null }));
  const g = (id) => get(r, id).grams;
  near(g('egg'), 150); near(g('yolk'), 100); near(g('butter'), 120); near(g('oil'), 70); near(g('sugar'), 100);
  near(g('honey'), 70); near(g('milkpowder'), 40); near(g('salt'), 20); near(g('yeast'), 10);
  near(g('milk'), (0.5 * 0.65 * 1000) / 0.88); near(g('cream'), (0.25 * 0.65 * 1000) / 0.58);
  for (const id of ['egg', 'yolk', 'milk', 'cream', 'butter', 'oil', 'sugar', 'honey', 'milkpowder', 'salt', 'yeast']) assert.equal(get(r, id).how, 'recommended', id);
  assert.equal(get(r, 'water').how, null); assert.ok(!r.hydrationDefaulted);
});

test('recommended yeast follows the yeast type', () => {
  for (const [yt, p] of [['instant', 1], ['active', 1.3], ['fresh', 3]]) near(get(ok(solve({ amounts: { flour: 1000 }, hydration: 65, yeastType: yt })), 'yeast').grams, p * 10);
});

test('water given + hydration given: blank liquid enrichers split the missing water equally', () => {
  const r = ok(solve({ amounts: { flour: 500, water: 200, egg: null, milk: null, salt: 10, yeast: 5 }, hydration: 60 }));
  near(get(r, 'egg').grams, get(r, 'milk').grams); near(r.hydration, 60);
  near(get(r, 'egg').grams, 100 / (0.76 + 0.88)); assert.equal(get(r, 'egg').how, 'solved');
});

test('water given, hydration blank: blank enrichers get recommended amounts, hydration reported', () => {
  const r = ok(solve({ amounts: { flour: 500, water: 300, egg: null, butter: null }, hydration: null }));
  near(get(r, 'egg').grams, 75); near(get(r, 'butter').grams, 60);
  near(r.hydration, (300 + 75 * 0.76 + 60 * 0.16) / 5); assert.ok(!r.hydrationDefaulted);
});

test('recommended liquids too wet for the hydration are scaled down with a warning', () => {
  const a = Object.fromEntries(ENRICHERS.map((e) => [e, null]));
  const r = ok(solve({ amounts: { ...a, water: null }, hydration: 70 }));
  near(r.hydration, 70); near(get(r, 'water').grams, 0);
  assert.ok(r.warnings.some((w) => /scaled them down/.test(w)));
  const full = ok(solve({ amounts: { egg: null, water: null }, hydration: 70 }));
  assert.ok(!full.warnings.some((w) => /scaled/.test(w)));
});

test('known ingredients already wetter than hydration: error mentions the recommended 65% when defaulted', () => {
  const r = bad(solve({ amounts: { flour: 100, water: null, milk: 200 }, hydration: null }), 'hydration');
  assert.match(r.error.message, /recommended 65%/);
  bad(solve({ amounts: { flour: 100, water: null, milk: 100, egg: null }, hydration: 1 }), 'hydration');
});

test('home page states the same recommended amounts the solver uses', () => {
  const html = readFileSync(new URL('../bread/index.html', import.meta.url), 'utf8');
  for (const id of ['egg', 'yolk', 'butter', 'oil', 'sugar', 'honey', 'milkpowder']) {
    const card = html.match(new RegExp(`data-id="${id}"[\\s\\S]*?</article>`))[0];
    assert.match(card, new RegExp(`we use <strong>${ING[id].pct}%</strong>`), id);
  }
  assert.match(html, /we use <strong>half<\/strong> of the water as milk/); assert.match(html, /we use <strong>a quarter<\/strong> of the water as cream/);
  assert.equal(ING.milk.share, 0.5); assert.equal(ING.cream.share, 0.25);
  assert.match(html, new RegExp(`${DEFAULT_HYDRATION}% hydration`)); assert.equal(ING.salt.pct, 2); assert.equal(YEAST.instant.pct, 1);
});

test('hydration brackets: boundaries, examples, and the home page lists the same ones', () => {
  for (const [h, label] of [[0, 'Very stiff'], [44.9, 'Very stiff'], [45, 'Stiff and rich'], [54.99, 'Stiff and rich'], [55, 'Firm'], [62, 'Soft and workable'],
    [65, 'Soft and workable'], [70, 'Sticky, open crumb'], [80, 'Very wet'], [90, 'Batter-like'], [150, 'Batter-like']]) assert.equal(bracketFor(h).label, label, String(h));
  for (const bad of [NaN, Infinity, -1, null, undefined, 'x']) assert.equal(bracketFor(bad), null, String(bad));
  assert.match(bracketFor(60).breads, /challah/i); assert.match(bracketFor(85).breads, /ciabatta/i);
  assert.match(bracketFor(66).breads, /French/); assert.match(bracketFor(50).breads, /brioche/i);
  assert.match([62, 58, 75].map((h) => bracketFor(h).breads).join(), /pizza/i);
  assert.deepEqual(BRACKETS.map((b) => b.range), ['Under 45%', '45-55%', '55-62%', '62-70%', '70-80%', '80-90%', '90%+']);
  const html = readFileSync(new URL('../bread/index.html', import.meta.url), 'utf8');
  for (const b of BRACKETS) { assert.ok(html.includes(b.range), b.range); assert.ok(html.includes(b.breads), b.breads); }
});

test('enrichers exceed target hydration', () => {
  const r = bad(solve({ amounts: { flour: 100, water: null, milk: 100 }, hydration: 60 }), 'hydration');
  assert.match(r.error.message, /88/);
});

test('overdetermined: ok within tolerance, error outside', () => {
  ok(solve({ amounts: { flour: 500, water: 326, salt: 10, yeast: 5 }, hydration: 65 }));
  const r = bad(solve({ amounts: { flour: 500, water: 340, salt: 10, yeast: 5 }, hydration: 65 }), 'hydration');
  assert.match(r.error.message, /68\.0%.*65\.0%/);
});

test('invalid numbers', () => {
  bad(solve({ amounts: { flour: NaN } }), 'flour');
  bad(solve({ amounts: { flour: -5, water: 1 }, hydration: null }), 'flour');
  bad(solve({ amounts: { flour: Infinity } }), 'flour');
  bad(solve({ amounts: { flour: 1e9 } }), 'flour');
  bad(solve({ amounts: { flour: 0 }, hydration: 65 }), 'flour');
  bad(solve({ amounts: { flour: 500, egg: -1 }, hydration: 65 }), 'egg');
  bad(solve({ amounts: { flour: '500' }, hydration: 65 }), 'flour');
  bad(solve({ amounts: { sourdough: 5 }, hydration: 65 }));
  for (const h of [0, 0.5, 151, -3, NaN, Infinity]) bad(solve({ amounts: { flour: 500 }, hydration: h }), 'hydration');
  ok(solve({ amounts: { flour: 500 }, hydration: 1 }));
  ok(solve({ amounts: { flour: 500 }, hydration: 150 }));
});

test('hydration too low for defaults when solving flour', () => {
  bad(solve({ amounts: { flour: null, water: 300, honey: null }, hydration: 1 }), 'hydration');
});

test('yeast types: defaults and equivalents', () => {
  for (const [yt, pct] of [['instant', 1], ['active', 1.3], ['fresh', 3]]) {
    const r = ok(solve({ amounts: { flour: 1000, water: 650, salt: 20, yeast: null }, hydration: null, yeastType: yt }));
    near(get(r, 'yeast').grams, pct * 10);
    near(r.yeastEquivalents.instant, 10); near(r.yeastEquivalents.active, 13); near(r.yeastEquivalents.fresh, 30);
  }
  bad(solve({ amounts: { flour: 500 }, hydration: 65, yeastType: 'sourdough' }), 'yeastType');
});

test('fresh yeast contributes water', () => {
  const r = ok(solve({ amounts: { flour: 1000, water: null, yeast: 30, salt: 20 }, hydration: 65, yeastType: 'fresh' }));
  near(get(r, 'water').grams, 650 - 21); near(r.hydration, 65);
  const i = ok(solve({ amounts: { flour: 1000, water: null, yeast: 10, salt: 20 }, hydration: 65, yeastType: 'instant' }));
  near(get(i, 'water').grams, 650);
});

test('parseAmount', () => {
  const cases = [['1 1/2', 1.5], ['¾', 0.75], ['1¾', 1.75], ['.5', 0.5], ['2', 2], [' 3/4 ', 0.75], ['0.25', 0.25], [2, 2], ['2.', 2]];
  for (const [i, o] of cases) near(parseAmount(i), o);
  for (const blank of ['', '  ', null, undefined]) assert.equal(parseAmount(blank), null);
  for (const badv of ['2/0', '1 1/0', 'abc', '-1', '1,5', '1..2', '1/2/3', '1e3', '1 ½ ¼', NaN, Infinity, '1½ 1/2']) assert.ok(Number.isNaN(parseAmount(badv)), String(badv));
});

test('toGrams: every unit of every ingredient is finite and positive', () => {
  for (const id of Object.keys(ING)) {
    const u = unitsFor(id);
    assert.ok(u.g === 1 && u.oz > 28);
    for (const unit of Object.keys(u)) { const g = toGrams(id, 1, unit); assert.ok(g > 0 && Number.isFinite(g), `${id} ${unit}`); }
  }
});

test('toGrams known values', () => {
  near(toGrams('flour', 2, 'cup'), 240); near(toGrams('flour', '1 1/2', 'cup-whole-wheat'), 169.5);
  near(toGrams('egg', 3, 'egg'), 150); near(toGrams('yolk', 4, 'yolk'), 68);
  near(toGrams('butter', '½', 'stick'), 56.5); near(toGrams('butter', 2, 'tbsp'), 28.375);
  near(toGrams('water', 1, 'cup'), 237); near(toGrams('water', 100, 'ml'), 100.2, 0.1);
  near(toGrams('milk', 1, 'cup'), 244); near(toGrams('sugar', 1, 'cup'), 198);
  near(toGrams('honey', 1, 'tbsp'), 21.25); near(toGrams('yeast', 1, 'packet'), 7);
  near(toGrams('salt', 1, 'tsp-diamond'), 2.667, 0.01); near(toGrams('salt', 1, 'tsp-morton'), 5.333, 0.01); near(toGrams('milkpowder', 0.25, 'cup'), 28); near(toGrams('yeast', 1, 'tbsp'), 9); near(toGrams('salt', 1, 'tsp'), 6);
  near(toGrams('flour', 4, 'oz'), 113.398);
});

test('toGrams rejects bad input', () => {
  for (const [id, a, u] of [['flour', 'x', 'cup'], ['flour', '1', 'stick'], ['flour', -1, 'cup'], ['nope', 1, 'cup'], ['egg', 1, 'cup'], ['flour', '', 'cup'], ['flour', '2/0', 'cup']]) {
    assert.ok(Number.isNaN(toGrams(id, a, u)), `${id} ${a} ${u}`);
  }
});

test('scale x0.5, x3, loaves, invalid', () => {
  const r = ok(solve({ amounts: { flour: 500, water: null, salt: 10, yeast: 5 }, hydration: 65 }));
  const h = scale(r, { totalDough: r.total / 2 });
  near(get(h, 'flour').grams, 250); near(h.hydration, r.hydration);
  near(get(scale(r, { totalDough: r.total * 3 }), 'water').grams, 975);
  near(scale(r, { loaves: 2, each: 900 }).total, 1800);
  near(scale(r, { totalDough: r.total }).yeastEquivalents.instant, 5);
  for (const t of [{ totalDough: 0 }, { totalDough: -1 }, { totalDough: NaN }, { loaves: NaN, each: 900 }, { loaves: 2 }]) bad(scale(r, t));
  bad(scale({ error: {} }, { totalDough: 100 }));
});

test('share round trip and tampering', () => {
  const s = { amounts: { flour: 500, water: null, egg: 100.5, salt: null, yeast: 5 }, hydration: 65, yeastType: 'active' };
  assert.deepEqual(decodeShare(encodeShare(s)), s);
  const t = decodeShare('yt=evil&h=abc&flour=1e9&egg=-4&sourdough=5&__proto__=1&water=');
  assert.equal(t.yeastType, 'instant'); assert.ok(Number.isNaN(t.hydration)); assert.ok(!('sourdough' in t.amounts));
  bad(solve(t)); bad(solve({ ...t, hydration: 65 }), "flour");
  assert.deepEqual(decodeShare('').amounts, {});
});

test('warnings fire', () => {
  const w = (a, h = null, yt) => ok(solve({ amounts: a, hydration: h, yeastType: yt })).warnings.join('|');
  assert.match(w({ flour: 500, water: 100, salt: 10, yeast: 5 }), /very low/);
  assert.match(w({ flour: 500, water: 500, salt: 10, yeast: 5 }), /very high/);
  assert.match(w({ flour: 500, water: 300, salt: 0, yeast: 5 }), /Salt/);
  assert.match(w({ flour: 500, water: 300, salt: 20, yeast: 5 }), /Salt/);
  assert.match(w({ flour: 500, water: 300, salt: 10, yeast: 0 }), /No yeast/);
  assert.match(w({ flour: 500, water: 300, salt: 10, yeast: 20 }), /3x/);
  assert.match(w({ flour: 500, water: 300, salt: 10, yeast: 5, sugar: 150 }), /osmotolerant/);
  assert.match(w({ flour: 500, water: 300, salt: 10, yeast: 5, butter: 400 }), /Fat/);
  assert.equal(w({ flour: 500, water: 300, salt: 10, yeast: 5 }), '');
});

test('extreme but valid values stay finite', () => {
  const r = ok(solve({ amounts: { flour: 0.001, water: null, milk: null, egg: null, butter: null, oil: null, sugar: null, honey: null, milkpowder: null, cream: null, yolk: null }, hydration: 150 }));
  for (const x of r.recipe) assert.ok(Number.isFinite(x.grams) && x.grams >= 0);
  near(r.hydration, 150, 1e-6);
});

test('every enricher alone: solves and hydration matches', () => {
  for (const id of ENRICHERS) {
    for (const yt of Object.keys(YEAST)) {
      const r = ok(solve({ amounts: { [id]: null, water: null }, hydration: 65, yeastType: yt }));
      near(r.hydration, 65, 1e-6);
    }
  }
});

test('all enrichers selected, hydration only: consistent', () => {
  const a = Object.fromEntries(ENRICHERS.map((e) => [e, null]));
  const r = ok(solve({ amounts: { ...a, water: null }, hydration: 70 }));
  near(r.hydration, 70);
  const total = r.recipe.reduce((s, x) => s + x.grams, 0); near(total, r.total);
  // feeding the solved grams back in with the same hydration must be accepted
  const back = Object.fromEntries(r.recipe.map((x) => [x.id, x.grams]));
  const r2 = ok(solve({ amounts: back, hydration: 70 }));
  near(r2.hydration, 70);
});

test('toFraction rounds to kitchen fractions', () => {
  const cup = [[0, ''], [1 / 4, '¼'], [1 / 3, '⅓'], [1 / 2, '½'], [2 / 3, '⅔'], [3 / 4, '¾'], [1, '']];
  for (const [x, o] of [[0.5, '½'], [1.5, '1 ½'], [2, '2'], [0.33, '⅓'], [1.66, '1 ⅔'], [0.9, '1'], [2.9, '3'], [0.26, '¼'], [3.74, '3 ¾']]) {
    assert.equal(toFraction(x, cup).text, o, String(x));
  }
  assert.equal(toFraction(0.9, cup).value, 1);
});

test('friendly uses fractions, never decimals', () => {
  assert.equal(friendly('egg', 115), '2 ½ eggs'); assert.equal(friendly('egg', 50), '1 egg'); assert.equal(friendly('egg', 20), '½ egg'); assert.equal(friendly('egg', 5), 'less than ½ egg');
  assert.equal(friendly('yolk', 34), '2 yolks'); assert.equal(friendly('yolk', 17), '1 yolk');
  assert.equal(friendly('butter', 113), '1 stick'); assert.equal(friendly('butter', 75), '¾ stick'); assert.equal(friendly('butter', 14.2), '1 tbsp');
  assert.equal(friendly('salt', 12), '2 tsp table salt'); assert.equal(friendly('salt', 10), '1 ¾ tsp table salt');
  assert.equal(friendly('yeast', 5), '1 ¾ tsp'); assert.equal(friendly('yeast', 0.1), 'a pinch');
  assert.equal(friendly('flour', 240), '2 cups'); assert.equal(friendly('flour', 90), '¾ cup'); assert.equal(friendly('flour', 500), '4 ¼ cups');
  assert.equal(friendly('oil', 218), '1 cup'); assert.equal(friendly('oil', 40), '3 tbsp'); assert.equal(friendly('oil', 7), '1 ½ tsp');
  assert.equal(friendly('water', 118.5), '½ cup'); assert.equal(friendly('sugar', 1), '¼ tsp'); assert.equal(friendly('flour', 0), '');
  for (const id of Object.keys(ING)) for (const g of [0.3, 1, 3, 7, 15, 33, 80, 150, 410, 999, 5000]) {
    const out = friendly(id, g);
    assert.ok(out, `${id} ${g}`); assert.doesNotMatch(out, /\d\.\d/, `${id} ${g}: ${out}`);
  }
});

test('no sourdough anywhere in shipped files', () => {
  const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory()
    ? (['node_modules', 'test-results', '.git', 'test'].includes(d.name) ? [] : walk(new URL(`${d.name}/`, dir)))
    : /\.(html|js|css|md|json)$/.test(d.name) ? [new URL(d.name, dir)] : []));
  const files = walk(new URL('../', import.meta.url));
  assert.ok(files.length >= 8);
  for (const f of files) assert.doesNotMatch(readFileSync(f, 'utf8'), /sourdough|levain|starter culture/i, f.pathname);
});
