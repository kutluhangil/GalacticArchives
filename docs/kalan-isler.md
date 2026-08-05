# Kalan işler — Galactic Archives

**Canlı:** https://galactic-archives.vercel.app · **Branch:** `main` · **Güncelleme:** 2026-08-05

Bu dosya tek kaynak: neyin bittiği, neyin **sende**, neyin **bende** olduğu. Eski
`HANDOFF.md` ve `SENDEN-GEREKENLER.md` bunun yerine geçtiği için silindi.

---

## Biten iş (doğrulanmış)

| Alan | Durum | Kanıt |
|---|---|---|
| Görsel üretimi | **224/224 varlık teslim** | `npm run validate:assets` → `88 albedo, 12 night, 300 texture tiers, 88 cards, 33 portraits, 3 brand · ERRORS: 0` |
| Veri | 81 gezegen + 2 istasyon + 5 detaylı ay, 168 POI, 23 hiperuzay hattı | `npm run validate` → 0 hata |
| Codex | 64 kayıt (10 gemi, 8 savaş, 15 Güç yeteneği, 8 olay, 19 yapım, 4 telsiz), hepsi kaynak makalesini gösteriyor | `npm run validate` → `codex records=64, cited articles=60` |
| Test | 269 birim/bileşen + 30 uçtan uca | `npm run verify` |
| CI | Yeşil | GitHub Actions `CI / verify` |
| Dağıtım | Vercel üretim canlı, Root Directory = `app` | `vercel ls galactic-archives` |

**Lore sayfaları (2026-08-02'de eklendi, 2026-08-05'te kaynaklandı):** `/timeline`,
`/force`, `/watch-guide`, `/hangar` rotaları + üst çubuktaki beş araç paneli
(Hiperuzay, Işın Kılıçları, Telsizler, Aurebesh, Holo-Kimlik) ve Holocron testi.
Dördü de artık statik meta + sitemap üretiyor; araç panelleri tembel yükleniyor.

**Görsel üretimi tarafında açık prompt kalmadı.** `docs/gorsel-uretim-promptlari.md`
içinde dosya yolu verilen 223 varlığın 223'ü diskte; üstüne `docs/brand/readme-banner.png`.

---

## 1. Sende olan işler

### 1.1 `.dmg` imzalama + notarization (Apple Developer)

Tek gerçek blokaj bu. `tauri build` imzasız `.dmg` üretiyor; karşı taraf ilk açılışta
sağ tık → Aç yapmak zorunda kalıyor.

Bana lazım olanlar:

1. **Developer ID Application** sertifikası (Apple Developer hesabında `Certificates` →
   `Developer ID Application`), `.p12` olarak dışa aktarılmış + parolası.
2. **App-specific password** (appleid.apple.com → Oturum Açma ve Güvenlik → Uygulamaya
   Özel Parolalar) — notarization bunu ister.
3. **Team ID** (Apple Developer → Membership).

Bunlar elime geçince imzalama + notarization'ı `src-tauri/tauri.conf.json` ve CI'a ben
kurarım. Sertifikayı **repoya koyma**; ortam değişkeni olarak geçeceğiz
(`APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`, `APPLE_ID`, `APPLE_PASSWORD`,
`APPLE_TEAM_ID`).

### 1.2 Yeni görsel üretimi — yalnız yeni dünya eklersen

Şu an eksik görsel yok. İleride arşive yeni bir gövde eklersen akış şu:

1. Promptu `docs/gorsel-uretim-promptlari.md` içindeki ilgili bölümün kalıbından üret ve
   sonuna **STYLE BIBLE** bloğunu aynen yapıştır (dosyanın başında duruyor).
2. Çıktıları tam olarak şu adlarla bırak:
   ```
   app/raw/planets/<id>-albedo.png     # 4096×2048, 2:1 equirectangular, dikişsiz
   app/raw/planets/<id>-night.png      # yalnız şehir dünyaları
   app/public/cards/<id>.webp          # Holocron kartı
   app/public/portraits/<id>.webp      # karakter holo-büstü
   ```
   `<id>` = `app/src/data/planets/` altındaki dosya adı.

   > **4K master'lar depoda değil.** 1.6 GB tutuyorlardı ve her klonu/derlemeyi
   > yavaşlatıyorlardı; yalnız türetilen KTX2 katmanları yayınlanıyor. Mevcut
   > master'ların yedeği: `/Volumes/ProjectVault/GalacticArchives-raw-masters/planets/`.
   > Doku hattını yeniden çalıştıracaksan önce onları `app/raw/planets/` altına kopyala.
   > `validate:assets` master'lar yokken boyut/dikiş denetimlerini atladığını yazar.
3. Çalıştır:
   ```bash
   cd app
   npm run textures        # dikiş testi + 4K/2K/1K katmanlar + manifest
   npm run validate:assets # boyut/seam/manifest denetimi
   ```

**Bilerek üretilmeyenler** (istek gelmedikçe yapılmayacak): `clouds` haritası (bulut
katmanı shader'dan geliyor), `emissive` haritası (lav parlaması shader'dan), gerçek yüz
portresi (oyuncu benzerliği hem hak hem tutarlılık sorunu — hologram büst kalıyor).

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

Bilinçli olarak ertelendi, istersen sıraya alırım:

- Sektör **poligon** katmanı — yapılmayacak: kanon sektör sınırı geometrisi yok, çizmek uydurma
  veri üretmek olurdu. Sektör bunun yerine arama/filtre ekseni olarak duruyor.
- Karakter ↔ gezegen çapraz-graf navigasyonunu derinleştirmek.
- Megayapıları tamamlamak (şu an yalnız `death-star`, `death-star-2`).
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
