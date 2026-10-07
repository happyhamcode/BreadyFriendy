// Shared pure helpers for every calculator. No DOM.
// Ingredient tables are passed in; an entry may have: cup (grams per US cup), count {unit, g}, units {unit: grams} (replaces cup units).

export const CUP_ML = 236.588;
export const MAX_GRAMS = 50000;
export const WEIGHT_UNITS = { g: 1, oz: 28.3495 };
export const SALT_UNITS = { tsp: 6, tbsp: 18, 'tsp-diamond': 8 / 3, 'tsp-morton': 16 / 3 };

export const fail = (field, message) => ({ error: { field, message } });

// First problem in an amounts map (null = blank, NaN = unparseable), as { error: {field, message} }, or null if all fine.
export function checkAmounts(table, amounts) {
  for (const [id, v] of Object.entries(amounts)) {
    if (!table[id]) return fail(id, `Unknown ingredient "${id}".`);
    if (v === null) continue;
    const name = table[id].label;
    if (typeof v !== 'number' || Number.isNaN(v)) return fail(id, `${name}: enter a number.`);
    if (!Number.isFinite(v) || v > MAX_GRAMS) return fail(id, `${name}: that's more than ${MAX_GRAMS / 1000} kg. Check the units.`);
    if (v < 0) return fail(id, `${name} can't be negative.`);
  }
  return null;
}

// Units available for an ingredient: { unit: gramsPerUnit }
export function unitsFor(table, id) {
  const ing = table[id];
  if (!ing) return null;
  const u = { ...WEIGHT_UNITS };
  if (ing.units) return { ...u, ...ing.units };
  if (ing.cup) {
    u.cup = ing.cup; u.tbsp = ing.cup / 16; u.tsp = ing.cup / 48; u.ml = ing.cup / CUP_ML;
  }
  if (ing.extraCups) Object.assign(u, ing.extraCups);
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
export function toGrams(table, id, amount, unit) {
  const units = unitsFor(table, id);
  const n = parseAmount(amount);
  if (!units || n === null || !Number.isFinite(n) || n < 0 || !(unit in units)) return NaN;
  return n * units[unit];
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
// Entries with `units` (salt, yeast, leaveners) use their own tsp and never show tbsp; `tspNote` is appended to tsp text.
export function friendly(table, id, grams) {
  const ing = table[id];
  if (!ing || !(grams > 0)) return '';
  if (ing.count && !ing.cup) {
    const n = grams / ing.count.g;
    return n < 0.25 ? `less than ½ ${ing.count.unit}` : unitText(n, steps(1 / 2), ing.count.unit);
  }
  if (ing.stick && grams >= ing.count.g / 4) return unitText(grams / ing.count.g, steps(1 / 4, 1 / 2, 3 / 4), 'stick');
  const tsp = ing.units ? ing.units.tsp : ing.cup / 48;
  const cups = ing.cup ? grams / ing.cup : 0;
  if (cups >= 0.22) return unitText(cups, CUP, 'cup');
  const tbsp = grams / (tsp * 3);
  if (tbsp >= 0.75 && !ing.units) return unitText(tbsp, TBSP, 'tbsp');
  const t = grams / tsp;
  return t < 0.125 ? 'a pinch' : `${toFraction(t, TSP).text} tsp${ing.tspNote ?? ''}`;
}
