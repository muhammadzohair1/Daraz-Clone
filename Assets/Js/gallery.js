/* ============================================================
   STORES — gallery.js
   Showcase lightbox: large image, caption, prev/next, Escape,
   click-outside, focus management/restoration, loading state.
   ============================================================ */

import { $, $$, openOverlay, closeOverlay } from './utilities.js';

export function initGallery() {
    const lightbox = $('#lightbox');
    if (!lightbox) return;
    const items = $$('.gallery-thumb');
    if (!items.length) return;
    const GALLERY = items.map((btn) => {
        const img = btn.querySelector('img');
        return {
            src: img ? img.getAttribute('src') : '',
            alt: img ? img.alt : '',
            cap: btn.querySelector('figcaption')?.textContent || '',
        };
    });
    let index = 0;
    let trigger = null;

    function show(i) {
        index = (i + GALLERY.length) % GALLERY.length;
        const lbImg = $('#lb-img');
        const loader = $('#lb-loader');
        lbImg.classList.add('is-loading');
        loader.hidden = false;
        lbImg.onload = () => { lbImg.classList.remove('is-loading'); loader.hidden = true; };
        lbImg.onerror = () => { lbImg.classList.remove('is-loading'); loader.hidden = true; };
        lbImg.src = GALLERY[index].src;
        lbImg.alt = GALLERY[index].alt;
        $('#lb-cap').textContent = GALLERY[index].cap;
        $('#lb-count').textContent = `${index + 1} / ${GALLERY.length}`;
    }

    function open(i, triggerEl) {
        trigger = triggerEl || null;
        show(i);
        openOverlay(lightbox, $('.lb-close', lightbox));
    }

    function close() {
        closeOverlay(lightbox, trigger);
        trigger = null;
    }

    $$('.gallery-thumb').forEach((btn) =>
        btn.addEventListener('click', () => open(Number(btn.dataset.lightbox), btn)));
    lightbox.addEventListener('click', (e) => {
        if (e.target.closest('[data-close-lb]')) close();
        else if (e.target.closest('#lb-prev')) show(index - 1);
        else if (e.target.closest('#lb-next')) show(index + 1);
    });
    lightbox.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { close(); return; }
        if (e.key === 'ArrowLeft') show(index - 1);
        if (e.key === 'ArrowRight') show(index + 1);
        if (e.key === 'Tab') {
            import('./utilities.js').then(({ trapFocus }) => trapFocus(lightbox, e));
        }
    });
}
