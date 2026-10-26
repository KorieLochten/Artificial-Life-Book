const test = require("node:test");
const assert = require("node:assert/strict");
const loadSketch = require("./load-sketch.js");
const { Grid, LIFE_PATTERNS } = loadSketch();

const sorted = coordinates => coordinates.map(([x, y]) => x + "," + y).sort();

test("cells have unique row-major ids and coordinates", () => {
    const grid = new Grid(3, 2);
    assert.deepEqual(grid.cells.map(cell => [cell.id, cell.position]), [
        [0, [0, 0]], [1, [1, 0]], [2, [2, 0]],
        [3, [0, 1]], [4, [1, 1]], [5, [2, 1]],
    ]);
    assert.throws(() => new Grid(0, 2), RangeError);
    assert.throws(() => new Grid(2, 1.5), RangeError);
});

test("a living cell dies with fewer than two or more than three neighbors", () => {
    for (const neighbors of [[], [[1, 0]], [[0, 0], [1, 0], [2, 0], [0, 1]]]) {
        const grid = new Grid(3, 3).seed([[1, 1], ...neighbors]);
        grid.step();
        assert.equal(grid.getState(1, 1), 0);
    }
});

test("a living cell survives with two or three neighbors", () => {
    for (const neighbors of [[[0, 0], [1, 0]], [[0, 0], [1, 0], [2, 0]]]) {
        const grid = new Grid(3, 3).seed([[1, 1], ...neighbors]);
        grid.step();
        assert.equal(grid.getState(1, 1), 1);
    }
});

test("a dead cell is born with exactly three living neighbors", () => {
    for (const count of [0, 1, 2, 3, 4]) {
        const neighbors = [[0, 0], [1, 0], [2, 0], [0, 1]].slice(0, count);
        const grid = new Grid(3, 3).seed(neighbors).step();
        assert.equal(grid.getState(1, 1), count === 3 ? 1 : 0);
    }
});

test("neighbor counts exclude the center and never wrap across edges", () => {
    const grid = new Grid(3, 3).seed([[0, 0], [1, 0], [0, 1], [2, 0], [0, 2], [2, 2]]);
    assert.equal(grid.countNeighbors(0, 0), 2);
    assert.equal(grid.getState(-1, 0), 0);
    assert.equal(grid.getState(3, 0), 0);
    assert.equal(grid.getState(0, -1), 0);
    assert.equal(grid.getState(0, 3), 0);
    assert.equal(grid.setState(-1, 0, 1), false);
    assert.equal(grid.toggle(3, 0), false);
    const corner = new Grid(3, 3).seed([[0, 0], [1, 0], [0, 1]]).step();
    assert.deepEqual(sorted(corner.aliveCells()), sorted([[0, 0], [1, 0], [0, 1], [1, 1]]));
});

test("a generation is computed simultaneously from the old state", () => {
    const grid = new Grid(5, 5).seed([[1, 2], [2, 2], [3, 2]]).step();
    assert.deepEqual(sorted(grid.aliveCells()), sorted([[2, 1], [2, 2], [2, 3]]));
    assert.equal(grid.generation, 1);
});

test("the preserved still lifes and oscillators repeat after their known periods", () => {
    const periods = {
        block: 1, beehive: 1, loaf: 1, boat: 1, tub: 1,
        blinker: 2, toad: 2, beacon: 2, pulsar: 3, pentadecathlon: 15,
    };
    for (const [name, period] of Object.entries(periods)) {
        const pattern = LIFE_PATTERNS[name];
        const grid = new Grid(pattern.width, pattern.height).seed(pattern.cells);
        for (let i = 0; i < period; i++) grid.step();
        assert.deepEqual(sorted(grid.aliveCells()), sorted(pattern.cells), name);
    }
});

test("the preserved glider moves one column and row after four generations", () => {
    const pattern = LIFE_PATTERNS.glider;
    const grid = new Grid(pattern.width, pattern.height).seed(pattern.cells);
    for (let i = 0; i < 4; i++) grid.step();
    assert.deepEqual(sorted(grid.aliveCells()), sorted(pattern.cells.map(([x, y]) => [x + 1, y + 1])));
});

test("all 15 original presets contain unique cells inside their finite grids", () => {
    assert.equal(Object.keys(LIFE_PATTERNS).length, 15);
    for (const pattern of Object.values(LIFE_PATTERNS)) {
        const grid = new Grid(pattern.width, pattern.height).seed(pattern.cells);
        assert.equal(grid.aliveCells().length, pattern.cells.length, pattern.label);
        assert.ok(pattern.cells.every(([x, y]) => grid.contains(x, y)), pattern.label);
    }
});

test("seeding, clearing, and randomizing preserve time; reset restores the latest starting population", () => {
    const grid = new Grid(2, 2).seed([[0, 0]]).step();
    grid.seed([[1, 1]]);
    assert.equal(grid.generation, 1);
    assert.deepEqual(grid.aliveCells(), [[1, 1]]);
    grid.toggle(1, 1);
    assert.deepEqual(grid.aliveCells(), []);
    assert.deepEqual(grid.initialCells, [[1, 1]]);
    assert.throws(() => grid.setState(0, 0, 2), RangeError);
    const randomValues = [0.1, 0.5, 0.2, 0.9];
    grid.randomize(() => randomValues.shift());
    assert.deepEqual(grid.aliveCells(), [[0, 0], [0, 1]]);
    assert.deepEqual(grid.initialCells, [[0, 0], [0, 1]]);
    assert.equal(grid.generation, 1);
    const snapshot = grid.aliveCells();
    snapshot[0][0] = 99;
    assert.deepEqual(grid.cells[0].position, [0, 0]);
    grid.clear();
    assert.equal(grid.generation, 1);
    assert.deepEqual(grid.aliveCells(), []);
    grid.reset();
    assert.equal(grid.generation, 0);
    assert.deepEqual(grid.aliveCells(), [[0, 0], [0, 1]]);
});

test("separate grids never share cell state", () => {
    const left = new Grid(3, 3).seed([[1, 1]]);
    const right = new Grid(3, 3).seed([[0, 0], [0, 1], [1, 0]]);
    const rightBefore = right.aliveCells();
    left.step().clear();
    assert.deepEqual(right.aliveCells(), rightBefore);
    assert.equal(right.generation, 0);
});
