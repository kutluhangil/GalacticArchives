# HANDOFF — Galactic Archives · Devam Talimatı
### Güncelleme: 23 Temmuz 2026 · Branch: `main` · Canlı: https://galactic-archives.vercel.app

**Önce oku:** `PLAN.md` (ürün+teknik plan), `design.md` (Gemini varlık brief'leri), `CHANGELOG.md` (ne değişti).

---

## 1. DURUM

| Faz | Durum | Not |
|-----|-------|-----|
| P0 Veri | ✅ | 74 gök cismi + 2 Ölüm Yıldızı + 33 karakter; doğrulama 0 hata |
| P1 Motor | ✅ | 11 arketipli prosedürel uber-shader + kabartma (relief) gölgeleme |
| P2 Galaksi + era + canlılık | ✅ | Log-sarmal disk, nebula pusu, toz şeritleri, çubuklu çekirdek |
| P3 Landing + Holocron | ✅ | `/`, `/holocron`, `/holocron/planet|character/:id` |
| P4 Cila | ✅ | Kalite katmanları, Kessel Run, porg, reduced-motion |
| P5 Yayın | ✅ | Vercel production, SPA rewrite + statik meta sayfaları |
| **Ses** | ❌ **kaldırıldı** | Kullanıcı isteği: SFX/müzik/ambiyans sistemi tamamen silindi |
| **Geçişler** | ✅ | Hipersıçrama flaşı kaldırıldı; kamera uçuşu (fly-to) geldi |
| v1.1 özellikleri | ✅ | Favoriler, son gezilenler, tur modu, kıyaslama, Aurebesh katmanı |
| SEO + PWA | ✅ | OG kartları, sitemap, robots, manifest, service worker |
| Tier A genişleme | ✅ | +40 dünya (toplam 74) |
| Tauri .dmg | ✅ | `app/src-tauri/`, `npm run desktop` |
| P6 Mobil | ❌ | Kapsam dışı |

**Ölçümler:** galaksi haritası 77 fps (74 dünya), gezegen görünümü ~115 fps (M4, 1360×904).
Lighthouse (desktop, preview build): landing perf 95 / a11y 100 / best-practices 100 / SEO 100; Holocron perf 95 / a11y 100 / SEO 100.

## 2. DOSYA HARİTASI (app/src)

```
lib/engine/  engine-base(+flyTo) · planet-engine · system-engine · galaxy-engine ·
             body-material · planet-textures · effects · planet-shaders · noise-glsl
lib/         lore · collections · tours · quality · sim-clock · ui-strings
state/       app.ts (lang, era, quality, veil, tour — localStorage kalıcı)
pages/       Landing · GalaxyView · SystemView · PlanetView · Compare ·
             Holocron · HolocronPlanet · HolocronCharacter
components/  TransitionVeil · useFlyTo · TourPlayer · Aurebesh · CommandPaletteHost ·
             HolocronChrome · HoloPortrait · EasterEggs · SettingsMenu · EraFade ·
             hud/{TopBar,PlanetPanel,TimeBar}
hooks/       useCollections · useSimClock
data/        planets/*.json (74) · characters.json · stations.json · tours.json · meta/*
scripts/     fetch-lore.mjs · validate-lore.mjs · process-textures.mjs · build-static-meta.mjs
```

**Komutlar** (hepsi `app/` içinden):
```
npm run dev · npm run build · npm run lint
npm run desktop                     # tauri build -> .dmg
npm run textures                    # raw/planets/*.png -> public/textures/planets
node scripts/validate-lore.mjs <digest.json>
node scripts/fetch-lore.mjs <digest.json>
vercel deploy --prod --yes
```

## 3. KRİTİK TUZAKLAR (yaşandı, tekrarı yasak)

1. **Bash cwd her çağrıda repo köküne resetlenir.** Komutları daima `cd /Volumes/ProjectVault/GalacticArchives/app && ...` ile başlat.
2. `vite.config.ts` **`base: '/'` kalacak**; `app/vercel.json` rewrite'ı derin rotalar için şart. Statik meta sayfaları rewrite'tan önce dosya sistemi eşleşmesiyle servis edilir.
3. Wookieepedia normal fetch **402** verir; `starwars.fandom.com/api.php` çalışır. Grid parametresi `coordinates`.
4. **GLSL template literal içinde backtick kullanma** — yorumda bile string'i kapatır.
5. **Shader'da `lat` için `vPosObj.y` kullan**, `p.y` değil.
6. **Materyal uniform'ları arketipe göre değişir.** Ortak döngüde `uSun2Dir` gibi alanlara dokunmadan önce varlığını kontrol et.
7. **Sim zamanı gerçek tarihe bağlı.** Sabit oryantasyon isteyen nesneler wallSec kullanmalı.
8. Tarayıcı testinde **pencere arkada kalırsa RAF kısılır ve fps 0–20 okunur.** Ölçümden önce pencereyi öne al (osascript ile `set index of w to 1`).
9. **Kabartma gradyanı clamp'lenmeli.** `surfaceHeight` gradyanı sınırsız bırakılırsa normaller terminatörün ötesine devrilir ve yüzey siyah benek benek olur (0.012 katsayı + ±8 clamp).
10. **Galaksi düğüm küreleri `uRelief=0` ile kurulur.** 74 dünyada kabartma açık kalırsa fps 77'den 60'ın altına düşer.
11. `npm pkg delete dependencies.<paket.js>` **noktayı yol ayracı sanar** ve `"paket": {}` bırakır; sonra tüm `npm install` çağrıları `must provide string spec` ile patlar. JSON'u elle düzenle.

## 4. BİLİNEN BOŞLUKLAR / SIRADAKİ ADAYLAR

- **Gemini dokuları:** hat hazır. `app/raw/planets/<id>-albedo.png` (2:1 equirectangular) bırak, `npm run textures` çalıştır; manifest yazılır ve motor dokuyu `uUseAlbedo` ile karıştırır. `toktx` kuruluysa KTX2, değilse WebP üretir (`brew install ktx`).
- **Aurebesh:** bileşen ve font tanımı hazır, **font dosyası yok** (repoda dağıtılabilir lisanslı Aurebesh yok). OFL lisanslı `app/public/fonts/aurebesh.woff2` bırakılırsa dekorasyon kendiliğinden açılır.
- **i18next kurulmadı** — bilinçli sapma. `lib/ui-strings.ts` tip düzeyinde iki dili zorunlu kılıyor.
- **Tier B / Legends katmanı** (PLAN §2.3) yapılmadı.
- **Bundle:** three.js chunk'ı ~570 kB (gzip ~143 kB); Landing ve Holocron onu yüklemiyor.
- **Era geçişi** sahneyi yeniden kurar; 0.16 s karartma bunu örtüyor ama gerçek crossfade değil.
- **.dmg imzasız.** İlk açılışta sağ tık → Aç gerekir; notarization Apple Developer hesabı ister.

## 5. SÜREÇ

- Her anlamlı adımda: `npm run build` ✓ + `npm run lint` ✓ + tarayıcı doğrulaması + `git add -A && git commit` + `git push origin main` (ayrı komutlar).
- Veri değişince `node scripts/validate-lore.mjs <digest>` koşulmalı; `(?)` işaretli alan yasak.
- **Co-author/Claude imzası ASLA yok** — tek yazar `kutluhangil`.
- Dil: kullanıcıyla Türkçe; kod/commit İngilizce.
