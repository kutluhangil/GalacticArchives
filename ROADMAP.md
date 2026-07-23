# Galactic Archives — Roadmap

Kod tabanı ölçülerek çıkarılmış derin analiz + sıralı uygulama planı. Öncelikler:
**P0** (regresyon kalkanı, önce) · **P1** (yüksek değer) · **P2** (cila).

Uygulama kuralı: maddeler sırayla yapılır, her mantıksal birimden sonra ayrı `commit` +
`push` (co-author asla eklenmez). Her madde tamamlandığında bu dosyadaki kutusu işaretlenir.

---

## Özet durum

Sağlam çekirdek: ham three.js motoru, 81 gezegen doğrulanmış veriyle, 3 era, TR/EN,
holocron, Legends katmanı, Vercel + Tauri. Zayıf taraf mühendislik hijyeni: sıfır test,
CI yok, ~40 ölü bağımlılık, `ErrorBoundary` yok, CSP yok. Motor iyi, iskele çürük.

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
- [ ] **P2** Smoke test (Playwright): her rota açılıyor mu, galaxy 81 node, toggle 7 dünya.

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
- [ ] **P1** Gemini dokuları gelince KTX2 zorunlu + hero lazy. VRAM en büyük gerçek kazanç (kullanıcı verisine bağlı, bekliyor).
- [~] **P2** three import'larını dar tut — **ertelendi (riskli, düşük kesinlik)**. Kullanılan her
  three sınıfı elle doğrulanmadan narrowing regresyon riski; ölçülmüş darboğaz değil.
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
- [ ] **P3 (bloklu)** Holocron view transitions — kart↔portre shared-element morph. **Bulgu
  (tarayıcıda test edildi):** `view-transition-name` her iki tarafta doğru eşleşiyor ama
  react-router 7'nin `<Link viewTransition>` prop'u app'in **declarative `<BrowserRouter>`/
  `<Routes>`** API'siyle no-op — `startViewTransition` çağrılmıyor (sadece **data router**
  `createBrowserRouter` ile çalışır). Manuel `startViewTransition`+`flushSync` de temiz morph
  vermez: detay sayfası lazy chunk + async `loadBody` ile geç render olur, snapshot anında hero
  DOM'da yok. **Önkoşul: data-router migration (`createBrowserRouter`)** — bu ayrıca proper
  route `errorElement`'i de açar. Wiring geri alındı (no-op prop göndermemek için). WebGL
  rotaları zaten veil + cross-dissolve kullanıyor; oraya VT uymaz.
- [x] **P2** İlk ziyaret onboarding: `OnboardingHint` — era slider + Legends toggle'ı işaret eden, bir kez gösterilen (localStorage `ga-onboarded`), dismiss-edilebilir çift dilli kart.
- [ ] **P2** POI kapsamını 81'e yaklaştır; tur sayısını artır (içerik işi).

## 5. Özellik — PLAN boşlukları

**Yapılacak**
- [ ] **P2** Legends zaman ekseni: katman açıkken beliren "Old Republic" era chip'i (continuity ekseni hazır).
- [x] **P2** Arama filtresi — Holocron sayfasında bölge + medya filtresi zaten vardı; ⌘K
  command palette'e **bölge filtresi chip satırı** eklendi (bölge seçilince gezegenler filtrelenir,
  karakterler çekilir). Tarayıcıda doğrulandı (İç Halka → 3 dünya, karakterler gizli). Kalan
  (opsiyonel): faction/era ekseni.
- [ ] **P2** Gezegen başına `og:image` üretimini denetle (`build-static-meta` 166 URL üretiyor).
- [ ] **P3** Compare'i ikiden fazlaya / sistem düzeyine çıkar.
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
