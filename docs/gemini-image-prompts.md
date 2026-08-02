# Gemini görsel üretim promptları — Galactic Archives

> **DEVRİ GEÇTİ (2026-08-02).** Yerine `gorsel-uretim-promptlari.md` geçti; buradaki beş
> prompt orada da, aynı numaralandırma içinde var. Üretim tamamlandı — bu dosya yalnız
> tarihsel kayıt. Yeni görsel için büyük listeyi kullan.

Bu dosya Gemini'ye (veya Imagen/Nano Banana'ya) doğrudan yapıştırılacak promptları içerir.
Açıklamalar Türkçe, promptlar İngilizce — görsel modeller İngilizce promptta belirgin
şekilde daha isabetli.

Üç bölüm var:

- **A** — Gezegen doku haritaları (3D küreyi besler, mevcut boru hattı bunu bekliyor)
- **B** — Holocron kart görselleri (şu an CSS gradient olan kapaklar)
- **C** — Karakter portreleri (şu an SVG hologram silüeti)

---

## Ortak stil kuralları (her prompta dahil edilecek)

Aşağıdaki blok her promptun sonuna eklenir; 114 kayıt tek bir görsel dile otursun diye.

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

## Bölüm A — Gezegen doku haritaları

### Teknik gereksinimler (pazarlıksız)

| Alan | Değer |
|---|---|
| Projeksiyon | Equirectangular (plate carrée), 2:1 |
| Çözünürlük | 4096 × 2048 PNG |
| Dosya yolu | `app/raw/planets/<id>-albedo.png`, `app/raw/planets/<id>-night.png` |
| Işık | **Yok.** Düz albedo. Gölge, terminatör, parlama, atmosfer halkası olmayacak |
| Küre | **Yok.** Düz harita, kenarda yuvarlaklık olmayacak, uzay/yıldız arka planı olmayacak |
| Dikiş | Sol ve sağ kenar birbirine sorunsuz bağlanmalı |

Boru hattı `app/scripts/process-textures.mjs`; ham PNG'leri 4K/2K/1K WebP/KTX2'ye indirip
`public/textures/planets/manifest.json` yazıyor. Çalıştırma:

```bash
cd app
node scripts/process-textures.mjs            # yeni olan her şeyi işle
node scripts/process-textures.mjs tatooine   # tek dünya
```

Script yatay dikişi ölçüyor ve tolerans (12) aşılırsa uyarıyor. Gemini equirectangular
sarmalını garanti etmez; dikiş uyarısı gelirse görseli yatayda %50 kaydırıp (offset)
ortadaki bindirmeyi klonlayarak düzeltip yeniden çalıştır.

**Önemli:** Runtime yükleyici (`src/lib/engine/planet-textures.ts`) bugün sadece `albedo`
ve `night` map'lerini kullanıyor. `clouds` map'i üretmek boşa iş — bulut katmanı prosedürel
shader'dan geliyor. `mustafar` reçetesindeki `textures.emissive` de bugün hiçbir yerde
okunmuyor.

### A1 — Tatooine (albedo)

