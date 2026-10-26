<br>
<h1 style = "text-align: center;"> Basic Grid Logic</h1>

---

<div class = "container">
<h2 class="secondary-header">Tools We Will Be Using</h2>
<div class = "example">

- <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes" target="_blank"><b class="reference">Classes</b></a>
- <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Loops_and_iteration" target="_blank"><b class="reference">For Loops</b></a>
- <a href="https://p5js.org/reference/p5/createCanvas/" target="_blank"><b class="reference">createCanvas</b></a> and <a href="https://p5js.org/reference/p5/draw/" target="_blank"><b class="reference">draw</b></a> from p5.js
- <b>Math</b>.<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random" target="_blank"><b class="reference">random</b></a>
- <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/if...else" target="_blank"><b class="reference">if...else</b></a>

Be familiar with these, as we will be using them, so I do not want you to be confused later on. p5.js takes care of the canvas and its drawing loop; we will write the grid and the rules ourselves.

</div>
</div>

---

<div class="container">
<h2 class="secondary-header">Creating The Grid Class</h2>

First we need to create a <b class="function">Grid</b> class. This will hold the logic of our grid. We can give it two arguments, a <b class="variable">width</b> and a <b class="variable">height</b>.

Now we need logic. What are we going to do with these two arguments? Well, let's think about it, what we are trying to accomplish is a way to create a grid. Something like <b>this</b>:

<br>

<video style="background: solid 1px white" controls>
<source src="media/game-of-life/GridCreation.mp4" type="video/mp4">
</video>

<br>

So in my mind, I am thinking of using two nested <b class="keyword">for loops</b>, using the <b class="variable">width</b> and <b class="variable">height</b> arguments. Here is the <b class="function">constructor</b> from our grid:

```javascript
{{#include sketches/game-of-life/sketch.js:grid-constructor}}
```

The outer loop visits each row; the inner loop visits each column in that row. We store the cells in one array, so the id of a cell at <b>[x, y]</b> is <b>y * width + x</b>. The first row starts at id 0, the second at id width, and so on.

In our code, we can create a variable <b class="variable">grid</b> and set its value to a <b class="keyword">new</b> <b class="function">Grid</b>, for example <code>new Grid(4, 4)</code>. That creates sixteen cells. You can log the column and row in the loops to follow the positions from the video. <i style="color:grey;">assuming you watched</i>

Now what? Well, the video has one thing we haven't explained yet, cells! Another <b>main</b> thing!

<h2 class="secondary-header">Creating The Cell Class</h2>

Now for this one, let's create a basic <b class="function">Cell</b> class. This class holds a <b class="variable">state</b>, <b class="variable">id</b> and <b class="variable">position</b> ([x, y]) which will be changed through the passing arguments.

```javascript
{{#include sketches/game-of-life/sketch.js:cell}}
```

The state is 0 for dead or 1 for alive. The id locates the cell in the array, and the position locates it on the grid. The constructor starts the cells dead; a starting pattern will give some of them state 1.
</div>

---

<div class="container">
<h2 class="secondary-header">Drawing The Grid With p5.js</h2>

Now we have the cells, how can we see them? We will use p5.js to create a canvas and draw squares for our cells. Each sketch has its own grid and canvas, so changing one example will not change the others on the page.

The sketch's setup creates the canvas:

```javascript
{{#include sketches/game-of-life/sketch.js:sketch-setup}}
```

Then the drawing code reads the cells' positions and states. Multiplying a cell's position by the cell size gives its position in pixels. Changing the cell size changes the picture without changing the grid's rules.

```javascript
{{#include sketches/game-of-life/sketch.js:drawing}}
```

The colors passed to p5.js decide how alive and dead cells look. With <b>Color</b> enabled, each update uses a shared pair of colors: one for cells being born and one for cells that survive. Each cell also keeps its own current RGBA color, so it can carry that color into the next update.

Now for the smooth part! With <b>Smooth colors</b> enabled, we move each red, green, blue, and opacity value toward its target. That lets a cell change color gradually, or fade toward transparent when it dies. Here is the color interpolation used by the sketch:

```javascript
{{#include sketches/game-of-life/sketch.js:color-interpolation}}
```

The <code>alpha</code> argument here controls how far to move toward the target color; the <code>a</code> channel stores opacity. These color changes affect the picture, while the grid still follows the same alive/dead rules. You can read more about <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/color_value" target="_blank"><b class="reference">color values</b></a> and try your own.

<div class="green-box">
<span style="color : rgba(23, 87, 40, 1)">Good tip : Always read through documentation!</span>
</div>

The cells share one canvas. The buttons and sliders around it control the sketch.

<h2 class="secondary-header">Changing A Cell</h2>

Now let's make our grid interactive! The grid can set a cell's state or toggle it between 0 and 1:

```javascript
{{#include sketches/game-of-life/sketch.js:editing}}
```

For a click on the canvas, we divide the pixel position by the cell size and round down to find the column and row. The interaction code also lets us draw across several cells:

```javascript
{{#include sketches/game-of-life/sketch.js:interaction}}
```
</div>

---

<div class="container">
<h2 class="secondary-header">Counting The Neighbors</h2>

We have a grid and we can edit it. Next comes the Game of Life logic! First we need a way to read a cell's state from its column and row:

```javascript
{{#include sketches/game-of-life/sketch.js:get-state}}
```

For this version, positions outside the grid count as dead. A cell at an edge has fewer neighbors; the opposite edge does not wrap around.

To count the neighbors, visit the surrounding three-by-three area, skip the center cell, and add the eight surrounding states:

```javascript
{{#include sketches/game-of-life/sketch.js:neighbors}}
```

<h2 class="secondary-header">Moving To The Next Generation</h2>

Now we can apply the survival, birth, and death rules from the previous page. Every cell must use the states from the same generation. If we changed one cell before counting the next cell's neighbors, we could change the answer just by changing the order of our loop!

So we calculate all the next states first, then copy them into the cells together:

```javascript
{{#include sketches/game-of-life/sketch.js:step}}
```

One call to <code>step()</code> advances the grid by one generation. Drawing the grid just shows its current state; it does not advance the rules.

<h2 class="secondary-header">Letting It Run</h2>

The <b>Step</b> button advances once. <b>Play</b> keeps advancing at the selected speed, while p5.js draws the result:

```javascript
{{#include sketches/game-of-life/sketch.js:animation}}
```

p5.js manages the browser drawing loop, built on <a href="https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame" target="_blank"><b class="reference">requestAnimationFrame</b></a>. The simulation's speed controls how often we advance a generation.

<h2 class="secondary-header">Putting It On The Page</h2>

Each example has its own frame in the page:

```html
<iframe class="life-example" title="Basic Grid Logic: blinker lesson" src="sketches/game-of-life/index.html?example=lesson"></iframe>
```

The frame loads p5.js and <a href="sketches/game-of-life/sketch.js">sketch.js</a>. p5.js calls our <code>setup()</code> once, then keeps calling <code>draw()</code>. Each frame has its own grid. The <code>example</code> in the URL selects these settings at the start of <code>setup()</code>:

```javascript
{{#include sketches/game-of-life/sketch.js:settings}}
```

The starting cells are <b>[column, row]</b> coordinates. Here, three cells beside each other make a blinker. Now, if we did this right, we should have a working grid! Try stepping the blinker below or drawing some more cells. Next, let's see the <b><a href="./GameOfLife2.html">patterns</a></b> that can come from these simple rules : D.

End Result:

<iframe class="life-example" id="life-grid-lesson" title="Basic Grid Logic: blinker lesson" src="sketches/game-of-life/index.html?example=lesson"></iframe>
</div>
