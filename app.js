import { ING, ENRICHERS, BASE, YEAST, BRACKETS, bracketFor, solve, scale, toGrams, unitsFor, friendly, encodeShare, decodeShare, parseAmount } from './calc.js';

const $ = (s, r = document) => r.querySelector(s);
const UNIT_LABEL = { g: 'g', oz: 'oz', cup: 'cup', tbsp: 'tbsp', tsp: 'tsp', ml: 'ml', egg: 'egg(s)', yolk: 'yolk(s)', stick: 'stick(s)', packet: 'packet(s)', cake: 'cake(s)',
  'cup-whole-wheat': 'cup (whole wheat)', 'tsp-diamond': 'tsp (Diamond kosher)', 'tsp-morton': 'tsp (Morton kosher)' };
const fmt = (n) => String(Math.round(n * 10) / 10);
const show = (id) => { for (const s of ['home', 'picker', 'calc']) $('#' + s).hidden = s !== id; closeTips(); scrollTo({ top: 0 }); };
const wide = () => matchMedia('(min-width: 1024px)').matches;
const pct = (n) => Math.round(n * 100);

let selected = [...BASE];   // ingredient ids, in display order
const auto = new Set();     // ids (and 'hydration') whose current value was filled by the solver
let last = null;            // last solved result
let yeastType = 'instant';

// ---- enricher meters on the home cards (single source of truth: ING)
for (const card of document.querySelectorAll('.enricher[data-id]')) {
  const ing = ING[card.dataset.id];
  card.querySelector('h3').insertAdjacentHTML('afterend',
    `<div class="meters"><div class="meter" style="--v:${pct(ing.water)}%"><span>Water</span><b>${pct(ing.water)}%</b></div>` +
    `<div class="meter fat" style="--v:${pct(ing.fat)}%"><span>Fat</span><b>${pct(ing.fat)}%</b></div></div>`);
}

// ---- hero demo: hydration slider on 500 g flour
const range = $('#demo-range');
const drawDemo = () => {
  const h = +range.value, b = bracketFor(h);
  $('#demo-h').textContent = h + '%'; $('#demo-feel').textContent = b.label;
  $('#demo-breads').innerHTML = `<strong>${b.range}:</strong> ${b.breads}`;
  $('#demo-water').textContent = Math.round(5 * h) + ' g'; $('#demo-bar').style.setProperty('--h', h / 100);
};
range.addEventListener('input', drawDemo); drawDemo();

// ---- hydration guide inside the calculator (highlights the bracket you are in)
$('#guide-list').innerHTML = BRACKETS.map((b) => `<li data-min="${b.min}"><b>${b.range}</b><span><strong>${b.label}.</strong> ${b.breads}</span></li>`).join('');
const markGuide = (h) => {
  const on = bracketFor(h);
  for (const li of document.querySelectorAll('#guide-list li')) li.classList.toggle('on', !!on && +li.dataset.min === on.min);
};

