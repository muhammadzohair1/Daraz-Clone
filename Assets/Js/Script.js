/* ============================================================
   Stores — Script.js (orchestrator)
   Imports product data, filters, search, wishlist, comparison,
   modal, gallery, and utilities. Renders product cards and
   wires the UI together.
   ============================================================ */

import { PRODUCTS, productImage, productById, COLLECTIONS } from './products.js';
import { $, $$, fmtPrice, esc, debounce, bindImageFallback, trapFocus, openOverlay, closeOverlay } from './utilities.js';
import { state, visibleProducts } from './filters.js';
import { initSearch } from './search.js';
import { initWishlist, has as wlHas } from './wishlist.js';
import { initComparison, has as cmpHas } from './comparison.js';
import { initModal } from './modal.js';
import { initGallery } from './gallery.js';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Bridges for decoupled modules ---------- */
window.__storesProductName = (id) => productById(id)?.name || null;
window.__storesWishlistHas = (id) => wlHas(id);
window.__storesCompareHas = (id) => cmpHas(id);
window.__storesRelatedProducts = (id) => {
    const p = productById(id);
    if (!p) return [];
    return PRODUCTS.filter((x) => x.id !== id && x.category === p.category).slice(0, 3);
};

/* ============================================================
   Product card rendering
   ============================================================ */
const cardsEl = $('#cards');
const emptyEl = $('#empty-state');
const countEl = $('#product-count');
const clearFiltersBtn = $('#clear-filters');
const searchInput = $('#search');
const searchClear = $('#search-clear');
const sortEl = $('#sort');
const filtersEl = $('#filters');

function cardHTML(p, index) {
    const priceHTML = p.price != null
        ? `<p class="card-price">${fmtPrice(p.price)}<small>on Daraz</small></p>`
        : '';
    const badgeHTML = p.badge ? `<span class="card-badge">${esc(p.badge)}</span>` : '';
    const img = productImage(p);
    return `
    <article class="card reveal" data-id="${p.id}">
        <div class="card-media" data-media>
            ${img ? `<img src="${img}" alt="${esc(p.name)} — ${esc(p.category)} product photo" loading="${index < 3 ? 'eager' : 'lazy'}" width="800" height="600" data-fallback>` : ''}
            ${badgeHTML}
            <div class="card-actions">
                <button class="card-action ${wlHas(p.id) ? 'is-active' : ''}" data-wishlist="${p.id}"
                    aria-label="Save ${esc(p.name)} to wishlist" aria-pressed="${wlHas(p.id)}">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M8 13.5S2 10 2 5.8A3 3 0 0 1 8 4a3 3 0 0 1 6 1.8C14 10 8 13.5 8 13.5z"
                            stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" fill="none"/>
                    </svg>
                </button>
                <button class="card-action" data-quick="${p.id}" aria-label="Quick view ${esc(p.name)}">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z" stroke="currentColor" stroke-width="1.5"/>
                        <circle cx="8" cy="8" r="1.8" stroke="currentColor" stroke-width="1.5"/>
                    </svg>
                </button>
            </div>
        </div>
        <div class="card-body">
            <span class="card-tag">${esc(p.category)}</span>
            <h3 class="card-title">${esc(p.name)}</h3>
            <p class="card-text">${esc(p.description)}</p>
            ${priceHTML}
            <div class="card-footer">
                <a href="${p.darazUrl}" target="_blank" rel="noopener noreferrer" class="card-link"
                   aria-label="Shop ${esc(p.name)} on Daraz (opens in a new tab)">Shop on Daraz
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </a>
                <button class="card-compare-inline ${cmpHas(p.id) ? 'is-active' : ''}" data-compare="${p.id}"
                    aria-pressed="${cmpHas(p.id)}">Compare</button>
            </div>
        </div>
    </article>`;
}

function renderProducts() {
    const list = visibleProducts();
    cardsEl.innerHTML = list.map(cardHTML).join('');
    countEl.textContent = list.length === PRODUCTS.length
        ? `Showing all ${list.length} products`
        : `Showing ${list.length} of ${PRODUCTS.length} products`;
    const hasFilters = state.category !== 'all' || state.query !== '' || state.sort !== 'featured';
    clearFiltersBtn.hidden = !hasFilters;
    emptyEl.hidden = list.length !== 0;
    bindImageFallback(cardsEl);
    revealCards();
    document.dispatchEvent(new CustomEvent('products:rendered'));
}

