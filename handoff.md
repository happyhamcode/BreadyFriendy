# Handoff: Bread Friend to "Bake by Math"

Written for the next session (Opus). Read "Start here", then the sections you need.

## Start here

1. `cd /home/happyham/c0d3/breadyfrendy && git status && npm test` (expect 38 passing).
2. Read `calc.js` top to bottom (about 350 lines). It is the whole brain of the bread calculator.
3. Do not start building the cake calculator or the rebrand until the owner says the bread calculator is done. They said they will review it first.
4. Work on a branch. Pushing `main` deploys to production.

## What this is

A free, static website (no build step, no runtime dependencies) for calculating enriched yeast dough by true hydration. Goal: ad revenue. It is live at https://bready-friendy.vercel.app/.

Next stage: rebrand to **Bake by Math**, one site with an all-in-one **bread and cake** calculator, plus teaching content on how to design, scale and understand baking math.

Hard product rules from the owner:
- No wild-yeast / fermented-starter breads, ever. A test fails if the forbidden words appear in any root file (see `test/calc.test.js`, last test). Do not write those words in root `.md`, `.html`, `.js`, `.css` or `.json` files, including this one.
- Enriched dough is the focus. Home page order: explain hydration and enriched dough, then what each enricher does, then a button into the calculator.
- Calculator flow: flour, water, yeast and salt are always on. Pick enrichers. Enter grams (or convert from cups and so on). Press Enter and the blanks fill in, or a clear error appears.
- "Test it into the ground": every scenario should work or produce a clear error.
- Must work on phone, tablet and desktop.

## Current state (main at 976ee0f)

| Area | Status |
|---|---|
| Bread calculator | Done and live. Owner is still reviewing it. |
| Tests | 38 unit (`npm test`), 21 browser (`npm run e2e`), all passing |
| Design | Blueprint navy graph-paper background, white "paper" sheets, amber accent, Bricolage Grotesque headings (self-hosted) |
| Ads | Empty hidden slots (`ins.ad-slot[hidden]`), privacy page, SEO meta tags. No publisher ID yet. |
| Cake calculator | Not started. Only scoped in conversation (see below). |
| Rebrand | Not started. Name still "Bread Friend". |

### Files

```
index.html          home + picker + calculator markup (one page, three views)
style.css           one stylesheet; tokens on :root, dark mode via prefers-color-scheme
calc.js             PURE logic, no DOM: ingredient table, solver, units, fractions, brackets, share links
app.js              DOM layer only: views, form, tooltips, results, scale, share
privacy.html        needed for ad approval
fonts/              Bricolage Grotesque latin subset (woff2)
test/calc.test.js   node:test unit tests
test/e2e.spec.js    Playwright tests (5 viewport sizes, dark mode, flows)
playwright.config.js, package.json (type: module; only devDependency is @playwright/test)
```

### How the bread solver works (calc.js `solve`)

Input: `{ amounts: {flour, water, salt, yeast, ...enrichers}, hydration (percent or null), yeastType }`. `null` means blank, `NaN` means unparseable text.

- **Hydration is true water:** water inside each ingredient counts (milk 88%, whole egg 76%, yolk 52%, cream 58%, butter 16%, honey 17%, milk powder 3%, fresh yeast 70%) divided by flour weight.
- **Validation first:** finite, at least 0, at most 50 kg; flour above 0; hydration 1 to 150.
- **Recommended amounts for blanks** (the home page states the same numbers; a test keeps them in sync):
  - egg 15%, yolk 10%, butter 12%, oil 7%, sugar 10%, honey 7%, milk powder 4%, salt 2% of flour
  - yeast 1% instant, 1.3% active dry, 3% fresh
  - milk supplies half of the total water, cream a quarter
  - blank water with no hydration given uses 65%
  - blank flour with a hydration or blank water uses 500 g
