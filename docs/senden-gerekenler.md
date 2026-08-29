# Senden gerekenler — Galactic Archives

**Güncelleme:** 2026-08-29 · **Canlı:** https://galactic-archives.vercel.app · **Branch:** `main`

Bu dosya yalnız **senin** yapabileceğin işleri anlatır: hesap, sertifika, ödeme veya
karar gerektiren, bende olmayan yetkiler. Kodla ilgili kalan işler `docs/kalan-isler.md`
ve `docs/roadmap.md` içinde.

Her bölüm şu düzende: **neden gerekiyor · tam adımlar · bana ne göndereceksin · ben ne yapacağım.**

---

## 1. `.dmg` imzalama + notarization (Apple Developer) — **tek gerçek blokaj**

### Neden gerekiyor

`npm run desktop` (yani `tauri build`) şu an **imzasız** bir `.dmg` üretiyor. macOS Gatekeeper
imzasız uygulamayı ilk açılışta bloklar: karşı taraf uygulamaya çift tıklayınca
"zarar verebilir / geliştirici doğrulanamıyor" uyarısı alır ve **sağ tık → Aç** yapmak,
sonra da onay vermek zorunda kalır. Dağıttığın herkese bunu tarif etmen gerekir.

İmzalama + notarization bunu tamamen kaldırır: uygulama normal çift tıkla açılır.
Bunun için Apple'ın senin adına verdiği kimlik bilgileri gerekiyor; bende yok ve
benim üretmem mümkün değil.

**Ön koşul:** ücretli **Apple Developer Program** üyeliği (yılda 99 USD). Ücretsiz Apple
Kimliği "Developer ID Application" sertifikası veremez.

### Adım adım

#### 1.1 Developer ID Application sertifikasını üret

1. https://developer.apple.com/account adresine gir.
2. Sol menüden **Certificates, Identifiers & Profiles** → **Certificates** → sağ üstteki **+**.
3. Listeden **Developer ID Application** seç (dikkat: "Developer ID Installer" veya
   "Apple Development" değil — dağıtılacak `.app`/`.dmg` için doğru tip budur), **Continue**.
4. Apple senden bir **CSR** (Certificate Signing Request) isteyecek. Mac'te üret:
   - **Anahtar Zinciri Erişimi** (Keychain Access) uygulamasını aç.
   - Menü: **Anahtar Zinciri Erişimi → Sertifika Yardımcısı → Sertifika Yetkilisinden Sertifika İste…**
   - E-posta: Apple Kimliğin. Ortak Ad: adın. CA E-postası: boş bırak.
   - **Diske kaydedildi** (Saved to disk) seçeneğini işaretle, **Devam** → dosyayı kaydet
     (`CertificateSigningRequest.certSigningRequest`).
5. Bu dosyayı Apple'ın sayfasına yükle → **Continue** → sertifikayı **Download** et
   (`developerID_application.cer`).
6. İnen `.cer` dosyasına **çift tıkla** — Anahtar Zinciri'ne kurulur.

#### 1.2 Sertifikayı `.p12` olarak dışa aktar

CI'ın (GitHub Actions) imzalayabilmesi için sertifika **özel anahtarıyla birlikte** taşınabilir
olmalı; formatı `.p12`.

1. **Anahtar Zinciri Erişimi** → sol üstte **oturum açma** (login) anahtar zinciri → **Sertifikalarım** (My Certificates).
2. `Developer ID Application: <Adın> (<TEAM_ID>)` satırını bul. Yanındaki oku aç —
   **altında bir özel anahtar görünmeli.** Görünmüyorsa CSR'ı farklı bir Mac'te ürettin
   demektir; o makinede dışa aktarman gerekir.
3. Satıra sağ tık → **"…" Dışa Aktar** (Export) → format **Personal Information Exchange (.p12)**.
4. Sana bir parola sorulacak. **Güçlü bir parola gir ve bir yere not et** — bu, aşağıda
   `APPLE_CERTIFICATE_PASSWORD` olarak lazım olacak.

#### 1.3 App-specific password üret

Notarization, Apple Kimliğinin normal parolasını değil, uygulamaya özel parolayı ister.

