// Cake calculation core. Pure functions, no DOM. Everything is a percentage of flour weight (baker's percentage).
// Inputs use grams; null/undefined = blank (to be solved), NaN = unparseable text.
import * as core from './core.js';
import { MAX_GRAMS, SALT_UNITS, fail } from './core.js';

export { parseAmount, toFraction, MAX_GRAMS } from './core.js';
export const DEFAULT_FLOUR = 250;

// Sources. water/fat: USDA FoodData Central SR Legacy (fdc ids in comments, checked 2026-10-07 against the bulk CSV).
// Dry measures (cup/tsp) and the egg-white count: King Arthur ingredient weight chart. Liquid cups use real density (like bread.js),
// not King Arthur's "8 oz = 227 g" convention. Where USDA and King Arthur disagree on a measure, King Arthur is used for dry goods:
//   baking powder tsp 4 g (USDA 4.6), baking soda tsp 6 g (USDA 4.6), cocoa cup 84 g (USDA 86), vanilla tsp 14/3 g (USDA 4.2).
// acid: true = reacts with baking soda. Cocoa here is natural (non-alkalized), USDA 169593.
export const CAKE_ING = {
  flour:     { label: 'Flour',            water: 0,    fat: 0,     cup: 120 },
  sugar:     { label: 'Sugar',            water: 0,    fat: 0,     cup: 198 },
  butter:    { label: 'Butter',           water: 0.16, fat: 0.82,  cup: 227, count: { unit: 'stick', g: 113 }, stick: true }, // 173410
  oil:       { label: 'Oil',              water: 0,    fat: 1,     cup: 218 }, // canola 172336
  egg:       { label: 'Whole egg',        water: 0.76, fat: 0.10,  count: { unit: 'egg', g: 50 } }, // 171287
  yolk:      { label: 'Egg yolk',         water: 0.52, fat: 0.27,  count: { unit: 'yolk', g: 17 } }, // 172184
  white:     { label: 'Egg white',        water: 0.88, fat: 0,     count: { unit: 'white', g: 33 } }, // 172183: 87.57% water, large = 33 g
  milk:      { label: 'Whole milk',       water: 0.88, fat: 0.033, cup: 244 }, // 172217
  buttermilk:{ label: 'Buttermilk',       water: 0.90, fat: 0.011, cup: 245, acid: true }, // 170874 lowfat
  sourcream: { label: 'Sour cream',       water: 0.73, fat: 0.19,  cup: 230, acid: true }, // 171257
  water:     { label: 'Water',            water: 1,    fat: 0,     cup: 237 },
  cocoa:     { label: 'Cocoa (natural)',  water: 0.03, fat: 0.14,  cup: 84, acid: true }, // 169593
  bakingpowder: { label: 'Baking powder', water: 0,    fat: 0,     units: { tsp: 4, tbsp: 12 } }, // 172803
  bakingsoda:   { label: 'Baking soda',   water: 0,    fat: 0,     units: { tsp: 6, tbsp: 18 } }, // 175040
  salt:      { label: 'Salt',             water: 0,    fat: 0,     units: SALT_UNITS, tspNote: ' table salt' },
  vanilla:   { label: 'Vanilla extract',  water: 0.53, fat: 0,     units: { tsp: 14 / 3, tbsp: 14 } }, // 173471
};
export const isLiquid = (id) => ['egg', 'yolk', 'white', 'milk', 'buttermilk', 'sourcream', 'water'].includes(id);

