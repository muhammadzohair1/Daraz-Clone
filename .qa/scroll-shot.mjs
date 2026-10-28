export default async function run(page, ui) {
    await page.waitForTimeout(1200);
    await page.evaluate(async () => {
        const h = document.body.scrollHeight;
        for (let y = 0; y < h; y += 300) {
            window.scrollTo(0, y);
            await new Promise((r) => setTimeout(r, 60));
        }
    });
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'c:\\zohair\\.qa\\shot-full.png', fullPage: true });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.45));
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'c:\\zohair\\.qa\\shot-mid.png' });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    return 'done';
}