1. https://appleid.apple.com → giriş yap.
2. **Oturum Açma ve Güvenlik** → **Uygulamaya Özel Parolalar** → **+**.
3. Adına örneğin `galactic-archives-notarize` yaz → üretilen `xxxx-xxxx-xxxx-xxxx`
   parolasını **kopyala** (bir daha gösterilmez).

#### 1.4 Team ID'yi bul

https://developer.apple.com/account → **Membership** (Üyelik) sayfası → **Team ID**
(10 karakterlik, `A1B2C3D4E5` gibi).

### Bana ne göndereceksin

Beş değer. **Sertifikayı depoya koyma, bana sohbet içinde düz metin yapıştırma.**
Doğru yol: bunları GitHub'da **repository secret** olarak sen gir; ben yalnız
"girildi" bilgisini bileyim, değerleri görmeme gerek yok.

GitHub → repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:

| Secret adı | Değeri |
|---|---|
| `APPLE_CERTIFICATE` | `.p12` dosyasının **base64**'ü. Terminalde: `base64 -i sertifika.p12 \| pbcopy` (panoya kopyalar) |
| `APPLE_CERTIFICATE_PASSWORD` | 1.2'de belirlediğin `.p12` parolası |
| `APPLE_ID` | Apple Kimliği e-postan |
| `APPLE_PASSWORD` | 1.3'teki uygulamaya özel parola (`xxxx-xxxx-xxxx-xxxx`) |
| `APPLE_TEAM_ID` | 1.4'teki 10 karakterlik Team ID |

