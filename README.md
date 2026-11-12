<div align="center">

<img src="docs/media/hero.svg" alt="Galactic Archives — a holographic galaxy disc, a route plotted along hyperlanes and a lava world" — a navigable 3D atlas of a galaxy far, far away" width="100%">

<p>
  <a href="https://galactic-archives.vercel.app/galaxy"><img alt="Live demo" src="https://img.shields.io/badge/live%20demo-jump%20to%20hyperspace-ffd23f?style=for-the-badge&labelColor=050506"></a>
  <img alt="Three.js" src="https://img.shields.io/badge/three.js-raw%20WebGL2-4fc3ff?style=for-the-badge&labelColor=050506">
  <img alt="Tauri" src="https://img.shields.io/badge/Tauri%20v2-macOS%20.dmg-ff4d4d?style=for-the-badge&labelColor=050506">
  <img alt="License" src="https://img.shields.io/badge/license-MIT-ffd23f?style=for-the-badge&labelColor=050506">
</p>

<p><em>A fan-made 3D atlas: fly from the galaxy disc to a star system and down to a planet's surface in one camera move.<br>
Every world is drawn live by a procedural GLSL shader, and every line of lore is sourced.</em></p>

<a href="https://galactic-archives.vercel.app/galaxy"><img src="docs/screenshots/galaxy-map.jpg" alt="The galaxy map with hyperlanes and allegiance colours" width="100%"></a>

</div>

<img src="docs/media/divider.svg" width="100%" alt="">

## What it is

Galactic Archives turns the galaxy into a navigable atlas. The planets are lit by their suns, with atmosphere scattering, cloud and ring shadows, city lights on the night side and a terminator that moves with the real clock. On top of that sit three layers:

- **Holocron**: a fully bilingual, cross-linked wiki of 88 bodies, 33 figures and 83 sourced codex entries.
- **Eras**: Clone Wars, Empire and New Republic (plus the Old Republic with Legends on). Switch era and the galaxy changes: Alderaan breaks, the Death Star enters orbit, Ilum becomes Starkiller Base.
- **Hyperspace network**: 23 lanes drawn on canon grid squares, each one clickable, shareable and flyable.

> **No backend, no account, no API calls.** All data is static JSON and all visuals are raw three.js. The same codebase ships to Vercel and, through Tauri v2, as a macOS `.dmg`.

<img src="docs/media/divider.svg" width="100%" alt="">

## The armoury

| | |
|---|---|
| **Three-level hierarchy** | Galaxy disc → star system → planet surface, joined by camera flights instead of cuts. |
| **Living planets** | 12 surface archetypes, KTX2 albedo maps for 88 worlds, 12 night maps and relief derived from the textures. |
| **Light and shadow** | Sun-aware scattering, a sunset band, cloud / ring / moon eclipse shadows, lens flare and ice glint. |
| **Hyperspace lanes** | 23 lanes and 308 stops; share one with `?lane=<id>`, fly six of them end to end. |
| **Route planner** | Pick two worlds and the course is plotted along the lanes, with the distance in parsecs. |
| **HoloNet ticker** | Sourced headlines from the selected era; click one to fly to its world. |
| **Bounty board · Sabacc** | Canon contracts tied to their worlds, and a three-round Corellian Spike game against a dealer droid. |
| **Ambient sound** | A soundscape synthesised per planet archetype. Optional, and there are no audio files. |
| **Compare** | Two to four live globes side by side at true diameter ratio, shareable by URL. |
| **Command palette** | <kbd>⌘</kbd> <kbd>K</kbd> fuzzy search that understands Turkish characters. |

<table>
  <tr>
    <td width="33%"><img src="docs/screenshots/planet-mustafar.jpg" alt="A lava world with sun-lit atmosphere"></td>
    <td width="33%"><img src="docs/screenshots/system-tatoo.jpg" alt="A binary star system with orbits"></td>
    <td width="33%"><img src="docs/screenshots/holocron.jpg" alt="The Holocron wiki"></td>
  </tr>
  <tr>
    <td align="center"><code>planet</code> · lava archetype</td>
    <td align="center"><code>system</code> · twin suns</td>
    <td align="center"><code>holocron</code> · sourced wiki</td>
  </tr>
</table>

<img src="docs/media/divider.svg" width="100%" alt="">

## Seven more rooms

<table>
  <tr>
    <td width="33%"><img src="docs/screenshots/timeline.jpg" alt="Timeline of battles and political events"></td>
    <td width="33%"><img src="docs/screenshots/hangar.jpg" alt="The hangar with ship blueprints"></td>
    <td width="33%"><img src="docs/screenshots/force.jpg" alt="Force lore, from intermediate to master"></td>
  </tr>
  <tr>
    <td align="center"><code>/timeline</code> · battles, politics, Jedi &amp; Sith</td>
    <td align="center"><code>/hangar</code> · blueprints by era</td>
    <td align="center"><code>/force</code> · powers by level</td>
  </tr>
  <tr>
    <td><img src="docs/screenshots/watch-guide.jpg" alt="Watch guide"></td>
    <td><img src="docs/screenshots/compare.jpg" alt="Compare globes at true size"></td>
    <td><img src="docs/screenshots/relationships.jpg" alt="Relationship explorer"></td>
  </tr>
  <tr>
    <td align="center"><code>/watch-guide</code> · live action, animation</td>
    <td align="center"><code>/compare</code> · true diameter ratio</td>
    <td align="center">relationship explorer</td>
  </tr>
