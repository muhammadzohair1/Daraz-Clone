/* ============================================================
   STORES — filters.js
   Filtering, sorting, and view state for the product grid.
   All filter dimensions compose correctly. Products without
   verified prices are never treated as Rs 0.
   ============================================================ */

import { PRODUCTS } from './products.js';

export const state = {
    category: 'all',
    query: '',
    sort: 'featured',
    view: 'grid',
    collection: 'all',
};

/* ---------- Filtering ---------- */
export function visibleProducts() {
    let list = PRODUCTS.filter((p) => {
        const inCat = state.category === 'all' || p.category === state.category;
        const inCollection = state.collection === 'all' || p.collection === state.collection;
        if (!inCat || !inCollection) return false;
        if (!state.query) return true;
        const hay = [
            p.name, p.description, p.category, p.brand || '',
            (p.tags || []).join(' '),
        ].join(' ').toLowerCase();
        const q = state.query.trim().toLowerCase();
        return q.split(/\s+/).every((word) => hay.includes(word));
    });
    if (state.sort === 'az') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    if (state.sort === 'price-asc') list = [...list].sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
    if (state.sort === 'price-desc') list = [...list].sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
    return list;
}

export function categories() {
    return [...new Set(PRODUCTS.map((p) => p.category))];
}
