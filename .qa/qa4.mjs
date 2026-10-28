/* Stores — QA script #4: sort with verified prices, category filter cats,
   collections click-to-filter, skip link, keyboard on lightbox */
export default async function run(page, ui) {
    const out = {};
    const click = (sel) => page.evaluate((s) => document.querySelector(s)?.click(), sel);

    // sort dropdown: order should not change when no prices exist (all null)
    await page.selectOption('#sort', 'price-asc');
    await page.waitForTimeout(300);
    out.pricesAsc = await page.evaluate(() => [...document.querySelectorAll('#cards .card')].map((c) => c.dataset.price));
    await page.selectOption('#sort', 'featured');
    await page.waitForTimeout(200);

    // category filter
    await click('[data-filter="Apparel"]');
    await page.waitForTimeout(300);
    out.apparelCount = await page.evaluate(() => document.querySelectorAll('#cards .card').length);
    out.apparelCats = await page.evaluate(() => [...document.querySelectorAll('#cards .card')].map((c) => c.querySelector('.card-tag').textContent));
    await click('[data-filter="all"]');
    await page.waitForTimeout(200);

    // collections click filters products (Style Finds → Apparel)
    await click('[data-collection="style"]');
    await page.waitForTimeout(600);
    out.collFiltered = await page.evaluate(() => document.querySelectorAll('#cards .card').length);
    out.collScrollY = await page.evaluate(() => window.scrollY > 100);
    await page.evaluate(() => { document.getElementById('clear-filters')?.click(); });
    await page.waitForTimeout(200);
    out.afterClear = await page.evaluate(() => document.querySelectorAll('#cards .card').length);

    // skip link focus
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.keyboard.press('Tab');
    out.skipLinkFocused = await page.evaluate(() => document.activeElement.className.includes('skip-link'));
    out.skipLinkHref = await page.evaluate(() => document.querySelector('.skip-link')?.getAttribute('href'));

    // lightbox keyboard arrows
    await click('.gallery-thumb');
    await page.waitForTimeout(500);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(200);
    out.lbCap2 = await page.evaluate(() => document.getElementById('lb-cap').textContent);
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(200);
    out.lbCap1 = await page.evaluate(() => document.getElementById('lb-cap').textContent);
    await page.keyboard.press('Escape');
    out.lbClosed = await page.evaluate(() => document.getElementById('lightbox').hidden);

    // quick view Escape + focus restore
    await click('[data-quick="gripper"]');
    await page.waitForTimeout(400);
    out.modalOpen = await page.evaluate(() => !document.getElementById('product-modal').hidden);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    out.modalClosed = await page.evaluate(() => document.getElementById('product-modal').hidden);

    // search overlay Escape closes
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape');
    out.searchClosedAfterEsc = await page.evaluate(() => document.getElementById('search-overlay').hidden);

    // no-JS fallback: reveal visible (all reveals should get .in after scroll)
    await page.evaluate(async () => {
        const h = document.body.scrollHeight;
        for (let y = 0; y < h; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
    });
    await page.waitForTimeout(800);
    out.revealsTotal = await page.evaluate(() => document.querySelectorAll('.reveal').length);
    out.revealsIn = await page.evaluate(() => document.querySelectorAll('.reveal.in').length);
    return out;
}
