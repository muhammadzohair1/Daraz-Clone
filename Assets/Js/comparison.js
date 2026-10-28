/* ============================================================
   STORES — comparison.js
   Compare up to 3 products side by side. Missing specs are shown
   honestly as "Not listed" — never fabricated.
   ============================================================ */

import { $ } from './utilities.js';

const MAX = 3;
let selected = [];
const listeners = new Set();

export function initComparison() {
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-compare]');
        if (btn) { toggle(btn.dataset.compare); return; }
        if (e.target.closest('[data-compare-remove]')) {
            remove(e.target.closest('[data-compare-remove]').dataset.compareRemove);
            return;
        }
        if (e.target.closest('[data-compare-clear]')) { clear(); return; }
        if (e.target.closest('[data-open-compare]')) { open(); return; }
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isOpen()) close();
    });
    renderBar();
}

export function has(id) { return selected.includes(id); }
export function isFull() { return selected.length >= MAX; }
export function count() { return selected.length; }
export function onChange(fn) { listeners.add(fn); }

function emit() {
    listeners.forEach((fn) => fn(selected));
    document.dispatchEvent(new CustomEvent('compare:change', { detail: [...selected] }));
}

export function toggle(id) {
    if (selected.includes(id)) {
        selected = selected.filter((x) => x !== id);
    } else {
        if (selected.length >= MAX) {
            flashBar(`You can compare up to ${MAX} products.`);
            return;
        }
        selected.push(id);
    }
    renderBar();
    renderTable();
    emit();
}

export function remove(id) {
    selected = selected.filter((x) => x !== id);
    renderBar();
    renderTable();
    emit();
}

export function clear() {
    selected = [];
    renderBar();
    renderTable();
    emit();
}

/* ---------- Floating comparison bar ---------- */
function renderBar() {
    const bar = $('#compare-bar');
    if (!bar) return;
    const listEl = $('.compare-bar-list', bar);
    listEl.innerHTML = selected.map((id) => {
        const name = window.__storesProductName ? (window.__storesProductName(id) || id) : id;
        return `<span class="compare-chip">${name}
            <button data-compare-remove="${id}" aria-label="Remove ${name} from comparison">×</button></span>`;
    }).join('');
    bar.hidden = selected.length === 0;
    const openBtn = $('[data-open-compare]', bar);
    if (openBtn) openBtn.disabled = selected.length < 2;
    document.dispatchEvent(new CustomEvent('compare:rendered'));
}

let flashTimer;
function flashBar(msg) {
    const bar = $('#compare-bar');
    if (!bar) return;
    let note = $('.compare-note', bar);
    if (!note) {
        note = document.createElement('p');
        note.className = 'compare-note';
        note.setAttribute('role', 'status');
        bar.prepend(note);
    }
    note.textContent = msg;
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => { note.textContent = ''; }, 2600);
}

/* ---------- Comparison modal ---------- */
const modal = () => $('#compare-modal');
const isOpen = () => modal() && !modal().hidden;

export function open() {
    const m = modal();
    if (!m || selected.length < 2) return;
    renderTable();
    m.hidden = false;
    document.body.classList.add('no-scroll');
    $('.modal-close', m).focus();
    document.dispatchEvent(new CustomEvent('compare:open'));
}

export function close() {
    const m = modal();
    if (!m) return;
    m.hidden = true;
    document.body.classList.remove('no-scroll');
    document.dispatchEvent(new CustomEvent('compare:close'));
}

/* Table content is rendered by Script.js (needs product data + price helpers) */
function renderTable() {
    const m = modal();
    if (!m) return;
    const body = $('.compare-table-wrap', m);
    const emptyEl = $('.compare-empty-note', m);
    if (!body) return;
    if (selected.length < 2) {
        body.hidden = true;
        if (emptyEl) emptyEl.hidden = false;
        return;
    }
    if (emptyEl) emptyEl.hidden = true;
    body.hidden = false;
    document.dispatchEvent(new CustomEvent('compare:render', { detail: { wrap: body, ids: [...selected] } }));
}
