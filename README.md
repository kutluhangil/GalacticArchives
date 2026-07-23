<div align="center">

<br />

<img src="https://img.shields.io/badge/Status-Live-facc15?style=for-the-badge&logoColor=black" alt="status" />
<img src="https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react&logoColor=black" alt="react" />
<img src="https://img.shields.io/badge/TypeScript-3178c6?style=for-the-badge&logo=typescript&logoColor=white" alt="typescript" />
<img src="https://img.shields.io/badge/three.js-r185-000000?style=for-the-badge&logo=threedotjs&logoColor=white" alt="threejs" />
<img src="https://img.shields.io/badge/Vite-7-646cff?style=for-the-badge&logo=vite&logoColor=white" alt="vite" />
<img src="https://img.shields.io/badge/Tauri-2-24c8db?style=for-the-badge&logo=tauri&logoColor=black" alt="tauri" />
<img src="https://img.shields.io/badge/Vercel-Deployed-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="vercel" />

<br /><br />

```
 ██████╗  █████╗ ██╗      █████╗  ██████╗████████╗██╗ ██████╗
██╔════╝ ██╔══██╗██║     ██╔══██╗██╔════╝╚══██╔══╝██║██╔════╝
██║  ███╗███████║██║     ███████║██║        ██║   ██║██║     
██║   ██║██╔══██║██║     ██╔══██║██║        ██║   ██║██║     
╚██████╔╝██║  ██║███████╗██║  ██║╚██████╗   ██║   ██║╚██████╗
 ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝ ╚═════╝   ╚═╝   ╚═╝ ╚═════╝
 █████╗ ██████╗  ██████╗██╗  ██╗██╗██╗   ██╗███████╗███████╗
██╔══██╗██╔══██╗██╔════╝██║  ██║██║██║   ██║██╔════╝██╔════╝
███████║██████╔╝██║     ███████║██║██║   ██║█████╗  ███████╗
██╔══██║██╔══██╗██║     ██╔══██║██║╚██╗ ██╔╝██╔══╝  ╚════██║
██║  ██║██║  ██║╚██████╗██║  ██║██║ ╚████╔╝ ███████╗███████║
╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚═╝  ╚═══╝  ╚══════╝╚══════╝
```

### **GALACTIC ARCHIVES** — çok uzak bir galaksinin atlası.

**Gerçek zamanlı 3D** · 74 gök cismi · 3 dönem · sıfır backend · tarayıcıda 77 fps.