```
A seamless equirectangular 2:1 planetary albedo texture map of a hot arid desert world, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no atmospheric haze, no specular highlight.
Terrain: vast rolling dune seas in pale sand (#C9A36B), darker ochre bedrock plateaus (#8F6B45),
deep branching canyon systems, dry cracked salt flats, scattered rocky bluffs and eroded mountain ranges
concentrated in two mid-latitude belts. Faint dust-storm streaking aligned east-west.
No ice caps, no water, no vegetation. No visible settlements.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A2 — Coruscant (albedo)

```
A seamless equirectangular 2:1 planetary albedo texture map of a city-covered world (ecumenopolis), 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no day/night terminator, no glow, no lens flare.
Surface: 100% urban, pole to pole. Dense grey-steel megablocks (#8A93A6) cut by darker canyon
avenues (#4A5568), enormous rectangular plazas, radial ring highways, industrial districts in
warmer grey-brown, a few very large ceremonial plaza clearings. Structure is readable at
continent scale: the grid varies in density and orientation between regions like tectonic plates.
No water, no vegetation, no clouds. No lit windows (that belongs to the night map).
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A3 — Coruscant (night / şehir ışıkları)

```
A seamless equirectangular 2:1 planetary NIGHT LIGHTS texture map of a city-covered world, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background.
Pure black background (#000000). Only emissive city light is drawn.
Warm amber-white light (#FFD9A0) tracing the same continental urban grid: dense cores that read
almost solid, thinning toward sparse outskirts, thin bright lines along the major avenues,
a handful of very bright civic districts. Light density varies strongly between regions.
No shadows, no bloom, no lens flare, no stars, no clouds, no daytime surface detail.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

Not: bu harita `app/raw/planets/coruscant-night.png` olarak kaydedilmeli; motor gece
yüzünü buradan aydınlatıyor.

### A4 — Mustafar (albedo)

```
A seamless equirectangular 2:1 planetary albedo texture map of a volcanic lava world, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no terminator, no bloom.
Terrain: near-black basalt and obsidian crust (#1A1210) fractured by branching rivers and broad
seas of incandescent molten rock (#FF5A1F), cooling crust plates floating on the larger lava seas,
grey ash plains downwind of the main vents, jagged obsidian ridge chains, collapsed caldera basins.
Molten channels form a believable drainage network, not scattered blobs.
No water, no vegetation, no ice.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A5 — Hoth (albedo)

```
A seamless equirectangular 2:1 planetary albedo texture map of a frozen ice world, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no terminator, no sparkle, no specular.
Terrain: continuous ice sheet in near-white blue (#DCE9F5) with colder blue-grey compression zones
(#9FC0DE), crevasse fields, glacier flow lines curving around buried mountain ranges, wind-scoured
sastrugi plains, a few exposed dark rock ridges and meteor impact craters near the equator.
No open water, no vegetation, no settlements.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### A6 — Bespin (albedo)

```
A seamless equirectangular 2:1 planetary albedo texture map of a gas giant, 4096x2048.
Flat map projection only — not a sphere, no globe curvature, no space background, no stars.
Completely flat lighting: no shadows, no terminator, no limb darkening.
Surface: horizontal banded cloud belts in warm peach and cream (#E8B48A) alternating with deeper
rust-orange zones (#C97F5A), turbulent shear boundaries between belts, several elongated vortex
storms and one large oval storm in the southern hemisphere, fine wispy ammonia cirrus over the
lighter zones. Bands run strictly horizontally and stretch toward the poles.
No solid ground, no rings, no moons.
The left and right edges must tile seamlessly with each other.
[STYLE BIBLE]
```

### Kalite kontrol listesi (her görsel için)

- [ ] Tam olarak 2:1 mi? (4096×2048)
- [ ] Küre değil, düz harita mı?
- [ ] Gölge/terminatör/parlama yok mu?
- [ ] Sol-sağ kenarlar birleşiyor mu? (`process-textures.mjs` uyarı vermiyor mu?)
- [ ] Kutuplarda aşırı gerilme/bulanıklık görselde kabul edilebilir mi?
- [ ] Yazı/logo/imza yok mu?

---

## Bölüm B — Holocron kart görselleri

Holocron ızgarasındaki kartlar (`src/pages/Holocron.tsx`) bugün gezegenin paletinden
üretilen radial-gradient. Yerine gerçek görsel konacaksa:

| Alan | Değer |
|---|---|
| Oran | 2:1 |
| Çözünürlük | 1200 × 600 |
| Dosya yolu | `app/public/cards/<id>.webp` |
| Kırpma | Kart yüksekliği 96px, `object-cover` ile ortadan kırpılacak — önemli detay merkezde olmalı |

Bu bölümdeki görseller Bölüm A'dan farklı: burada **küre** isteniyor, uzayda, sanat yönü
kart kapağı gibi.

Şablon (`<WORLD>`, `<TERRAIN>`, `<PRIMARY>`, `<SECONDARY>` doldurulacak):

```
A cinematic space-view establishing shot of the planet <WORLD>, filling the right two thirds
of a wide 2:1 frame, black star field on the left. The globe shows <TERRAIN>, dominant colors
<PRIMARY> and <SECONDARY>. A single hard key light from the upper right, a crisp day/night
terminator, thin atmospheric rim glow on the lit limb. Distant sun off-frame.
Composition is calm and centered; the planet's limb is fully inside the frame.
No spacecraft, no text, no UI overlays, no lens flare streaks.
[STYLE BIBLE]
```

İlk parti (Bölüm A ile aynı beş dünya):

| id | `<TERRAIN>` | `<PRIMARY>` / `<SECONDARY>` |
|---|---|---|
| `tatooine` | endless dune seas cut by deep canyons, two suns implied by a double terminator | `#C9A36B` / `#8F6B45` |
| `coruscant` | an unbroken planet-wide city grid, avenues visible as fine dark lines | `#8A93A6` / `#4A5568` |
| `mustafar` | black basalt crust veined with glowing molten rivers, ash haze | `#1A1210` / `#FF5A1F` |
| `hoth` | a solid white ice sheet with crevasse fields and buried mountain ranges | `#DCE9F5` / `#9FC0DE` |
| `bespin` | horizontal peach and rust cloud belts with oval storms, no solid surface | `#E8B48A` / `#C97F5A` |

**Kod tarafı notu:** Bu görseller tek başına ekrana gelmez — `Holocron.tsx` içindeki
gradient `<div>`'in `<img>`'e çevrilmesi ve görseli olmayan kayıtlar için gradient'in
yedek olarak kalması gerekiyor. Görseller hazır olduğunda o değişikliği ayrıca yapalım.

---

## Bölüm C — Karakter portreleri

`HoloPortrait` bilerek gerçek yüz çizmiyor: oyuncu benzerliği hem hak hem tutarlılık
sorunu. Bu bölüm o kararı bozmuyor — **hologram büstü** üretiyor, portre fotoğrafı değil.
Prompt hiçbir gerçek kişiyi tarif etmemeli; tanımlayıcı olan silüet ve duruş.

| Alan | Değer |
|---|---|
| Oran | 100:82 (mevcut viewBox) — 1000 × 820 üret, kenarı kırp |
| Dosya yolu | `app/public/portraits/<id>.webp` |
| Arka plan | Düz `#060B14` (şeffaf PNG de olur) |

Şablon:

```
A Star Wars style holographic projection bust, viewed from the front, floating above an
implied projector base. The figure is rendered ONLY as a translucent cyan-blue volumetric
hologram (#66D9FF) with horizontal scanline banding, edge flicker and light falloff toward
the shoulders. No facial features, no skin, no eyes — the head reads as a smooth silhouette.
Silhouette shape: <SILHOUETTE>. Posture: <POSTURE>.
Flat dark background #060B14, nothing else in frame.
Not a photograph, not a portrait, not a likeness of any real person.
No text, no watermark, no UI.
[STYLE BIBLE]
```

İlk parti — `<SILHOUETTE>` / `<POSTURE>` değerleri:

| id | `<SILHOUETTE>` | `<POSTURE>` |
|---|---|---|
| `luke-skywalker` | short-cropped hair, high collar tunic | calm, shoulders square |
| `leia-organa` | side buns and a long ceremonial gown collar | chin slightly raised, formal |
| `obi-wan-kenobi` | a deep hood over the head, robed shoulders | hands implied clasped, still |
| `ahsoka-tano` | two long head-tails falling forward over the shoulders and one upright center crest | alert, head turned a few degrees |
| `chewbacca` | tall, broad, heavily furred outline with a diagonal shoulder strap | wide stance, arms slightly out |
| `grogu` | very small figure, oversized round head, long pointed ears, oversized robe | seated, ears drooping |

Kalan 27 karakter için aynı şablon: karakteri **sadece** siluet + duruş ile ayır, hiçbir
zaman yüz tarifi verme.

---

## İş akışı özeti

1. Promptu Gemini'ye ver, çıktıyı PNG olarak indir.
2. Bölüm A çıktılarını `app/raw/planets/` altına doğru isimle koy.
3. `cd app && node scripts/process-textures.mjs` — dikiş uyarısı varsa görseli düzelt, tekrar çalıştır.
4. Bölüm B ve C çıktıları için ilgili `public/` klasörlerini oluştur; kod değişikliği ayrı adım.
5. `npm run build` ve `/planet/<id>` ile `/holocron` üzerinde gözle doğrula.
