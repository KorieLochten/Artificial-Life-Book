// Match the surrounding book and fit this document to its iframe.
// The p5 sketch itself also runs when this page is opened on its own.
(() => {
    const frame = window.frameElement;
    if (!frame) return;

    const root = document.documentElement;
    const content = document.getElementById("life-sketch");
    const bookRoot = parent.document.documentElement;
    root.classList.add("embedded");

    function fitFrame() {
        if (!content.querySelector("canvas")) return;
        const height = Math.ceil(content.getBoundingClientRect().height);
        if (frame.style.height !== height + "px") frame.style.height = height + "px";
    }

    function matchBook() {
        const theme = parent.getComputedStyle(bookRoot);
        for (const name of ["--bg", "--fg", "--table-border-color"]) {
            root.style.setProperty(name, theme.getPropertyValue(name));
        }
        root.style.fontSize = theme.fontSize;
        root.style.colorScheme = theme.colorScheme;
        const text = parent.getComputedStyle(parent.document.body);
        document.body.style.fontFamily = text.fontFamily;
        document.body.style.fontSize = text.fontSize;
        document.body.style.lineHeight = text.lineHeight;
        fitFrame();
    }

    const bookFonts = parent.document.querySelector('link[rel="stylesheet"][href*="fonts/"]');
    if (bookFonts) {
        const fonts = document.createElement("link");
        fonts.rel = "stylesheet";
        fonts.href = bookFonts.href;
        fonts.addEventListener("load", fitFrame);
        document.head.appendChild(fonts);
    }

    matchBook();
    new ResizeObserver(fitFrame).observe(content);
    new MutationObserver(matchBook).observe(bookRoot, { attributes: true, attributeFilter: ["class", "style"] });
    document.fonts.ready.then(fitFrame);
})();
