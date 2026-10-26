class Color {
    constructor(r = 1, g = 1, b = 1, a = 1) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    copy() {
        return new Color(this.r, this.g, this.b, this.a);
    }

    // ANCHOR: color-interpolation
    static lerpColors(colorA, colorB, alpha) {
        let r = colorA.r + (colorB.r - colorA.r) * alpha;
        let g = colorA.g + (colorB.g - colorA.g) * alpha;
        let b = colorA.b + (colorB.b - colorA.b) * alpha;
        let a = colorA.a + (colorB.a - colorA.a) * alpha;
        return new Color(r, g, b, a);
    }
    // ANCHOR_END: color-interpolation
}

const blackColor = new Color(0, 0, 0, 0);
const whiteColor = new Color(255, 255, 255, 1);

function randomColor(random, alpha = 1) {
    return new Color(Math.floor(random() * 255), Math.floor(random() * 255),
        Math.floor(random() * 255), alpha);
}

// ANCHOR: cell
class Cell {
    constructor(state, id, position, random = Math.random) {
        this.state = state; // 0 or 1
        this.prevState = state;
        this.id = id;
        this.position = position; // [column, row]
        this.color = (state === 1 ? whiteColor : blackColor).copy();
        this.staticColor = randomColor(random);
        this.aliveColor = randomColor(random, 0.875);
    }
}
// ANCHOR_END: cell

class Grid {
    // ANCHOR: grid-constructor
    constructor(width, height, {
        useColor = false, useAlpha = false, useBorders = true, random = Math.random
    } = {}) {
        if (!Number.isInteger(width) || width < 1 ||
            !Number.isInteger(height) || height < 1) {
            throw new RangeError("Grid dimensions must be positive integers.");
        }

        this.width = width;
        this.height = height;
        this.useColor = useColor;
        this.useAlpha = useAlpha;
        this.useBorders = useBorders;
        this.random = random;
        this.generation = 0;
        this.colorIndex = 0;
        this.initialCells = [];
        this.cells = [];

        for (let row = 0; row < this.height; row++) {
            for (let column = 0; column < this.width; column++) {
                const id = row * this.width + column;
                this.cells.push(new Cell(0, id, [column, row], random));
            }
        }

        this.borderSegments = [];
        for (let y = 0; y < this.height; y++) {
            this.borderSegments.push([0, y, 0, y + 1]);
        }
        for (let x = 0; x < this.width; x++) {
            this.borderSegments.push([x, this.height, x + 1, this.height]);
        }
        for (let y = this.height; y > 0; y--) {
            this.borderSegments.push([this.width, y, this.width, y - 1]);
        }
        for (let x = this.width; x > 0; x--) {
            this.borderSegments.push([x, 0, x - 1, 0]);
        }
        this.borderColors = this.borderSegments.map(() => new Color(255, 255, 255, 0.5));
        this.borderIndex = 0;
        this.highlightColor = randomColor(random, 0.875);
    }
    // ANCHOR_END: grid-constructor

    contains(column, row) {
        return Number.isInteger(column) && Number.isInteger(row) &&
            column >= 0 && column < this.width &&
            row >= 0 && row < this.height;
    }

    // ANCHOR: get-state
    getState(column, row) {
        if (!this.contains(column, row)) return 0;
        return this.cells[row * this.width + column].state;
    }
    // ANCHOR_END: get-state

    // ANCHOR: editing
    setState(column, row, state) {
        if (!this.contains(column, row)) return false;
        if (state !== 0 && state !== 1) {
            throw new RangeError("A cell's state must be 0 or 1.");
        }
        const cell = this.cells[row * this.width + column];
        cell.state = state;
        cell.prevState = state;
        cell.color = (state === 1
            ? this.useColor ? cell.aliveColor : whiteColor
            : blackColor).copy();
        return true;
    }

    toggle(column, row) {
        return this.setState(column, row, 1 - this.getState(column, row));
    }
    // ANCHOR_END: editing

    clear() {
        for (const cell of this.cells) cell.state = 0;
        return this;
    }

