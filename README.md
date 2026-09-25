# Julia Voyage — Animate demo

A standalone, one-page visual demo. Open `index.html` in a browser or place it at the root of a GitHub Pages repository. The screen shows the artwork and one Play/Pause button.

The 4:21 Julia timeline and the Hewmorist SoundCloud track are built into `index.html`, so there is no build step or image asset folder. The browser calculates the fractal frames while the track plays. If SoundCloud cannot load, the same button runs the visual timeline silently.

The source timeline is also provided as `julia-vivid-voyage.json` for inspection and editing in the full Animate 0.7 app. The demo has its own embedded copy of that JSON; editing the separate file alone does not change the page. To publish a revised show, export it from the full app and update `defaultConfig` in `index.html`.

The demo is a presentation view of the Animate engine. For the timeline editor and other procedural modes, use the full Animate app.
