# Galactic Archives — proje denetim raporu

Tarih: 1 Ağustos 2026

## Kapsam

Bu denetim; üretilmiş bağımlılık ve derleme klasörlerini (`node_modules`, `dist`,
`src-tauri/target`, Tauri şema çıktıları) kaynak kod kabul etmeden uygulamanın takip edilen
TypeScript/TSX, JavaScript/MJS, Rust, yapılandırma, test, veri ve proje belgelerini kapsar.

- Depoda `.m` veya `.mm` dosyası yoktur. Objective-C kaynağı bulunmuyor.
- Kullanıcının `.m` ile kastetmiş olabileceği 11 adet `.mjs` scriptin tamamı incelendi.
- 81 üst seviye dünya JSON'u ile içlerindeki 5 ayrıntılı ay, 2 istasyon, 33 karakter,
  23 hiperuzay hattı ve kaynak/provenance dosyaları doğrulayıcı üzerinden tarandı.
- `docs/gemini-image-prompts.md` ve `docs/gorsel-uretim-promptlari.md` tamamen karşılaştırıldı.

## Proje ne yapıyor?

Galactic Archives; kaynak izli Star Wars verisini iki dilde sunan, galaksi haritasından
sistem ve gezegen yüzeyine kesintisiz kamera uçuşlarıyla inen bir WebGL atlasıdır. Aynı
kod tabanı Vite web uygulaması, PWA ve Tauri masaüstü kabuğu olarak paketleniyor.

Ana veri ve çalışma akışı:

```text
Yerel lore JSON + kaynak kayıtları + hiperuzay grafı
                ↓
lib/lore.ts lazy import ve gövde önbelleği
                ↓
React Router ekranı + Zustand/localStorage durumu
                ↓
GalaxyEngine / SystemEngine / PlanetEngine
                ↓
Three.js shader'ları + React HUD + rota geçişi
```

Önemli yüzeyler: landing, galaksi haritası, sistem görünümü, gezegen görünümü, iki dünya
karşılaştırması ve gövde/karakter kayıtlarını birleştiren Holocron'dur. Araştırma scriptleri
Wookieepedia çıktısını indirir; slim/sync scriptleri takip edilen snapshot ve kaynak dosyalarını
üretir; `validate-lore.mjs` depo içi veriyi bu kanıtlarla karşılaştırır.

## Çalıştırma ve kalite sonucu

Denetimin başlangıç durumunda:

- TypeScript build: başarılı.
- ESLint: başarılı.
- Lore doğrulama: 0 hata, 9 uyarı.
- Vitest: 17 dosyada 196/196 test başarılı.
- Production build ve static metadata: başarılı; 81 dünya, 166 URL.
- Bundle budget: 0 hata. İlk boya yükü 381.219 / 400.000 bayt.
- Playwright E2E: uygulama başlamadan sandbox `::1:4173` portuna `EPERM` verdi. İzinli
  tekrar çalıştırma iki kez onay zaman aşımına uğradığı için tarayıcı sonucu doğrulanamadı.
- Güncel `npm audit`: registry erişimi sandbox'ta DNS ile engellendi; dış registry'ye paket
  metadata'sı gönderme izni de güvenlik incelemesinde reddedildi. Güncel CVE sonucu alınamadı.

Lore uyarıları; 7 kaynaksız POI ile koordinatı kanonda belirtilmeyen Salin ve Wretch of
Tayron duraklarıdır. Bunlar veri uydurulmadan açık bırakılmıştır.

Görsel üretim ve entegrasyonundan sonraki son kontrolde 224/224 hedef ile bunlardan üretilen
300 WebP texture seviyesi doğrulandı; eksik/fazla ID, boyut, format, dikiş veya manifest hatası
yoktur. TypeScript, ESLint, 196 test, production build, bundle budget ve Rust `cargo check`
yeniden başarılı oldu. Güncel ilk boya toplamı 380.730 / 400.000 bayttır. Playwright sonucu,
yukarıdaki sandbox port engeli nedeniyle hâlâ alınamamıştır.

## Bulgular

### P0 — ürünün belirli yollarını bozanlar

1. **Tauri geliştirme URL'si yanlış porta bakıyor.** Vite `3000`, Tauri `5173` bekliyor.
   `npm run tauri dev` uygulama sunucusuna bağlanamaz. Kanıt: `app/vite.config.ts:15-17`,
   `app/src-tauri/tauri.conf.json:6-10`.

2. **Geçersiz dinamik rota kimlikleri hata ekranına ulaşmıyor.** `loadBody` bilinmeyen ID'de
   hata fırlatıyor; `PlanetView`, `SystemView` ve `Compare` effect zincirlerinde `catch` yok.
   React ErrorBoundary asenkron promise reddini yakalamaz; ekran yükleniyor durumunda kalabilir.
   Kanıt: `app/src/lib/lore.ts:68-88`, `app/src/pages/PlanetView.tsx:34-55`,
   `app/src/pages/SystemView.tsx:42-50`, `app/src/pages/Compare.tsx:103-113`.

