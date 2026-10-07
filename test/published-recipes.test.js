// Every recipe here is a King Arthur recipe with gram weights, parsed from the page's recipe data on 2026-10-07.
// Eggs 50 g, yolk 17 g, white 33 g. A tsp of baking powder is 4 g and soda 6 g (King Arthur chart), instant yeast 3 g per tsp, 9 g per tbsp.
// The calculators must treat a published recipe as unremarkable: no warnings, and the hydration bracket examples must match.
import test from 'node:test';
import assert from 'node:assert/strict';
import { solve, bracketFor } from '../bread.js';
import { solveCake, CAKE_TYPES } from '../cake.js';

const KA = 'https://www.kingarthurbaking.com/recipes/';

// [type, name, url slug, grams]. Cream, yogurt and self-rising-flour recipes are left out (no matching ingredient / flour carries the leavener).
const CAKES = [
  ['pound', "King Arthur's Original Pound Cake", 'king-arthurs-original-pound-cake-recipe', { flour: 240, butter: 227, sugar: 198, egg: 200, milk: 113, bakingpowder: 6, salt: 3, vanilla: 4.7 }],
  ['pound', 'Brown Sugar Sour Cream Pound Cake', 'brown-sugar-sour-cream-pound-cake-recipe', { flour: 240, butter: 227, sugar: 312, egg: 100, sourcream: 227, bakingpowder: 4, bakingsoda: 1.5, salt: 6, vanilla: 7 }],
  ['pound', 'Chocolate Pound Cake', 'chocolate-pound-cake-recipe', { flour: 180, butter: 141, sugar: 248, egg: 150, cocoa: 42, water: 141, bakingpowder: 4, bakingsoda: 1.5, salt: 3, vanilla: 9.3 }],
  ['butter', 'Back-to-Basics Yellow Cake', 'back-to-basics-yellow-cake-recipe', { flour: 360, butter: 227, sugar: 298, egg: 200, milk: 227, bakingpowder: 10, salt: 4.5, vanilla: 14 }],
  ['butter', 'Golden Vanilla Cake', 'golden-vanilla-cake-recipe', { flour: 390, butter: 170, sugar: 397, egg: 200, milk: 340, bakingpowder: 12, salt: 6, vanilla: 14 }],
  ['butter', 'Classic Birthday Cake (hot milk, butter and oil)', 'classic-birthday-cake-recipe', { flour: 240, butter: 57, oil: 67, sugar: 397, egg: 200, milk: 227, bakingpowder: 8, salt: 7.5, vanilla: 14 }],
  ['butter', 'Classic Yellow Cake with Fudge Frosting (yogurt as buttermilk)', 'classic-yellow-cake-with-fudge-frosting-recipe', { flour: 200, butter: 113, sugar: 198, egg: 100, buttermilk: 227, bakingpowder: 8, bakingsoda: 4.5, salt: 4.5, vanilla: 14 }],
  ['butter', 'Chocolate Cake', 'chocolate-cake-recipe', { flour: 270, butter: 113, oil: 64, sugar: 354, egg: 200, milk: 227, water: 113, cocoa: 64, bakingpowder: 6, bakingsoda: 3, salt: 4.5, vanilla: 9.3 }],
  ['butter', "King Arthur's Favorite Fudge Cake", 'king-arthurs-favorite-fudge-cake-recipe', { flour: 240, butter: 227, sugar: 397, egg: 100, buttermilk: 113, water: 227, cocoa: 42, bakingsoda: 6, salt: 3.5, vanilla: 4.7 }],
  ['sponge', 'Genoise (flour only)', 'genoise-recipe', { flour: 90, sugar: 149, egg: 317, butter: 57, salt: 1.5, vanilla: 9.3 }],
  ['sponge', 'Sponge Cake with Cranberry Curd', 'sponge-cake-with-cranberry-curd-recipe', { flour: 120, sugar: 198, egg: 300, salt: 1.5, vanilla: 9.3 }],
  ['chiffon', 'Chiffon Cake', 'chiffon-cake-recipe', { flour: 240, sugar: 298, oil: 99, yolk: 119, white: 231, milk: 170, bakingpowder: 10, salt: 4.5, vanilla: 9.3 }],
  ['chiffon', 'Lemon Chiffon Cake', 'lemon-chiffon-cake-recipe', { flour: 240, sugar: 298, oil: 99, yolk: 136, white: 264, water: 227, bakingpowder: 12, salt: 6, vanilla: 9.3 }],
  ['chiffon', 'Olive Oil Chiffon Cake', 'olive-oil-chiffon-cake-recipe', { flour: 173, sugar: 184, oil: 75, yolk: 102, white: 198, water: 113, bakingpowder: 7, salt: 4.5 }],
  ['chiffon', 'Double Chocolate Chiffon Cake', 'double-chocolate-chiffon-cake-recipe', { flour: 210, sugar: 298, oil: 99, yolk: 119, white: 231, buttermilk: 170, cocoa: 28, bakingpowder: 10, salt: 4.5, vanilla: 9.3 }],
];