function revealCards() {
    $$('.card', cardsEl).forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight) el.classList.add('in');
        else revealObserver.observe(el);
    });
}

/* ============================================================
   Category chips
   ============================================================ */
function buildFilters() {
    const cats = ['all', ...new Set(PRODUCTS.map((p) => p.category))];
    const html = cats.map((c) =>
        `<button class="chip ${c === state.category ? 'is-active' : ''}" data-filter="${c}"
            aria-pressed="${c === state.category}">${c === 'all' ? 'All' : c}</button>`).join('');
    filtersEl.innerHTML = html;
    $('#filter-drawer-body').innerHTML = `
        <p class="filter-group-label">Category</p>
        <div class="filters">${html}</div>`;
}

filtersEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.chip[data-filter]');
    if (!btn) return;
    setFilter(btn.dataset.filter);
});
$('#filter-drawer-body').addEventListener('click', (e) => {
    const btn = e.target.closest('.chip[data-filter]');
    if (!btn) return;
    setFilter(btn.dataset.filter);
    closeFilterDrawer();
});

function setFilter(cat) {
    state.category = cat;
    $$('.chip[data-filter]').forEach((c) => {
        const active = c.dataset.filter === cat;
        c.classList.toggle('is-active', active);
        c.setAttribute('aria-pressed', String(active));
    });
    renderProducts();
}

/* ---------- Toolbar search ---------- */
const debouncedSearch = debounce(() => {
    state.query = searchInput.value.trim().toLowerCase();
    renderProducts();
}, 220);
searchInput.addEventListener('input', () => {
    searchClear.hidden = !searchInput.value;
    debouncedSearch();
});
searchClear.addEventListener('click', () => {
    searchInput.value = '';
    searchClear.hidden = true;
    state.query = '';
    renderProducts();
    searchInput.focus();
});
sortEl.addEventListener('change', () => { state.sort = sortEl.value; renderProducts(); });

/* ---------- Grid / list view toggle ---------- */
const viewGridBtn = $('#view-grid');
const viewListBtn = $('#view-list');
function setView(v) {
    state.view = v;
    cardsEl.classList.toggle('list-view', v === 'list');
    viewGridBtn.classList.toggle('is-active', v === 'grid');
    viewListBtn.classList.toggle('is-active', v === 'list');
    viewGridBtn.setAttribute('aria-pressed', String(v === 'grid'));
    viewListBtn.setAttribute('aria-pressed', String(v === 'list'));
    $$('.card', cardsEl).forEach((el) => el.classList.toggle('list-item', v === 'list'));
}
viewGridBtn.addEventListener('click', () => setView('grid'));
viewListBtn.addEventListener('click', () => setView('list'));

function clearAll() {
    state.category = 'all'; state.query = ''; state.sort = 'featured';
    searchInput.value = ''; searchClear.hidden = true; sortEl.value = 'featured';
    buildFilters();
    renderProducts();
}
clearFiltersBtn.addEventListener('click', clearAll);
$('#clear-filters-empty').addEventListener('click', clearAll);

/* Search overlay: choosing a suggestion sets the grid query */
document.addEventListener('search:select', (e) => {
    state.query = e.detail.query.toLowerCase();
    searchInput.value = e.detail.query;
    searchClear.hidden = !e.detail.query;
    renderProducts();
    $('#products').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
});

/* Footer category shortcuts */
$$('.footer-links a[data-cat]').forEach((a) => a.addEventListener('click', () => {
    setFilter(a.dataset.cat);
}));

/* ============================================================
   Mobile filter drawer
   ============================================================ */
const drawer = $('#filter-drawer');
const filterToggle = $('#filter-toggle');
let drawerTrigger = null;

