# HANDOFF — Galactic Archives · Devam Talimatı
### Güncelleme: 23 Temmuz 2026 · Son commit: `bba3e57` · Branch: `main` · Canlı: https://galactic-archives.vercel.app

**Önce oku:** `PLAN.md` (ürün+teknik plan) ve `design.md` (Gemini varlık brief'leri).

---

## 1. DURUM — P0–P5 TAMAMLANDI

| Faz | Durum | Not |
|-----|-------|-----|
| P0 Veri | ✅ | 41 gök cismi + 2 Ölüm Yıldızı + 33 karakter; Wookieepedia API doğrulaması 0 hata |
| P1 Motor | ✅ | 11 arketipli prosedürel uber-shader, gezegen/sistem görünümü, hipersıçrama |
| P2 Galaksi + era + canlılık | ✅ | `/galaxy` haritası, era sistemi, canlılık pası, moonsDetail + istasyonlar, ⌘K palet |
| P3 Landing + Holocron | ✅ | `/`, `/holocron`, `/holocron/planet/:id`, `/holocron/character/:id`, route splitting |
| P4 Ses + cila | ✅ | Sentezlenmiş SFX, kalite katmanları, Kessel Run + porg, reduced-motion |
| P5 Yayın | ✅ | Vercel production; SPA rewrite; Lighthouse a11y 100 / perf 99 |
| Gemini varlıkları | ⏳ kullanıcıda | Parti 1 (7 harita) hâlâ bekleniyor — motor prosedürel çalışıyor, doku gelince `uUseAlbedo` ile karışacak |
| P6 Mobil | ❌ | Kapsam dışı (ayrıca istenecek) |

**Ölçümler:** gezegen görünümü 140–175 fps, galaksi haritası ~111 fps (M4, 1360×904). Lighthouse: landing perf 99 / a11y 100 / SEO 91, Holocron a11y 100.

## 2. DOSYA HARİTASI (app/src)

```
lib/engine/  engine-base · planet-engine · system-engine · galaxy-engine · effects · planet-shaders · noise-glsl
lib/         lore · audio · quality · sim-clock · ui-strings
state/       app.ts (lang, era, quality, ses — hepsi localStorage kalıcı)
pages/       Landing · GalaxyView · SystemView · PlanetView · Holocron · HolocronPlanet · HolocronCharacter · Home(/legacy)
components/  CommandPaletteHost(+CommandPalette) · HolocronChrome · HoloPortrait · EasterEggs · SettingsMenu ·
             HyperspaceOverlay · EraFade · useJump · hud/{TopBar,PlanetPanel,TimeBar}
data/        planets/*.json (34) · characters.json · stations.json · meta/* · sources.json
```

**Komutlar:** `cd app && npm run dev` · `npm run build` · `node scripts/validate-lore.mjs <digest>` · `vercel deploy --prod --yes`

## 3. KRİTİK TUZAKLAR (yaşandı, tekrarı yasak)

1. **Bash cwd her çağrıda repo köküne resetlenir.** `npm`/`vercel` komutlarını daima `cd /Volumes/ProjectVault/GalacticArchives/app && ...` ile başlat.
2. `vite.config.ts` **`base: '/'` kalacak**; `app/vercel.json` rewrite'ı derin rotalar için şart.
3. Wookieepedia normal fetch **402** verir; `starwars.fandom.com/api.php` çalışır. Grid parametresi `coordinates`.
4. **GLSL template literal içinde backtick kullanma** — yorumda bile string'i kapatır, `Expected ";" but found "p"` verir.
5. **Shader'da `lat` için `vPosObj.y` kullan**, `p.y` değil: `p` seed offseti taşır, bantlar/hendekler ekvattan kayar.
6. **Materyal uniform'ları arketipe göre değişir.** Ortak döngüde `uSun2Dir` gibi alanlara dokunmadan önce varlığını kontrol et (istasyon shader'ında yok — Endor'da her kareyi patlatmıştı).
7. **Sim zamanı gerçek tarihe bağlı.** Sabit oryantasyon isteyen nesneler (istasyonlar) wallSec kullanmalı, yoksa açı bugünün tarihine göre rastgele gelir.
8. Tarayıcı testinde sekme arka plandaysa RAF kısılır ve fps 0–4 okunur; ölçüm öncesi pencereyi öne al (`osascript -e 'tell application "Google Chrome" to activate'`).
9. Doğrulama scripti her veri değişiminde koşulmalı; `(?)` işaretli alan yasak.

## 4. BİLİNEN BOŞLUKLAR / SIRADAKİ ADAYLAR

- **Gemini dokuları:** `raw/planets/` altına PNG bırakılırsa `scripts/process-textures.mjs` (henüz yazılmadı) + `uUseAlbedo=1` yolu kurulacak. Şu an tüm yüzeyler prosedürel.
- **Müzik:** slot sistemi hazır (`public/audio/music/<id>.mp3`), dosya yok. ACE-Step denendi ama `RUNPOD_API_KEY` yapılandırılmamış.
- **Ambience kanalı** tanımlı ama hiçbir arketip için ses bağlanmadı.
- **i18next kurulmadı** — bilinçli sapma. `lib/ui-strings.ts` tip düzeyinde iki dili zorunlu kılıyor (eksik dil = build hatası), i18next'in çoğul/interpolasyon özellikleri kullanılmıyor. Kullanıcı isterse geçiş ayrı iş.
- **Tur modu, kıyaslama modu, favoriler** (PLAN §5.2) yapılmadı — v1.1 adayı.
- **Tauri .dmg** (PLAN §10) yapılmadı; kullanıcı isteyince P5.5.
- **Bundle:** three.js chunk'ı 572 kB (gzip 143 kB). Landing ve Holocron onu yüklemiyor; 3D rotalar için kabul edildi.
- **Era geçişi** sahneyi yeniden kurar (`useEffect` bağımlılığı). 0.16 s karartma bunu örtüyor ama gerçek crossfade değil.

## 5. SÜREÇ

- Her anlamlı adımda: `npm run build` ✓ + tarayıcı doğrulaması + `git add -A && git commit` + `git push origin main` (ayrı komutlar).
- **Co-author/Claude imzası ASLA yok** — tek yazar `kutluhangil`.
- Dil: kullanıcıyla Türkçe; kod/commit İngilizce.