test('published King Arthur cakes solve with no balance warnings', () => {
  for (const [type, name, slug, amounts] of CAKES) {
    const r = solveCake({ type, amounts });
    assert.equal(r.error, undefined, `${name} (${KA}${slug})`);
    assert.deepEqual(r.warnings, [], `${name} (${KA}${slug}): ${r.warnings}`);
  }
  assert.ok(CAKES.length >= 15);
});

// Independent (non-King-Arthur) recipes, read from their own pages on 2026-10-07 by a research pass. Cups, tsp and egg counts converted by hand
// (baking powder 4.5 g/tsp, salt 5 g/tsp, vanilla 4 g/tsp, egg 50 g), so leavening, salt and vanilla are approximate. Egg whites in a butter cake are entered as egg.
const INDEPENDENT_CAKES = [
  ['pound', "Simone's Kitchen pound cake", 'https://insimoneskitchen.com/wprm_print/basic-pound-cake-recipe', { flour: 225, butter: 225, sugar: 225, egg: 225, salt: 5, vanilla: 4 }],
  ['pound', "Stefan's Gourmet pound cake", 'https://stefangourmet.com/2012/01/15/pound-cake/', { flour: 300, butter: 300, sugar: 300, egg: 300, bakingpowder: 15 }],
  ['pound', 'Allinson Victoria sponge (self-raising flour)', 'https://www.allinsonflour.co.uk/recipes/victoria-sponge', { flour: 225, butter: 225, sugar: 225, egg: 200, milk: 15, vanilla: 4 }],
  ['butter', 'Cake by Courtney classic vanilla (whites as egg)', 'https://cakebycourtney.com/wprm_print/classic-vanilla-cake', { flour: 345, butter: 226, sugar: 350, egg: 198, buttermilk: 240, sourcream: 120, bakingpowder: 10, salt: 5, vanilla: 13 }],
  ['butter', 'Sweetly Cakes 6-inch vanilla', 'https://sweetlycakes.com/en/6-inch-vanilla-cake/print/68843', { flour: 270, butter: 150, sugar: 300, egg: 150, buttermilk: 220, bakingpowder: 6.75, bakingsoda: 3, salt: 1.25, vanilla: 6 }],
  ['butter', 'Lovefood vanilla layer cake', 'https://lovefood.com/recipes/59708/vanilla-layer-cake-recipe', { flour: 275, butter: 200, sugar: 375, egg: 201, milk: 160, bakingpowder: 9, salt: 2.5, vanilla: 14 }],
  ['butter', 'Baking with Butter 8-inch vanilla', 'https://bakingwithbutter.com/wprm_print/perfect-8-inch-vanilla-cake', { flour: 310, butter: 113, oil: 54, sugar: 250, egg: 150, milk: 180, bakingpowder: 9, bakingsoda: 1.5, salt: 2.5, vanilla: 8 }],
  ['sponge', 'Sikana genoise', 'https://sikana.tv/en/cooking/prepare-your-own-desserts/simple-recipe-for-genoise-italian-sponge-cake', { flour: 75, sugar: 125, egg: 250, butter: 30 }],
  ['sponge', 'Cooklang genoise', 'https://recipes.cooklang.org/recipes/591', { flour: 120, sugar: 132, egg: 200, butter: 25, salt: 1.5, vanilla: 1.3 }],
  ['sponge', 'Baking Like a Chef genoise', 'https://www.bakinglikeachef.com/genoise-cake-recipe/', { flour: 120, sugar: 120, egg: 200, butter: 30 }],
  ['sponge', 'Only Crumbs Remain genoise', 'https://onlycrumbsremain.com/side-by-side-baking-genoise-cake/', { flour: 125, sugar: 125, egg: 200, butter: 40 }],
  ['sponge', 'Delicious magazine genoise', 'https://www.deliciousmagazine.co.uk/recipes/genoise-sponge/', { flour: 100, sugar: 125, egg: 200, butter: 100 }],
  ['chiffon', "America's Test Kitchen chiffon", 'https://www.americastestkitchen.com/lessons/recipes/2146-chiffon-cake', { flour: 151, sugar: 298, oil: 109, yolk: 85, white: 165, water: 177, bakingpowder: 9, salt: 3, vanilla: 12 }],
  ['chiffon', 'Sweetly Cakes chiffon', 'https://sweetlycakes.com/en/chiffon-cake/print/36953/', { flour: 210, sugar: 225, oil: 115, yolk: 119, white: 231, water: 180, bakingpowder: 9, salt: 3, vanilla: 8 }],
  ['chiffon', 'Baking Sense chiffon', 'https://www.baking-sense.com/wprm_print/13675', { flour: 283.5, sugar: 340, oil: 91, yolk: 102, white: 198, water: 170, bakingpowder: 13.5, salt: 3, vanilla: 12 }],
];

