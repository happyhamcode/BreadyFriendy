# Handoff: Bake by Math (bread + cake + learn)

## Start here

1. `cd /home/happyham/c0d3/breadyfrendy && git status && npm test` (expect 60 passing; `npm run e2e` has 42).
2. Stage 2 is built on branch `bake-by-math`: rebrand, `/cake/`, `/learn/` (8 pages), combined home. It is NOT on `main` until the owner approves. Pushing `main` deploys to production.
3. Read "Unverified or judgment calls" below before telling anyone the cake or learn content is verified.
4. Next owner-facing step: review the preview deploy, then fast-forward `main`.

## What this is

A free static site (no build step, no runtime dependencies) at https://bready-friendy.vercel.app/ (URL unchanged; renames deferred). Goal: ad revenue. Calculators work in grams and baker's percentages; teaching pages explain the math.

Hard product rules from the owner:
- No wild-yeast / fermented-starter breads, ever. `test/calc.test.js` (last test) scans every `.html/.js/.css/.md/.json` outside `node_modules`, `test`, `test-results`, `.git`. Do not write those words anywhere in the repo, including here.
- Enriched dough is the bread focus. Calculator flow: base ingredients always on, pick extras, enter grams (or Convert), press Enter, blanks fill or a clear error shows.
- Every scenario works or gives a clear error. Works on phone, tablet and desktop.

## Layout

```
index.html            site home: Bread / Cake cards + Learn list. A script forwards old /?yt=... share links to /bread/
bread/index.html      bread home + picker + calculator (the old index.html)
cake/index.html       cake home (4 types, ingredient cards) + picker + calculator
learn/index.html, learn/<slug>/index.html   8 pages. Generated once from a script; edit the HTML directly now
core.js               shared pure helpers: parseAmount, toGrams/unitsFor/friendly (take an ingredient table), toFraction, checkAmounts, fail, MAX_GRAMS
bread.js              bread ING table, solve (true hydration), brackets, yeast, scale, share links
cake.js               CAKE_ING, CAKE_TYPES, solveCake, panArea, scaleCake, share links
ui.js                 DOM helpers shared by both apps: tooltips, row + Convert widget, share button
bread-app.js, cake-app.js   DOM layers
style.css             one stylesheet, tokens on :root, dark mode via prefers-color-scheme
privacy.html          needed for ad approval
test/calc.test.js (bread, forbidden words), cake.test.js, learn.test.js (links, numbers), e2e.spec.js, cake-e2e.spec.js
```
Logic modules never touch the DOM. Every page copy that states numbers has a sync test (bread cards, cake type cards, learn worked examples).

## How the cake solver works (`cake.js` `solveCake`)

Input `{ type, amounts }`, `null` = blank, `NaN` = unparseable. Everything is a % of flour.
- Flour given: blanks get the type's recommended % of flour (`how: 'recommended'`).
- Flour blank, something given: flour is solved from the first given ingredient in the order egg, butter, sugar, oil, milk, buttermilk, sour cream, water, yolk, white (`how: 'solved'`).
- Nothing given: 250 g flour plus a notice.
- Ingredients not used by the type error ("isn't used in ..."). Balance checks are warnings, never errors.
- Pan scaling: factor = area ratio (round pi r^2, square s^2, rectangle w x l), same depth. `scaleCake` also takes a plain factor and adds a bake-time caveat.

## Ratio audit (2026-10-07, owner: "check all the ratios, trust none of your information")

Method: parsed the recipe data (JSON-LD `recipeIngredient`) straight from 41 King Arthur recipe pages (script lived in the session scratchpad; URLs are in `test/published-recipes.test.js` and on the Learn pages), converted to baker's percentages (eggs 50 g, yolk 17, white 33), and set defaults and warning ranges so published recipes sit inside them. USDA composition re-read from the SR Legacy bulk CSV (`https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip`, no API key; the shared `DEMO_KEY` rate-limits for ~10 h). `test/published-recipes.test.js` is the guard: every fixture recipe must solve with zero warnings, hydration brackets must name the right breads, and defaults must sit inside the published range.

