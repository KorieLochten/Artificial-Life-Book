const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
    testDir: './tests/browser',
    testMatch: '**/*.spec.js',
    fullyParallel: true,
    forbidOnly: Boolean(process.env.CI),
    retries: process.env.CI ? 1 : 0,
    workers: 2,
    timeout: 60_000,
    expect: { timeout: 10_000 },
    reporter: [['list'], ['html', { open: 'never' }]],
    outputDir: 'test-results',
    use: {
        baseURL: 'http://127.0.0.1:4173/Artificial-Life-Book/',
        browserName: 'chromium',
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },
    projects: [
        { name: 'desktop', use: { viewport: { width: 1280, height: 900 } } },
        { name: 'narrow', use: { viewport: { width: 375, height: 812 } } },
    ],
    webServer: {
        command: 'node scripts/serve-built-book.js',
        url: 'http://127.0.0.1:4173/Artificial-Life-Book/GameOfLife1.html',
        reuseExistingServer: false,
        timeout: 30_000,
    },
});
