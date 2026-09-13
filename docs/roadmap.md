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

**Bugünkü durum (2026-08-05):** iskele kapandı. 259 birim + 29 uçtan uca test, yeşil CI,
44 ölü paket söküldü, `ErrorBoundary` ve sıkı CSP yerinde, 224 görsel varlık üretildi.
02 Ağustos'ta gelen dört lore rotası (`/timeline`, `/force`, `/watch-guide`, `/hangar`)
CI'ı üç commit boyunca kırmıştı; lint hatası, aşılan stil bütçesi ve panelin üstünü örten
üst çubuk 05 Ağustos'ta düzeltildi. Aynı gün codex kayıtlarının 64'ü de kaynak makalesine
bağlandı. Açık kalan işler aşağıda kutusu boş duranlar; sırası `kalan-isler.md`'de.

**Son doğrulama (2026-09-13):** `npm run verify` tam zincir geçti — 291 birim/bileşen ve
37 uçtan uca test yeşil, `validate-lore` **0 hata / 2 uyarı**, `validate-assets` 0 hata, bütçe
0 hata. Kaynaksız yedi POI kapandı: beşi maddesini gösteriyor, ikisi (Alderaan `castle-lands`
Legends-only, Felucia `fungal-plains` kaynaksız) silindi; 172 POI'nin hepsi kaynaklı. Kalan iki
uyarı kanonda grid hücresi olmayan hat durakları. Aynı gün statik meta katmanı uygulamanın
gerçekten render ettiği dile çekildi (Türkçe etiketler + `og:locale`/`og:locale:alternate`,
`hreflang` yok — dil URL'de değil) ve her statik sayfa JSON-LD aldı (`WebSite`/`WebPage`/
`BreadcrumbList`; kayıtlar `Thing` + `sameAs` → Wookieepedia). Ekran görüntüleri altı yeni kareyle
tamamlandı ve `npm run screenshots` ile yeniden üretilebilir hale geldi; kare çekerken bulunan iki
UI hatası (gemi şeması kutusu, ışın kılıcı etiketi) düzeltildi. Maskable ikon denetlendi —
içerik yarıçapı 0,64 < 0,8 güvenli bölge, değişiklik gerekmedi.

**Bir önceki doğrulama (2026-09-12):** `npm run verify` tam zincir geçti — 283 birim/bileşen ve
31 uçtan uca test yeşil, `validate-lore` 0 hata / 9 uyarı, `validate-assets` 0 hata, bütçe 0 hata.
`npm audit` yeniden **0 açık**: `sharp` 0.35.4 (high, libheif) ve `vitest`/`@vitest/ui` 5.0.0
(moderate, `@vitest/mocker` path traversal) yükseltildi, Dependabot'un bekleyen minor/patch
grubu uygulandı. Playwright 1.63 yeni tarayıcı ikilisi ister (`npx playwright install chromium`).
Tauri **GUI** doğrulaması hâlâ açık — `.dmg` imzalama bekliyor.

