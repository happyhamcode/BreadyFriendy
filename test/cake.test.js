import test from 'node:test';
import assert from 'node:assert/strict';
import { solveCake, scaleCake, panArea, CAKE_TYPES, CAKE_ING, unitsFor, toGrams, friendly, encodeCakeShare, decodeCakeShare, defaultPct, DEFAULT_FLOUR } from '../cake.js';

const blanks = (type, extra = []) => Object.fromEntries([...CAKE_TYPES[type].base, ...extra].map((i) => [i, null]));
const g = (r, id) => r.recipe.find((x) => x.id === id).grams;
const near = (a, b, tol = 1e-6) => assert.ok(Math.abs(a - b) <= tol, `${a} vs ${b}`);
const warned = (r, re) => assert.ok(r.warnings.some((w) => re.test(w)), `expected /${re}/ in ${JSON.stringify(r.warnings)}`);

test('every type with all blanks: 250 g flour, recommended amounts, only the flour notice', () => {
  for (const t of Object.keys(CAKE_TYPES)) {
    const r = solveCake({ type: t, amounts: blanks(t) });
    assert.equal(r.error, undefined, t);
    assert.equal(g(r, 'flour'), DEFAULT_FLOUR);
    for (const id of CAKE_TYPES[t].base.filter((i) => i !== 'flour')) near(g(r, id), (CAKE_TYPES[t].pct[id] * DEFAULT_FLOUR) / 100);
    assert.equal(r.warnings.length, 1, `${t}: ${r.warnings}`);
    assert.match(r.warnings[0], /250 g flour/);
  }
});

test('pound cake is 1:1:1:1 by weight', () => {
  const r = solveCake({ type: 'pound', amounts: { ...blanks('pound'), flour: 300 } });
  for (const id of ['butter', 'sugar', 'egg']) near(g(r, id), 300);
  assert.deepEqual(r.warnings, []);
});

test('flour blank: solved from the first given anchor ingredient', () => {
  const r = solveCake({ type: 'pound', amounts: { ...blanks('pound'), egg: 200 } });
  near(g(r, 'flour'), 200); near(g(r, 'butter'), 200);
  assert.equal(r.recipe.find((x) => x.id === 'flour').how, 'solved');
  const b = solveCake({ type: 'butter', amounts: { ...blanks('butter'), milk: 140 } });
  near(g(b, 'flour'), 200); near(g(b, 'sugar'), 220); // milk is 70% of flour
  const c = solveCake({ type: 'butter', amounts: { ...blanks('butter'), egg: 100, milk: 7 } });
  near(g(c, 'flour'), 200); // egg outranks milk
});

test('flour given wins over everything; given zero stays zero', () => {
  const r = solveCake({ type: 'butter', amounts: { ...blanks('butter'), flour: 100, egg: 999, bakingpowder: 0 } });
  assert.equal(g(r, 'flour'), 100); assert.equal(g(r, 'bakingpowder'), 0);
  warned(r, /Baking powder is 0\.0%/);
});

test('every optional ingredient of every type solves alone', () => {
  for (const [t, T] of Object.entries(CAKE_TYPES)) {
    for (const id of Object.keys(T.optional)) {
      const r = solveCake({ type: t, amounts: { ...blanks(t, [id]), flour: 250 } });
      assert.equal(r.error, undefined, `${t}/${id}`);
      near(g(r, id), (T.optional[id] * 250) / 100);
      assert.ok(Number.isFinite(r.total) && r.total > 0);
    }
  }
});

test('invalid input gives a clear error naming the field', () => {
  assert.equal(solveCake({ type: 'nope', amounts: {} }).error.field, 'type');
  assert.equal(solveCake({}).error.field, 'type');
  assert.match(solveCake({ type: 'pound', amounts: { flour: NaN } }).error.message, /enter a number/);
  assert.match(solveCake({ type: 'pound', amounts: { sugar: -1 } }).error.message, /negative/);
  assert.match(solveCake({ type: 'pound', amounts: { sugar: 60000 } }).error.message, /50 kg/);
  assert.match(solveCake({ type: 'pound', amounts: { flour: 0 } }).error.message, /more than 0/);
  assert.equal(solveCake({ type: 'pound', amounts: { bakingsoda: null } }).error.field, 'bakingsoda'); // not used in pound
  assert.equal(solveCake({ type: 'pound', amounts: { zzz: 1 } }).error.field, 'zzz');
  assert.equal(solveCake({ type: 'pound', amounts: { egg: 4e4 } }).error, undefined); // 40 kg egg -> 40 kg flour is fine
  assert.match(solveCake({ type: 'butter', amounts: { milk: 49000 } }).error.message, /50 kg/); // 70% -> 70 kg flour
});

test('balance warnings fire', () => {
  warned(solveCake({ type: 'pound', amounts: { ...blanks('pound'), flour: 100, butter: 50 } }), /Butter is 50%.*1:1:1:1/);
  warned(solveCake({ type: 'butter', amounts: { ...blanks('butter'), flour: 100, sugar: 80 } }), /at least as much sugar as flour/);
  warned(solveCake({ type: 'butter', amounts: { ...blanks('butter'), flour: 100, milk: 0, egg: 40, sugar: 120 } }), /Liquid .* less than the sugar/);
  warned(solveCake({ type: 'butter', amounts: { ...blanks('butter'), flour: 100, egg: 20 } }), /Eggs weigh well under the butter/);
  warned(solveCake({ type: 'sponge', amounts: { ...blanks('sponge'), flour: 100, egg: 80 } }), /whipped eggs/);
  warned(solveCake({ type: 'chiffon', amounts: { ...blanks('chiffon'), flour: 100, white: 20 } }), /Whites weigh less/);
  warned(solveCake({ type: 'butter', amounts: { ...blanks('butter'), flour: 100, butter: 150 } }), /Fat is about/);
  warned(solveCake({ type: 'butter', amounts: { ...blanks('butter'), flour: 100, bakingpowder: 10 } }), /Baking powder is 10\.0%/);
  warned(solveCake({ type: 'butter', amounts: { ...blanks('butter', ['bakingsoda']), flour: 100 } }), /needs an acid/);
  assert.ok(!solveCake({ type: 'butter', amounts: { ...blanks('butter', ['bakingsoda', 'buttermilk']), flour: 100 } }).warnings.some((w) => /needs an acid/.test(w)));
  warned(solveCake({ type: 'butter', amounts: { ...blanks('butter', ['bakingsoda', 'buttermilk']), flour: 100, bakingsoda: 3 } }), /soapy/);
});