test('independent (non-King-Arthur) cakes solve with no balance warnings', () => {
  for (const [type, name, url, amounts] of INDEPENDENT_CAKES) {
    const r = solveCake({ type, amounts });
    assert.equal(r.error, undefined, `${name} (${url})`);
    assert.deepEqual(r.warnings, [], `${name} (${url}): ${r.warnings}`);
  }
});

test('cake type defaults sit inside the range of the published recipes of that type', () => {
  for (const type of Object.keys(CAKE_TYPES)) {
    const recs = [...CAKES, ...INDEPENDENT_CAKES.map((c) => [c[0], c[1], c[2], c[3]])].filter((c) => c[0] === type).map((c) => c[3]);
    for (const [id, pct] of Object.entries(CAKE_TYPES[type].pct)) {
      if (id === 'flour') continue;
      const seen = recs.filter((a) => a[id] !== undefined).map((a) => (a[id] / a.flour) * 100);
      if (seen.length < 2) continue; // too few recipes to judge an ingredient
      assert.ok(pct >= Math.min(...seen) * 0.75 && pct <= Math.max(...seen) * 1.25, `${type}/${id}: default ${pct} vs published ${seen.map((x) => x.toFixed(1))}`);
    }
  }
});

// [name, slug, grams, expected true hydration (this repo's composition table), a word the matching bracket example must contain]
const BREADS = [
  ['Braided Challah', 'braided-challah-recipe', { flour: 375, water: 90, egg: 100, yolk: 17, honey: 64, oil: 56, salt: 10.5, yeast: 6 }, 49.5, /challah/i],
  ['Brioche', 'brioche-recipe', { flour: 330, milkpowder: 28, sugar: 35, salt: 8, yeast: 9, egg: 150, water: 57, butter: 142 }, 59.0, /brioche/i],
  ['Brioche Buns', 'brioche-buns-recipe', { flour: 330, milkpowder: 28, sugar: 25, salt: 8, yeast: 9, egg: 150, yolk: 17, water: 57, butter: 142 }, 61.6, /brioche/i],
  ['Weeknight Neapolitan-Style Pizza (mid water)', 'weeknight-neapolitan-style-pizza-recipe', { flour: 360, water: 212, oil: 25, salt: 8, yeast: 6 }, 58.9, /pizza/i],
  ['Soft Dinner Rolls (potato flour left out)', 'soft-dinner-rolls-recipe', { flour: 360, sugar: 39, salt: 8, yeast: 7, water: 71, milk: 170, butter: 43 }, null, null], // potato flour (46 g) is left out, so hydration is not judged
  ['Bagels', 'bagels-recipe', { flour: 480, water: 303, salt: 12, yeast: 9, sugar: 14 }, 63.1, null], // independent bagel recipes run 57-63%, so the bracket names bagels in 55-62
  ['Everything Pretzels', 'everything-pretzels-recipe', { flour: 420, water: 283, milkpowder: 28, butter: 28, salt: 9, yeast: 6 }, 68.6, null], // independent pretzel recipes run 54-55%; this one is the wet outlier
  ['Classic Sandwich Bread (mid water)', 'classic-sandwich-bread-recipe', { flour: 360, milk: 113, water: 132, butter: 57, sugar: 25, salt: 8, yeast: 6 }, 66.8, /sandwich/i],
  ['Japanese Milk Bread', 'japanese-milk-bread-recipe', { flour: 314, milkpowder: 14, sugar: 50, salt: 6, yeast: 9, milk: 156, water: 43, egg: 50, butter: 57 }, 72.6, /milk bread/i],
  ['Soft Cinnamon Rolls (dough only)', 'soft-cinnamon-rolls-recipe', { flour: 520, milkpowder: 21, salt: 11, yeast: 9, water: 71, milk: 241, egg: 100, butter: 85 }, 71.8, /cinnamon rolls/i],
  ['Rustic Italian Ciabatta', 'rustic-italian-ciabatta-recipe', { flour: 452, water: 340, salt: 9, yeast: 3 }, 75.2, /ciabatta/i],
  ['No-Fuss Focaccia', 'no-fuss-focaccia-recipe', { flour: 420, water: 340, oil: 73, salt: 8, yeast: 9 }, 81.0, /focaccia/i],
  ['Honey Wheat Rolls (potato flakes and orange juice left out)', 'honey-wheat-rolls-recipe', { flour: 347, water: 227, butter: 57, honey: 64, salt: 8, milkpowder: 21, yeast: 7 }, null, null],
  ['Super-Soft Whole Wheat Rolls', 'super-soft-whole-wheat-rolls-recipe', { flour: 341, water: 0, milk: 284, butter: 57, honey: 63, salt: 9, yeast: 7 }, null, null], // whole wheat absorbs more water, so hydration is not judged
];

