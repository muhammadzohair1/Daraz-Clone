/* ============================================================
   STORES — search.js
   Fullscreen search overlay (Ctrl/Cmd + K), debounced live
   suggestions, recent searches, keyboard navigation.
   Selections set the product grid query via a custom event.
   ============================================================ */

import { $, $$, store, debounce, esc } from './utilities.js';
import { PRODUCTS, productImage } from './products.js';

const RECENT_KEY = 'stores_recent_searches';
const MAX_RECENT = 5;
let overlayOpen = false;
let activeIndex = -1;
let trigger = null;

export function initSearch() {
    const overlay = $('#search-overlay');
    if (!overlay) return;
    const input = $('#search-overlay-input');
    const clearBtn = $('#search-overlay-clear');

    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            if (overlayOpen) close(); else open();
        }
        if (e.key === 'Escape' && overlayOpen) close();
    });
    document.addEventListener('click', (e) => {
        if (e.target.closest('[data-open-search]')) { open(); return; }
        if (e.target.closest('[data-close-search]')) { close(); return; }
        if (e.target.closest('[data-search-select]')) {
            const id = e.target.closest('[data-search-select]').dataset.searchSelect;
            const q = input.value.trim();
            saveRecent(q);
            close();
            document.dispatchEvent(new CustomEvent('search:select', { detail: { id, query: q } }));
            return;
        }
        if (e.target.closest('[data-recent]')) {
            const q = e.target.closest('[data-recent]').dataset.recent;
            input.value = q;
            renderResults(q);
            input.focus();
        }
    });
    input.addEventListener('input', debounce(() => renderResults(input.value), 180));
    input.addEventListener('keydown', (e) => navigateResults(e));
    clearBtn.addEventListener('click', () => {
        input.value = '';
        renderResults('');
        input.focus();
    });
    overlay.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            import('./utilities.js').then(({ trapFocus }) => trapFocus(overlay, e));
        }
    });
}

export function open(triggerEl) {
    const overlay = $('#search-overlay');
    if (!overlay) return;
    trigger = triggerEl || document.activeElement;
    overlayOpen = true;
    overlay.hidden = false;
    document.body.classList.add('no-scroll');
    const input = $('#search-overlay-input');
    input.value = '';
    renderResults('');
    input.focus();
}

export function close() {
    const overlay = $('#search-overlay');
    if (!overlay) return;
    overlayOpen = false;
    activeIndex = -1;
    overlay.hidden = true;
    document.body.classList.remove('no-scroll');
    if (trigger && document.contains(trigger)) trigger.focus();
    trigger = null;
}

/* ---------- Matching ---------- */
export function matches(query) {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return PRODUCTS.filter((p) => {
        const hay = [
            p.name, p.description, p.category, p.brand || '',
            (p.tags || []).join(' '),
        ].join(' ').toLowerCase();
        return q.split(/\s+/).every((word) => hay.includes(word));
    });
}

function renderResults(query) {
    const overlay = $('#search-overlay');
    const results = $('#search-overlay-results');
    const emptyEl = $('#search-overlay-empty');
    const emptyText = $('#search-overlay-empty-text');
    const hint = $('#search-overlay-hint');
    const clearBtn = $('#search-overlay-clear');
    if (!overlay) return;
    activeIndex = -1;
    clearBtn.hidden = !query.trim();

    if (!query.trim()) {
        hint.hidden = false;
        emptyEl.hidden = true;
        results.innerHTML = '';
        renderRecent(results);
        return;
    }
    hint.hidden = true;
    const found = matches(query);
    if (!found.length) {
        results.innerHTML = '';
        emptyEl.hidden = false;
        emptyText.textContent = `No products match “${query.trim()}”.`;
        return;
    }
    emptyEl.hidden = true;
    results.innerHTML = found.map((p, i) => `
        <button class="search-result" role="option" data-result-index="${i}"
            aria-selected="${i === 0}"
            data-search-select="${p.id}">
            <span class="search-result-thumb"><img src="${productImage(p)}" alt="" loading="lazy" width="56" height="56"></span>
            <span class="search-result-name">${esc(p.name)}</span>
            <span class="search-result-cat">${esc(p.category)}</span>
        </button>`).join('');
    activeIndex = 0;
}

function renderRecent(results) {
    const recent = store.get(RECENT_KEY, []);
    if (!recent.length) return;
    const wrap = document.createElement('div');
    wrap.className = 'search-recent';
    wrap.innerHTML = `
        <p class="search-recent-label">Recent searches</p>
        <div class="search-recent-list">
            ${recent.map((q) => `<button class="search-recent-item" data-recent="${esc(q)}">${esc(q)}</button>`).join('')}
        </div>`;
    results.appendChild(wrap);
}

function saveRecent(q) {
    if (!q) return;
    const recent = store.get(RECENT_KEY, []);
    const updated = [q, ...recent.filter((r) => r !== q)].slice(0, MAX_RECENT);
    store.set(RECENT_KEY, updated);
}

function navigateResults(e) {
    const options = $$('.search-result', $('#search-overlay-results'));
    if (!options.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); activeIndex = (activeIndex + 1) % options.length; }
    else if (e.key === 'ArrowUp') { e.preventDefault(); activeIndex = (activeIndex - 1 + options.length) % options.length; }
    else if (e.key === 'Enter') { e.preventDefault(); options[activeIndex]?.click(); return; }
    else return;
    options.forEach((o, i) => o.setAttribute('aria-selected', String(i === activeIndex)));
    options[activeIndex]?.scrollIntoView({ block: 'nearest' });
}
