const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawn, spawnSync } = require("node:child_process");

const repoRoot = path.resolve(__dirname, "..");
const mdbookVersion = "0.5.4";
const mdbookArchives = {
    "win32-x64": ["x86_64-pc-windows-msvc.zip", "8a6b2421aa522de06d746871d2b8fff9c8d71773467e310a4516d2566e7f2de4"],
    "linux-x64": ["x86_64-unknown-linux-gnu.tar.gz", "3f28de05dafca9d0f2eab99c662116b0e37b89b1d96a08f8f430b9eeae958cd7"],
    "linux-arm64": ["aarch64-unknown-linux-musl.tar.gz", "753e5c5c363ee8a56972344dcf91466f005a51db84a7aeffe427ae3ef83d6d44"],
    "darwin-x64": ["x86_64-apple-darwin.tar.gz", "a47d7bf0d5d670cff9ee6cce95537cbeb62dc10704d9e7131ffbd13e2b59a5de"],
    "darwin-arm64": ["aarch64-apple-darwin.tar.gz", "03e8a6d8b13a2971e0b3280affd03b388373c1485e26f73407c3a76b0b1838df"],
};

function run(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            cwd: repoRoot,
            stdio: "inherit",
            windowsHide: true,
            ...options,
        });
        child.once("error", reject);
        child.once("close", (code, signal) => {
            if (code === 0) resolve();
            else reject(new Error(`${path.basename(command)} ${args.join(" ")} failed (${signal || code}).`));
        });
    });
}

function isPinnedMdbook(executable) {
    const result = spawnSync(executable, ["--version"], {
        cwd: repoRoot, encoding: "utf8", windowsHide: true, timeout: 10000,
    });
    return result.status === 0 && result.stdout.trim() === `mdbook v${mdbookVersion}`;
}

async function ensureMdbook() {
    const filename = process.platform === "win32" ? "mdbook.exe" : "mdbook";
    for (const directory of (process.env.PATH || "").split(path.delimiter)) {
        if (!directory) continue;
        const candidate = path.resolve(directory.replace(/^"|"$/g, ""), filename);
        if (fs.existsSync(candidate) && isPinnedMdbook(candidate)) return candidate;
    }

    const platform = `${process.platform}-${process.arch}`;
    const release = mdbookArchives[platform];
    if (!release) throw new Error(`Install mdBook ${mdbookVersion} on PATH for ${platform}.`);
    const cache = path.join(repoRoot, ".tools", "mdbook", mdbookVersion, platform);
    const executable = path.join(cache, filename);
    if (fs.existsSync(executable) && isPinnedMdbook(executable)) return executable;

    const archiveName = `mdbook-v${mdbookVersion}-${release[0]}`;
    const url = `https://github.com/rust-lang/mdBook/releases/download/v${mdbookVersion}/${archiveName}`;
    console.log(`Downloading mdBook ${mdbookVersion} for ${platform}.`);
    const response = await fetch(url, { signal: AbortSignal.timeout(120000) });
    if (!response.ok) throw new Error(`mdBook download failed: HTTP ${response.status}.`);
    const archive = Buffer.from(await response.arrayBuffer());
    const digest = crypto.createHash("sha256").update(archive).digest("hex");
    if (digest !== release[1]) throw new Error("mdBook archive checksum does not match the pinned release.");

    fs.mkdirSync(cache, { recursive: true });
    const archivePath = path.join(cache, archiveName);
    fs.writeFileSync(archivePath, archive);
    try {
        await run("tar", ["-xf", archivePath, "-C", cache]);
    } finally {
        fs.rmSync(archivePath, { force: true });
    }
    if (!isPinnedMdbook(executable)) throw new Error("The downloaded mdBook executable did not report version 0.5.4.");
    return executable;
}

module.exports = { repoRoot, run, ensureMdbook };