</table>

| Route | Room |
|---|---|
| `/galaxy` · `/system/:id` · `/planet/:id` | The three-level atlas, joined by camera flights |
| `/holocron` · `/holocron/planet/:id` · `/holocron/character/:id` | The bilingual, cross-linked wiki |
| `/timeline` | Battles, political events and the Jedi &amp; Sith story on one axis |
| `/hangar` | Starships by era, each with an SVG blueprint and clickable component hotspots |
| `/force` | Force powers from intermediate to master |
| `/watch-guide` | Live action, animation and the Clone Wars era in watching order |
| `/compare` | Two to four live globes at true diameter ratio, shareable by URL |

<img src="docs/media/divider.svg" width="100%" alt="">

## Tools in the archive

| Tool | What it does |
|---|---|
| **Guided tours** | Narrated routes through the galaxy. The player owns navigation: each stop swaps the planet and the arriving view plays its flight. Six lane tours fly a hyperlane end to end. |
| **Holocron trial** | A quiz whose verdict picks a path, and each path is an authored tour. Right and wrong are announced, not shown by colour alone. |
| **Cockpit HUD** | Flight telemetry and a targeting computer: wireframe vectors, sublight throttle and deflector balance. |
| **Hyperspace jump** | A full-screen particle jump between worlds. |
| **Galactic ID** | Generates a character identity (archetype, homeworld, name) and a downloadable holo-ID card drawn with the Canvas API. |
| **Aurebesh translator** | Type and read the galaxy's script; copying only reports success when the clipboard really accepted it. |
| **Lightsaber chamber** | The seven classic combat forms with their history. |
| **Bounty board · Sabacc** | Canon contracts tied to their worlds, and a three-round Corellian Spike game against a dealer droid. |
| **Droid voice** | A droid vocabulator synthesised live with Web Audio. |
| **Favourites and recents** | Saved worlds, recent records and saved tours, kept in the browser. |

<img src="docs/media/divider.svg" width="100%" alt="">

## Every line has a source

Lore is the part of a fan project that rots fastest, so provenance is built in. Every body and character records the Wookieepedia article it came from and which infobox fields were taken from it (`lib/sources.ts`, with a generation date). Every starship, battle, Force power, timeline event, watch-guide entry and transmission ends in a citation line that links back to its article. If a field is not sourced, it is not shown.

<img src="docs/media/divider.svg" width="100%" alt="">

## The planet foundry

```mermaid
flowchart LR
  D[data/planets/*.json] --> L[lore.ts] --> R[renderRecipe<br/>archetype · palette · atmosphere]
  R --> M[body-material.ts] --> U[uber-shader<br/>12 archetype branches]
  K[KTX2 albedo + night maps<br/>lazy, LRU cached] --> U
  U --> E[engine-base<br/>flyTo · bloom · ACES]
  G[galaxy / system / planet engines] --> E
  C[sim-clock · real time] --> E
  E --> W[WebGL2]
```

**By the numbers:** 88 bodies · 33 figures · 172 points of interest · 23 lanes · 308 stops · 15 battles · 12 archetypes · 4 eras.

<img src="docs/media/divider.svg" width="100%" alt="">

## Türkçe özet

**Galactic Archives**, Star Wars galaksisini gezilebilir bir 3B atlasa çeviren bir hayran projesi. Galaksi diskinden yıldız sistemine, oradan gezegen yüzeyine kesintisiz kamera uçuşuyla iniliyor. Her dünya gerçek zamanlı GLSL shader'larla çiziliyor. İçinde iki dilli Holocron wiki'si, döneme göre değişen galaksi, 23 hiperuzay hattı, rota planlayıcı, sabacc ve ödül panosu var. Backend yok; tüm veri statik JSON. Web'de Vercel'de, masaüstünde Tauri ile macOS uygulaması olarak çalışıyor.

<img src="docs/media/divider.svg" width="100%" alt="">

## Development

Requires Node.js `>= 22` and a WebGL2 browser. Dependencies live in `app/`, not the repo root.

```sh
cd app
npm install
npm run dev         # http://localhost:5173
npm test            # vitest
npm run e2e         # Playwright
npm run verify      # everything, the pre-commit gate
npm run desktop     # Tauri v2 macOS build (Rust toolchain + Xcode CLT)
```

No environment variables, no database, no keys: all data is in the repo.

<img src="docs/media/divider.svg" width="100%" alt="">

## License

Code is **MIT**. Lore text is sourced from **Wookieepedia (CC BY-SA)** and shared under the same licence. This is an unofficial fan project, **not affiliated with Lucasfilm or Disney**. Star Wars and all related names belong to Lucasfilm Ltd. No copyrighted images, logos or audio are distributed.

<div align="center">
<br>
<a href="https://github.com/kutluhangil"><img src="docs/media/signature.svg" width="100%" alt="Built by kutluhangil"></a>
<sub>Made for a galaxy far, far away · unofficial fan project · the banner is original artwork.</sub>
</div>