// Starting recipes, % of flour. Derived on 2026-10-07 from King Arthur's published gram recipes (eggs counted at 50 g, yolk 17, white 33):
//   pound (4 recipes): butter 82-100, sugar 82-130, egg 42-88. The classic 1:1:1:1 is kept as the default; KA's own run slightly lower on eggs.
//   butter (6): butter 24-63 (most 44-63), sugar 83-165 (most 83-108), egg 50-93, milk/cream/yogurt 62-114, baking powder 2.8-4.0, salt 1.3-3.1, vanilla 3.6-5.8.
//   sponge (genoise + sponge, 4): sugar 100-166, egg 200-352, butter 0-63, no baking powder.
//   chiffon (3): sugar 106-124, oil 41-43, yolk 50-59, white 96-114, water or milk 65-95, baking powder 4.0-5.0, salt 1.9-2.6.
// Extras (cocoa 13-24, baking soda 1.1-2.5, buttermilk or yogurt 47-114, sour cream 95, oil 24 in a mixed-fat cake) come from KA chocolate, fudge and sour cream cakes.
// base = always on; pct = recommended % when blank; optional = extras the picker offers, with their recommended %.
// fat/leav = % of flour ranges that raise a warning when left (leav = baking powder + baking soda); they bracket the KA recipes above.
export const CAKE_TYPES = {
  pound: {
    label: 'Pound cake', base: ['flour', 'butter', 'sugar', 'egg', 'salt', 'vanilla'],
    pct: { butter: 100, sugar: 100, egg: 100, salt: 1.25, vanilla: 2 },
    optional: { bakingpowder: 2.5, bakingsoda: 1, milk: 45, sourcream: 95, water: 78, cocoa: 23 },
    fat: [70, 105], leav: [0, 5],
  },
  butter: {
    label: 'Butter cake', base: ['flour', 'butter', 'sugar', 'egg', 'milk', 'bakingpowder', 'salt', 'vanilla'],
    pct: { butter: 55, sugar: 100, egg: 55, milk: 75, bakingpowder: 3.2, salt: 1.5, vanilla: 3.5 },
    optional: { buttermilk: 70, sourcream: 95, water: 60, cocoa: 20, bakingsoda: 1.5, oil: 25 },
    fat: [40, 90], leav: [2, 7],
  },
  sponge: {
    label: 'Sponge (genoise)', base: ['flour', 'sugar', 'egg', 'butter', 'salt', 'vanilla'],
    pct: { sugar: 150, egg: 250, butter: 55, salt: 1.5, vanilla: 8 },
    optional: {},
    fat: [20, 90], leav: [0, 3],
  },
  chiffon: {
    label: 'Chiffon', base: ['flour', 'sugar', 'oil', 'yolk', 'white', 'water', 'bakingpowder', 'salt', 'vanilla'],
    pct: { sugar: 115, oil: 42, yolk: 55, white: 105, water: 80, bakingpowder: 4.5, salt: 2, vanilla: 4 },
    optional: { cocoa: 13, milk: 70, buttermilk: 70 },
    fat: [40, 70], leav: [3.5, 6],
  },
};
export const defaultPct = (type, id) => CAKE_TYPES[type].pct[id] ?? CAKE_TYPES[type].optional[id];

export const unitsFor = (id) => core.unitsFor(CAKE_ING, id);
export const toGrams = (id, amount, unit) => core.toGrams(CAKE_ING, id, amount, unit);
export const friendly = (id, grams) => core.friendly(CAKE_ING, id, grams);

// First given ingredient wins when flour is blank: flour = grams / (its recommended % / 100).
const ANCHORS = ['egg', 'butter', 'sugar', 'oil', 'milk', 'buttermilk', 'sourcream', 'water', 'yolk', 'white'];

// input: { type, amounts: { flour, ...ingredients } }. Returns { recipe, total, type, ratios, flourDefaulted, warnings } or { error: {field, message} }.
export function solveCake(input) {
  const type = input?.type;
  const T = CAKE_TYPES[type];
  if (!T) return fail('type', 'Pick a cake type.');
  const amounts = { flour: null, ...(input.amounts || {}) };
  for (const id of Object.keys(amounts)) if (amounts[id] === undefined) amounts[id] = null;
  const bad = core.checkAmounts(CAKE_ING, amounts);
  if (bad) return bad;
  for (const id of Object.keys(amounts)) if (id !== 'flour' && defaultPct(type, id) === undefined) return fail(id, `${CAKE_ING[id].label} isn't used in ${T.label.toLowerCase()} here.`);
  if (amounts.flour === 0) return fail('flour', 'Flour must be more than 0 g.');

  const how = {};
  const warnings = [];
  let F = amounts.flour;
  let flourDefaulted = false;
  if (F === null) {
    const a = ANCHORS.find((id) => amounts[id] > 0 && T.pct[id] > 0);
    if (a) { F = amounts[a] / (T.pct[a] / 100); how.flour = 'solved'; }
    else { F = DEFAULT_FLOUR; flourDefaulted = true; how.flour = 'recommended'; }
    if (F > MAX_GRAMS) return fail(a ?? 'flour', 'That works out to more than 50 kg of flour. Check the units.');
  }
  amounts.flour = F;
  for (const id of Object.keys(amounts)) if (amounts[id] === null) { amounts[id] = (defaultPct(type, id) * F) / 100; how[id] = 'recommended'; }

  const recipe = Object.entries(amounts).map(([id, grams]) => ({ id, label: CAKE_ING[id].label, grams, auto: id in how, how: how[id] ?? null, pct: (grams / F) * 100 }));
  const total = recipe.reduce((s, r) => s + r.grams, 0);
  const p = (id) => ((amounts[id] ?? 0) / F) * 100;
  const sum = (ids) => ids.reduce((s, id) => s + p(id), 0);
  const ratios = {
    sugar: p('sugar'),
    fat: Object.keys(amounts).reduce((s, id) => s + p(id) * CAKE_ING[id].fat, 0),
    liquid: sum(Object.keys(amounts).filter(isLiquid)),
    egg: sum(['egg', 'yolk', 'white']),
  };

  const w = (m) => warnings.push(m);
  const f0 = (n) => n.toFixed(0);
  if (type === 'pound') {
    for (const id of ['butter', 'sugar', 'egg']) if (p(id) < (id === 'egg' ? 40 : 75) || p(id) > 140) w(`${CAKE_ING[id].label} is ${f0(p(id))}% of flour; a classic pound cake is 1:1:1:1 (100% each) and King Arthur's pound cakes run about 80-100% for butter and sugar (up to 140% in a chocolate one) and 40-90% for eggs, so this is outside that.`);
  }
  if (type === 'butter') {
    if (ratios.sugar < 80) w(`Sugar is ${f0(ratios.sugar)}% of flour. King Arthur's butter cakes use 83% or more, and high-ratio cakes use at least as much sugar as flour.`);
    if (ratios.liquid < ratios.sugar) w(`Liquid (eggs, milk, dairy) is ${f0(ratios.liquid)}% of flour, less than the sugar at ${f0(ratios.sugar)}%. The sugar will not fully dissolve and the cake can bake dry.`);
  }
  if (type === 'sponge' && p('egg') < 180) w(`Eggs are ${f0(p('egg'))}% of flour. A sponge relies on whipped eggs for lift, and King Arthur's sponges use 200% or more.`);
  if (type === 'chiffon' && p('white') < p('yolk')) w('Whites weigh less than the yolks. Chiffon lifts on whipped whites, so use at least as many whites as yolks.');
  if (ratios.fat < T.fat[0] || ratios.fat > T.fat[1]) w(`Fat is about ${f0(ratios.fat)}% of flour; ${T.fat[0]}-${T.fat[1]}% is typical for ${T.label.toLowerCase()}.`);
  const leav = p('bakingpowder') + p('bakingsoda');
  if (leav < T.leav[0] || leav > T.leav[1]) w(`Baking powder and soda together are ${leav.toFixed(1)}% of flour; ${T.leav[0]}-${T.leav[1]}% is typical here (King Arthur's cakes use about 0.8-1.5 tsp baking powder per cup of flour, 2.5-5%, or soda alone up to about 2.5%).`);
  if (p('bakingsoda') > 0 && !Object.keys(amounts).some((id) => CAKE_ING[id].acid && amounts[id] > 0)) w('Baking soda needs an acid (buttermilk, sour cream or natural cocoa) to react. Without one it leaves a soapy taste.');
  if (p('bakingsoda') > 3) w(`Baking soda is ${p('bakingsoda').toFixed(1)}% of flour. King Arthur's cakes use up to about 2.5%; much more can taste soapy.`);
  if (flourDefaulted) w(`No flour or anchor ingredient entered, so I used ${DEFAULT_FLOUR} g flour. Change it and press Enter to rescale.`);

  return { recipe, total, type, ratios, flourDefaulted, warnings };
}

