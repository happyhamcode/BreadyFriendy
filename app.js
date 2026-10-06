import { ING, ENRICHERS, BASE, YEAST, solve, scale, toGrams, unitsFor, friendly, encodeShare, decodeShare, parseAmount } from './calc.js';

const $ = (s, r = document) => r.querySelector(s);
const UNIT_LABEL = { g: 'g', oz: 'oz', cup: 'cup', tbsp: 'tbsp', tsp: 'tsp', ml: 'ml', egg: 'egg(s)', yolk: 'yolk(s)', stick: 'stick(s)', packet: 'packet(s)', cake: 'cake(s)',
  'cup-whole-wheat': 'cup (whole wheat)', 'tsp-diamond': 'tsp (Diamond kosher)', 'tsp-morton': 'tsp (Morton kosher)' };
const fmt = (n) => String(Math.round(n * 10) / 10);
const show = (id) => { for (const s of ['home', 'picker', 'calc']) $('#' + s).hidden = s !== id; scrollTo({ top: 0 }); };

let selected = [...BASE];   // ingredient ids, in display order
const auto = new Set();     // ids (and 'hydration') whose current value was filled by the solver
let last = null;            // last solved result
let yeastType = 'instant';

// ---- picker
const picks = $('.picks');
for (const id of ENRICHERS) {
  const l = document.createElement('label');
  l.innerHTML = `<input type="checkbox" value="${id}"> ${ING[id].label}`;
  picks.append(l);
}
const picked = () => ENRICHERS.filter((id) => $(`.picks input[value=${id}]`).checked);

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
$('#in-hydration').addEventListener('input', () => { auto.delete('hydration'); mark('hydration'); });
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

function run() {
  $('#msg').textContent = '';
  for (const el of document.querySelectorAll('[aria-invalid]')) el.removeAttribute('aria-invalid');
  const r = solve(readState());
  if (r.error) { last = null; $('#results').hidden = true; showError(r.error); return; }
  last = r;
  for (const x of r.recipe) if (x.auto) { auto.add(x.id); setVal(x.id, fmt(x.grams)); }
  if (auto.has('hydration') || !$('#in-hydration').value.trim()) { auto.add('hydration'); setVal('hydration', fmt(r.hydration)); }
  render(r);
}
$('#form').addEventListener('submit', (e) => { e.preventDefault(); run(); });

// ---- results
function render(r) {
  $('#hydration-line').textContent = `True hydration: ${r.hydration.toFixed(1)}%`;
  $('#results-body').innerHTML = r.recipe.map((x) => `<tr><th scope="row">${x.label}${x.auto ? ' <span class="hint">(calculated)</span>' : ''}<span class="src">${friendly(x.id, x.grams)}</span></th>
    <td class="num">${x.grams < 20 ? x.grams.toFixed(1) : Math.round(x.grams)}</td><td class="num">${x.pct.toFixed(1)}%</td></tr>`).join('');
  $('#total').textContent = Math.round(r.total) + ' g';
  $('#warnings').innerHTML = r.warnings.map((w) => `<li>${w}</li>`).join('');
  $('#water-sources').innerHTML = r.waterBreakdown.map((w) => `<li>${w.label}: ${w.grams.toFixed(1)} g water</li>`).join('');
  const e = r.yeastEquivalents;
  $('#yeast-eq').textContent = `Instant ${e.instant.toFixed(1)} g · Active dry ${e.active.toFixed(1)} g · Fresh ${e.fresh.toFixed(1)} g`;
  $('#results').hidden = false;
  $('#results').scrollIntoView({ behavior: 'smooth' });
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
for (const b of document.querySelectorAll('[data-open-picker]')) b.addEventListener('click', () => show('picker'));
$('[data-go-home]').addEventListener('click', () => show('home'));
$('#to-calc').addEventListener('click', () => { buildForm([...BASE.slice(0, 2), ...picked(), ...BASE.slice(2)].filter((v, i, a) => a.indexOf(v) === i)); show('calc'); input('flour').focus(); });
$('#change-enrichers').addEventListener('click', () => show('picker'));
$('#clear-auto').addEventListener('click', () => {
  for (const id of [...auto]) { setVal(id, ''); auto.delete(id); mark(id); }
  $('#msg').textContent = ''; $('#results').hidden = true;
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
