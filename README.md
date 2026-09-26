# Julia Voyage — Animate demo

A standalone, one-page visual demo. Open `index.html` in a browser or place it at the root of a GitHub Pages repository. The screen shows the artwork and one Play/Pause button.

The 4:19 Julia timeline and Hewmorist’s Fractal Journey track are built into `index.html`, so there is no build step or image asset folder. The browser calculates the fractal frames while the track plays. If SoundCloud cannot load, the same button runs the visual timeline silently.

The source timeline is also provided as `julia-vivid-voyage.json` for inspection and editing in the full Animate 0.7 app. The demo has its own embedded copy of that JSON; editing the separate file alone does not change the page. To publish a revised show, export it from the full app and update `defaultConfig` in `index.html`.

The demo is a presentation view of the Animate engine. For the timeline editor and other procedural modes, use the full Animate app.

On iPhone, the page retains its single Play button. It sends the start request during the touch gesture and checks that SoundCloud playback position advances before starting the animation. If startup stalls, it retries the widget request. SoundCloud playback still depends on its embedded player and iOS policy.

Revision: **Animate demo r3 · 2026-09-25**. The label appears at the lower right of the page. If it is absent after publishing, the browser is showing an earlier file or an older cached copy.