    seed(coordinates) {
        this.clear();
        for (const [column, row] of coordinates) {
            if (this.contains(column, row)) {
                this.cells[row * this.width + column].state = 1;
            }
        }
        this.initialCells = this.aliveCells();
        return this;
    }

    randomize(random = this.random, density = 0.24) {
        for (const cell of this.cells) {
            cell.state = random() < density ? 1 : 0;
        }
        this.colorIndex = (this.colorIndex + 1) % this.cells.length;
        this.initialCells = this.aliveCells();
        return this;
    }

    reset() {
        this.seed(this.initialCells);
        this.generation = 0;
        const aliveColor = this.useColor ? this.cells[this.colorIndex].aliveColor : whiteColor;
        for (const cell of this.cells) {
            cell.color = (cell.state === 1 ? aliveColor : blackColor).copy();
            cell.prevState = cell.state;
        }
        return this;
    }

    aliveCells() {
        return this.cells.filter(cell => cell.state === 1)
            .map(cell => [...cell.position]);
    }

    // ANCHOR: neighbors
    countNeighbors(column, row) {
        let alive = 0;
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue; // Do not count the cell itself.
                alive += this.getState(column + dx, row + dy);
            }
        }
        return alive;
    }
    // ANCHOR_END: neighbors

    // ANCHOR: step
    step() {
        for (const cell of this.cells) cell.prevState = cell.state;
        const next = this.cells.map(cell => {
            const [column, row] = cell.position;
            const neighbors = this.countNeighbors(column, row);
            return neighbors === 3 || (cell.state === 1 && neighbors === 2) ? 1 : 0;
        });

        // Every result was calculated before changing any of the current cells.
        for (const cell of this.cells) cell.state = next[cell.id];
        this.updateColors();
        this.updateBorder();
        this.generation++;
        return this;
    }
    // ANCHOR_END: step

    // ANCHOR: color-update
    updateColors() {
        const source = this.cells[this.colorIndex];
        for (const cell of this.cells) {
            let target;
            let alpha;
            if (cell.state === 0) {
                target = blackColor;
                alpha = this.useAlpha ? 0.25 * 0.25 * (3 - 2 * 0.25) : 1;
            } else if (!this.useColor) {
                target = whiteColor;
                alpha = this.useAlpha ? 0.1 : 1;
            } else if (cell.prevState === 0) {
                target = source.aliveColor;
                alpha = this.useAlpha ? 0.5 * 0.5 * (3 - 2 * 0.5) : 1;
            } else {
                target = source.staticColor;
                alpha = this.useAlpha ? 0.25 : 1;
            }
            cell.color = Color.lerpColors(cell.color, target, alpha);
            cell.prevState = cell.state;
        }
        return this;
    }
    // ANCHOR_END: color-update

    updateBorder() {
        if (!this.useBorders) return this;
        const alpha = this.useAlpha ? 0.25 * 0.25 * (3 - 2 * 0.25) : 1;
        this.borderColors[this.borderIndex] = Color.lerpColors(
            this.borderColors[this.borderIndex], this.highlightColor, alpha);
        this.borderIndex++;
        if (this.borderIndex === this.borderSegments.length) {
            this.borderIndex = 0;
            this.highlightColor = randomColor(this.random, 0.875);
        }
        return this;
    }
}

let grid;
let sketchHost, drawingCanvas, playButton, statusText, colorBox, alphaBox;
let cellSize = 10;
let preferredCellSize = 10;
let repeatAfter = 0;
let playing = true;
let randomStart = true;
let painting = false;
let paintState = 1;
let framesPerSecond = 10;
let exampleLabel = "Game of Life";
let startingCells = null;

