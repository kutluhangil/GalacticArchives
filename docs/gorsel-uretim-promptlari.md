# Görsel üretim promptları — Galactic Archives

Yalnız **henüz üretilmemiş** görseller. Üretilip diske konan madde buradan silinir.
(Daha önceki 224 varlık tamam; promptları git geçmişinde: `git log -- docs/gorsel-uretim-promptlari.md`.)

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

## Bekleyen görseller — 7 savaş (2026-10-24)

Savaş kayıtları 8 → 15 oldu. Görseli gelene kadar Holocron'daki kart, konum adıyla tema
uyumlu bir ⚔ plakası gösteriyor; dosya diske düştüğü an otomatik devreye girer, kod
değişikliği gerekmez.

**Teknik:** 16:9, en az 1600 × 900 üret; `app/public/battles/<id>.webp` olarak
**800 × 450 webp** kaydet (mevcut sekiz görselle aynı boyut). Kadraj geniş açı, savaşın
mekânı okunur olsun; karakter yüzü yok.

### 1 — `battle-of-christophsis.webp`
Wide establishing shot of a city of tall faceted crystal towers on a cold blue world, smoke rising
between the spires, distant artillery flashes, rows of white-armoured infantry silhouettes holding a
street barricade at dusk. [STYLE BIBLE]

### 2 — `battle-of-utapau.webp`
Enormous sinkhole city carved into the walls of a pale rocky crater, landing platforms stacked down
its sides, laser fire crossing the abyss, small figures riding a large lizard mount along a ledge.
Late afternoon dust haze. [STYLE BIBLE]

### 3 — `battle-of-kashyyyk.webp`
Beach at the foot of colossal wroshyr trees, a lagoon full of beached assault craft, tall furred
warriors and white-armoured troops holding the shoreline against a wave of spindly battle droids,
catamarans on the water. [STYLE BIBLE]

### 4 — `liberation-of-lothal.webp`
Grassland plains at night, a domed imperial headquarters exploding into a column of fire, giant
space-whale creatures with glowing markings rising into the sky above a wedge-shaped warship.
[STYLE BIBLE]

### 5 — `battle-of-starkiller-base.webp`
A snow-and-forest planet hollowed into a weapon, a vast trench glowing red with collected starlight,
small fighters diving through flak toward a cylindrical oscillator, the sky darkening as the sun is
drained. [STYLE BIBLE]

### 6 — `battle-of-crait.webp`
White salt flat with red crystalline soil kicked up in long scarlet trails behind small ski-speeders,
heavy armoured walkers advancing on a mine door in a cliff face, overcast sky. [STYLE BIBLE]

### 7 — `battle-of-exegol.webp`
Storm-lashed black world, lightning-filled sky crowded with hundreds of mismatched civilian ships
fighting a fleet of dark wedge-shaped destroyers, a jagged citadel on the ground below.
[STYLE BIBLE]

---

## İş akışı

1. Promptu görsel modele ver; sonundaki `[STYLE BIBLE]` yerine yukarıdaki bloğu yapıştır.
2. 16:9, en az 1600 × 900 üret, PNG indir.
3. 800 × 450 webp'ye çevir (örnek):
   ```bash
   cd /Volumes/ProjectClaude/GalacticArchives/app
   node -e "require('sharp')('$HOME/Downloads/crait.png').resize(800,450,{fit:'cover'}).webp({quality:82}).toFile('public/battles/battle-of-crait.webp').then(i=>console.log(i))"
   ```
4. `npm run dev` → http://localhost:5173/holocron → Savaşlar bölümünde kontrol et.
