# Bread Dough Calculator

## Project Spec

A web tool that takes a baker's raw ingredient list (flour, water, eggs, milk, butter/fat, salt, yeast) and outputs precise, scalable gram amounts — correctly accounting for the water/fat contributed by enriched-dough ingredients that most calculators ignore.

**The gap this fills:** existing hydration calculators (King Arthur, etc.) only handle flour + water + salt + yeast. None properly account for eggs, milk, and butter as partial hydration/fat sources — which matters a lot for brioche, milk bread, challah, and other enriched doughs. That's the differentiator.

## Tech stack
Static site — vanilla HTML/CSS/JS, no framework, no backend. No accounts, no server costs, all math runs client-side. Matches existing skillset (grade tracker precedent).

---

## Core math

### 1. Baker's percentages (baseline)
Flour = 100% (sum of all flours if multiple types used). Every other ingredient is expressed as a % of total flour weight.

```
ingredient_grams = (ingredient_percent / 100) * total_flour_grams
```

### 2. True/effective hydration (the key differentiator)
Standard hydration % only counts water. This tool needs to calculate **effective hydration** by including the water content hidden in enriching ingredients:

| Ingredient | Water content (by weight) | Notes |
|---|---|---|
| Whole egg | ~75% | ~10% fat, ~13% protein, rest water |
| Egg white only | ~90% | |
| Egg yolk only | ~50% | high fat content |
| Whole milk | ~87% | ~3.5% fat |
| Butter | ~16% water, ~80-82% fat | rest is milk solids |
| Heavy cream | ~55-60% water | ~35-40% fat |

**Effective hydration formula:**
```
effective_water = water_grams
                 + (egg_grams * 0.75)
                 + (milk_grams * 0.87)
                 + (butter_grams * 0.16)
                 + (cream_grams * 0.575)

effective_hydration_percent = (effective_water / total_flour_grams) * 100
```

Also track **effective fat %** separately (from butter, egg yolk, cream, oil) since fat affects crumb/gluten development independent of hydration:
```
effective_fat = (butter_grams * 0.81) + (egg_grams * 0.10) + (cream_grams * 0.375) + oil_grams
effective_fat_percent = (effective_fat / total_flour_grams) * 100
```

### 3. Yeast conversion
Ratios by weight, using instant yeast as baseline (1.0):

| Yeast type | Multiplier vs instant | Handling notes |
|---|---|---|
| Instant yeast | 1.0 | Mix directly into flour |
| Active dry yeast | 1.25 | Proof in warm water/milk first |
| Fresh/cake yeast | 3.0 | Crumble into wet ingredients |

```
active_dry_grams = instant_yeast_grams * 1.25
fresh_yeast_grams = instant_yeast_grams * 3.0
```

Let user input a target instant-yeast %, then show all three conversions.

### 4. Flour absorption presets
Different flours absorb water differently — same hydration % target needs different actual water for different flours. Provide adjustment presets (multiplier applied to target hydration or as a note/warning):

| Flour type | Relative absorption |
|---|---|
| All-purpose | Baseline (1.0) |
| Bread flour (high protein) | Slightly higher (~1.02–1.05) |
| Whole wheat | Higher (~1.05–1.10) — bran absorbs more |
| Rye | Variable, often higher, behaves differently (less gluten) |

v1: show as an informational note/multiplier suggestion, not a hard auto-adjustment (rye especially varies too much to hard-code confidently).

---

## MVP feature scope

**Inputs:**
- Total flour weight (grams), with option to split across multiple flour types
- Target hydration % (with a note field per flour type)
- Salt %
- Fat/egg/milk/cream amounts (grams) — optional fields, calculator treats 0 as "not used"
- Yeast type selector (instant / active dry / fresh) + target %
- Batch scale (number of loaves / total dough weight desired)

**Outputs:**
- Effective hydration % (water + egg/milk/butter/cream contribution)
- Effective fat %
- Exact gram amounts for every ingredient, scaled to batch size
- Yeast amount converted to all three types side-by-side
- Flour absorption note if whole wheat/rye selected

## Stretch goals (v2+)
- Sourdough starter support (offset hydration/flour contributed by starter at its own hydration %)
- Fermentation time/temperature guidance based on yeast % and ambient temp
- Altitude adjustment notes
- Save/load recipe presets (local storage, no accounts)
- Printable/shareable recipe card output

---

## Notes for implementation
- All calculations client-side, no backend needed
- Keep formulas in a separate, clearly commented JS module so the math is easy to audit/adjust later (egg/milk/butter water percentages are averages — real-world values vary by brand/size, worth a tooltip disclaimer)
- Mobile-friendly input layout — likely used in a kitchen on a phone