const { test: base, expect } = require('@playwright/test');

const origin = 'http://127.0.0.1:4173';
const test = base.extend({
    applicationErrors: [async ({ page }, use) => {
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('console', message => {
            if (message.type() === 'error' && message.location().url.startsWith(origin)) {
                errors.push(message.text());
            }
        });
        page.on('response', response => {
            if (response.url().startsWith(origin) && response.status() >= 400) {
                errors.push(`${response.status()} ${response.url()}`);
            }
        });
        await use(errors);
        expect(errors, 'book scripts and local assets should load without errors').toEqual([]);
    }, { auto: true }],
});

function generation(text) {
    return Number(text.match(/Generation (\d+)/)[1]);
}

async function openChapter(page, filename) {
    // The old MathJax CDN script is asynchronous and is not needed by these sketches.
    // Wait for the chapter DOM and local fonts, rather than its external load event.
    await page.goto(filename, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('main h1')).toBeVisible();
    await page.evaluate(() => document.fonts.ready.then(() => true));
}

async function cellAlpha(canvas, column, row) {
    return canvas.evaluate((element, position) => {
        const size = element.width / 12;
        return element.getContext('2d').getImageData(
            Math.floor((position.column + 0.5) * size),
            Math.floor((position.row + 0.5) * size), 1, 1
        ).data[3];
    }, { column, row });
}

async function setTheme(page, name) {
    const toggle = page.getByRole('button', { name: 'Change theme' });
    if (await toggle.getAttribute('aria-expanded') !== 'true') await toggle.click();
    await page.getByRole('menuitem', { name, exact: true }).click();
    if (await toggle.getAttribute('aria-expanded') === 'true') await toggle.click();
}

test('lesson controls and keyboard shortcuts operate the displayed grid', async ({ page }) => {
    // A known random input makes the Randomize button's result testable.
    await page.addInitScript(() => { Math.random = () => 0.1; });
    await openChapter(page, 'GameOfLife1.html');
    const lesson = page.frameLocator('#life-grid-lesson');
    const status = lesson.locator('.life-status');
    await expect(status).toHaveText('Generation 0 · 3 living cells · Paused');
    await lesson.getByRole('button', { name: 'Step', exact: true }).click();
    await expect(status).toHaveText('Generation 1 · 3 living cells · Paused');
    await lesson.getByRole('button', { name: 'Clear', exact: true }).click();
    await expect(status).toHaveText('Generation 1 · 0 living cells · Paused');
    await lesson.getByRole('button', { name: 'Reset', exact: true }).click();
    await expect(status).toHaveText('Generation 0 · 3 living cells · Paused');
    await lesson.getByRole('button', { name: 'Randomize', exact: true }).click();
    await expect(status).toHaveText('Generation 0 · 96 living cells · Paused');
    await lesson.getByRole('slider', { name: 'Simulation speed' }).press('End');
    await expect(lesson.getByText('30 generations/s', { exact: true })).toBeVisible();
    await lesson.getByRole('checkbox', { name: 'Color', exact: true }).check();
    await lesson.getByRole('checkbox', { name: 'Smooth colors', exact: true }).check();
    await lesson.getByRole('button', { name: 'Play', exact: true }).click();
    await expect(status).toContainText('Running');
    await expect.poll(async () => generation(await status.innerText())).toBeGreaterThan(0);
    await lesson.getByRole('button', { name: 'Pause', exact: true }).click();
    await expect(status).toContainText('Paused');
    const stopped = generation(await status.innerText());
    const canvas = lesson.locator('canvas');
    await canvas.press('n');
    await expect(status).toContainText(`Generation ${stopped + 1} ·`);
    await canvas.press('c');
    await canvas.press('a');
    await expect(lesson.getByRole('checkbox', { name: 'Color', exact: true })).not.toBeChecked();
    await expect(lesson.getByRole('checkbox', { name: 'Smooth colors', exact: true })).not.toBeChecked();
    await canvas.press('v');
    await expect(status).toContainText('0 living cells · Paused');
    await canvas.press('r');
    await expect(status).toContainText('96 living cells · Paused');
    await canvas.press('p');
    await expect(status).toContainText('Running');
    await canvas.press('p');
    await expect(status).toContainText('Paused');
});

test('every gallery frame loads its pattern and owns independent state', async ({ page }) => {
    await openChapter(page, 'GameOfLife2.html');
    const expected = {
        block: 4, beehive: 6, loaf: 7, boat: 5, tub: 4,
        toad: 6, beacon: 6, pulsar: 72, pentadecathlon: 20,
        glidergun: 36, blinker: 3, glider: 5,
        lightweightspaceship: 9, middleweightspaceship: 11, heavyweightspaceship: 13,
    };
    await expect(page.locator('iframe.life-example')).toHaveCount(16);
    const main = page.frameLocator('#gof');
    await main.getByRole('button', { name: 'Pause', exact: true }).click();
    const mainStatus = await main.locator('.life-status').innerText();
    for (const [id, count] of Object.entries(expected)) {
        await page.locator(`#${id}`).scrollIntoViewIfNeeded();
        const pattern = page.frameLocator(`#${id}`);
        await expect(pattern.locator('canvas')).toBeVisible();
        await pattern.getByRole('button', { name: 'Reset', exact: true }).click();
        await expect(pattern.locator('.life-status')).toHaveText(`Generation 0 · ${count} living cells · Paused`);
    }
    const block = page.frameLocator('#block');
    await block.getByRole('button', { name: 'Step', exact: true }).click();
    await block.getByRole('button', { name: 'Clear', exact: true }).click();
    await expect(block.locator('.life-status')).toHaveText('Generation 1 · 0 living cells · Paused');
    await expect(page.frameLocator('#beehive').locator('.life-status')).toHaveText('Generation 0 · 6 living cells · Paused');
    await expect(main.locator('.life-status')).toHaveText(mainStatus);
});

