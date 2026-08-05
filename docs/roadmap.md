# Galactic Archives — Roadmap

Kod tabanı ölçülerek çıkarılmış derin analiz + sıralı uygulama planı. Öncelikler:
**P0** (regresyon kalkanı, önce) · **P1** (yüksek değer) · **P2** (cila).

Uygulama kuralı: maddeler sırayla yapılır, her mantıksal birimden sonra ayrı `commit` +
`push` (co-author asla eklenmez). Her madde tamamlandığında bu dosyadaki kutusu işaretlenir.

---

## Özet durum

Bu dosyanın ilk hâli (2026-07-24) şunu ölçmüştü: sağlam çekirdek — ham three.js motoru,
81 gezegen doğrulanmış veriyle, 3 era, TR/EN, holocron, Legends katmanı, Vercel + Tauri —
ama çürük iskele: sıfır test, CI yok, ~40 ölü bağımlılık, `ErrorBoundary` yok, CSP yok.

**Bugünkü durum (2026-08-05):** iskele kapandı. 232 birim + 23 uçtan uca test, yeşil CI,
44 ölü paket söküldü, `ErrorBoundary` ve sıkı CSP yerinde, 224 görsel varlık üretildi.
02 Ağustos'ta gelen dört lore rotası (`/timeline`, `/force`, `/watch-guide`, `/hangar`)
CI'ı üç commit boyunca kırmıştı; lint hatası, aşılan stil bütçesi ve panelin üstünü örten
üst çubuk 05 Ağustos'ta düzeltildi. Aynı gün codex kayıtlarının 64'ü de kaynak makalesine
bağlandı. Açık kalan işler aşağıda kutusu boş duranlar; sırası `kalan-isler.md`'de.

---

## 1. Geliştirme / mühendislik sağlığı — en kritik

**Ölçülen**
- 0 test (vitest/jest/playwright yok). `gridToPos` + `loadBody` + validate + 81 JSON korumasız.
- CI yok (`.github/workflows` boş). Her push doğrulanmadan prod'a gidiyor.
- 0 `ErrorBoundary`. Lazy route / engine `throw` → beyaz ekran (router `errorElement` de yok).
- ~40 ölü bağımlılık (0 import): `@radix-ui/*` (28), `react-hook-form`, `recharts`, `zod`,
  `lucide-react`, `sonner`, `date-fns`, `react-day-picker`, `input-otp`, `embla-carousel`,
  `next-themes`, `react-resizable-panels`, `vaul`, `class-variance-authority`,
  `@hookform/resolvers`, devDep `kimi-plugin-inspect-react`. Kimi şablonu artığı.
- `fetch-lore` digest git'te yok → validate CI'da tekrar üretilemez.

**Yapılacak**
- [x] **P0** GitHub Actions: PR + main push'ta `tsc -b` + `eslint` + `validate-lore` + `build`.
- [x] **P0** `validate-lore` için sabit digest snapshot commit'le; CI koordinat/çap regresyonu yakalar.
- [x] **P1** Ölü ~40 bağımlılığı sök (`depcheck` ile doğrula). Supply-chain + lockfile + install küçülür. (44 paket söküldü; dependencies 50→9.)
- [x] **P1** Kök `ErrorBoundary` — hata temalı panel + reload/galaksiye-dön gösterir, beyaz ekran değil. (app `<Routes>` JSX API kullandığı için data-router `errorElement` yerine React class boundary.)
- [x] **P2** Smoke test (Playwright): 16 uçtan uca test (rota açılışı, deep-link panel, galaksi
  WebGL, komut paleti, hat gezinme, favori kalıcılığı) + 196 birim/bileşen testi. CI'da `verify`
  adımı hepsini koşuyor.

## 2. Güvenlik

