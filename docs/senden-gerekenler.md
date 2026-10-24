# Senden gerekenler — Galactic Archives

**Güncelleme:** 2026-10-24 · **Canlı:** https://galactic-archives.vercel.app

Yalnız **senin** yapacağın ya da karar vereceğin, henüz yapılmamış işler. Biten madde bu
dosyadan silinir. Kod tarafında açık kalanlar `roadmap.md` içinde.

## Sıra

1. Commit kararı (bölüm 1) — **önce bu**; commit'lenmemiş iş harici diskte duruyor.
2. `security.yml` için A / B / C seçimi (bölüm 2).
3. 7 savaş görseli (bölüm 3).
4. Gerçek ekranda gözle kontrol (bölüm 4).
5. `.dmg` imzalama — masaüstü sürümü dağıtacaksan (bölüm 5).
6. Küçük kararlar — acelesi yok (bölüm 6).

---

## 1. Değişiklikleri incele, commit/push kararını ver

2026-10-24 işinin (tarama, grafik, yeni özellikler, veri) hiçbiri commit edilmedi; sen
söylemeden commit atılmıyor.

1. Neyin değiştiğine bak:
   ```bash
   cd /Volumes/ProjectClaude/GalacticArchives
   git status --short        # değişen ve yeni dosyalar
   git diff --stat           # dosya başına satır sayısı
   ```
2. İstersen kendin doğrula: `cd app && npm run verify` (yaklaşık 2 dk; sonunda `41 passed` ve
   `ERRORS: 0`).
3. Bana **"commit at"** de (push da istiyorsan **"commit at ve push et"**).

**Ben ne yapacağım:** konulara bölünmüş commit'ler, yazar sen, AI imzası yok; push öncesi
`git log -1` kontrolü. Push → Vercel otomatik yayınlar.

> `.github/workflows/security.yml` henüz git'e eklenmemiş; commit'e girip girmeyeceği
> bölüm 2'deki karara bağlı.

---

## 2. Güvenlik inceleme workflow'u (`security.yml`) — **karar + secret**

**Neden:** Workflow her pull request'te Claude ile güvenlik incelemesi yapıp PR'a yorum yazıyor.
Ama iki sorun var:

- **Hiç tetiklenmez:** yalnız `pull_request` olayında çalışıyor; sen branch açmadan doğrudan
  `main`'e push ediyorsun. Yani bu haliyle hiçbir zaman koşmaz.
- **Anahtar yok:** `CLAUDE_API_KEY` secret'ı tanımlı değil.

**Karar ver (birini seç, bana söyle):**

- **A) Kaldır:** kullanmayacaksan dosyayı silerim, commit'e girmez. *(En basit.)*
- **B) Push'ta çalışsın:** tetikleyiciyi `push` (main) olarak değiştiririm. Dikkat: bu action
  PR yorumu için tasarlandı; push'ta sonucu yalnız Actions sekmesindeki log'da görürsün.
- **C) PR ile çalışmaya geç:** büyük işlerde branch + PR açarız. Bu, "branch açma" kuralını
  değiştirmek demek; kuralı güncellemem için açıkça söylemen gerekir.

### B veya C seçersen: secret'ı ekle

1. https://console.anthropic.com → **API Keys** → **Create Key**. Adı: `galactic-archives-ci`.
   Anahtar **yalnız bir kez** gösterilir; kopyala.
2. GitHub'da repo → **Settings** → **Secrets and variables** → **Actions** →
   **New repository secret**.
3. **Name:** `CLAUDE_API_KEY` · **Secret:** kopyaladığın anahtar → **Add secret**.
4. Anahtarı başka hiçbir yere (dosya, not, sohbet) yapıştırma.

**Maliyet:** her çalıştırma Anthropic API kullanımı olarak faturalanır. Console'da
**Limits** bölümünden aylık harcama sınırı koymak iyi olur.

**Bana ne göndereceksin:** yalnız seçimin (A / B / C). Anahtarı **gönderme**.