// ---- picker, with an info tooltip per enricher
const picks = $('.picks');
for (const id of ENRICHERS) {
  const w = pct(ING[id].water), f = pct(ING[id].fat);
  const text = [...document.querySelectorAll(`.enricher[data-id=${id}] p`)].map((p) => `<p>${p.innerHTML}</p>`).join('');
  const water = w ? `100 g adds ${w} g of water to the dough, so it counts toward hydration.` : 'Adds no water, so it does not change hydration.';
  const item = document.createElement('div');
  item.className = 'pick-item';
  item.innerHTML = `<label class="pick"><input type="checkbox" value="${id}"><span class="pick-text"><span class="pick-name">${ING[id].label}</span><span class="pick-tag">${w}% water</span></span></label>
    <button type="button" class="info" aria-expanded="false" aria-controls="tip-${id}" aria-label="About ${ING[id].label}">i</button>
    <div class="tip" id="tip-${id}" role="tooltip">${text}<p class="tip-water">${water} ${f ? `About ${f}% fat.` : ''}</p></div>`;
  picks.append(item);
}
function closeTips(except) {
  for (const b of document.querySelectorAll('.info[aria-expanded=true]')) if (b !== except) b.setAttribute('aria-expanded', 'false');
}
picks.addEventListener('click', (e) => {
  const b = e.target.closest('.info');
  if (!b) return;
  const open = b.getAttribute('aria-expanded') !== 'true';
  closeTips(b); b.setAttribute('aria-expanded', open);
});
document.addEventListener('click', (e) => { if (!e.target.closest('.info, .tip')) closeTips(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeTips(); });
const picked = () => ENRICHERS.filter((id) => $(`.picks input[value=${id}]`).checked);
const setPicks = (ids) => { for (const id of ENRICHERS) $(`.picks input[value=${id}]`).checked = ids.includes(id); };
const openPicker = (keep) => { setPicks(keep ? selected : []); show('picker'); };

// ---- form
const rows = $('#rows');
const input = (id) => $('#in-' + id);

function buildForm(ids) {
  const old = Object.fromEntries(selected.filter((i) => input(i)).map((i) => [i, input(i).value]));
  selected = ids;
  rows.innerHTML = '';
  for (const id of ids) {
    const row = document.createElement('div');
    row.className = 'row';
    const yeastSel = id === 'yeast'
      ? `<select id="yeast-type" aria-label="Yeast type">${Object.entries(YEAST).map(([k, y]) => `<option value="${k}">${y.label}</option>`).join('')}</select>` : '';
    row.innerHTML = `<label for="in-${id}">${ING[id].label} (g)</label>
      <div class="inline"><input id="in-${id}" inputmode="decimal" placeholder="blank = solve it">${yeastSel}
      <button type="button" class="conv-toggle" aria-expanded="false" aria-controls="conv-${id}">Convert</button></div>
      <div class="convert" id="conv-${id}" hidden>
        <input inputmode="decimal" placeholder="amount, e.g. 1 1/2" aria-label="${ING[id].label} amount">
        <select aria-label="${ING[id].label} unit">${Object.keys(unitsFor(id)).filter((u) => u !== 'g').map((u) => `<option value="${u}">${UNIT_LABEL[u] ?? u}</option>`).join('')}</select>
        <button type="button" class="secondary">Fill grams</button><p class="conv-msg" role="alert"></p></div>`;
    rows.append(row);
    if (id in old) input(id).value = old[id];
    else if (id === 'flour') input(id).value = '';
  }
  const ys = $('#yeast-type'); ys.value = yeastType;
  ys.addEventListener('change', () => { yeastType = ys.value; });
  for (const id of [...auto]) if (!selected.includes(id) && id !== 'hydration') auto.delete(id);
}

rows.addEventListener('input', (e) => {
  if (e.target.id.startsWith('in-')) { auto.delete(e.target.id.slice(3)); mark(e.target.id.slice(3)); }
});
$('#in-hydration').addEventListener('input', (e) => { auto.delete('hydration'); mark('hydration'); markGuide(parseAmount(e.target.value)); });
rows.addEventListener('click', (e) => {
  const row = e.target.closest('.row'); if (!row) return;
  const id = row.querySelector('input').id.slice(3);
  if (e.target.classList.contains('conv-toggle')) {
    const panel = $('#conv-' + id), open = panel.hidden;
    panel.hidden = !open; e.target.setAttribute('aria-expanded', open);
    if (open) panel.querySelector('input').focus();
  } else if (e.target.closest('.convert') && e.target.tagName === 'BUTTON') {
    const panel = $('#conv-' + id), msg = $('.conv-msg', panel);
    const g = toGrams(id, panel.querySelector('input').value, panel.querySelector('select').value);
    if (Number.isNaN(g)) { msg.textContent = 'Enter an amount like 2, 1 1/2 or ¾.'; return; }
    msg.textContent = '';
    input(id).value = fmt(g); auto.delete(id); mark(id); panel.hidden = true;
    $('.conv-toggle', row).setAttribute('aria-expanded', 'false');
  }
});

function mark(id) {
  const el = id === 'hydration' ? $('#in-hydration') : input(id);
  if (!el) return;
  el.classList.toggle('auto', auto.has(id));
  el.removeAttribute('aria-invalid');
}
const setVal = (id, v) => { (id === 'hydration' ? $('#in-hydration') : input(id)).value = v; mark(id); };

// Read the form. Solver-filled (auto) fields count as blank again.
function readState() {
  const amounts = {};
  for (const id of selected) amounts[id] = auto.has(id) ? null : parseAmount(input(id).value);
  const hydration = auto.has('hydration') ? null : parseAmount($('#in-hydration').value);
  return { amounts, hydration, yeastType };
}

function showError(err) {
  $('#msg').textContent = err.message;
  const el = err.field === 'hydration' ? $('#in-hydration') : input(err.field);
  if (el) { el.setAttribute('aria-invalid', 'true'); el.focus(); }
}

function hideResults() { $('#results').hidden = true; $('#calc').classList.remove('has-results'); }
function run() {
  $('#msg').textContent = '';
  for (const el of document.querySelectorAll('[aria-invalid]')) el.removeAttribute('aria-invalid');
  const r = solve(readState());
  if (r.error) { last = null; hideResults(); showError(r.error); return; }
  last = r;
  for (const x of r.recipe) if (x.auto) { auto.add(x.id); setVal(x.id, fmt(x.grams)); }
  if (auto.has('hydration') || !$('#in-hydration').value.trim()) { auto.add('hydration'); setVal('hydration', fmt(r.hydration)); }
  render(r);
}
$('#form').addEventListener('submit', (e) => { e.preventDefault(); run(); });

// ---- results
function render(r) {
  $('#hydration-line').innerHTML = `<strong>${r.hydration.toFixed(1)}%</strong> true hydration`;
  $('#res-bar').style.setProperty('--h', r.hydration / 100);
  const b = bracketFor(r.hydration);
  $('#res-bracket').innerHTML = b ? `At ${r.hydration.toFixed(1)}%: <strong>${b.label}.</strong> ${b.breads}` : '';
  markGuide(r.hydration);
  $('#calc').classList.add('has-results');
  $('#results-body').innerHTML = r.recipe.map((x) => `<tr><th scope="row">${x.label}${x.how ? ` <span class="hint">(${x.how === 'recommended' ? 'recommended' : 'calculated'})</span>` : ''}<span class="src">${friendly(x.id, x.grams)}</span></th>
    <td class="num">${x.grams < 20 ? x.grams.toFixed(1) : Math.round(x.grams)}</td><td class="num">${x.pct.toFixed(1)}%</td></tr>`).join('');
  $('#total').textContent = Math.round(r.total) + ' g';
  $('#warnings').innerHTML = r.warnings.map((w) => `<li>${w}</li>`).join('');
  $('#water-sources').innerHTML = r.waterBreakdown.map((w) => `<li>${w.label}: ${w.grams.toFixed(1)} g water</li>`).join('');
  const e = r.yeastEquivalents;
  $('#yeast-eq').textContent = `Instant ${e.instant.toFixed(1)} g · Active dry ${e.active.toFixed(1)} g · Fresh ${e.fresh.toFixed(1)} g`;
  $('#results').hidden = false;
  if (!wide()) $('#results').scrollIntoView({ behavior: 'smooth' });
}

$('#scale-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const total = parseAmount($('#scale-total').value), loaves = parseAmount($('#scale-loaves').value), each = parseAmount($('#scale-each').value);
  const s = scale(last, total !== null ? { totalDough: total } : { loaves: loaves ?? NaN, each: each ?? NaN });
  $('#scale-msg').textContent = s.error ? s.error.message : '';
  if (!s.error) render(s);
});
$('#scale-reset').addEventListener('click', () => { if (last) { render(last); $('#scale-msg').textContent = ''; } });