function openFilterDrawer() {
    drawerTrigger = filterToggle;
    drawer.hidden = false;
    filterToggle.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => drawer.classList.add('open'));
    document.body.classList.add('no-scroll');
    $('.filter-drawer-close', drawer).focus();
}
function closeFilterDrawer() {
    drawer.classList.remove('open');
    filterToggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('no-scroll');
    setTimeout(() => { drawer.hidden = true; }, reduceMotion ? 0 : 420);
    if (drawerTrigger) { drawerTrigger.focus(); drawerTrigger = null; }
}
filterToggle.addEventListener('click', () => drawer.hidden ? openFilterDrawer() : closeFilterDrawer());
drawer.addEventListener('click', (e) => { if (e.target.closest('[data-close-drawer]')) closeFilterDrawer(); });
drawer.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeFilterDrawer();
    if (e.key === 'Tab') trapFocus(drawer, e);
});

/* ============================================================
   Collections
   ============================================================ */
function renderCollections() {
    const grid = $('#collection-grid');
    grid.innerHTML = COLLECTIONS.map((c) => {
        const count = PRODUCTS.filter((p) => p.collection === c.id).length;
        return `
        <a class="collection-card reveal" href="#products" data-collection="${c.id}"
            aria-label="View ${c.title} collection (${count} products)">
            <img src="${c.cover}" alt="" loading="lazy" width="800" height="600" data-fallback>
            <span class="collection-card-body">
                <h3>${c.title}</h3>
                <p>${c.description}</p>
                <span class="collection-card-meta">${count} product${count === 1 ? '' : 's'} — view</span>
            </span>
        </a>`;
    }).join('');
    grid.addEventListener('click', (e) => {
        const card = e.target.closest('[data-collection]');
        if (!card) return;
        const c = COLLECTIONS.find((x) => x.id === card.dataset.collection);
        if (!c) return;
        // Map a collection to the products it contains via a tag-style query
        const products = PRODUCTS.filter((p) => p.collection === c.id);
        state.query = '';
        state.category = 'all';
        searchInput.value = '';
        searchClear.hidden = true;
        sortEl.value = 'featured';
        buildFilters();
        if (products.length && products.every((p) => p.category === products[0].category)) {
            setFilter(products[0].category);
        } else {
            setFilter('all');
        }
    });
    bindReveal(grid);
}

/* ============================================================
   Wishlist panel rendering
   ============================================================ */
document.addEventListener('wishlist:render', (e) => {
    const { listEl, ids } = e.detail;
    listEl.innerHTML = ids.map((id) => {
        const p = productById(id);
        if (!p) return '';
        const img = productImage(p);
        return `
        <div class="wishlist-item">
            ${img ? `<img src="${img}" alt="${esc(p.name)} — product photo" width="72" height="72" data-fallback>` : ''}
            <div>
                <p class="wishlist-item-name">${esc(p.name)}</p>
                <p class="wishlist-item-cat">${esc(p.category)}</p>
            </div>
            <div class="wishlist-item-actions">
                <button class="card-action" data-quick="${p.id}" aria-label="Quick view ${esc(p.name)}">
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z" stroke="currentColor" stroke-width="1.5"/>
                        <circle cx="8" cy="8" r="1.8" stroke="currentColor" stroke-width="1.5"/>
                    </svg>
                </button>
                <button class="card-action" data-remove-item="${p.id}" aria-label="Remove ${esc(p.name)} from wishlist">
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                    </svg>
                </button>
            </div>
        </div>`;
    }).join('');
    bindImageFallback(listEl);
});

/* Wishlist clear confirmation */
document.addEventListener('wishlist:clear-request', () => {
    openConfirm('Clear wishlist?', 'This removes all saved products from this device. This cannot be undone.', () => {
        import('./wishlist.js').then((m) => { m.clear(); });
    });
});

/* ============================================================
   Compare table rendering
   ============================================================ */
