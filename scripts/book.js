const path = require("node:path");
const { repoRoot, run, ensureMdbook } = require("./tooling");

async function book() {
    const command = process.argv[2] || "build";
    if (!["build", "serve", "dev"].includes(command) || process.argv.length > 3) {
        throw new Error("Usage: node scripts/book.js build|serve|dev");
    }
    const mdbook = await ensureMdbook();
    const args = [command === "build" ? "build" : "serve", path.join(repoRoot, "book")];
    if (command !== "build") args.push("--hostname", "127.0.0.1", "--port", "3031");
    await run(mdbook, args);
}

book().catch(error => { console.error(error.message); process.exitCode = 1; });