3. **Glavis Ringworld yanlış gövde olarak çiziliyor.** `kind === 'station'` olan her kayıt
   Death Star üreticisine gidiyor. Glavis bu yüzden halka habitat yerine Ölüm Yıldızı olur;
   C03 için üretilecek doku da tüketilmez. Kanıt: `app/src/lib/engine/planet-engine.ts:104-109`
   ve `:252-265`, `app/src/data/planets/glavis-ringworld.json`.

### P1 — görsel üretim ve dağıtımı etkileyenler

1. **Doku manifest hataları sessizce gizleniyor.** Manifest 404 veya parse/network hatası
   `{}` kabul ediliyor. Üretilmiş bir asset bozuk dağıtıldığında kullanıcı prosedürel yüzeyi
   görür ve hata görünmez. Kanıt: `app/src/lib/engine/planet-textures.ts:23-30`.

2. **Doku yüklemesinin yaşam döngüsü yok.** `PlanetEngine`, `applySurfaceTextures` promise'ini
   beklemeden bırakıyor. Rota değişiminden sonra dispose edilmiş materyale yazma ve yükleme
   hatasında unhandled rejection riski var. Kanıt: `app/src/lib/engine/planet-engine.ts:145-150`.

3. **KTX2 manifesti var olmayan dosyayı işaretleyebilir.** Güncellik kontrolü yalnız WebP
   hedefini sınar. Sonradan `toktx` kurulursa WebP güncel olduğu için KTX2 üretilmeden manifest
   uzantısı `.ktx2` yazılabilir. Kanıt: `app/scripts/process-textures.mjs:57-74`, `:114-123`.

4. **KTX2 decoder dağıtımı tamamlanmamış.** Loader `/basis/` yolunu bekliyor; takip edilen
   `public` içeriğinde transcoder dosyaları yok. KTX2 üretimine geçmeden önce decoder dosyaları
   build/deploy çıktısına eklenmeli. Kanıt: `app/src/lib/engine/planet-textures.ts:39-45`.

5. **Dikiş şartı uygulamada zorunlu değil.** Belge sol/sağ kenarın kusursuz olmasını isterken
   script tolerans üstünde yalnız uyarı verip çıktıyı ve manifesti üretmeye devam ediyor.
   Kanıt: `app/scripts/process-textures.mjs:103-123`.

6. **SystemEngine üretilmiş yüzeyleri kullanmıyor.** Gerçek doku PlanetEngine'de görünür,
   sistem görünümündeki aynı dünya prosedürel kalır. Ölüm Yıldızı C01/C02 dokuları da özel
   shader yolu nedeniyle tüketilmez.

7. **Texture LRU etkin kullanımı bilmiyor.** Altı kayıt üzerindeki en eski texture referans
   sayılmadan dispose ediliyor. Compare ekranındaki ikinci canlı motorun kullandığı texture
   teorik olarak tahliye edilebilir. Kanıt: `app/src/lib/engine/planet-textures.ts:16-20`,
   `:48-55`, `:68-85`.

### P2 — veri, erişilebilirlik ve ürün bütünlüğü

1. **Araştırma scriptleri kısmi hatada başarılı exit code verebilir.** Entity hataları digest'e
   yazılıyor fakat süreç başarısız sayılmıyor; otomasyon eksik araştırmayı başarılı kabul edebilir.
   Etkilenenler: `fetch-lore.mjs`, `fetch-routes.mjs`, `fetch-poi.mjs`.

2. **9 doğrulama uyarısı açık.** Kaynaksız POI'ler: Alderaan `castle-lands`, Felucia
   `fungal-plains`, Peridea `noti-caravan`/`bone-ring`, Ryloth `gutkurr-caves`, Scarif
   `beach-landing`, Shakari `underworld-streets`. İki rota durağının grid koordinatı yok.

3. **Astronomik hareketlerin bir kısmı temsili.** Dönüş saatleri, ay yörünge yarıçapları ve
   periyotları kaynak veriden değil sabit/ID-türetilmiş değerlerden geliyor. Görsel model olarak
   makul, fakat ürün bunu kanon ölçümü gibi göstermemeli. Kanıt:
   `app/src/lib/engine/planet-engine.ts:153-156`, `:295-302` ve SystemEngine yörünge kurulumu.

4. **Static SEO kapsamı ürün kapsamından dar.** Sitemap/meta üretimi 81 üst seviye gezegenle
   sınırlı; 5 ayrıntılı ay, 2 istasyon ve 33 karakter detay rotası statik meta almıyor. Kanıt:
   `app/scripts/build-static-meta.mjs:27-30`, `:119-141`.

