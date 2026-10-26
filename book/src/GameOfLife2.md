<br>
<h1 style = "text-align: center;">Patterns</h1>

---

<div class="primary-header">
<span style="font-size : 30px;"><b>Game of Life</b></span>
<br>
<span style="color:grey">The Main</span>
</div>

<div class="container">
Use <b>Pause</b> and <b>Step</b> to follow one generation at a time, or let the examples run. You can draw cells and use <b>Reset</b> to return to the starting pattern. The examples have separate grids, so feel free to try things out!

<iframe class="life-example" id="gof" title="Game of Life" src="sketches/game-of-life/index.html?example=main"></iframe>

All of these examples use the same Game of Life sketch. Each frame runs its own <code>setup()</code> and <code>draw()</code>, so it has its own grid. Here are the p5.js functions that run the examples:

```javascript
{{#include sketches/game-of-life/sketch.js:sketch-setup}}
```

```javascript
{{#include sketches/game-of-life/sketch.js:animation}}
```

The <a href="sketches/game-of-life/patterns.js">pattern definitions</a> list their starting cells as <b>[column, row]</b> coordinates. Try changing a pattern's coordinates to make your own shape!

</div>

<div class="primary-header">
<span style="font-size : 30px;"><b>Still Lives</b></span>
<br>
<span style="color:grey">Boring Dudes</span>
</div>

<div class="container">
<iframe class="life-example" id="block" title="Block pattern" src="sketches/game-of-life/index.html?example=block" loading="lazy"></iframe>
<iframe class="life-example" id="beehive" title="Beehive pattern" src="sketches/game-of-life/index.html?example=beehive" loading="lazy"></iframe>
<iframe class="life-example" id="loaf" title="Loaf pattern" src="sketches/game-of-life/index.html?example=loaf" loading="lazy"></iframe>
<iframe class="life-example" id="boat" title="Boat pattern" src="sketches/game-of-life/index.html?example=boat" loading="lazy"></iframe>
<iframe class="life-example" id="tub" title="Tub pattern" src="sketches/game-of-life/index.html?example=tub" loading="lazy"></iframe>
</div>

---

<div class="primary-header">
<span style="font-size : 30px;"><b>Oscillators</b></span>
<br>
<span style="color:grey">Amazing</span>
</div>

<div class="container">
<iframe class="life-example" id="toad" title="Toad pattern" src="sketches/game-of-life/index.html?example=toad" loading="lazy"></iframe>
<iframe class="life-example" id="beacon" title="Beacon pattern" src="sketches/game-of-life/index.html?example=beacon" loading="lazy"></iframe>
<iframe class="life-example" id="pulsar" title="Pulsar pattern" src="sketches/game-of-life/index.html?example=pulsar" loading="lazy"></iframe>
<iframe class="life-example" id="pentadecathlon" title="Pentadecathlon pattern" src="sketches/game-of-life/index.html?example=pentadecathlon" loading="lazy"></iframe>
<iframe class="life-example" id="glidergun" title="Glider gun pattern" src="sketches/game-of-life/index.html?example=glidergun" loading="lazy"></iframe>
<iframe class="life-example" id="blinker" title="Blinker pattern" src="sketches/game-of-life/index.html?example=blinker" loading="lazy"></iframe>
</div>

---

<div class="primary-header">
<span style="font-size : 30px;"><b>Spaceships</b></span>
<br>
<span style="color:grey">Beautiful</span>
</div>

<div class="container">
<div class="explanation" style="text-align:center"><iframe class="life-example" id="glider" title="Glider pattern" src="sketches/game-of-life/index.html?example=glider" loading="lazy"></iframe></div>
<div class="explanation" style="text-align:center"><iframe class="life-example" id="lightweightspaceship" title="Lightweight spaceship pattern" src="sketches/game-of-life/index.html?example=lightweightspaceship" loading="lazy"></iframe></div>
<div class="explanation" style="text-align:center"><iframe class="life-example" id="middleweightspaceship" title="Middleweight spaceship pattern" src="sketches/game-of-life/index.html?example=middleweightspaceship" loading="lazy"></iframe></div>
<div class="explanation" style="text-align:center"><iframe class="life-example" id="heavyweightspaceship" title="Heavyweight spaceship pattern" src="sketches/game-of-life/index.html?example=heavyweightspaceship" loading="lazy"></iframe></div>
</div>

<footer id="footer"></footer>
