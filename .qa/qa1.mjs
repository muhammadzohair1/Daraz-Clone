/* Stores — QA script #1: load + interactions + images */
export default async function run(page, ui) {
    const out = {};
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(1200);

    // scroll to trigger reveals + lazy images
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let y = 0;
            const step = () => {
                y += 400;
                window.scrollTo(0, y);
                if (y < document.body.scrollHeight) setTimeout(step, 60);
                else resolve();
            };
            step();
        });
    });
    await page.waitForTimeout(1200);

    out.errors = await page.evaluate(() => window.__qaErrors || []);
    out.brokenImages = await page.evaluate(() =>
        [...document.images].filter((img) => img.complete && img.naturalWidth === 0 && img.src).map((img) => img.src.split('/').pop())
    );
    out.cardCount = await page.evaluate(() => document.querySelectorAll('#cards .card').length);
    out.galleryCount = await page.evaluate(() => document.querySelectorAll('.gallery-item').length);
    out.collectionCount = await page.evaluate(() => document.querySelectorAll('#collection-grid .collection-card').length);
    out.wishlistCount = await page.evaluate(() => document.querySelector('[data-wishlist-count]').textContent);
    out.revealsTotal = await page.evaluate(() => document.querySelectorAll('.reveal').length);
    out.revealsIn = await page.evaluate(() => document.querySelectorAll('.reveal.in').length);

    // quick view
    await page.evaluate(() => document.querySelector('[data-quick="gripper"]')?.click());
    await page.waitForTimeout(400);
    out.modalOpen = await page.evaluate(() => !document.getElementById('product-modal').hidden);
    out.modalTitle = await page.evaluate(() => document.getElementById('qm-title').textContent);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    out.modalClosed = await page.evaluate(() => document.getElementById('product-modal').hidden);
    return out;
}