Yerelde de `.dmg` almak istersen aynı beş değeri `.env` yerine kabuk ortam değişkeni olarak
ver (`.env` depoya girmez, ama sertifika parolası `.env`'e de yazılmamalı — kabukta ver).

### Ben ne yapacağım

Secret'lar girildikten sonra:

- `src-tauri/tauri.conf.json` içine `bundle.macOS.signingIdentity` + `hardenedRuntime` +
  `entitlements` ayarlarını kurarım,
- `.github/workflows` içine imzalama + `notarytool` ile notarization + `stapler` adımını eklerim,
- CSP'yi imzalı masaüstü derlemesinde doğrularım (bugüne dek yalnız web tarafında doğrulandı),
- `docs/kalan-isler.md`'deki "Sende olan işler" bölümünü kapatırım.

### Doğrulama (imza sonrası, senin yapabileceğin)

```bash
# imza var mı
codesign -dv --verbose=4 /Applications/Galactic\ Archives.app

# Gatekeeper kabul ediyor mu — "accepted / source=Notarized Developer ID" görmelisin
spctl -a -vvv -t install /Applications/Galactic\ Archives.app
```

---

## 2. Yeni görsel üretimi — **yalnız arşive yeni bir dünya eklersen**

Şu an eksik görsel **yok**: 224/224 varlık teslim (`npm run validate:assets` → `ERRORS: 0`).
Bu bölüm ileride yeni gövde eklenirse diye duruyor.

### Adımlar

1. Promptu `docs/gorsel-uretim-promptlari.md` içindeki ilgili bölümün kalıbından üret ve
   **sonuna dosyanın başındaki STYLE BIBLE bloğunu aynen yapıştır.** Stil tutarlılığı buna bağlı.
2. Çıktıları tam olarak şu adlarla bırak (`<id>` = `app/src/data/planets/` altındaki dosya adı):

   ```
   app/raw/planets/<id>-albedo.png     # 4096×2048, 2:1 equirectangular, dikişsiz
   app/raw/planets/<id>-night.png      # yalnız şehir dünyaları
   app/public/cards/<id>.webp          # Holocron kartı
   app/public/portraits/<id>.webp      # karakter holo-büstü
   ```

3. **4K master'lar depoda değil** (1,6 GB tutuyordu, her klonu yavaşlatıyordu). Yedek:
   `/Volumes/ProjectVault/GalacticArchives-raw-masters/planets/`. Doku hattını yeniden
   koşturacaksan **önce onları `app/raw/planets/` altına kopyala.**
4. Çalıştır:

   ```bash
   cd app
   npm run textures        # dikiş testi + 4K/2K/1K KTX2 katmanlar + manifest
   npm run validate:assets # boyut/seam/manifest denetimi
   ```

### Bilerek üretilmeyenler (istemedikçe yapılmayacak)

- `clouds` haritası — bulut katmanı shader'dan geliyor.
- `emissive` haritası — lav parlaması shader'dan geliyor.
- Gerçek yüz portresi — oyuncu benzerliği hem hak hem tutarlılık sorunu; hologram büst kalıyor.

---

## 3. Haftalık kanon nöbetinden gelen issue'lar — **karar senin**

`.github/workflows/canon-watch.yml` her Pazartesi 60 atıf makalesini canlı Wookieepedia
API'sine karşı yeniden çekiyor. Bir makale yeniden adlandırıldıysa ya da yönlendirmeye
dönüştüyse **diff'li bir issue açıyor** ve orada duruyor — veriyi kendiliğinden değiştirmiyor.

Bu bilinçli: bir makale adı değiştiğinde "yeni ada geç" mi yoksa "kayıt aslında başka bir
maddeyi mi göstermeli" kararı yazarlık kararıdır, otomatik verilemez.

**Senden istenen:** issue açıldığında bana "şu issue'yu çöz, yeni adı kullan" gibi bir yön ver.
Uygulamayı ben yaparım.

---

## 4. Üçüncü dil kararı

Bugün TR/EN elle yazılmış bir sözlükle yürüyor (`src/lib/ui-strings.ts`, `L()` yardımcıları).
İki dil için bu en ucuz ve en okunur çözüm. **Üçüncü bir dil eklemeye karar verirsen**
`i18next`'e geçmek mantıklı olur — o zaman söyle, geçişi ben yaparım. Karar gelmeden
kütüphane eklemek fazladan bağımlılık ve fazladan ilk-boya yükü demek.

---

## 5. Vercel — bir kez ayarlandı, dokunma gerektirmiyor

Sadece bilgi olsun: projede **Root Directory = `app`** ayarı zorunlu. Bu ayar bir kez
2026-08-02'de yapıldı; kaldırılırsa `npm run build` repo kökünden koşar ve
`ENOENT /vercel/path0/package.json` ile her deploy patlar. Vercel projesini silip yeniden
kurarsan bu ayarı tekrar yapman gerekir.

Dağıtım otomatik: `main`'e push → GitHub Actions `verify` + Vercel üretim derlemesi.
Elle almak gerekirse: `vercel redeploy <deployment-url>`.

---

## 6. Disk: ham master'lar ve harici birim

Proje `/Volumes/ProjectClaude/GalacticArchives` altında, **harici bir birimde** duruyor.
2026-08-29'da bu birim çalışma sırasında bağlantısını kaybetti; commit'lenmiş iş GitHub'da
güvende olduğu için kayıp olmadı, ama commit'lenmemiş değişiklik o an erişilemez hale geldi.

**Öneri:** uzun süren bir iş başlamadan önce birimin bağlı olduğundan emin ol; ya da işi
Macintosh HD üzerindeki bir klasöre taşı. Ham 4K master'ların yedeği ayrı bir birimde
(`/Volumes/ProjectVault/...`) — o birimin de yedeğinin olması iyi olur, çünkü master'lar
depoda tutulmuyor ve kaybolursa doku hattı bir daha koşturulamaz.

---

## Hızlı komut kartı

```bash
cd app

npm run dev          # geliştirme sunucusu
npm run verify       # tsc + lint + validate + assets + test + build + budget + e2e
npm run textures     # raw/planets/*.png -> public/textures/planets
npm run desktop      # tauri build -> .dmg  (imzasız — bölüm 1)
npm audit            # bağımlılık açıkları
```

## Özet — sırayla senden bekleyenler

1. **Apple Developer sertifikası + app-specific password + Team ID** → GitHub secret olarak gir. *(Blokaj)*
2. Kanon nöbeti issue açtığında **çözüm yönü ver.** *(Tetiklenince)*
3. Üçüncü dil isteyip istemediğine **karar ver.** *(İstediğin zaman)*
4. Yeni dünya eklersen **görselleri üret** (bölüm 2 akışı). *(Yalnız gerekirse)*