document.addEventListener('compare:render', (e) => {
    const { wrap, ids } = e.detail;
    const products = ids.map((id) => productById(id)).filter(Boolean);
    if (products.length < 2) return;

    const specKeys = [...new Set(products.flatMap((p) => Object.keys(p.specifications || {})))];
    const diff = (fn) => {
        const vals = products.map(fn);
        return new Set(vals).size > 1 ? ' class="diff"' : '';
    };

    wrap.innerHTML = `
    <table class="compare-table">
        <tr>
            <th scope="row"></th>
            ${products.map((p) => {
                const img = productImage(p);
                return `<td><div class="compare-head-cell">${img ? `<img src="${img}" alt="${esc(p.name)} product photo" width="200" height="150">` : ''}
                    <p class="compare-head-name">${esc(p.name)}</p></div></td>`;
            }).join('')}
        </tr>
        <tr>
            <th scope="row">Category</th>
            ${products.map((p) => `<td${diff((p) => p.category)}>${esc(p.category)}</td>`).join('')}
        </tr>
        ${products.some((p) => p.brand) ? `<tr>
            <th scope="row">Brand</th>
            ${products.map((p) => `<td${diff((p) => p.brand || '')}>${p.brand ? esc(p.brand) : '<span class="na">Not listed</span>'}</td>`).join('')}
        </tr>` : ''}
        <tr>
            <th scope="row">Verified price</th>
            ${products.map((p) => `<td${diff((p) => (p.price == null ? 'na' : String(p.price)))}>${p.price != null ? fmtPrice(p.price) : '<span class="na">Not verified</span>'}</td>`).join('')}
        </tr>
        ${specKeys.map((k) => `<tr>
            <th scope="row">${esc(k)}</th>
            ${products.map((p) => {
                const v = p.specifications?.[k];
                return `<td${diff((p) => p.specifications?.[k] ?? '')}>${v ? esc(v) : '<span class="na">Not listed</span>'}</td>`;
            }).join('')}
        </tr>`).join('')}
        <tr>
            <th scope="row">Where to buy</th>
            ${products.map((p) => `<td class="compare-actions-cell"><a href="${p.darazUrl}" target="_blank" rel="noopener noreferrer">View on Daraz ↗</a></td>`).join('')}
        </tr>
        <tr>
            <th scope="row">Actions</th>
            ${products.map((p) => `<td><div class="compare-actions">
                <button class="card-action" data-quick="${p.id}" aria-label="Quick view ${esc(p.name)}">
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z" stroke="currentColor" stroke-width="1.5"/>
                        <circle cx="8" cy="8" r="1.8" stroke="currentColor" stroke-width="1.5"/>
                    </svg>
                </button>
                <button class="card-action" data-compare-remove="${p.id}" aria-label="Remove ${esc(p.name)} from comparison">
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                    </svg>
                </button>
            </div></td>`).join('')}
        </tr>
    </table>`;
    bindImageFallback(wrap);
});

/* ---------- Compare bar open button ---------- */
document.addEventListener('click', (e) => {
    if (e.target.closest('[data-open-compare]')) {
        // comparison.js handles opening; ensure focus restoration goes to the bar button
        document.dispatchEvent(new CustomEvent('compare:bar-focus'));
    }
});

/* ============================================================
   Global keyboard handling (modals/drawers focus traps)
   ============================================================ */
document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
        const compareModal = $('#compare-modal');
        if (!compareModal.hidden) trapFocus(compareModal, e);
        const confirm = $('#confirm-dialog');
        if (!confirm.hidden) trapFocus(confirm, e);
    }
    if (e.key === 'Escape' && !$('#product-modal').hidden) {
        // Quick-view Escape is handled inside modal.js; safety net here:
        closeOverlay($('#product-modal'));
        document.dispatchEvent(new CustomEvent('quickview:close'));
    }
    if (e.key === 'Escape' && !$('#compare-modal').hidden) {
        $('#compare-modal').hidden = true;
        document.body.classList.remove('no-scroll');
        const btn = $('#compare-open-btn');
        if (btn) btn.focus();
    }
});

/* ============================================================
   Confirm dialog
   ============================================================ */
let confirmCb = null;
function openConfirm(title, text, cb) {
    $('#confirm-title').textContent = title;
    $('#confirm-text').textContent = text;
    confirmCb = cb;
    openOverlay($('#confirm-dialog'), $('#confirm-yes'));
}
function closeConfirm() {
    closeOverlay($('#confirm-dialog'), null);
    confirmCb = null;
}
$('#confirm-yes').addEventListener('click', () => { const cb = confirmCb; closeConfirm(); if (cb) cb(); });
$('#confirm-dialog').addEventListener('click', (e) => {
    if (e.target.closest('[data-close-confirm]')) closeConfirm();
});

