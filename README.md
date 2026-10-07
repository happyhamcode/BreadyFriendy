# Bake by Math

Enriched yeast dough calculator using true hydration (water inside milk, eggs, butter, cream, honey and so on counts toward hydration). Static site: no build step, no runtime dependencies.

## How it works
Pick enrichers, enter what you know in grams (or convert from cups, eggs, sticks), leave the rest blank, press Enter.
- Hydration blank: reports your recipe's hydration. Blank salt, yeast and fats get default baker's percentages.
- Hydration entered: blank liquids split the remaining water evenly by weight. Blank flour defaults to 500 g.
- Everything filled and hydration disagrees by more than 0.5 points: error.

All math is in `calc.js` (pure functions). `app.js` is the DOM layer.

## Develop
```
python3 -m http.server 4173   # open http://localhost:4173
npm test                      # unit tests (node:test)
npm run e2e                   # browser tests (npx playwright install chromium first)
```
Composition and density figures live in the `ING` table in `calc.js`.
