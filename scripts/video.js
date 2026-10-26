const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawnSync } = require("node:child_process");

const repoRoot = path.resolve(__dirname, "..");
const animationRoot = path.join(repoRoot, "animations");
const uvVersion = "0.13.5";
const targets = {
    "win32-x64": {
        archive: "uv-x86_64-pc-windows-msvc.zip",
        sha256: "a38b8d1902b7cfbc76b423ba1bb456f623f42064cdc72628b6075b89afd1019a",
    },
    "linux-x64": {
        archive: "uv-x86_64-unknown-linux-gnu.tar.gz",
        sha256: "f68d291c75783122dad58ab77def0e13f3233f358731db5d6d7e8715603b928f",
    },
};

function run(command, args, options = {}) {
    const result = spawnSync(command, args, { stdio: "inherit", windowsHide: true, ...options });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(path.basename(command) + " exited with code " + result.status);
}

function uvEnvironment() {
    return {
        ...process.env,
        UV_PYTHON_INSTALL_DIR: path.join(repoRoot, ".tools", "python"),
        UV_PYTHON_BIN_DIR: path.join(repoRoot, ".tools", "python-bin"),
        UV_CACHE_DIR: path.join(repoRoot, ".cache", "uv"),
        UV_PROJECT_ENVIRONMENT: path.join(animationRoot, ".venv"),
        UV_PYTHON_PREFERENCE: "only-managed",
        UV_NO_MODIFY_PATH: "1",
    };
}

async function download(url) {
    const response = await fetch(url, {
        headers: { "User-Agent": "Artificial-Life-Book" },
        signal: AbortSignal.timeout(120000),
    });
    if (!response.ok) throw new Error("Download failed (" + response.status + "): " + url);
    return Buffer.from(await response.arrayBuffer());
}

function findExecutable(directory, name) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const candidate = path.join(directory, entry.name);
        if (entry.isFile() && entry.name === name) return candidate;
        if (entry.isDirectory()) {
            const found = findExecutable(candidate, name);
            if (found) return found;
        }
    }
}

async function ensureUv() {
    const key = process.platform + "-" + process.arch;
    const target = targets[key];
    if (!target) throw new Error("Video setup currently supports Windows x64 and Linux x64.");
    const tools = path.join(repoRoot, ".tools", "uv", uvVersion, key);
    const executableName = process.platform === "win32" ? "uv.exe" : "uv";
    const executable = path.join(tools, executableName);
    if (!fs.existsSync(executable)) {
        fs.mkdirSync(tools, { recursive: true });
        const url = "https://github.com/astral-sh/uv/releases/download/" + uvVersion + "/" + target.archive;
        console.log("Downloading uv " + uvVersion + " for " + key + "...");
        const archive = await download(url);
        const checksum = crypto.createHash("sha256").update(archive).digest("hex");
        if (checksum !== target.sha256) throw new Error("The uv archive failed its pinned SHA-256 check.");
        const archivePath = path.join(tools, target.archive);
        fs.writeFileSync(archivePath, archive);
        const staging = fs.mkdtempSync(path.join(tools, "unpack-"));
        if (process.platform === "win32") {
            const quote = value => "'" + value.replaceAll("'", "''") + "'";
            run("powershell.exe", ["-NoProfile", "-Command",
                "Expand-Archive -LiteralPath " + quote(archivePath) + " -DestinationPath " + quote(staging)]);
        } else {
            run("tar", ["-xzf", archivePath, "-C", staging]);
        }
        const unpacked = findExecutable(staging, executableName);
        if (!unpacked) throw new Error("The uv archive did not contain " + executableName);
        fs.copyFileSync(unpacked, executable);
        if (process.platform !== "win32") fs.chmodSync(executable, 0o755);
    }
    const check = spawnSync(executable, ["--version"], { encoding: "utf8" });
    if (check.error) throw check.error;
    if (check.status !== 0 || !check.stdout.startsWith("uv " + uvVersion + " ")) {
        throw new Error("The cached uv executable is not the pinned version " + uvVersion);
    }
    return executable;
}

function findOutputs(directory, filename, output = []) {
    if (!fs.existsSync(directory)) return output;
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const candidate = path.join(directory, entry.name);
        if (entry.isDirectory() && entry.name !== "partial_movie_files") findOutputs(candidate, filename, output);
        else if (entry.isFile() && entry.name === filename) output.push(candidate);
    }
    return output;
}

async function main() {
    const [mode, file = "game_of_life.py", scene = "NeighborhoodDiagram", ...extra] = process.argv.slice(2);
    if (!["setup", "preview", "render"].includes(mode) || extra.length) {
        throw new Error("Usage: node scripts/video.js setup|preview|render [file.py] [SceneName]");
    }
    const uv = await ensureUv();
    const options = { cwd: animationRoot, env: uvEnvironment() };
    if (!fs.existsSync(path.join(animationRoot, "uv.lock"))) {
        throw new Error("animations/uv.lock is missing. Resolve and commit the authoring dependencies before setup.");
    }
    if (mode === "setup") {
        run(uv, ["sync", "--locked"], options);
        run(uv, ["run", "--locked", "python", "-c",
            "import sys, manim; print('Python ' + sys.version.split()[0]); print('Manim Community ' + manim.__version__)"], options);
        return;
    }
    const sceneFile = path.resolve(animationRoot, file);
    if (!fs.existsSync(sceneFile)) throw new Error("Scene source does not exist: " + sceneFile);
    const media = path.join(repoRoot, ".cache", "manim", mode === "preview" ? "preview" : "release");
    const quality = mode === "preview" ? ["-ql"] : ["-r", "1920,1080", "--fps", "30"];
    const common = ["run", "--locked", "manim", "render", "--renderer", "cairo",
        "--seed", "42", "--media_dir", media, ...quality, "-o", scene];
    run(uv, [...common, "--format", "mp4", "--video-codec", "libx264",
        "--pixel-format", "yuv420p", sceneFile, scene], options);
    // A second, fast pass saves the final frame; -s alone would replace the MP4 render.
    run(uv, [...common, "--format", "png", "-s", sceneFile, scene], options);
    for (const output of [...findOutputs(media, scene + ".mp4"), ...findOutputs(media, scene + ".png")]) {
        console.log("Rendered: " + path.relative(repoRoot, output));
    }
}

if (require.main === module) {
    main().catch(error => {
        console.error(error.message);
        process.exitCode = 1;
    });
}

module.exports = { ensureUv, uvEnvironment };