- **Hydration given, water blank:** enrichers take recommended amounts, water makes up the remainder. If recommended liquids hold more water than the hydration allows, they are scaled down and a warning is shown. If the fixed amounts already exceed it, error.
- **Hydration given, water given:** blank liquid enrichers (egg, yolk, milk, cream) split the missing water in equal grams. If nothing is blank and the numbers disagree with the hydration by more than 0.5 points, error with the actual and requested values.
- **Hydration blank, water given:** blanks get recommended amounts, the true hydration is reported.
- **All liquids known and flour blank with a hydration:** flour is solved algebraically.
- Each recipe row carries `how: 'recommended' | 'solved' | null`. The UI labels rows "(recommended)" or "(calculated)". Fields filled by the solver are tracked as "auto" in `app.js` and count as blank again on the next Enter, so editing flour and pressing Enter rescales everything.
- Warnings (non-blocking): hydration under 50 or over 85, salt outside 1.5 to 3%, no yeast, yeast over 3x normal, sugar over 25%, fat over 60%.

Other exports: `parseAmount` (accepts `1 1/2`, `¾`, `.5`; rejects `2/0`, `1,5`, `1e3`), `toGrams`, `unitsFor`, `friendly` and `toFraction` (kitchen measures as fractions, never decimals), `scale`, `encodeShare`/`decodeShare` (share link, tamper-safe because values go back through `solve`), `BRACKETS`/`bracketFor` (hydration ranges with example breads).

### Data sources and what is NOT verified