**Ölçülen**
- Tauri `csp: null` — masaüstü kabuğu CSP'siz.
- Web CSP yok; `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS yok.
- LICENSE dosyası yok; içerik Wookieepedia CC BY-SA (share-alike). UI'da atıf var, repo lisansı yok.
- `.dmg` imzalama/notarization bekliyor → imzasız = Gatekeeper bloklar (kullanıcı işi).
- `npm audit`: 0 açık. Dependabot/renovate yok.

**Yapılacak**
- [x] **P1** `vercel.json` headers: sıkı CSP + `X-Content-Type-Options`/`Referrer-Policy`/`X-Frame-Options`/`Permissions-Policy`/HSTS. Tarayıcıda header enjekte edilerek doğrulandı — 0 ihlal, WebGL+font+inline-style çalışıyor.
- [x] **P1** Tauri `csp` dolduruldu (self + `ipc:`/`asset:` protokolleri). ⚠️ Masaüstü build doğrulaması bekliyor (`.dmg` zaten imzalama bekliyor — CSP o build'de test edilecek).
- [x] **P2** Tauri `capabilities` denetimi — **zaten en-az-yetki**: yalnız `main` penceresine `core:default`; shell/fs/dialog/http plugin izni yok, frontend Tauri plugin kullanmıyor. Sıkılaştırılacak fazla yetki yok.
- [x] **P2** LICENSE eklendi (kod MIT + içerik CC BY-SA + Star Wars ticari-marka disclaimer). Dependabot açıldı (`app/` npm haftalık + github-actions).

## 3. Performans

**Ölçülen**
- three.js 634 kB (168 gzip) — en büyük chunk, kendi chunk'ında. `examples/jsm` tam giriyor olabilir.
- Dokular hâlâ prosedürel (Gemini equirect map'ler bekliyor). KTX2/webp pipeline hazır, veri yok.
- `@fontsource` tam aileler — kullanılan ağırlıklara + latin/latin-ext'e subset edilmemiş.
- Galaxy `declutter()` her frame CPU'da 81 label çakışma testi.
- Prod FPS yeniden ölçülmeli (hafızada 160–175 notu var).

**Yapılacak**
- [x] **P1** KTX2 + `public/basis/` transcoder. 300 katmanın tamamı ETC1S KTX2; hat artık
  harici `toktx` yerine `ktx2-encoder`'ı Node içinde çalıştırıyor, yani her makinede aynı çıktı.
  Basis transcoder `public/basis/` altına kondu — o klasör hiç yoktu, KTX2 yolu kırıktı.
  Ölçüm: 4K albedo GPU'da ~43 MB RGBA yerine ~11 MB. ETC1S seçildi çünkü UASTC aynı karede
  görünmeyen detay için 9,7 MB istiyordu (ETC1S 1,4 MB).
- [~] **P1** Sahne kurulumunun main-thread bloğu. **Profil karar değiştirdi:** blok JS'te değil
  (JS ~300 ms), sürücü tarafında (~8 sn "(program)"), o yüzden sahneyi karelere bölmek doğru
  kaldıraç değil. Bunun yerine `renderer.compileAsync` eklendi: `KHR_parallel_shader_compile`
  olan tarayıcıda derleme bloklamadan yapılıyor. Headless SwiftShader'da eklenti yok, bu yüzden
  CI ölçümünde kazanç görünmüyor. Bloom'un payı ölçüldü: blok 1,81 sn → 1,27 sn (bloom kapalı).
  Kalan iş, program sayısını azaltmak — motor tasarımına dokunur, ayrı ele alınacak.
- [x] **P2** Perf: **KTX2Loader lazy + three chunk'tan ayrıldı** (dynamic import + manualChunks
  istisnası) → three 634→622 kB, KTX2 kendi 14.5 kB async chunk'ında (dokular gelene dek hiç
  yüklenmez). **Landing'de galaxy route idle-prefetch** → atlas'a giriş anlık. three narrowing
  ise ertelendi (riskli, `import * as THREE` namespace zaten Rollup tree-shake ediliyor).
- [~] **P2** Font subset — **gereksiz**: `@fontsource` `unicode-range`'li `@font-face` üretir,
  tarayıcı zaten yalnız kullanılan alt kümeyi (latin + latin-ext) indirir. Kazanç minimal.
- [~] **P2** `declutter` throttle — **gereksiz**: ~40 görünür label, 72–175 fps ölçüldü; O(n²)
  ≈ 1600 op/frame, darboğaz değil. Measure-first: optimize edilecek bir şey yok.

## 4. Tasarım / UX

**Ölçülen**
- Legends node'ları haritada ayırt edilmiyor — sadece panelde altın rozet.
- Canvas node'ları klavyeyle gezilemiyor. a11y: 22 `aria-`, 8 reduced-motion, `role=` sadece 2.
- Veri derinliği eşit değil: 34/81 gezegende POI, 3 tur.
- Era slider + Legends toggle keşfedilebilir değil.

**Yapılacak**
- [x] **P1** Legends node'larına harita düzeyi ayrım: dış **kesikli altın halka** (`continuity==='legends'`). Tarayıcıda doğrulandı — canon komşularından ayrık okunuyor.
- [x] **P1** Klavye/screen-reader erişimi: stabil sr-only `<nav>` tüm görünür gezegenleri sıralı yansıtır, Tab'da chip belirir, Enter dive eder; görsel label'lar mouse-only (`tabIndex=-1`, `aria-hidden`). Tarayıcıda doğrulandı (81 buton, focus→görünür chip). WebGL node churn'ü tab-order'dan çıkarıldı.
- [x] **P2** Holocron view transitions — kart↔portre shared-element morph + sayfa cross-fade.
  **Data-router migration yapıldı** (`createBrowserRouter` + `router.tsx` + `App` layout +
  `<Outlet/>`), böylece `<Link viewTransition>` artık `startViewTransition`'ı tetikliyor
  (tarayıcıda doğrulandı: `vtFired: true`). `HoloPortrait.vtName` ile kart↔hero `holo-<id>`
  eşleşir, `index.css`'te reduced-motion guard'lı. Regresyon yok: tüm rotalar + flyTo/veil
  kamera nav (galaxy→planet) doğrulandı. WebGL rotaları veil+cross-dissolve kullanmaya devam.
- [x] **P2** Mobile-first sertleştirme: 4-chip'li era selector'ı (Old Republic dahil) mobilde
  yatay-scroll'a aldı (sayfayı genişletmez), Compare + Holocron root'larına `overflow-x-hidden`.
  Galaxy'de yatay taşma 0px doğrulandı. Panel/palette/overlay'ler zaten `max-w` korumalı.
- [x] **P2** İlk ziyaret onboarding: `OnboardingHint` — era slider + Legends toggle'ı işaret eden, bir kez gösterilen (localStorage `ga-onboarded`), dismiss-edilebilir çift dilli kart.
- [x] **P2** POI kapsamı: 168 nokta, yalnız iki gövde POI'siz (`endor`, `yavin` — ikisi de gaz
  devi). Her nokta kendi Wookieepedia maddesinden yazıldı.
- [x] **P2** Tur sayısı 3 → 6: `rogue-one` (Rogue One rotası), `rebellion` (Andor'un dört durağı
  ve Coruscant) ve `dark-side` (Sith'in iz bıraktığı dünyalar) eklendi, hepsi çift dilli.
- [x] **P2** `docs/screenshots/` yeniden çekildi: altı kare de hiperuzay ağını, üretilen
  kartları ve KTX2 dokuları gösteriyor; gerçek GPU'da (Apple M4, ANGLE Metal) alındığı için
  fps göstergesi de dürüst (58-88 fps).

## 5. Özellik — PLAN boşlukları

**Yapılacak**
- [x] **P2** Legends zaman ekseni: `old-republic` era eklendi (`EraId` + `eras.json` + `ERA_ORDER`
  + `ERA_SHORT`), era seçicide **yalnız Legends açıkken** görünür. 7 Legends dünyası old-republic
  affiliation'ı taşır; canon dünyalar o era'da nötr. Stranding-önleme: Legends kapanınca /
  boot'ta era old-republic'teyse `empire`'e düşer. Tarayıcıda uçtan uca doğrulandı.
- [x] **P2** Arama filtresi — Holocron sayfasında bölge + medya filtresi zaten vardı; ⌘K
  command palette'e **bölge filtresi chip satırı** eklendi (bölge seçilince gezegenler filtrelenir,
  karakterler çekilir). Tarayıcıda doğrulandı (İç Halka → 3 dünya, karakterler gizli). Kalan
  (opsiyonel): faction/era ekseni.
- [x] **P2** `og:image` denetlendi — **sorun yok**: `build-static-meta` her gezegen için `sharp`
  ile paletinden social card çiziyor (`dist/og/<id>.png`, 82 kart), ayrıca `sitemap.xml` (166 URL)
  + `robots.txt` üretiyor. **Düzeltme:** ilk analizdeki "sitemap/robots yok" iddiası yanlıştı —
  `public/` yerine build çıktısı `dist/`'e üretiliyorlar. SEO/social altyapısı tam.
- [x] **P2** Codex kaynak disiplini: 64 gemi/savaş/Güç yeteneği/olay/yapım/telsiz kaydı
  `source` taşıyor, `scripts/fetch-codex.mjs` her atıfı MediaWiki API'sinde çözüyor,
  `test/fixtures/codex-digest.json` kanıt olarak commit'li, `validate-lore` kaynaksız
  kaydı, olmayan makaleyi, gerçek-dünya makalesi gösteren evren-içi kaydı ve canon diye
  sunulan Legends makalesini reddediyor. "Force absorb" = "Tutaminis" kopyası silindi.
- [x] **P2** Yeni rotalar statik meta + sitemap üretiyor (166 → 170 URL); üst çubuğun beş
  araç paneli tembel yüklendi (TopBar yığını 51,7 → 16,9 kB) ve ses tercihi
  `localStorage`'a bağlanıp ayarlar menüsüne taşındı.
- [x] **P1** Yeni sayfalarda a11y: beş araç paneli tek `ModalShell`'e taşındı (dialog rolü,
  başlıkla etiketleme, odak tuzağı, `Escape`, odağı açan öğeye geri verme);
  `Hangar`/`ForceLore`/`WatchGuide` `main` landmark, etiketli filtre grupları,
  `aria-pressed`/`aria-selected` ve listbox semantiği kazandı.
- [x] **P1** Yeni rotalar için birim + uçtan uca test: 226 birim/bileşen (202'den) ve
  23 uçtan uca (16'dan) — dört rota, atıf linkleri ve panel klavye akışı dahil.
- [ ] **P2** İlk boya 399 328/400 000 bayt — giriş yığınını bölmeden yeni özellik sığmaz.
- [x] **P3** Compare 2 → 4 sütun: set `?ids=` ile URL'de, eski `?a=&b=` linkleri çalışmaya devam
  ediyor, sütunlar tek ölçeği paylaşıyor, tavan 4 (her gezegen sütunu kendi WebGL sahnesini kurar).
- [x] **P2** Haftalık kanon nöbeti (`.github/workflows/canon-watch.yml`): 60 atıf makalesi canlı
  API'ye karşı yeniden çekilir, kayma olursa diff'li issue açılır — veri kendiliğinden değişmez.
- [ ] **P3** Compare'i sistem düzeyine çıkar.
- [ ] **P3** Karakter↔gezegen çapraz-graf navigasyonunu derinleştir.
- [ ] **P3** Megayapıları tamamla (Starkiller vb.).
- [ ] **P3** 3. dil gelince i18next'i yeniden değerlendir.

---

## Uygulama sırası (bu sırayla, aralarında commit+push)

1. **CI + validate-lore digest testi** (P0) — regresyon kalkanı.
2. **Ölü ~40 bağımlılığı sök** (P1) — güvenlik + bakım yüzeyi.
3. **ErrorBoundary + router errorElement** (P1) — beyaz ekran ölür.
4. **CSP** (web `vercel.json` + Tauri) (P1).
5. **Legends node'una harita-düzeyi görsel ayrım** (P1) — yarım kalan iş.
6. **Node klavye erişimi + focus ring** (P1).
7. P2 blok: LICENSE + Dependabot, Old Republic era chip, three/font incelt, declutter
   throttle, onboarding, ⌘K filtre. (Holocron VT bloklu — bkz. §4, data-router önkoşulu.)
8. **Data-router migration** (`createBrowserRouter`) — Holocron VT + route `errorElement`'i
   birlikte açar. Mimari karar; kullanıcı onayı bekliyor.
9. P3 blok ve kullanıcı verisine bağlı işler (dokular, POI, .dmg imzalama) sona.
