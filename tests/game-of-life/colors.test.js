const test = require("node:test");
const assert = require("node:assert/strict");
const loadSketch = require("./load-sketch.js");
const { Grid, Color } = loadSketch();

const rgba = color => [color.r, color.g, color.b, color.a];
const nearColor = (actual, expected) => {
    rgba(actual).forEach((channel, i) => {
        assert.ok(Math.abs(channel - expected[i]) < 1e-10, channel + " != " + expected[i]);
    });
};

test("the original Color interpolates RGBA without changing either input", () => {
    const start = new Color(20, 40, 60, 0.2);
    const end = new Color(100, 120, 140, 1);
    nearColor(Color.lerpColors(start, end, 0.25), [40, 60, 80, 0.4]);
    assert.deepEqual(rgba(start), [20, 40, 60, 0.2]);
    assert.deepEqual(rgba(end), [100, 120, 140, 1]);
    const copy = start.copy();
    assert.notEqual(copy, start);
    copy.r = 0;
    assert.equal(start.r, 20);
});

test("original random colors live on each cell with RGB 0..254 and the original alpha values", () => {
    const grid = new Grid(2, 1, { random: () => 0.999999 });
    assert.deepEqual(rgba(grid.cells[0].staticColor), [254, 254, 254, 1]);
    assert.deepEqual(rgba(grid.cells[0].aliveColor), [254, 254, 254, 0.875]);
    assert.deepEqual(rgba(grid.highlightColor), [254, 254, 254, 0.875]);
});

test("births share the current cell's colors rather than receiving per-cell rainbow hues", () => {
    const grid = new Grid(4, 1, { useColor: true, random: () => 0.5 });
    grid.cells[0].aliveColor = new Color(200, 100, 50, 0.875);
    grid.cells[3].aliveColor = new Color(5, 6, 7, 0.875);
    grid.seed([[0, 0], [3, 0]]).updateColors();
    assert.deepEqual(rgba(grid.cells[0].color), [200, 100, 50, 0.875]);
    assert.deepEqual(rgba(grid.cells[3].color), [200, 100, 50, 0.875]);
});

test("dead, newborn, and surviving cells retain the original smoothing factors", () => {
    const grid = new Grid(3, 1, { useColor: true, useAlpha: true, random: () => 0.5 });
    grid.cells[0].aliveColor = new Color(200, 100, 50, 0.875);
    grid.cells[0].staticColor = new Color(100, 200, 150, 1);
    grid.seed([[0, 0], [1, 0]]).reset();
    grid.seed([[1, 0], [2, 0]]).updateColors();
    nearColor(grid.cells[0].color, [168.75, 84.375, 42.1875, 0.73828125]);
    nearColor(grid.cells[1].color, [175, 125, 75, 0.90625]);
    nearColor(grid.cells[2].color, [100, 50, 25, 0.4375]);
    assert.deepEqual(grid.cells.map(cell => cell.prevState), [0, 1, 1]);
});

test("monochrome fades toward white at 0.1 and transparent black at 0.15625", () => {
    const grid = new Grid(2, 1, { useAlpha: true });
    grid.seed([[0, 0]]).updateColors();
    nearColor(grid.cells[0].color, [25.5, 25.5, 25.5, 0.1]);
    grid.clear().updateColors();
    nearColor(grid.cells[0].color, [21.515625, 21.515625, 21.515625, 0.084375]);
    grid.useAlpha = false;
    grid.updateColors();
    assert.deepEqual(rgba(grid.cells[0].color), [0, 0, 0, 0]);
});

test("randomization advances the shared color source without discarding display colors or time", () => {
    const grid = new Grid(2, 1, { useColor: true, useAlpha: true, random: () => 0.5 });
    grid.seed([[0, 0]]).reset();
    grid.generation = 7;
    const firstColor = grid.cells[0].color;
    grid.randomize(() => 0.9);
    assert.equal(grid.colorIndex, 1);
    assert.equal(grid.cells[0].color, firstColor);
    assert.equal(grid.cells[0].prevState, 1);
    assert.equal(grid.generation, 7);
    grid.updateColors();
    nearColor(grid.cells[0].color, [127 * 0.84375, 127 * 0.84375, 127 * 0.84375, 0.875 * 0.84375]);
    grid.randomize(() => 0.9);
    assert.equal(grid.colorIndex, 0);
});

test("manual editing uses a cell's own alive color and updates its previous state", () => {
    const grid = new Grid(2, 1, { useColor: true, random: () => 0.5 });
    grid.cells[1].aliveColor = new Color(20, 30, 40, 0.875);
    assert.equal(grid.setState(1, 0, 1), true);
    assert.deepEqual(rgba(grid.cells[1].color), [20, 30, 40, 0.875]);
    assert.equal(grid.cells[1].prevState, 1);
    grid.toggle(1, 0);
    assert.deepEqual(rgba(grid.cells[1].color), [0, 0, 0, 0]);
    grid.useColor = false;
    grid.setState(1, 0, 1);
    assert.deepEqual(rgba(grid.cells[1].color), [255, 255, 255, 1]);
});

test("border highlight walks only the outer perimeter and chooses a new color after one lap", () => {
    let random = 0.2;
    const grid = new Grid(2, 1, { useAlpha: true, random: () => random });
    assert.deepEqual(grid.borderSegments, [
        [0, 0, 0, 1], [0, 1, 1, 1], [1, 1, 2, 1],
        [2, 1, 2, 0], [2, 0, 1, 0], [1, 0, 0, 0],
    ]);
    const unchanged = grid.borderColors[1];
    grid.updateBorder();
    nearColor(grid.borderColors[0], [223.125, 223.125, 223.125, 0.55859375]);
    assert.equal(grid.borderColors[1], unchanged);
    random = 0.8;
    grid.useAlpha = false;
    for (let i = 1; i < grid.borderSegments.length; i++) grid.updateBorder();
    assert.equal(grid.borderIndex, 0);
    assert.deepEqual(rgba(grid.highlightColor), [204, 204, 204, 0.875]);
    grid.useBorders = false;
    grid.updateBorder();
    assert.equal(grid.borderIndex, 0);
});

test("independent grids own their cell colors, shared color source, and border animation", () => {
    const left = new Grid(2, 1, { useColor: true, random: () => 0.2 }).seed([[0, 0]]).reset();
    const right = new Grid(2, 1, { useColor: true, random: () => 0.8 }).seed([[0, 0]]).reset();
    const rightBefore = rgba(right.cells[0].color);
    left.randomize(() => 0.9).updateColors().updateBorder();
    assert.deepEqual(rgba(right.cells[0].color), rightBefore);
    assert.equal(right.colorIndex, 0);
    assert.equal(right.borderIndex, 0);
});