**Daha önce (2026-08-28):** `npm run verify` tam zincir geçti — `tsc -b`, `eslint`,
`validate-lore` (0 hata, 9 uyarı), `validate-assets` (0 hata), **283 birim/bileşen**, `build`,
bütçe (0 hata) ve **31 uçtan uca** test; ayrıca `cargo check` temiz. 25 Ağustos notundaki
"uçtan uca koşulamadı" kısıtı kalktı: bu makinede önizleme sunucusu bağlanıyor ve suite yeşil.
`npm audit` 0 açık (28 Ağustos'ta beş tanesi kapatıldı). Tauri **GUI** doğrulaması hâlâ açık —
`.dmg` imzalama bekliyor.

**Bir önceki doğrulama (2026-08-25):** 272 birim/bileşen testi geçti; Tauri geliştirme adresi,
geçersiz deep-link hata durumu, Glavis halka renderer'ı, texture yaşam döngüsü ve tüm detay
rotalarının statik metasına ait denetim açıkları kapatıldı.

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
  **29 Ağustos'ta program sayısı düştü:** `compileAsync` canvas'a göre ısıtıyordu, oysa her kare
  composer'ın kendi lineer target'ına çiziliyor — program anahtarı hedefe bağlı olduğundan three
  ilk karede her malzemeyi ikinci kez derliyordu, yani bu çağrı kaldırmak için var olduğu donmanın
  bir kısmını kendisi üretiyordu. Isıtma `composer.renderTarget1`'e alındı: gerçek tarayıcıda
  `linkProgram` sayılarak ölçüldü, gezegen rotası yüksek katmanda 22 → 16, düşük katmanda 14 → 8
  program. Bloom kapalıyken composer'ı tümüyle atlamak denendi ve **geri alındı**: düşük katmanı
  8 → 7'ye indiriyor ama ışıklı yüzeyi gözle görülür biçimde koyulaştırıyor, çünkü özel gövde ve
  atmosfer shader'ları `colorspace_fragment` taşımıyor, kareyi sRGB'ye kodlayan tek yer
  `OutputPass`. Kalan iş: bloom zincirinin 8 programı — görsel karar, ayrı ele alınacak.
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
- [x] **P1** Uzun listelerde ok tuşuyla gezinme: gezegen aynası (81 dünya), hat aynası (23 hat)
  ve Holocron'un iki kart ızgarası tek tab durağı tutuyor, oku basan o durağı yürütüyor
  (`useRovingFocus`). Izgarada aşağı/yukarı sütunu koruyor — satır geometrisi jsdom'da
  olmadığı için gerçek tarayıcıda uçtan uca doğrulandı; `Home`/`End` uçlara atlıyor,
  filtre listeyi değiştirince durak ilk karta dönüyor.
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
- [x] **P2** İlk boya tavandan indi: tur oynatıcısı `TourPlayerHost` arkasına alındı — `lib/lore`
  üzerinden istasyon/era/bölge/hizip/yapım tablolarını, yazılı turları ve hat turu yükleyicisini
  ilk boyaya taşıyordu, oysa tur başlamadan yapacak işi yok. Giriş yığını 346 → 308 kB, ilk boya
  399 500 → 361 270 bayt (%9,6). Bütçe tavanları da 330 kB / 390 kB'ye çekildi.
- [x] **P3** Compare 2 → 4 sütun: set `?ids=` ile URL'de, eski `?a=&b=` linkleri çalışmaya devam
  ediyor, sütunlar tek ölçeği paylaşıyor, tavan 4 (her gezegen sütunu kendi WebGL sahnesini kurar).
- [x] **P2** Haftalık kanon nöbeti (`.github/workflows/canon-watch.yml`): 60 atıf makalesi canlı
  API'ye karşı yeniden çekilir, kayma olursa diff'li issue açılır — veri kendiliğinden değişmez.
- [x] **P1** Lore rotalarında kaydırma hatası: `min-h-screen` sarmalayıcı, sabit yükseklikli
  `overflow:hidden` `#root` içinde büyüyüp ilk ekranın altındaki her kaydı kırpıyordu. Dördü de
  Compare'in kullandığı `h-full` kaydırma kabına alındı, uçtan uca iki test bunu koruyor.
- [x] **P2** Zaman çizelgesi scrollytelling: dönem bölümleri + yapışkan başlıklar, soldaki dönem
  rayı okuyucuyu takip eder ve tıklanınca ilgili döneme atlar, ekranın ortasındaki kayıt kendini
  işaretler (ölçüm kaydırmada yapılır; IntersectionObserver gizli sekmede kısıtlanıyor).
- [x] **P3** Compare'i sistem düzeyine çıkar: dördüncü mod **Sistemler**. Sütun artık dünya değil
  yıldız sistemi — güneşler (ad + renk), kanon ay sayısı, adı geçen aylar, o dönemde ayakta olan
  istasyonlar (Ölüm Yıldızı era-kapılı), birincil gövdenin çapı/bölge/sektör/hizip. Kanon 81 dünyaya
  81 ayrı sistem adı verdiği için sistem ayrı kayıt değil; `systemFacts` birincil gövdenin kendi
  kaydından okur, uydurmaz (ay sayısı yoksa boş kalır). Şema **SVG** — dört canlı sistem sahnesi
  dört WebGL bağlamı demekti, tek bakışta okunan bir resim için. Mod da URL'e yazıldı
  (`?mode=systems&ids=`), sekme değişince o modun kendi varsayılan seti yükleniyor.
- [x] **P3** Sektör ekseni: kanon sektör poligonu yok (71 dünya / 60 sektör), o yüzden harita
  katmanı değil **arama + filtre ekseni** oldu. Holocron'da sayılı sektör seçicisi (+ "sektörü
  kanonda belirtilmemiş" grubu), ⌘K'da sektör adı aranabilir — "Arkanis sector" üç dünyayı
  toplar. Yan bulgu: üç dünya sektör alanında `"None"`/`"N/A"` yer tutucusu taşıyordu (Tython,
  Morak, Plazir-15); alan kaldırıldı, `validate-lore` yer tutucuyu sektör adı saymayı reddediyor.
- [x] **P3** Karakter↔gezegen çapraz-graf navigasyonu: `src/lib/archive-graph.ts` gövde,
  karakter, olay ve tur kayıtlarını tek değişmez grafa bağlıyor — her kenar kendi kanıt
  kaydını taşıyor, uydurma çıkarım yok. `RelationshipExplorer` bunu Holocron'un karakter ve
  dünya kayıtlarında klavyeyle gezilebilir bağlantı listesi olarak gösteriyor, `RelevantTours`
  o dünyayı durak yazan turları başlatıyor. Uçtan uca doğrulandı (karakter → dünya geçişi).
- [ ] **P3** Megayapıları tamamla. Renderer tarafı hazır: `buildStationBody` tek dispatcher, iki
  motor da onu çağırıyor, `ringworld` (Glavis) eklendi. **Starkiller kısmı zaten kapalı** —
  ayrı bir istasyon değil, `ilum` kaydının kendisi ("Ilum / Starkiller Üssü", New Republic
  döneminde `starkiller-variant` dokusuna geçiyor). Açık olan, arşivde hiç bulunmayan bir
  megayapı eklemek ve o **sahibe bağlı**: her gövde kendi `<id>-albedo.png` master'ını ve
  Holocron kartını zorunlu tutuyor (`validate:assets` eksikte hata verir), görsel üretimi bende
  değil. Hangi yapı olduğu + görseller gelince kaydı, gerekirse yeni `stationVisual` tipini ve
  testini ben yazarım — akış `docs/senden-gerekenler.md` bölüm 3'te.
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
