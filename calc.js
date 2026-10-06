// Bread Friend calculation core. Pure functions, no DOM.
// Hydration = true water (plain water + water inside enrichers) / flour.
// Inputs use grams; null/undefined = blank (to be solved), NaN = unparseable text.

const CUP_ML = 236.588;
export const MAX_GRAMS = 50000;
export const DEFAULT_FLOUR = 500;
export const DEFAULT_HYDRATION = 65; // percent, used when water is left blank and no hydration is given
export const HYDRATION_TOLERANCE = 0.5; // percentage points

// Sources: water/fat = USDA FoodData Central (SR Legacy); dry cups, eggs, salt, yeast = King Arthur ingredient weight chart;
// liquid cups (water, milk, cream, oil) = physical density (US cup = 236.6 ml), not KA's 8 oz = 227 g convention.
// Recommended amounts when a field is left blank (the same figures the home page states):
//   pct = % of flour weight; share = fraction of the dough's total water supplied by that liquid.
// water = water fraction, fat = fat fraction, cup = grams per US cup (tbsp = /16, tsp = /48, ml = cup/CUP_ML)
// count = grams per natural unit (egg, yolk, stick...). pct = default baker's % when left blank.
export const ING = {
  flour:     { label: 'Flour',       water: 0,    fat: 0,    cup: 120, count: null },
  water:     { label: 'Water',       water: 1,    fat: 0,    cup: 237, liquid: true },
  egg:       { label: 'Whole egg',   water: 0.76, fat: 0.10, liquid: true, pct: 15, count: { unit: 'egg', g: 50 } },
  yolk:      { label: 'Egg yolk',    water: 0.52, fat: 0.27, liquid: true, pct: 10, count: { unit: 'yolk', g: 17 } },
  milk:      { label: 'Whole milk',  water: 0.88, fat: 0.033, cup: 244, liquid: true, share: 0.5 },
  cream:     { label: 'Heavy cream', water: 0.58, fat: 0.36, cup: 238, liquid: true, share: 0.25 },
  butter:    { label: 'Butter',      water: 0.16, fat: 0.82, cup: 227, pct: 12, count: { unit: 'stick', g: 113 } },
  oil:       { label: 'Oil',         water: 0,    fat: 1,    cup: 218, pct: 7 },
  sugar:     { label: 'Sugar',       water: 0,    fat: 0,    cup: 198, pct: 10 },
  honey:     { label: 'Honey',       water: 0.17, fat: 0,    cup: 340, pct: 7 },
  milkpowder:{ label: 'Milk powder', water: 0.03, fat: 0.01, cup: 112, pct: 4 },
  salt:      { label: 'Salt',        water: 0,    fat: 0,    pct: 2 },
  yeast:     { label: 'Yeast',       water: 0,    fat: 0 },
};
export const ENRICHERS = ['egg', 'yolk', 'milk', 'cream', 'butter', 'oil', 'sugar', 'honey', 'milkpowder'];
export const BASE = ['flour', 'water', 'salt', 'yeast'];
export const isLiquid = (id) => !!ING[id].liquid;

// pct = default % of flour; water = water fraction (fresh yeast is ~70% water); toInstant = multiplier to instant-yeast grams
export const YEAST = {
  instant: { label: 'Instant', pct: 1,   water: 0,    toInstant: 1 },
  active:  { label: 'Active dry', pct: 1.3, water: 0,  toInstant: 1 / 1.3 },
  fresh:   { label: 'Fresh (cake)', pct: 3, water: 0.7, toInstant: 1 / 3 },
};

const WEIGHT_UNITS = { g: 1, oz: 28.3495 };
const SALT_UNITS = { tsp: 6, tbsp: 18, 'tsp-diamond': 8 / 3, 'tsp-morton': 16 / 3 };
const YEAST_UNITS = { tsp: 3, tbsp: 9, packet: 7, cake: 17 };

