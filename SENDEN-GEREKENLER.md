# SENDEN GEREKENLER — Galactic Archives

**Son güncelleme:** 23 Temmuz 2026
**Canlı:** https://galactic-archives.vercel.app · **Branch:** `main` (push edildi, prod deploy edildi)

Bu dosya iki şey listeler:
**A)** Sensiz ilerleyemeyeceğim işler — dosya, hesap veya karar gerekiyor.
**B)** Sensiz ilerleyebileceğim ama henüz yapılmamış işler — sadece "yap" demen yeterli.

---

## A. SENDEN LAZIM OLANLAR

### A1. Gezegen dokuları (Gemini) — en büyük kalem

Hat tamamen kurulu, tek eksik görsellerin kendisi. Şu an tüm yüzeyler prosedürel shader ile çiziliyor; doku bırakırsan motor `uUseAlbedo` ile karıştırıp devralıyor.

**Ne lazım:** PNG, **2:1 equirectangular**, en az 4096×2048, dikişsiz (sol-sağ kenar birbirine oturmalı).

**Nereye:**
```
app/raw/planets/<gezegen-id>-albedo.png
app/raw/planets/coruscant-night.png        # gece ışıkları olan gezegenler
app/raw/planets/mustafar-emissive.png      # lav parlaması olanlar
```
`<gezegen-id>` = `app/src/data/planets/` altındaki dosya adı (`tatooine`, `coruscant`, `naboo`…).

**Sonra:**
```bash
cd /Volumes/ProjectVault/GalacticArchives/app && npm run textures
```
Script dikiş testi yapar, 4K/2K/1K kalite katmanlarını üretir, manifest yazar. `toktx` kuruluysa KTX2, değilse WebP çıkarır (`brew install ktx` ile kurulur, şart değil).

**Sıralama önerisi (design.md §6):** önce 5 kahraman gezegen — **Tatooine, Coruscant (+night), Mustafar (+emissive), Hoth, Bespin** = 7 harita. Bunları motorda görüp stil kilidini onaylayalım, kalanları ondan sonra seri üret. Toplam plan ~89 varlık:

| Parti | İçerik | Adet |
|-------|--------|------|
| 1 | 5 kahraman gezegen (5 albedo + 1 night + 1 emissive) | 7 |
| 2 | Kalan 29 Tier-S albedo + 4 night/emissive + 2 halka şeridi | ~35 |
| 3 | 3 bulut haritası + 9 FX sprite + greeble + og-card + app-icon | 15 |
| 4 | 32 karakter holo-portresi | 32 |

Her gezegenin birebir prompt'u `design.md` §1'de hazır (§1.1–§1.37). Kopyala-yapıştır Gemini'ye verilebilir.

---

### A2. Aurebesh font dosyası

Aurebesh bileşeni ve `@font-face` tanımı kodda hazır ve çalışıyor — **font dosyası yok**. Repoda dağıtılabilir lisanslı bir Aurebesh bulamadım, o yüzden kendim ekleyemedim.

**Ne lazım:** OFL (veya dağıtıma açık) lisanslı Aurebesh, woff2 formatında.
**Nereye:** `app/public/fonts/aurebesh.woff2`

Dosyayı bırakır bırakmaz dekorasyon katmanı kendiliğinden açılır, kod değişikliği gerekmez.

---

### A3. .dmg imzalama — Apple Developer hesabı

`Galactic Archives_1.1.0_aarch64.dmg` (12 MB) hazır, `app/src-tauri/target/release/bundle/dmg/` altında. Ama **imzasız**: karşı taraf ilk açılışta sağ tık → Aç yapmak zorunda, çift tıklarsa macOS engelliyor.

**Ne lazım:** Apple Developer Program üyeliği (yıllık 99 USD) + Developer ID sertifikası. Hesabı açarsan notarization'ı ben kurarım.
**Alternatif:** dağıtım dar bir çevreyle sınırlıysa imzasız bırak, kullanıcılara sağ tık → Aç talimatı ver — maliyet sıfır.

---

### A4. Özel domain kararı

Şu an Vercel varsayılanındayız: `galactic-archives.vercel.app`. PLAN §13'te bu karar P5'e bırakılmıştı, hâlâ açık.

**Karar ver:** (a) Vercel adresi yeterli, (b) domain al — hangisi? Domain alırsan sitemap, robots ve OG kartlarındaki mutlak URL'leri güncellemem gerekir (tek bir sabitte duruyor, 5 dakikalık iş).

---

### A5. Ses — kalıcı mı?

