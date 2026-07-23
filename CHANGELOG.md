# Changelog

## 2026-07-23

- Removed all audio: synthesized SFX, the music slot system and the sound settings are gone.
- Replaced the hyperspace flash between views with a continuous camera approach (galaxy and system engines fly to the clicked body, the arriving view continues the dive).
- Galaxy map nodes now render as real archetype-shaded worlds with a faction halo instead of flat sprites.
- Deleted the leftover LEO LIVE satellite tracker: `/legacy` route, globe engine, TLE data and Earth textures (-3.5 MB from the deploy).
- Rebuilt the galaxy disk: log-spiral arms with inter-arm field stars, unresolved nebula haze, dust lanes and a barred bulge, all as three point clouds instead of ~1300 sprites.
- Star rendering reworked: gaussian point sprites with a power-law brightness spread, so starfields stop reading as uniform confetti.
- Planet surfaces gained relief shading: a per-archetype height field is sampled for its gradient and perturbs the normal, so dunes, ridges and crater rims catch the terminator.
- Coruscant's day face now shows megablock canyons and plazas instead of flat grey.
- Added the texture pipeline (`scripts/process-textures.mjs`) and the runtime loader that blends generated albedo/night maps over the procedural shader when a manifest exists.
- Added favorites and recently-visited lists (localStorage) with a top-bar menu and a star on the planet panel.
- Added guided tours (Skywalker Saga, Clone Wars, Way of the Mandalore) with a narrated player that drives the route itself.
- Added `/compare`: two live globes, a to-scale diameter strip and a stat table, linkable through the query string.
- Added the optional Aurebesh decoration layer; it turns on when an OFL-licensed `public/fonts/aurebesh.woff2` is present.
- Added the static SEO surface: per-world OG cards drawn from each planet's palette, per-route meta pages, sitemap.xml and robots.txt, all generated post-build.
- Added PWA support: web manifest, generated icons and an app-shell service worker (network-first navigations, cache-first hashed assets).
- Removed the orphaned satellite propagator worker left over from LEO LIVE.
- Added the Tier A expansion: 40 more worlds (Ghorman, Aldhani, Narkina 5, Chandrila, Malachor, Tython, Trask, Batuu, Kijimi, Hosnian Prime, At Attin, Glavis Ringworld and the rest), all cross-checked against the Wookieepedia digest — 74 bodies total, 0 validation errors.
- Galaxy labels declutter themselves: nearer worlds claim their box and colliding labels drop out.
- Galaxy node globes skip relief shading (uRelief) and use a coarser sphere, keeping the 74-world map at 77 fps.
- Reworked the route loaders to derive "loading" from an id-keyed result instead of resetting state inside effects; the Kessel Run stopwatch now runs in an effect. Lint is clean.
