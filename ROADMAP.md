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
- [ ] **P1** Ölü ~40 bağımlılığı sök (`depcheck` ile doğrula). Supply-chain + lockfile + install küçülür.
- [ ] **P1** Kök `ErrorBoundary` + router `errorElement` — hata panel gösterir, beyaz ekran değil.
- [ ] **P2** Smoke test (Playwright): her rota açılıyor mu, galaxy 81 node, toggle 7 dünya.

## 2. Güvenlik

**Ölçülen**
- Tauri `csp: null` — masaüstü kabuğu CSP'siz.
- Web CSP yok; `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS yok.
- LICENSE dosyası yok; içerik Wookieepedia CC BY-SA (share-alike). UI'da atıf var, repo lisansı yok.
- `.dmg` imzalama/notarization bekliyor → imzasız = Gatekeeper bloklar (kullanıcı işi).
- `npm audit`: 0 açık. Dependabot/renovate yok.

**Yapılacak**
- [ ] **P1** `vercel.json` headers: sıkı CSP + güvenlik header seti. Statik site, ucuz kazanç.
- [ ] **P1** Tauri `csp` doldur (`default-src 'self'`) + `capabilities` en-az-yetki denetle.
- [ ] **P2** LICENSE ekle (kod MIT + içerik CC BY-SA notu). Dependabot aç.

## 3. Performans

**Ölçülen**
- three.js 634 kB (168 gzip) — en büyük chunk, kendi chunk'ında. `examples/jsm` tam giriyor olabilir.
- Dokular hâlâ prosedürel (Gemini equirect map'ler bekliyor). KTX2/webp pipeline hazır, veri yok.
- `@fontsource` tam aileler — kullanılan ağırlıklara + latin/latin-ext'e subset edilmemiş.
- Galaxy `declutter()` her frame CPU'da 81 label çakışma testi.
- Prod FPS yeniden ölçülmeli (hafızada 160–175 notu var).

**Yapılacak**
- [ ] **P1** Gemini dokuları gelince KTX2 zorunlu + hero lazy. VRAM en büyük gerçek kazanç (kullanıcı verisine bağlı, bekliyor).
- [ ] **P2** three import'larını dar tut; kullanılmayan loader/control at.
- [ ] **P2** Fontları subset et (kullanılan ağırlık + latin-ext).
- [ ] **P2** `declutter`'ı throttle et (kamera durunca / ~10fps).

## 4. Tasarım / UX

**Ölçülen**
- Legends node'ları haritada ayırt edilmiyor — sadece panelde altın rozet.
- Canvas node'ları klavyeyle gezilemiyor. a11y: 22 `aria-`, 8 reduced-motion, `role=` sadece 2.
- Veri derinliği eşit değil: 34/81 gezegende POI, 3 tur.
- Era slider + Legends toggle keşfedilebilir değil.

**Yapılacak**
- [ ] **P1** Legends node'larına harita düzeyi ayrım (altın halka / kesikli çember).
- [ ] **P1** Node'lara klavye erişimi + focus ring (en büyük a11y açığı).
- [ ] **P2** Holocron view transitions — kart↔portre shared-element morph. **Karar: manuel
  `document.startViewTransition` browser API** (react stable kalır, canary'ye geçilmez, sıfır
  bağımlılık riski; desteklemeyen tarayıcıda graceful cut). WebGL rotaları mevcut veil +
  cross-dissolve sistemini korur — VT canlı kamera uçuşunu animasyon yapamaz, oraya uymaz.
- [ ] **P2** İlk ziyaret onboarding (era slider + Legends toggle ipucu).
- [ ] **P2** POI kapsamını 81'e yaklaştır; tur sayısını artır (içerik işi).

## 5. Özellik — PLAN boşlukları

**Yapılacak**
- [ ] **P2** Legends zaman ekseni: katman açıkken beliren "Old Republic" era chip'i (continuity ekseni hazır).
- [ ] **P2** Arama filtresi (bölge / faction / era) — `fuse.js` kurulu, sadece isim araması var.
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
7. P2 blok: Holocron VT (manuel API), Old Republic era chip, arama filtresi, three/font
   incelt, declutter throttle, onboarding, LICENSE + Dependabot.
8. P3 blok ve kullanıcı verisine bağlı işler (dokular, POI, .dmg imzalama) sona.