Senin isteğinle ses sistemi tamamen silindi (SFX, müzik slotları, ambiyans kanalı, ayarlar menüsündeki kontroller, dil anahtarları). Ama `PLAN.md` §9 hâlâ ses sistemini ve §13.2'de ACE-Step ile ambient üretimini "onaylanmış karar" olarak yazıyor.

**Karar ver:** (a) ses kalıcı olarak dışarıda → PLAN.md §9 ve §13.2'yi "iptal edildi" diye işaretleyeyim, (b) ileride geri gelecek → planı olduğu gibi bırakalım.

---

### A6. Kök dizindeki artıklar — silelim mi?

Repo kökünde projeyle ilgisi kalmayan dosyalar duruyor:

| Dosya | Boyut | Ne |
|-------|-------|-----|
| `leo-live.zip` | 1,4 MB | Eski LEO LIVE projesinin arşivi |
| `bIDpBkG.png` | 3,6 MB | Kaynağı belirsiz görsel |

İkisi de git'te takipli. **Onayın olmadan silmedim.** "Sil" dersen kaldırırım.

> Not: Derleme sırasında oluştuğunu söylediğim `/Applications/Galactic Archives.app` kopyası artık orada değil — kontrol ettim, yok. Bir işlem gerekmiyor.

---

## B. YARIM KALANLAR — sadece "yap" demen yeterli

### B1. Era geçişi gerçek crossfade değil
Dönem değiştirince sahne baştan kuruluyor; araya konan 0,16 saniyelik karartma bunu örtüyor ama iki sahne birbirine gerçekten karışmıyor. Düzgün crossfade iki render hedefi ve sahne havuzu ister — orta büyüklükte iş.

### B2. Tier B / Legends katmanı yok
Şu an 74 gök cismi (Tier S + A) var. PLAN §2.3'teki derin kanon kesimi (Devaron, Florrum, Zygerria, Mortis, Jabiim…) ve Legends toggle'ı (Korriban, Dromund Kaas, Taris, Manaan…) yapılmadı. §13.6'da zaten v2'ye ertelenmişti.

### B3. i18next kurulmadı — bilinçli
`lib/ui-strings.ts` TypeScript tip düzeyinde her iki dilin de dolu olmasını zorunlu kılıyor; eksik çeviri derlemeyi kırıyor. Kütüphane eklemek şu an fayda getirmiyor. Üçüncü bir dil gelirse yeniden değerlendirilir.

### B4. Bundle: three.js chunk'ı 622 kB (gzip 159 kB)
Ortak three.js chunk'ı Rollup tarafından `TopBar` adıyla çıkıyor (isim yanıltıcı, içerik three.js). Landing ve Holocron sayfaları bunu yüklemiyor, o yüzden Lighthouse skoru etkilenmiyor (perf 95). İstersen manuel chunk bölmesiyle küçültülebilir — kazanç sınırlı.

### B5. Mobil (P6) kapsam dışı
Dokunmatik jestler, mobil HUD düzeni, düşük güç profili yapılmadı. Site telefonda açılıyor ama masaüstü için tasarlandı.

### B6. `validate-lore` digest'i repoda yok
`node scripts/validate-lore.mjs <digest.json>` bir Wookieepedia digest dosyası ister; o dosya git'te tutulmuyor. Veri değiştirmeden önce `node scripts/fetch-lore.mjs <çıktı.json>` ile yeniden çekilmesi gerekiyor. (Son çalıştırmada 0 hata / 0 uyarıydı.)

---

## Mevcut ölçümler

| Ölçüm | Değer |
|-------|-------|
| Galaksi haritası | 77 fps (74 dünya) |
| Gezegen görünümü | ~115 fps |
| Lighthouse (landing) | perf 95 / erişilebilirlik 100 / best-practices 100 / SEO 100 |
| 50 gezegen geçişinde heap büyümesi | %6,5 (hedef <%10) |
| `npm run lint` | 0 hata |
| `npm run build` | ✓ — 74 dünya, 152 URL |
| Prod yanıt | HTTP 200, 0,51 s |

---

## Hızlı komut kartı

Hepsi `app/` içinden çalışır:

```bash
cd /Volumes/ProjectVault/GalacticArchives/app

npm run dev          # geliştirme sunucusu
npm run build        # üretim derlemesi + statik meta sayfaları
npm run lint         # eslint
npm run textures     # raw/planets/*.png -> public/textures/planets
npm run desktop      # tauri build -> .dmg

vercel deploy --prod --yes
```