5. **Legends filtresi menüler arasında tutarsız.** Galaxy, Compare ve komut paleti katmanı
   dikkate alırken TopBar dünya menüsü aynı filtreyi uygulamıyor.

6. **Paket metadata'sı bitmemiş.** `package.json` sürümü `0.0.0`, Cargo sürümü `0.1.0`,
   Tauri sürümü `1.1.0`; Cargo açıklaması `A Tauri App`, yazarı `you`, license/repository boş.
   Kanıt: `app/package.json:2-5`, `app/src-tauri/Cargo.toml:1-9`,
   `app/src-tauri/tauri.conf.json:2-5`.

7. **Shadcn config yolu yanlış.** `components.json`, Tailwind config olarak
   `postcss.config.js` gösteriyor. Yeni shadcn bileşeni ekleme akışını bozabilir.

8. **Ölü paralel saat hook'u var.** `src/hooks/useSimClock.ts`, aktif `lib/sim-clock.ts`
   uygulamasına paralel ve başka modülden import edilmiyor.

### P3 — ürünün sonraki mantıklı adımları

- 17 uçamayan hiperuzay hattı için en fazla hattın kesiştiği kaynaklı kavşak dünyaları eklenmeli.
- Haritanın renk, yok edilmiş dünya, Legends ve hiperuzay çizgilerini açıklayan legend'i olmalı.
- Rota planlayıcı; hat paneline, POI deep-link'lerine ve komut paleti POI/hat aramasına bağlanmalı.
- Compare ikiden fazla gövdeyi veya sistem düzeyini destekleyebilir.
- Karakter–gezegen çapraz grafı ve ay/istasyon SEO kapsamı derinleştirilebilir.
- Sayısal veriler için tabular rakamlı ayrı bir `data` font rolü okunabilirliği artırır.
- Eski ekran görüntüleri hiperuzay hatları ve gerçek kart/dokular geldikten sonra yenilenmeli.

## Görsel envanteri

Kanonik kaynak `docs/gorsel-uretim-promptlari.md` dosyasıdır. Önceki
`docs/gemini-image-prompts.md` içindeki 17 hedef yeni listenin alt kümesidir ve ikinci kez
üretilmemelidir.

| Grup | Adet | Nihai kaynak |
|---|---:|---|
| A — albedo | 84 | `app/raw/planets/<id>-albedo.png` |
| B — gece ışığı | 12 | `app/raw/planets/<id>-night.png` |
| C — megayapı yüzeyi | 4 | `app/raw/planets/<id>-albedo.png` |
| D — Holocron kartı | 88 | `app/public/cards/<id>.webp` |
| E — yüzsüz holo-büst | 33 | `app/public/portraits/<id>.webp` |
| F — marka | 3 | `app/raw/brand/*`, `docs/brand/readme-banner.png` |

Toplam 224 benzersiz hedef vardır; yol tekrarı, eksik prompt veya veri ID uyuşmazlığı yoktur.
Belgenin öncelik paragrafındaki Tatooine/Mustafar/Hoth numaraları yanlıştır: doğru değerler
`A72`, `A50`, `A31`'dir. Dosyanın sonundaki parti listesi doğru numaraları kullanır.

Üretim sonrasında 100 adet 4096×2048 kaynak PNG `1,6 GB`, bunlardan türetilen 300 WebP
seviye dosyası `180 MB`, 88 kart `5,7 MB`, 33 portre `1,3 MB` yer kaplıyor. Kaynak ve
dağıtım kopyalarını birlikte normal Git geçmişine almak depo boyutunu yaklaşık `1,8 GB`
büyütür. Commit öncesinde kaynak PNG'ler için Git LFS/harici arşiv kararı verilmeli veya
yalnız dağıtım WebP'leri takip edilmelidir; aksi durumda clone ve CI maliyeti ciddi artar.

Kart, portre ve marka dosyaları yalnız kopyalanınca görünmüyordu. Üretim çalışması kapsamında
Holocron/Landing görselleri ilgili `/cards/` ve `/portraits/` yollarına bağlanacak; PWA cache
stratejisi bu yolları kapsayacak; marka kaynakları favicon/PWA/OG/README akışına bağlanacaktır.

## Öncelik önerisi

1. Geçersiz rota hata durumları, Tauri portu ve Glavis gövde ayrımı düzeltilmeli.
2. Asset doğrulayıcı eklenmeli; 224 dosyada boyut, format, ID, dikiş ve manifest bütünlüğü CI'da
   hard-fail olmalı.
3. KTX2 decoder dağıtımı ve manifest üretimi düzeltilmeden KTX2'ye geçilmemeli.
4. Hero dünya partisiyle repo/deploy boyutu ve WebGL VRAM ölçülmeli; sonra kalan üretim açılmalı.
5. Static meta, ekran görüntüleri ve eski roadmap/handoff sayıları gerçek runtime ile eşitlenmeli.
