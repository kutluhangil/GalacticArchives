# HANDOFF — Galactic Archives · Devam Talimatı
### Yazılma anı: 23 Temmuz 2026 · Son commit: `dd3ddc4` (P1) · Branch: `main`

Bu dosya, context temizliği sonrası kaldığı yerden devam etmek için yazıldı.
**Önce oku:** `PLAN.md` (ürün+teknik plan, faz kabul kriterleri) ve `design.md` (Gemini varlık brief'leri). Bu dosya ikisini TEKRARLAMAZ; durum + direktif + sıradaki işin somut spec'ini verir.

---

## 1. KULLANICI DİREKTİFLERİ (23 Tem 2026 mesajından — bağlayıcı)

1. **Otonom çalış, HİÇBİR ŞEY SORMA.** P2'den başla, P5 dahil bitene kadar durma. Öneriler onaylı — uygula. Revize en sonda birlikte yapılacak.
2. **Ara ara commit + push** (faz sonları + anlamlı ara adımlar). Commit ve push AYRI komut. **Co-author/Claude imzası ASLA yok** — tek yazar `kutluhangil`.
3. **Gezegen kalitesi üst düzey ve CANLI olacak.** Kullanıcı referans olarak kendi eski Kimi solar-system projesini gösterdi (canlı gezegenler + dünyalar arası akıcı geçişler). Talimat: "senin tasarımın daha iyi olsun." → §4 Canlılık Pası zorunlu kapsam.
4. **En sonda Vercel'e deploy et** (kullanıcının Vercel MCP bağlantısı var).
5. Mobil hâlâ kapsam DIŞI (P6, ayrıca istenecek).
6. Dil: kullanıcıyla Türkçe; kod/commit İngilizce.

## 2. DURUM

| Faz | Durum | Not |
|-----|-------|-----|
| P0 Veri | ✅ | 41 gök cismi (34 dosya + iç içe aylar) + 2 Ölüm Yıldızı + 33 karakter + meta; Wookieepedia API çapraz doğrulama 0 hata (`app/scripts/validate-lore.mjs`) |
| P1 Motor | ✅ kod | 11 arketipli prosedürel uber-shader, 5 kahraman gezegen (tatooine/coruscant/mustafar/hoth/bespin), Tatoo sistem görünümü, hipersıçrama, TR/EN HUD, 160–175 fps tarayıcı doğrulamalı |
| Gemini varlıkları | ⏳ kullanıcıda | Parti 1 (7 harita) bekleniyor; gelince `raw/planets/` altına düşecek — stil kilidi sonrası kalan ~82 |
| P2–P5 | ❌ | Bu handoff'un işi |

**Dosya haritası (app/src):** `lib/engine/{engine-base,planet-engine,system-engine,planet-shaders,noise-glsl}.ts` · `lib/{lore,sim-clock,ui-strings}.ts` · `state/app.ts` · `pages/{PlanetView,SystemView,Home(=eski uydu demosu /legacy)}.tsx` · `components/hud/{TopBar,PlanetPanel,TimeBar}.tsx` · `components/{HyperspaceOverlay,useJump}.tsx|ts` · `data/{planets/*.json,characters.json,stations.json,meta/*,sources.json}` · `types/lore.ts`

**Komutlar:** `cd app && npm run dev` · `npm run build` · `node scripts/validate-lore.mjs <digest>` · digest: scratchpad'te yoksa `node scripts/fetch-lore.mjs /tmp/lore-digest.json`

## 3. KRİTİK TUZAKLAR (yaşandı, tekrarı yasak)

1. **Bash cwd her çağrıda repo köküne resetlenir.** `npm ...` komutlarını DAİMA `cd /Volumes/ProjectVault/GalacticArchives/app && ...` ile başlat. (Kök'e kaçan install, vite'ta `Could not resolve "react" imported by "zustand"` → SESSİZ siyah ekran yaptı.)
2. `vite.config.ts` **`base: '/'` kalacak** (`'./'` derin SPA rotalarında asset 404 → siyah ekran).
3. Wookieepedia normal fetch **402** verir; **`starwars.fandom.com/api.php`** çalışır. Infobox grid parametresinin adı **`coordinates`**.
4. `package-lock.json` public registry'ye göre üretildi — Kimi mirror URL'leri geri gelmesin.
5. Doğrulama scripti her veri değişiminde koşulmalı; `(?)` işaretli alan yasak.
6. index.html `<title>` hâlâ "ORBIT VEIL..." — P3 markalamada `GALACTIC ARCHIVES` yap (favicon dahil).
7. Tarayıcı testinde konsol boş görünse bile modül hatası olabilir → `await import(script.src)` numarasıyla yakala.

## 4. CANLILIK PASI (kalite direktifi — P2 içinde uygula)

Her arketipe hareket + derinlik. Hedef: gezegen "yaşıyor" hissi, 60 fps'ten taviz yok (uniform güncellemeleri ucuz, ek draw call'ları instanced yap):

