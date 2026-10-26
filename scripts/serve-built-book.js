const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { repoRoot } = require("./tooling");

const buildRoot = path.join(repoRoot, "dist");
const sitePrefix = "/Artificial-Life-Book";
const types = {
    ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8",
    ".txt": "text/plain; charset=utf-8", ".svg": "image/svg+xml",
    ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
    ".gif": "image/gif", ".ico": "image/x-icon", ".woff": "font/woff",
    ".woff2": "font/woff2", ".mp4": "video/mp4", ".webm": "video/webm",
};

function inside(directory, filename) {
    const relative = path.relative(directory, filename);
    return relative !== ".." && !relative.startsWith(".." + path.sep) && !path.isAbsolute(relative);
}

function startServer() {
    const args = process.argv.slice(2);
    if (args.length && (args.length !== 2 || args[0] !== "--port")) throw new Error("Usage: node scripts/serve-built-book.js [--port 4173]");
    const port = args.length ? Number(args[1]) : 4173;
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("The port must be an integer between 1 and 65535.");
    if (!fs.existsSync(buildRoot)) throw new Error("Build the book before serving dist: npm run book:build");
    const canonicalRoot = fs.realpathSync(buildRoot);

    const server = http.createServer((request, response) => {
        if (!["GET", "HEAD"].includes(request.method)) {
            response.writeHead(405, { Allow: "GET, HEAD" }).end();
            return;
        }
        let filename;
        let stat;
        try {
            let pathname = decodeURIComponent(new URL(request.url, "http://127.0.0.1").pathname);
            if (pathname === sitePrefix || pathname.startsWith(sitePrefix + "/")) pathname = pathname.slice(sitePrefix.length) || "/";
            filename = path.resolve(buildRoot, "." + pathname);
            if (!inside(buildRoot, filename)) { response.writeHead(403).end("Forbidden"); return; }
            stat = fs.statSync(filename);
            if (stat.isDirectory()) {
                filename = path.join(filename, "index.html");
                stat = fs.statSync(filename);
            }
            if (!stat.isFile() || !inside(canonicalRoot, fs.realpathSync(filename))) { response.writeHead(403).end("Forbidden"); return; }
        } catch (error) {
            const status = error instanceof URIError || error instanceof TypeError ? 400 : 404;
            response.writeHead(status).end(status === 400 ? "Bad request" : "Not found");
            return;
        }

        let start = 0;
        let end = stat.size - 1;
        let status = 200;
        const headers = {
            "Content-Type": types[path.extname(filename).toLowerCase()] || "application/octet-stream",
            "Cache-Control": "no-store", "Accept-Ranges": "bytes",
        };
        if (request.headers.range) {
            const match = /^bytes=(\d*)-(\d*)$/.exec(request.headers.range);
            if (match && (match[1] || match[2])) {
                start = match[1] ? Number(match[1]) : Math.max(0, stat.size - Number(match[2]));
                end = match[1] && match[2] ? Math.min(Number(match[2]), end) : end;
            }
            if (!match || (!match[1] && !match[2]) || !Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= stat.size) {
                response.writeHead(416, { "Content-Range": `bytes */${stat.size}` }).end();
                return;
            }
            status = 206;
            headers["Content-Range"] = `bytes ${start}-${end}/${stat.size}`;
        }
        headers["Content-Length"] = Math.max(0, end - start + 1);
        response.writeHead(status, headers);
        if (request.method === "HEAD" || stat.size === 0) { response.end(); return; }
        const stream = fs.createReadStream(filename, { start, end });
        stream.on("error", () => response.destroy());
        stream.pipe(response);
    });

    server.on("error", error => { console.error(error.message); process.exitCode = 1; });
    server.listen(port, "127.0.0.1", () => console.log(`Built book: http://127.0.0.1:${port}/ (also ${sitePrefix}/)`));
}

try { startServer(); } catch (error) { console.error(error.message); process.exitCode = 1; }