test('published King Arthur breads: true hydration, no warnings, and the bracket examples name them', () => {
  for (const [name, slug, amounts, hyd, example] of BREADS) {
    const r = solve({ amounts, hydration: null });
    assert.equal(r.error, undefined, name);
    if (hyd !== null) assert.ok(Math.abs(r.hydration - hyd) < 0.6, `${name}: ${r.hydration.toFixed(1)} vs ${hyd} (${KA}${slug})`);
    assert.deepEqual(r.warnings, [], `${name}: ${r.warnings}`);
    if (example) assert.match(bracketFor(r.hydration).breads, example, `${name} at ${r.hydration.toFixed(1)}%`);
  }
});

test('bread defaults sit inside the range of the published enriched recipes', () => {
  const pct = (a, id) => (a[id] / a.flour) * 100;
  const range = (id, from = BREADS) => { const v = from.map((b) => b[2]).filter((a) => a[id] !== undefined).map((a) => pct(a, id)); return [Math.min(...v), Math.max(...v)]; };
  const inside = (x, [lo, hi]) => x >= lo * 0.75 && x <= hi * 1.25;
  const defaults = { yeast: 2, salt: 2, sugar: 10, butter: 15, egg: 15, honey: 15, milkpowder: 6, oil: 7, yolk: 5 };
  for (const [id, d] of Object.entries(defaults)) assert.ok(inside(d, range(id)), `${id}: ${d} vs ${range(id).map((x) => x.toFixed(1))}`);
});

test('the true-hydration learn table matches the published recipes it cites', async () => {
  const { readFileSync } = await import('node:fs');
  const page = readFileSync(new URL('../learn/true-hydration/index.html', import.meta.url), 'utf8');
  const by = { 'Braided challah': 'braided-challah-recipe', Brioche: 'brioche-recipe', 'Brioche buns': 'brioche-buns-recipe', Bagels: 'bagels-recipe', 'Everything pretzels': 'everything-pretzels-recipe',
    'Soft cinnamon rolls (dough)': 'soft-cinnamon-rolls-recipe', 'Japanese milk bread': 'japanese-milk-bread-recipe', 'Rustic Italian ciabatta': 'rustic-italian-ciabatta-recipe', 'No-fuss focaccia': 'no-fuss-focaccia-recipe' };
  for (const [label, slug] of Object.entries(by)) {
    const shown = +page.match(new RegExp(`<th scope=row>${label.replace(/[()]/g, '\\$&')}</th><td class=num>(\\d+)%`))[1];
    const rec = BREADS.find((b) => b[1] === slug);
    assert.equal(shown, Math.round(solve({ amounts: rec[2], hydration: null }).hydration), label);
  }
});