test('pan area and pan scaling', () => {
  near(panArea({ shape: 'round', d: 8 }), Math.PI * 16);
  near(panArea({ shape: 'square', s: 8 }), 64);
  near(panArea({ shape: 'rect', w: 9, l: 13 }), 117);
  for (const bad of [null, {}, { shape: 'round' }, { shape: 'round', d: 0 }, { shape: 'square', s: -1 }, { shape: 'rect', w: 9 }, { shape: 'round', d: NaN }, { shape: 'round', d: 101 }, { shape: 'oval', d: 8 }]) assert.ok(Number.isNaN(panArea(bad)), JSON.stringify(bad));
  const r = solveCake({ type: 'butter', amounts: { ...blanks('butter'), flour: 200 } });
  const s = scaleCake(r, { from: { shape: 'round', d: 8 }, to: { shape: 'round', d: 9 } });
  near(s.factor, 81 / 64); near(g(s, 'flour'), 200 * 81 / 64); near(s.total, r.total * 81 / 64);
  assert.ok(s.warnings.length > r.warnings.length);
  near(scaleCake(r, { from: { shape: 'square', s: 8 }, to: { shape: 'rect', w: 9, l: 13 } }).factor, 117 / 64);
  assert.match(scaleCake(r, { factor: 3 }).warnings.at(-1), /a lot/);
  assert.equal(scaleCake(r, { factor: 1 }).warnings.length, r.warnings.length);
  for (const bad of [{ factor: 0 }, { factor: -2 }, { factor: NaN }, { factor: Infinity }, { from: { shape: 'round', d: 8 }, to: {} }, { factor: 1e9 }]) assert.ok(scaleCake(r, bad).error, JSON.stringify(bad));
  assert.ok(scaleCake(null, { factor: 2 }).error); assert.ok(scaleCake({ error: {} }, { factor: 2 }).error);
});

test('units: every unit of every ingredient converts to a positive finite weight; kitchen measures use fractions', () => {
  for (const id of Object.keys(CAKE_ING)) {
    const u = unitsFor(id);
    assert.ok(u.g === 1, id);
    for (const unit of Object.keys(u)) { const x = toGrams(id, 1, unit); assert.ok(Number.isFinite(x) && x > 0, `${id}/${unit}`); }
    for (const grams of [0.3, 2, 7, 60, 250, 1000]) assert.doesNotMatch(friendly(id, grams), /\d\.\d/, `${id} ${grams}`);
  }
  near(toGrams('bakingpowder', '1 1/2', 'tsp'), 6); near(toGrams('egg', 2, 'egg'), 100); near(toGrams('white', 3, 'white'), 99);
  near(toGrams('cocoa', '½', 'cup'), 42); // King Arthur: 1/2 cup = 42 g
  assert.ok(Number.isNaN(toGrams('bakingsoda', 1, 'cup')));
  assert.equal(friendly('bakingpowder', 6), '1 ½ tsp'); assert.equal(friendly('egg', 100), '2 eggs'); assert.equal(friendly('butter', 113), '1 stick');
  assert.equal(friendly('sugar', 0), '');
});

test('share round trip and tampering', () => {
  const s = { type: 'butter', amounts: { flour: 250, egg: null, milk: 100 } };
  const d = decodeCakeShare(encodeCakeShare(s));
  assert.deepEqual(d, { type: 'butter', amounts: { flour: 250, egg: null, milk: 100 } });
  const bad = decodeCakeShare('t=zzz&flour=1e9&egg=abc&evil=1');
  assert.equal(bad.type, null); assert.ok(Number.isNaN(bad.amounts.flour) && Number.isNaN(bad.amounts.egg)); assert.ok(!('evil' in bad.amounts));
  assert.match(solveCake({ type: 'butter', amounts: decodeCakeShare('t=butter&flour=1e9').amounts }).error.message, /enter a number/);
});

test('every default percent exists for every base ingredient', () => {
  for (const [t, T] of Object.entries(CAKE_TYPES)) for (const id of T.base.filter((i) => i !== 'flour')) assert.ok(defaultPct(t, id) >= 0, `${t}/${id}`);
});

test('cake page states the same recommended percentages the solver uses', async () => {
  const { readFileSync } = await import('node:fs');
  const html = readFileSync(new URL('../cake/index.html', import.meta.url), 'utf8');
  for (const [t, T] of Object.entries(CAKE_TYPES)) {
    const card = html.match(new RegExp(`data-type="${t}"[\\s\\S]*?</article>`))[0];
    const listed = [...card.matchAll(/data-id="(\w+)">[^<]*<strong>([\d.]+)%<\/strong>/g)].map((m) => [m[1], +m[2]]);
    assert.deepEqual(listed.map((x) => x[0]).sort(), T.base.filter((i) => i !== 'flour').sort(), t);
    for (const [id, p] of listed) assert.equal(p, T.pct[id], `${t}/${id}`);
  }
});
