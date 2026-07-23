# design.md — Görsel Varlık Üretim Brief'i (Gemini)
### Galactic Archives · v1.0 · 23 Temmuz 2026

Bu dosya, benim kod/shader ile üretemeyeceğim (veya AI üretiminin daha iyi olacağı) **tüm görsel varlıkların** Gemini prompt'larını içerir. Prompt'lar İngilizce (görüntü modelleri İngilizce'de en iyi sonucu verir) — açıklamalar Türkçe.

---

## 0. ÖNEMLİ: Üç varlık sınıfı ve şeffaflık kuralı

Sen "hepsi transparan .png olsun" demiştin — burada kritik bir düzeltme var:

| Sınıf | Ne | Arka plan | Neden |
|-------|----|-----------|-------|
| **A — Gezegen doku haritaları** | Küreye sarılan equirectangular haritalar | **OPAK (şeffaflık YASAK)** | Doku kürenin her pikselini kaplar; şeffaflık delik demektir. Kenardan kenara dolu üretilmeli |
| **B — UI/dekor öğeleri** | Nebulalar, ışık izleri, süsler | **ŞEFFAF PNG** | Sahneye/panele bindirilir |
| **C — Karakter holo-portreleri** | Mavi hologram büstler | **ŞEFFAF PNG** | Kartlara bindirilir |

> Gemini şeffaf PNG üretmeyi reddederse (bazı sürümler etmez): B ve C sınıfını **düz siyah (#000000) arka planla** üret — ben kodda "additive blend" ile bindiririm, siyah otomatik kaybolur. Bu yüzden B/C prompt'larının hepsinde "on pure black background" yedeği var.

### Sınıf A — zorunlu teknik kurallar (her prompt'un çekirdeği)
- **En-boy oranı 2:1** (genişlik = 2 × yükseklik). Hedef **4096×2048**; model 2048×1024 verirse kabul, upscale bende (Real-ESRGAN).
- **Equirectangular projeksiyon**: düz harita, KÜRE RENDERI DEĞİL. Prompt'ta "flat map" vurgusu şart, yoksa model üç boyutlu top çizer.
- **Yatay dikişsizlik**: sol ve sağ kenar birleşmeli. (Kontrolü bende: %50 offset scripti. Dikiş çıkarsa aynı prompt'a "left and right edges must tile seamlessly" ekleyip yeniden üret.)
- **Kutup bozulması**: en üst ve en alt satırlar tek renge yakınsamalı (kutupta girdap/leke istemiyoruz).
- **Albedo saflığı**: gölge, atmosfer pusu, bulut, ışıklandırma PİŞMEMİŞ olmalı — ben ışıklandırmayı shader'da yapıyorum.
- Yazı/etiket/filigran/çerçeve YASAK.

**Her Sınıf A prompt'unun başına yapıştırılacak sabit ön ek (STYLE-A):**
```
Seamless equirectangular planet texture map, flat 2:1 cartographic projection
(like a raw NASA Blue Marble satellite mosaic laid flat), full surface coverage
pole to pole, left and right edges tile seamlessly, pure albedo/diffuse color
only — no baked lighting, no shadows, no atmospheric haze, no clouds, no sphere,
no globe render, no 3D ball, no text, no labels, no watermark, no borders.
Photorealistic natural color grading, cinematic Star Wars aesthetic,
extremely fine terrain detail, 8k quality.
SURFACE:
```
**Negatif prompt (destekliyorsa):** `sphere, globe, planet ball, 3D render, starfield, space background, text, watermark, label, frame, border, clouds, atmosphere, lens flare, vignette`

---

## 1. SINIF A — Gezegen dokuları (34 gezegen + aylar)

Dosya adlandırma: `raw/planets/<id>/<map>.png` → örn. `raw/planets/tatooine/albedo.png`

Aşağıda her satır: **STYLE-A + verilen SURFACE metni**. Ek haritası olanlar ayrıca belirtildi.

### 1.1 Tatooine — `albedo`
```
Endless desert world: vast rolling dune seas in pale gold and butterscotch,
wind-rippled sand patterns, rocky badlands and flat-topped mesas in ochre and
burnt sienna, dry canyon networks, cracked salt flats, a few huge ancient dry
seabed depressions slightly darker, scattered small impact craters. No water,
no ice caps, no vegetation anywhere.
```

### 1.2 Coruscant — `albedo` + `night`
`albedo`:
```
Ecumenopolis — the entire planet is one continuous city: dense geometric grid
of megastructure blocks at continental scale, gunmetal gray, steel and silver
towers forming fine circuit-board-like urban patterns, deep shadowed canyon
lines between districts, several colossal radial avenue patterns converging on
monumental government districts, one small white polar ice cap, no oceans,
no vegetation, no bare ground.
```
`night` (gece ışık haritası — motor gece tarafında bunu parlatır):
```
Night-side city lights emission map of an ecumenopolis on pure black background:
the entire surface glows as an intricate golden-white grid of city lights,
brighter cores at district centers, radial glowing avenues, faint cooler blue
industrial zones, tiny dark maintenance patches. Flat 2:1 equirectangular map,
seamless left-right, no text, no sphere.
```

### 1.3 Naboo — `albedo` (+ ortak bulut haritası CLOUD-TEMPERATE kullanılır)
```
Serene temperate world: rolling emerald-green grassy plains, patchwork of
hundreds of lakes and winding silver rivers, large swampy lowland regions in
deep green-brown, gentle forested hills, a few calm blue inland seas, small
clean white polar caps. Lush, idyllic, painterly-real like northern Italy
from orbit.
```

### 1.4 Alderaan — `albedo` (+ CLOUD-TEMPERATE)
```
Pristine peaceful world: majestic snow-capped mountain ranges crossing green
alpine meadows, calm deep-blue seas, wide temperate plains, glacial lakes,
white polar caps. Earth-like but more serene and orderly, Switzerland-from-
orbit feeling, untouched and luminous.
```
*(Yıkılmış hali doku istemez — asteroit alanı prosedürel.)*

### 1.5 Hoth — `albedo`
```
Frozen ice world: pale blue-white glacial plains, long wind-carved ice ridges
(sastrugi) flowing in parallel streaks, deep blue crevasse networks and fissure
lines, frozen ocean sheets with subtle pressure-ridge textures, sparse dark
gray rock outcrops near the equator only. Almost entirely white-blue.
```

### 1.6 Dagobah — `albedo`
```
Swamp world: dark murky wetlands covering everything — muddy green-brown
marshes, black winding water channels, dense gnarled forest canopy in deep
olive and moss greens, algae-covered lagoons, mist-colored pale lowland
patches, no open oceans, no ice caps, no deserts. Oppressive, humid, primeval.
```

### 1.7 Bespin — `albedo` (gaz devi bant haritası)
```
Gas giant cloud bands: soft horizontal strata in warm peach, cream, apricot,
rust-orange and dusty rose, subtle turbulent swirls and eddies between bands,
a few pale storm ovals, gentle feathered band borders. Jupiter-like structure
but warm orange-pink palette, dreamy and luminous.
```

### 1.8 Endor sistemi
`endor-prime/albedo` (gaz devi):
```
Gas giant cloud bands in muted silver-green and gray-jade tones, wide calm
bands with faint turquoise storm streaks, soft elegant palette.
```
`endor-moon/albedo` (Orman Ayı):
```
Unbroken temperate forest moon: dense dark-green coniferous redwood canopy
covering nearly everything, occasional small blue lakes, soft mountain ridges
under forest, tiny meadow clearings, small polar caps. Deep lush green world.
```
`kef-bir/albedo`:
```
Stormy ocean moon: dark teal and slate-green seas with whitecap wave textures,
scattered small green grassy islets in chains, churning water patterns, no
large landmasses, moody and windswept.
```

### 1.9 Yavin sistemi
`yavin-prime/albedo`:
```
Massive gas giant: bold crimson, vermilion and dark red cloud bands, huge
churning storm systems, deep maroon shadows between bands, imposing and
ominous red palette.
```
`yavin-4/albedo`:
```
Tropical jungle moon: dense deep-green rainforest canopy, wide muddy brown
rivers snaking through jungle, volcanic ridge lines, scattered ancient
clearings, humid haze-free pure surface color, no deserts, no ice.
```

### 1.10 Mustafar — `albedo` + `emissive`
`albedo`:
```
Volcanic hellscape: jet-black basalt crust fractured by branching channels,
obsidian mountain ranges, dark ash plains, cooled lava fields with ropey
textures, deep fissure networks, ember-gray crater fields. Mostly black and
very dark gray surface with dried rust-colored mineral stains.
```
`emissive` (lav ışıma maskesi):
```
Lava emission mask on pure black background: only the glowing elements —
branching rivers of molten orange-yellow lava, lava lakes with bright cores,
thin glowing fissure cracks spreading like lightning veins across dark zones.
Everything not glowing is pure black. Flat 2:1 equirectangular, seamless
left-right edges, no text.
```

### 1.11 Kamino — `albedo`
```
Endless storm ocean world: dark steel-blue and slate-gray sea covering 100%
of the surface, massive spiral storm cell patterns, long white-streaked wave
fronts, foam textures, churning cyclone swirls, absolutely no land anywhere.
```

### 1.12 Geonosis — `albedo` + `ring`
`albedo`:
```
Red rock desert world: rust, terracotta and brick-red canyonlands, dry
riverbed networks, mesa fields, wind-eroded rock formations, darker speckled
clusters of tall organic hive-spire mounds casting no shadows, dry salt pans,
no water, no vegetation, no ice.
```
`ring` (halka şeridi — 2048×256, yatay dikişsiz):
```
Planetary ring texture strip, wide horizontal band on pure black background:
dusty rocky ring material in rust-brown and pale sand tones, density varying
in concentric streaks, some translucent gaps. Flat strip, tileable
horizontally, 8:1 wide aspect, no planet, no stars, no text.
```

### 1.13 Kashyyyk — `albedo` (+ CLOUD-TEMPERATE)
```
Forest world of colossal trees: continent-spanning dark green wroshyr tree
canopy with visible mega-tree crown clusters, silver-green coastal bands of
beaches, one large deep-blue ocean, river deltas cutting the forest, small
polar caps. Rich saturated greens.
```

### 1.14 Utapau — `albedo`
```
Arid limestone world: pale bone-white, cream and tan rocky plains pockmarked
by enormous deep circular sinkhole craters with dark shadowed interiors and
concentric terraced rims, dry cracked seabeds between sinkholes, windswept
dust plains, no surface water, no vegetation visible from orbit.
```

### 1.15 Felucia — `albedo`
```
Psychedelic fungal jungle world: translucent teal, turquoise, magenta and
amber fungal canopy in organic blotches, giant mushroom forest clusters,
bioluminescent speckled regions, humid marsh channels in deep cyan, vivid
alien saturated colors like a coral reef spread over land.
```

### 1.16 Jakku — `albedo`
```
Harsh bleached desert: pale beige and bone-white sand plains, gypsum flats,
wind-scoured rock spires, long dark furrow scars from ancient crashed
starships scattered across one hemisphere, dry canyon lands, no water,
no vegetation.
```

### 1.17 Takodana — `albedo` (+ CLOUD-TEMPERATE)
```
Lush temperate world: broad deciduous forests in warm summer greens, hundreds
of mirror-blue lakes, soft green hills, mossy valleys, small mountain chains,
gentle river networks, small polar caps. Welcoming, storybook-beautiful.
```

### 1.18 Ahch-To — `albedo` (+ CLOUD-STORM)
```
Cold ocean world: slate-blue and gray-green seas with storm streak textures,
scattered tiny steep rocky islands in chains — dark cliffs topped with vivid
green grass, whitecap patterns around island chains, moody North Atlantic
feeling, no continents.
```

### 1.19 Crait — `albedo`
```
White salt-crust world: blinding white salt flats covering everything, with
crimson-red mineral soil exposed in cracks, canyon lines and impact streaks —
like red flesh under white skin, dry lake patterns, rusty red mountain ridges
piercing the crust, no water, no vegetation.
```

### 1.20 Exegol — `albedo`
```
Dark Sith world: charcoal-gray cracked desert plain, vast geometric fissure
networks, obsidian monolith field clusters, dry electrostatic scarring in
pale gray streaks, ancient dark stone structures barely visible, uniformly
grim near-monochrome surface.
```

### 1.21 Ilum / Starkiller — `albedo` + `starkiller-variant`
`albedo` (saf Ilum):
```
Glacial crystal world: blue-white ice sheets, crystalline mountain ridges
with faceted glints, deep sapphire crystal canyon networks, frozen plains
with subtle prismatic sheen, small dark rock exposures, purer and bluer
than a normal ice world.
```
`starkiller-variant` (era değişimi için):
```
Same glacial crystal world but converted into a weapon: a colossal dark
artificial trench slices the equator — a deep machined canyon with geometric
metallic walls, surrounding ice stained gray by industry, giant dark circular
weapon aperture on one hemisphere, angular excavation scars radiating from
the trench. Ice world violated by machinery.
```

### 1.22 Scarif — `albedo` (+ CLOUD-TEMPERATE)
```
Tropical archipelago world: shallow luminous turquoise seas, chains of ring
atolls and sandbars, white sand beaches, palm-green islets, deeper blue ocean
trenches between island groups, a few larger jungle islands, paradise-like.
```

### 1.23 Jedha — `albedo`
```
Cold desert moon: dusty amber, gray and sandstone mesas, ancient eroded
plateau fields, dry canyon networks, thin white frost at the poles, one
region with a colossal circular destruction crater surrounded by radial
debris streaks (recent catastrophic blast scar), scattered ruins speckle.
```

### 1.24 Corellia — `albedo` + `night`
`albedo`:
```
Urban-industrial temperate world: gray sprawling coastal megacities with
visible geometric shipyard grids, brown-green polluted countryside, murky
river deltas, industrial haze-stained coastlines, patches of remaining
farmland, choppy gray-blue oceans.
```
`night`:
```
Night lights emission map on pure black: dense golden city light clusters
along coastlines, bright geometric shipyard complexes, connecting highway
light lines, dark countryside between. Flat 2:1 equirectangular, seamless.
```

### 1.25 Kessel — `albedo`
```
Barren mining world: pale yellow-gray crusted surface, huge dark terraced
open-pit mine spirals, scattered craters, dusty ridges, dark spice mine
entrance clusters, chemical-stained pale streaks, lifeless and exploited.
```

### 1.26 Mandalore — `albedo`
```
Glassed desert world: vast vitrified white-gray crystalline deserts with
subtle iridescent sheen patches, geometric scarring from ancient orbital
bombardment, cubic dome-city footprints scattered as small hexagonal marks,
dark beskar mine terraces, pale dust storms regions, hauntingly beautiful
wasteland.
```

### 1.27 Nevarro — `albedo` (+ Mustafar tarzı hafif `emissive` opsiyonel)
```
Volcanic frontier world: dark basalt plains, dry black lava channel networks,
ash-gray flats, a few thin glowing lava rivers in canyons, sparse green river
valleys cutting through black rock, rugged frontier feeling, mostly dark
charcoal tones with rare green.
```

### 1.28 Lothal — `albedo`
```
Prairie world: endless golden-tan grass steppes, scattered clusters of tall
narrow rock spires casting long shadows... (no shadows — pure albedo: just
the spires as small dark dots), winding blue creeks, a few round blue lakes,
small white settlements as tiny specks, warm golden palette with big-sky
serenity.
```

### 1.29 Dathomir — `albedo`
```
Blood-red world: crimson and dark-red rocky badlands, black bog lowlands,
deep red twisted forest regions, maroon mist-stained plateaus, dark fissures,
ominous witch-world palette of reds, blacks and grays only.
```

### 1.30 Ryloth — `albedo`
```
Harsh canyon world: ochre, brown and rust badlands carved by enormous canyon
networks, one hemisphere pale and sun-scorched with bleached desert, the
other cooler with darker rock and shadowed valleys, dry salt pans, cave
entrance clusters as dark specks.
```

### 1.31 Peridea — `albedo` + `bone-ring`
`albedo`:
```
Ashen extragalactic wasteland: pale gray-lavender dust plains, red-brown
eroded rock fields, dry ancient seabeds, scattered colossal statue ruins as
tiny dark specks, ash dune regions, sparse dead forests in dark gray,
melancholic muted palette of grays, mauves and rust.
```
`bone-ring` (halka şeridi, Geonosis ring spec'iyle aynı format):
```
Planetary ring texture strip on pure black background: fragments of colossal
pale bones, vertebrae and ivory debris mixed with gray dust, ghostly
white-bone palette, density varying in streaks, translucent dusty gaps.
Tileable horizontally, 8:1 aspect, no text.
```

### 1.32 Ferrix — `albedo`
```
Rust-brown industrial world: brick-red and terracotta urban sprawl patches,
vast scrapyard fields with metallic glints, ochre dry plains, quarry scars,
dusty roads connecting settlements, worker-town warmth in oxidized tones.
```

### 1.33 Nal Hutta — `albedo` (+ CLOUD-SICKLY)
```
Polluted swamp world: sickly yellow-green marshes, oily black bog networks
with iridescent chemical sheen, industrial smog-stained brown zones, greasy
winding rivers, strip-mined scars, no clean water, nauseating green-brown
palette.
```

### 1.34 Shakari — `albedo` + `night`
`albedo`:
```
Smog-shrouded city world: dark slate and asphalt-gray dense urban grid
covering most land, elevated industrial districts, narrow dark bay waters,
soot-stained blocks, 1920s-metropolis-of-the-galaxy density, grim and gritty.
```
`night`:
```
Night lights emission map on pure black: dense neon city glow — electric
violet, cyan and warm amber district clusters, glowing avenue grids,
flickering industrial zones, prohibition-era metropolis at night from orbit.
Flat 2:1 equirectangular, seamless.
```

### 1.35 Bonus aylar
`nar-shaddaa/albedo` + `night` → Coruscant prompt'unun "grimy, rusted, neon-stained vertical slum city" varyantı.
`concordia/albedo` → "gray cratered moon with hidden forested crater valleys and small mining scars".
`tatooine-moons` → prosedürel (dokusuz), gerek yok.

### 1.36 Ortak bulut haritaları (3 adet, tüm gezegenlerde paylaşılır)
Format: 2:1, **saf siyah zemin üstüne yalnız beyaz/gri bulutlar** (ben alfa kanalına çeviririm), dikişsiz.
- `CLOUD-TEMPERATE`: `Realistic cloud coverage map on pure black background: white cumulus clusters, long cirrus streaks, one or two small cyclonic swirls, about 40% coverage, natural Earth-like distribution. Flat 2:1 equirectangular, seamless left-right, no land, no color, white clouds only.`
- `CLOUD-STORM`: aynısı + `heavy storm fronts, large spiral cyclones, 65% coverage, dramatic`.
- `CLOUD-SICKLY`: aynısı + `thin smoggy haze bands and dirty streaks instead of clean clouds, 30% coverage` (Nal Hutta/Shakari).

### 1.37 Death Star greeble dokusu (prosedürel modele giydirilecek)
```
Seamless tileable sci-fi hull greeble texture, top-down orthographic flat
view on neutral gray metal: dense panels, vents, trenches, turret bases,
window dot rows, industrial detail in light and dark gray only, Death Star
surface style, perfectly flat with no perspective, no curvature, no text,
tileable on all four edges, 2048x2048.
```

---

## 2. SINIF B — Şeffaf dekor/efekt öğeleri

Hepsi: `isolated on transparent background (PNG alpha). If transparency is
not possible: on pure black background.` + `no text, no watermark`.

| Dosya | Boyut | Prompt |
|-------|-------|--------|
| `fx/nebula-blue.png` | 2048² | `Wispy deep-space nebula cloud, cold blue and cyan translucent gas layers, soft feathered edges fading out completely at borders, volumetric glow, isolated element` |
| `fx/nebula-red.png` | 2048² | aynı, `crimson and ember-orange` (Peridea göğü / Maelstrom) |
| `fx/nebula-green.png` | 2048² | aynı, `sickly green and yellow` (Hutt Space) |
| `fx/nebula-violet.png` | 2048² | aynı, `deep violet and magenta` (Unknown Regions) |
| `fx/galaxy-core.png` | 4096×2048 | `Bright galactic core seen from within the galactic disk: dense warm star glow band, dust lane silhouettes, soft light bloom, fades to nothing at edges, isolated` |
| `fx/hyperspace-streak.png` | 1024×256 | `Single elongated star streak light trail, blue-white core with soft falloff, motion-blur style, horizontal, isolated` |
| `fx/sun-flare-warm.png` | 1024² | `Soft warm sun glow sprite with subtle horizontal lens streak, golden-orange, radial falloff to nothing, isolated` |
| `fx/sun-flare-cool.png` | 1024² | aynı, `pale blue-white` |
| `fx/explosion-debris.png` | 1024² | `Cluster of small dark rocky asteroid silhouettes with faint rim light, scattered composition, isolated` (Alderaan alanı sprite yedeği) |

**Kod ile ÜRETECEKLERİM (Gemini'ye GEREK YOK — daha keskin olur):**
yıldız alanı, hipersıçrama tüneli (shader), gezegen halkalarının prosedürel yedeği, hedefleme retikülü, holo-panel çerçeveleri, tarama çizgileri, fraksiyon sembolleri (Rebel/Empire/Republic/First Order/Mandalorian — SVG olarak birebir çizerim), Aurebesh süslemeler (font ile), holocron yükleme küpü (CSS 3D), tüm UI ikonları (lucide + özel SVG), Death Star 3D modeli (prosedürel geometri + §1.37 dokusu), Cloud City / Tipoca City basit siluet modelleri (low-poly, ben).

---

## 3. SINIF C — Karakter holo-portreleri (32 adet)

**Stil kilidi — her prompt'un ön eki (STYLE-C):**
```
Stylized Star Wars hologram bust portrait, translucent glowing blue monochrome
hologram made of light, subtle horizontal scanlines and slight edge flicker,
head and shoulders composition facing slightly left, dark empty surroundings,
volumetric cyan glow, elegant and iconic, no photorealistic human skin —
luminous hologram material only, isolated on transparent background
(fallback: pure black background), no text.
```
> Not: Oyuncu adı YAZMIYORUZ (benzerlik hakkı). Karakteri kostüm/siluetiyle tanımlıyoruz — holo stili zaten yüz benzerliği beklentisini düşürür. Boyut: 1024×1280 dikey.

| Dosya | SUBJECT eki |
|-------|-------------|
| `holo/luke-skywalker.png` | `young farmboy Jedi in simple tunic, shaggy hair, hopeful gaze, lightsaber hilt at chest` |
| `holo/leia-organa.png` | `young royal leader with iconic double side-bun hairstyle, white senatorial gown collar, determined` |
| `holo/han-solo.png` | `roguish smuggler, open collar shirt and vest, crooked confident smirk` |
| `holo/chewbacca.png` | `tall Wookiee warrior, long flowing fur, bandolier strap across chest` |
| `holo/darth-vader.png` | `imposing dark lord in angular black helmet with skull-like breath mask and dome, high armored collar, cape` |
| `holo/anakin-skywalker.png` | `intense young Jedi knight with shoulder-length wavy hair, scar over right eye, dark robes` |
| `holo/obi-wan-kenobi.png` | `wise bearded Jedi master in hooded robe, gentle knowing expression` |
| `holo/yoda.png` | `small ancient alien Jedi master, large pointed ears, wrinkled serene face, tiny robe` |
| `holo/palpatine.png` | `hooded ancient Sith emperor, deeply wrinkled shadowed face, malicious grin under dark cowl` |
| `holo/padme-amidala.png` | `regal young queen in ornate headdress and ceremonial collar, painted royal composure` |
| `holo/qui-gon-jinn.png` | `tall long-haired bearded Jedi master, calm rebel wisdom` |
| `holo/darth-maul.png` | `horned Zabrak Sith, face of sharp tattoo patterns, intense burning eyes` |
| `holo/count-dooku.png` | `aristocratic elderly Sith lord, neat white beard, high elegant cape collar` |
| `holo/general-grievous.png` | `skeletal cyborg general, elongated alien skull-mask head, hunched armored shoulders, cape` |
| `holo/ahsoka-tano.png` | `Togruta warrior with long striped montrals and head-tails, confident smile, two lightsaber hilts` |
| `holo/captain-rex.png` | `clone trooper captain, short blond buzz cut, jaig-eyes marked helmet held at side` |
| `holo/thrawn.png` | `blue-skinned alien grand admiral with glowing red eyes, immaculate white imperial uniform, calculating` |
| `holo/ezra-bridger.png` | `young street-smart Jedi padawan, tousled dark hair, energy slingshot wrist device` |
| `holo/kanan-jarrus.png` | `ponytailed Jedi survivor with short beard and armored shoulder plate` |
| `holo/hera-syndulla.png` | `Twi'lek pilot with head-tails under flight cap and goggles, warm leadership` |
| `holo/sabine-wren.png` | `young Mandalorian artist, asymmetric colorful-implied hair, painted beskar armor` |
| `holo/din-djarin.png` | `Mandalorian bounty hunter in T-visor beskar helmet, weathered cape, stoic` |
| `holo/grogu.png` | `tiny green alien child with huge ears and big dark eyes, small robe, adorable` |
| `holo/boba-fett.png` | `battle-scarred Mandalorian in dented T-visor helmet with antenna, cool menace` |
| `holo/bo-katan.png` | `Mandalorian warrior princess, short hair, owl-crest helmet at side` |
| `holo/cassian-andor.png` | `weary rebel intelligence officer, dark jacket, guarded intense eyes` |
| `holo/jyn-erso.png` | `defiant young rebel, scarf and field jacket, fierce hope` |
| `holo/mon-mothma.png` | `composed senator in white robe with hood down, chain of office, quiet steel` |
| `holo/rey.png` | `desert scavenger with triple hair-bun style, staff over shoulder, wraps and belts` |
| `holo/kylo-ren.png` | `dark warrior in ragged hood over angular masked helmet with silver seams` |
| `holo/poe-dameron.png` | `hotshot pilot in rebel flight suit, tousled hair, cocky grin` |
| `holo/finn.png` | `earnest defector soldier in brown leather jacket, resolute expression` |
| `holo/lando-calrissian.png` | `suave gambler in elegant cape with wide collar, charming grin, mustache` |
| `holo/jabba-the-hutt.png` | `massive slug-like crime lord alien, wide toad mouth, heavy-lidded eyes, thick coiled tail body` |

---

## 4. SINIF D — Landing & marka görselleri

| Dosya | Boyut | Not |
|-------|-------|-----|
| `brand/logo.svg` | — | **BEN yapacağım** (Star Jedi font + SVG outline; isim kararından sonra) |
| `brand/og-card-bg.png` | 2400×1260 | `Cinematic wide space vista: dark starfield, distant warm galactic core band, one striking desert planet with twin suns partially lit at right third, deep blacks, subtle blue nebula left, premium minimal composition, no text, no logos` |
| `brand/landing-hero-planet.png` | — | GEREK YOK — landing 3D canlı render (gerçek motor) |
| `brand/app-icon.png` | 1024², **opak** | `App icon: minimalist glowing holocron cube — dark translucent cube with bright cyan inner light and gold edge circuits, floating on deep black rounded-square background, centered, premium flat-3D style, no text` |

---

## 5. Ses varlıkları envanteri (Gemini değil — ayrı üretim)

Karar §13-2'ye (PLAN.md) bağlı. Slot listesi hazır olsun:

**Müzik slotları (`public/audio/music/`):** `landing.mp3`, `galaxy.mp3`, `holocron.mp3` + arketip başına ambient: `desert / city / ice / swamp / lava / ocean / forest / dark / wasteland` (9). ACE-Step seçilirse üretim prompt'larını ben yazarım ("slow mysterious desert wind ambient with distant brass motif, cinematic, no melody theft" tarzı).

**SFX (`public/audio/sfx/`):** çoğu WebAudio sentez (kodda, dosyasız): ui-hover, ui-select, panel-open, era-shift, reticle-lock. Dosya gerekebilecekler: `hyperspace-jump.wav`, `hyperspace-exit.wav`, `planet-whoosh.wav` — ElevenLabs SFX ile üretebilirim (skill mevcut) veya sen eklersin.

---

## 6. Üretim iş akışı ve kalite kontrol

1. Gemini'de **STYLE-A/C öneki + SURFACE/SUBJECT** birleştir, üret.
2. İlk parti öneri sırası (P1 kahraman gezegenleri): Tatooine, Coruscant (+night), Mustafar (+emissive), Hoth, Bespin → bana ver → motorda test edip stil kilidini onaylayalım, SONRA kalan 29'u seri üret. (Toplu üretimden önce stil onayı = yeniden üretim maliyetini önler.)
3. Her dosyayı `raw/planets/<id>/` altına koy; ben script ile: dikiş testi → upscale → KTX2 → kalite katmanları.
4. Reddedilen/dikişli çıkanlar için prompt'a eklenecek onarım cümleleri bu dosyanın §0'ında.

### Teslim kontrol tablosu (özet)
| Parti | İçerik | Adet |
|-------|--------|------|
| 1 | 5 kahraman gezegen (7 harita: 5 albedo + Coruscant night + Mustafar emissive) | 7 |
| 2 | Kalan 29 Tier-S albedo + 4 ek night/emissive + 2 ring şeridi | ~35 |
| 3 | 3 bulut haritası + 9 FX sprite + greeble + og-card + app-icon | 15 |
| 4 | 32 holo-portre | 32 |
| **Toplam** | | **~89 varlık** |
