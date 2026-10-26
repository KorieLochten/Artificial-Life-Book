# Artificial-Life-Book

[![Book checks and Pages](https://github.com/KorieLochten/Artificial-Life-Book/actions/workflows/pages.yml/badge.svg)](https://github.com/KorieLochten/Artificial-Life-Book/actions/workflows/pages.yml)
[![Video render candidates](https://github.com/KorieLochten/Artificial-Life-Book/actions/workflows/videos.yml/badge.svg)](https://github.com/KorieLochten/Artificial-Life-Book/actions/workflows/videos.yml)

An interactive book about artificial life. The first p5.js version covers the existing Conway's Game of Life chapters and pattern gallery; the elementary cellular automata chapters remain drafts.

Read the [published book](https://korielochten.github.io/Artificial-Life-Book/).

## Work locally

Install Node.js 24 with npm. From the repository root:

```sh
npm ci
npm run setup
npm run dev
```

`npm ci` restores the locked development dependencies. Setup prepares the pinned mdBook 0.5.4 tool and Playwright Chromium. The preview runs at `http://127.0.0.1:3031` and rebuilds when the book's source changes.

Playwright is a development dependency for browser checks. The reader-facing book uses mdBook and the local p5.js script.

| Command | Purpose |
| --- | --- |
| `npm test` | Run the rule and color unit tests. |
| `npm run book:build` | Build the static site into `dist/`. |
| `npm run book:serve` | Start the same watched preview as `npm run dev`. |
| `npm run check` | Run unit tests, build the book, audit local references, and run desktop/mobile Chromium checks. |

Run `npm run check` before submitting a change. Browser checks exercise the site under `/Artificial-Life-Book/`, including its embedded examples. Failure reports are written to `playwright-report/` and `test-results/`.

On Linux CI, `npm run setup -- --with-deps` also prepares Chromium's operating-system dependencies. Generated tools, render caches, browser reports, and `dist/` are ignored by Git.

## Source layout

The chapters stay in `book/src/`. Sketches, media, and the local p5.js distribution are grouped separately:

```text
book/src/
  GameOfLife0.md
  GameOfLife1.md
  GameOfLife2.md
  sketches/
    embed.js
    game-of-life/
      index.html
      sketch.js
      patterns.js
      style.css
  media/
    game-of-life/  # chapter videos
    icons/        # SVG icons
  vendor/p5/
    p5.min.js
    p5-LICENSE.txt
    README.md
```

`sketches/embed.js` handles the frames in the book. The generated site goes in `dist/` at the repository root.

`tests/game-of-life/` contains the rule and color tests and their source loader.
`tests/browser/` contains the rendered-book checks, `scripts/` holds the task commands,
and `.github/workflows/` defines the GitHub automation.

## Examples and walkthroughs

The examples use ordinary p5.js `setup()` and `draw()` functions. Each example runs in its own frame with its own grid, canvas, and controls. The chapter code excerpts use mdBook source includes so they show the code that runs the examples.

To change an example:

- [sketch.js](book/src/sketches/game-of-life/sketch.js) contains `Color`, `Cell`, and `Grid`, followed by the p5.js `setup()`, `draw()`, and input functions. Edit this file to change the rules, original color effects, drawing, or controls.
- [patterns.js](book/src/sketches/game-of-life/patterns.js) defines the named patterns as `[column, row]` coordinates. Edit those coordinates to change a starting shape.

The settings at the start of `setup()` select the introduction, lesson, main example, or a named pattern. Chapters display them through [index.html](book/src/sketches/game-of-life/index.html), for example `sketches/game-of-life/index.html?example=lesson`. To add a gallery example, add a pattern entry and a titled iframe with `class="life-example"` and `src="sketches/game-of-life/index.html?example=yourPatternKey"` in `GameOfLife2.md`.

p5.js is pinned to the **2.3.3 distribution** and served locally with the book. Its source, checksum, upstream version-reporting quirk, and license are recorded in [book/src/vendor/p5/README.md](book/src/vendor/p5/README.md).

## Render chapter videos

Manim scene source and its locked Python environment are documented in [animations/README.md](animations/README.md). Prepare that environment separately when working on videos:

```sh
npm run video:setup
npm run video:preview
npm run video:render
```

The default scene is `NeighborhoodDiagram`. Preview creates a 480p/15fps candidate; render creates a 1080p/30fps candidate. Both save the final frame as a PNG. Their outputs stay in `.cache/manim/preview/` and `.cache/manim/release/`.

Review the video and final frame, then copy an approved export into `book/src/media/game-of-life/` and update its chapter reference when publishing it. Existing chapter videos remain in place during setup and preview work. Normal book development and checks use the prepared book tools independently of the video environment.

## CI and publishing

[Book checks and Pages](.github/workflows/pages.yml) runs on pull requests, pushes to `main`, and manual requests. Pull-request jobs have read-only repository permissions. Successful checks on `main` upload exactly `dist/`; the deployment job publishes that checked artifact through the `github-pages` environment.

[Video render candidates](.github/workflows/videos.yml) runs when animation source, the video runner, or its workflow changes, and can also be requested manually. It renders the default preview and uploads candidate MP4/PNG artifacts for review. This job is independent of the book build and does not publish chapter media.

This repository publishes through GitHub Actions. The previous `gh-pages` branch is retained as rollback history. When setting up publishing again, or in a fork:

1. Put the workflow and tooling changes on `main` and confirm the book checks pass.
2. In **Settings > Environments > github-pages**, allow deployments from `main`. A site migrated from branch publishing may still allow only `gh-pages`.
3. In **Settings > Pages**, select **GitHub Actions** as the publishing source.
4. Run the Pages workflow and verify the published site.

After activation, an authenticated GitHub CLI can request a fresh checked deployment of `main`:

```sh
npm run deploy
```

That command dispatches `pages.yml` with `--ref main`. The workflow performs its checks before deployment; local preview and render commands stay part of the editing loop.

## Updating pinned tools

- Update Playwright deliberately with `npm install --save-dev --save-exact @playwright/test@VERSION`, then run setup and checks again. Commit both npm manifests.
- mdBook versions and official archive checksums live in `scripts/tooling.js`. Video tool pins live in `scripts/video.js` and the animation project's Python version, dependency metadata, and lockfile. Update the corresponding documentation and verify fresh setup when changing them.
- Workflow actions use full commit IDs with release-tag comments. Resolve a new official release tag to its commit, update both values, and validate the workflows before merging.
