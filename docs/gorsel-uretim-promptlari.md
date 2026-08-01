# Görsel üretim promptları — Galactic Archives (tam liste)

Bu dosya, projede **kod tarafı hazır ama görseli olmayan** her varlık için tek tek prompt
içerir. Açıklamalar Türkçe, promptlar İngilizce (görsel modeller İngilizce promptta belirgin
şekilde daha isabetli). Her prompt kopyala-yapıştır hazırdır; sonuna **STYLE BIBLE** bloğu
eklenecektir — 200'ün üzerinde görsel tek bir görsel dile otursun diye tek değişmez kural.

`docs/gemini-image-prompts.md` bu dosyanın öncülüydü (5 gezegen + şablonlar). **Bu dosya onun
yerine geçer**; oradaki beş prompt burada da, aynı numaralandırma içinde yer alıyor.

---

## 0. Ne eksik — envanter

| Bölüm | Varlık | Adet | Yol | Durum |
|---|---|---|---|---|
| A | Gezegen albedo doku haritası (79 gezegen + 5 detaylı ay) | 84 | `app/raw/planets/<id>-albedo.png` | hiçbiri yok, hepsi prosedürel |
| B | Gece ışıkları haritası (yalnız şehir dünyaları) | 12 | `app/raw/planets/<id>-night.png` | hiçbiri yok |
| C | İstasyon / megayapı yüzeyi (2 istasyon + Glavis + Polis Massa) | 4 | `app/raw/planets/<id>-albedo.png` | hiçbiri yok |
| D | Holocron kart görseli | 88 | `app/public/cards/<id>.webp` | CSS radial-gradient |
| E | Karakter holo-büstü | 33 | `app/public/portraits/<id>.webp` | 4 SVG siluetin hash'i |
| F | Marka görselleri (ikon, OG yedeği, README afişi) | 3 | aşağıda | SVG'den türetiliyor |
| G | Ekran görüntüleri | 6 | `docs/screenshots/` | **sende değil, bende** — tarayıcıdan ben çekerim |

Toplam üretilecek: **224 görsel** (A 84 + B 12 + C 4 + D 88 + E 33 + F 3). G bende.

`validate-lore` deposu 88 gövde sayıyor: 81 gezegen dosyası + 2 istasyon + gezegen dosyalarının
içindeki 5 detaylı ay (Endor orman ayı, Kef Bir, Concordia, Nar Shaddaa, Yavin 4). Aylar da
kendi id'leriyle doku ve kart alır.

### Üretilmeyecekler (bilerek)

- **`clouds` haritası.** Boru hattı (`process-textures.mjs`) kabul ediyor ama runtime
  (`planet-textures.ts::applySurfaceTextures`) yalnız `albedo` ve `night` uygulanıyor. Bulut
  katmanı prosedürel shader'dan geliyor. Üretmek boşa iş.
- **`emissive` haritası.** `mustafar` reçetesinde yazıyor, hiçbir yerde okunmuyor. Lav parlaması
  shader'dan geliyor.
- **Gerçek yüz portresi.** Karar bozulmuyor: oyuncu benzerliği hem hak hem tutarlılık sorunu.
  Bölüm E hologram büstü üretir, portre değil.

---

## STYLE BIBLE — her promptun sonuna eklenecek blok

Her promptun son satırındaki `[STYLE BIBLE]` yerine **aynen bu blok** yapıştırılacak:

```
STYLE BIBLE:
Grounded practical-effects science fiction, 1977–1983 optical-composite look.
Physically plausible geology and materials, no fantasy glow, no neon rim light.
Muted, slightly desaturated palette. Film grain is acceptable, digital sharpening is not.
Absolutely no text, no letters, no numbers, no logos, no watermarks, no UI, no frames,
no borders, no signature, no vignette.
Do not depict any real actor, any real person's face, or any trademarked ship, droid,
helmet or costume design.
```

---

## Bölüm A — Gezegen albedo doku haritaları (84)

`src/data/planets/` altında 81 dosya var; ikisi (Glavis Halka Dünyası, Polis Massa) yapay gövde
olduğu için Bölüm C'de. Dosyaların içinde ayrıca 5 detaylı ay var (A80–A84) — onlar da kendi
id'leriyle doku alır.

### Teknik gereksinimler (pazarlıksız)

| Alan | Değer |
|---|---|
| Projeksiyon | Equirectangular (plate carrée), **2:1** |
| Çözünürlük | 4096 × 2048 PNG |
| Dosya yolu | `app/raw/planets/<id>-albedo.png` |
| Işık | **Yok.** Düz albedo: gölge, terminatör, parlama, atmosfer halkası olmayacak |
| Küre | **Yok.** Düz harita: kenarda yuvarlaklık, uzay/yıldız arka planı olmayacak |
| Dikiş | Sol ve sağ kenar sorunsuz birleşmeli |

Üretim sonrası:

```bash
cd /Volumes/ProjectVault/GalacticArchives/app
node scripts/process-textures.mjs            # tüm yeni dosyaları işle
node scripts/process-textures.mjs tatooine   # tek dünya
```

Script yatay dikişi ölçer, tolerans (12) aşılırsa uyarır. Uyarı gelirse görseli yatayda %50
kaydır, ortadaki bindirmeyi klonlayarak düzelt, yeniden çalıştır.

**Öncelik sırası:** önce A70 Tatooine, A14 Coruscant, A51 Mustafar, A32 Hoth, A08 Bespin —
bu beşi motorda görüp stil kilidini onaylayalım, kalan 76'yı seri üretirsin.

---

### A01 — Ahch-To

