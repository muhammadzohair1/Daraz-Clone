/* ============================================================
   STORES — wishlist.js
   Device-local favorites. Persisted in localStorage. Not an
   account — clearly labelled as such in the UI.
   ============================================================ */

import { $, $$, store } from './utilities.js';

const KEY = 'stores_wishlist';
let items = new Set(store.get(KEY, []));
const listeners = new Set();

export function initWishlist() {
    updateCount();
    bindPanel();
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-wishlist]');
        if (btn) toggle(btn.dataset.wishlist);
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isOpen()) close();
    });
    document.addEventListener('wishlist:change', () => { updateCount(); renderPanel(); });
    document.addEventListener('wishlist:open', () => open());
}

export function has(id) { return items.has(id); }
export function onChange(fn) { listeners.add(fn); }
export function ids() { return [...items]; }

function emit() {
    listeners.forEach((fn) => fn());
    document.dispatchEvent(new CustomEvent('wishlist:change', { detail: [...items] }));
}

export function toggle(id) {
    if (items.has(id)) items.delete(id);
    else items.add(id);
    store.set(KEY, [...items]);
    updateCount();
    renderPanel();
    emit();
}

export function clear() {
    items.clear();
    store.set(KEY, []);
    updateCount();
    renderPanel();
    emit();
}

function updateCount() {
    const n = items.size;
    $$('[data-wishlist-count]').forEach((el) => {
        el.textContent = String(n);
        el.closest('.nav-icon-btn')?.classList.toggle('has-items', n > 0);
    });
    // Sync card heart buttons
    $$('[data-wishlist]').forEach((btn) => {
        if (!btn.closest('#product-modal') && btn.classList.contains('card-action')) {
            const active = items.has(btn.dataset.wishlist);
            btn.classList.toggle('is-active', active);
            btn.setAttribute('aria-pressed', String(active));
        }
    });
}

/* ---------- Drawer panel ---------- */
const panel = () => $('#wishlist-panel');
const isOpen = () => panel() && !panel().hidden;

export function open() {
    const p = panel();
    if (!p) return;
    renderPanel();
    p.hidden = false;
    document.body.classList.add('no-scroll');
    ($('.panel-close', p) || p).focus();
}

export function close() {
    const p = panel();
    if (!p) return;
    p.hidden = true;
    document.body.classList.remove('no-scroll');
    const trigger = $('#wishlist-btn');
    if (trigger && document.contains(trigger)) trigger.focus();
}

function renderPanel() {
    const p = panel();
    if (!p) return;
    const listEl = $('.panel-list', p);
    const emptyEl = $('.panel-empty', p);
    const clearWrap = $('.panel-clear', p);
    const idsArr = [...items];
    if (!idsArr.length) {
        listEl.innerHTML = '';
        emptyEl.hidden = false;
        clearWrap.hidden = true;
        return;
    }
    emptyEl.hidden = true;
    clearWrap.hidden = false;
    document.dispatchEvent(new CustomEvent('wishlist:render', { detail: { listEl, ids: idsArr } }));
}

function bindPanel() {
    const p = panel();
    if (!p) return;
    p.addEventListener('click', (e) => {
        if (e.target.closest('[data-close-panel]')) { close(); return; }
        if (e.target.closest('[data-clear-wishlist]')) {
            document.dispatchEvent(new CustomEvent('wishlist:clear-request'));
            return;
        }
        if (e.target.closest('[data-remove-item]')) {
            toggle(e.target.closest('[data-remove-item]').dataset.removeItem);
        }
    });
    p.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            import('./utilities.js').then(({ trapFocus }) => trapFocus(p, e));
        }
    });
}
