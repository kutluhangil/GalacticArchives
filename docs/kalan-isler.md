# Kalan işler — Galactic Archives

**Canlı:** https://galactic-archives.vercel.app · **Branch:** `main` · **Güncelleme:** 2026-09-13

Bu dosya durum kaynağı: neyin bittiği, neyin **sende**, neyin **bende** olduğu. Sende olan
işlerin adım adım anlatımı ayrı dosyada: [senden-gerekenler.md](senden-gerekenler.md).

---

## Biten iş (doğrulanmış)

| Alan | Durum | Kanıt |
|---|---|---|
| Görsel üretimi | **224/224 varlık teslim** | `npm run validate:assets` → `88 albedo, 12 night, 300 texture tiers, 88 cards, 33 portraits, 3 brand · ERRORS: 0` |
| Veri | 81 gezegen + 2 istasyon + 5 detaylı ay, 172 POI (86/88 gövdede, **hepsi kaynaklı**), 23 hiperuzay hattı | `npm run validate` → 0 hata, 2 uyarı |
| Codex | 64 kayıt (10 gemi, 8 savaş, 15 Güç yeteneği, 8 olay, 19 yapım, 4 telsiz), hepsi kaynak makalesini gösteriyor | `npm run validate` → `codex records=64, cited articles=60` |
| Test | 309 birim/bileşen + 39 uçtan uca geçti | `npm run verify` → 39 dosya / 309 test, `playwright` 39 passed |
| CI | Yeşil | GitHub Actions `CI / verify` |
| Bağımlılık güvenliği | 0 açık | `npm audit` → `found 0 vulnerabilities` (5 açık 2026-08-28'de, 4'ü daha 2026-09-12'de kapatıldı) |
| Dağıtım | Vercel üretim canlı, Root Directory = `app` | `vercel ls galactic-archives` |

**Lore sayfaları (2026-08-02'de eklendi, 2026-08-05'te kaynaklandı):** `/timeline`,
`/force`, `/watch-guide`, `/hangar` rotaları + üst çubuktaki beş araç paneli
(Hiperuzay, Işın Kılıçları, Telsizler, Aurebesh, Holo-Kimlik) ve Holocron testi.
Dördü de artık statik meta + sitemap üretiyor; araç panelleri tembel yükleniyor.

**Görsel üretimi tarafında açık prompt kalmadı.** `docs/gorsel-uretim-promptlari.md`
içinde dosya yolu verilen 223 varlığın 223'ü diskte; üstüne `docs/brand/readme-banner.png`.

---

## 1. Sende olan işler

Adım adım anlatımı **[senden-gerekenler.md](senden-gerekenler.md)** taşıyor; burada yalnız özeti
duruyor, çünkü aynı yönergeyi iki dosyada tutmak ikisinin de yanlış olmasıyla biter.

| # | İş | Durum |
|---|---|---|
| 1 | `.dmg` imzalama + notarization — Developer ID `.p12` + parolası, app-specific password, Team ID; beşi GitHub Actions secret'ı olarak girilecek | **Blokaj.** Bunlar gelmeden imzalı derleme yok |
| 2 | Yeni görsel üretimi | Yalnız arşive yeni bir gövde eklersen. Şu an eksik varlık yok |
| 3 | Haftalık kanon nöbetinin açtığı issue'larda çözüm yönü | Issue açıldığında |
| 4 | Üçüncü dil kararı (gelirse `i18next`) | İstediğin zaman |

---

## 2. Bende olan işler

Sıra bu; her madde ayrı commit + push.

Bu listenin beş kalemi 2026-08-02'de kapandı:

| # | İş | Sonuç |
|---|---|---|
| 1 | Ekran görüntüleri | Altı kare yeniden çekildi; hiperuzay ağı, üretilen kartlar ve KTX2 dokular görünüyor. Gerçek GPU'da alındı, fps göstergesi dürüst (58-88). |
| 2 | KTX2 + `public/basis/` | 300 katmanın tamamı ETC1S KTX2. Hat harici `toktx` yerine `ktx2-encoder`'ı Node içinde çalıştırıyor; transcoder `public/basis/` altına kondu (o klasör hiç yoktu, yol kırıktı). 4K albedo GPU'da ~43 MB yerine ~11 MB. |
| 3 | Sahne kurulumundaki blok | Profil kararı değiştirdi: blok JS'te değil (~300 ms), sürücüde (~8 sn). Sahneyi karelere bölmek yerine `renderer.compileAsync` eklendi. Blok tamamen bitmedi — kalanı program sayısını azaltmak, ayrı iş. |
| 4 | Turlar | 3 → 6: `rogue-one`, `rebellion`, `dark-side`. |
| 5 | `docs/roadmap.md` | Kutular gerçekle hizalandı. |

---

## 3. Açık kalanlar

Sıradaki işler:

- **Klavye ile gezinme derinliği — kapandı.** Araç panelleri `dialog` (odak
  tuzağı + `Escape` + odağı geri verme), üç sayfa `main` + etiketli filtre
  grubu, `HolocronQuiz` aynı kabukta, `ShipBlueprint`'in şeması dekoratif.
  Son kalem de bitti: uzun listeler tek tab durağı tutuyor, ok tuşları o durağı
  yürütüyor (`src/hooks/useRovingFocus.ts`) — galaksinin gezegen ve hat
  aynaları, Holocron'un dünya ve karakter ızgaraları. Izgarada aşağı/yukarı
  sütunu koruyor, `Home`/`End` uçlara atlıyor.
- **İlk boya artık tavanda değil.** Tur oynatıcısı kendi host'una alındı
  (`TourPlayerHost`): `lib/lore` üzerinden istasyon/era/bölge/hizip/yapım
  tablolarını ve yazılı turları ilk boyaya taşıyordu. Giriş yığını 346 → 308 kB,
  `first paint total` 399 500 → 361 270 bayt. Bütçe tavanları da indirildi
  (giriş 330 kB, ilk boya 390 kB) ki kazanç geri kaçmasın.
- **Karakter ↔ gezegen çapraz-grafı — kapandı.** `src/lib/archive-graph.ts` gövde, karakter,
  olay ve tur kayıtlarını tek değişmez grafa bağlıyor; her kenar kanıtını kendi kayıt
  ID'sinden alıyor, serbest metinden çıkarım yapmıyor. `RelationshipExplorer` Holocron'un karakter ve
  dünya kayıtlarında klavyeyle gezilebilir bağlantı listesi, `RelevantTours` o dünyayı durak
  yazan turları başlatıyor, turlar `localStorage`'a kaydedilebiliyor. WebGL yoksa kayıt yine
  okunuyor (`WebGLUnavailable` + tekrar dene).

2026-08-25 denetim/düzeltme turunda Tauri geliştirme adresi sabitlendi, bozuk body deep-link'leri
geri dönüşlü hata ekranına taşındı, Glavis gerçek halka-habitat renderer'ına ayrıldı, KTX2 yükleme
ve cache sahipliği engine yaşam döngüsüne bağlandı, System view KTX2 yüzeylerini kullanmaya başladı
ve statik SEO ay/istasyon/karakter rotalarına genişletildi (217 URL).

2026-08-28 turunda `npm audit`'in bildirdiği beş açık kapatıldı (`react-router` 7.18.1 → 7.18.2
RSC-mode CSRF, `postcss` 8.5.22 → 8.5.26 `sourceMappingURL` ile keyfi `.map` okuma, ve onun
`nanoid`'i, ESLint altındaki `js-yaml` ile `brace-expansion`) — hepsi semver uyumlu, yalnız
`package-lock.json` değişti. Aynı turda hiperuzay anahtarının uçtan uca testi `test.slow()` aldı:
`/galaxy` + `reload` soğuk sahne kurulumunu iki kez ödüyor, yeşil koşuda 30 sn'lik bütçenin
26,7 sn'sini yiyip sonraki koşuda zaman aşımına düşüyordu. Uçtan uca suite artık bu makinede
koşuyor ve yeşil; kalan doğrulama yalnız Tauri GUI (imzalama bekliyor).

2026-09-12 turunda bağımlılıklar yeniden denetlendi: `npm audit` dört açık bildiriyordu,
oysa üç doküman "0 açık" yazıyordu. `sharp` 0.35.3 → 0.35.4 (**high** — libheif'te
GHSA-g89c-p67h-r497 ve GHSA-2jg2-4ch7-h545) ve `vitest` + `@vitest/ui` 3.2.7 → 5.0.0
(moderate — `@vitest/mocker` redirect mock'u üzerinden path traversal; düzeltme yalnız 5.x'te,
4.1.10 hâlâ etkilenen aralıkta) yükseltildi. Aynı turda Dependabot'un bir aydır bekleyen
minor/patch grubu da yerelde uygulandı (zustand, `@playwright/test` 1.63.0, iki testing-library
paketi, üç `@types`, `autoprefixer`, `eslint-plugin-react-refresh` 0.5.6, `postcss`,
`typescript-eslint`). Playwright 1.63 yeni tarayıcı ikilisi istedi (`npx playwright install
chromium`) — o kurulmadan uçtan uca suite 31/31 düşüyor, kod hatası değil. Sonuç:
`npm audit` 0 açık, 283 birim/bileşen ve 31 uçtan uca test yeşil.

Aynı gün hangar tarafındaki bir yarım iş kapandı: `ShipBlueprint` yalnız üç gemiye şema
çiziyordu (falcon, İmparatorluk Yıldız Yok Edicisi, X-wing); kalan yedisi tek üçgenlik bir
fallback'e düşüyor ve hepsi aynı kaynaksız "durasteel gövde" metnini taşıyordu — arşivin geri
kalanının reddettiği türden uydurma. Yedi geminin her biri kendi siluetini ve kanondan yazılmış
beş bileşen açıklamasını aldı; fallback silindi, şeması olmayan gemi artık bunu söylüyor. Şema
tablosu `src/lib/ship-blueprints.ts`'e taşındı, üç yeni test her geminin şemasını ve çift dilli
etiketlerini koruyor. Siluetler gerçek tarayıcıda ekran görüntüsüyle denetlendi; Slave I, Venator
ve Executor okunmadığı için yeniden çizildi. Test sayısı 283 → 286.

Üçüncü kalem 404'tü: router'ın `*` rotası `Navigate to="/"` idi ve `vercel.json` her yolu kabuğa
yazıyordu, yani yanlış adres landing sayfasını 200 ile döndürüyordu. Artık temalı bir `NotFound`
rotası bulunamayan adresi gösteriyor, rewrite listesi uygulamanın kendi rotalarıyla sınırlandı ve
build `dist/404.html` üretiyor (kabuk + `robots: noindex`), böylece bilinmeyen ilk yükleme gerçek
404 statüsüyle dönüyor. Ön-üretilmiş dünya sayfaları dosya sisteminde rewrite'tan önce eşleştiği
için `/planet/hoth` etkilenmedi. Statü kodu tarafı Vercel'e ait; `vite preview`'da böyle bir kural
yok, o yüzden suite sayfayı doğruluyor, bütünlük testi de catch-all'ı artık yasaklıyor. Aynı turda
iki yan hata düzeldi: service worker her gezinme yanıtını `/` altında app-shell olarak saklıyordu
(404 dahil; artık yalnız kök ve yalnız `ok` yanıt, cache sürümü `ga-v3`), ve Türkçe `toUpperCase()`
"BİR"i "BIR" yapıyordu (404 ve hata sınırı başlıkları `toLocaleUpperCase(lang)` kullanıyor).

Dördüncü kalem kaynaksız yedi POI'ydi (13 Eylül). Beşi kanonda karşılığını buldu ve maddesini
gösteriyor: Peridea `noti-caravan` → `Noti`, `bone-ring` → `Purrgil` (halkanın balina kemiği
olduğunu yazan madde), Scarif `beach-landing` → `Battle of Scarif` (Crait'in `salt-plain`
kaydıyla aynı desen), Shakari `underworld-streets` → `Unidentified city (Shakari)`. Ryloth'un
`gutkurr-caves` kaydı "her işgalde Twi'lek sığınağı olmuş mağaralar" diyordu — kanonda böyle bir
mağara yok; kayıt kanonun gerçekten yazdığına, gutkurrların av sahasına çevrildi (`Gutkurr`).
İki POI silindi: Alderaan `castle-lands` yalnız Legends'ta var, kanon bir gövdeye iliştirilemez
(kendi metni de bunu itiraf ediyordu), Felucia `fungal-plains` ise hiçbir maddeye dayanmıyordu —
Felucia'nın kanon mekânları `Akira` ve `Tagata` köyleri, istersen biri yeni bir POI olabilir.
`test/fixtures/poi-digest.json` beş yeni maddeyi aynı `resolve` çıktısıyla taşıyor. Uyarı sayısı
9 → 2; kalan ikisi kanonda grid hücresi olmayan hat durakları (Salin, Wretch of Tayron).

Beşinci kalem sunulan sayfanın dilini yanlış söylemesiydi. `index.html` `lang="en"` diyordu ve
tüm statik sayfalar İngilizce etiket taşıyordu; oysa dil `localStorage`'da duruyor
(`src/state/app.ts`), ilk ziyarette kayıt yok ve render edilen — hem okuyucuya hem crawler'a —
Türkçe. Kabuk ve üretilen her sayfa artık kendini Türkçe anlatıyor; paylaşım kartları da
(`toLocaleUpperCase('tr')`, yoksa "İzole" → "IZOLE"). `og:locale: tr_TR` +
`og:locale:alternate: en_US` aynı adresin sunduğu İngilizceyi söylüyor. **`hreflang` bilinçli
olarak yok:** dil başına bir URL ister, burada kayıt başına tek URL var — iki adres birebir aynı
baytı döndürürdü.

Aynı turda her statik sayfa JSON-LD aldı: `WebSite` + `WebPage` + `BreadcrumbList`. Kayıtlar
`Thing` olarak işaretli, `Place`/`Person` değil — o tipler varlığın gerçekten var olduğunu söyler
— ve `sameAs` yazıldıkları Wookieepedia maddesini gösteriyor. `/galaxy`, `/holocron` ve `/compare`
sitemap'teydi ama canonical'ları hâlâ ön kapıyı gösteriyordu; artık kendi sayfaları var, `/` de
aynı üreticiden geçiyor. Meta açıklamaları kelime sınırında kesiliyor (eskiden "İmparatorluk
yürüyücüleri sırtı aşa" diye yayımlanıyordu). Yeni `e2e/static-meta.spec.ts` tarayıcı JavaScript
çalıştırmadan ham HTML'i çekip bunları doğruluyor (6 test). Beşinci kalemin bıraktığı sınır
yedinci turda kapandı (aşağıda).

Altıncı kalem ekran görüntüleriydi: dört arşiv rotası, araç panelleri ve ilişki gezgini altı
haftadır hiçbir yerde görünmüyordu. `scripts/capture-screenshots.mjs` (`npm run screenshots`)
derlenmiş uygulamayı Playwright ile sürüp `docs/screenshots/` altına yazıyor — kare elle
sahnelenmiyor, yeniden üretilebiliyor. README artık zaman çizelgesini, izleme rehberini, Güç
Kasası'nı, şeması açık hangarı, haritanın üstünde bir araç panelini ve arşiv bağlantı grafiğini
gösteriyor; kimsenin referans vermediği iki eski kare (Tatoo sistemi, Mustafar) de üç kademeli
hiyerarşiyi anlatmaya girdi.

Fotoğraf çekmek iki hata ortaya çıkardı. Gemi şemasının `viewBox`'ı kare, kutusu ise tam genişlik
+ sabit yükseklikti; çizim o yüksekliğe küçülüyor, panelin çoğu boş kalıyordu — kutu da kare
oldu. Işın kılıcı listesi "Form I - Form I: Shii-Cho" yazıyordu: form numarası, ardından zaten
o numarayla başlayan ad. Ön ek ve artık okunmayan `formNumber` alanı silindi, bir test etiketi tek
söyleyişte tutuyor. Manifest İngilizce anlatıyordu ve dil belirtmiyordu; Türkçe açıklama +
`lang`/`dir` aldı.

**Maskable ikon denetlendi, sorun yok.** İçerik yarıçapı ikonun yarı boyutunun 0,64'ü; maskable
güvenli bölge 0,8. Yani `app-icon.png` kırpılmadan geçiyor, manifest'in `purpose: "maskable"`
beyanı doğru — bu kalem açık değildi, kapatacak bir şey çıkmadı.

README bir bütün olarak gerçeğe çekildi: 196 birim / 16 e2e (artık 291 / 37), 174 POI'nin 167'si
kaynaklı (artık 172, hepsi), 9 uyarı (artık 2), ilk boya ve vendor chunk bütçeleri ve "galaksi
görüntüsü hiperuzay ağından önce çekildi" diyen altyazı — hatlar karede duruyor.

Yedinci kalem service worker'ın doku iştahıydı: `public/sw.js` her şeyi tek sınırsız kovaya
yazıyordu, dokular dahil — 90 dünya × 3 mip katmanı, 4K albedo başına ~1,5 MB, diskte 177 MB.
Kaynak kotası dolduğunda tarayıcı cache yazımlarını sessizce reddediyor, yani tekrar ziyareti
ucuzlatması gereken katman hiç haber vermeden çalışmayı bırakıyordu. Dokular artık kendi kovasında
(`ga-v4-textures`) 64 MB bütçeyle duruyor ve en az kullanılan girdi tahliye ediliyor: cache hit
girdiyi yeniden yazıyor (böylece `Cache.keys()` sırası tazelik sırası oluyor), yeni bir yazımdan
sonra en eski uçtan bütçenin altına inene kadar siliniyor. Boyut `content-length`'ten, yoksa
`blob().size`'dan geliyor — tahmin yok. `ok` olmayan yanıt cache'lenmiyor.
`test/unit/service-worker.test.ts` gerçek `public/sw.js` kaynağını sahte worker global'leriyle
koşuyor, yani tahliye yolunun kendisi test altında.

Sekizinci kalem beşinci turun bıraktığı sınırdı: sekme başlığı yalnız sunulan HTML'den geliyordu ve
tek sayfalık uygulama onu oturum boyunca koruyordu — İngilizce'ye geçen okuyucunun sekmesinde
Türkçe başlık kalıyor, Hoth'tan Tatooine'e yürüyende ise Hoth'un adı duruyordu. Bölüm adları
artık tek tabloda (`src/data/sections.json`): hem uygulama (`src/lib/sections.ts`) hem statik meta
üreticisi aynı tabloyu okuyor, üst çubuğun arşiv menüsü de — eskiden aynı dört ad iki yerde
yazılıydı, bir yeniden adlandırma menüye girip başlığa girmeyebilirdi. `useDocumentTitle` rotayı ve
dili izliyor; kayıt sayfaları kendi adını veriyor ve kayıt yüklenene kadar `null` geçiyor, böylece
sunulan başlık boş bir site adıyla değiştirilmiyor. Yedi yeni birim testi tabloyu ve `titleForPath`
kararlarını, altı bileşen testi kancayı, iki uçtan uca test de gerçek tarayıcıda rota ve dil
değişimini koruyor. Test sayısı 296 → 309, uçtan uca 37 → 39.

Hâlâ açık duran Dependabot PR'ları **major** oldukları için karar bekliyor: `typescript` 7.0.2,
`jsdom` 30, `tailwindcss` 4, `react-router` 8, `actions/upload-artifact` 7, `actions/github-script` 9.
`vitest` 4 ve `@vitest/ui` 4 PR'ları artık gereksiz (5.0.0 yüklendi), Dependabot onları kendiliğinden kapatır.

Bilinçli olarak ertelendi, istersen sıraya alırım:

- Sektör **poligon** katmanı — yapılmayacak: kanon sektör sınırı geometrisi yok, çizmek uydurma
  veri üretmek olurdu. Sektör bunun yerine arama/filtre ekseni olarak duruyor.
- Megayapıları tamamlamak. Renderer hazır — `buildStationBody` tek dispatcher, `death-star` ve
  `ringworld` (Glavis) mevcut. Starkiller ayrı bir kayıt değil, `ilum` dosyasının kendisi.
  Yeni bir megayapı **sahibin görsel üretimine bağlı**: bkz. `senden-gerekenler.md` bölüm 3.
- Üçüncü dil gelince `i18next` değerlendirmesi (bugün TR/EN elle sözlükle).

---

## Hızlı komut kartı

```bash
cd app

npm run dev          # geliştirme sunucusu
npm run verify       # tsc + lint + validate + assets + test + build + budget + e2e
npm run textures     # raw/planets/*.png -> public/textures/planets
npm run desktop      # tauri build -> .dmg
```

Dağıtım otomatik: `main`'e push → GitHub Actions `verify` + Vercel üretim derlemesi.
Elle almak gerekirse `vercel redeploy <deployment-url>`.
