/* ============================================================
   STORES — utilities.js
   Shared helpers: DOM, storage, dialogs (focus trap), images.
   ============================================================ */

export const $ = (sel, ctx = document) => ctx.querySelector(sel);
export const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

export const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Price formatting ---------- */
/* All prices are verified PKR values. Unverified prices never reach
   this function — callers check `price != null` first. */
export function fmtPrice(value) {
    return `Rs ${value.toLocaleString('en-PK')}`;
}

/* ---------- Safe localStorage (graceful when unavailable) ---------- */
const memoryStore = new Map();
let storageOK = true;
try {
    const t = '__stores_test__';
    localStorage.setItem(t, '1');
    localStorage.removeItem(t);
} catch (e) {
    storageOK = false;
}

export const store = {
    get(key, fallback) {
        try {
            if (!storageOK) return memoryStore.has(key) ? memoryStore.get(key) : fallback;
            const raw = localStorage.getItem(key);
            return raw === null ? fallback : JSON.parse(raw);
        } catch (e) {
            return memoryStore.has(key) ? memoryStore.get(key) : fallback;
        }
    },
    set(key, value) {
        try {
            if (!storageOK) { memoryStore.set(key, value); return; }
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            memoryStore.set(key, value);
        }
    },
};

/* ---------- Image fallback (graceful broken-image handling) ---------- */
export function bindImageFallback(root = document) {
    $$('img[data-fallback]', root).forEach((img) => {
        if (img.dataset.fbBound) return;
        img.dataset.fbBound = '1';
        img.addEventListener('error', () => {
            img.closest('[data-media]')?.classList.add('media-broken');
            img.classList.add('img-broken');
        });
    });
}

/* ---------- Dialog helpers: focus trap + scroll lock ---------- */
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function trapFocus(container, e) {
    const focusables = $$(FOCUSABLE, container).filter((el) => el.offsetParent !== null || el === document.activeElement);
    if (!focusables.length) { e.preventDefault(); return; }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    else if (!container.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
}

/* Opens/closes a fixed overlay: locks body scroll, moves focus in,
   remembers the trigger so focus can be restored on close. */
export function openOverlay(el, focusTarget) {
    el.hidden = false;
    document.body.classList.add('no-scroll');
    (focusTarget || el.querySelector(FOCUSABLE) || el).focus();
}

export function closeOverlay(el, restoreTo) {
    el.hidden = true;
    document.body.classList.remove('no-scroll');
    if (restoreTo && document.contains(restoreTo)) restoreTo.focus();
}

/* ---------- Debounce ---------- */
export function debounce(fn, wait = 220) {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), wait);
    };
}

/* ---------- Escape HTML (products are our own data, but stay safe) ---------- */
export function esc(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
}
