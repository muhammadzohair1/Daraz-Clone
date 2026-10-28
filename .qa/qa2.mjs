/* Stores — QA script #2: wishlist / compare / search overlay / filter drawer / mobile */
export default async function run(page, ui) {
    const out = {};
    const click = (sel) => page.evaluate((s) => document.querySelector(s)?.click(), sel);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForTimeout(1200);

    // wishlist
    await click('[data-wishlist="gripper"]');
    await click('[data-wishlist="mask"]');
    await page.waitForTimeout(300);
    out.wlCount = await page.evaluate(() => document.querySelector('[data-wishlist-count]').textContent);
    out.wlPersisted = await page.evaluate(() => localStorage.getItem('stores_wishlist'));
    await click('#wishlist-btn');
    await page.waitForTimeout(500);
    out.wlOpen = await page.evaluate(() => !document.getElementById('wishlist-panel').hidden);
    out.wlItems = await page.evaluate(() => document.querySelectorAll('.wishlist-item').length);
    // remove one from panel
    await click('[data-remove-item="mask"]');
    await page.waitForTimeout(300);
    out.wlItemsAfterRemove = await page.evaluate(() => document.querySelectorAll('.wishlist-item').length);
    // clear wishlist via confirm dialog
    await click('[data-clear-wishlist]');
    await page.waitForTimeout(400);
    out.confirmOpen = await page.evaluate(() => !document.getElementById('confirm-dialog').hidden);
    await click('#confirm-yes');
    await page.waitForTimeout(300);
    out.wlAfterClear = await page.evaluate(() => document.querySelector('[data-wishlist-count]').textContent);
    // panel should have closed
    out.wlPanelAfterClear = await page.evaluate(() => document.getElementById('wishlist-panel').hidden);

    // compare limit
    await click('[data-compare="gripper"]');
    await click('[data-compare="jacket"]');
    await click('[data-compare="mask"]');
    await click('[data-compare="tees"]'); // 4th — should be rejected
    await page.waitForTimeout(300);
    out.compareChips = await page.evaluate(() => document.querySelectorAll('.compare-chip').length);
    out.compareBarVisible = await page.evaluate(() => !document.getElementById('compare-bar').hidden);
    await click('[data-open-compare]');
    await page.waitForTimeout(500);
    out.compareOpen = await page.evaluate(() => !document.getElementById('compare-modal').hidden);
    out.compareRows = await page.evaluate(() => document.querySelectorAll('.compare-table tr').length);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    out.compareClosed = await page.evaluate(() => document.getElementById('compare-modal').hidden);
    await click('[data-compare-clear]');
    await page.waitForTimeout(300);
    out.compareCleared = await page.evaluate(() => document.getElementById('compare-bar').hidden);

    // search overlay Ctrl+K
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(400);
    out.searchOpen = await page.evaluate(() => !document.getElementById('search-overlay').hidden);
    await page.fill('#search-overlay-input', 'mask');
    await page.waitForTimeout(600);
    out.searchResults = await page.evaluate(() => document.querySelectorAll('.search-result').length);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(600);
    out.searchSelect = await page.evaluate(() => document.getElementById('search').value);
    out.gridAfterSearchSelect = await page.evaluate(() => document.querySelectorAll('#cards .card').length);
    // Escape closes overlay
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    out.searchClosed = await page.evaluate(() => document.getElementById('search-overlay').hidden);
    // clear grid search
    await page.evaluate(() => { document.getElementById('search-clear').click(); });
    await page.waitForTimeout(300);
    out.gridAfterClear = await page.evaluate(() => document.querySelectorAll('#cards .card').length);

    // mobile
    await page.setViewportSize({ width: 375, height: 812 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(700);
    out.menuBtnVisible = await page.evaluate(() => {
        const b = document.getElementById('nav-btn');
        return getComputedStyle(b).display !== 'none';
    });
    await click('#nav-btn');
    await page.waitForTimeout(900);
    out.takeoverOpen = await page.evaluate(() => document.getElementById('takeover-nav').classList.contains('open'));
    await page.keyboard.press('Escape');
    await page.waitForTimeout(900);
    out.takeoverClosed = await page.evaluate(() => !document.getElementById('takeover-nav').classList.contains('open'));
    await page.evaluate(() => { document.getElementById('filter-toggle').click(); });
    await page.waitForTimeout(600);
    out.drawerOpen = await page.evaluate(() => document.getElementById('filter-drawer').classList.contains('open'));
    await page.keyboard.press('Escape');
    await page.waitForTimeout(600);
    out.drawerClosed = await page.evaluate(() => document.getElementById('filter-drawer').hidden);

    // list view
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(400);
    await click('#view-list');
    await page.waitForTimeout(300);
    out.listView = await page.evaluate(() => document.querySelectorAll('#cards .card.list-item').length);
    await click('#view-grid');
    await page.waitForTimeout(300);
    return out;
}
