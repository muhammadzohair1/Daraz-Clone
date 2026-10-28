/* ============================================================
   STORES — modal.js
   Quick-view product modal: gallery + thumbnails, specs table,
   features, verified price + verification date, related products,
   wishlist/compare actions, Daraz CTA, image zoom.
   ============================================================ */

import { $, esc, fmtPrice, openOverlay, closeOverlay } from './utilities.js';
import { productById, productImage } from './products.js';

let trigger = null;
let current = null;
let imgIndex = 0;

export function initModal() {
    const modal = $('#product-modal');
    if (!modal) return;
    document.addEventListener('click', (e) => {
        const quick = e.target.closest('[data-quick]');
        if (quick) { open(productById(quick.dataset.quick), quick); return; }
        if (e.target.closest('[data-close-modal]')) { close(); return; }
        const thumb = e.target.closest('.qm-thumb');
        if (thumb) { setThumb(Number(thumb.dataset.index)); return; }
        if (e.target.closest('.qm-zoom')) {
            $('#qm-img').classList.toggle('is-zoomed');
            return;
        }
        const rel = e.target.closest('[data-related]');
        if (rel) { open(productById(rel.dataset.related), rel); }
    });
    modal.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            import('./utilities.js').then(({ trapFocus }) => trapFocus(modal, e));
        }
        if (e.key === 'Escape') close();
    });
}

export function open(product, triggerEl) {
    if (!product) return;
    const modal = $('#product-modal');
    trigger = triggerEl || document.activeElement;
    current = product;
    imgIndex = 0;
    const images = product.images || [];
    const mainImg = $('#qm-img');
    if (images.length) {
        mainImg.src = images[0];
        mainImg.alt = `${product.name} — ${product.category} product photo`;
        mainImg.closest('.modal-media').classList.remove('media-broken');
        mainImg.classList.remove('img-broken');
        mainImg.dataset.fallback = '1';
    } else {
        mainImg.removeAttribute('src');
        mainImg.alt = `${product.name} — product image unavailable`;
    }
    $('#qm-zoom').hidden = !images.length;
    mainImg.classList.remove('is-zoomed');

    $('#qm-cat').textContent = product.category;
    $('#qm-title').textContent = product.name;
    $('#qm-desc').textContent = product.description;
    const brandEl = $('#qm-brand');
    brandEl.textContent = product.brand ? `Brand: ${product.brand}` : '';
    brandEl.hidden = !product.brand;

    const priceEl = $('#qm-price');
    const verifiedEl = $('#qm-verified');
    const wasEl = $('#qm-price-was');
    if (product.price != null) {
        priceEl.textContent = fmtPrice(product.price);
        priceEl.hidden = false;
        if (product.originalPrice != null && product.originalPrice > product.price) {
            wasEl.textContent = fmtPrice(product.originalPrice);
            wasEl.hidden = false;
        } else {
            wasEl.hidden = true;
        }
    } else {
        priceEl.hidden = true;
        wasEl.hidden = true;
    }
    if (product.priceVerifiedAt) {
        verifiedEl.textContent = `Price verified ${product.priceVerifiedAt}`;
        verifiedEl.hidden = false;
    } else {
        verifiedEl.hidden = true;
    }

    const specs = $('#qm-info');
    if (product.specifications && Object.keys(product.specifications).length) {
        specs.innerHTML = Object.entries(product.specifications)
            .map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('');
        specs.hidden = false;
    } else {
        specs.hidden = true;
    }

    const features = $('#qm-features');
    if (product.features && product.features.length) {
        features.innerHTML = product.features.map((f) => `<li>${esc(f)}</li>`).join('');
        features.hidden = false;
    } else {
        features.hidden = true;
    }

    const link = $('#qm-link');
    link.href = product.darazUrl;
    link.setAttribute('aria-label', `Shop ${product.name} on Daraz (opens in a new tab)`);

    const wlBtn = $('#qm-wishlist');
    if (wlBtn) {
        wlBtn.dataset.wishlist = product.id;
        wlBtn.setAttribute('aria-label', `Add ${product.name} to wishlist`);
        // "is-active" state is applied by Script.js after wishlist init
        wlBtn.classList.toggle('is-active', window.__storesWishlistHas(product.id));
    }

    const cmpBtn = $('#qm-compare');
    if (cmpBtn) {
        cmpBtn.dataset.compare = product.id;
        cmpBtn.classList.toggle('is-active', window.__storesCompareHas(product.id));
    }

    renderRelated(product);
    renderThumbs(product);

    openOverlay(modal, $('.modal-close', modal));
    document.dispatchEvent(new CustomEvent('quickview:open', { detail: { id: product.id } }));
}

export function close() {
    const modal = $('#product-modal');
    if (!modal) return;
    closeOverlay(modal, trigger);
    trigger = null;
    document.dispatchEvent(new CustomEvent('quickview:close'));
}

function renderRelated(product) {
    const related = window.__storesRelatedProducts(product.id);
    const wrap = $('#qm-related-wrap');
    const el = $('#qm-related');
    if (!related.length) {
        wrap.hidden = true;
        el.innerHTML = '';
        return;
    }
    wrap.hidden = false;
    el.innerHTML = related.map((p) => `
        <button class="qm-related-card" data-related="${p.id}">
            <img src="${productImage(p)}" alt="" loading="lazy" width="72" height="72">
            <span class="qm-related-name">${esc(p.name)}</span>
            <span class="qm-related-cat">${esc(p.category)}</span>
        </button>`).join('');
}

function renderThumbs(product) {
    const thumbs = $('#qm-thumbs');
    const images = product.images || [];
    if (images.length < 2) {
        thumbs.hidden = true;
        thumbs.innerHTML = '';
        return;
    }
    thumbs.hidden = false;
    thumbs.innerHTML = images.map((src, i) => `
        <button class="qm-thumb ${i === 0 ? 'is-active' : ''}" data-index="${i}"
            aria-label="View image ${i + 1} of ${images.length}">
            <img src="${src}" alt="" loading="lazy" width="72" height="72">
        </button>`).join('');
}

function setThumb(i) {
    imgIndex = i;
    const product = current;
    const mainImg = $('#qm-img');
    mainImg.src = product.images[i];
    mainImg.classList.remove('is-zoomed');
    $$('.qm-thumb', $('#qm-thumbs')).forEach((t) =>
        t.classList.toggle('is-active', Number(t.dataset.index) === i));
}
