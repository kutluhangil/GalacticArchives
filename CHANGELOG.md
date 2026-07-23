# Changelog

## 2026-07-23

- Removed all audio: synthesized SFX, the music slot system and the sound settings are gone.
- Replaced the hyperspace flash between views with a continuous camera approach (galaxy and system engines fly to the clicked body, the arriving view continues the dive).
- Galaxy map nodes now render as real archetype-shaded worlds with a faction halo instead of flat sprites.
- Deleted the leftover LEO LIVE satellite tracker: `/legacy` route, globe engine, TLE data and Earth textures (-3.5 MB from the deploy).
- Rebuilt the galaxy disk: log-spiral arms with inter-arm field stars, unresolved nebula haze, dust lanes and a barred bulge, all as three point clouds instead of ~1300 sprites.
- Star rendering reworked: gaussian point sprites with a power-law brightness spread, so starfields stop reading as uniform confetti.
