import { CAKE_ING, CAKE_TYPES, solveCake, scaleCake, toGrams, unitsFor, friendly, encodeCakeShare, decodeCakeShare, parseAmount } from './cake.js';
import { $, fmt, initTips, rowHtml, wireRows, wireShare } from './ui.js';

const show = (id) => { for (const s of ['home', 'picker', 'calc']) $('#' + s).hidden = s !== id; closeTips(); scrollTo({ top: 0 }); };
const wide = () => matchMedia('(min-width: 1024px)').matches;
const pct = (n) => Math.round(n * 100);

let type = 'butter';
let selected = [];          // ingredient ids in the form, in display order
const auto = new Set();     // ids whose current value was filled by the solver
let last = null;            // last solved result

const formIds = (t, extras) => ['flour', ...CAKE_TYPES[t].base.filter((i) => i !== 'flour'), ...extras];

// ---- water / fat meters on the ingredient cards (single source of truth: CAKE_ING)
for (const card of document.querySelectorAll('.enricher[data-id]')) {
  const ing = CAKE_ING[card.dataset.id];
  if (!ing || card.dataset.id.startsWith('baking')) continue;
  card.querySelector('h3').insertAdjacentHTML('afterend',
    `<div class="meters"><div class="meter" style="--v:${pct(ing.water)}%"><span>Water</span><b>${pct(ing.water)}%</b></div>` +
    `<div class="meter fat" style="--v:${pct(ing.fat)}%"><span>Fat</span><b>${pct(ing.fat)}%</b></div></div>`);
}

// ---- picker: cake type radios, then that type's extras with an info tooltip taken from the ingredient cards
const typesBox = $('.picks.types'), extrasBox = $('.picks.extras');
for (const [id, T] of Object.entries(CAKE_TYPES)) {
  const blurb = $(`.enricher[data-type=${id}] .blurb`)?.textContent ?? '';
  typesBox.insertAdjacentHTML('beforeend', `<div class="pick-item"><label class="pick"><input type="radio" name="cake-type" value="${id}"><span class="pick-text"><span class="pick-name">${T.label}</span><span class="pick-tag">${blurb.split('.')[0]}</span></span></label></div>`);
}
const closeTips = initTips(extrasBox);
const typeRadio = (id) => $(`.picks.types input[value=${id}]`);
const pickedType = () => $('.picks.types input:checked')?.value ?? type;
const pickedExtras = () => [...extrasBox.querySelectorAll('input:checked')].map((i) => i.value);

function drawExtras(t, keep = []) {
  extrasBox.innerHTML = '';
  for (const id of Object.keys(CAKE_TYPES[t].optional)) {
    const text = [...document.querySelectorAll(`.enricher[data-id=${id}] p`)].map((p) => `<p>${p.innerHTML}</p>`).join('');
    const item = document.createElement('div');
    item.className = 'pick-item';
    item.innerHTML = `<label class="pick"><input type="checkbox" value="${id}"${keep.includes(id) ? ' checked' : ''}><span class="pick-text"><span class="pick-name">${CAKE_ING[id].label}</span><span class="pick-tag">${CAKE_TYPES[t].optional[id]}% of flour</span></span></label>
      <button type="button" class="info" aria-expanded="false" aria-controls="tip-${id}" aria-label="About ${CAKE_ING[id].label}">i</button>
      <div class="tip" id="tip-${id}" role="tooltip">${text}</div>`;
    extrasBox.append(item);
  }
}
typesBox.addEventListener('change', () => drawExtras(pickedType()));
const openPicker = (keep) => {
  typeRadio(type).checked = true;
  drawExtras(type, keep ? selected : []);
  show('picker');
};

// ---- form
const rows = $('#rows');
const input = (id) => $('#in-' + id);

function buildForm(t, extras) {
  const old = Object.fromEntries(selected.filter((i) => input(i)).map((i) => [i, input(i).value]));
  type = t; selected = formIds(t, extras);
  $('#calc-title').textContent = `Your ${CAKE_TYPES[t].label.toLowerCase()}`;
  rows.innerHTML = '';
  for (const id of selected) {
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = rowHtml(id, CAKE_ING[id].label, Object.keys(unitsFor(id)).filter((u) => u !== 'g'));
    rows.append(row);
    if (id in old) input(id).value = old[id];
  }
  for (const id of [...auto]) if (!selected.includes(id)) auto.delete(id);
}

wireRows(rows, {
  toGrams,
  onEdit: (id) => { auto.delete(id); mark(id); },
  onFill: (id, v) => { input(id).value = v; auto.delete(id); mark(id); },
});

function mark(id) {
  const el = input(id);
  if (!el) return;
  el.classList.toggle('auto', auto.has(id));
  el.removeAttribute('aria-invalid');
}
const setVal = (id, v) => { input(id).value = v; mark(id); };