/* ============================================================
   Takeover menu — animated SVG hamburger
   ============================================================ */
const navBtn = $('#nav-btn');
const takeoverNav = $('#takeover-nav');
const topLine = $('#top-line-1');
const middleLine = $('#middle-line-1');
const bottomLine = $('#bottom-line-1');

let menuState = 'menu', frame = 1;
const SEG = 15;
let menuDisappearDone = false, arrowAppearDone = false,
    arrowDisappearDone = false, menuAppearDone = false;

const easeInBack = (t, b, c, d, s = 1.70158) => { t = t / d; return c * t * t * ((s + 1) * t - s) + b; };
const easeOutBack = (t, b, c, d, s = 1.70158) => { t = t / d - 1; return c * (t * t * ((s + 1) * t + s) + 1) + b; };

function menuDisappear() {
    frame++;
    if (frame <= SEG) requestAnimationFrame(() => {
        topLine.setAttribute('d', 'M30,' + easeInBack(frame, 37, 13, SEG) + ' L70,' + easeInBack(frame, 37, 13, SEG));
        bottomLine.setAttribute('d', 'M30,' + easeInBack(frame, 63, -13, SEG) + ' L70,' + easeInBack(frame, 63, -13, SEG));
        menuDisappear();
    });
    else { middleLine.style.opacity = '0'; frame = 1; menuDisappearDone = true; openAnim(); }
}
function arrowAppear() {
    frame++;
    if (frame <= SEG) requestAnimationFrame(() => {
        const tlx = easeOutBack(frame, 30, 5, SEG), tly = easeOutBack(frame, 50, -15, SEG);
        const brx = easeOutBack(frame, 70, -5, SEG), bry = easeOutBack(frame, 50, 15, SEG);
        topLine.setAttribute('d', `M${tlx},${tly} L${brx},${bry}`);
        const blx = easeOutBack(frame, 30, 5, SEG), bly = easeOutBack(frame, 50, 15, SEG);
        const trx = easeOutBack(frame, 70, -5, SEG), tryY = easeOutBack(frame, 50, -15, SEG);
        bottomLine.setAttribute('d', `M${blx},${bly} L${trx},${tryY}`);
        arrowAppear();
    });
    else { frame = 1; arrowAppearDone = true; openAnim(); }
}
function arrowDisappear() {
    frame++;
    if (frame <= SEG) requestAnimationFrame(() => {
        const tlx = easeInBack(frame, 35, -5, SEG), tly = easeInBack(frame, 35, 15, SEG);
        const brx = easeInBack(frame, 65, 5, SEG), bry = easeInBack(frame, 65, -15, SEG);
        topLine.setAttribute('d', `M${tlx},${tly} L${brx},${bry}`);
        const blx = easeInBack(frame, 35, -5, SEG), bly = easeInBack(frame, 65, 15, SEG);
        const trx = easeInBack(frame, 65, 5, SEG), tryY = easeInBack(frame, 35, -15, SEG);
        bottomLine.setAttribute('d', `M${blx},${bly} L${trx},${tryY}`);
        arrowDisappear();
    });
    else { middleLine.style.opacity = '1'; frame = 1; arrowDisappearDone = true; closeAnim(); }
}
function menuAppear() {
    frame++;
    if (frame <= SEG) requestAnimationFrame(() => {
        topLine.setAttribute('d', 'M30,' + easeOutBack(frame, 50, -13, SEG) + ' L70,' + easeOutBack(frame, 50, -13, SEG));
        bottomLine.setAttribute('d', 'M30,' + easeOutBack(frame, 50, 13, SEG) + ' L70,' + easeOutBack(frame, 50, 13, SEG));
        menuAppear();
    });
    else { frame = 1; menuAppearDone = true; closeAnim(); }
}
function openAnim() { if (!menuDisappearDone) menuDisappear(); else if (!arrowAppearDone) arrowAppear(); }
function closeAnim() { if (!arrowDisappearDone) arrowDisappear(); else if (!menuAppearDone) menuAppear(); }