// ANCHOR: sketch-setup
function setup() {
    // ANCHOR: settings
    const example = new URLSearchParams(window.location.search).get("example") || "main";
    let settings = {
        width: 50, height: 50, cellSize: 10,
        useColor: true, useAlpha: true, repeatAfter: 150,
        label: "Game of Life",
    };

    if (example === "introduction") {
        settings = {
            width: 40, height: 24, cellSize: 20,
            useAlpha: true, useBorders: false,
            label: "Game of Life",
        };
    } else if (example === "lesson") {
        settings = {
            width: 12, height: 8, cellSize: 20,
            cells: [[5, 3], [6, 3], [7, 3]],
            playing: false, label: "Basic Grid Logic",
        };
    } else if (Object.hasOwn(LIFE_PATTERNS, example)) {
        settings = LIFE_PATTERNS[example];
    }
    // ANCHOR_END: settings

    preferredCellSize = settings.cellSize ?? 10;
    cellSize = preferredCellSize;
    repeatAfter = settings.repeatAfter ?? 0;
    playing = settings.playing ?? true;
    framesPerSecond = settings.fps ?? 10;
    exampleLabel = settings.label ?? "Game of Life";
    startingCells = settings.cells ?? null;
    randomStart = startingCells === null;

    grid = new Grid(settings.width, settings.height, {
        useColor: settings.useColor ?? false,
        useAlpha: settings.useAlpha ?? false,
        useBorders: settings.useBorders ?? true,
    });
    if (startingCells) grid.seed(startingCells);
    else grid.randomize();
    grid.updateColors();

    sketchHost = document.getElementById("life-sketch");
    if (!sketchHost) sketchHost = createDiv().id("life-sketch").elt;
    sketchHost.classList.add("life-sketch");
    sketchHost.setAttribute("role", "group");
    sketchHost.setAttribute("aria-label", exampleLabel);
    drawingCanvas = createCanvas(grid.width * cellSize, grid.height * cellSize);
    pixelDensity(1);
    drawingCanvas.parent(sketchHost);
    drawingCanvas.elt.tabIndex = 0;
    drawingCanvas.attribute("aria-label", exampleLabel + " editable cell grid");
    frameRate(framesPerSecond);
    fitCanvas();
    createControls();
    updateStatus();
}
// ANCHOR_END: sketch-setup

// ANCHOR: animation
function draw() {
    if (playing) {
        if (repeatAfter > 0 && grid.generation > 0 && grid.generation % repeatAfter === 0) {
            if (randomStart) grid.randomize();
            else grid.seed(startingCells);
        }
        grid.step();
    } else {
        // Pausing the rules still lets the original color fades settle.
        grid.updateColors();
        if (grid.useBorders) grid.updateBorder();
    }
    drawGrid();
    updateStatus();
}
// ANCHOR_END: animation