// Read the form. Solver-filled (auto) fields count as blank again.
const readState = () => ({ type, amounts: Object.fromEntries(selected.map((id) => [id, auto.has(id) ? null : parseAmount(input(id).value)])) });

function showError(err) {
  $('#msg').textContent = err.message;
  const el = input(err.field);
  if (el) { el.setAttribute('aria-invalid', 'true'); el.focus(); }
}

function hideResults() { $('#results').hidden = true; $('#calc').classList.remove('has-results'); }
function run() {
  $('#msg').textContent = '';
  for (const el of document.querySelectorAll('[aria-invalid]')) el.removeAttribute('aria-invalid');
  const r = solveCake(readState());
  if (r.error) { last = null; hideResults(); showError(r.error); return; }
  last = r;
  for (const x of r.recipe) if (x.auto) { auto.add(x.id); setVal(x.id, fmt(x.grams)); }
  render(r);
}
$('#form').addEventListener('submit', (e) => { e.preventDefault(); run(); });

// ---- results
function render(r) {
  const x = r.ratios, n = (v) => Math.round(v);
  $('#ratio-line').innerHTML = `<strong>${n(x.sugar)}% sugar</strong>${n(x.fat)}% fat · ${n(x.liquid)}% liquid · ${n(x.egg)}% egg, as a share of the flour`;
  $('#calc').classList.add('has-results');
  $('#results-body').innerHTML = r.recipe.map((i) => `<tr><th scope="row">${i.label}${i.how ? ` <span class="hint">(${i.how === 'recommended' ? 'recommended' : 'calculated'})</span>` : ''}<span class="src">${friendly(i.id, i.grams)}</span></th>
    <td class="num">${i.grams < 20 ? i.grams.toFixed(1) : Math.round(i.grams)}</td><td class="num">${i.pct.toFixed(1)}%</td></tr>`).join('');
  $('#total').textContent = Math.round(r.total) + ' g';
  $('#warnings').innerHTML = r.warnings.map((w) => `<li>${w}</li>`).join('');
  $('#results').hidden = false;
  if (!wide()) $('#results').scrollIntoView({ behavior: 'smooth' });
}

// ---- pans and multiplier
const panLabels = { round: ['diameter'], square: ['side'], rect: ['width', 'length'] };
for (const w of ['from', 'to']) {
  const sync = () => {
    const l = panLabels[$(`#pan-${w}-shape`).value];
    $(`#pan-${w}-a`).placeholder = l[0]; $(`#pan-${w}-a`).setAttribute('aria-label', `${w === 'from' ? 'From' : 'To'} pan ${l[0]}`);
    $(`#pan-${w}-b`).hidden = !l[1];
  };
  $(`#pan-${w}-shape`).addEventListener('change', sync); sync();
}
const readPan = (w) => {
  const shape = $(`#pan-${w}-shape`).value, a = parseAmount($(`#pan-${w}-a`).value), b = parseAmount($(`#pan-${w}-b`).value);
  return shape === 'round' ? { shape, d: a ?? NaN } : shape === 'square' ? { shape, s: a ?? NaN } : { shape, w: a ?? NaN, l: b ?? NaN };
};
const apply = (s) => { $('#scale-msg').textContent = s.error ? s.error.message : ''; if (!s.error) render(s); };
$('#pan-form').addEventListener('submit', (e) => { e.preventDefault(); apply(scaleCake(last, { from: readPan('from'), to: readPan('to') })); });
$('#mult-form').addEventListener('submit', (e) => { e.preventDefault(); apply(scaleCake(last, { factor: parseAmount($('#mult').value) ?? NaN })); });
$('#scale-reset').addEventListener('click', () => { if (last) { render(last); $('#scale-msg').textContent = ''; } });

wireShare($('#share'), $('#share-url'), () => `${location.origin}${location.pathname}?${encodeCakeShare(readState())}`);
$('#print').addEventListener('click', () => print());

// ---- navigation
for (const b of document.querySelectorAll('[data-open-picker]')) b.addEventListener('click', () => openPicker(false));
$('[data-go-home]').addEventListener('click', () => show('home'));
$('#to-calc').addEventListener('click', () => { buildForm(pickedType(), pickedExtras()); hideResults(); $('#msg').textContent = ''; show('calc'); input('flour').focus(); });
$('#change-cake').addEventListener('click', () => openPicker(true));
$('#clear-auto').addEventListener('click', () => {
  for (const id of [...auto]) { setVal(id, ''); auto.delete(id); }
  $('#msg').textContent = ''; hideResults();
});

// ---- share link on load
const s = decodeCakeShare(location.search.slice(1));
if (s.type) {
  const extras = Object.keys(s.amounts).filter((id) => !formIds(s.type, []).includes(id));
  buildForm(s.type, extras);
  const txt = (v) => (v === null ? '' : Number.isNaN(v) ? '?' : String(v));
  for (const id of selected) if (id in s.amounts) input(id).value = txt(s.amounts[id]);
  show('calc'); run();
}