// Units available for an ingredient: { unit: gramsPerUnit }
export function unitsFor(id) {
  const ing = ING[id];
  if (!ing) return null;
  const u = { ...WEIGHT_UNITS };
  if (id === 'salt') return { ...u, ...SALT_UNITS };
  if (id === 'yeast') return { ...u, ...YEAST_UNITS };
  if (ing.cup) {
    u.cup = ing.cup; u.tbsp = ing.cup / 16; u.tsp = ing.cup / 48; u.ml = ing.cup / CUP_ML;
  }
  if (id === 'flour') u['cup-whole-wheat'] = 113;
  if (ing.count) u[ing.count.unit] = ing.count.g;
  return u;
}

const VULGAR = { '¼': 0.25, '½': 0.5, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3, '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875 };

// "1 1/2", "¾", "1¾", ".5", "2" -> number. "" -> null (blank). Anything else -> NaN.
export function parseAmount(text) {
  if (typeof text === 'number') return Number.isFinite(text) ? text : NaN;
  if (text == null) return null;
  let s = String(text).trim();
  if (s === '') return null;
  let total = 0;
  const v = s.match(/([¼½¾⅓⅔⅛⅜⅝⅞])$/);
  if (v) { total += VULGAR[v[1]]; s = s.slice(0, -1).trim(); if (s === '') return total; }
  const mixed = s.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixed) {
    if (+mixed[3] === 0 || v) return NaN;
    return +mixed[1] + +mixed[2] / +mixed[3] + total;
  }
  const frac = s.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (frac) return +frac[2] === 0 || v ? NaN : +frac[1] / +frac[2];
  if (/^(\d+\.?\d*|\.\d+)$/.test(s)) return parseFloat(s) + total;
  return NaN;
}

// Convert an amount in a unit to grams. Returns number, or NaN on bad amount/unit.
export function toGrams(id, amount, unit) {
  const units = unitsFor(id);
  const n = parseAmount(amount);
  if (!units || n === null || !Number.isFinite(n) || n < 0 || !(unit in units)) return NaN;
  return n * units[unit];
}

const waterFrac = (id, yt) => (id === 'yeast' ? YEAST[yt].water : ING[id].water);
const defaultPct = (id, yt) => (id === 'yeast' ? YEAST[yt].pct : ING[id].pct);
const fail = (field, message) => ({ error: { field, message } });
const g1 = (n) => (n < 20 ? n.toFixed(1) : Math.round(n)); // display rounding

