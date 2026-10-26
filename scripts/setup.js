const path = require("node:path");
const { repoRoot, run, ensureMdbook } = require("./tooling");

async function setup() {
    const options = process.argv.slice(2);
    if (options.some(option => option !== "--with-deps")) {
        throw new Error("Usage: node scripts/setup.js [--with-deps]");
    }
    const mdbook = await ensureMdbook();
    console.log(`Using ${mdbook}`);
    let playwright;
    try {
        playwright = require.resolve("@playwright/test/cli", { paths: [repoRoot] });
    } catch {
        throw new Error("Run npm ci before setup to install the locked browser-test dependency.");
    }
    await run(process.execPath, [playwright, "install", ...options, "chromium"]);
    console.log("Book and Chromium tools are ready.");
}

setup().catch(error => { console.error(error.message); process.exitCode = 1; });