---

## 3. Yedi yeni savaşın görseli

**Neden:** Savaş kayıtları 8 → 15 oldu. Yeni yedisinin Holocron kartında şimdilik ⚔ ve konum
adıyla tema uyumlu bir plaka görünüyor. Görsel diske düştüğü an kendiliğinden kullanılır,
kod değişikliği gerekmez.

**Adımlar:**

1. Promptlar: `docs/gorsel-uretim-promptlari.md` (7 prompt, dosyanın tamamı). Her promptun
   sonundaki `[STYLE BIBLE]` yerine aynı dosyadaki STYLE BIBLE bloğunu yapıştır.
2. 16:9, en az 1600 × 900 üret, PNG indir.
3. 800 × 450 webp'ye çevir ve doğru adla kaydet (örnek Crait için; adlar prompt başlıklarında):
   ```bash
   cd /Volumes/ProjectClaude/GalacticArchives/app
   node -e "require('sharp')('$HOME/Downloads/crait.png').resize(800,450,{fit:'cover'}).webp({quality:82}).toFile('public/battles/battle-of-crait.webp').then(i=>console.log(i))"
   ```
   Dosya adları: `battle-of-christophsis`, `battle-of-utapau`, `battle-of-kashyyyk`,
   `liberation-of-lothal`, `battle-of-starkiller-base`, `battle-of-crait`, `battle-of-exegol`
   (hepsi `.webp`).
4. `npm run dev` → http://localhost:5173/holocron → Savaşlar bölümünde kontrol et.

**Ben ne yapacağım:** istersen çevirme adımını yedisi için tek komutta yaparım: PNG'leri bir
klasöre koy, yolunu söyle.

---

## 4. Gerçek ekranda gözle kontrol (yaklaşık 10 dk)

**Neden:** Grafik değişiklikleri yazılımsal WebGL ile ekran görüntüsü alınarak kontrol edildi;
gerçek GPU'da, Safari'de ve telefonda görülmedi.

**Adımlar:** `cd app && npm run dev`, sonra sırayla:

| Sayfa | Neye bakacaksın |
|---|---|
| `/planet/corellia` | Gece tarafında şehir ışıkları; terminatörde parlayan şerit **olmamalı** |
| `/planet/naboo` | Gece tarafında sıcak tonlu yerleşim ışıkları, okyanuslar karanlık |
| `/planet/geonosis` | Halkanın gezegene, gezegenin halkaya gölgesi |
| `/planet/mustafar` | Atmosferin alttan kızıl parlaması |
| `/planet/tatooine` | Fareyle sürükleyip güneşi kadraja al → lens parlaması; gezegen önüne girince sönmeli |
| `/galaxy` | Altta HoloNet bandı (›, ❚❚ düğmeleri), etiketlerde ⚔ işaretleri, dönem değişince güncelleniyor mu |
| Araçlar → Sabacc / Ödül Panosu | Fareyle tıklanabiliyor mu, "Dünyaya git" doğru gezegene uçuruyor mu |
| Ayarlar → **Ortam sesi** aç → bir gezegene git | Ses rahatsız edici mi, gezegen değişince geçiş yumuşak mı |
| Telefon (veya tarayıcıda mobil görünüm) | HoloNet bandı başka öğelerle çakışıyor mu |

**Bana ne göndereceksin:** tuhaf görünen her şeyin ekran görüntüsü + sayfa adresi.

---

## 5. `.dmg` imzalama + notarization (Apple Developer) — **masaüstü sürümün tek blokajı**

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

#### 5.1 Developer ID Application sertifikasını üret

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

#### 5.2 Sertifikayı `.p12` olarak dışa aktar

CI'ın (GitHub Actions) imzalayabilmesi için sertifika **özel anahtarıyla birlikte** taşınabilir
olmalı; formatı `.p12`.

