/* Stores — QA script #3: lightbox, takeover focus trap, sort/filters, collections, keyboard */
export default async function run(page, ui) {
    const out = {};
    const click = (sel) => page.evaluate((s) => document.querySelector(s)?.click(), sel);

    // lightbox
    await click('.gallery-thumb');
    await page.waitForTimeout(600);
    out.lbOpen = await page.evaluate(() => !document.getElementById('lightbox').hidden);
    out.lbCap = await page.evaluate(() => document.getElementById('lb-cap').textContent);
    await click('#lb-next');
    await page.waitForTimeout(300);
    out.lbCapAfterNext = await page.evaluate(() => document.getElementById('lb-cap').textContent);
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(300);
    out.lbCapAfterLeft = await page.evaluate(() => document.getElementById('lb-cap').textContent);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    out.lbClosed = await page.evaluate(() => document.getElementById('lightbox').hidden);

    // takeover focus trap: focus should cycle inside menu
    await click('#nav-btn');
    await page.waitForTimeout(800);
    const firstFocus = await page.evaluate(() => document.activeElement.className || document.activeElement.tagName);
    out.firstFocus = firstFocus;
    for (let i = 0; i < 6; i++) await page.keyboard.press('Tab');
    out.trappedFocus = await page.evaluate(() => {
        const el = document.activeElement;
        return el.closest('#takeover-nav') !== null;
    });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(800);
    out.focusRestored = await page.evaluate(() => document.activeElement.id || document.activeElement.className);

    // sort by price desc — verify order of cards with prices
    await page.selectOption('#sort', 'price-desc');
    await page.waitForTimeout(400);
    out.pricesDesc = await page.evaluate(() =>
        [...document.querySelectorAll('#cards .card')].map((c) => c.dataset.price)
    );
    await page.selectOption('#sort', 'featured');
    await page.waitForTimeout(400);

    // category filter
    await click('[data-filter="Apparel"]');
    await page.waitForTimeout(400);
    out.apparelCount = await page.evaluate(() => document.querySelectorAll('#cards .card').length);
    out.apparelCats = await page.evaluate(() => [...document.querySelectorAll('#cards .card')].map((c) => c.dataset.cat));
    await click('[data-filter="all"]');
    await page.waitForTimeout(400);

    // collection click filters products
    await click('[data-collection="Style Finds"]');
    await page.waitForTimeout(700);
    out.collFiltered = await page.evaluate(() => document.querySelectorAll('#cards .card').length);
    out.collScrollY = await page.evaluate(() => window.scrollY > 100);
    await page.evaluate(() => { document.getElementById('clear-filters')?.click(); });
    await page.waitForTimeout(400);

    // keyboard: skip link
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
    await page.keyboard.press('Tab');
    out.skipLinkFocused = await page.evaluate(() => document.activeElement.className.includes('skip-link'));

    return out;
}
