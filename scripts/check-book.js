const fs = require("node:fs");
const path = require("node:path");
const { repoRoot } = require("./tooling");

const sourceRoot = path.join(repoRoot, "book", "src");
const buildRoot = path.join(repoRoot, "dist");
const sitePath = "/Artificial-Life-Book/";
const errors = [];
let checkedLinks = 0;

function files(directory) {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        const filename = path.join(directory, entry.name);
        return entry.isDirectory() ? files(filename) : [filename];
    });
}

function inside(directory, filename) {
    const relative = path.relative(directory, filename);
    return relative !== ".." && !relative.startsWith(".." + path.sep) && !path.isAbsolute(relative);
}

function requireFile(filename, description) {
    try {
        if (!fs.statSync(filename).isFile()) throw new Error("not a file");
        return true;
    } catch {
        errors.push(`${description}: missing ${path.relative(repoRoot, filename)}`);
        return false;
    }
}

function checkReference(from, reference) {
    reference = reference.trim().replaceAll("&amp;", "&");
    if (!reference || reference.startsWith("#") || reference.startsWith("//") || /^[a-z][a-z\d+.-]*:/i.test(reference)) return;
    checkedLinks++;
    try {
        const page = path.relative(buildRoot, from).split(path.sep).join("/");
        const url = new URL(reference, `https://book.invalid${sitePath}${page}`);
        const pathname = decodeURIComponent(url.pathname);
        if (!pathname.startsWith(sitePath)) throw new Error("URL leaves the book's project path");
        let target = path.resolve(buildRoot, pathname.slice(sitePath.length));
        if (!inside(buildRoot, target)) throw new Error("path leaves dist");
        if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, "index.html");
        if (!requireFile(target, `${page} -> ${reference}`)) return;
        if (!inside(fs.realpathSync(buildRoot), fs.realpathSync(target))) throw new Error("symlink leaves dist");
    } catch (error) {
        errors.push(`${path.relative(buildRoot, from)} -> ${reference}: ${error.message}`);
    }
}

function checkIncludes(filename, text) {
    for (const match of text.matchAll(/\{\{#include\s+([^\s}]+)\s*\}\}/g)) {
        const parts = match[1].split(":");
        const target = path.resolve(path.dirname(filename), parts.shift());
        if (!inside(repoRoot, target)) {
            errors.push(`${path.relative(repoRoot, filename)}: include leaves the repository`);
            continue;
        }
        if (!requireFile(target, `${path.relative(repoRoot, filename)} include`)) continue;
        const anchor = parts[0];
        if (anchor && !/^\d*$/.test(anchor)) {
            const content = fs.readFileSync(target, "utf8");
            if (!content.includes(`ANCHOR: ${anchor}`) || !content.includes(`ANCHOR_END: ${anchor}`)) {
                errors.push(`${path.relative(repoRoot, target)}: missing include anchor ${anchor}`);
            }
        }
    }
}

function checkBook() {
    if (!fs.existsSync(buildRoot)) throw new Error("Build the book before checking dist: npm run book:build");
    for (const chapter of ["index", "intro", "GameOfLife0", "GameOfLife1", "GameOfLife2", "ElementaryCellularAutomata0", "ElementaryCellularAutomata1", "ElementaryCellularAutomata2"]) {
        requireFile(path.join(buildRoot, chapter + ".html"), "Expected chapter output");
    }

    const summary = fs.readFileSync(path.join(sourceRoot, "SUMMARY.md"), "utf8");
    for (const match of summary.matchAll(/\]\(([^)#]+\.md)(?:#[^)]*)?\)/g)) {
        requireFile(path.resolve(buildRoot, match[1].replace(/\.md$/, ".html")), "Table of contents output");
    }

    for (const filename of files(sourceRoot)) {
        const relative = path.relative(sourceRoot, filename);
        if (relative.split(path.sep).some(part => part.startsWith("."))) continue;
        if (filename.endsWith(".md")) checkIncludes(filename, fs.readFileSync(filename, "utf8"));
        else requireFile(path.join(buildRoot, relative), "Copied source asset");
    }

    for (const filename of files(buildRoot)) {
        if (filename.endsWith(".html")) {
            const html = fs.readFileSync(filename, "utf8");
            if (html.includes("{{#include")) errors.push(`${path.relative(buildRoot, filename)} has an unexpanded source include`);
            for (const match of html.matchAll(/\b(?:src|href|poster)\s*=\s*["']([^"']+)["']/gi)) checkReference(filename, match[1]);
        } else if (filename.endsWith(".css")) {
            const css = fs.readFileSync(filename, "utf8");
            for (const match of css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) checkReference(filename, match[1]);
        }
    }

    if (errors.length) throw new Error("Book asset check failed:\n" + errors.map(error => "- " + error).join("\n"));
    console.log(`Book assets and source includes are valid (${checkedLinks} local links checked).`);
}

try { checkBook(); } catch (error) { console.error(error.message); process.exitCode = 1; }