Verified on 2026-10-06:
- Water and fat fractions: USDA FoodData Central API (SR Legacy ids 171287 egg, 172184 yolk, 173410 butter, 169640 honey, 170877 milk powder, 170859 cream, 172217 milk).
- Dry cups, egg, salt and yeast weights: King Arthur ingredient weight chart (https://www.kingarthurbaking.com/learn/ingredient-weight-chart). All-purpose and bread flour 120 g/cup, whole wheat 113, sugar 198, butter 113 g per 8 tbsp, honey 21 g/tbsp, milk powder 28 g per quarter cup, table salt 18 g/tbsp, Diamond kosher 8, Morton kosher 16, instant yeast 9 g/tbsp, large egg 50 g (also USDA). Large yolk 17 g is from USDA (FDC 172184); King Arthur's chart says 14 g and was not used.

Deliberate choices:
- Liquid cups (water 237, milk 244, cream 238, oil 218) use real density, not King Arthur's "8 oz = 227 g" convention, so a baker using a measuring cup gets the right weight.
- Yolk is 17 g (USDA FoodData Central, FDC 172184, "large"). The owner chose USDA over King Arthur's 14 g on 2026-10-06.

Not checked against a source (from memory or convention): cake (fresh) yeast 17 g, cream cup 238 g, butter tablespoon 14.2 g, active-dry and fresh yeast conversion ratios (1.3x and 3x), every "typical %" range on the enricher cards, the hydration bracket examples. Treat these as claims to verify before the owner relies on them for ad-supported educational content.

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
- Second opinion: send each diff to the local model (`qwen3-coder:30b` at `https://ollama.thehappyham.net/api/generate`, `stream: false`; first call after idle takes about 110 s) and reconcile findings. It found nothing real on `calc.js`; use it as a cheap sanity check, not an authority.
- Ponytail mode is on: smallest working change, one runnable check per non-trivial logic path.
- The owner iterates by looking at the live site on devices. Screenshot at 390, 820 and 1360 px before declaring UI work done.

## Stage 2: "Bake by Math" (not started)

### Open decisions to ask the owner first (one question, short)

1. Cake types for v1: pound, butter, sponge, chiffon, or all four?
2. Structure: separate pages under one site (`/bread/`, `/cake/`, `/learn/`), or a toggle on one page? Recommendation: separate pages, shared design, so each page can rank in search and carry its own ad slots.
3. Domain and repo/Vercel renames.
4. Logo and mark. The current loaf-in-a-square is a placeholder.

### Recommended architecture (keep it vanilla, no build step)

Split `calc.js` into modules (ES modules already work):
- `core.js`: `parseAmount`, `toGrams`, `unitsFor`, `friendly`, `toFraction`, `encodeShare`/`decodeShare`, `scale`, validation helpers, the ingredient composition table (`ING`).
- `bread.js`: current solver, brackets, yeast.
- `cake.js`: new solver and balance checks.
- Shared UI pieces in `app.js` or small modules: ingredient rows, convert widget, results table, tooltips, scale box, share link, guide list.
- Keep the rule that logic modules never touch the DOM. Keep tests exhaustive: every new rule gets a unit test and a browser test.
- Extend the "recommended values when blank" pattern per domain, and keep a test that the page copy and the solver state identical numbers.
- Extend the forbidden-words guard test to scan any new directories (it currently reads only files in the repo root).

### Cake calculator: design notes

Cakes are not driven by hydration. They are driven by ratios against flour (baker's percentage, flour = 100%) and by balance. Reuse the same flow: pick ingredients, enter grams or convert, press Enter, blanks filled with recommended values, errors where invalid.

Established reference points (verify each against a cited source before publishing; mark confidence in the UI copy):
- Pound cake is classically 1:1:1:1 by weight: flour, butter, sugar, eggs. Modern recipes drift from that.
- "High-ratio" cake guidance (Cake Bible tradition): sugar at or above flour weight, liquid (eggs plus milk and so on) at or above sugar weight, fat roughly 40 to 60% of flour. Check exact numbers before encoding.
- Cake flour is lower protein than all-purpose (about 7 to 9% versus 10 to 12%); swapping changes tenderness.
- Leavening is about 1 to 1.5 tsp baking powder per cup of flour (convert to grams with `unitsFor`), baking soda only with an acid. Baking powder and soda need new rows in the ingredient table with gram weights per teaspoon from a source.
- Eggs: 50 g large, 76% water, so they count as liquid and structure. Butter is about 16% water, 81% fat. Whole milk 88% water. Reuse the existing composition table; add cocoa, cake flour, buttermilk, oil, sour cream, baking powder, baking soda, vanilla only with sourced figures.
- Balance checks to implement as warnings and errors: sugar versus flour, liquid versus sugar, fat percentage range, leavening range, egg-to-flour ratio, total liquid.
- Pan scaling: batter volume scales with pan area. Round pan area is pi times radius squared, so 8 inch to 9 inch is a factor of (9/8)^2, about 1.27. Square pans use side squared. Offer "convert this recipe to a different pan" as a feature. Bake time and temperature change; state that rule of thumb as approximate.
- Reuse `scale` for plain multipliers; add a pan-based scaler on top.

### Learn section: content seeds for "how to use these tools to design, scale, or learn the math"

Write as short, example-led pages, each ending with a link into the relevant calculator pre-filled via a share link (the share-link format is already in `encodeShare`).

1. **Baker's percentage.** Everything is a percentage of flour weight, so recipes scale by multiplication. Worked example with the table the calculator already shows.
2. **True hydration.** Why milk, eggs and butter count as partly water, with the composition table and a live slider (the home page demo is a template).
3. **Designing a recipe.** Start from the target bracket (brioche about 45 to 55%, sandwich loaf 62 to 70%, ciabatta 80 to 90%), choose enrichers, let blanks fill with recommended values, then adjust. Teach how to read the warnings.
4. **Scaling.** Scale factor equals target dough weight divided by current total. Salt and yeast scale linearly at home; very large batches use less yeast, which should be stated as an approximation unless sourced. Pan-area scaling for cakes. Using loaves times grams-each.
5. **Yeast conversion.** Instant, active dry and fresh at roughly 1 : 1.3 : 3 (verify). When to use each.
6. **Sugar, fat and yeast.** Why more than about 25% sugar slows regular yeast, why butter is added after gluten forms, what fat percentage does to crumb.
7. **Measuring.** Why grams beat cups, with the real spread for a cup of flour, and how the Convert tool works.
8. **Cake balance.** The ratio rules above, with the pound cake 1:1:1:1 example, and what breaks when the balance is off.

Each page needs unique, accurate text. The ad program rewards original, useful content, so avoid thin pages and avoid unsourced claims; link or name sources (USDA FoodData Central, King Arthur chart, other cited references).

### Rebrand checklist

- Name and tagline in: `<title>`, meta description, `og:*`, favicon, the top bar (`.brand`), footer, `privacy.html`, README, `package.json` name.
- Keep the title link returning home from every screen (`#home-link`, tested).
- New home page for the combined site: two clear entry points (Bread, Cake), then the Learn section. The current home page content becomes `/bread/`.
- Update `theme-color`, and decide whether the cake side gets its own accent. Keep the one-bold-moment rule: the hero demo slider is the memorable element today.
- Redirects or keep `index.html` working so existing links do not break.

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