[🌌 Canlı](https://galactic-archives.vercel.app) · [🛰️ Galaksi Haritası](https://galactic-archives.vercel.app/galaxy) · [📜 Holocron](https://galactic-archives.vercel.app/holocron) · [⚖️ Kıyasla](https://galactic-archives.vercel.app/compare)

</div>

---

## ✦ Genel Bakış

**Galactic Archives**, Star Wars galaksisini **gezilebilir bir 3D atlasa** çeviren bir fan
projesidir. Galaksi diskinden bir yıldız sistemine, oradan gezegenin yüzeyine kesintisiz
kamera uçuşuyla inersin. Her dünya **prosedürel GLSL shader'larla** gerçek zamanlı üretilir —
hazır doku dosyası yok, gündüz/gece terminatörü gerçek saatle ilerler.

Üstünde ikinci bir katman var: **Holocron** — 74 dünya ve 33 figürün birbirine bağlı,
iki dilli wiki'si. Ve **dönem çubuğu**: Klon Savaşları / İmparatorluk / Yeni Cumhuriyet
arasında geçiş yaptığında galaksi değişir — Alderaan kırılır, Ölüm Yıldızı belirir,
Starkiller ateşlenir.

> **Backend yok, hesap yok, API çağrısı yok.** Tüm veri statik JSON, tüm görsel ham three.js
> ile çizilir. Aynı kod tabanı hem Vercel'de web olarak hem de Tauri v2 ile 12 MB'lık
> macOS `.dmg` olarak paketlenir.

<div align="center">
<img src="docs/screenshots/galaxy-map.jpg" alt="Galaksi haritası — log-sarmal disk" width="100%" />
<sub><i>Galaksi haritası — logaritmik sarmal kollar, nebula pusu, toz şeritleri, çubuklu çekirdek. 74 dünya, 77 fps.</i></sub>
</div>

---

## ⚡ Öne Çıkan Özellikler

| Özellik | Açıklama |
|--------|----------|
| 🌌 **Üç Kademeli Hiyerarşi** | Galaksi diski → yıldız sistemi → gezegen yüzeyi. Aralarda kesme yok, kamera uçuşu var. |
| 🎨 **Prosedürel Gezegenler** | 12 arketip (çöl, buz, lav, ekumenopolis, gaz devi, bataklık…), tamamı GLSL. Doku dosyası sıfır. |
| 🏔️ **Kabartma Gölgeleme** | Arketip başına yükseklik alanı normali bozar — kumullar, buz sırtları ve krater kenarları terminatörde ışık yakalar. |
| 🕰️ **Dönem Sistemi** | Klon Savaşları · İmparatorluk · Yeni Cumhuriyet. Bağlılıklar, mevcudiyet ve gök cisminin durumu döneme göre değişir. |
| 📜 **Holocron Wiki** | 114 kayıt — dünyalar ve figürler çapraz bağlı, bölge/yapım filtreli. |
| ⚖️ **Kıyaslama** | İki canlı küre yan yana + gerçek çap oranı şeridi + istatistik tablosu, URL ile paylaşılabilir. |
| 🎬 **Rehberli Turlar** | Skywalker Destanı · Klon Savaşları · Mandalorlunun Yolu — anlatı kartlarıyla rotayı kendisi sürer. |
| ⌘ **Komut Paleti** | ⌘K ile Türkçe-duyarlı bulanık arama; gezegen, karakter, sistem hepsi tek kutuda. |
| ⭐ **Favoriler & Son Gezilenler** | localStorage, giriş yok. |
| 🌍 **TR / EN** | Tüm arayüz ve tüm lore içeriği iki dilli — tip düzeyinde zorunlu. |
| 🖥️ **macOS Uygulaması** | Tauri v2 · 12 MB `.dmg` · yüksek kalite katmanı varsayılan. |

<div align="center">
<img src="docs/screenshots/planet-mustafar.jpg" alt="Mustafar — lav arketipi" width="49%" />
<img src="docs/screenshots/system-tatoo.jpg" alt="Tatoo sistemi — ikiz güneş" width="49%" />
<br />
<sub><i>Sol: Mustafar, lav arketipi + emissive nehirler. Sağ: Tatoo sistemi, ikiz güneş ve üç ay.</i></sub>
</div>

---

## 🗂️ Veri Nereden Geliyor? (Gerçeklik)

Tüm lore verisi **Wookieepedia** ve **StarWars.com Databank**'tan çekilip elle doğrulandı;
`scripts/validate-lore.mjs` `(?)` işaretli veya kaynaksız alanı derlemede reddeder.
Görseller ise **tamamen prosedüreldir** — hiçbir telifli görsel repoda yoktur.

| Kaynak | Ne için | Yöntem | Durum |
|--------|---------|--------|:---:|
| **Wookieepedia** | Gezegen istatistikleri, bölge, sektör, nüfus, yönetim | `starwars.fandom.com/api.php` digest → `fetch-lore.mjs` | ✅ Doğrulandı |
| **StarWars.com Databank** | Karakter biyografileri, çapraz kontrol | Manuel çapraz doğrulama | ✅ Doğrulandı |
| **Prosedürel shader** | Tüm gezegen yüzeyleri | 12 arketipli uber-shader + FBM gürültü | 🎨 Üretilmiş |
| **Prosedürel shader** | Galaksi diski, yıldız alanları, nebula | Log-sarmal nokta bulutları | 🎨 Üretilmiş |
| **Holo-büst placeholder** | Karakter portreleri | Prosedürel siluet + tarama çizgisi | 🟡 Geçici |

**Doğrulama:** son çalıştırmada **74 gök cismi, 0 hata, 0 uyarı**.

---

## 📊 Kapsam

> **74 gök cismi** · 33 karakter · 2 megayapı · 12 yüzey arketipi · 3 dönem · 114 Holocron kaydı

**Bölgeye göre** — merkezden dışa

| Derin Çekirdek | Çekirdek Dünyalar | Koloniler | İç Halka | Genişleme | Orta Halka | Dış Halka | Vahşi Uzay | Bilinmeyen | Uzak Galaksi |
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | 6 | 2 | 2 | 4 | 8 | **45** | 2 | 3 | 1 |

**Yüzey arketipine göre** — 12 shader dalı

| Arketip | Dünya | Arketip | Dünya |
|---------|:--:|---------|:--:|
| 🌿 Verdant | **25** | 🌫️ Swamp-fog | **4** |
| 🏜️ Desert | **12** | 🪨 Barren | **4** |
| ❄️ Ice | **6** | ⛈️ Dark-storm | **3** |
| 🔴 Crystal-red | **6** | 🪐 Gas-giant | **3** |
| 🏙️ Ecumenopolis | **4** | 🌋 Lava | **2** |
| 🌊 Ocean-storm | **4** | 🛰️ Station | **1** |

<div align="center">
<img src="docs/screenshots/holocron.jpg" alt="Holocron — 114 kayıt" width="49%" />
<img src="docs/screenshots/compare.jpg" alt="Kıyaslama — Coruscant vs Hoth" width="49%" />
<br />
<sub><i>Sol: Holocron, filtreli katalog. Sağ: Kıyaslama, iki canlı küre + gerçek çap oranı.</i></sub>
</div>

---

## 🛠️ Teknoloji

```
Çatı         →  Vite 7 · React 19 · TypeScript 5.9 · React Router 7
Render       →  Ham three.js r185 · özel GLSL · WebGL2 (R3F kullanılmadı)
Stil         →  Tailwind CSS 3 · shadcn/ui (Radix)
Durum        →  Zustand (localStorage kalıcı: dil, dönem, kalite, favoriler)
Veri         →  Statik JSON · backend yok · API çağrısı yok
Masaüstü     →  Tauri v2 (Rust + WKWebView) → aarch64 .dmg
Dağıtım      →  Vercel · SPA rewrite + build sonrası statik meta sayfaları
```

**Neden ham three.js?** Motor shader ağırlıklı ve tek karede 74 küre + üç nokta bulutu
çiziyor; React Three Fiber'ın reconciler'ı bu iş için gereksiz bir katman olurdu.
Karar gerekçesi `PLAN.md` §K3'te.

---

## 🔄 Nasıl Çalışıyor (Render Akışı)

```
  data/planets/*.json ──▶ lore.ts ──▶ renderRecipe { archetype, palette, relief }
                                            │
                                            ▼
                       body-material.ts ──▶ uber-shader (12 arketip dalı)
                                            │  + noise-glsl (FBM)
                                            │  + relief (yükseklik gradyanı → normal)
                                            ▼
  galaxy-engine ──┐
  system-engine ──┼──▶ engine-base (sahne · kamera · flyTo · bloom) ──▶ WebGL2
  planet-engine ──┘
                                            ▲
  sim-clock.ts (gerçek saat) ────────────────┘   terminatör ve yörüngeler canlı ilerler
```

- **Galaksi** — 3 nokta bulutu (kol yıldızları, kollar arası alan, nebula pusu) + 74 arketip küresi (`uRelief=0`, kaba küre)
- **Sistem** — güneş(ler), yörünge çizgileri, gezegen + ayları, hızlandırılabilir sim zamanı
- **Gezegen** — tam kabartmalı küre, atmosfer rim ışığı, bulut katmanı, bloom
- **Geçiş** — `useFlyTo` kamerayı hedefe süzer, varan görünüm aynı kadrajdan devralır

---

## 📐 Proje Yapısı

```
GalacticArchives/
├── app/
│   ├── src/
│   │   ├── lib/engine/       # engine-base · planet · system · galaxy · body-material
│   │   │                     # planet-shaders · noise-glsl · effects · planet-textures
│   │   ├── lib/              # lore · collections · tours · quality · sim-clock · ui-strings
│   │   ├── pages/            # Landing · GalaxyView · SystemView · PlanetView · Compare
│   │   │                     # Holocron · HolocronPlanet · HolocronCharacter
│   │   ├── components/       # TransitionVeil · useFlyTo · TourPlayer · Aurebesh
│   │   │                     # CommandPalette · EraFade · SettingsMenu · hud/*
│   │   ├── state/            # app.ts (zustand)
│   │   └── data/             # planets/*.json (74) · characters.json (33)
│   │                         # stations.json (2) · tours.json (3) · sources.json
│   ├── scripts/              # fetch-lore · validate-lore · process-textures · build-static-meta
│   ├── src-tauri/            # Tauri v2 masaüstü kabuğu
│   └── vercel.json           # SPA rewrite
├── docs/screenshots/
├── PLAN.md                   # ürün + teknik plan
├── design.md                 # görsel varlık brief'leri
├── HANDOFF.md                # devam talimatı + kritik tuzaklar
└── SENDEN-GEREKENLER.md      # açık kalemler ve eksik varlıklar
```

---

## 🚀 Kurulum

### Gereksinimler
- Node.js `>= 18`
- WebGL2 destekleyen tarayıcı
- (opsiyonel) `.dmg` derlemek için Rust toolchain + Xcode CLT

```bash
# Klonla
git clone https://github.com/kutluhangil/GalacticArchives.git
cd GalacticArchives/app

# Bağımlılıklar
npm install

# Geliştirme
npm run dev        # http://localhost:5173

# Derleme / kontrol
npm run build      # tsc + vite build + statik meta sayfaları
npm run lint

# macOS uygulaması
npm run desktop    # -> src-tauri/target/release/bundle/dmg/*.dmg
```

> **Ortam değişkeni yok, veritabanı yok, anahtar yok.** `npm install && npm run dev`
> yeterli — tüm veri repoda.

Opsiyonel: `app/raw/planets/<id>-albedo.png` (2:1 equirectangular) bırakıp `npm run textures`
çalıştırırsan motor üretilen albedo haritasını prosedürel yüzeyin üstüne karıştırır.
Detay: [`SENDEN-GEREKENLER.md`](SENDEN-GEREKENLER.md).

---

## 📈 Ölçümler

| Ölçüm | Değer |
|-------|:--:|
| Galaksi haritası (74 dünya) | **77 fps** |
| Gezegen görünümü | **~115 fps** |
| Lighthouse — performans | **95** |
| Lighthouse — erişilebilirlik | **100** |
| Lighthouse — best practices | **100** |
| Lighthouse — SEO | **100** |
| 50 gezegen geçişinde heap büyümesi | **%6,5** (bütçe <%10) |
| `.dmg` boyutu | **12 MB** |
| Prod ilk yanıt | **~0,5 s** |

<sub>Ölçüm ortamı: Apple M4, Chrome, 1360×904.</sub>

---

## ✅ "Gerçek mi?" — Özet

| Şey | Durum |
|------|:--:|
| Lore verisi (istatistik, bölge, biyografi) | ✅ Wookieepedia + Databank, doğrulandı |
| Gezegen yüzeyleri | 🎨 Prosedürel — telifli doku yok |
| Galaksi diski ve yıldız alanları | 🎨 Prosedürel |
| Dönem değişimleri (Alderaan, Ölüm Yıldızı, Starkiller) | ✅ Kanonla uyumlu |
| Terminatör ve yörünge hareketi | ✅ Gerçek saatle canlı |
| Karakter portreleri | 🟡 Geçici holo-siluet |
| Aurebesh yazı katmanı | 🟡 Bileşen hazır, font dosyası bekliyor |
| `.dmg` imzası | 🟡 İmzasız — ilk açılışta sağ tık → Aç |

---

<div align="center">
<img src="docs/screenshots/landing.jpg" alt="Landing" width="80%" />
</div>

---

## 📄 Lisans ve Telif

Resmî olmayan bir hayran projesidir. **Lucasfilm veya Disney ile ilişkisi yoktur.**
Star Wars ve tüm ilgili isimler Lucasfilm Ltd.'ye aittir.
Lore metinleri Wookieepedia (CC BY-SA) ve StarWars.com Databank kaynaklıdır.
Repodaki tüm görseller prosedürel olarak üretilmiştir; telifli hiçbir varlık dağıtılmaz.

---

<div align="center">

Çok uzak bir galaksi için ❤️ ile yapıldı · **[kutluhangil](https://github.com/kutluhangil)**

<br />

*Faydalı bulduysan bir ⭐ bırakmayı düşün.*

</div>
