const path = require("node:path");
const { repoRoot, run } = require("./tooling");

async function check() {
    console.log("Checking JavaScript rules and colors.");
    await run(process.execPath, ["--test", "tests/**/*.test.js"]);
    console.log("Building the book.");
    await run(process.execPath, [path.join(__dirname, "book.js"), "build"]);
    console.log("Checking local book assets and includes.");
    await run(process.execPath, [path.join(__dirname, "check-book.js")]);
    let playwright;
    try {
        playwright = require.resolve("@playwright/test/cli", { paths: [repoRoot] });
    } catch {
        throw new Error("Run npm ci and npm run setup before browser checks.");
    }
    console.log("Checking the book in Chromium.");
    await run(process.execPath, [playwright, "test"]);
}

check().catch(error => { console.error(error.message); process.exitCode = 1; });
