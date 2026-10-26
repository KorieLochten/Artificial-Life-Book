# p5.js 2.3.3

`p5.min.js` is the unmodified minified library from the exact p5.js 2.3.3 distribution linked by the [official download page](https://p5js.org/download/):

https://cdn.jsdelivr.net/npm/p5@2.3.3/lib/p5.min.js

SHA-256: `3f8a0c739bd3c6350e239ff7187d38656ed2247e30a2b8084fd16a91e6e843ac`

The upstream 2.3.3 distribution embeds a `2.3.1` version constant. The asset is preserved exactly as distributed; its filename/source package is pinned to 2.3.3 rather than rewriting the library's version string.

The upstream LGPL 2.1 license is retained in `p5-LICENSE.txt`, downloaded from:

https://raw.githubusercontent.com/processing/p5.js/v2.3.3/license.txt

No p5.sound asset or runtime CDN request is required. mdBook copies this directory from `book/src/vendor/p5` into the generated book unchanged. The Game of Life sketch page loads `../../vendor/p5/p5.min.js` directly.