$('#share').addEventListener('click', async () => {
  const url = `${location.origin}${location.pathname}?${encodeShare(readState())}`;
  const box = $('#share-url'); box.value = url; box.hidden = false; box.select();
  try { await navigator.clipboard.writeText(url); $('#share').textContent = 'Copied!'; setTimeout(() => ($('#share').textContent = 'Copy share link'), 2000); } catch { /* user can copy from the box */ }
});
$('#print').addEventListener('click', () => print());

// ---- navigation
for (const b of document.querySelectorAll('[data-open-picker]')) b.addEventListener('click', () => openPicker(false));
$('#home-link').addEventListener('click', (e) => {
  e.preventDefault();
  if (location.search) history.replaceState(null, '', location.pathname);
  show('home');
});
$('#clear-picks').addEventListener('click', () => setPicks([]));
$('[data-go-home]').addEventListener('click', () => show('home'));
$('#to-calc').addEventListener('click', () => { buildForm([...BASE.slice(0, 2), ...picked(), ...BASE.slice(2)]); setPicks([]); show('calc'); input('flour').focus(); });
$('#change-enrichers').addEventListener('click', () => openPicker(true));
$('#clear-auto').addEventListener('click', () => {
  for (const id of [...auto]) { setVal(id, ''); auto.delete(id); mark(id); }
  $('#msg').textContent = ''; hideResults();
});

// ---- share link on load
const q = location.search.slice(1);
if (q) {
  const s = decodeShare(q), ids = BASE.concat(ENRICHERS).filter((i) => i in s.amounts || BASE.includes(i));
  if (Object.keys(s.amounts).length) {
    yeastType = s.yeastType;
    for (const id of ids) if (ENRICHERS.includes(id)) $(`.picks input[value=${id}]`).checked = true;
    buildForm([...BASE.slice(0, 2), ...picked(), ...BASE.slice(2)]);
    const txt = (v) => (v === null ? '' : Number.isNaN(v) ? '?' : String(v));
    for (const id of selected) if (id in s.amounts) input(id).value = txt(s.amounts[id]);
    $('#in-hydration').value = txt(s.hydration);
    show('calc'); run();
  }
}