1. **Anahtar Zinciri Erişimi** → sol üstte **oturum açma** (login) anahtar zinciri → **Sertifikalarım** (My Certificates).
2. `Developer ID Application: <Adın> (<TEAM_ID>)` satırını bul. Yanındaki oku aç —
   **altında bir özel anahtar görünmeli.** Görünmüyorsa CSR'ı farklı bir Mac'te ürettin
   demektir; o makinede dışa aktarman gerekir.
3. Satıra sağ tık → **"…" Dışa Aktar** (Export) → format **Personal Information Exchange (.p12)**.
4. Sana bir parola sorulacak. **Güçlü bir parola gir ve bir yere not et** — bu, aşağıda
   `APPLE_CERTIFICATE_PASSWORD` olarak lazım olacak.

#### 5.3 App-specific password üret

Notarization, Apple Kimliğinin normal parolasını değil, uygulamaya özel parolayı ister.

1. https://appleid.apple.com → giriş yap.
2. **Oturum Açma ve Güvenlik** → **Uygulamaya Özel Parolalar** → **+**.
3. Adına örneğin `galactic-archives-notarize` yaz → üretilen `xxxx-xxxx-xxxx-xxxx`
   parolasını **kopyala** (bir daha gösterilmez).

#### 5.4 Team ID'yi bul

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
| `APPLE_CERTIFICATE_PASSWORD` | 5.2'de belirlediğin `.p12` parolası |
| `APPLE_ID` | Apple Kimliği e-postan |
| `APPLE_PASSWORD` | 5.3'teki uygulamaya özel parola (`xxxx-xxxx-xxxx-xxxx`) |
| `APPLE_TEAM_ID` | 5.4'teki 10 karakterlik Team ID |

Yerelde de `.dmg` almak istersen aynı beş değeri `.env` yerine kabuk ortam değişkeni olarak
ver (`.env` depoya girmez, ama sertifika parolası `.env`'e de yazılmamalı — kabukta ver).

### Ben ne yapacağım

Secret'lar girildikten sonra:

- `src-tauri/tauri.conf.json` içine `bundle.macOS.signingIdentity` + `hardenedRuntime` +
  `entitlements` ayarlarını kurarım,
- `.github/workflows` içine imzalama + `notarytool` ile notarization + `stapler` adımını eklerim,
- CSP'yi imzalı masaüstü derlemesinde doğrularım (bugüne dek yalnız web tarafında doğrulandı),
- bu bölümü bu dosyadan silerim.

### Doğrulama (imza sonrası, senin yapabileceğin)

```bash
# imza var mı
codesign -dv --verbose=4 /Applications/Galactic\ Archives.app

# Gatekeeper kabul ediyor mu — "accepted / source=Notarized Developer ID" görmelisin
spctl -a -vvv -t install /Applications/Galactic\ Archives.app
```

---

## 6. Küçük kararlar (acelesi yok)

- **Jedha olayı:** zaman çizelgesine "Jedha Şehri'nin yok edilişi" (0 BBY) eklenmedi; kaynak
  makalenin adı netleşmedi. İstersen söyle, doğrulayıp eklerim.
- **Film adı çevirisi:** `app/src/data/meta/media.json` içinde *The Empire Strikes Back*'in
  Türkçesi "İmparator'un Dönüşü" olarak geçiyor (Hoth sayfası, ödül panosu). Yanlışsa doğrusunu
  söyle.
- **Sabacc'a bahis:** şu an yalnız kazanma/kaybetme sayısı tutuluyor. Kredi + bahis istersen söyle.
- **Yeni megayapı:** arşive yeni bir istasyon/megayapı istiyorsan hangisi olduğunu söyle. Kodu
  ben yazarım; albedo master'ı ve Holocron kartı görseli sende (`validate:assets` ikisini de zorunlu
  tutuyor).
- **Üçüncü dil:** istersen hangi dil olduğunu söyle; o zaman `i18next`'e geçişi değerlendiririm.
- **Kanon nöbeti:** GitHub Actions haftalık kanon nöbeti bir issue açarsa çözüm yönünü sen
  belirlersin (şu an açık issue yok).
