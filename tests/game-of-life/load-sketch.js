const { readFileSync } = require("node:fs");
const path = require("node:path");
const { compileFunction } = require("node:vm");

module.exports = function loadSketch() {
    const sourcePath = path.join(__dirname, "../../book/src/sketches/game-of-life/sketch.js");
    const patterns = readFileSync(path.join(__dirname, "../../book/src/sketches/game-of-life/patterns.js"), "utf8");
    const sketch = readFileSync(sourcePath, "utf8");
    // Run the exact classic scripts, without calling their browser-only setup/draw callbacks.
    return compileFunction(patterns + "\n" + sketch +
        "\nreturn { Color, Cell, Grid, LIFE_PATTERNS };", [], { filename: sourcePath })();
};