// ANCHOR: drawing
function drawGrid() {
    clear();
    noStroke();
    for (const cell of grid.cells) {
        const [x, y] = cell.position;
        const tint = cell.color;
        fill(tint.r, tint.g, tint.b, tint.a * 255);
        rect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
    if (grid.useBorders) {
        for (let i = 0; i < grid.borderSegments.length; i++) {
            const [x1, y1, x2, y2] = grid.borderSegments[i];
            const tint = grid.borderColors[i];
            stroke(tint.r, tint.g, tint.b, tint.a * 255);
            line(
                constrain(x1 * cellSize, 0.5, width - 0.5),
                constrain(y1 * cellSize, 0.5, height - 0.5),
                constrain(x2 * cellSize, 0.5, width - 0.5),
                constrain(y2 * cellSize, 0.5, height - 0.5)
            );
        }
    }
}
// ANCHOR_END: drawing

// ANCHOR: interaction
function mousePressed(event) {
    if (event.target !== drawingCanvas.elt || !mouseButton.left) return;
    const x = Math.floor(mouseX / cellSize);
    const y = Math.floor(mouseY / cellSize);
    if (!grid.contains(x, y)) return;
    paintState = 1 - grid.getState(x, y);
    painting = true;
    drawingCanvas.elt.focus({ preventScroll: true });
    grid.setState(x, y, paintState);
    drawGrid();
    updateStatus();
    return false;
}

function mouseDragged() {
    if (!painting) return;
    grid.setState(Math.floor(mouseX / cellSize), Math.floor(mouseY / cellSize), paintState);
    drawGrid();
    updateStatus();
    return false;
}

function mouseReleased() {
    painting = false;
}
// ANCHOR_END: interaction

function keyPressed(event) {
    if (document.activeElement !== drawingCanvas.elt ||
        event.ctrlKey || event.metaKey || event.altKey) return;
    switch (event.key.toLowerCase()) {
        case " ": case "p": playing = !playing; break;
        case "n": playing = false; grid.step(); break;
        case "r": grid.randomize(); randomStart = true; break;
        case "v": grid.clear(); break;
        case "c": grid.useColor = !grid.useColor; colorBox.checked(grid.useColor); break;
        case "a": grid.useAlpha = !grid.useAlpha; alphaBox.checked(grid.useAlpha); break;
        default: return;
    }
    drawGrid();
    updateStatus();
    return false;
}

function windowResized() {
    fitCanvas();
}

function fitCanvas() {
    if (!grid || !sketchHost) return;
    const style = getComputedStyle(sketchHost);
    const available = sketchHost.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    const maximum = windowWidth <= 480 ? preferredCellSize / 2 : preferredCellSize;
    cellSize = Math.max(1, Math.min(maximum, Math.floor(available / grid.width)));
    const nextWidth = grid.width * cellSize;
    const nextHeight = grid.height * cellSize;
    if (width !== nextWidth || height !== nextHeight) {
        resizeCanvas(nextWidth, nextHeight, true);
    }
}

function createControls() {
    createP(exampleLabel).class("life-label").parent(sketchHost);
    const buttons = createDiv().class("life-toolbar").parent(sketchHost);
    playButton = createButton(playing ? "Pause" : "Play").class("life-button").parent(buttons);
    playButton.mousePressed(() => { playing = !playing; updateStatus(); });
    createButton("Step").class("life-button").parent(buttons).mousePressed(() => {
        playing = false;
        grid.step();
        drawGrid();
        updateStatus();
    });
    createButton("Reset").class("life-button").parent(buttons).mousePressed(() => {
        playing = false;
        grid.reset();
        drawGrid();
        updateStatus();
    });
    createButton("Clear").class("life-button").parent(buttons).mousePressed(() => {
        grid.clear();
        drawGrid();
        updateStatus();
    });
    createButton("Randomize").class("life-button").parent(buttons).mousePressed(() => {
        grid.randomize();
        randomStart = true;
        drawGrid();
        updateStatus();
    });

    const settings = createDiv().class("life-settings").parent(sketchHost);
    const speedLabel = createElement("label", "Speed ").class("life-setting").parent(settings);
    const speedControl = createSlider(1, 30, framesPerSecond, 1).class("life-speed").parent(speedLabel);
    speedControl.attribute("aria-label", "Simulation speed");
    const speedText = createSpan(framesPerSecond + " generations/s").parent(speedLabel);
    speedControl.input(() => {
        frameRate(Number(speedControl.value()));
        speedText.html(speedControl.value() + " generations/s");
    });
    colorBox = createCheckbox("Color", grid.useColor).class("life-setting").parent(settings);
    colorBox.changed(() => { grid.useColor = colorBox.checked(); grid.updateColors(); });
    alphaBox = createCheckbox("Smooth colors", grid.useAlpha).class("life-setting").parent(settings);
    alphaBox.changed(() => { grid.useAlpha = alphaBox.checked(); grid.updateColors(); });
    statusText = createP().class("life-status").parent(sketchHost);
    createP("Click or drag to edit. Focus the grid: P pauses, N steps, R randomizes, C changes colors, A changes fades, V clears.")
        .class("life-hint").parent(sketchHost);
}

function updateStatus() {
    playButton.html(playing ? "Pause" : "Play");
    playButton.attribute("aria-pressed", String(playing));
    statusText.html("Generation " + grid.generation + " · " +
        grid.cells.filter(cell => cell.state === 1).length + " living cells · " +
        (playing ? "Running" : "Paused"));
}
