# Video sources

These Manim Community scenes produce explanatory videos for the book. Rendering
is separate from the p5.js examples and the mdBook build.

## Setup

From the repository root:

```powershell
npm run video:setup
```

The wrapper downloads uv 0.13.5 into the ignored repository .tools directory,
checks the official archive against its pinned SHA-256, and lets uv provision
CPython 3.14.9 and the locked Manim 0.22.0 environment. It does not change the
system PATH or use Windows Store Python aliases. Python downloads stay in
.tools/python, package downloads in .cache/uv, and the local environment in
animations/.venv.

The checked-in uv.lock fixes transitive dependencies. To deliberately update
dependencies, edit pyproject.toml and regenerate that lock with the pinned uv;
normal setup and render commands use --locked and do not rewrite it.

## Render

```powershell
npm run video:preview
npm run video:render
```

Both commands render NeighborhoodDiagram from game_of_life.py by default.
Preview is 854x480 at 15 FPS; release is 1920x1080 at 30 FPS. Both use Cairo,
a fixed random seed of 42, MP4/H.264 with yuv420p, and also save a final-frame PNG.

To select another source file and scene:

```powershell
npm run video:preview -- game_of_life.py NeighborhoodDiagram
```

Source paths are relative to animations. Candidates and Manim caches remain under
.cache/manim/preview or .cache/manim/release. The CLI reports the completed video
and image paths. Review the video and frame before copying an approved MP4 into
book/src/media/game-of-life. Rendering never changes the published book assets.

## Scene conventions

NeighborhoodDiagram is an eight-second, 3x3 explanation: a distinct center,
eight surrounding cells counted in sequence, and a final statement that the
center is not counted. Its local Open Sans font matches the book's typography;
its dark background and contrasting colors match the book's navy theme.

The first scene uses Text and shapes, so it needs no LaTeX distribution.
Tex, MathTex, and default DecimalNumber objects require additional typesetting
tools; do not introduce those accidentally when adding numeric labels.

Modern Manim uses PyAV wheels with bundled FFmpeg libraries, so a separate
FFmpeg executable is not required. Ubuntu builds may need pkg-config,
libcairo2-dev, libpango1.0-dev, build-essential, and python3-dev if a native
dependency has to be compiled.

Tool downloads currently support Windows x64 and Linux x64. Open Sans and its
OFL license are bundled under assets/fonts; see that directory's README for
their upstream source.
