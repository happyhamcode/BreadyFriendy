// DOM helpers shared by the bread and cake pages.
export const $ = (s, r = document) => r.querySelector(s);
export const fmt = (n) => String(Math.round(n * 10) / 10);
export const UNIT_LABEL = { g: 'g', oz: 'oz', cup: 'cup', tbsp: 'tbsp', tsp: 'tsp', ml: 'ml', egg: 'egg(s)', yolk: 'yolk(s)', white: 'white(s)', stick: 'stick(s)', packet: 'packet(s)', cake: 'cake(s)',
  'cup-whole-wheat': 'cup (whole wheat)', 'tsp-diamond': 'tsp (Diamond kosher)', 'tsp-morton': 'tsp (Morton kosher)' };

// Info-button tooltips inside `container` (.info buttons toggling the .tip next to them). Returns closeTips.
export function initTips(container) {
  const closeTips = (except) => {
    for (const b of document.querySelectorAll('.info[aria-expanded=true]')) if (b !== except) b.setAttribute('aria-expanded', 'false');
  };
  container.addEventListener('click', (e) => {
    const b = e.target.closest('.info');
    if (!b) return;
    const open = b.getAttribute('aria-expanded') !== 'true';
    closeTips(b); b.setAttribute('aria-expanded', open);
  });
  document.addEventListener('click', (e) => { if (!e.target.closest('.info, .tip')) closeTips(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeTips(); });
  return closeTips;
}

// One calculator row: label, grams input, optional extra control (yeast type), Convert widget. `unitKeys` are the non-gram units.
export function rowHtml(id, label, unitKeys, extra = '') {
  return `<label for="in-${id}">${label} (g)</label>
      <div class="inline"><input id="in-${id}" inputmode="decimal" placeholder="blank = solve it">${extra}
      <button type="button" class="conv-toggle" aria-expanded="false" aria-controls="conv-${id}">Convert</button></div>
      <div class="convert" id="conv-${id}" hidden>
        <input inputmode="decimal" placeholder="amount, e.g. 1 1/2" aria-label="${label} amount">
        <select aria-label="${label} unit">${unitKeys.map((u) => `<option value="${u}">${UNIT_LABEL[u] ?? u}</option>`).join('')}</select>
        <button type="button" class="secondary">Fill grams</button><p class="conv-msg" role="alert"></p></div>`;
}

// Wire typing and the Convert widget in `rows`. onEdit(id) when a grams field is typed in; onFill(id, text) when Convert fills one.
export function wireRows(rows, { toGrams, onEdit, onFill }) {
  rows.addEventListener('input', (e) => { if (e.target.id.startsWith('in-')) onEdit(e.target.id.slice(3)); });
  rows.addEventListener('click', (e) => {
    const row = e.target.closest('.row'); if (!row) return;
    const id = row.querySelector('input').id.slice(3);
    const panel = $('#conv-' + id);
    if (e.target.classList.contains('conv-toggle')) {
      const open = panel.hidden;
      panel.hidden = !open; e.target.setAttribute('aria-expanded', open);
      if (open) panel.querySelector('input').focus();
    } else if (e.target.closest('.convert') && e.target.tagName === 'BUTTON') {
      const msg = $('.conv-msg', panel);
      const g = toGrams(id, panel.querySelector('input').value, panel.querySelector('select').value);
      if (Number.isNaN(g)) { msg.textContent = 'Enter an amount like 2, 1 1/2 or ¾.'; return; }
      msg.textContent = '';
      onFill(id, fmt(g)); panel.hidden = true;
      $('.conv-toggle', row).setAttribute('aria-expanded', 'false');
    }
  });
}

// Share button: put the link in the box and on the clipboard.
export function wireShare(button, box, makeUrl) {
  button.addEventListener('click', async () => {
    const url = makeUrl();
    box.value = url; box.hidden = false; box.select();
    try { await navigator.clipboard.writeText(url); button.textContent = 'Copied!'; setTimeout(() => (button.textContent = 'Copy share link'), 2000); } catch { /* user can copy from the box */ }
  });
}
