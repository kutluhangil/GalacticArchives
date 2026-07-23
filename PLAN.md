# GALACTIC ARCHIVES — Star Wars Galaksi Atlası
## Master Plan · v1.0 · 23 Temmuz 2026

> **Tek cümlelik vizyon:** LEO LIVE'ın (Dünya + uydu takibi) kanıtlanmış 3D render motorunu alıp, Star Wars evreninin bilinen tüm ünlü gezegenlerini kapsayan, yaşayan, iki dilli (TR/EN), premium bir "galaksi atlası + holocron wiki" deneyimine dönüştürmek. Web'de yayınlanır, aynı kod tabanından macOS .dmg olarak paketlenir.

---

## İçindekiler
0. [Özet ve temel kararlar](#0-özet-ve-temel-kararlar)
1. [Araştırma: Star Wars galaksisi](#1-araştırma-star-wars-galaksisi)
2. [Gezegen envanteri (Tier S / A / B)](#2-gezegen-envanteri)
3. [İstasyonlar, aylar, asteroitler, nebulalar](#3-i̇stasyonlar-aylar-asteroitler-nebulalar)
4. [Karakter envanteri (wiki)](#4-karakter-envanteri)
5. [Ürün tasarımı: sayfalar ve özellikler](#5-ürün-tasarımı)
6. [Görsel dil: tipografi, renk, motion](#6-görsel-dil)
7. [Teknik mimari](#7-teknik-mimari)
8. [Performans bütçesi](#8-performans-bütçesi)
9. [Ses sistemi](#9-ses-sistemi)
10. [macOS .dmg (Tauri)](#10-macos-dmg-tauri)
11. [Fazlar ve kabul kriterleri](#11-fazlar-ve-kabul-kriterleri)
12. [Riskler, telif, lisanslar](#12-riskler-telif-lisanslar)
13. [Açık sorular — senin kararların](#13-açık-sorular)
14. [Kaynaklar](#14-kaynaklar)

---

## 0. Özet ve temel kararlar

### Mevcut durum
- `app/` içinde çalışan bir Vite + React 19 + TypeScript + Tailwind + shadcn/ui projesi var (LEO LIVE).
- `src/lib/globe-engine.ts` (921 satır): ham three.js, özel GLSL shader'lar (gündüz/gece terminatörü, atmosfer rim ışığı, bloom post-processing), Web Worker mimarisi. **Kalitesi yüksek, aynen evrimleştirilecek.**
- Ekran görüntülerindeki his (karanlık uzay, parlayan atmosfer, ince HUD panelleri) korunacak — senin de sevdiğin his bu.

### Temel mimari kararlar (önerilerim)

| # | Karar | Gerekçe |
|---|-------|---------|
| K1 | **Tek güneş sistemi DEĞİL → Galaksi Haritası → Yıldız Sistemi → Gezegen** hiyerarşisi | Star Wars'ta her gezegen ayrı yıldız sisteminde (Tatoo sistemi, Yavin sistemi...). Hepsini tek güneşe bağlamak evrene aykırı olur. Earth-globe hissi "Gezegen Görünümü"nde birebir korunur. |
| K2 | **Dönem (Era) sistemi** — zaman çubuğu ile galaksinin durumu değişir | Alderaan 0 BBY'den önce sağlam, sonra asteroit tarlası. Death Star I sadece 0 BBY civarında var. Starkiller ateşleniyor. Bu, projenin "killer feature"ı olur. |
| K3 | **Ham three.js motoru korunur, React Three Fiber'a GEÇİLMEZ** | Mevcut motor kanıtlı ve shader-ağırlıklı işlerde ham three daha kontrollü. Yeniden yazım riski gereksiz. |
| K4 | **Tek kod tabanı → Web (Vercel) + Tauri v2 ile .dmg** | Tauri ~10 MB uygulama üretir (Electron ~200 MB). macOS'ta WKWebView + Apple Silicon WebGL2 performansı yüksek. Web sürümü kalite ayarlarıyla her cihazda akıcı kalır. |
| K5 | **Veri tamamen statik JSON, backend yok** | Orijinal projedeki "yerel fizik, sıfır API" felsefesi korunur. Gezegen dönüşleri gerçek saat ile hesaplanır (terminatör çizgisi canlı ilerler). |
| K6 | **Başlangıç kapsamı: 34 Tier-S gezegen + 3 megayapı** | Senin de dediğin gibi önce meşhurlar. Genişleme Tier A/B ile sürümlü yapılır. |
| K7 | **Karakter görselleri = mavi holo-büst stili** | Gerçek oyuncu yüzü üretmek hem tutarsız hem riskli. Hologram stili %100 Star Wars, tutarlı ve şık. |

---

## 1. Araştırma: Star Wars galaksisi

### 1.1 Galaksi yapısı (kanon)
Galaksi ~120.000 ışık yılı çapında, disk şeklinde. Resmî bölgeler (merkezden dışa):

1. **Deep Core** — yıldız yoğun, tehlikeli hiperuzay.
2. **Core Worlds** — medeniyetin kalbi: Coruscant, Alderaan, Corellia, Chandrila, Hosnian Prime.
3. **Colonies** — ilk kolonizasyon halkası (Cato Neimoidia).
4. **Inner Rim** — Jakku (Western Reaches bölgesi).
5. **Expansion Region** — Umbara, Mimban.
6. **Mid Rim** — Naboo, Kashyyyk, Takodana, Jedha, Janix.
7. **Outer Rim Territories** — filmlerin ana sahnesi: Tatooine, Hoth, Endor, Mustafar, Mandalore, Lothal, Ryloth...
8. **Wild Space** — haritalanmış uzayın kenarı (Kamino, Batuu civarı).
9. **Unknown Regions** — batı galaksi: Exegol, Ahch-To, Ilum, Csilla.
10. **Galaksi dışı:** Peridea (Ahsoka — purrgil yoluyla ulaşılan başka galaksi), Rishi Maze (uydu galaksi).

Harita düzlemi koordinatları: kanon **Star Wars: Galactic Atlas** (2016) kitabındaki harf-rakam grid'i kullanılacak (ör. Tatooine R-16, Coruscant L-9). Görsel referans: klasik galaksi haritası + senin bulduğun "50 tür ve gezegenleri" infografiği (`bIDpBkG.png`) tür→gezegen bağlantıları için birebir kaynak.

### 1.2 Resmî zaman dönemleri (era sistemi için)
Lucasfilm'in 9 resmî dönemi; v1'de içerik taşıyan 6'sı kullanılacak:

| Era | Yıllar | Harita durumu değişiklikleri |
|-----|--------|------------------------------|
| The High Republic | ~500–100 BBY | Starlight Beacon (v2), genç Cumhuriyet renkleri |
| Fall of the Jedi | 32–19 BBY | Kamino klon tesisleri aktif, Geonosis droid fabrikaları, Klon Savaşları cepheleri |
| Reign of the Empire | 19–5 BBY | İmparatorluk rengi, Jedha kısmi yıkım, Death Star I inşaatı (Scarif/Eadu bağları) |
| Age of Rebellion | 5 BBY–4 ABY | **Alderaan yok edilir (0 BBY) → asteroit tarlası**, DS I (Yavin, 0 BBY'de yok edilir), DS II (Endor, 4 ABY'de yok edilir) |
| The New Republic | 4–34 ABY | Mandalore Temizliği sonrası, Nevarro gelişir, Jakku enkaz tarlası oluşur (5 ABY) |
| Rise of the First Order | 34–35 ABY | **Hosnian Prime yok edilir**, Starkiller ateşlenir ve yok edilir, Kijimi yok edilir, Exegol filosu |

### 1.3 2025–2026 yeni kanon içerik (bilgi güncellemesi — web'den doğrulandı)
- **The Mandalorian and Grogu** (film, 22 Mayıs 2026): Hoth (AT-AT aksiyon açılışı), **Adelphi** (Yeni Cumhuriyet sahil üssü, Sigourney Weaver = Colonel Ward), Nevarro (Din & Grogu'nun çiftliği), **Shakari** (YENİ gezegen — yasak dönemi Chicago'su tarzı neon yeraltı şehri), **Nal Hutta** (ilk kez live-action; Hutt ikizleri, Rotta the Hutt).
- **Maul: Shadow Lord** (animasyon, S1: 6 Nisan–4 Mayıs 2026): **Janix** (YENİ — Mid Rim, "bir parça Gotham bir parça Metropolis" katmanlı şehir dünyası), Lotho Minor (flashback). S2 → 2027.
- **Ahsoka S2** → 2027 başı (iki galakside geçecek: ana galaksi + Peridea).
- **Star Wars: Starfighter** (film, 28 Mayıs 2027, Ryan Gosling) — TROS'tan ~5 yıl sonra.
- **Skeleton Crew** (2024): At Attin (gizli darphane dünyası), At Achrann, Port Borgo (korsan limanı), Lanupa.

### 1.4 Veri doğrulama stratejisi
Plan seviyesindeki tablolar benim bilgim + yukarıdaki taramayla kuruldu. **P0 fazında her gezegen için Wookieepedia MediaWiki API** (`starwars.fandom.com/api.php`, normal fetch 402 veriyor ama API JSON çalışır) **+ StarWars.com Databank** üzerinden alan alan doğrulama yapılacak (bölge, sektör, grid, çap, iklim, nüfus, ilk görünüm). Emin olmadığım hücreler aşağıda `(?)` ile işaretli — tahmin olarak sunulmayacak.

---

## 2. Gezegen envanteri

### 2.1 TIER S — Açılış kadrosu (34 gezegen + aylar)
Seçim ölçütü: filmlerde/dizilerde ana sahne olmuş, ikonik, görsel olarak ayırt edici.

Kısaltmalar: TPM/AOTC/ROTS (prequel'ler), SOLO, RO (Rogue One), ANH/ESB/ROTJ (orijinal üçleme), TFA/TLJ/TROS (sequel'ler), M&G (Mandalorian and Grogu 2026), TCW (Clone Wars), REB (Rebels), BB (Bad Batch), MANDO, BOBF, OWK (Obi-Wan Kenobi), AND (Andor), AHS (Ahsoka), SC (Skeleton Crew), MSL (Maul: Shadow Lord), JFO (Jedi: Fallen Order/Survivor oyunları).

| # | Gezegen | Bölge · Grid | Tip / iklim | Neden ünlü | Medya | Render imzası |
|---|---------|--------------|-------------|------------|-------|----------------|
| 1 | **Tatooine** | Outer Rim · R-16 | Çöl, ikiz güneş | Luke & Anakin'in evi; Mos Eisley, Jabba Sarayı, podrace | ANH ESB ROTJ TPM AOTC ROTS TCW MANDO BOBF OWK | Çift güneş ışıklandırması (iki DirectionalLight tonu), kum tepesi normal haritası, 3 ay |
| 2 | **Coruscant** | Core · L-9 | Ekumenopolis (tek şehir) | Cumhuriyet/İmparatorluk başkenti, Jedi Tapınağı, Senato | TPM AOTC ROTS TCW AND | Gece ışık ızgarası her yerde + hareketli hava trafiği shader'ı (akış çizgileri) |
| 3 | **Naboo** | Mid Rim · O-17 | Ova/göl/bataklık, plazma çekirdek | Padmé & Palpatine'in evi; Theed, Otoh Gunga | TPM AOTC ROTS TCW | Yeşil-mavi pastoral doku + bulut katmanı; çekirdek plazma "iç ışıma" easter egg |
| 4 | **Alderaan** | Core · M-10 | Dağ/çayır, barışçıl | Leia'nın evi; **0 BBY'de Death Star yok etti** | ANH ROTS OWK | İki durum: sağlam gezegen ↔ asteroit tarlası + "Graveyard" partikülleri (era sistemine bağlı) |
| 5 | **Hoth** | Outer Rim · K-18 | Buz | Echo Base, AT-AT savaşı; M&G 2026 açılışı | ESB M&G | Mavi-beyaz buz, subsurface-benzeri rim, yakın asteroit alanı |
| 6 | **Dagobah** | Outer Rim · M-19 | Bataklık | Yoda'nın sürgünü, karanlık taraf mağarası | ESB ROTJ | Yoğun sis/atmosfer katmanı, düşük görüş, yeşil-kahve palet |
| 7 | **Bespin** | Outer Rim (Anoat) · K-18 | Gaz devi | Cloud City, tibanna gazı, Lando | ESB | Turuncu-krem bantlı gaz shader'ı + yörüngede Cloud City modeli (yüzen şehir) |
| 8 | **Endor sistemi** | Outer Rim · H-16 | Gaz devi + **Orman Ayı** + **Kef Bir** (okyanus ayı) | Ewok'lar, kalkan jeneratörü; DS II enkazı Kef Bir'de | ROTJ TROS | Sistem görünümü vitrini: dev gezegen + 2 ay + DS II (era'ya göre sağlam/enkaz) |
| 9 | **Yavin sistemi** | Outer Rim · P-6 | Kızıl gaz devi + **Yavin 4** (orman ayı) | İsyan üssü, Massassi tapınakları, DS I muharebesi | ANH RO AND | Kızıl dev + yeşil ay kontrastı; 0 BBY era'sında DS I yörüngede |
| 10 | **Mustafar** | Outer Rim · L-19 | Lav/maden | Obi-Wan vs Anakin düellosu; Fortress Vader | ROTS RO | Emissive lav nehirleri (bloom'un yıldızı), kül partikülleri |
| 11 | **Kamino** | Wild Space · S-15 | Fırtına okyanusu | Klon ordusunun yapıldığı yer; Tipoca City | AOTC TCW BB | Kara yok — fırtına hücreli okyanus shader'ı + şimşek çakmaları, direkler üstünde şehirler |
| 12 | **Geonosis** | Outer Rim · R-16 | Halkalı kızıl çöl | Droid fabrikaları, Petranaki arenası, Klon Savaşı'nın başladığı yer | AOTC TCW REB | **Gezegen halkası** + kovan kuleleri; REB era'sında "sterilize edilmiş" |
| 13 | **Kashyyyk** | Mid Rim · P-9 | Dev ağaç ormanı | Wookiee anavatanı, Order 66 sahnesi | ROTS TCW | Katmanlı orman kanopisi, kıyı savaş sahnesi POI |
| 14 | **Utapau** | Outer Rim | Obruk (sinkhole) dünyası | Grievous'un son savaşı, Pau City | ROTS | Normal haritayla dev çukurlar — sıra dışı siluet |
| 15 | **Felucia** | Outer Rim | Mantar ormanı | Klon Savaşları cephesi, Order 66 (Aayla) | ROTS TCW | Yarı saydam turkuaz-macenta biyolüminesans — en renkli gezegen |
| 16 | **Jakku** | Inner Rim (Western Reaches) | Çöl + savaş enkazı | Rey'in evi; Jakku Muharebesi mezarlığı (5 ABY) | TFA | Kumda yıldız destroyeri enkazları (POI modelleri), soluk kum |
| 17 | **Takodana** | Mid Rim | Göl/orman | Maz Kanata'nın kalesi | TFA | Yeşil orman + göller, huzurlu palet |
| 18 | **Ahch-To** | Unknown Regions | Okyanus + adacıklar | İlk Jedi Tapınağı, Luke'un sürgünü, porglar | TFA TLJ | Fırtınalı okyanus + tekil yeşil adalar |
| 19 | **Crait** | Outer Rim | Tuz kabuğu / kızıl mineral | TLJ final muharebesi — beyaz üstünde kızıl izler | TLJ | Beyaz albedo + kızıl çatlak izleri; "vulptex" easter egg |
| 20 | **Exegol** | Unknown Regions | Karanlık Sith dünyası | Sith Eternal, Palpatine'in dönüşü, son muharebe | TROS | Sürekli şimşek shader'ı, karanlık atmosfer, Sith Citadel POI |
| 21 | **Ilum / Starkiller Base** | Unknown Regions | Kyber buz dünyası → süper silah | Jedi kyber hasadı → First Order silahı | TFA (TCW JFO) | İki durum: saf buz dünyası ↔ ekvator hendekli silah (era) + ateşleme animasyonu |
| 22 | **Scarif** | Outer Rim | Tropik arşiv dünyası | Rogue One finali; Citadel, orbital kalkan kapısı | RO | Turkuaz atol dokusu + yörüngede kalkan halkası ve kapı istasyonu |
| 23 | **Jedha** (ay) | Mid Rim | Soğuk çöl, kutsal şehir | Kyber hac merkezi; DS I "tek reaktör" testi | RO | Kısmi krater durumu (era), NiJedha şehri POI |
| 24 | **Corellia** | Core · M-11 | Şehir/tersane dünyası | Han Solo'nun evi; yıldız destroyeri tersaneleri | SOLO AHS | Kıyı megakent ışıkları + tersane iskeleleri |
| 25 | **Kessel** | Outer Rim (Akkadese Maelstrom) | Maden dünyası | Baharat madenleri; **Kessel Run** | SOLO TCW | Çevresinde Maelstrom nebulası + Maw girdabı — "Kessel Run" kamera turu özelliği |
| 26 | **Mandalore** | Outer Rim · O-7 | Camlaşmış çöl + kubbe şehirler | Mandalorian kültürü; Sundari; Temizlik ve yeniden fetih | TCW REB MANDO | Kristalize cam çölü (iridescent shader) + ay Concordia |
| 27 | **Nevarro** | Outer Rim | Volkanik ova | MANDO ana üssü; Din & Grogu'nun evi (M&G) | MANDO BOBF M&G | Bazalt ovalar, lav kanyonu, tek şehir POI |
| 28 | **Lothal** | Outer Rim | Altın çayır | REB'in kalbi; Jedi Tapınağı; Ezra | REB AHS | Altın çayır + beyaz kule; loth-cat easter egg |
| 29 | **Dathomir** | Outer Rim | Kızıl sis dünyası | Nightsister'lar, Maul'un anavatanı | TCW REB JFO | Kan kırmızısı atmosfer + sis, en "korku" atmosferli gezegen |
| 30 | **Ryloth** | Outer Rim | Kanyon dünyası | Twi'lek anavatanı, işgal direnişi | TCW REB BB | Sıcak/soğuk yarımküre kontrastı, kanyon normal haritaları |
| 31 | **Peridea** | **Başka galaksi** | Kül bozkırı + kemik halkası | Ahsoka finali; Nightsister kökeni; Thrawn'un sürgünü | AHS | **Purrgil kemiklerinden halka** — eşsiz render; mor-gri palet |
| 32 | **Ferrix** | Free Trade sector | Tuğla/hurda kasabası | Andor'un evi; isyanın kıvılcımı | AND | Pas-tuğla dokusu, çan kulesi POI, Rix Road |
| 33 | **Nal Hutta** | Hutt Space | Kirli bataklık | Hutt anavatanı; **M&G ile ilk live-action** | M&G TCW | Hastalıklı sarı-yeşil bataklık, yağlı su parlaması, smog |
| 34 | **Shakari** | (P0'da doğrulanacak) | Neon yeraltı şehri | M&G 2026'nın yeni dünyası; "yasak dönemi Chicago'su" | M&G | Gece tarafı ağırlıklı neon ışık haritası, smog katmanı |

**Ayrıca Tier S kapsamında aylar:** Tatooine'in 3 ayı, Endor Orman Ayı + Kef Bir, Yavin 4, Jedha, Concordia (Mandalore), Nal Hutta'nın ayı Nar Shaddaa ("Smuggler's Moon" — şehir ayı, görsel bonus).

### 2.2 TIER A — v1.1 genişlemesi (~36)
Cato Neimoidia (köprü şehirler), Mygeeto, Saleucami, Polis Massa (asteroit üssü — Luke & Leia'nın doğum yeri), Christophsis (kristal şehirler), Umbara (gölge dünyası), Onderon, Moraband (Sith anavatanı), Serenno (Dooku), Eriadu (Tarkin), Batuu (Galaxy's Edge), D'Qar, Cantonica/Canto Bight, Pasaana, Kijimi (yok edilir), Eadu, Lah'mu (halkalı), Wobani, Mimban, Vandor, Savareen, Numidian Prime, Sorgan, Arvala-7, Tython, Trask (ay), Morak, Plazir-15, Glavis (halka-dünya istasyonu), Seatos, Atollon, Malachor, Krownest, Chandrila (Mon Mothma), Ghorman (Andor S2 katliamı), Aldhani, Narkina 5 (hapishane ayı), Daiyu, Hosnian Prime (yok edilir), At Attin (SC), Janix (MSL), Adelphi (M&G).

### 2.3 TIER B — uzun vade / opsiyonel "Legends" modu
- Kanon derin kesim: Devaron, Florrum, Zygerria, Rishi ayı, Anaxes, Skako Minor, Mortis (boyut — "efsane" girişi olarak), Jabiim, Mapuzo, Brendok, Khofar, Lotho Minor, Lanupa, Port Borgo...
- **Legends toggle (v2 fikri):** Korriban, Dromund Kaas, Taris, Manaan, Csilla, Zonama Sekot, Kamino'nun ötesi... Ayar panelinden "Legends içeriğini göster" anahtarı. Senin infografikteki 50 türün anavatanlarının tamamı bu katmanla kapsanır.

---

## 3. İstasyonlar, aylar, asteroitler, nebulalar

### 3.1 Megayapılar (era'ya bağlı görünürlük)
| Yapı | Konum | Var olduğu aralık | Render |
|------|-------|-------------------|--------|
| **Death Star I** (120 km) | İnşaat: Scarif/Geonosis → Yavin | ~19 BBY–0 BBY | Prosedürel küre + ekvator hendeği + süperlazer çanağı + greeble normal haritası. Yavin 4 görünümünde yörüngede |
| **Death Star II** (~160+ km) | Endor yörüngesi | 3–4 ABY | Yarım-inşaat hali (açık iskelet kısmı) — ikonik siluet; 4 ABY sonrası Kef Bir'de enkaz |
| **Starkiller Base** (660 km) | Ilum gövdesi | ~34 ABY | Gezegenin kendisi; ekvator hendeği + ateşleme ışını efekti |

### 3.2 "Yaşayan uzay" katmanı (senin istediğin canlılık)
- **Asteroit alanları:** Hoth alanı (ESB kovalamacası — Milenyum Şahini easter egg'i), Alderaan Mezarlığı (era≥0 BBY), Polis Massa, Geonosis halka taşları. InstancedMesh + basit Kepler dönüşü, LOD ile.
- **Nebulalar:** Akkadese Maelstrom + The Maw (Kessel), Peridea'nın kızıl göğü, arka plan galaksi çekirdeği parlaması. Sprite + shader karışımı.
- **Gemi trafiği:** Sistem görünümünde ölçekli ambient trafik — Coruscant'ta yoğun şerit akışı, Tatooine'de tek tük kargo, era'ya göre TIE devriyeleri/X-wing'ler. Spline üzerinde instanced düşük poli modeller.
- **Hipersıçrama olayları:** Rastgele aralıklarla bir geminin yıldız çizgileriyle gelişi/gidişi (ses + ışık izi).
- **Kuyruklu yıldızlar / uzak yıldız akmaları:** Galaksi haritasında seyrek partikül olayları.
- **Gerçek zaman:** Her gezegen kendi dönüş periyoduyla döner (gerçek saatten hesap, LEO LIVE'daki `useSimClock` mantığı) — terminatör çizgisi gün boyu ilerler. Zaman hızlandırma kontrolü (1×/60×/600×) korunur.

---

## 4. Karakter envanteri

Wiki'nin ikinci ayağı. Tier 1 (~32 karakter), her biri **anavatan gezegenine çift yönlü bağlı** (gezegen sayfasında "Ünlü sakinler", karakter sayfasında tıklanabilir gezegen):

Luke Skywalker (Polis Massa doğum → Tatooine), Leia Organa (Polis Massa → Alderaan), Anakin/Darth Vader (Tatooine), Han Solo (Corellia), Chewbacca (Kashyyyk), Obi-Wan Kenobi (Stewjon), Yoda (bilinmiyor — "?" kartı espirili detay), Palpatine/Darth Sidious (Naboo), Padmé Amidala (Naboo), Qui-Gon Jinn (Coruscant), Darth Maul (Dathomir), Count Dooku (Serenno), General Grievous (Kalee), Ahsoka Tano (Shili), Captain Rex (Kamino), Grand Admiral Thrawn (Csilla), Ezra Bridger (Lothal), Kanan Jarrus (Coruscant), Hera Syndulla (Ryloth), Sabine Wren (Krownest/Mandalore), Din Djarin (Aq Vetina), Grogu (bilinmiyor), Boba Fett (Kamino), Bo-Katan Kryze (Mandalore), Cassian Andor (Kenari → Ferrix), Jyn Erso (Vallt → Lah'mu), Mon Mothma (Chandrila), Rey (Jakku'da terk edilmiş), Kylo Ren/Ben Solo (Chandrila), Finn (bilinmiyor — FN-2187), Poe Dameron (Yavin 4), Lando Calrissian (Socorro `(?)`).

Karakter veri şeması: kimlik, tür, anavatan, bağlılıklar (era'ya göre: Jedi → Empire gibi), ilk/son görünüm, kısa biyografi (TR+EN), holo-portre, ilişkili karakterler, imza repliği.

**Droid/tür bonus sayfaları (v1.1):** R2-D2, C-3PO, BB-8, K-2SO, Chopper + senin infografikten tür sayfaları (Wookiee, Twi'lek, Hutt...).

---

## 5. Ürün tasarımı

### 5.1 Sayfa akışı
```
Landing (/)
 ├─ "A long time ago..." mikro-giriş + LOGO + yıldız alanı
 ├─ [EXPLORE THE GALAXY] → /galaxy
 ├─ [HOLOCRON] → /holocron (wiki)
 └─ alt şerit: öne çıkan 6 gezegen kartı + dil/ses anahtarı

/galaxy — Galaksi Haritası (3D)
 ├─ Eğik perspektifli galaksi diski, bölge halkaları etiketli, sistem noktaları parlar
 ├─ Era zaman çubuğu (alt orta) — harita renkleri/varlıklar değişir
 ├─ Arama (⌘K), bölge filtreleri, fraksiyon lejantı
 └─ Sisteme tıkla → hipersıçrama geçişi → /system/:id

/system/:id — Yıldız Sistemi görünümü
 ├─ Yıldız(lar) + gezegenler yörüngede + aylar + istasyonlar + asteroitler
 ├─ LEO LIVE'ın zaman kontrolü burada (1×/60×/600×)
 └─ Gezegene tıkla/yaklaş → /planet/:id

/planet/:id — Gezegen görünümü (LEO LIVE Earth hissi birebir)
 ├─ Tam ekran globe: özel shader, atmosfer, bulutlar, gece ışıkları, aylar
 ├─ Sol HUD panel: isim (Aurebesh alt yazısıyla), bölge/grid, iklim, nüfus,
 │   yönetim, türler, dönemsel bağlılık rozetleri
 ├─ Sekmeler: Genel Bakış · Tarih · Önemli Yerler (POI pinleri globe üstünde) ·
 │   Karakterler · Görünümler (film/dizi listesi) · Galeri
 └─ [HOLOCRON'DA AÇ] → tam wiki sayfası

/holocron — Wiki (gezegenler + karakterler + medya)
 ├─ Kart ızgarası + tam metin arama + filtreler (bölge, era, medya, tür)
 ├─ /holocron/planet/:id, /holocron/character/:id, /holocron/media/:id
 └─ Wookieepedia'dan farkı: 3D atlasla iç içe, küratörlü, iki dilli, hikâye odaklı

/settings — dil, ses seviyeleri, kalite (Auto/Low/Med/High/Ultra), hareket azaltma
```

### 5.2 Özellik listesi
- **i18n:** TR + EN, tüm veri ve UI (i18next; veri JSON'larında `{tr,en}` alanları). URL'de dil kalıcılığı, `localStorage` tercihi.
- **Era sistemi (K2):** 6 konumlu zaman çubuğu; değişen: yok edilmiş dünyalar, megayapılar, fraksiyon renkleri, trafik tipi. Gezegen sayfasında "bu era'da bu gezegen" özeti.
- **Hipersıçrama geçişleri:** Sistemler arası her navigasyon = yıldız çizgisi tüneli (shader) + ses. Sayfa geçişlerinde Star Wars **wipe** animasyonları (filmlerdeki diyagonal/dairesel silme — otantik dokunuş).
- **Arama:** ⌘K komut paleti (shadcn `command` hazır) — gezegen/karakter/medya, TR ve EN adlarla.
- **Kıyaslama modu (v1.1):** İki gezegeni yan yana + boyut kıyası (Death Star vs Coruscant şovu).
- **Favoriler + son gezilenler:** `localStorage`.
- **Tur modu:** "Skywalker Destanı Turu", "Klon Savaşları Turu", "Mando'nun Yolu" — otomatik kamera + anlatı kartları sırası.
- **Easter egg'ler:** Konami kodu → Disko topu Death Star? (hayır — daha zarif: X-wing kamera peşinde uçar), Kessel Run kronometreli kamera parkuru, porg tıklanınca ses.
- **Erişilebilirlik:** `prefers-reduced-motion` desteği, klavye navigasyonu, kontrast AA, alt metinler.
- **SEO/paylaşım:** Gezegen başına OG kart (statik render görüntüsü), sitemap.

### 5.3 Landing page (ilk izlenim = her şey)
1. Siyah ekran, yıldızlar belirir, uzak galaksi çekirdeği parlar.
2. "A long time ago in a galaxy far, far away...." mavi metni (2 sn, klasik).
3. LOGO perspektifle içeri düşer (Star Jedi font, sarı #FFE81F), müzik başlar (açıksa).
4. Kamera galaksiye doğru yavaş dalış; iki CTA: **EXPLORE** ve **HOLOCRON**.
5. Kaydırınca: "Yaşayan Galaksi" tanıtım şeridi (canlı mini-render'lar), öne çıkan gezegen kartları, era tanıtımı, alt bilgi (fan projesi feragatnamesi).

---

## 6. Görsel dil

### 6.1 Tipografi (önemli kısıt: Türkçe karakterler)
| Rol | Font | Not |
|-----|------|-----|
| Logo + İngilizce vitrin başlıkları | **Star Jedi** (Boba Fonts) | Ücretsiz (kişisel+ticari). **Türkçe glyph YOK** → yalnızca EN sabit metinlerde |
| Başlıklar (TR uyumlu) + crawl metni | **Libre Franklin** (Google Fonts, OFL) | Filmin açılış yazısı News Gothic'e en yakın özgür font; tam TR desteği |
| HUD / veri etiketleri | **Barlow Condensed** (OFL) | Teknik, dar, okunur; TR desteği tam |
| Dekoratif in-universe yazı | **FT Aurebesh** (OFL) | Panel köşelerinde, gezegen adının Aurebesh karşılığı — atmosfer katmanı |

### 6.2 Renk paleti
```
--space-black:   #030509   (zemin — LEO LIVE'dan koyu)
--panel:         #0B0F17 / %72 opaklık + 1px #1C2536 kenar (holo panel)
--star-gold:     #FFE81F   (SW logo sarısı — birincil vurgu, CTA)
--holo-cyan:     #66D9FF   (hologram mavisi — veri, çizgiler, holo-portreler)
--sith-red:      #E0312E   (tehlike, İmparatorluk/Sith era vurguları)
--rebel-orange:  #E8632C   (İsyan rozetleri)
--text-primary:  #E8ECF4 · --text-dim: #8B94A7
Fraksiyon renkleri: Republic #B8302F(bordo)·Empire #7A8494(çelik)·Rebel #E8632C·
First Order #C00000·Mandalorian #5B6770·Hutt #7A6E2F
```

### 6.3 UI motifleri
- **Holo-panel:** hafif cyan iç ışıma, üstte 1px tarama çizgisi animasyonu (çok hafif, %4 opaklık), köşelerde kırpık "targeting bracket" süsleri.
- **Aurebesh mikro-etiketler:** her panelin köşesinde ilgili kelimenin Aurebesh'i (hover'da çevirisi — hoş detay).
- **Seçim retikülü:** gezegen seçiminde daralan hedefleme parantezi (Death Star hedefleme bilgisayarı estetiği, RO stili).
- **Yükleme durumu:** dönen holocron küpü (CSS 3D) + "Accessing archives..." / "Arşivlere erişiliyor...".
- **İmleç:** varsayılan; interaktiflerde cyan nokta halkası (custom cursor abartısı yok).

### 6.4 Motion dili
- Sayfa geçişleri: **filmlerdeki wipe'lar** (yatay/diyagonal/iris) — 400–600 ms, `prefers-reduced-motion`'da anında.
- Sistemler arası: hipersıçrama tüneli 1.2 s (atlanabilir, ayarlardan kapatılabilir).
- Panel girişleri: 150–250 ms fade+8px yükselme; holo-flicker sadece ilk açılışta 1 kez (epilepsi güvenliği: hızlı stroboskop yok).
- Kamera: her zaman damped (LEO LIVE OrbitControls hissi), FOV sabit, ani kesme yok.

---

## 7. Teknik mimari

### 7.1 Yığın (mevcut app evrimleştirilir — sıfırdan değil)
```
Vite 7 · React 19 · TypeScript 5.9 · Tailwind 3.4 + shadcn/ui (mevcut)
three.js 0.185 (mevcut)          → planet-engine.ts (globe-engine.ts'den türetilir)
react-router 7 (mevcut)          → route yapısı §5.1
i18next + react-i18next (YENİ)   → TR/EN
zustand (YENİ, küçük)            → era, ses, kalite, seçim durumu
fuse.js (YENİ)                   → holocron araması
Tauri v2 (YENİ, faz P5)          → .dmg paketleme
Kaldırılacak: satellite.js, TLE dosyaları, propagator worker (SGP4 gereksiz —
basit dairesel Kepler dönüşü yeterli; useSimClock ve zaman kontrolü KALIR)
```

### 7.2 Render mimarisi — "gezegen arketipi" sistemi
Her gezegen `renderRecipe` ile tanımlanır; motor arketip shader kitini uygular:

| Arketip | Shader özellikleri | Kullanan |
|---------|--------------------|----------|
| `desert` | çift güneş desteği, kum spekülri, ısı pusu rimi | Tatooine, Jakku, Geonosis, Jedha, Pasaana |
| `ecumenopolis` | gece ışık ızgarası her açıda, hareketli trafik akış haritası (flowmap), pencere parıltısı | Coruscant, Nar Shaddaa, Shakari, (Corellia kısmi) |
| `lava` | emissive lav akış haritası (UV kaydırmalı), kül partikül sistemi | Mustafar, Nevarro (hafif) |
| `ice` | yüksek spekülr + sahte SSS derinlik rengi, aurora opsiyonu | Hoth, Ilum, Starkiller |
| `ocean-storm` | animasyonlu fırtına hücreleri (noise), şimşek flaşları, dalga spekülri | Kamino, Ahch-To, Kef Bir |
| `gas-giant` | prosedürel bant + türbülans noise'u (doku opsiyonel), yumuşak limb karartması | Bespin, Yavin Prime, Endor devi |
| `verdant` | bulut katmanı ayrı mesh (alpha doku), orman/ova albedosu | Naboo, Takodana, Kashyyyk, Alderaan, Yavin 4, Endor ayı, Lothal |
| `swamp-fog` | çift atmosfer katmanı (yoğun sis rengi), düşük kontrast | Dagobah, Nal Hutta |
| `crystal-red` | kızıl atmosfer, iridescence (Mandalore camı), sis hacmi | Dathomir, Mandalore, Crait (varyant) |
| `dark-storm` | sürekli şimşek, koyu bulut kapağı, kızıl/yeşil accent | Exegol |
| `ringed` | halka mesh'i (doku şeridi + gölge), kemik halkası varyantı | Geonosis, Lah'mu, Peridea |
| `destroyed` | asteroit InstancedMesh alanı + isim plaketi | Alderaan (0 BBY+), Hosnian Prime |

Ortak katmanlar (LEO LIVE'dan miras): terminatör karışımı (gündüz/gece), rim atmosfer (gezegen başına renk), bloom, yıldız alanı. Güneşler: sistem başına 1–2 yıldız (Tatoo ikiz!), renk sıcaklığı gezegen paletini etkiler.

### 7.3 Veri şeması (`src/data/planets/tatooine.json` örneği)
```jsonc
{
  "id": "tatooine",
  "names": { "en": "Tatooine", "tr": "Tatooine" },
  "aurebesh": "tatooine",
  "region": { "en": "Outer Rim Territories", "tr": "Dış Halka Bölgeleri" },
  "sector": "Arkanis", "system": "Tatoo", "grid": "R-16",
  "classification": "terrestrial-desert",
  "stats": { "diameterKm": 10465, "rotationH": 23, "orbitD": 304, "moons": 3,
             "population": { "en": "200,000 (licensed settlers)", "tr": "200.000 (kayıtlı yerleşimci)" } },
  "suns": [ { "name": "Tatoo I", "color": "#FFD9A0" }, { "name": "Tatoo II", "color": "#FFB36B" } ],
  "climate": { "en": ["Arid", "Hot"], "tr": ["Kurak", "Sıcak"] },
  "affiliationsByEra": { "fall-of-the-jedi": "hutt", "age-of-rebellion": "hutt" },
  "appearances": ["anh","esb","rotj","tpm","aotc","rots","tcw","mando","bobf","owk"],
  "poi": [ { "id":"mos-eisley", "lat":-12.4, "lon":38.2,
             "names": {"en":"Mos Eisley","tr":"Mos Eisley"},
             "blurb": {"en":"...wretched hive of scum and villainy.","tr":"...pislik ve alçaklık yuvası."} } ],
  "characters": ["luke-skywalker","anakin-skywalker","boba-fett","din-djarin"],
  "funFacts": { "en": ["Binary sunset ..."], "tr": ["İkiz gün batımı ..."] },
  "renderRecipe": { "archetype":"desert", "textures":{"albedo":"tatooine/albedo.ktx2"},
                    "atmosphere":{"color":"#E8B27A","density":0.7}, "dualSun":true,
                    "effects":["heat-shimmer"] }
}
```
Doğrulama: her JSON alanı için kaynak notu tutan `sources.json` (P0 pipeline çıktısı) — "yanlış bilgi olmasın" şartının garantisi.

### 7.4 Doku hattı (asset pipeline)
1. Gemini üretimi (design.md brief'leri) → `raw/` klasörü PNG.
2. `scripts/process-textures.mjs`: seam kontrolü (yatay %50 offset diff), 4K'ya upscale gerekirse işaretleme, **KTX2/Basis sıkıştırma** (`toktx`), mip üretimi.
3. Kalite katmanları: Ultra 4K / High 2K / Low 1K otomatik üretilir.
4. Gece ışık + bulut + emissive haritaları ayrı kanallar.
Lazy yükleme: gezegen görünümüne girerken yüklenir, LRU önbellek (en fazla ~6 gezegen dokusu bellekte).

---

## 8. Performans bütçesi

| Metrik | Hedef |
|--------|-------|
| FPS | Apple Silicon: 60 sabit · orta dizüstü: 60 (High) · zayıf iGPU: 30+ (Low) |
| Draw call | Gezegen görünümü <120, galaksi haritası <150 (instancing sayesinde) |
| GPU doku belleği | Ultra ≤500 MB · High ≤250 MB · Low ≤100 MB (KTX2 ile) |
| İlk yükleme (landing) | <2.5 s LCP (landing 3D'si hafif: yalnız yıldız alanı + logo) |
| Bundle | three.js chunk ayrık; route-split; başlangıç JS <350 KB gzip |
| Bellek sızıntısı | Sistemler arası 50 geçişte heap büyümesi <%10 (dispose disiplini — LEO LIVE'da zaten var) |

Kalite otomatiği: `detect-gpu` + ilk 3 saniye FPS örnekleme → katman seçimi; DPR clamp (Low'da 1.0, Ultra'da 2.0); bloom Low'da kapalı.

---

## 9. Ses sistemi

- **Mimari:** WebAudio; 3 kanal — `music` (crossfade'li), `ambience` (gezegen döngüsü: çöl rüzgârı, şehir uğultusu, yağmur...), `sfx` (UI). Master + kanal bazlı ses/mute, `localStorage` kalıcı. Tarayıcı autoplay kısıtı: ilk etkileşimde başlat, landing'de "🔊 sesi aç" nazik rozeti.
- **Kapatma butonu:** her sayfada kalıcı (senin şartın) — header'da tek tık mute.
- **Geçiş sesleri:** hipersıçrama whoosh, panel holo-açılış, retikül kilidi, era değişim vınlaması. **Bunların çoğunu WebAudio sentezle kod içinde üretebilirim (telif YOK, dosya YOK).**
- **Müzik (telif konusu — §12):** sistem "slot" tabanlı: `public/audio/music/<planet-or-view>.mp3` varsa çalar, yoksa sessiz/sentez ambient'e düşer. Seçenekler: (a) kendi dosyalarını koyarsın, (b) **ACE-Step ile John Williams *esinli* özgün ambient'ler üretiriz** (elimde skill var — "Imperial-esque brass motif", "desert dune ambient" gibi), (c) v1 yalnız ambient+SFX ile çıkar. Önerim: (b) — özgün, güvenli, atmosferik.

---

## 10. macOS .dmg (Tauri)

- **Tauri v2**, aynı `app/` kod tabanı; `src-tauri/` eklenir. Çıktı: imzasız .dmg (~10–15 MB) — kendi Mac'inde sağ tık→Aç ile çalışır (notarization istersen Apple Developer hesabı gerekir, opsiyonel).
- Masaüstü artıları: varsayılan kalite Ultra, native tam ekran, menü çubuğu (⌘F arama, era kısayolları 1–6), çevrimdışı tam çalışma (tüm dokular pakette).
- WKWebView WebGL2 Apple Silicon'da güçlü; yine de P5 başında 1 günlük spike ile FPS doğrulanır — beklenmedik sorun çıkarsa Electron'a geçiş B planı (aynı web kodu, sadece kabuk değişir).
- Web tarafı ayrıca **PWA** yapılır (service worker + doku önbelleği) → telefon fazına şimdiden köprü, "yüklenebilir" site.

---

## 11. Fazlar ve kabul kriterleri

### P0 — Veri ve doğrulama (temel) ✅ TAMAMLANDI (23 Tem 2026)
- [x] 34 Tier-S gezegen dosyası → **41 gök cismi** (iç içe aylar: Orman Ayı, Kef Bir, Yavin 4, Concordia, Nar Shaddaa + DS-1/DS-2 istasyonları). Kaynak: Wookieepedia MediaWiki API (`app/scripts/fetch-lore.mjs`), 75 varlık `sources.json`'da
- [x] **33 karakter** (plan 32 + Jabba); TR metinler elle yazıldı, çeviri değil
- [x] Medya künyeleri (23) + 3 era + 10 bölge + 12 fraksiyon (`src/data/meta/`)
- [x] Çapraz doğrulama scripti `app/scripts/validate-lore.mjs`: koordinat/çap/doğum yılı digest karşılaştırması dahil → **0 hata, 0 uyarı**; `(?)` işareti kalmadı
- [x] Build doğrulandı (`tsc -b && vite build` ✓). Not: Kimi'nin package-lock'u özel mirror'a işaret ediyordu; public registry ile yeniden üretildi
- Bilinen tarihleme notu: Wookieepedia güncel kanon tarihlemesi Scarif ölümlerini 1 BBY sayar (Star Wars: Timelines konvansiyonu) — veride bu esas alındı

### P1 — Çekirdek motor (his burada kanıtlanır) 🟡 KOD TAMAM (23 Tem 2026) — his onayı sende
- [x] `engine-base.ts` + `planet-engine.ts` + `system-engine.ts`: 11 arketipli prosedürel uber-shader (Gemini dokusu gelince `uUseAlbedo` ile karışıma girer), atmosfer, bulut katmanı, halkalar, aylar, çift güneş ışıklandırması
- [x] 5 kahraman gezegen canlı: Tatooine (çift güneş + 3 ay), Coruscant (gece şehir ışıkları), Mustafar (emissive lav + bloom), Hoth (buz + spekülr), Bespin (bant kontrastlı gaz devi)
- [x] Sistem görünümü: Tatoo sistemi ikiz güneşleriyle; gezegene tıkla → hipersıçrama → gezegen görünümü
- [x] HUD: TR/EN dil anahtarı, gezegen paneli (bölge/çap/nüfus/medya çipleri/fun fact), POI pinleri (hover açıklamalı), zaman kontrolü (1×–1h/s), era pilleri (v1 kaba)
- [x] Hipersıçrama overlay (reduced-motion'da atlanır) + `/legacy`'de eski LEO LIVE korunuyor
- [x] Tarayıcı doğrulaması: 160–175 fps @1360×904 (`screenshots/p1-*.jpg`)
- Düzeltilen iki temel sorun: kök dizine kaçan `npm install` (vite zustand'ı çözemiyordu) ve `vite.config.ts base:'./'` (derin SPA rotalarında asset 404 → siyah ekran)
- [ ] **Kabul bekliyor:** senin "his" onayın — `cd app && npm run dev` (Coruscant gece dokusu, Gemini Parti 1 gelene dek prosedürel placeholder)

### P2 — Galaksi + tam kadro
- [ ] Galaksi haritası (bölgeler, grid, arama, filtreler)
- [ ] 34 gezegen + aylar + 3 megayapı + asteroit/nebula katmanları + ambient trafik
- [ ] Era sistemi (6 dönem, yıkım durumları)
- **Kabul:** galaksi→sistem→gezegen→galaksi tam akış akıcı; era değişimi <300 ms'de tepki verir

### P3 — Holocron + i18n + Landing
- [ ] Landing page (crawl girişi, CTA'lar), Holocron wiki (arama, filtre, çapraz bağlantılar)
- [ ] TR/EN eksiksiz; dil anahtarı her sayfada
- **Kabul:** İki dilde de tüm sayfalar; Lighthouse erişilebilirlik ≥90

### P4 — Ses + cila
- [ ] WebAudio sistemi, SFX sentezleri, müzik slotları (± ACE-Step üretimleri)
- [ ] Easter egg'ler, tur modu, OG kartları, SEO, hata durumları
- **Kabul:** ses açık/kapalı iki modda da deneyim tam; `prefers-reduced-motion` denetimi geçer

### P5 — Paketleme ve yayın
- [ ] Vercel yayını (özel domain?), PWA
- [ ] Tauri .dmg (Apple Silicon) + kısa kullanım notu
- **Kabul:** .dmg temiz Mac'te açılır ve çevrimdışı tam çalışır; web Lighthouse perf ≥85 (3D sayfaları hariç tutulur, landing ölçülür)

### P6 — (SONRA, şimdi tasarlanmıyor) Mobil uygulama
- Not: PWA + responsive zaten telefonda çalışır durumda olacak; native sarmalayıcı (Capacitor/Tauri mobile) ayrı proje fazı. **Bu plan kapsamı dışı — senin talimatınla.**

---

## 12. Riskler, telif, lisanslar

| Konu | Durum | Önerim |
|------|-------|--------|
| Star Wars IP (Disney/Lucasfilm) | Fan projesi; ticari olmayan fan siteleri fiilen hoş görülür ama hak her zaman Disney'de | Footer'a açık feragatname: "Unofficial fan project. Not affiliated with Lucasfilm/Disney." Ticarileştirme yok. Sen "telife sonra bakarız" dedin — bu satır yeterli başlangıç |
| Film müzikleri (John Williams) | Kayıtlar + besteler telifli; siteye koymak açık ihlal, tespit edilir | §9(b): ACE-Step ile özgün esinli müzik. Orijinal parçaları koymak istersen dosyaları sen eklersin, sistem hazır |
| Fontlar | Star Jedi: ücretsiz (kişisel+ticari) · FT Aurebesh: SIL OFL · Libre Franklin/Barlow: OFL | Sorunsuz. Lisans dosyaları `public/fonts/LICENSES/` altına |
| Wookieepedia metinleri | CC-BY-SA lisanslı | Bilgileri **kendi cümlelerimizle** yazacağız + yine de Holocron sayfalarında "Sources: Wookieepedia (CC-BY-SA), StarWars.com Databank" atıf satırı — hem etik hem lisansa uygun |
| Karakter/oyuncu görselleri | Oyuncu benzerliği ayrı bir haktır (likeness) | K7: holo-büst stilizasyonu — oyuncu yüzü birebir üretilmez |
| Gemini doku üretim tutarlılığı | Farklı oturumlarda stil kayması riski | design.md'deki sabit stil öneki + her partide seam/renk kontrol scripti |
| Kapsam şişmesi | 300+ kanon gezegen tuzağı | Tier disiplini; Tier A ancak v1 yayınlandıktan sonra |
| WKWebView sürprizi (Tauri) | Düşük olasılık | P5 başında 1 günlük spike; B planı Electron |

---

## 13. Kararlar (23 Temmuz 2026 — onaylandı)

1. **İsim:** ✅ **GALACTIC ARCHIVES**. Logo/marka varlıkları bu isme göre.
2. **Müzik:** ✅ (b) ACE-Step ile özgün "esinli" ambient üretimi (P4'te). Slot sistemi orijinal dosya eklemeye her zaman açık.
3. **Era sistemi:** ✅ v1'de 3 era ile başla — `clone-wars` (Klon Savaşları, 32–19 BBY) · `empire` (İmparatorluk & İsyan, 19 BBY–4 ABY) · `new-republic` (Yeni Cumhuriyet & First Order, 4–35 ABY). P4'te 6'ya genişletilebilir.
4. **Karakter görselleri:** ✅ mavi holo-büst stili (design.md §3).
5. **Domain:** şimdilik Vercel varsayılan adresi; özel domain P5'te kararlaştırılır.
6. **Legends toggle:** ✅ v2'ye ertelendi.

### Gemini üretim zamanlaması
Şimdi şart değil — P1 motoru prosedürel placeholder dokularla başlar. Önerilen akış: **Parti 1** (5 kahraman gezegen, 7 harita — design.md §6) P1 bitmeden hazır olsun → motorda stil kilidi onayı → kalan ~82 varlık ancak o onaydan sonra seri üretilir (stil tutmazsa toplu yeniden üretim maliyetini önler).

---

## 14. Kaynaklar

Araştırmada kullanılanlar (P0'da her gezegen için genişletilecek):
- [StarWars.com — The Mandalorian and Grogu: Everything We Know](https://www.starwars.com/news/the-mandalorian-and-grogu-everything-we-know)
- [ScreenRant — Every Confirmed Planet in The Mandalorian and Grogu](https://screenrant.com/star-wars-planet-mandalorian-and-grogu-every/)
- [StarWars.com — Making of Maul: Shadow Lord (Janix)](https://www.starwars.com/news/star-wars-maul-shadow-lord-trivia)
- [Wookieepedia — Maul: Shadow Lord Season 1](https://starwars.fandom.com/wiki/Maul_-_Shadow_Lord_Season_1)
- [Hollywood Reporter — Ahsoka S2 → erken 2027](https://www.hollywoodreporter.com/tv/tv-news/ahsoka-season-2-premiere-date-star-wars-1236593884/)
- [StarWars.com — Ahsoka S2 duyurusu](https://www.starwars.com/news/star-wars-ahsoka-season-2-premiere)
- [Wookieepedia — List of planets](https://starwars.fandom.com/wiki/List_of_planets)
- [1001freefonts — Star Jedi (Boba Fonts)](https://www.1001freefonts.com/star-jedi.font) · [Fontesk — FT Aurebesh (SIL OFL)](https://fontesk.com/ft-aurebesh-font/)
- Kanon referans kitap: *Star Wars: Galactic Atlas* (2016) — grid koordinatları
- Görsel referanslar: LEO LIVE ekran görüntüleri (`screenshots/`), `bIDpBkG.png` (50 tür infografiği), satellitemap.space, Track The Sky