test('chapters, videos, executable excerpts, and themes work beneath the Pages prefix', async ({ page }) => {
    await openChapter(page, 'GameOfLife0.html');
    await expect(page.getByRole('heading', { name: "Conway's Game of Life", exact: true })).toBeVisible();
    await expect(page.locator('video')).toHaveCount(2);
    for (const video of await page.locator('video').all()) {
        await expect.poll(() => video.evaluate(element => element.readyState)).toBeGreaterThanOrEqual(1);
        expect(await video.evaluate(element => element.currentSrc)).toContain('/Artificial-Life-Book/media/game-of-life/');
    }
    await page.getByRole('link', { name: 'programming', exact: true }).click();
    await expect(page).toHaveURL(/\/Artificial-Life-Book\/GameOfLife1\.html$/);
    await expect(page.locator('pre code').filter({ hasText: 'function setup()' }).first()).toBeVisible();
    const code = (await page.locator('pre code').allTextContents()).join('\n');
    expect(code).toContain('function setup()');
    expect(code).toContain('function draw()');
    expect(code).not.toContain('{{#include');
    const lesson = page.frameLocator('#life-grid-lesson');
    await expect(lesson.locator('canvas')).toBeVisible();
    await setTheme(page, 'Light');
    const foreground = await page.locator('html').evaluate(element => getComputedStyle(element).getPropertyValue('--fg'));
    await expect.poll(() => lesson.locator('html').evaluate(element => getComputedStyle(element).getPropertyValue('--fg'))).toBe(foreground);
    expect(await lesson.locator('body').evaluate(element => getComputedStyle(element).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
    await setTheme(page, 'Auto');
    await page.getByRole('link', { name: 'Next chapter', exact: true }).click();
    await expect(page).toHaveURL(/\/Artificial-Life-Book\/GameOfLife2\.html$/);
    await expect(page.locator('iframe.life-example')).toHaveCount(16);
});

test('cell selection and drag editing follow canvas resizing', async ({ page }) => {
    await openChapter(page, 'GameOfLife1.html');
    const lesson = page.frameLocator('#life-grid-lesson');
    const canvas = lesson.locator('canvas');
    const status = lesson.locator('.life-status');
    await expect(status).toContainText('3 living cells · Paused');
    await page.setViewportSize({ width: 375, height: 812 });
    // mdBook retains an open desktop contents panel when the viewport shrinks.
    // Close it as a reader would before interacting with the narrow chapter.
    const contents = page.locator('#mdbook-sidebar-toggle');
    if (await contents.getAttribute('aria-expanded') === 'true') await contents.click();
    await expect(contents).toHaveAttribute('aria-expanded', 'false');
    await expect(canvas).toHaveAttribute('width', '120');
    await expect(canvas).toHaveCSS('width', '120px');
    await expect(canvas).toHaveCSS('height', '80px');
    expect(await lesson.locator('body').evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    await canvas.scrollIntoViewIfNeeded();
    let box = await canvas.boundingBox();
    await canvas.click({ position: { x: 55, y: 35 } });
    await expect(status).toContainText('2 living cells · Paused');
    expect(await cellAlpha(canvas, 5, 3)).toBe(0);
    await lesson.getByRole('button', { name: 'Clear', exact: true }).click();
    await canvas.scrollIntoViewIfNeeded();
    box = await canvas.boundingBox();
    const y = box.y + box.height * 3.5 / 8;
    await canvas.hover({ position: { x: box.width * 5.5 / 12, y: box.height * 3.5 / 8 } });
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 6.5 / 12, y);
    await page.mouse.move(box.x + box.width * 7.5 / 12, y);
    await page.mouse.up();
    await expect(status).toContainText('3 living cells · Paused');
    await lesson.getByRole('button', { name: 'Step', exact: true }).click();
    await expect(status).toHaveText('Generation 1 · 3 living cells · Paused');
    for (const row of [2, 3, 4]) expect(await cellAlpha(canvas, 6, row)).toBe(255);
    expect(await cellAlpha(canvas, 5, 3)).toBe(0);
    expect(await cellAlpha(canvas, 7, 3)).toBe(0);
    await page.setViewportSize({ width: 960, height: 900 });
    await expect(canvas).toHaveAttribute('width', '240');
    await expect(canvas).toHaveCSS('width', '240px');
    await canvas.scrollIntoViewIfNeeded();
    box = await canvas.boundingBox();
    await canvas.click({ position: { x: 130, y: 50 } });
    await expect(status).toContainText('2 living cells · Paused');
});