- **Tüm gezegenler:** bulut katmanı bağımsız yavaş dönüş (halihazırda scroll var — hızını arketipe göre ayarla), atmosfer rim'e hafif nefes (sin(t) yoğunluk ±%5), yıldız alanına çok hafif twinkle (shader'da hash flicker).
- **desert:** ısı pusu (rim yakını UV wobble), seyrek kum fırtınası lekesi (yavaş gezen koyu leke).
- **ecumenopolis:** gece tarafında **trafik akış çizgileri** (ekvatora paralel birkaç parlak akan hat: uv.x kaydırmalı ince çizgi maskesi), ışıklarda blok blok flicker; gündüz tarafında uçak-izi benzeri mikro parıltılar.
- **lava:** lav kanallarında **akış** (mevcut uTime domain shift hızlandır + emissive pulse), yüzeyden yükselen kıvılcım partikülleri (küçük Points sistemi).
- **ice:** aurora perdesi (kutup üstünde additive şerit mesh, sin dalgalı), spekülr glint kamera hareketiyle oynar (zaten var).
- **ocean-storm:** fırtına hücreleri dönerek ilerlesin (domain rotation), **şimşek flaşları** (rastgele nokta ışıması 2-3 kare) — Kamino imzası.
- **gas-giant:** bant differential rotation (lat'a göre farklı hız domain shift), fırtına ovalinin yavaş sürüklenişi.
- **verdant:** bulut gölgeleri (bulut alfasını yüzeye ikinci örnekleme ile koyulaştır — tek texture lookup), gündoğumu hattında altın tint.
- **dark-storm (Exegol):** sürekli bulut kapağı + dikey şimşek sütunları (billboard flaş).
- **crystal-red (Mandalore/Dathomir/Crait):** iridescence açı kayması, Dathomir'de yüzeyden sızan kızıl sis hacmi (yarı saydam ikinci shell).
- **Sistem görünümü:** gezegen seçiliyken yumuşak kamera takibi; **ambient gemi trafiği** (instanced 8-12 nokta-sprite, spline'da; Coruscant yoğun, Tatooine tek tük); ara sıra hipersıçrama flash'ı (bir sprite'ın streak ile gelişi).
- **Geçişler (kullanıcının örneğindeki his):** gezegen→gezegen doğrudan geçişte kamera mevcut gezegenden UZAKLAŞIR → hipersıçrama → yenisine YAKLAŞIR (dive-in: kamera distance 8→3 ease-out 1.2s). PlanetView mount'ında dive-in animasyonu ekle. Sistem→gezegen tıklamasında da aynı dive.

## 5. SIRADAKİ İŞLER — SOMUT SPEC

### P2 — Galaksi Haritası + tam kadro + era (Canlılık Pası dahil)
1. **`galaxy-engine.ts`** (`/galaxy` rotası): eğik bakışlı 3D galaksi diski.
   - Zemin: prosedürel galaksi dokusu (Points spiral + merkez parlama + toz şeritleri; `fx/galaxy-core` Gemini gelmeden prosedürel).
   - Bölge halkaları: `meta/regions.json` sırasına göre yarıçap bantları; hover'da bölge adı (TR/EN).
   - **Sistem düğümleri:** 34 hedef. Konum: `coordinates` grid'inden (harf=X A..V, sayı=Y 1..21) normalize; koordinatsızlar (kamino/peridea/shakari/ahch-to zaten var/…) elle: Kamino güney-doğu dış kenar, Peridea sol üst köşe ayrı "Uzak Galaksi" adacığı, Exegol/Ilum/Ahch-To batı Unknown Regions.
   - Düğüm görseli: renk = era'ya göre fraksiyon rengi; yok edilmişse kırık halka ikonu. Tıkla → hyperspace → `/system/:id`.
   - Arama: shadcn `command` (⌘K) — gezegen/karakter adlarıyla (TR+EN), seçince jump.
2. **SystemEngine genişletme:** `moonsDetail` aylarını gerçek renderRecipe'leriyle çiz (Endor sistemi = gaz devi + Orman Ayı + Kef Bir; Yavin = kızıl dev + Yavin 4; Nal Hutta + Nar Shaddaa; Mandalore + Concordia). Aylar tıklanabilir → `/planet/:moonId` (loadBody cache'te ay id'leri zaten var). İstasyonlar: era uygunsa (existsInEras) yörüngede **prosedürel Death Star** (küre + çanak girinti: küçük ikinci küre CSG yerine çanak halka + koyu daire decal yeterli + greeble noise emissive pencereler) — DS2 yarım-iskelet: clipping plane veya yarı-şeffaf wireframe yarıküre.
3. **Era sistemi:** `stateByEra` uygulaması — Alderaan `empire`+ sonrası asteroit alanına dönüşür (InstancedMesh ~600 taş, yavaş dönen disk), Ilum `new-republic`'te starkiller varyant efekti (ekvator hendek çizgisi + kızıl ışıma), DS1/DS2 sadece `empire`. Era değişince crossfade (0.3s karartma).
4. **Kalan 29 gezegen:** Veri hazır — TopBar hero sekmeleri yerine **tüm gezegenler dropdown/командpalette**; `/planet/:id` her id ile çalışıyor zaten. Her arketipin en az 1 örneğini tarayıcıda screenshot doğrula (`screenshots/p2-*.jpg`).
5. Era pill etiketlerini düzelt (şu an "32|19 BBY|4" saçma görünüyor) → era adının kısaltması: "Klon Savaşları" / "İmparatorluk" / "Yeni Cumhuriyet".
6. **Kabul:** galaxy→system→planet→galaxy akış 60fps; era değişimi çalışır; Alderaan patlar; 34 hedef gezilebilir; canlılık maddeleri gözle görülür.

### P3 — Landing + Holocron wiki + i18n + markalama
- Landing `/`: yıldız alanı + "A long time ago..." mavi metin (2s) → LOGO (Star Jedi yoksa Libre Franklin 900 + letterspacing, `#FFE81F`) → EXPLORE / HOLOCRON CTA; scroll'da öne çıkan 6 gezegen kartı (canlı mini önizleme YOK — statik gradient kart, perf).
- `/holocron`: kart grid (gezegen+karakter+medya), fuse.js arama, filtreler (bölge/era/medya). `/holocron/planet/:id` (tam sayfa: tüm funFacts, POI listesi, karakter bağlantıları), `/holocron/character/:id` (holo-portre placeholder: mavi silüet SVG, Gemini C sınıfı gelince değişir).
- i18next migrasyonu (ui-strings.ts → i18next kaynakları), `<html lang>` senkron, title/meta/OG; favicon (holocron küpü SVG).
- Route-level code splitting (`React.lazy`) — 926KB ana chunk bölünecek (three ayrı chunk).
- **Kabul:** Lighthouse a11y ≥90; iki dil eksiksiz; `/legacy` çalışmaya devam eder.

### P4 — Ses + cila
- WebAudio manager (`lib/audio.ts`): kanallar music/ambience/sfx; **SFX'leri sentezle** (osc/noise: hover blip, select, panel-open, hyperspace whoosh = filtered noise sweep, era-shift). Müzik slot loader: `public/audio/music/<id>.mp3` varsa çal; yoksa sessiz. ACE-Step ile arketip ambientleri üretmeyi DENE (acestep skill); üretilemezse slot boş kalır — bloklamaz.
- Mute butonu gerçek işlev + volume persist; autoplay kısıtı: ilk etkileşimde başlat.
- Easter egg: Kessel Run kronometresi (Kessel sayfasında Maw turu), porg tık sesi (Ahch-To).
- Kalite ayarı (Auto/Low/High): DPR clamp + bloom toggle + starfield sayısı.
- `prefers-reduced-motion` denetimi tüm animasyonlarda.

### P5 — Vercel deploy (SON ADIM)
- `app/vercel.json`: `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }` (SPA deep link ŞART — base '/' tuzağının kardeşi).
- Deploy: Vercel MCP `deploy_to_vercel` veya `vercel` skill; proje adı `galactic-archives`. Önce preview, kontrol screenshot'ı, sonra production.
- Yayın sonrası: URL'yi kullanıcıya raporla + `screenshots/p5-live.jpg`.
- Tauri .dmg bu sprintte YOK (kullanıcı istemedikçe P5.5 olarak beklet — plan §10 hazır).

### Süreç
- Her faz sonunda: `npm run build` ✓ + tarayıcı screenshot doğrulaması + `git add -A && git commit` + `git push origin main` (ayrı komutlar).
- Gemini Parti 1 dokuları gelirse (kullanıcı `raw/` bırakır): KTX2 pipeline'ı kur (`scripts/process-textures.mjs`: sharp ile seam-check/resize → `public/textures/planets/...`; KTX2 toolu yoksa PNG/WebP fallback kullan, engine `TextureLoader`) ve 5 kahramanda `uUseAlbedo=1` doğrula.
- Bitişte: kısa Türkçe özet + canlı URL + revize listesi iste.