// input: { amounts: { flour, water, salt, yeast, ...enrichers }, hydration (percent|null), yeastType }
// Blank fields get the recommended amount (see ING pct/share, DEFAULT_HYDRATION) or are solved from hydration:
//   - water blank: enrichers take their recommended amounts, water makes up the rest of the hydration
//   - water given + hydration given: blank liquid enrichers split whatever water is still missing, equal grams
// Returns { recipe, hydration, total, flourDefaulted, hydrationDefaulted, waterBreakdown, warnings, yeastEquivalents } or { error: {field, message} }
export function solve(input) {
  const yt = input?.yeastType ?? 'instant';
  if (!YEAST[yt]) return fail('yeastType', 'Pick a yeast type.');
  const amounts = { flour: null, water: null, salt: null, yeast: null, ...(input.amounts || {}) };

  for (const [id, raw] of Object.entries(amounts)) {
    if (!ING[id]) return fail(id, `Unknown ingredient "${id}".`);
    const v = raw === undefined ? null : raw;
    amounts[id] = v;
    if (v === null) continue;
    const name = ING[id].label;
    if (typeof v !== 'number' || Number.isNaN(v)) return fail(id, `${name}: enter a number.`);
    if (!Number.isFinite(v) || v > MAX_GRAMS) return fail(id, `${name}: that's more than ${MAX_GRAMS / 1000} kg. Check the units.`);
    if (v < 0) return fail(id, `${name} can't be negative.`);
  }
  if (amounts.flour === 0) return fail('flour', 'Flour must be more than 0 g.');

  let H = input.hydration ?? null;
  if (H !== null) {
    if (typeof H !== 'number' || !Number.isFinite(H)) return fail('hydration', 'Hydration: enter a number.');
    if (H < 1 || H > 150) return fail('hydration', 'Hydration must be between 1% and 150%.');
    H /= 100;
  }

  const ids = Object.keys(amounts);
  const how = {}; // id -> 'recommended' | 'solved' for every field the solver filled
  const warnings = [];
  let hydrationDefaulted = false;
  if (H === null && amounts.water === null) { H = DEFAULT_HYDRATION / 100; hydrationDefaulted = true; }
  const baseH = H ?? DEFAULT_HYDRATION / 100;
  const waterGiven = amounts.water !== null;
  const blanks = ids.filter((id) => id !== 'flour' && amounts[id] === null);
  const blankN = blanks.filter((id) => !isLiquid(id));
  const blankL = blanks.filter((id) => id !== 'water' && isLiquid(id));
  const solveL = H !== null && waterGiven ? blankL : [];
  const recL = blankL.filter((id) => !solveL.includes(id));
  const wf = (id) => waterFrac(id, yt);
  const knownWater = () => ids.reduce((s, id) => s + (amounts[id] ?? 0) * wf(id), 0);
  let F = amounts.flour;
  const recAmount = (id) => (ING[id].share != null ? (ING[id].share * baseH * F) / wf(id) : (defaultPct(id, yt) * F) / 100);
  const tooWet = (water) => {
    const p = ((water / F) * 100).toFixed(1);
    return fail('hydration', hydrationDefaulted
      ? `Your ingredients already contain ${g1(water)} g of water (${p}% hydration), above the recommended ${DEFAULT_HYDRATION}%. Enter a hydration of at least ${p}%, add flour, or lower something.`
      : `Your ingredients already contain ${g1(water)} g of water (${p}% hydration). Lower them, add flour, or raise hydration to at least ${p}%.`);
  };

  let flourDefaulted = false;
  if (F === null) {
    if (H === null) return fail('flour', 'Enter flour, or enter a hydration % and I will fill in the rest.');
    if (waterGiven && !solveL.length) { // every liquid is known, so flour follows from the water
      const D = H - blankN.reduce((s, id) => s + (defaultPct(id, yt) / 100) * wf(id), 0);
      if (D <= 1e-9) return fail('hydration', 'That hydration is too low for the other ingredients to fit. Raise it.');
      F = knownWater() / D;
      if (!(F > 0)) return fail('flour', 'Add some water or liquid, or enter flour, so there is something to solve from.');
      how.flour = 'solved';
    } else {
      F = DEFAULT_FLOUR; flourDefaulted = true; how.flour = 'recommended';
    }
  }
  amounts.flour = F;
  for (const id of blankN) { amounts[id] = recAmount(id); how[id] = 'recommended'; }

  if (H === null) {
    for (const id of recL) { amounts[id] = recAmount(id); how[id] = 'recommended'; }
  } else if (!waterGiven) {
    const room = H * F - knownWater(); // water still available for plain water + the recommended liquids
    const S = recL.reduce((s, id) => s + recAmount(id) * wf(id), 0);
    if (room < -1e-9 || (room < 1e-9 && S > 0)) return tooWet(knownWater());
    const k = S > room ? room / S : 1;
    if (k < 1) warnings.push(`The recommended amounts of your enrichers hold more water than ${(H * 100).toFixed(0)}% hydration allows, so I scaled them down. Remove an enricher or raise hydration for the full amounts.`);
    for (const id of recL) { amounts[id] = recAmount(id) * k; how[id] = 'recommended'; }
    amounts.water = Math.max(0, room - S * k); how.water = 'solved';
  } else {
    const Wk = knownWater();
    if (solveL.length) {
      const R = H * F - Wk;
      if (R < -1e-9) return tooWet(Wk);
      const each = Math.max(0, R) / solveL.reduce((s, id) => s + wf(id), 0);
      for (const id of solveL) { amounts[id] = each; how[id] = 'solved'; }
    } else if (how.flour !== 'solved' && Math.abs(Wk / F - H) * 100 > HYDRATION_TOLERANCE) {
      return fail('hydration', `Your amounts give ${(Wk / F * 100).toFixed(1)}% hydration, but you asked for ${(H * 100).toFixed(1)}%. Clear one field and I'll solve it.`);
    }
  }

  const recipe = ids.map((id) => ({
    id, label: ING[id].label, grams: amounts[id], auto: id in how, how: how[id] ?? null, pct: (amounts[id] / F) * 100,
  }));
  const total = recipe.reduce((s, r) => s + r.grams, 0);
  const waterBreakdown = recipe
    .map((r) => ({ id: r.id, label: r.label, grams: r.grams * wf(r.id) }))
    .filter((r) => r.grams > 0);
  const totalWater = waterBreakdown.reduce((s, r) => s + r.grams, 0);
  const hydration = (totalWater / F) * 100;

  const yeastG = amounts.yeast;
  const yeastEquivalents = Object.fromEntries(
    Object.entries(YEAST).map(([k, y]) => [k, (yeastG * YEAST[yt].toInstant) / y.toInstant]),
  );

  const pct = (id) => (amounts[id] ?? 0) / F * 100;
  const fat = ids.reduce((s, id) => s + amounts[id] * ING[id].fat, 0) / F * 100;
  if (hydration < 50) warnings.push(`Hydration ${hydration.toFixed(0)}% is very low; the dough will be stiff.`);
  if (hydration > 85) warnings.push(`Hydration ${hydration.toFixed(0)}% is very high for enriched dough; expect a batter-like dough.`);
  if (pct('salt') < 1.5 || pct('salt') > 3) warnings.push(`Salt is ${pct('salt').toFixed(1)}% of flour; 1.5-3% is typical.`);
  if (pct('yeast') === 0) warnings.push('No yeast: the dough will not rise.');
  else if (pct('yeast') > 3 * YEAST[yt].pct) warnings.push(`Yeast is ${pct('yeast').toFixed(1)}% of flour, over 3x the usual amount for ${YEAST[yt].label.toLowerCase()}.`);
  if (pct('sugar') + pct('honey') > 25) warnings.push('Over 25% sugar slows regular yeast; consider osmotolerant (SAF Gold) yeast.');
  if (fat > 60) warnings.push(`Fat is about ${fat.toFixed(0)}% of flour; very rich doughs need long mixing and gentle handling.`);
  if (hydrationDefaulted) warnings.push(`No hydration entered, so I used the recommended ${DEFAULT_HYDRATION}%.`);
  if (flourDefaulted) warnings.push(`No flour entered, so I used ${DEFAULT_FLOUR} g. Change it and press Enter to rescale.`);

  return { recipe, hydration, total, flourDefaulted, hydrationDefaulted, waterBreakdown, warnings, yeastEquivalents, yeastType: yt };
}