`app/raw/planets/ahch-to-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a cold ocean world scattered with small volcanic islands, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no specular highlight.
Terrain: a single world-spanning ocean in slate blue-green (#41616E) deepening to near-black teal (#2A4450) in the abyssal basins, crossed by long lighter shelf currents. Land is rare: dozens of tiny steep-sided volcanic islands in scattered archipelagos, each with green-grey cliff terraces and a pale surf ring, plus two larger island clusters in the northern hemisphere. Storm-track streaking runs east-west across the mid latitudes.
No ice caps, no continents, no cities, no ships.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A02 — Alderaan

`app/raw/planets/alderaan-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a temperate garden world, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no specular highlight.
Terrain: broad continents of green meadow and mixed forest (#6E9E6A) with wide grass plains, meandering river valleys and lakes, three long snow-capped mountain ranges running north-south, and pale blue-white oceans (#B9CFE0) with gentle continental shelves. Everything reads calm, cultivated and unspoiled: no deserts, no industrial scars.
No ice sheets beyond small polar caps, no cities, no craters.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A03 — Aldhani

`app/raw/planets/aldhani-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a cold highland world, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no specular highlight.
Terrain: rolling grassy highlands in muted olive-green (#6E8456) over darker moss-green valley floors (#4A5C4A), long glacial valleys with narrow rivers, weathered grey stone ridges and escarpments, wide upland heath in ochre-brown, small tarns and peat lakes. Sparse tree cover confined to sheltered valleys.
No deserts, no cities, no ice caps beyond thin polar frost.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A04 — Arvala-7

`app/raw/planets/arvala-7-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a dry, cratered mud-desert world, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no specular highlight.
Terrain: hardened cracked mud flats in dull tan (#A98C6B) over darker brown bedrock (#6E5A45), wide shallow impact-like basins, deeply incised dry canyon networks, wind-carved rock spurs, dust plains with fine ripple patterning. Colour variation is low: this is a worn, exhausted world.
No open water, no vegetation, no ice, no cities.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A05 — At Attin

`app/raw/planets/at-attin-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a temperate forest world with orderly settled belts, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no specular highlight.
Terrain: deep green mixed forest (#5C8A4E) covering most land, broken by unusually regular rectangular clearings of pale suburban development arranged in neat grids, low rolling hills, and calm teal-green seas (#3E6E72) with smooth shorelines. One very large geometric industrial complex sits on the largest continent, its footprint straight-edged and machine-like against the forest.
No deserts, no mountains taller than low ranges, no visible roads at continental scale.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A06 — Atollon

`app/raw/planets/atollon-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of an arid world covered in fossil coral formations, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no specular highlight.
Terrain: pale sand-orange desert plains (#C09A6E) interrupted by vast branching pale-grey coral-like rock structures that spread in ring and lattice patterns across the lowlands, darker brown mesas and caprock plateaus (#7A6248), sinkhole cave mouths clustered in the coral fields, and dry salt basins at the lowest elevations.
No open water, no green vegetation, no ice, no cities.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A07 — Batuu

`app/raw/planets/batuu-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a temperate frontier world of petrified spires, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no specular highlight.
Terrain: dry olive-khaki uplands (#8A9464) studded with dense fields of tall petrified stone spires that read as fine vertical stippling from orbit, darker brown-grey forest and scrub belts (#6B5A44), deep circular cenote pits with pale mineral rims, low eroded mountain chains, and a few shallow inland seas.
No open ocean, no ice caps, no cities.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A08 — Bespin

`app/raw/planets/bespin-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a gas giant, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no limb darkening.
Surface: horizontal banded cloud belts in warm peach and cream (#E8B48A) alternating with deeper rust-orange zones (#C97F5A), turbulent shear boundaries between belts, several elongated vortex storms and one large oval storm in the southern hemisphere, fine wispy ammonia cirrus over the lighter zones. Bands run strictly horizontally and stretch toward the poles.
No solid ground, no rings, no moons.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A09 — Cantonica

`app/raw/planets/cantonica-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a desert world with one artificial sea, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no specular highlight.
Terrain: pale golden sand desert covering nearly the whole surface (#D9C08A), long dune trains, dry mountain chains and gravel plains. On one continent a single large body of water with an unnaturally smooth, engineered coastline in cool grey-blue (#8FA6B8), its edge geometric rather than eroded, surrounded by a narrow belt of irrigated green.
No polar ice, no rivers, no natural coastline elsewhere.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A10 — Cato Neimoidia

`app/raw/planets/cato-neimoidia-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a world of rock arches over acidic seas, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no specular highlight.
Terrain: vast fields of natural stone arches and land bridges in pale ochre limestone (#B9A46A) spanning deep canyon systems, mossy green plateau tops (#6F7F5A), and wide shallow seas with a sickly yellow-green acidic tint and pale mineral crusts along their shores.
No ice, no true forest, no cities.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A11 — Chandrila

`app/raw/planets/chandrila-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a temperate world of rolling farmland and coasts, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no specular highlight.
Terrain: gentle green-gold rolling hills and cultivated plains (#7FA35E) in soft patchwork parcels, long calm coastlines with wide bays, deep blue-teal oceans (#3F6F86), scattered lakes, and modest grey coastal settlement patches at the largest river mouths. Low mountain ranges only, heavily weathered.
No deserts, no ice sheets beyond small polar caps, no industrial scars.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A12 — Christophsis

`app/raw/planets/christophsis-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a crystalline world, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no sparkle, no specular highlight.
Terrain: continents built of enormous pale blue crystal formations (#7FB6D9) growing in angular clusters and radiating shards, deep blue crystal basins and fracture fields (#2F5D80), broad flat crystalline plains that read as faceted plates from orbit, and a few dark mineral seams. Even without lighting, the faceting is drawn as tonal variation.
No water, no vegetation, no soil, no ice.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A13 — Corellia

`app/raw/planets/corellia-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a temperate industrial world, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no specular highlight.
Terrain: green forested and farmed continents (#5E7E62) heavily overwritten by grey industrial sprawl (#7E8898): sprawling shipyard districts along every major coastline, rectangular dockyard basins cut into the shore, rail and canal lines crossing the interior, brown polluted river deltas fanning into the sea, and slate-blue oceans with a dulled, silted coastal band.
No deserts, no ice sheets, no lit windows (that belongs to the night map).
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A14 — Coruscant

`app/raw/planets/coruscant-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a city-covered world (ecumenopolis), 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no lens flare.
Surface: 100% urban, pole to pole. Dense grey-steel megablocks (#8A93A6) cut by darker canyon avenues (#4A5568), enormous rectangular plazas, radial ring highways, industrial districts in warmer grey-brown, a few very large ceremonial plaza clearings. Structure is readable at continent scale: the grid varies in density and orientation between regions like tectonic plates.
No water, no vegetation, no clouds, no lit windows (that belongs to the night map).
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A15 — Crait

`app/raw/planets/crait-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a salt-crusted mineral world, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no specular highlight.
Terrain: vast blinding white salt flats (#EDEAE4) covering the lowlands, cracked into wide polygonal plates; beneath and through them, deep red mineral bedrock (#C23B2E) shows in canyon walls, fracture lines and long scrape-like exposures that bleed red across the white. Shallow briny seas with heavy salt rims, and dark eroded mountain ranges at the continental margins.
No vegetation, no ice, no cities.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A16 — Csilla

`app/raw/planets/csilla-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a frozen glacier world, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no sparkle, no specular highlight.
Terrain: a continuous ice sheet in cold pale blue-grey (#C7D6E6) with denser blue compression zones (#8FA6BE), long glacier flow lines curving around buried mountain ranges, wide crevasse fields, and dark circular cave-mouth openings clustered in the mid latitudes where the ice is thinnest. Wind-scoured plains with fine parallel striation.
No open water, no vegetation, no visible cities.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A17 — Dagobah

`app/raw/planets/dagobah-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a swamp world, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no specular highlight.
Terrain: dark olive-green swamp and bog covering nearly the whole surface (#4A5A3A), near-black waterlogged basins and bayous (#2E3A28), dense jungle canopy in slightly lighter green, a labyrinth of murky channels and standing water with no clear coastline — land and water interlock at every scale. A few low ridges of exposed brown rock.
No open ocean, no deserts, no ice, no cities.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A18 — Daiyu

`app/raw/planets/daiyu-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a rain-soaked city world, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no lens flare.
Surface: dense urban cover in cold blue-grey (#4A4E62) over most land, tightly packed harbour districts along long ragged coastlines, docks and breakwaters cut into every bay, elevated roadways crossing the interior as fine lines, and a dull violet-grey smog haze layer (#8E6FA8) drawn as flat tonal wash over the densest districts. Dark seas with silted brown estuaries.
No vegetation to speak of, no ice, no lit windows (that belongs to the night map).
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A19 — Dathomir

`app/raw/planets/dathomir-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a red-forest world, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no specular highlight.
Terrain: dark blood-red forest canopy (#7E2E28) covering most continents, near-black bog and swamp basins (#3E1A18), deep branching canyon systems with exposed rust-coloured rock walls, wide cave-mouth clusters in the highlands, and small dirty-white ice caps at both poles that contrast hard against the red.
No blue oceans — standing water is dark and tannin-stained. No cities.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A20 — D'Qar

`app/raw/planets/dqar-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a temperate jungle world, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no specular highlight.
Terrain: dense bright green jungle canopy (#4A7C3F) over the equatorial continents, darker blue-green forested highlands and river basins (#2F5A4E), wide grass plains in the temperate belts, meandering brown rivers, and modest inland seas. Canopy texture is fine-grained and unbroken, with clearings only along the rivers.
No deserts, no ice caps beyond thin polar frost, no cities.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A21 — Dromund Kaas

`app/raw/planets/dromund-kaas-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a dark, permanently storm-covered jungle world, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no lightning, no specular highlight.
Terrain: near-black blue-grey jungle and swamp (#26313A) over almost the entire land surface, the darkest basins reading as ink (#141C24), heavy river networks and flooded lowlands, sheer black rock escarpments, and sullen dark oceans with almost no tonal separation from the land. Overall value is very low and very even — a world that never sees direct sun.
No ice, no deserts, no bright colour anywhere, no cities.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A22 — Eadu

`app/raw/planets/eadu-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a cold, storm-scoured rock world, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no lightning, no specular highlight.
Terrain: dark grey-blue basalt highlands (#3A4048) cut by deep narrow ravines and knife-edged ridge lines, lighter weathered grey plateaus (#6C7480), long braided meltwater channels, wet scree slopes, and cold dark seas in the lowest basins. Everything reads wet, sharp and unwelcoming.
No vegetation, no sand, no ice sheets beyond thin high-altitude frost, no cities.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A23 — Endor (gas giant)

`app/raw/planets/endor-albedo.png`

Not: bu kayıt **gaz devi Endor**'un kendisi, orman ayı değil.

```
A seamless equirectangular 2:1 planetary albedo texture map of a pale green-grey gas giant, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no limb darkening.
Surface: soft horizontal cloud belts in muted sage green and pale grey-green (#AEC4B4) alternating with deeper grey-teal zones (#7E958C), gentle shear boundaries, two modest oval storms in the northern hemisphere, and fine wispy cirrus streaks over the lighter bands. Banding is calmer and lower in contrast than a classic Jovian giant.
No solid ground, no rings, no moons.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A24 — Eriadu

`app/raw/planets/eriadu-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a polluted industrial jungle world, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no specular highlight.
Terrain: dulled olive jungle and forest (#6B7A55) visibly degraded toward brown at its edges, dark brown-grey industrial sprawl and strip-mining scars (#4A4438) spreading outward from every river mouth, wide tailings fields and rectangular quarry pits, brown silt plumes where rivers meet the sea, and eroded mountain chains stripped bare of cover.
No ice, no clean coastline, no lit windows (that belongs to the night map).
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A25 — Exegol

`app/raw/planets/exegol-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a dead, cracked desert plain world, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no lightning, no specular highlight.
Terrain: near-uniform dark grey-violet dust plain (#3A3A44) covering the whole surface, fractured by a planet-wide network of thin black cracks and fissures (#23232B) that branch like dried mud at continental scale, shallow rectangular depressions, low ash ridges, and a few very large circular collapse basins.
No water, no vegetation, no ice, no visible structures.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A26 — Felucia

`app/raw/planets/felucia-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a fungal jungle world, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no bioluminescence, no specular highlight.
Terrain: dense canopy of giant fungal growth in teal-green (#3E8E7E) mottled with broad patches of magenta and violet (#A84E8E) where different species dominate, sprawling swamp basins in darker green, pale spore plains, and slow brown rivers. The colour mottling is organic and patchy, never striped or symmetric.
No deserts, no ice, no cities. Colour is saturated but the light stays flat.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A27 — Ferrix

`app/raw/planets/ferrix-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a cold, rust-coloured salvage world, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no specular highlight.
Terrain: dry rust-orange plains and flat-topped mesas (#A8624E) over darker brown bedrock (#6E4438), extensive scrapyard fields drawn as fine granular grey-brown mottling around the settlements, compact brick-coloured town footprints at canyon mouths, thin irrigated farm strips following the few rivers, and dry salt basins.
No ocean, no forest, no ice, no lit windows (that belongs to the night map).
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A28 — Geonosis

`app/raw/planets/geonosis-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a hot red desert world, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no specular highlight.
Terrain: red-orange sand and gravel deserts (#B5654A) over darker iron-red bedrock (#7E3E2E), extensive fields of flat-topped mesas and buttes, deep dry canyon systems, wide dust plains with wind streaking, and clusters of tall termite-mound-like spires reading as dense stippled texture across two mid-latitude regions.
No water, no vegetation, no ice, no polar caps.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A29 — Ghorman

`app/raw/planets/ghorman-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a temperate mountain-and-valley world, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no specular highlight.
Terrain: green upland plains and mixed forest (#6F8A5A) between long parallel mountain chains, wide golden-brown cultivated valley floors (#8A7550) following the rivers, terraced farmland patterning on the lower slopes, alpine lakes, and modest blue-grey seas. Grey-white snow only on the highest ridge lines.
No deserts, no industrial sprawl, no cities at continental scale.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A30 — Hosnian Prime

`app/raw/planets/hosnian-prime-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a temperate city world, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no lens flare.
Surface: continent-wide urban cover in cool grey-blue (#8E96A8) cut by darker avenue canyons (#5A6478), large circular civic districts with radial street patterns, orderly rectangular megablocks, wide green park belts and canals threading between districts, and calm blue seas with fully built-out, geometric coastlines.
No deserts, no wilderness, no lit windows (that belongs to the night map).
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A31 — Hoth

`app/raw/planets/hoth-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a frozen ice world, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no sparkle, no specular highlight.
Terrain: continuous ice sheet in near-white blue (#DCE9F5) with colder blue-grey compression zones (#9FC0DE), crevasse fields, glacier flow lines curving around buried mountain ranges, wind-scoured sastrugi plains, a few exposed dark rock ridges and meteor impact craters near the equator.
No open water, no vegetation, no settlements.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A32 — Ilum

`app/raw/planets/ilum-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of an ice world with crystal-bearing glaciers, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no sparkle, no specular highlight.
Terrain: bright white-blue ice sheet (#DCEBFA) with deeper glacial blue crevasse fields and flow lines (#7FA8D0), broad frozen plains, exposed dark grey mountain ridges, sparse dark conifer forest in the sheltered low valleys, and several very large circular excavation pits cut into the ice where mining has stripped the glacier down to bedrock.
No open water, no cities, no glowing crystal.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A33 — Jakku

`app/raw/planets/jakku-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a desert world littered with battle wreckage, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no specular highlight.
Terrain: pale wind-blown sand seas (#D9C49A) over tan bedrock (#A08A64), long linear dune trains, isolated rock spires and eroded arch formations, dry gravel basins, and one broad equatorial belt where the sand is peppered with dark irregular debris scars and shallow impact gouges — a graveyard field read only as dark mottling, never as recognisable ships.
No water, no vegetation, no ice, no cities.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A34 — Jedha (ay)

`app/raw/planets/jedha-albedo.png`

```
A seamless equirectangular 2:1 lunar albedo texture map of a cold desert moon with a catastrophic blast scar, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no specular highlight.
Terrain: pale grey-tan sand deserts and dust plains (#B8A488) over darker brown mesas and escarpments (#6E5E4C), old crater fields, dry canyon networks. In one hemisphere a single enormous circular blast basin with a raised shattered rim, radial ejecta streaks reaching a third of the way around the moon, and exposed darker mantle rock at its centre.
No water, no vegetation, no ice, no cities.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A35 — Kamino

`app/raw/planets/kamino-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a world-covering storm ocean, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no lightning, no specular highlight.
Terrain: an unbroken ocean, no land anywhere. Deep steel blue (#33506B) in the open water, near-black (#1E3348) in the abyssal zones, with long spiral storm-track patterns and pale wind-driven foam streaks organised into banded latitudes. Shallower pale shelf areas mark the few submerged plateaus.
No islands, no ice caps, no coastline, no structures.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A36 — Kashyyyk

`app/raw/planets/kashyyyk-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a giant-forest world, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no specular highlight.
Terrain: deep green unbroken forest canopy (#356B38) over nearly all land, darkest in the old-growth interior (#1F4A28), wide coastal swamp and mangrove belts, long shallow tropical seas in blue-green, chains of forested islands, and low mountain ranges whose slopes stay forested to the ridge line.
No deserts, no ice caps beyond thin polar frost, no cities.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A37 — Kessel

`app/raw/planets/kessel-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a mining world split between scarred north and green south, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no specular highlight.
Terrain: the northern hemisphere is pale bone-grey mining ground (#C8BC9E) shot through with rectangular open pits, spoil heaps, and a dense lattice of access cuts; the southern hemisphere is muted green scrub and forest sanctuary (#5E7E4E) with rivers and small lakes. The two halves meet along a ragged, obviously artificial boundary.
No ocean, no ice, no cities.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A38 — Kijimi

`app/raw/planets/kijimi-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a frozen mountain world, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no sparkle, no specular highlight.
Terrain: pale blue-white snowfields (#C9D6E2) draped over dense, sharply folded mountain ranges that cover most of the surface, darker exposed grey rock on the steepest faces and ridge lines (#7E8CA0), narrow glacial valleys, and a single compact terraced settlement footprint hugging one mountainside, read as fine stepped grey texture.
No open water, no forest, no desert.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A39 — Korriban

`app/raw/planets/korriban-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a dead red tomb world, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no specular highlight.
Terrain: dark blood-red rock deserts and dust plains (#6E2B25) over near-black bedrock (#3A1512), long straight-walled valleys carved between eroded mountain ranges, wide fields of rectangular cut-stone excavation scars along the valley floors, dry riverbeds, and scattered dark cave mouths in the cliff faces.
No water, no vegetation, no ice, no living settlements.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A40 — Krownest

`app/raw/planets/krownest-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a frozen forest world, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no sparkle, no specular highlight.
Terrain: snow-covered plains and frozen lakes in pale blue-white (#D2E2EE) interlocking with dark blue-green conifer forest (#5E7A6E) that follows the valleys and lower slopes, sharp grey mountain ranges with snow-filled couloirs, and long frozen river courses reading as smooth pale ribbons through the trees.
No open ocean, no desert, no cities.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A41 — Lahmu

`app/raw/planets/lahmu-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a quiet temperate world with black sand coasts, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no specular highlight.
Terrain: dark grey-green volcanic lowlands and fertile plateaus (#3F4A44) with muted olive farmland patches (#6E7A5E), coastlines edged with distinctly black volcanic sand beaches, wide grey-blue seas, low weathered volcanic cones inland, and few rivers.
No deserts, no ice, no cities, no industry.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A42 — Lehon

`app/raw/planets/lehon-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a tropical island ocean world, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no specular highlight.
Terrain: warm turquoise-green shallow seas (#1E7A6E) over broad reef shelves, deepening to dark teal in the basins (#12463F), scattered across them dozens of small jungle-covered tropical islands with pale coral beaches, a handful of larger islands with rocky interior outcroppings, and long reef arcs visible as pale lines.
No continents, no ice, no deserts, no cities.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A43 — Lothal

`app/raw/planets/lothal-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a golden prairie world, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no specular highlight.
Terrain: vast golden-tan grass prairies and savanna (#C8A855) covering most land, muted green river valleys and wetland belts (#6E8E5E), fields of isolated flat-topped rock spires standing in the open plain, shallow marshes, and modest blue lakes. A few grey industrial patches sit at the edge of the largest plain.
No deserts, no ice, no dense forest, no ocean.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A44 — Malachor

`app/raw/planets/malachor-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a shattered, lifeless world, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no specular highlight.
Terrain: dark grey-brown wasteland (#4A3A3A) fractured by wide dark-red fissure systems (#8C2E28) that radiate from a single enormous impact-like scar, fields of angular shattered rock, deep sinkholes and collapsed cavern roofs, and dust plains streaked with iron-red fallout.
No water, no vegetation, no ice, no intact structures.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A45 — Manaan

`app/raw/planets/manaan-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a calm world-covering ocean, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no specular highlight.
Terrain: an unbroken ocean in clear mid-blue (#2E6E8C), deepening to navy in the abyssal trenches (#1B4358), with large pale turquoise shallow banks marking submerged plateaus, gentle current swirls, and a scattering of very small low islands and sandbars in the equatorial belt.
No continents, no ice caps, no storms, no structures.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A46 — Mandalore

`app/raw/planets/mandalore-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a glassed desert world, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no sparkle, no specular highlight.
Terrain: pale bone-white glassed desert (#D8D4C8) covering most of the surface, its texture smooth and fused rather than granular, with faint concentric fusion rings around the largest bombardment centres; grey-green unfused highlands and remnant forest surviving at the margins (#8E9498); dark rectangular mine workings in the mountains; and several large circular city footprints reading as fused, geometric depressions.
No open water, no ice, no lit windows.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A47 — Mimban

`app/raw/planets/mimban-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a mud-and-rainforest world, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no specular highlight.
Terrain: wide churned mud fields in dull khaki-brown (#4E4A38) surrounding every settlement and mine, olive rainforest and swamp covering the rest (#6E6B4E), sluggish silt-brown rivers braiding across the lowlands, standing water pools, and long parallel excavation trenches cut into the mud plains.
No ocean, no desert, no ice, no clear coastline.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A48 — Moraband

`app/raw/planets/moraband-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of an ancient red tomb world, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no specular highlight.
Terrain: rust-red rock deserts and desolate valley systems (#8C3A2A) over near-black bedrock (#3A1A16), long eroded mountain chains, wide dry basins that were once seas, dark cave mouths and rectangular cut-stone scars clustered in one great valley, and fine wind streaking downwind of the ridges.
No water, no vegetation, no ice, no living settlements.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A49 — Morak

`app/raw/planets/morak-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a humid mountain-rainforest world, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no specular highlight.
Terrain: dense dark green rainforest (#3E6B3F) blanketing steep folded mountain ranges, dull olive-brown cleared ridges and terraces (#5E5A3A), narrow deep river gorges, a few rectangular industrial clearings with access roads cut through the canopy, and small upland lakes.
No ocean, no desert, no ice, no cities at continental scale.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A50 — Mustafar

`app/raw/planets/mustafar-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a volcanic lava world, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no terminator, no bloom.
Terrain: near-black basalt and obsidian crust (#1A1210) fractured by branching rivers and broad seas of incandescent molten rock (#FF5A1F), cooling crust plates floating on the larger lava seas, grey ash plains downwind of the main vents, jagged obsidian ridge chains, collapsed caldera basins. Molten channels form a believable drainage network, not scattered blobs.
No water, no vegetation, no ice.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A51 — Mygeeto

`app/raw/planets/mygeeto-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a frozen crystalline world, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no sparkle, no specular highlight.
Terrain: ice plains in cold white-blue (#D7E6F2) interrupted everywhere by fields of angular crystal formations growing in vertical clusters, blue-grey glacial troughs and crevasse belts (#8FA9C4), and one very large frozen city footprint read as a rigid rectangular grid half-buried under the ice, its blocks indistinguishable in colour from the crystal around them.
No open water, no vegetation, no desert.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A52 — Naboo

`app/raw/planets/naboo-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a temperate world of plains, swamps and lakes, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no specular highlight.
Terrain: green rolling plains and farmland (#5E8A4F) across the main continent, dense swamp and lake country in the interior lowlands, deep blue seas (#3E6E8E) with long fjord-like inlets, grass-covered hill ranges, and a scattering of small pale settlement footprints at the lake margins. Unusual detail: several very large near-circular lake and sinkhole features suggesting a hollow, water-filled interior.
No deserts, no ice sheets beyond small polar caps, no industry.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A53 — Nal Hutta

`app/raw/planets/nal-hutta-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a polluted swamp world, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no specular highlight.
Terrain: sickly yellow-green bogs and mud flats (#7E7E3E) covering most of the surface, darker olive swamp forest and peat basins (#4E5228), broad industrial sprawl in dull grey-brown eating into the wetlands from every settlement, oil-slick tinted standing water, and sluggish rivers with heavy silt plumes.
No clean ocean, no deserts, no ice, no bright colour.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A54 — Narkina 5

`app/raw/planets/narkina-5-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of an ocean world with scattered rock islands, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no specular highlight.
Terrain: a cold grey-blue ocean covering almost everything (#3C5666), lighter shelf water over the submerged plateaus (#8FA6B4), long wind-driven swell patterns organised into latitude bands, small bare rock islands and reefs in loose chains, and a handful of very large rectangular artificial platforms standing offshore, their outlines rigidly geometric against the water.
No continents, no ice caps, no vegetation.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A55 — Nevarro

`app/raw/planets/nevarro-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a volcanic ash world with green river valleys, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no bloom.
Terrain: dark grey-black ash plains and old lava fields (#2E2A28) covering most of the surface, active molten fissure lines and vent chains in glowing orange (#E86A2C) confined to two volcanic belts, jagged basalt ridges, and — in sharp contrast — narrow bright green river valleys with cultivated banks threading between the ash fields.
No ocean, no ice, no dune deserts.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A56 — Numidian Prime

`app/raw/planets/numidian-prime-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a warm jungle world, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no specular highlight.
Terrain: dense green jungle canopy (#3F7A48) over broad continents, dark blue-green swamp basins and river deltas (#2B5C55), wide brown rivers braiding toward warm shallow seas, coastal mangrove belts, and low forested hill ranges. Canopy texture is fine and continuous, broken only by water.
No deserts, no ice, no cities.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A57 — Onderon

`app/raw/planets/onderon-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a jungle world with one great walled city, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no specular highlight.
Terrain: thick green jungle (#4E7A45) across the continents, deep blue-green rivers and inland seas (#2E5C6E), rocky highland plateaus rising out of the canopy, and a single large circular city footprint on a plateau, its outline a clean ring wall with radial internal structure — the only geometric feature on the planet.
No deserts, no ice, no industrial sprawl.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A58 — Ossus

`app/raw/planets/ossus-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of an old temperate world of forests and gorges, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no specular highlight.
Terrain: olive-green forest and open woodland (#5E7A3E) over ancient worn continents, darker green-grey mountain forest (#3E5A46), very deep and very long gorge systems cutting across the plateaus, dry sun-bleached grassland on the leeward sides, cave-mouth clusters in the gorge walls, and shrunken inland seas ringed with pale mineral flats.
No ice caps, no deserts of sand, no cities.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A59 — Pasaana

`app/raw/planets/pasaana-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a golden desert world, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no specular highlight.
Terrain: bright golden sand seas (#E0C07E) with long crescent dune fields, darker ochre gravel plains and bedrock outcrops (#A9814D), wide flat basins of unusually smooth, pale sand marking the sinking fields, eroded mountain chains at the continental margins, and fine wind streaking aligned east-west.
No water, no vegetation, no ice, no cities.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A60 — Peridea

`app/raw/planets/peridea-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a pale, ash-covered world, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no specular highlight.
Terrain: wide barren plains of pale grey-lilac ash and dust (#B0A8B0), dry brown-grey rock ranges and mesas (#7E6E68), broad meadows of dead pale grass reading as a slightly warmer flat tone, shallow dry lake basins with salt rims, and long dust streaks trailing from the ridges. Overall palette is desaturated to the point of looking bleached.
No ocean, no green vegetation, no ice, no cities.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A61 — Plazir-15

`app/raw/planets/plazir-15-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a temperate marsh-and-grassland world, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no specular highlight.
Terrain: broad green grass plains (#5C7F5E) laced with freshwater marshes, reed beds and shallow lakes, olive-brown cultivated belts (#7E8C6A), slow meandering rivers, and one large perfectly circular domed-city footprint whose rim is geometric and whose interior reads as fine ordered grey texture.
No ocean, no deserts, no ice, no mountains beyond low hills.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A62 — Ryloth

`app/raw/planets/ryloth-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a world split between scorched waste and shadowed canyons, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no specular highlight.
Terrain: one hemisphere is burnt orange-brown scorched rock and dust (#B87E4E); the opposite hemisphere is darker brown (#6E4E38) with deep canyon networks and mesa fields; between them a narrow habitable twilight belt of muted green jungle strips following the canyon floors. Volcanic cone clusters and long dry riverbeds cross the wastes.
No ocean, no ice, no sand dunes at continental scale.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A63 — Saleucami

`app/raw/planets/saleucami-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a mixed desert world with oases and volcanoes, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no specular highlight.
Terrain: warm tan deserts and gravel plains (#C8A87A) over darker brown bedrock (#7E6A4B), sharply defined green oasis patches and swamp basins fed by underground water, dark volcanic cone fields with old lava aprons, eroded mountain chains, and dry salt flats between the ranges.
No ocean, no ice, no cities.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A64 — Savareen

`app/raw/planets/savareen-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a desert world with a single long coastline, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no specular highlight.
Terrain: pale sand deserts and dune fields (#CDAE84) covering the interior, a narrow band of rocky cliffs and pale beaches where the desert meets a cold grey-blue ocean (#5E7C86), a few compact refinery footprints hugging the shore, dry wadis running to the coast, and salt pans just inland.
No ice, no forest, no rivers with water in them.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A65 — Scarif

`app/raw/planets/scarif-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a tropical atoll world, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no specular highlight.
Terrain: brilliant turquoise shallow seas (#3FA8A0) covering most of the surface over pale sand banks, deeper green-teal basins (#2E7E5E), long chains of coral atolls and low jungle-covered islands with white beach rings, and one larger island cluster with dense palm canopy and a few straight-edged artificial causeways between islands.
No continents, no ice, no deserts.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A66 — Seatos

`app/raw/planets/seatos-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a quiet forest-and-ocean world with ruins, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no specular highlight.
Terrain: dark green-teal forest (#3E6A55) across a few modest continents, deep blue-grey oceans (#2D4F62) with rocky coasts and sea stacks, upland moor in muted brown, and one small circular arrangement of ancient stone ruins on a coastal plateau, read as a faint pale ring in the canopy.
No deserts, no ice, no modern cities.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A67 — Serenno

`app/raw/planets/serenno-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a temperate world of forests, savannah and estates, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no specular highlight.
Terrain: green mixed forest over rolling country (#5B7A4A), broad golden savannah belts (#8A7B4F), long mountain ranges with forested flanks, deep river valleys, and unusually regular pale rectangular estate parcels scattered through the lowlands — cultivated, orderly, aristocratic land use visible at continental scale.
No deserts, no ice sheets, no industry.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A68 — Shakari (ay)

`app/raw/planets/shakari-albedo.png`

```
A seamless equirectangular 2:1 lunar albedo texture map of a smog-shrouded industrial city moon, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no lens flare.
Surface: dense urban cover pole to pole in dark grey-violet (#4E4A50) with near-black industrial districts (#2A282E), tightly packed blocks cut by narrow canyon streets, vast refinery and foundry zones with rectangular tank farms, elevated transit lines crossing between districts, and a flat brown-grey smog wash pooling over the lowest quarters.
No water, no vegetation, no lit windows (that belongs to the night map).
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A69 — Sorgan

`app/raw/planets/sorgan-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a quiet forest-and-pond world, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no specular highlight.
Terrain: dark green coniferous forest (#46704A) covering most land, green-grey meadows and swamp margins (#2F5240), and thousands of small rectangular flooded ponds arranged in orderly clusters along the river valleys — visible from orbit as fine geometric stippling. Slow rivers, low hills, small lakes.
No ocean, no deserts, no ice, no cities.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A70 — Takodana

`app/raw/planets/takodana-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a temperate forest-and-lake world, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no specular highlight.
Terrain: lush green broadleaf forest (#4E7E4A) across gentle continents, many large deep blue lakes with intricate shorelines (#356E8E), open grass plains between the forests, slow rivers linking the lake systems, and low forested hills. One small pale stone settlement footprint sits on a lake shore.
No deserts, no ice, no mountains beyond hills.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A71 — Taris

`app/raw/planets/taris-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a ruined city world over open ocean, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no lens flare.
Surface: continent-sized urban sprawl in grey-steel (#7C8493) cut by dark avenue canyons (#4A515C), large districts visibly collapsed into rubble fields with irregular broken edges, orderly grids surviving only in patches, and wide blue-grey oceans between the built continents with debris-choked coastal shallows.
No vegetation, no ice, no lit windows.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A72 — Tatooine

`app/raw/planets/tatooine-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a hot arid desert world, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no atmospheric haze, no specular highlight.
Terrain: vast rolling dune seas in pale sand (#C9A36B), darker ochre bedrock plateaus (#8F6B45), deep branching canyon systems, dry cracked salt flats, scattered rocky bluffs and eroded mountain ranges concentrated in two mid-latitude belts. Faint dust-storm streaking aligned east-west.
No ice caps, no water, no vegetation, no visible settlements.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A73 — Trask (ay)

`app/raw/planets/trask-albedo.png`

```
A seamless equirectangular 2:1 lunar albedo texture map of a cold ocean moon with one harbour city, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no specular highlight.
Terrain: a cold grey-blue ocean across the whole surface (#3E5A6E), paler shelf water and foam-streaked swell in the storm belts (#7E96A6), scattered low rock islets, and a single compact harbour settlement built on pilings over a shallow bank, read as a small dense grey patch with straight breakwater lines.
No continents, no ice caps, no vegetation.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A74 — Tython

`app/raw/planets/tython-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of an untouched temperate world, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no specular highlight.
Terrain: open green grasslands and light forest (#6E8A4E) over broad continents, darker green-grey highland forest (#4A6A5A), long mountain ranges with bare rock summits, wide river plains, and one prominent isolated flat-topped mountain standing alone on a plain. Land use shows no settlement of any kind.
No deserts, no ice sheets beyond small polar caps, no cities.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A75 — Umbara

`app/raw/planets/umbara-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a sunless shadow world, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no bioluminescence, no specular highlight.
Terrain: very dark blue-black plains and jungle (#2A2F3E) across the whole surface, with cooler slate-blue ridge lines and plateau tops catching what little tonal separation exists (#5F7FA8), dense fields of thin vertical plant growth reading as fine directional stippling, deep unlit basins, and a few rigid geometric city footprints barely lighter than the ground.
No bright colour, no ice, no open ocean, no light sources.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A76 — Utapau

`app/raw/planets/utapau-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a dry world pitted with giant sinkholes, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no specular highlight.
Terrain: pale tan windswept rock plains and dry seabeds (#C8B896) over darker brown bedrock (#8E7E62), and — the defining feature — hundreds of large near-circular sinkholes scattered across the mid latitudes, each drawn as a dark ring with a stepped interior, some clustered into chains along fault lines. Long wind streaks trail from every ridge.
No open water, no vegetation, no ice.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A77 — Vandor

`app/raw/planets/vandor-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a cold alpine world, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no sparkle, no specular highlight.
Terrain: snow-covered mountain ranges in pale blue-white (#DCE6EE) dominating the land, exposed grey rock on the steep faces and ridges (#7C8B9C), broad snow plains between the ranges, fast rivers cutting dark lines down the valleys, and small dark stands of conifer forest at the lowest elevations.
No open ocean, no deserts, no cities.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A78 — Wobani

`app/raw/planets/wobani-albedo.png`

```
A seamless equirectangular 2:1 planetary albedo texture map of a grey mud-plain world, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no specular highlight.
Terrain: endless flat mud plains in drab grey-brown (#5A5344) over darker waterlogged basins (#3B382E), shallow standing water in wide featureless sheets, low bare hills, weathered rock formations breaking the flatness, and long straight scars of industrial excavation. The whole surface reads exhausted, colourless and used up.
No ocean, no forest, no ice, no bright tone anywhere.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A79 — Yavin (gas devi)

`app/raw/planets/yavin-albedo.png`

Not: bu kayıt **gaz devi Yavin Prime**, Yavin 4 ayı değil.

```
A seamless equirectangular 2:1 planetary albedo texture map of a deep red gas giant, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no limb darkening.
Surface: horizontal cloud belts in warm brick red and rust (#C24E3A) alternating with darker maroon zones (#8E2F26), strong turbulent shear between the belts, several oval storm vortices in both hemispheres including one large storm south of the equator, and fine cream-coloured cirrus streaks over the lighter bands. Bands run strictly horizontally and compress toward the poles.
No solid ground, no rings, no moons.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A80 — Endor (Orman Ayı)

`app/raw/planets/endor-moon-albedo.png`

```
A seamless equirectangular 2:1 lunar albedo texture map of a forest moon, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no specular highlight.
Terrain: dense dark green old-growth forest (#3F6B45) covering nearly all land, deeper green-black valley forest (#2C4A32), open golden savanna belts in the drier interior, forested mountain ranges, wide river systems and a few blue inland lakes and shallow seas.
No deserts, no ice caps, no cities.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A81 — Kef Bir

`app/raw/planets/kef-bir-albedo.png`

```
A seamless equirectangular 2:1 lunar albedo texture map of a stormy ocean moon, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no specular highlight.
Terrain: a cold green-grey world ocean (#2E5E5A) deepening to near-black in the basins (#1E3E42), heavy banded swell and foam streaks across the mid latitudes, and scattered low grassland islands with green interiors and dark cliff coasts, clustered into two loose archipelagos.
No continents, no ice caps, no cities.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A82 — Concordia

`app/raw/planets/concordia-albedo.png`

```
A seamless equirectangular 2:1 lunar albedo texture map of a forested mining moon, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no specular highlight.
Terrain: dark green conifer forest (#55704E) over steep mountain country, deeper forest shadow in the valleys (#3A4E38), bare grey rock summits, and rectangular open-cut mine workings with pale spoil heaps cut into several mountainsides — the only straight lines on the moon.
No ocean, no desert, no ice, no cities.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A83 — Nar Shaddaa

`app/raw/planets/nar-shaddaa-albedo.png`

```
A seamless equirectangular 2:1 lunar albedo texture map of a moon covered entirely by city, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no lens flare.
Surface: 100% urban, pole to pole, but grown rather than planned: grimy grey-brown megablocks (#6E6458) in mismatched districts at different orientations, dark canyon streets (#3E3830), stacked construction where new levels sit crookedly on old, spaceport pads cut into the sprawl, and a smog-stained tonal wash over the densest quarters.
No water, no vegetation, no lit windows (that belongs to the night map).
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A84 — Yavin 4

`app/raw/planets/yavin-4-albedo.png`

```
A seamless equirectangular 2:1 lunar albedo texture map of a jungle moon, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no specular highlight.
Terrain: dense emerald rainforest canopy (#2F6B3C) covering the whole surface, darker green river basins and swamp (#1E4A2A), wide brown rivers braiding through the jungle, small lakes, and a handful of pale stone step-pyramid clearings barely breaking the canopy.
No deserts, no ice, no ocean, no modern cities.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

---

## Bölüm B — Gece ışıkları haritaları (12)

Runtime `night` map'i **hangi dünya için varsa** uygular (`applySurfaceTextures`); reçetede
ayrıca tanımlamaya gerek yok. Bu yüzden liste, gece tarafında gerçekten ışık olacak
dünyalarla sınırlı — kırsal bir dünyaya gece haritası yapmak sahtelik olur.

| Alan | Değer |
|---|---|
| Projeksiyon | Equirectangular 2:1, 4096 × 2048 PNG |
| Dosya yolu | `app/raw/planets/<id>-night.png` |
| Arka plan | **Saf siyah (#000000)** — yalnızca yayılan şehir ışığı çizilir |
| Hizalama | Aynı dünyanın albedo haritasıyla **birebir aynı coğrafya** üstüne oturmalı |

Kural: ışık deseni o dünyanın albedo'sundaki kent yapısını takip eder. Önce albedo'yu üret,
gece haritasını onun üzerinden çıkar.

### B01 — Coruscant

`app/raw/planets/coruscant-night.png`

```
A seamless equirectangular 2:1 planetary NIGHT LIGHTS texture map of a city-covered world, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background.
Pure black background (#000000). Only emissive city light is drawn.
Warm amber-white light (#FFD9A0) tracing a planet-wide urban grid: dense cores that read almost solid, thinning toward sparse outskirts, thin bright lines along the major avenues, a handful of very bright civic districts. Light density varies strongly between regions.
No shadows, no bloom, no lens flare, no stars, no clouds, no daytime surface detail.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### B02 — Corellia

`app/raw/planets/corellia-night.png`

```
A seamless equirectangular 2:1 planetary NIGHT LIGHTS texture map of an industrial world, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background.
Pure black background (#000000). Only emissive light is drawn.
Cold white-blue light (#CFE0FF) concentrated in long continuous strips along every coastline where the shipyards run, brighter clustered nodes at the dockyard basins, thin lines following rail and canal routes inland, scattered small industrial glows in the interior, and completely dark forest and ocean between them. A few orange-tinted foundry patches break the blue.
No shadows, no bloom, no lens flare, no stars, no daytime surface detail.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### B03 — Shakari

`app/raw/planets/shakari-night.png`

```
A seamless equirectangular 2:1 lunar NIGHT LIGHTS texture map of a smog-covered industrial city moon, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background.
Pure black background (#000000). Only emissive light is drawn.
Dirty amber and sodium-orange light (#FFB06A) covering the whole surface unevenly, dimmed and diffused where smog is thickest so entire districts read as a muddy glow rather than points, sharp bright lines along elevated transit routes, intense white-hot flare stacks scattered through the refinery zones, and dark dead blocks where the city has been abandoned.
No shadows, no bloom, no lens flare, no stars, no daytime surface detail.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### B04 — Hosnian Prime

`app/raw/planets/hosnian-prime-night.png`

```
A seamless equirectangular 2:1 planetary NIGHT LIGHTS texture map of a temperate city world, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background.
Pure black background (#000000). Only emissive city light is drawn.
Clean cool-white light (#E8F0FF) in orderly patterns: bright radial civic hubs with concentric ring roads, evenly lit rectangular megablocks, dark bands where the park belts and canals run, and a sharp, fully lit coastline. The whole grid reads planned and uniform rather than organic.
No shadows, no bloom, no lens flare, no stars, no daytime surface detail.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### B05 — Daiyu

`app/raw/planets/daiyu-night.png`

```
A seamless equirectangular 2:1 planetary NIGHT LIGHTS texture map of a rainy harbour city world, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background.
Pure black background (#000000). Only emissive light is drawn.
Dense magenta, violet and cyan light (#C86AE8, #66D9FF) packed tightly along the coastlines and harbour districts, thinning quickly inland, bright quay lines outlining every dock and breakwater, scattered signage clusters reading as saturated blobs, and a soft diffused haze over the densest quarters where rain scatters the light.
No shadows, no bloom, no lens flare, no stars, no daytime surface detail, no readable text or symbols in the signage.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### B06 — Taris

`app/raw/planets/taris-night.png`

```
A seamless equirectangular 2:1 planetary NIGHT LIGHTS texture map of a half-ruined city world, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background.
Pure black background (#000000). Only emissive light is drawn.
Pale white-green light (#D8E8D0) surviving only in patches: a few districts still fully lit in dense grids, large areas completely dark where the city collapsed, ragged lit edges around the rubble fields, isolated single points deep in the dark zones, and no light at all over the oceans. The pattern reads as a city partly switched off.
No shadows, no bloom, no lens flare, no stars, no daytime surface detail.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### B07 — Chandrila

`app/raw/planets/chandrila-night.png`

```
A seamless equirectangular 2:1 planetary NIGHT LIGHTS texture map of a temperate coastal world, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background.
Pure black background (#000000). Only emissive light is drawn.
Warm soft-white light (#FFE6C0) in modest, well-separated coastal cities at the river mouths and bay heads, thin threads of light along the roads between them, faint dotted patterns over the farming plains, and vast fully dark interiors. Total lit area is small — a settled world, not a covered one.
No shadows, no bloom, no lens flare, no stars, no daytime surface detail.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### B08 — Cato Neimoidia

`app/raw/planets/cato-neimoidia-night.png`

```
A seamless equirectangular 2:1 planetary NIGHT LIGHTS texture map of a world of bridge cities, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background.
Pure black background (#000000). Only emissive light is drawn.
Warm gold light (#FFCE7A) that exists only along the natural rock arches: long curving lit ribbons spanning the canyons, brighter knots where a city sits at an arch's crown, and absolute darkness in the canyons below and on the plateau tops. The lit pattern reads as a network of arcs, not a grid.
No shadows, no bloom, no lens flare, no stars, no daytime surface detail.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### B09 — Ferrix

`app/raw/planets/ferrix-night.png`

```
A seamless equirectangular 2:1 planetary NIGHT LIGHTS texture map of a small salvage-town world, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background.
Pure black background (#000000). Only emissive light is drawn.
Sparse warm amber light (#FFBE7A) in a handful of compact town footprints at the canyon mouths, each a tight cluster of streets with a brighter centre, a few dim scattered points across the scrapyards, faint thin lines along the roads between towns, and everything else black.
No shadows, no bloom, no lens flare, no stars, no daytime surface detail.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### B10 — Kijimi

`app/raw/planets/kijimi-night.png`

```
A seamless equirectangular 2:1 planetary NIGHT LIGHTS texture map of a frozen mountain world, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background.
Pure black background (#000000). Only emissive light is drawn.
A single lit area: warm yellow-white light (#FFD9A0) climbing one mountainside in stacked terraces, the lines of light following the contour steps, brightest at the lowest terrace and thinning upward, with a few isolated points higher on the ridge. The entire rest of the map is black.
No shadows, no bloom, no lens flare, no stars, no daytime surface detail.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### B11 — Nal Hutta

`app/raw/planets/nal-hutta-night.png`

```
A seamless equirectangular 2:1 planetary NIGHT LIGHTS texture map of a polluted swamp world, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background.
Pure black background (#000000). Only emissive light is drawn.
Sickly yellow-green light (#D8E86A) in irregular sprawling blotches with no planning: industrial zones bleeding into swamp, scattered isolated compounds, orange flare points at the refineries, dim smeared glow where the light diffuses through low fog over the bogs, and large black stretches of untouched wetland.
No shadows, no bloom, no lens flare, no stars, no daytime surface detail.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### B12 — Nar Shaddaa

`app/raw/planets/nar-shaddaa-night.png`

```
A seamless equirectangular 2:1 lunar NIGHT LIGHTS texture map of a moon covered entirely by city, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background.
Pure black background (#000000). Only emissive light is drawn.
Dirty amber, green and magenta light (#FFB86A, #A8E86A, #E86AC8) mixed unevenly across the whole surface with no planning: bright chaotic entertainment districts, dead black blocks beside them, thin lit lines along the elevated skylanes, flare points at the spaceports, and a smeared glow where light scatters through smog.
No shadows, no bloom, no lens flare, no stars, no daytime surface detail, no readable text or symbols in the signage.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

---

## Bölüm C — İstasyonlar ve megayapılar (4)

Bunlar da küre olarak render ediliyor, yani aynı equirectangular kural geçerli. Reçetedeki
`stations/greeble` yolu **yükleyicinin okuduğu yol değil** — yükleyici manifest'i gövde id'si
ile arar. Dosyaları aşağıdaki adlarla ver, `process-textures.mjs` gerisini halleder.

### C01 — Ölüm Yıldızı (DS-1)

`app/raw/planets/death-star-albedo.png`

```
A seamless equirectangular 2:1 albedo texture map of a moon-sized artificial battle station hull, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no specular highlight.
Surface: a continuous machined hull of pale grey panelling (#9AA0A8) covered edge to edge in fine mechanical greeble — rectangular plating of varying sizes, trench lines, service channels, radiator grids, docking bay openings and antenna clusters — with darker grey recesses and shadow-line channels between panels (#5E646C). Along the equator, one wide continuous trench running the full width of the map. In the northern hemisphere, one very large circular concave dish recess with a stepped rim and radial internal structure.
No text, no insignia, no glowing elements, no ships.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### C02 — Ölüm Yıldızı II (DS-2, yarım inşa)

`app/raw/planets/death-star-2-albedo.png`

```
A seamless equirectangular 2:1 albedo texture map of an unfinished moon-sized battle station hull, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no specular highlight.
Surface: roughly half the map is finished pale grey hull panelling with dense mechanical greeble (#9AA0A8); the other half is open skeletal structure — exposed ring frames, radial girders, unplated cells and dark voids between them (#5E646C) — with a ragged, irregular boundary between finished and unfinished zones and scaffolding spurs reaching into the completed areas. A large circular dish recess sits within the finished hemisphere.
No text, no insignia, no glowing elements, no ships.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### C03 — Glavis Halka Dünyası

`app/raw/planets/glavis-ringworld-albedo.png`

```
A seamless equirectangular 2:1 albedo texture map of the inner surface of an artificial ring habitat, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no specular highlight.
Surface: a continuous inhabited deck read as long horizontal bands running the full width of the map — wide boulevards, dense block housing in pale grey (#8A8F98), darker service and sublevel strips (#4A4F58), rectangular plaza openings, transit lines running parallel to the bands, and repeating structural rib lines crossing them at regular intervals. Everything is manufactured; nothing is geological.
No water, no terrain, no text, no lit windows, no ships.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### C04 — Polis Massa

`app/raw/planets/polis-massa-albedo.png`

```
A seamless equirectangular 2:1 albedo texture map of an airless asteroid with a sealed research colony, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no specular highlight.
Terrain: bare grey rock (#6E6A66) heavily saturated with overlapping impact craters at every scale, dark regolith fill in the crater floors (#3A3835), long fracture lines from ancient breakup, and in one region a compact cluster of smooth artificial domes and straight-edged landing pads sunk flush into the rock, clearly manufactured against the cratered chaos.
No atmosphere effects, no water, no ice, no vegetation, no lit windows.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

---

## Bölüm D — Holocron kart görselleri (88)

Holocron ızgarasındaki kartlar (`src/pages/Holocron.tsx:164`) bugün gezegen paletinden üretilen
radial-gradient. Alderaan ile Chandrila aynı yeşil-gri leke; kart görseli bu yüzden şart.

| Alan | Değer |
|---|---|
| Oran | **2:1** |
| Çözünürlük | 1200 × 600 WebP (PNG ver, ben dönüştürürüm) |
| Dosya yolu | `app/public/cards/<id>.webp` |
| Kırpma | Kart yüksekliği 96 px, `object-cover` ortadan kırpar — önemli detay **merkezde** olmalı |

Bölüm A'dan farkı: burada **küre** isteniyor, uzayda, kart kapağı sanat yönüyle. Her promptun
ilk satırı aynı kalıptadır; yalnız dünyanın tarifi ve renkler değişir.

**Kod tarafı notu:** Görseller gelince `Holocron.tsx`'teki gradient `<div>` `<img>`'e çevrilecek,
görseli olmayan kayıtlar için gradient yedek kalacak. O değişikliği ben yaparım.

### D01 — Ahch-To
`app/public/cards/ahch-to.webp`
```
A cinematic space-view establishing shot of the ocean world Ahch-To, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows a single slate blue-green world ocean scattered with tiny steep volcanic islands and long storm tracks. Dominant colors #41616E and #2A4450, thin atmospheric rim glow in #B8D4DE on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D02 — Alderaan
`app/public/cards/alderaan.webp`
```
A cinematic space-view establishing shot of the garden world Alderaan, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows green meadow continents, snow-capped mountain chains and pale blue oceans under scattered white cloud. Dominant colors #6E9E6A and #B9CFE0, thin atmospheric rim glow in #BFD8EE on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D03 — Aldhani
`app/public/cards/aldhani.webp`
```
A cinematic space-view establishing shot of the highland world Aldhani, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows olive-green grassy highlands, long glacial valleys and weathered stone ridges under thin cloud. Dominant colors #6E8456 and #4A5C4A, thin atmospheric rim glow in #BCD4A8 on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D04 — Arvala-7
`app/public/cards/arvala-7.webp`
```
A cinematic space-view establishing shot of the mud-desert world Arvala-7, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows cracked tan mud flats, wide shallow basins and deep dry canyon networks with no water anywhere. Dominant colors #A98C6B and #6E5A45, thin atmospheric rim glow in #D2BC96 on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D05 — At Attin
`app/public/cards/at-attin.webp`
```
A cinematic space-view establishing shot of the forest world At Attin, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows deep green forest broken by unnaturally regular rectangular suburban clearings and one huge geometric complex, with calm teal seas. Dominant colors #5C8A4E and #3E6E72, thin atmospheric rim glow in #AEDCC0 on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D06 — Atollon
`app/public/cards/atollon.webp`
```
A cinematic space-view establishing shot of the coral-desert world Atollon, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows sand-orange plains overgrown with vast pale branching coral-like rock lattices and dark sinkhole clusters. Dominant colors #C09A6E and #7A6248, thin atmospheric rim glow in #DCC49A on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D07 — Batuu
`app/public/cards/batuu.webp`
```
A cinematic space-view establishing shot of the frontier world Batuu, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows khaki uplands stippled with fields of petrified stone spires, dark forest belts and circular cenote pits. Dominant colors #8A9464 and #6B5A44, thin atmospheric rim glow in #CBD8A8 on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D08 — Bespin
`app/public/cards/bespin.webp`
```
A cinematic space-view establishing shot of the gas giant Bespin, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows horizontal peach and rust cloud belts with turbulent shear boundaries and one large oval storm, no solid surface. Dominant colors #E8B48A and #C97F5A, thin atmospheric rim glow in #FFD9B0 on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D09 — Cantonica
`app/public/cards/cantonica.webp`
```
A cinematic space-view establishing shot of the desert world Cantonica, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows endless golden dunes broken by one artificial sea with a geometric engineered coastline and a thin irrigated green belt. Dominant colors #D9C08A and #8FA6B8, thin atmospheric rim glow in #E8D9B0 on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D10 — Cato Neimoidia
`app/public/cards/cato-neimoidia.webp`
```
A cinematic space-view establishing shot of the world Cato Neimoidia, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows pale ochre rock arches spanning deep canyons, mossy plateau tops and shallow yellow-green acidic seas. Dominant colors #B9A46A and #6F7F5A, thin atmospheric rim glow in #D8CFA0 on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D11 — Chandrila
`app/public/cards/chandrila.webp`
```
A cinematic space-view establishing shot of the temperate world Chandrila, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows rolling green-gold farmland in soft patchwork, long calm coastlines and deep teal oceans under light cloud. Dominant colors #7FA35E and #3F6F86, thin atmospheric rim glow in #B8DCF0 on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D12 — Christophsis
`app/public/cards/christophsis.webp`
```
A cinematic space-view establishing shot of the crystalline world Christophsis, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows continents of pale blue crystal growing in angular clusters over deep blue faceted basins, no soil or water. Dominant colors #7FB6D9 and #2F5D80, thin atmospheric rim glow in #A8D4F0 on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D13 — Corellia
`app/public/cards/corellia.webp`
```
A cinematic space-view establishing shot of the industrial world Corellia, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows green continents overwritten by grey shipyard sprawl along every coast, brown polluted river deltas and dulled slate oceans. Dominant colors #5E7E62 and #7E8898, thin atmospheric rim glow in #B8CCD8 on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D14 — Coruscant
`app/public/cards/coruscant.webp`
```
A cinematic space-view establishing shot of the city world Coruscant, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows an unbroken planet-wide city grid, avenues visible as fine dark lines, with a scatter of warm lights beginning on the night side of the terminator. Dominant colors #8A93A6 and #4A5568, thin atmospheric rim glow in #9FB4D8 on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D15 — Crait
`app/public/cards/crait.webp`
```
A cinematic space-view establishing shot of the salt world Crait, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows blinding white salt flats cracked into plates, with deep red mineral bedrock bleeding through the fractures and canyon walls. Dominant colors #EDEAE4 and #C23B2E, thin atmospheric rim glow in #F2E8E0 on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D16 — Csilla
`app/public/cards/csilla.webp`
```
A cinematic space-view establishing shot of the ice world Csilla, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows a continuous pale blue-grey ice sheet with glacier flow lines, crevasse fields and dark cave mouths in the mid latitudes. Dominant colors #C7D6E6 and #8FA6BE, thin atmospheric rim glow in #DCEBFF on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D17 — Dagobah
`app/public/cards/dagobah.webp`
```
A cinematic space-view establishing shot of the swamp world Dagobah, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows dark olive swamp and near-black bog interlocking with no clear coastline, half-hidden under heavy grey-green cloud. Dominant colors #4A5A3A and #2E3A28, thin atmospheric rim glow in #9FB08A on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D18 — Daiyu
`app/public/cards/daiyu.webp`
```
A cinematic space-view establishing shot of the city world Daiyu, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows cold blue-grey urban cover along ragged coastlines, harbour districts and docks, under a violet smog wash and heavy rain cloud. Dominant colors #4A4E62 and #8E6FA8, thin atmospheric rim glow in #8A7FB0 on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D19 — Dathomir
`app/public/cards/dathomir.webp`
```
A cinematic space-view establishing shot of the red-forest world Dathomir, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows blood-red forest canopy, near-black bogs, deep rust canyons and small dirty-white polar caps. Dominant colors #7E2E28 and #3E1A18, thin atmospheric rim glow in #C8503C on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D20 — D'Qar
`app/public/cards/dqar.webp`
```
A cinematic space-view establishing shot of the jungle world D'Qar, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows dense green equatorial jungle, darker blue-green river basins and open temperate plains under broken cloud. Dominant colors #4A7C3F and #2F5A4E, thin atmospheric rim glow in #A6E0B0 on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D21 — Dromund Kaas
`app/public/cards/dromund-kaas.webp`
```
A cinematic space-view establishing shot of the storm world Dromund Kaas, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows near-black jungle and swamp under an unbroken dark storm layer, almost no tonal separation between land and sea. Dominant colors #26313A and #141C24, thin atmospheric rim glow in #3E5566 on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D22 — Eadu
`app/public/cards/eadu.webp`
```
A cinematic space-view establishing shot of the rock world Eadu, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows dark grey-blue basalt highlands cut by knife-edged ravines, wet scree slopes and cold seas, mostly buried under storm cloud. Dominant colors #3A4048 and #6C7480, thin atmospheric rim glow in #7A8798 on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D23 — Endor
`app/public/cards/endor.webp`
```
A cinematic space-view establishing shot of the gas giant Endor, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows soft sage-green and grey-teal cloud belts with gentle shear boundaries and two modest oval storms, no solid surface. Dominant colors #AEC4B4 and #7E958C, thin atmospheric rim glow in #C8DCCF on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D24 — Eriadu
`app/public/cards/eriadu.webp`
```
A cinematic space-view establishing shot of the industrial world Eriadu, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows dulled olive jungle eaten into by brown-grey mining sprawl, brown silt plumes at every river mouth and a hazy polluted atmosphere. Dominant colors #6B7A55 and #4A4438, thin atmospheric rim glow in #B0A98C on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D25 — Exegol
`app/public/cards/exegol.webp`
```
A cinematic space-view establishing shot of the dead world Exegol, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows a uniform dark grey-violet dust plain fractured by a planet-wide net of black cracks, wrapped in a permanent electrical storm haze. Dominant colors #3A3A44 and #23232B, thin atmospheric rim glow in #8A84B8 on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D26 — Felucia
`app/public/cards/felucia.webp`
```
A cinematic space-view establishing shot of the fungal world Felucia, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows teal-green fungal canopy mottled with broad magenta and violet patches, sprawling swamp basins and slow brown rivers. Dominant colors #3E8E7E and #A84E8E, thin atmospheric rim glow in #8EE8D0 on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D27 — Ferrix
`app/public/cards/ferrix.webp`
```
A cinematic space-view establishing shot of the salvage world Ferrix, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows rust-orange plains and flat-topped mesas, granular scrapyard fields around compact brick-coloured towns, and thin irrigated river strips. Dominant colors #A8624E and #6E4438, thin atmospheric rim glow in #C89078 on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D28 — Geonosis
`app/public/cards/geonosis.webp`
```
A cinematic space-view establishing shot of the desert world Geonosis, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows red-orange sand and gravel deserts, extensive mesa and butte fields, dry canyons and dense clusters of spire formations. Dominant colors #B5654A and #7E3E2E, thin atmospheric rim glow in #E09A72 on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D29 — Ghorman
`app/public/cards/ghorman.webp`
```
A cinematic space-view establishing shot of the mountain world Ghorman, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows green uplands between long parallel mountain chains, golden terraced valley farmland and alpine lakes, snow only on the highest ridges. Dominant colors #6F8A5A and #8A7550, thin atmospheric rim glow in #C4D8B0 on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D30 — Glavis Halka Dünyası
`app/public/cards/glavis-ringworld.webp`
```
A cinematic space-view establishing shot of an artificial ring habitat, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The structure is a vast manufactured ring seen at a shallow angle, its inner deck banded with boulevards, block housing and structural ribs in pale grey over darker service strips, no geology anywhere. Dominant colors #8A8F98 and #4A4F58.
One hard key light from the upper right, a crisp shadow line across the ring, the whole structure fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks, no lit windows.
[STYLE BIBLE]
```

### D31 — Hosnian Prime
`app/public/cards/hosnian-prime.webp`
```
A cinematic space-view establishing shot of the city world Hosnian Prime, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows continent-wide cool grey-blue urban cover with radial civic districts, green park belts and fully built geometric coastlines. Dominant colors #8E96A8 and #5A6478, thin atmospheric rim glow in #A8C0E0 on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D32 — Hoth
`app/public/cards/hoth.webp`
```
A cinematic space-view establishing shot of the ice world Hoth, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows a solid white ice sheet with crevasse fields, glacier flow lines curving around buried mountain ranges and a few dark exposed rock ridges. Dominant colors #DCE9F5 and #9FC0DE, thin atmospheric rim glow in #CFE4FF on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D33 — Ilum
`app/public/cards/ilum.webp`
```
A cinematic space-view establishing shot of the ice world Ilum, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows a bright white-blue glacier sheet with deep blue crevasse belts, dark mountain ridges and several huge circular excavation pits cut down to bedrock. Dominant colors #DCEBFA and #7FA8D0, thin atmospheric rim glow in #CFE6FF on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D34 — Jakku
`app/public/cards/jakku.webp`
```
A cinematic space-view establishing shot of the desert world Jakku, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows pale sand seas and linear dune trains over tan bedrock, isolated rock spires, and one equatorial belt peppered with dark wreckage mottling. Dominant colors #D9C49A and #A08A64, thin atmospheric rim glow in #EFE0BC on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D35 — Jedha
`app/public/cards/jedha.webp`
```
A cinematic space-view establishing shot of the desert moon Jedha, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows pale grey-tan deserts and old crater fields, dominated by one enormous circular blast basin with a shattered rim and long radial ejecta streaks. Dominant colors #B8A488 and #6E5E4C, thin atmospheric rim glow in #D8C8A8 on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the moon's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D36 — Kamino
`app/public/cards/kamino.webp`
```
A cinematic space-view establishing shot of the ocean world Kamino, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows an unbroken steel-blue world ocean with no land at all, banded spiral storm systems and pale wind-driven foam streaks. Dominant colors #33506B and #1E3348, thin atmospheric rim glow in #9FB8D8 on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D37 — Kashyyyk
`app/public/cards/kashyyyk.webp`
```
A cinematic space-view establishing shot of the forest world Kashyyyk, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows deep unbroken green canopy over the continents, wide coastal swamp belts and long shallow tropical seas. Dominant colors #356B38 and #1F4A28, thin atmospheric rim glow in #B8DDB0 on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D38 — Kessel
`app/public/cards/kessel.webp`
```
A cinematic space-view establishing shot of the mining world Kessel, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows a bone-grey northern hemisphere torn up by rectangular open pits and spoil heaps meeting a muted green southern sanctuary belt along a ragged artificial line. Dominant colors #C8BC9E and #5E7E4E, thin atmospheric rim glow in #E0D8B8 on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D39 — Kijimi
`app/public/cards/kijimi.webp`
```
A cinematic space-view establishing shot of the frozen mountain world Kijimi, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows pale blue-white snowfields draped over dense folded mountain ranges with dark exposed rock on the steep faces and one terraced settlement on a mountainside. Dominant colors #C9D6E2 and #7E8CA0, thin atmospheric rim glow in #BFD4EC on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D40 — Korriban
`app/public/cards/korriban.webp`
```
A cinematic space-view establishing shot of the tomb world Korriban, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows blood-red rock deserts over near-black bedrock, long straight-walled valleys and fields of rectangular excavation scars. Dominant colors #6E2B25 and #3A1512, thin atmospheric rim glow in #C0563F on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D41 — Krownest
`app/public/cards/krownest.webp`
```
A cinematic space-view establishing shot of the frozen forest world Krownest, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows snowfields and frozen lakes interlocking with dark blue-green conifer forest, sharp grey mountain ranges and pale frozen river ribbons. Dominant colors #D2E2EE and #5E7A6E, thin atmospheric rim glow in #BCD8EC on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D42 — Lahmu
`app/public/cards/lahmu.webp`
```
A cinematic space-view establishing shot of the temperate world Lahmu, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows dark grey-green volcanic lowlands with olive farmland patches, black sand coastlines and wide grey-blue seas. Dominant colors #3F4A44 and #6E7A5E, thin atmospheric rim glow in #9FB4C0 on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D43 — Lehon
`app/public/cards/lehon.webp`
```
A cinematic space-view establishing shot of the island world Lehon, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows warm turquoise reef shelves and dark teal basins scattered with small jungle islands ringed by pale coral beaches. Dominant colors #1E7A6E and #12463F, thin atmospheric rim glow in #9FE0C8 on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D44 — Lothal
`app/public/cards/lothal.webp`
```
A cinematic space-view establishing shot of the prairie world Lothal, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows vast golden-tan grasslands with green river valleys, fields of isolated flat-topped rock spires and shallow marshes. Dominant colors #C8A855 and #6E8E5E, thin atmospheric rim glow in #E8D8A8 on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D45 — Malachor
`app/public/cards/malachor.webp`
```
A cinematic space-view establishing shot of the shattered world Malachor, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows grey-brown wasteland split by wide dark-red fissures radiating from one enormous impact scar, with fields of shattered rock and collapsed caverns. Dominant colors #4A3A3A and #8C2E28, thin atmospheric rim glow in #9E4038 on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D46 — Manaan
`app/public/cards/manaan.webp`
```
A cinematic space-view establishing shot of the ocean world Manaan, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows a calm unbroken blue ocean with pale turquoise shallow banks, navy abyssal trenches and a scattering of tiny equatorial sandbars. Dominant colors #2E6E8C and #1B4358, thin atmospheric rim glow in #8FD0E0 on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D47 — Mandalore
`app/public/cards/mandalore.webp`
```
A cinematic space-view establishing shot of the glassed world Mandalore, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows bone-white fused desert with faint concentric bombardment rings, grey-green surviving highlands at the margins and circular fused city footprints. Dominant colors #D8D4C8 and #8E9498, thin atmospheric rim glow in #D8E0DC on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D48 — Mimban
`app/public/cards/mimban.webp`
```
A cinematic space-view establishing shot of the mud world Mimban, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows churned khaki mud fields around every mine, olive rainforest between them and silt-brown braided rivers, half-covered by low grey cloud. Dominant colors #4E4A38 and #6E6B4E, thin atmospheric rim glow in #8E8C6C on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D49 — Moraband
`app/public/cards/moraband.webp`
```
A cinematic space-view establishing shot of the tomb world Moraband, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows rust-red rock deserts and desolate valleys over near-black bedrock, dry basins that were once seas and wind streaks trailing from the ridges. Dominant colors #8C3A2A and #3A1A16, thin atmospheric rim glow in #C25A3C on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D50 — Morak
`app/public/cards/morak.webp`
```
A cinematic space-view establishing shot of the rainforest world Morak, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows dark green rainforest over steep folded mountains, olive-brown cleared terraces, deep river gorges and small industrial clearings. Dominant colors #3E6B3F and #5E5A3A, thin atmospheric rim glow in #A0D0A0 on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D51 — Mustafar
`app/public/cards/mustafar.webp`
```
A cinematic space-view establishing shot of the lava world Mustafar, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows black basalt crust veined with glowing molten rivers and lava seas, grey ash plains downwind of the vents and a thin ash haze. Dominant colors #1A1210 and #FF5A1F, thin atmospheric rim glow in #FF7A3C on the lit limb.
One hard key light from the upper right, a crisp day/night terminator with the molten channels still visible on the dark side, the planet's limb fully inside the frame.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D52 — Mygeeto
`app/public/cards/mygeeto.webp`
```
A cinematic space-view establishing shot of the crystalline ice world Mygeeto, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows white-blue ice plains studded with angular crystal fields, blue glacial troughs and one rigid frozen city grid half-buried in the ice. Dominant colors #D7E6F2 and #8FA9C4, thin atmospheric rim glow in #CFE0FF on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D53 — Naboo
`app/public/cards/naboo.webp`
```
A cinematic space-view establishing shot of the world Naboo, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows green plains and farmland, swamp and lake country in the interior, deep blue fjord-like seas and several very large circular lake features. Dominant colors #5E8A4F and #3E6E8E, thin atmospheric rim glow in #A8D0E8 on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D54 — Nal Hutta
`app/public/cards/nal-hutta.webp`
```
A cinematic space-view establishing shot of the swamp world Nal Hutta, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows sickly yellow-green bogs and mud flats, olive peat basins, grey industrial sprawl bleeding into the wetlands and oil-slick standing water. Dominant colors #7E7E3E and #4E5228, thin atmospheric rim glow in #B8B878 on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D55 — Narkina 5
`app/public/cards/narkina-5.webp`
```
A cinematic space-view establishing shot of the ocean world Narkina 5, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows a cold grey-blue ocean with banded swell patterns, small bare rock islets and a few large rectangular artificial platforms standing offshore. Dominant colors #3C5666 and #8FA6B4, thin atmospheric rim glow in #A8C4D8 on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D56 — Nevarro
`app/public/cards/nevarro.webp`
```
A cinematic space-view establishing shot of the volcanic world Nevarro, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows black ash plains and old lava fields with glowing orange fissure belts, cut by narrow bright green cultivated river valleys. Dominant colors #2E2A28 and #E86A2C, thin atmospheric rim glow in #D8A888 on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D57 — Numidian Prime
`app/public/cards/numidian-prime.webp`
```
A cinematic space-view establishing shot of the jungle world Numidian Prime, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows dense green jungle continents, dark swamp basins, wide brown river deltas and warm shallow seas under scattered cloud. Dominant colors #3F7A48 and #2B5C55, thin atmospheric rim glow in #A8E0B4 on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D58 — Onderon
`app/public/cards/onderon.webp`
```
A cinematic space-view establishing shot of the jungle world Onderon, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows thick green jungle, blue-green rivers and inland seas, rocky highland plateaus and one clean circular walled-city ring on a plateau. Dominant colors #4E7A45 and #2E5C6E, thin atmospheric rim glow in #9FD5A8 on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D59 — Ossus
`app/public/cards/ossus.webp`
```
A cinematic space-view establishing shot of the ancient world Ossus, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows olive forest over worn continents, very deep long gorge systems, sun-bleached grassland and shrunken inland seas ringed with mineral flats. Dominant colors #5E7A3E and #3E5A46, thin atmospheric rim glow in #C6E0A0 on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D60 — Pasaana
`app/public/cards/pasaana.webp`
```
A cinematic space-view establishing shot of the desert world Pasaana, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows bright golden sand seas with crescent dune fields, ochre gravel plains and unusually smooth pale basins marking the sinking fields. Dominant colors #E0C07E and #A9814D, thin atmospheric rim glow in #F0D9A8 on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D61 — Peridea
`app/public/cards/peridea.webp`
```
A cinematic space-view establishing shot of the ashen world Peridea, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows bleached grey-lilac ash plains, dry brown rock ranges, dead pale grass meadows and salt-rimmed dry lake basins. Dominant colors #B0A8B0 and #7E6E68, thin atmospheric rim glow in #C8B8B0 on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D62 — Plazir-15
`app/public/cards/plazir-15.webp`
```
A cinematic space-view establishing shot of the marsh world Plazir-15, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows green grass plains laced with freshwater marshes and shallow lakes, olive cultivated belts and one perfectly circular domed-city footprint. Dominant colors #5C7F5E and #7E8C6A, thin atmospheric rim glow in #B4D8C0 on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D63 — Polis Massa
`app/public/cards/polis-massa.webp`
```
A cinematic space-view establishing shot of an airless cratered asteroid with a sealed research colony, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The body is irregular rather than spherical, bare grey rock saturated with overlapping craters and fracture lines, with one cluster of smooth artificial domes and flush landing pads. Dominant colors #6E6A66 and #3A3835, no atmosphere and therefore no rim glow at all.
One hard key light from the upper right, a hard unsoftened shadow line, the body fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D64 — Ryloth
`app/public/cards/ryloth.webp`
```
A cinematic space-view establishing shot of the world Ryloth, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows one burnt orange scorched hemisphere, one darker canyon-and-mesa hemisphere, and a narrow green twilight belt of jungle strips between them. Dominant colors #B87E4E and #6E4E38, thin atmospheric rim glow in #E0B080 on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D65 — Saleucami
`app/public/cards/saleucami.webp`
```
A cinematic space-view establishing shot of the desert world Saleucami, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows warm tan deserts with sharply defined green oasis patches, dark volcanic cone fields with lava aprons and dry salt flats between ranges. Dominant colors #C8A87A and #7E6A4B, thin atmospheric rim glow in #E0C9A0 on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D66 — Savareen
`app/public/cards/savareen.webp`
```
A cinematic space-view establishing shot of the desert world Savareen, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows pale interior sand deserts meeting a single long rocky coastline and a cold grey-blue ocean, with dry wadis running to the shore. Dominant colors #CDAE84 and #5E7C86, thin atmospheric rim glow in #E4D2AC on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D67 — Scarif
`app/public/cards/scarif.webp`
```
A cinematic space-view establishing shot of the atoll world Scarif, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows brilliant turquoise shallow seas over pale sand banks, long chains of coral atolls and low jungle islands with white beach rings. Dominant colors #3FA8A0 and #2E7E5E, thin atmospheric rim glow in #B0E8E0 on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D68 — Seatos
`app/public/cards/seatos.webp`
```
A cinematic space-view establishing shot of the quiet world Seatos, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows dark green-teal forest over modest continents, deep blue-grey oceans with rocky coasts and sea stacks, and one faint ring of coastal ruins. Dominant colors #3E6A55 and #2D4F62, thin atmospheric rim glow in #9CCFC0 on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D69 — Serenno
`app/public/cards/serenno.webp`
```
A cinematic space-view establishing shot of the world Serenno, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows green forest over rolling country, broad golden savannah belts, forested mountain ranges and orderly pale rectangular estate parcels. Dominant colors #5B7A4A and #8A7B4F, thin atmospheric rim glow in #B6D6A8 on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D70 — Shakari
`app/public/cards/shakari.webp`
```
A cinematic space-view establishing shot of the industrial city moon Shakari, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows dark grey-violet urban cover pole to pole, near-black refinery zones, elevated transit lines and a brown smog wash pooling over the low quarters. Dominant colors #4E4A50 and #2A282E, thin atmospheric rim glow in #9088A0 on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the moon's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D71 — Sorgan
`app/public/cards/sorgan.webp`
```
A cinematic space-view establishing shot of the forest world Sorgan, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows dark conifer forest, green-grey meadows and clusters of small rectangular flooded krill ponds reading as fine geometric stippling along the rivers. Dominant colors #46704A and #2F5240, thin atmospheric rim glow in #A6D8B0 on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D72 — Takodana
`app/public/cards/takodana.webp`
```
A cinematic space-view establishing shot of the forest world Takodana, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows lush green broadleaf forest, many large deep blue lakes with intricate shorelines, open grass plains and low forested hills. Dominant colors #4E7E4A and #356E8E, thin atmospheric rim glow in #B8DCC8 on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D73 — Taris
`app/public/cards/taris.webp`
```
A cinematic space-view establishing shot of the ruined city world Taris, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows grey-steel urban continents with whole districts collapsed into rubble fields, surviving grids only in patches, and debris-choked coastal shallows. Dominant colors #7C8493 and #4A515C, thin atmospheric rim glow in #AEB8C6 on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D74 — Tatooine
`app/public/cards/tatooine.webp`
```
A cinematic space-view establishing shot of the desert world Tatooine, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows endless dune seas cut by deep canyons and ochre bedrock plateaus, lit by two suns so the terminator reads as a doubled soft edge. Dominant colors #C9A36B and #8F6B45, thin atmospheric rim glow in #E8B27A on the lit limb.
One hard key light from the upper right plus a weaker second key just beside it, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D75 — Trask
`app/public/cards/trask.webp`
```
A cinematic space-view establishing shot of the ocean moon Trask, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows a cold grey-blue ocean with foam-streaked storm belts, scattered low rock islets and one small harbour settlement on a shallow bank. Dominant colors #3E5A6E and #7E96A6, thin atmospheric rim glow in #9FC0D8 on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the moon's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D76 — Tython
`app/public/cards/tython.webp`
```
A cinematic space-view establishing shot of the untouched world Tython, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows open green grasslands and light forest, bare-summited mountain ranges, wide river plains and one isolated flat-topped mountain on an open plain. Dominant colors #6E8A4E and #4A6A5A, thin atmospheric rim glow in #B8DCA8 on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D77 — Umbara
`app/public/cards/umbara.webp`
```
A cinematic space-view establishing shot of the shadow world Umbara, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows a nearly black surface where only slate-blue ridge lines and plateau tops separate from the dark, with fine vertical plant stippling and unlit basins. Dominant colors #2A2F3E and #5F7FA8, thin atmospheric rim glow in #5C74A8 on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D78 — Utapau
`app/public/cards/utapau.webp`
```
A cinematic space-view establishing shot of the sinkhole world Utapau, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows pale tan windswept plains and dry seabeds pitted with hundreds of large circular sinkholes, some in chains along fault lines. Dominant colors #C8B896 and #8E7E62, thin atmospheric rim glow in #E5D9BC on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D79 — Vandor
`app/public/cards/vandor.webp`
```
A cinematic space-view establishing shot of the alpine world Vandor, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows snow-covered mountain ranges with exposed grey rock faces, broad snow plains, dark river lines and small conifer stands in the low valleys. Dominant colors #DCE6EE and #7C8B9C, thin atmospheric rim glow in #CBDCF0 on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D80 — Wobani
`app/public/cards/wobani.webp`
```
A cinematic space-view establishing shot of the mud-plain world Wobani, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows flat drab grey-brown mud plains, sheets of shallow standing water, low bare hills and long straight industrial excavation scars. Dominant colors #5A5344 and #3B382E, thin atmospheric rim glow in #8C8676 on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D81 — Yavin
`app/public/cards/yavin.webp`
```
A cinematic space-view establishing shot of the gas giant Yavin, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows brick-red and maroon cloud belts with strong turbulent shear, several oval storm vortices and fine cream cirrus over the lighter bands. Dominant colors #C24E3A and #8E2F26, thin atmospheric rim glow in #E8785C on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the planet's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D82 — Ölüm Yıldızı (DS-1)
`app/public/cards/death-star.webp`
```
A cinematic space-view establishing shot of a moon-sized spherical artificial battle station, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The sphere is a machined grey hull covered in fine mechanical greeble, with one continuous equatorial trench and a large circular concave dish recess in the northern hemisphere. Dominant colors #9AA0A8 and #5E646C, no atmosphere and therefore no rim glow.
One hard key light from the upper right, a hard unsoftened shadow line, the station fully inside the frame, composition calm and centered.
No spacecraft, no text, no insignia, no UI overlays, no lens flare streaks, no glowing elements.
[STYLE BIBLE]
```

### D83 — Ölüm Yıldızı II (DS-2)
`app/public/cards/death-star-2.webp`
```
A cinematic space-view establishing shot of an unfinished moon-sized spherical battle station, filling the right two thirds of a wide 2:1 frame, black star field on the left.
Roughly half the sphere is finished grey greebled hull; the rest is open skeletal ring framing and girders with dark voids between them, the boundary ragged, a dish recess sitting in the finished half. Dominant colors #9AA0A8 and #5E646C, no atmosphere and therefore no rim glow.
One hard key light from the upper right, a hard unsoftened shadow line, the station fully inside the frame, composition calm and centered.
No spacecraft, no text, no insignia, no UI overlays, no lens flare streaks, no glowing elements.
[STYLE BIBLE]
```

### D84 — Endor (Orman Ayı)
`app/public/cards/endor-moon.webp`
```
A cinematic space-view establishing shot of the forest moon of Endor, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows dark green old-growth forest over almost all land, golden savanna belts in the interior, forested mountain ranges and small blue inland seas. Dominant colors #3F6B45 and #2C4A32, thin atmospheric rim glow in #BFE3C8 on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the moon's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D85 — Kef Bir
`app/public/cards/kef-bir.webp`
```
A cinematic space-view establishing shot of the ocean moon Kef Bir, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows a cold green-grey world ocean with heavy banded swell and foam streaks, broken only by two loose archipelagos of low grassland islands. Dominant colors #2E5E5A and #1E3E42, thin atmospheric rim glow in #9FCBD0 on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the moon's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D86 — Concordia
`app/public/cards/concordia.webp`
```
A cinematic space-view establishing shot of the mining moon Concordia, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows dark conifer forest over steep mountain country, bare grey summits, and rectangular open-cut mine workings with pale spoil heaps on several mountainsides. Dominant colors #55704E and #3A4E38, thin atmospheric rim glow in #C0D4BC on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the moon's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D87 — Nar Shaddaa
`app/public/cards/nar-shaddaa.webp`
```
A cinematic space-view establishing shot of the city moon Nar Shaddaa, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows grimy grey-brown urban cover pole to pole in mismatched districts, stacked crooked construction, spaceport pads and a smog-stained haze, with chaotic lights beginning past the terminator. Dominant colors #6E6458 and #3E3830, thin atmospheric rim glow in #B8A878 on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the moon's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

### D88 — Yavin 4
`app/public/cards/yavin-4.webp`
```
A cinematic space-view establishing shot of the jungle moon Yavin 4, filling the right two thirds of a wide 2:1 frame, black star field on the left.
The globe shows dense emerald rainforest, dark swamp basins, wide brown braided rivers and a few pale stone step-pyramid clearings breaking the canopy. Dominant colors #2F6B3C and #1E4A2A, thin atmospheric rim glow in #A8D8B0 on the lit limb.
One hard key light from the upper right, a crisp day/night terminator, the moon's limb fully inside the frame, composition calm and centered.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

---

## Bölüm E — Karakter holo-büstleri (33)

`HoloPortrait` bilerek gerçek yüz çizmiyor (`src/components/HoloPortrait.tsx:1-5`): oyuncu
benzerliği hem hak hem tutarlılık sorunu. Bu bölüm o kararı bozmuyor — **hologram büstü**
üretir, portre fotoğrafı değil. Ayırt edici olan yalnız **siluet** ve **duruş**; hiçbir prompt
yüz tarif etmez, hiçbir prompt gerçek bir kişiyi ya da tescilli kostüm/miğfer tasarımını
tanımlamaz.

| Alan | Değer |
|---|---|
| Oran | 100:82 (mevcut `viewBox`) — **1000 × 820** üret |
| Dosya yolu | `app/public/portraits/<id>.webp` |
| Arka plan | Düz `#060B14` (şeffaf PNG de olur) |
| Renk | Yalnız camgöbeği hologram aralığı (`#66D9FF` çevresi) |

Her prompt aynı gövdeyi paylaşır; yalnız son iki satırdaki siluet ve duruş değişir.

### E01 — Luke Skywalker
`app/public/portraits/luke-skywalker.webp`
```
A Star Wars style holographic projection bust, viewed from the front, floating above an implied projector base. The figure is rendered ONLY as a translucent cyan-blue volumetric hologram (#66D9FF) with horizontal scanline banding, edge flicker and light falloff toward the shoulders. No facial features, no skin, no eyes — the head reads as a smooth silhouette. Flat dark background #060B14, nothing else in frame. Not a photograph, not a portrait, not a likeness of any real person.
Silhouette shape: short-cropped hair, a plain high-collared tunic, narrow shoulders.
Posture: calm, shoulders square, chin level.
[STYLE BIBLE]
```

### E02 — Leia Organa
`app/public/portraits/leia-organa.webp`
```
A Star Wars style holographic projection bust, viewed from the front, floating above an implied projector base. The figure is rendered ONLY as a translucent cyan-blue volumetric hologram (#66D9FF) with horizontal scanline banding, edge flicker and light falloff toward the shoulders. No facial features, no skin, no eyes — the head reads as a smooth silhouette. Flat dark background #060B14, nothing else in frame. Not a photograph, not a portrait, not a likeness of any real person.
Silhouette shape: hair coiled into two large side buns, a long ceremonial gown collar rising at the neck.
Posture: chin slightly raised, formal, one arm implied at the side.
[STYLE BIBLE]
```

### E03 — Han Solo
`app/public/portraits/han-solo.webp`
```
A Star Wars style holographic projection bust, viewed from the front, floating above an implied projector base. The figure is rendered ONLY as a translucent cyan-blue volumetric hologram (#66D9FF) with horizontal scanline banding, edge flicker and light falloff toward the shoulders. No facial features, no skin, no eyes — the head reads as a smooth silhouette. Flat dark background #060B14, nothing else in frame. Not a photograph, not a portrait, not a likeness of any real person.
Silhouette shape: loose swept hair, an open collared jacket with a wide lapel line, a plain shirt beneath.
Posture: weight on one leg, shoulders relaxed and slightly uneven, casual.
[STYLE BIBLE]
```

### E04 — Chewbacca
`app/public/portraits/chewbacca.webp`
```
A Star Wars style holographic projection bust, viewed from the front, floating above an implied projector base. The figure is rendered ONLY as a translucent cyan-blue volumetric hologram (#66D9FF) with horizontal scanline banding, edge flicker and light falloff toward the shoulders. No facial features, no skin, no eyes — the head reads as a smooth silhouette. Flat dark background #060B14, nothing else in frame. Not a photograph, not a portrait, not a likeness of any real person.
Silhouette shape: very tall and broad, a heavily furred outline whose edge breaks into fine strands, a single diagonal strap crossing the chest.
Posture: wide stance, arms held slightly away from the body.
[STYLE BIBLE]
```

### E05 — Anakin Skywalker
`app/public/portraits/anakin-skywalker.webp`
```
A Star Wars style holographic projection bust, viewed from the front, floating above an implied projector base. The figure is rendered ONLY as a translucent cyan-blue volumetric hologram (#66D9FF) with horizontal scanline banding, edge flicker and light falloff toward the shoulders. No facial features, no skin, no eyes — the head reads as a smooth silhouette. Flat dark background #060B14, nothing else in frame. Not a photograph, not a portrait, not a likeness of any real person.
Silhouette shape: shoulder-length hair, layered robes with a heavy outer cloak falling from one shoulder, a single braid line at the side of the head.
Posture: tense, shoulders forward, head tilted very slightly down.
[STYLE BIBLE]
```

### E06 — Obi-Wan Kenobi
`app/public/portraits/obi-wan-kenobi.webp`
```
A Star Wars style holographic projection bust, viewed from the front, floating above an implied projector base. The figure is rendered ONLY as a translucent cyan-blue volumetric hologram (#66D9FF) with horizontal scanline banding, edge flicker and light falloff toward the shoulders. No facial features, no skin, no eyes — the head reads as a smooth silhouette. Flat dark background #060B14, nothing else in frame. Not a photograph, not a portrait, not a likeness of any real person.
Silhouette shape: a deep hood drawn over the head, heavy robed shoulders, the outline of a beard just readable at the jaw line.
Posture: still, hands implied clasped in front, weight even.
[STYLE BIBLE]
```

### E07 — Yoda
`app/public/portraits/yoda.webp`
```
A Star Wars style holographic projection bust, viewed from the front, floating above an implied projector base. The figure is rendered ONLY as a translucent cyan-blue volumetric hologram (#66D9FF) with horizontal scanline banding, edge flicker and light falloff toward the shoulders. No facial features, no skin, no eyes — the head reads as a smooth silhouette. Flat dark background #060B14, nothing else in frame. Not a photograph, not a portrait, not a likeness of any real person.
Silhouette shape: a very small figure with an oversized rounded head, long tapering ears angled outward and slightly down, sparse wisps of hair, a loose homespun robe.
Posture: seated, back straight, a walking stick implied at one side.
[STYLE BIBLE]
```

### E08 — Sheev Palpatine
`app/public/portraits/palpatine.webp`
```
A Star Wars style holographic projection bust, viewed from the front, floating above an implied projector base. The figure is rendered ONLY as a translucent cyan-blue volumetric hologram (#66D9FF) with horizontal scanline banding, edge flicker and light falloff toward the shoulders. No facial features, no skin, no eyes — the head reads as a smooth silhouette. Flat dark background #060B14, nothing else in frame. Not a photograph, not a portrait, not a likeness of any real person.
Silhouette shape: a deep heavy hood swallowing the head entirely so the face is a void, enormous draped sleeves, a bulky robed torso.
Posture: hunched forward, hands implied hidden in the opposite sleeves.
[STYLE BIBLE]
```

### E09 — Padmé Amidala
`app/public/portraits/padme-amidala.webp`
```
A Star Wars style holographic projection bust, viewed from the front, floating above an implied projector base. The figure is rendered ONLY as a translucent cyan-blue volumetric hologram (#66D9FF) with horizontal scanline banding, edge flicker and light falloff toward the shoulders. No facial features, no skin, no eyes — the head reads as a smooth silhouette. Flat dark background #060B14, nothing else in frame. Not a photograph, not a portrait, not a likeness of any real person.
Silhouette shape: an elaborate wide headdress with symmetrical ornaments flanking the head, hair dressed high, a broad structured gown collar.
Posture: perfectly symmetrical, upright, ceremonial and still.
[STYLE BIBLE]
```

### E10 — Qui-Gon Jinn
`app/public/portraits/qui-gon-jinn.webp`
```
A Star Wars style holographic projection bust, viewed from the front, floating above an implied projector base. The figure is rendered ONLY as a translucent cyan-blue volumetric hologram (#66D9FF) with horizontal scanline banding, edge flicker and light falloff toward the shoulders. No facial features, no skin, no eyes — the head reads as a smooth silhouette. Flat dark background #060B14, nothing else in frame. Not a photograph, not a portrait, not a likeness of any real person.
Silhouette shape: tall, long hair falling past the shoulders, heavy layered robes with a broad belt line, a beard shape readable at the jaw.
Posture: grounded and open, hands implied resting on the belt.
[STYLE BIBLE]
```

### E11 — Maul
`app/public/portraits/darth-maul.webp`
```
A Star Wars style holographic projection bust, viewed from the front, floating above an implied projector base. The figure is rendered ONLY as a translucent cyan-blue volumetric hologram (#66D9FF) with horizontal scanline banding, edge flicker and light falloff toward the shoulders. No facial features, no skin, no eyes — the head reads as a smooth silhouette. Flat dark background #060B14, nothing else in frame. Not a photograph, not a portrait, not a likeness of any real person.
Silhouette shape: a bare head ringed by a crown of short blunt horns, a lean hooded cloak fallen back onto the shoulders, narrow frame.
Posture: coiled, weight forward, shoulders low and slightly turned.
[STYLE BIBLE]
```

### E12 — Count Dooku
`app/public/portraits/count-dooku.webp`
```
A Star Wars style holographic projection bust, viewed from the front, floating above an implied projector base. The figure is rendered ONLY as a translucent cyan-blue volumetric hologram (#66D9FF) with horizontal scanline banding, edge flicker and light falloff toward the shoulders. No facial features, no skin, no eyes — the head reads as a smooth silhouette. Flat dark background #060B14, nothing else in frame. Not a photograph, not a portrait, not a likeness of any real person.
Silhouette shape: swept-back hair, a pointed beard at the chin, a tall stiff collar and a long heavy cape hanging straight from the shoulders.
Posture: aristocratic, spine very straight, chin lifted, one hand implied behind the back.
[STYLE BIBLE]
```

### E13 — General Grievous
`app/public/portraits/grievous.webp`
```
A Star Wars style holographic projection bust, viewed from the front, floating above an implied projector base. The figure is rendered ONLY as a translucent cyan-blue volumetric hologram (#66D9FF) with horizontal scanline banding, edge flicker and light falloff toward the shoulders. No facial features, no skin, no eyes — the head reads as a smooth silhouette. Flat dark background #060B14, nothing else in frame. Not a photograph, not a portrait, not a likeness of any real person.
Silhouette shape: a gaunt mechanical frame, an elongated angular skull-like head, exposed thin strut-like limbs, a heavy cape hanging behind the shoulders. Generic machinery only, no branded design.
Posture: stooped forward, shoulders raised above the head line, arms held wide.
[STYLE BIBLE]
```

### E14 — Ahsoka Tano
`app/public/portraits/ahsoka-tano.webp`
```
A Star Wars style holographic projection bust, viewed from the front, floating above an implied projector base. The figure is rendered ONLY as a translucent cyan-blue volumetric hologram (#66D9FF) with horizontal scanline banding, edge flicker and light falloff toward the shoulders. No facial features, no skin, no eyes — the head reads as a smooth silhouette. Flat dark background #060B14, nothing else in frame. Not a photograph, not a portrait, not a likeness of any real person.
Silhouette shape: two long head-tails falling forward over the shoulders and one upright central crest, a fitted sleeveless tunic.
Posture: alert, head turned a few degrees, shoulders level.
[STYLE BIBLE]
```

### E15 — Captain Rex
`app/public/portraits/captain-rex.webp`
```
A Star Wars style holographic projection bust, viewed from the front, floating above an implied projector base. The figure is rendered ONLY as a translucent cyan-blue volumetric hologram (#66D9FF) with horizontal scanline banding, edge flicker and light falloff toward the shoulders. No facial features, no skin, no eyes — the head reads as a smooth silhouette. Flat dark background #060B14, nothing else in frame. Not a photograph, not a portrait, not a likeness of any real person.
Silhouette shape: closely shaved head, bulky segmented shoulder armour with a plain unmarked plate line across the chest, a generic helmet held under one arm. No insignia, no branded helmet design.
Posture: military, at ease, back straight, feet apart.
[STYLE BIBLE]
```

### E16 — Grand Admiral Thrawn
`app/public/portraits/thrawn.webp`
```
A Star Wars style holographic projection bust, viewed from the front, floating above an implied projector base. The figure is rendered ONLY as a translucent cyan-blue volumetric hologram (#66D9FF) with horizontal scanline banding, edge flicker and light falloff toward the shoulders. No facial features, no skin, no eyes — the head reads as a smooth silhouette. Flat dark background #060B14, nothing else in frame. Not a photograph, not a portrait, not a likeness of any real person.
Silhouette shape: neatly swept-back short hair, a high-collared military tunic with a plain belt line, narrow disciplined shoulders. No rank insignia, no branded uniform detail.
Posture: perfectly still, hands implied clasped behind the back, chin level.
[STYLE BIBLE]
```

### E17 — Ezra Bridger
`app/public/portraits/ezra-bridger.webp`
```
A Star Wars style holographic projection bust, viewed from the front, floating above an implied projector base. The figure is rendered ONLY as a translucent cyan-blue volumetric hologram (#66D9FF) with horizontal scanline banding, edge flicker and light falloff toward the shoulders. No facial features, no skin, no eyes — the head reads as a smooth silhouette. Flat dark background #060B14, nothing else in frame. Not a photograph, not a portrait, not a likeness of any real person.
Silhouette shape: young and slight, short hair, a hooded jacket with the hood down and a satchel strap crossing the chest.
Posture: leaning slightly forward, eager, one shoulder dropped.
[STYLE BIBLE]
```

### E18 — Kanan Jarrus
`app/public/portraits/kanan-jarrus.webp`
```
A Star Wars style holographic projection bust, viewed from the front, floating above an implied projector base. The figure is rendered ONLY as a translucent cyan-blue volumetric hologram (#66D9FF) with horizontal scanline banding, edge flicker and light falloff toward the shoulders. No facial features, no skin, no eyes — the head reads as a smooth silhouette. Flat dark background #060B14, nothing else in frame. Not a photograph, not a portrait, not a likeness of any real person.
Silhouette shape: hair tied back in a short tail, a plain band across the upper face where a blindfold would sit, an armoured shoulder pauldron on one side.
Posture: head very slightly tilted as if listening rather than looking, shoulders steady.
[STYLE BIBLE]
```

### E19 — Hera Syndulla
`app/public/portraits/hera-syndulla.webp`
```
A Star Wars style holographic projection bust, viewed from the front, floating above an implied projector base. The figure is rendered ONLY as a translucent cyan-blue volumetric hologram (#66D9FF) with horizontal scanline banding, edge flicker and light falloff toward the shoulders. No facial features, no skin, no eyes — the head reads as a smooth silhouette. Flat dark background #060B14, nothing else in frame. Not a photograph, not a portrait, not a likeness of any real person.
Silhouette shape: two long tapering head-tails falling behind the shoulders, a fitted flight cap covering the crown, a pilot's jacket collar with a goggle strap.
Posture: confident, shoulders square, head turned slightly to one side.
[STYLE BIBLE]
```

### E20 — Sabine Wren
`app/public/portraits/sabine-wren.webp`
```
A Star Wars style holographic projection bust, viewed from the front, floating above an implied projector base. The figure is rendered ONLY as a translucent cyan-blue volumetric hologram (#66D9FF) with horizontal scanline banding, edge flicker and light falloff toward the shoulders. No facial features, no skin, no eyes — the head reads as a smooth silhouette. Flat dark background #060B14, nothing else in frame. Not a photograph, not a portrait, not a likeness of any real person.
Silhouette shape: short cropped hair with an uneven fringe, segmented armour plates over the shoulders and chest, a plain unmarked helmet held at the hip. No insignia, no branded helmet design.
Posture: weight on one hip, one shoulder forward, informal.
[STYLE BIBLE]
```

### E21 — Din Djarin
`app/public/portraits/din-djarin.webp`
```
A Star Wars style holographic projection bust, viewed from the front, floating above an implied projector base. The figure is rendered ONLY as a translucent cyan-blue volumetric hologram (#66D9FF) with horizontal scanline banding, edge flicker and light falloff toward the shoulders. No facial features, no skin, no eyes — the head reads as a smooth silhouette. Flat dark background #060B14, nothing else in frame. Not a photograph, not a portrait, not a likeness of any real person.
Silhouette shape: a smooth featureless full-face helmet with a single narrow horizontal visor slot, a short cape falling from one shoulder, plated pauldrons and a plain chest plate. Generic armour only, no markings, no branded design.
Posture: absolutely still, shoulders square, arms at the sides.
[STYLE BIBLE]
```

### E22 — Grogu
`app/public/portraits/grogu.webp`
```
A Star Wars style holographic projection bust, viewed from the front, floating above an implied projector base. The figure is rendered ONLY as a translucent cyan-blue volumetric hologram (#66D9FF) with horizontal scanline banding, edge flicker and light falloff toward the shoulders. No facial features, no skin, no eyes — the head reads as a smooth silhouette. Flat dark background #060B14, nothing else in frame. Not a photograph, not a portrait, not a likeness of any real person.
Silhouette shape: a very small figure with an oversized round head and long pointed ears drooping outward, swallowed by an oversized coarse robe.
Posture: seated, hands implied in the lap, head slightly tipped up.
[STYLE BIBLE]
```

### E23 — Boba Fett
`app/public/portraits/boba-fett.webp`
```
A Star Wars style holographic projection bust, viewed from the front, floating above an implied projector base. The figure is rendered ONLY as a translucent cyan-blue volumetric hologram (#66D9FF) with horizontal scanline banding, edge flicker and light falloff toward the shoulders. No facial features, no skin, no eyes — the head reads as a smooth silhouette. Flat dark background #060B14, nothing else in frame. Not a photograph, not a portrait, not a likeness of any real person.
Silhouette shape: a plain full-face helmet with a narrow T-shaped visor recess, a heavy layered cape over one shoulder, a bandolier crossing the chest, a jetpack outline rising behind the shoulders. Generic armour only, no markings, no branded design.
Posture: braced, feet planted wide, arms slightly out from the body.
[STYLE BIBLE]
```

### E24 — Bo-Katan Kryze
`app/public/portraits/bo-katan.webp`
```
A Star Wars style holographic projection bust, viewed from the front, floating above an implied projector base. The figure is rendered ONLY as a translucent cyan-blue volumetric hologram (#66D9FF) with horizontal scanline banding, edge flicker and light falloff toward the shoulders. No facial features, no skin, no eyes — the head reads as a smooth silhouette. Flat dark background #060B14, nothing else in frame. Not a photograph, not a portrait, not a likeness of any real person.
Silhouette shape: short hair cut level with the jaw, fitted segmented armour over the shoulders and forearms, a plain unmarked helmet carried in the crook of one arm. No insignia, no branded helmet design.
Posture: commanding, shoulders back, chin level, feet apart.
[STYLE BIBLE]
```

### E25 — Cassian Andor
`app/public/portraits/cassian-andor.webp`
```
A Star Wars style holographic projection bust, viewed from the front, floating above an implied projector base. The figure is rendered ONLY as a translucent cyan-blue volumetric hologram (#66D9FF) with horizontal scanline banding, edge flicker and light falloff toward the shoulders. No facial features, no skin, no eyes — the head reads as a smooth silhouette. Flat dark background #060B14, nothing else in frame. Not a photograph, not a portrait, not a likeness of any real person.
Silhouette shape: short dark hair, a worn field jacket with a raised collar, a scarf bunched at the neck.
Posture: guarded, shoulders slightly hunched, head turned a little away.
[STYLE BIBLE]
```

### E26 — Jyn Erso
`app/public/portraits/jyn-erso.webp`
```
A Star Wars style holographic projection bust, viewed from the front, floating above an implied projector base. The figure is rendered ONLY as a translucent cyan-blue volumetric hologram (#66D9FF) with horizontal scanline banding, edge flicker and light falloff toward the shoulders. No facial features, no skin, no eyes — the head reads as a smooth silhouette. Flat dark background #060B14, nothing else in frame. Not a photograph, not a portrait, not a likeness of any real person.
Silhouette shape: hair pulled back into a low tie with loose strands, a padded jacket with a high collar, a small pendant cord at the neck.
Posture: defiant, chin down, shoulders set forward.
[STYLE BIBLE]
```

### E27 — Mon Mothma
`app/public/portraits/mon-mothma.webp`
```
A Star Wars style holographic projection bust, viewed from the front, floating above an implied projector base. The figure is rendered ONLY as a translucent cyan-blue volumetric hologram (#66D9FF) with horizontal scanline banding, edge flicker and light falloff toward the shoulders. No facial features, no skin, no eyes — the head reads as a smooth silhouette. Flat dark background #060B14, nothing else in frame. Not a photograph, not a portrait, not a likeness of any real person.
Silhouette shape: short neatly cut hair, a plain floor-length ceremonial robe with a wide draped neckline and a simple pendant chain.
Posture: formal and composed, perfectly upright, hands implied clasped low.
[STYLE BIBLE]
```

### E28 — Rey
`app/public/portraits/rey.webp`
```
A Star Wars style holographic projection bust, viewed from the front, floating above an implied projector base. The figure is rendered ONLY as a translucent cyan-blue volumetric hologram (#66D9FF) with horizontal scanline banding, edge flicker and light falloff toward the shoulders. No facial features, no skin, no eyes — the head reads as a smooth silhouette. Flat dark background #060B14, nothing else in frame. Not a photograph, not a portrait, not a likeness of any real person.
Silhouette shape: hair gathered into three small stacked buns down the back of the head, wrapped desert robes with a strap crossing the chest and fabric arm wraps.
Posture: ready, weight low, one shoulder slightly forward.
[STYLE BIBLE]
```

### E29 — Kylo Ren
`app/public/portraits/kylo-ren.webp`
```
A Star Wars style holographic projection bust, viewed from the front, floating above an implied projector base. The figure is rendered ONLY as a translucent cyan-blue volumetric hologram (#66D9FF) with horizontal scanline banding, edge flicker and light falloff toward the shoulders. No facial features, no skin, no eyes — the head reads as a smooth silhouette. Flat dark background #060B14, nothing else in frame. Not a photograph, not a portrait, not a likeness of any real person.
Silhouette shape: tall and broad, a plain angular full-face helmet with a narrow horizontal visor band, a heavy hooded cowl and a long layered cloak. Generic design only, no markings, no branded helmet design.
Posture: looming, shoulders raised, weight forward, arms tense at the sides.
[STYLE BIBLE]
```

### E30 — Poe Dameron
`app/public/portraits/poe-dameron.webp`
```
A Star Wars style holographic projection bust, viewed from the front, floating above an implied projector base. The figure is rendered ONLY as a translucent cyan-blue volumetric hologram (#66D9FF) with horizontal scanline banding, edge flicker and light falloff toward the shoulders. No facial features, no skin, no eyes — the head reads as a smooth silhouette. Flat dark background #060B14, nothing else in frame. Not a photograph, not a portrait, not a likeness of any real person.
Silhouette shape: short curly hair, a flight jacket with a thick shearling collar, a harness strap over one shoulder.
Posture: easy and open, one shoulder dropped, head tilted slightly.
[STYLE BIBLE]
```

### E31 — Finn
`app/public/portraits/finn.webp`
```
A Star Wars style holographic projection bust, viewed from the front, floating above an implied projector base. The figure is rendered ONLY as a translucent cyan-blue volumetric hologram (#66D9FF) with horizontal scanline banding, edge flicker and light falloff toward the shoulders. No facial features, no skin, no eyes — the head reads as a smooth silhouette. Flat dark background #060B14, nothing else in frame. Not a photograph, not a portrait, not a likeness of any real person.
Silhouette shape: very short hair, a heavy borrowed jacket sitting slightly large on the shoulders with the collar turned up.
Posture: alert and braced, shoulders lifted, head up.
[STYLE BIBLE]
```

### E32 — Lando Calrissian
`app/public/portraits/lando-calrissian.webp`
```
A Star Wars style holographic projection bust, viewed from the front, floating above an implied projector base. The figure is rendered ONLY as a translucent cyan-blue volumetric hologram (#66D9FF) with horizontal scanline banding, edge flicker and light falloff toward the shoulders. No facial features, no skin, no eyes — the head reads as a smooth silhouette. Flat dark background #060B14, nothing else in frame. Not a photograph, not a portrait, not a likeness of any real person.
Silhouette shape: short hair, a trimmed moustache line at the lip, a broad half-cape swept over one shoulder and a high-collared shirt beneath.
Posture: expansive, chest open, one hand implied on the hip.
[STYLE BIBLE]
```

### E33 — Jabba the Hutt
`app/public/portraits/jabba-the-hutt.webp`
```
A Star Wars style holographic projection bust, viewed from the front, floating above an implied projector base. The figure is rendered ONLY as a translucent cyan-blue volumetric hologram (#66D9FF) with horizontal scanline banding, edge flicker and light falloff toward the shoulders. No facial features, no skin, no eyes — the head reads as a smooth silhouette. Flat dark background #060B14, nothing else in frame. Not a photograph, not a portrait, not a likeness of any real person.
Silhouette shape: an enormous sluglike mass with no neck, the head merging directly into a swollen body, small stubby arms held close, a wide tapering jaw line.
Posture: sprawled and settled, leaning back, filling the lower half of the frame.
[STYLE BIBLE]
```

---

## Bölüm F — Marka görselleri (3)

Bunlar bugün SVG'den türetiliyor (`scripts/build-static-meta.mjs:156-168`); elle çizilmiş bir
marka görseli hepsini yükseltir. Zorunlu değil, ama tek dokunuşta uygulama ikonunu, PWA
ikonlarını ve paylaşım kartını birden düzeltir.

### F01 — Uygulama ikonu / favicon kaynağı

`app/raw/brand/app-icon.png` · 1024 × 1024

```
A single app icon on a flat very dark background (#05070C), square 1024x1024, centered.
The mark is a holocron: a perfect cube seen corner-on, drawn as thin luminous gold edge lines (#FFE81F) with no fill, its interior showing a faint second cube suspended inside it in cyan (#66D9FF). Fine concentric grid lines radiate outward from the cube and fade to nothing before the frame edge.
Geometric, precise, engineered — drafted rather than painted. Generous margin: the mark occupies the central 70% of the frame.
No text, no letters, no logos, no bevel, no gloss, no drop shadow, no gradient background.
[STYLE BIBLE]
```

### F02 — Varsayılan sosyal paylaşım kartı

`app/raw/brand/og-default.png` · 1200 × 630

Not: gezegen sayfalarının kendi OG kartları zaten üretiliyor (`build-static-meta.mjs`, 82 kart).
Bu yalnız kök URL ve rota sayfaları için yedek.

```
A wide 1200x630 title card on a flat very dark background (#05070C), no text anywhere.
Composition: the lower two thirds is a faint galactic coordinate grid in thin cyan lines (#66D9FF at low opacity) receding toward the horizon; the upper third is empty deep space with a sparse scatter of small stars. Off-center to the right, a single small planet limb catches a hard gold key light (#FFE81F), lit from the upper right, its dark side falling into the background.
Calm, wide, mostly empty — the frame is built to have a title typeset over the left half later.
No text, no letters, no logos, no UI, no lens flare, no nebula clouds.
[STYLE BIBLE]
```

### F03 — README afişi

`docs/brand/readme-banner.png` · 1600 × 400

```
A very wide 1600x400 banner on a flat very dark background (#05070C), no text anywhere.
Composition: a horizontal band of the galactic disk seen edge-on, drawn as fine luminous dust and thousands of small stars in cool blue-white, densest at the center and thinning to black at both ends. Thin gold arc lines (#FFE81F at low opacity) sweep across the band like charted hyperlane routes, with a few small nodes where they cross. The band sits slightly below center, leaving clean empty space above.
Precise and cartographic rather than painterly. Left and right edges fade fully to the background colour.
No text, no letters, no logos, no planets, no ships, no lens flare.
[STYLE BIBLE]
```

---

## Bölüm G — Bende olan iş (sende değil)

Bunlar görsel üretimi değil, uygulamanın kendi çıktısı — ben tarayıcıdan çekerim:

- `docs/screenshots/galaxy-map.jpg` — hiperuzay ağından **önce** çekilmiş, hatlar görünmüyor.
- `docs/screenshots/landing.jpg`, `planet-mustafar.jpg` — köşede `0 fps` yazıyor (ilk kare).
- `docs/screenshots/holocron.jpg`, `compare.jpg`, `system-tatoo.jpg` — kart görselleri gelince
  yeniden çekilecek.

---

## Kalite kontrol listesi

**Her görsel için:**

- [ ] Yazı, harf, rakam, logo, imza, filigran **yok**
- [ ] Gerçek bir oyuncunun yüzü veya tescilli miğfer/kostüm tasarımı **yok**
- [ ] Palet doygunluğu STYLE BIBLE'ın istediği kadar sönük (neon değil)

**Bölüm A ve B için ek:**

- [ ] Tam 2:1 (4096 × 2048)
- [ ] Küre değil, düz harita
- [ ] Gölge / terminatör / parlama yok
- [ ] Sol-sağ kenar birleşiyor (`process-textures.mjs` uyarı vermiyor)
- [ ] Gece haritası, aynı dünyanın albedo coğrafyasıyla hizalı

**Bölüm D için ek:**

- [ ] Önemli detay merkezde (96 px kart yüksekliğinde ortadan kırpılacak)
- [ ] Gezegen limbi kadrajın tamamen içinde

**Bölüm E için ek:**

- [ ] Yüz hatları yok, baş düz siluet
- [ ] Yalnız camgöbeği hologram aralığı
- [ ] Karakter yalnız siluet + duruş ile ayırt ediliyor

---

## İş akışı

1. Promptu görsel modele ver (`[STYLE BIBLE]` yerine yukarıdaki bloğu yapıştır), PNG indir.
2. Bölüm A/B/C çıktılarını `app/raw/planets/` altına **tam olarak yazan adla** koy.
3. `cd app && node scripts/process-textures.mjs` — dikiş uyarısı varsa düzelt, tekrar çalıştır.
4. Bölüm D çıktılarını `app/public/cards/`, Bölüm E çıktılarını `app/public/portraits/` altına koy
   (klasörleri ben açarım; kart/portre görsellerini okuyan kod değişikliği de bende).
5. `npm run build`, sonra `/galaxy`, `/planet/<id>` ve `/holocron` üzerinde gözle doğrula.

Parti parti gitmek en verimlisi: önce beş kahraman gezegen (A72, A14, A50, A31, A08) + onların
kartları (D74, D14, D51, D32, D08). Stil kilidi onaylanınca gerisi seri üretim.
