# Handoff: Bake by Math (bread + cake + learn)

## Start here

1. `cd /home/happyham/c0d3/breadyfrendy && git status && npm test` (expect 55 passing; `npm run e2e` has 42).
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

## Unverified or judgment calls (tell the owner)

Checked 2026-10-07 unless noted:
- Composition (water, fat) for egg white, buttermilk (lowfat), sour cream, cocoa, canola oil, vanilla, cake flour: USDA SR Legacy bulk CSV (the shared `DEMO_KEY` API was rate-limited for ~10 h; the CSV download needs no key: `https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip`). Egg white large = 33 g (USDA).
- Dry measures (baking powder 4 g/tsp, soda 6 g/tsp, cocoa 84 g/cup, vanilla 14 g/tbsp) are King Arthur. USDA differs (4.6, 4.6, 86, 4.2 g). Cake flour is 120 g/cup in King Arthur and 137 in USDA; the cake calculator has no separate cake-flour unit.
- Liquid cups use real density (buttermilk 245, sour cream 230 from USDA), not King Arthur's 227.

NOT verified against a published source:
- **Cake type recommended %** for butter, sponge and chiffon, the per-type fat ranges, baking powder ranges, the soda limit (1.5%), sponge egg minimum (120%). They are typical-recipe figures I chose. Pound cake 1:1:1:1 is classic. The high-ratio rule (sugar at least equal to flour, liquid at least equal to sugar) comes from a Baking Sense article, read through a search summary. A separate fetch summary of that article listed odd figures (fat 112% in a pound cake), so I did not rely on it further.
- **Yeast ratio (owner chose to keep it):** the calculator uses instant : active dry : fresh = 1 : 1.3 : 3. Red Star says instant and active dry are interchangeable one for one, and fresh is 0.4x active or 0.33x instant (read through a search summary, not the page). The learn page states both and flags the difference (about 1.5 g in 500 g flour).
- **Sugar warning:** lowered by the owner (2026-10-07) from 25% to about 10.5% of flour (sugar + honey), matching King Arthur's 1 tbsp sugar per cup of flour (10.3%). The recommended sugar is 10%, so defaults stay quiet, but sugar + honey defaults (17%) warn. Yeast ratio 1 : 1.3 : 3 kept by the owner; Red Star's 1:1 is stated on the learn page.
- Learn-page text on butter timing, typical butter 8-15% and 25-50%, and baking powder 1-1.5 tsp per cup is common knowledge, not cited.
- Hydration bracket examples (bread) are unchanged and still unchecked.

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