// Typical true-hydration brackets with example breads. Rich doughs read low: butter and eggs add richness, not water.
// Boundaries: min inclusive, max exclusive. The home page lists the same brackets (a test keeps them in sync).
export const BRACKETS = [
  { min: 0, max: 45, label: 'Very stiff', breads: 'Too dry for most bread. Closer to pasta or cracker dough.' },
  { min: 45, max: 55, label: 'Stiff and rich', breads: 'Brioche, bagels, pretzels, croissant dough.' },
  { min: 55, max: 62, label: 'Firm', breads: 'Challah, cinnamon rolls, Neapolitan-style pizza.' },
  { min: 62, max: 70, label: 'Soft and workable', breads: 'Sandwich loaves, dinner rolls, milk bread, New York-style pizza, classic French bread.' },
  { min: 70, max: 80, label: 'Sticky, open crumb', breads: 'Rustic baguettes, country loaves, Hokkaido milk bread, pan pizza.' },
  { min: 80, max: 90, label: 'Very wet', breads: 'Ciabatta, focaccia, Roman-style pizza.' },
  { min: 90, max: Infinity, label: 'Batter-like', breads: 'Pan de cristal and no-knead batters. Not a kneaded dough.' },
].map((b) => ({ ...b, range: b.min === 0 ? `Under ${b.max}%` : b.max === Infinity ? `${b.min}%+` : `${b.min}-${b.max}%` }));
export const bracketFor = (h) => (Number.isFinite(h) && h >= 0 ? BRACKETS.find((b) => h >= b.min && h < b.max) : null) ?? null;