// ---- pans: batter volume scales with pan area (same depth). Dimensions in any one unit; both pans must use the same unit.
export function panArea(pan) {
  const n = (v) => (typeof v === 'number' && Number.isFinite(v) && v > 0 && v <= 100 ? v : NaN);
  const a = pan?.shape === 'round' ? Math.PI * (n(pan.d) / 2) ** 2
    : pan?.shape === 'square' ? n(pan.s) ** 2
    : pan?.shape === 'rect' ? n(pan.w) * n(pan.l) : NaN;
  return a;
}

// Scale a solved cake by a plain multiplier or from one pan to another. target: { factor } or { from: pan, to: pan }.
export function scaleCake(result, target) {
  if (!result || result.error) return fail('scale', 'Calculate a recipe first.');
  let k = target.factor;
  if (k === undefined) {
    const a = panArea(target.from), b = panArea(target.to);
    if (!(a > 0) || !(b > 0)) return fail('scale', 'Enter both pan sizes as positive numbers.');
    k = b / a;
  }
  if (!Number.isFinite(k) || k <= 0 || result.total * k > MAX_GRAMS * 4) return fail('scale', 'Enter a positive scale factor.');
  const warnings = [...result.warnings];
  if (k < 0.5 || k > 2) warnings.push(`That is ${k.toFixed(2)}x the batter. Bake time and temperature change a lot at this size; treat them as a starting point and check doneness.`);
  else if (Math.abs(k - 1) > 0.05) warnings.push('Bake time changes with batter depth and pan size. Check doneness a few minutes early (rule of thumb, not exact).');
  return { ...result, recipe: result.recipe.map((r) => ({ ...r, grams: r.grams * k })), total: result.total * k, factor: k, warnings };
}

// Share link: ?t=butter&flour=250&egg=&milk=100 (present key = selected, empty = blank)
export function encodeCakeShare({ type, amounts }) {
  const p = new URLSearchParams();
  p.set('t', type);
  for (const [id, v] of Object.entries(amounts)) p.set(id, v == null ? '' : String(v));
  return p.toString();
}

// Unknown keys are ignored; bad numbers become NaN so solveCake() reports them.
export function decodeCakeShare(query) {
  const p = new URLSearchParams(query);
  const num = (s) => (s === null || s === '' ? null : /^\d+(\.\d+)?$|^\.\d+$/.test(s) ? parseFloat(s) : NaN);
  const amounts = {};
  for (const id of Object.keys(CAKE_ING)) if (p.has(id)) amounts[id] = num(p.get(id));
  return { type: CAKE_TYPES[p.get('t')] ? p.get('t') : null, amounts };
}