What the audit found WRONG in the earlier version (fixed):
- Bread: instant yeast default 1% (King Arthur's same-day enriched recipes use 1.4-2.9%, median ~2%) is now 2% (active 2.5%, fresh 6%). Butter 12% to 15%, oil 7% to 10%, honey 7% to 17% (17-18% when it is the main sweetener), milk powder 4% to 6%, yolk 10% to 5%. Salt 2%, sugar 10%, egg 15%, hydration 65% were already inside the published range.
- Bread hydration bracket examples were wrong: brioche is ~59% (not 45-55), challah ~50% (not 55-62), cinnamon rolls ~72% (not 55-62), ciabatta ~75% (not 80-90), bagels ~63% (not 45-55). Brackets now list only breads whose hydration was computed from a King Arthur recipe. Removed unsourced examples (baguettes, croissant, NY and Roman pizza, pan de cristal).
- Bread warnings: "hydration under 50" fired on King Arthur's own challah (49.5%), now under 45. The sugar and honey yeast warning fired on KA recipes at 10-18% sugar, now above 20% (KA suggests SAF Gold from about 10%; the Learn page says both). The 25% before that was my invention; the 10.5% in between would warn on KA's own rolls.
- Cake: sponge defaults were far too low (egg 160%, sugar 100%); KA sponges use eggs 250-352%, sugar 165-166%. Now sugar 150, egg 250, butter 55. Butter cake defaults moved to the KA median (butter 55, sugar 100, egg 55, milk 75, baking powder 3.2, vanilla 3.5). Chiffon: yolk 55, white 105, water 80, baking powder 4.5, salt 2, vanilla 4. Pound keeps the classic 1:1:1:1 (KA's own run butter 78-100, sugar 82-138, egg 42-88).
- Cake warnings that fired on KA's own recipes were loosened or removed: "sugar under flour" (KA butter cakes go down to 83%) now below 80%; "eggs well under butter" removed (KA fudge cake has eggs at 44% of its butter); leavening is now baking powder plus soda together (soda-only cakes exist); soda limit 1.5% to 3% (KA uses up to 2.5%).
- Cake types were missing real ingredients: pound needed baking soda, water and sour cream (KA sour-cream and chocolate pound cakes); butter cake needed water or coffee. Added as extras. Cocoa, sponge and chiffon extras now come from KA chocolate cakes (cocoa 13-24%); sponge has no extras because no KA data.
- Text that was wrong or unsourced was removed or rewritten: pound cake "no baking powder" (KA's has it), "salt slows yeast", "fat added too early blocks gluten", a Baking Sense pound-cake figure from a bad summary, "1-1.5 tsp baking powder per cup" (KA: 0.75-1.5 tsp, i.e. 2.5-5% of flour).

Verified: USDA water and fat for egg, yolk, milk, cream, butter, honey, milk powder, canola oil, egg white, buttermilk, sour cream, cocoa, vanilla, cake flour; fresh yeast 69% water and 17 g per cake; KA chart values for flour 120, whole wheat 113, sugar 198, butter 113 per 8 tbsp, honey 21 g per tbsp, dry milk 28 g per quarter cup, salt 18/8/16 g per tbsp, instant yeast 3 g per tsp and 9 per tbsp, baking powder 4 g and soda 6 g per tsp, cocoa 42 g per half cup, vanilla 14 g per tbsp, egg 50 g. Where USDA and KA differ the code uses KA for dry goods (baking powder 4.6 vs 4, soda 4.6 vs 6, cocoa 86 vs 84 per cup, cake flour 137 vs 120, all-purpose 125 vs 120) and real density for liquids (water 237, milk 244 vs KA 227). Egg yolk is 17 g (USDA, owner's choice; KA says 14).

Still NOT verified:
- Yeast ratio instant : active dry : fresh is now 1 : 1.25 : 3 (owner: other sources say there is a difference). Primary pages read 2026-10-07: America's Test Kitchen tested and says 25% more active dry; King Arthur blog says equal amounts but active is slower, and its reference page gives fresh x0.4 for active dry and x0.33 for instant (implies ~1.2); Red Star FAQ says one for one. Fresh = 3x instant is King Arthur's; USDA says fresh yeast is 69% water and a 0.6 oz cake is 17 g.
- Cream as 25% of the dough's water: no recipe checked. Milk as half of the water is inside the KA range (45-66%).
- Yolk 5% and cream rest on one or two recipes; honey 17% on three KA recipes where honey is the only sweetener.
- Per-type fat ranges and leavening ranges for cakes are brackets I drew around the 15 KA cake recipes I checked. Other bakers will fall outside. Optional extras (buttermilk 70, sour cream 95, oil 25) are from 1-3 recipes each.
- Recipes with potato flour, whole wheat, orange juice, cream or yogurt as main liquid were left out of the hydration checks because they change how much water the flour holds.
- The Baking Sense high-ratio rule (sugar at least flour, liquid at least sugar) is quoted from a search summary. KA's six butter cakes do satisfy "liquid at least sugar".
- Sources are King Arthur only for the cake and bread ranges, so brand style (American home baking) is baked in.

## Rebrand state

Done: name, title and meta, new inline `%` mark (amber square, navy), nav (Bread, Cake, Learn), footer, privacy page, README, package name. The mark is simple on purpose; swap the inline SVG in each page header and the data-URI favicon if the owner supplies a logo (grep `stroke-width="2.6"`).
Deferred by the owner: renaming the Vercel project, GitHub repo or domain. Old bread share links on `/` still work through the forwarder.

## Deploy facts

- Vercel project `bready-friendy`, team scope `happy-ham-consulting`. The Vercel MCP returns 403 for that scope in this setup, so project settings cannot be read. Use GitHub instead:
  - `gh api repos/happyhamcode/BreadyFriendy/commits/main/status --jq '.statuses[]'` gives deploy state.
  - `gh api repos/happyhamcode/BreadyFriendy/deployments` lists Preview vs Production.
- Repo: `happyhamcode/BreadyFriendy`. Push to `main` = production deploy (about 40 seconds). Push to any other branch = preview deploy. The owner is fine with changes going live, but prefer a branch, check, then fast-forward `main`.
- Verify live: `curl -s https://bready-friendy.vercel.app/ | grep -c "<something new>"`.
- Renaming the Vercel project or the GitHub repo changes URLs. Ask the owner before doing either.

## How to run and test

```
python3 -m http.server 4173     # then open http://localhost:4173 (modules need http, not file://)
npm test                        # unit tests, about 1 second
npm run e2e                     # Playwright, needs Chromium + system libs
```

Browser-test environment gotcha: Playwright's Chromium needs `libatk-1.0`, `libatk-bridge-2.0`, `libXdamage`, `libatspi`, `libXRes`. The machine has no passwordless sudo, and `playwright install-deps` had not taken effect when last checked (`ldd` still showed them missing). Workaround without root:

```
mkdir -p $S/debs $S/libs && cd $S/debs
apt-get download libatk1.0-0t64 libatk-bridge2.0-0t64 libxdamage1 libatspi2.0-0t64 libxres1
for d in *.deb; do dpkg -x $d $S/libs; done
LD_LIBRARY_PATH=$S/libs/usr/lib/x86_64-linux-gnu npx playwright test
```

Where `$S` is the session scratchpad. Also `npx playwright install chromium` once (about 114 MB, already done). The e2e suite expects the static server on port 4173 (the config starts it).

Shell gotchas seen this session:
- `pkill -f "http.server 4173"` kills its own shell and aborts the command (exit 144). Use `pkill -f "[h]ttp.server 4173"`.
- Foreground `sleep N` is blocked. Poll with an `until` loop instead.
- A literal `\uXXXX` in a tool parameter becomes a raw control character. Write the character itself.

## Owner preferences and working agreements

- Output style: ADHD-friendly. Lead with the next action, numbered steps, one concrete next action at the end, no preamble or recap, errors stated as cause and fix.
- Verify claims. The owner asked for figures to be validated against real sources and was right: several numbers were wrong. Say what was and was not checked.
- Second opinion: send each diff to the local model (`qwen3-coder:30b` at `https://ollama.thehappyham.net/api/generate`, `stream: false`; first call after idle takes about 110 s) and reconcile findings. It found nothing real on `calc.js` or `cake.js` (it misread algebra and missed existing guards); use it as a cheap sanity check, not an authority.
- Ponytail mode is on: smallest working change, one runnable check per non-trivial logic path.
- The owner iterates by looking at the live site on devices. Screenshot at 390, 820 and 1360 px before declaring UI work done.

## Stage 2 follow-ups

### Monetization to-do (owner decision, not started)

- Ad slots exist but are hidden and empty. They need a publisher ID before ads can load. Add `ads.txt` only then.
- Before serving personalized ads to EU, UK or California visitors a consent banner (CMP) is required. Not built.
- Privacy page text is a draft; the owner should review it. It needs a contact method.

## Known weak spots to fix or decide

- Empty form on Calculate now returns a full default recipe (500 g flour, 65%) with warnings. Intended, per "use recommended values", but confirm the owner likes it.
- Tooltips on the picker overlay the rows below them. Tap elsewhere or press Escape to close. Acceptable, but a candidate for polish.
- Brackets list "Under 45%" as a row for completeness; it may read oddly to bakers. Consider hiding it on the home page and keeping it only in the tool.
- Share links store raw amounts in the URL; no length cap beyond what the browser enforces.
- `playwright.config.js` assumes `python3` is installed for the test server.