// Scale a solved result. target: { totalDough } or { loaves, each } in grams.
export function scale(result, target) {
  if (!result || result.error) return fail('scale', 'Calculate a recipe first.');
  const t = target.totalDough ?? target.loaves * target.each;
  if (!Number.isFinite(t) || t <= 0 || t > MAX_GRAMS * 4) return fail('scale', 'Enter a positive target dough weight.');
  const k = t / result.total;
  return { ...result, recipe: result.recipe.map((r) => ({ ...r, grams: r.grams * k })), waterBreakdown: result.waterBreakdown.map((r) => ({ ...r, grams: r.grams * k })), total: t, yeastEquivalents: Object.fromEntries(Object.entries(result.yeastEquivalents).map(([a, b]) => [a, b * k])), factor: k };
}

const FR = [[1 / 8, '⅛'], [1 / 4, '¼'], [1 / 3, '⅓'], [1 / 2, '½'], [2 / 3, '⅔'], [3 / 4, '¾']];
const steps = (...vs) => [[0, ''], ...FR.filter(([v]) => vs.some((w) => Math.abs(w - v) < 1e-9)), [1, '']];

// Nearest kitchen fraction as text ("1 ½"). Returns { text, value } where value is the rounded number.
export function toFraction(x, allowed) {
  let whole = Math.floor(x);
  const f = x - whole;
  let [v, sym] = allowed.reduce((a, b) => (Math.abs(b[0] - f) < Math.abs(a[0] - f) ? b : a));
  if (v === 1) { whole += 1; v = 0; sym = ''; }
  return { text: [whole || '', sym].filter(Boolean).join(' ') || '0', value: whole + v };
}
const CUP = steps(1 / 4, 1 / 3, 1 / 2, 2 / 3, 3 / 4), TBSP = steps(1 / 4, 1 / 2, 3 / 4), TSP = steps(1 / 8, 1 / 4, 1 / 2, 3 / 4);
const unitText = (n, allowed, unit) => {
  const { text, value } = toFraction(n, allowed);
  return `${text} ${unit}${value > 1 && !/^t(bsp|sp)$/.test(unit) ? 's' : ''}`;
};

// Kitchen-measure hint for a recipe line, using fractions (never decimals): "1 ½ cups", "¾ tsp", "2 ½ eggs".
export function friendly(id, grams) {
  const ing = ING[id];
  if (!ing || !(grams > 0)) return '';
  if (id === 'egg' || id === 'yolk') {
    const n = grams / ing.count.g;
    return n < 0.25 ? `less than ½ ${ing.count.unit}` : unitText(n, steps(1 / 2), ing.count.unit);
  }
  if (id === 'butter' && grams >= ING.butter.count.g / 4) return unitText(grams / ING.butter.count.g, steps(1 / 4, 1 / 2, 3 / 4), 'stick');
  const tsp = id === 'salt' ? SALT_UNITS.tsp : id === 'yeast' ? YEAST_UNITS.tsp : ing.cup / 48;
  const cups = ing.cup ? grams / ing.cup : 0;
  if (cups >= 0.22) return unitText(cups, CUP, 'cup');
  const tbsp = grams / (tsp * 3);
  if (tbsp >= 0.75 && id !== 'salt' && id !== 'yeast') return unitText(tbsp, TBSP, 'tbsp');
  const t = grams / tsp;
  return t < 0.125 ? 'a pinch' : `${toFraction(t, TSP).text} tsp${id === 'salt' ? ' table salt' : ''}`;
}

// Share link: ?yt=instant&h=65&flour=500&water=&egg=100 (present key = selected, empty = blank)
export function encodeShare({ amounts, hydration, yeastType }) {
  const p = new URLSearchParams();
  p.set('yt', yeastType ?? 'instant');
  p.set('h', hydration == null ? '' : String(hydration));
  for (const [id, v] of Object.entries(amounts)) p.set(id, v == null ? '' : String(v));
  return p.toString();
}

// Unknown keys are ignored; bad numbers become NaN so solve() reports them.
export function decodeShare(query) {
  const p = new URLSearchParams(query);
  const num = (s) => (s === null || s === '' ? null : /^\d+(\.\d+)?$|^\.\d+$/.test(s) ? parseFloat(s) : NaN);
  const yt = p.get('yt');
  const amounts = {};
  for (const id of Object.keys(ING)) if (p.has(id)) amounts[id] = num(p.get(id));
  return { amounts, hydration: num(p.get('h')), yeastType: YEAST[yt] ? yt : 'instant' };
}
