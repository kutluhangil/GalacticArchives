# Changelog

## 2026-07-31

- Data honesty: an empty fact row now says which kind of empty it is. Every body and character carries the Wookieepedia article it was sourced from (all 88 bodies and 33 characters, up from 34 worlds), and the panel distinguishes four states — sourced value, value this archive summarised itself (marked), "not stated in canon" when the article defines none, and silence when the gap is ours. `unverified` is derived from the fetched infobox by `scripts/sync-sources.mjs`, never asserted by hand, and `validate-lore` fails if the two drift apart.
- Removed em-dash placeholder stats (Endor, Yavin) and a zero diameter; Endor's canon diameter (48,951 km) was wrong as 0. Filled the eight fields canon states but the archive lacked (Atollon, Cantonica, Cato Neimoidia, Malachor, Saleucami, Serenno, Sorgan, Umbara). Lore validation now runs at zero warnings.
- Fixed the stale "34 worlds" claim in the page description and share cards; it is 81, and an integrity test now ties the number to the file count.
- Added a test shield: 116 Vitest unit/component tests (lore era gating and lazy body loading, galaxy grid placement, collections, sim clock, quality tiers, tours, app store, PlanetPanel/SettingsMenu/ErrorBoundary), 18 configuration-integrity assertions (Vite base, CSP and deploy headers, SPA rewrite, manifest, no third-party asset hosts) and 10 Playwright end-to-end tests against the production build.
- Added a build-output budget (`npm run budget`): three, entry, stylesheet and KTX2 chunk sizes, the first-paint payload, and the guarantee that neither three nor the KTX2 transcoder loads on first paint.
- Added `npm run verify` (typecheck → lint → lore validation → tests → build → budget → e2e) and wired the same chain into CI.

## 2026-07-24

- Fixed a crash opening any of eleven worlds without a stats block (Umbara, Moraband, Cato Neimoidia, Aldhani, Daiyu, Krownest, Mimban, Numidian Prime, Savareen, Seatos, Wobani): the panel read `stats.diameterKm` unguarded. `stats` is now optional in the type and every read is guarded, so those panels simply omit the missing rows; validate-lore warns on a missing stats block to track the content gap.
- Added chunk-load resilience: a failed dynamic import (typically a new deploy replacing hashed chunks under an open tab) triggers a one-time auto-reload, guarded by a cooldown so a genuine failure still surfaces the error panel.
- Mobile-first hardening: the era selector (now up to four chips with Old Republic) scrolls horizontally instead of pushing the page wide on narrow screens, and the Compare and Holocron views clamp horizontal overflow. Verified the galaxy has zero horizontal page overflow.
- Performance: split KTX2Loader into its own on-demand chunk (three chunk 634 → 622 kB) and prefetch the galaxy route during the idle landing crawl so entering the atlas is instant.
- Added an `old-republic` era for the Legends layer: the era selector shows an "Old Republic" chip only while Legends is on, giving the KotOR-era worlds a home on the timeline; canon worlds read neutral there, and the timeline falls back to Empire if Legends is switched off while it is selected.
- Migrated routing to react-router's data router (`createBrowserRouter`), which enables real view transitions on the Holocron: character card → detail portrait now shares a `holo-<id>` morph and pages cross-fade, with a reduced-motion guard. The galaxy/planet camera-flight navigation is unchanged.
- Made the galaxy map keyboard- and screen-reader-accessible: a stable, sorted `<nav>` mirrors every visible world (visually hidden until focused), while the on-canvas labels became mouse-only.
- Legends worlds now carry a dashed gold ring on the galaxy map so the layer reads as a distinct overlay.
- Added a one-time onboarding hint pointing at the era selector and the Legends toggle, and a region filter to the ⌘K command palette.
- Added a top-level ErrorBoundary (themed fallback instead of a white screen), a strict Content-Security-Policy and hardening headers (web + Tauri), a LICENSE and Dependabot config.
- Added a CI pipeline (typecheck, lint, offline lore validation, build) and removed 44 unused template dependencies (runtime deps 50 → 9).

## 2026-07-23

- Added the Legends layer (PLAN 2.3): seven Legends-continuity worlds (Korriban, Dromund Kaas, Taris, Manaan, Csilla, Lehon, Ossus) sourced from the `/Legends` Wookieepedia articles and validated for coordinates and diameters, tagged `continuity: "legends"` and gated behind a new "Legends worlds" toggle in the settings menu; when off they are hidden from the galaxy map, ⌘K search and Compare picker. Korriban/Dromund Kaas get hand-placed positions so they do not stack on canon Moraband at grid R-5, and Legends worlds carry a gold LEGENDS badge on their panel. Added the three source games (KotOR, KotOR II, The Old Republic) to the media list.
- Mobile baseline pass: `touch-action: none` on the globe canvas so one-finger drag rotates (and pinch zooms) instead of scrolling the page; the top bar now wraps its nav and era controls instead of overflowing off-screen; the planet panel caps its height and scrolls internally so its lower content stays reachable on short viewports.
- Replaced the black era-change flash with a real cross-dissolve: the outgoing frame is frozen and faded out over the rebuilt scene in the planet, system and compare views (galaxy already recolours in place). Removed the old `EraFade` veil.
- Added a Star Wars-style opening crawl to the landing page: blue prologue line, then the yellow title and lore text climbing into perspective, skippable by button or Escape and suppressed under reduced motion.
- Enabled the Aurebesh decoration layer: shipped `public/fonts/aurebesh.woff2`, so planet names now carry their Aurebesh transliteration.
- Pinned three.js to its own `three` vendor chunk (was mislabelled `TopBar`); the TopBar chunk now reflects its real 47 kB content.
- Removed stray root files `leo-live.zip` and `bIDpBkG.png` (5 MB of unrelated leftovers) from the repo.
- Added `docs/gemini-image-prompts.md`: Gemini prompts for planet texture maps, Holocron card art and hologram portraits.
- Fixed the black screen after flying to a world from the galaxy map: the transition veil now lifts itself instead of relying on timers owned by the view that unmounts on the route swap.
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
- Added the macOS desktop build (Tauri v2): `npm run desktop` produces an unsigned 12 MB .dmg; the packaged app defaults to the high quality tier and skips service-worker registration.
- Verified PLAN §8's leak budget: 50 planet transitions grow the JS heap 6.5% (target <10%).
- Shipped v1.1 to production and added `SENDEN-GEREKENLER.md`, listing the assets, accounts and decisions still needed from the owner alongside the known gaps.
- Added the project README with fresh production screenshots under `docs/screenshots/`; the old `screenshots/` shots predate the galaxy rewrite.