function openMenu() {
    takeoverNav.classList.add('open');
    takeoverNav.setAttribute('aria-hidden', 'false');
    navBtn.setAttribute('aria-expanded', 'true');
    navBtn.setAttribute('aria-label', 'Close menu');
    document.body.classList.add('no-scroll');
    menuState = 'arrow'; arrowDisappearDone = false; menuAppearDone = false;
    menuDisappearDone = false; arrowAppearDone = false;
    openAnim();
    const first = $('.takeover-items a', takeoverNav);
    if (first && !reduceMotion) setTimeout(() => first.focus(), 700);
    else if (first) first.focus();
}
function closeMenu() {
    takeoverNav.classList.remove('open');
    takeoverNav.setAttribute('aria-hidden', 'true');
    navBtn.setAttribute('aria-expanded', 'false');
    navBtn.setAttribute('aria-label', 'Open menu');
    document.body.classList.remove('no-scroll');
    menuState = 'menu'; menuDisappearDone = false; arrowAppearDone = false;
    arrowDisappearDone = false; menuAppearDone = false;
    closeAnim();
    navBtn.focus();
}

if (navBtn) {
    navBtn.addEventListener('click', () => menuState === 'menu' ? openMenu() : closeMenu());
    $$('.takeover-items a', takeoverNav).forEach((a, i) => {
        a.style.setProperty('--i', i);
        a.addEventListener('click', closeMenu);
    });
    takeoverNav.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { closeMenu(); return; }
        if (e.key === 'Tab') trapFocus(takeoverNav, e);
    });
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menuState === 'arrow') closeMenu();
});

/* ============================================================
   Wishlist / search / compare nav buttons
   ============================================================ */
$('#wishlist-btn')?.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('wishlist:open'));
});

/* ============================================================
   Nav behavior + scroll reveal + misc
   ============================================================ */
const nav = $('#nav');
let lastY = 0, ticking = false;

window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
        const y = window.scrollY;
        nav.classList.toggle('scrolled', y > 24);
        const shouldHide = y > lastY && y > 160;
        nav.classList.toggle('hidden', shouldHide);
        lastY = y;
        ticking = false;
    });
}, { passive: true });

// Active nav link highlighting
const navLinks = $$('#nav [data-navlink]');
const sectionByLink = navLinks.map((a) => $(a.getAttribute('href'))).filter(Boolean);
const navObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const idx = sectionByLink.indexOf(entry.target);
        navLinks.forEach((a, i) => a.classList.toggle('is-active', i === idx));
    });
}, { rootMargin: '-40% 0px -55% 0px' });
sectionByLink.forEach((s) => navObserver.observe(s));

// Scroll reveal
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('in');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });

function bindReveal(root = document) {
    $$('.reveal:not(.in)', root).forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('in');
        else revealObserver.observe(el);
    });
}

// Stagger siblings (hero CTA, chips)
$$('.hero-cta > .reveal, .filters .chip').forEach((el, i) => el.style.setProperty('--d', `${i * 0.06}s`));

bindReveal();

// Hero title mask reveal — run when ready, with a load fallback
function heroReveal() { const t = $('.hero-title'); if (t) t.classList.add('in'); }
if (document.readyState === 'complete') heroReveal();
else window.addEventListener('load', heroReveal);

// Subtle hero orb parallax (skipped for reduced motion / mobile)
const orbs = $$('.hero-orb');
if (!reduceMotion && window.matchMedia('(min-width: 768px)').matches) {
    let orbTick = false;
    window.addEventListener('scroll', () => {
        if (orbTick) return;
        orbTick = true;
        requestAnimationFrame(() => {
            const y = window.scrollY;
            orbs.forEach((o, i) => { o.style.marginTop = (y * (0.06 + i * 0.03)) + 'px'; });
            orbTick = false;
        });
    }, { passive: true });
}

// Footer year + back to top
$('#year').textContent = new Date().getFullYear();
$('#to-top').addEventListener('click', () =>
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));

/* ============================================================
   Boot
   ============================================================ */
buildFilters();
renderCollections();
renderProducts();
initSearch();
initWishlist();
initComparison();
initModal();
initGallery();
