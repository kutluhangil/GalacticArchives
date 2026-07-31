# Galactic Archives — nereye gidebilir, nasıl daha iyi görünür

31 Temmuz / 1 Ağustos 2026. Faz C3 (hiperuzay hattı seçimi ve hat turu) kapandıktan sonra
yazıldı. İki bölüm: ne eklenebilir, ve mevcut yüzeyler tasarım olarak nasıl daha iyi olur.

Buradaki her yargı depodaki gerçek durumdan çıkıyor — `docs/screenshots/` altındaki
ekran görüntüleri, `tailwind.config.js`'teki token'lar, `src/data/` altındaki veri.
Emin olmadığım yerde emin olmadığımı yazdım.

---

## 1. Ürün: ne eklenebilir

Değer/emek oranına göre sıralı. "Emek" kaba bir faz ölçüsü: küçük = bir oturum,
orta = birkaç oturum, büyük = kendi fazı.

### 1.1 Hat veri borcu — 17 hat uçulamıyor (büyük, en yüksek değer)

C3'ün ortaya çıkardığı en sert gerçek: 23 çizili hattın yalnızca 6'sı tur taşıyabiliyor.

| Hat | Arşivdeki durak / toplam durak |
| --- | --- |
| Corellian Run | 4 / 25 |
| Triellus Trade Route | 3 / 39 |
| Perlemian Trade Route | 2 / 24 |
| Hydian Way | 2 / 47 |
| Rimma Trade Route | 2 / 17 |
| Corellian Trade Spine | 2 / 50 |
| kalan 17 hat | 0 veya 1 |

Eşleşme hatası değil: kontrol ettim, `bodyId` almamış hiçbir durak arşivde kayıtlı bir
dünya değil. Arşiv film dünyalarını topluyor (Tatooine, Hoth, Exegol), hat makaleleri ise
ticaret düğümlerini sayıyor (Alsakan, Brentaal IV, Taanab, Anaxes, Lianna, Denon).

Bu boşluğu kapatmak yalnızca turları açmaz — galaksinin Çekirdek bölgesi şu an neredeyse
boş, ve o boşluk haritada görülüyor. Faz B1/B2'nin kaynak boruhattı (`fetch-lore.mjs`,
`slim-lore.mjs`) zaten hazır; iş, kavşak dünyalarını aynı dürüstlük modeliyle eklemek.

Öneri: en çok hatta dokunan 20 kavşak dünyasıyla başla. Bir dünyanın kaç hatta uğradığı
`hyperlaneNetwork()`'ten zaten çıkıyor, yani öncelik listesi hesaplanabilir, tahmin
edilmez.

### 1.2 Harita göstergesi (legend) — küçük, gecikmiş

Haritada dört ayrı görsel kod var ve hiçbiri açıklanmıyor: düğüm rengi (dönem bağlılığı),
kırık halka (yok edilmiş dünya), bölge halkaları, ve C3'ten sonra hat renkleri. Ziyaretçi
bunları ancak deneyerek öğreniyor.

Küçük, katlanabilir bir anahtar paneli — hat renkleri, düğüm renkleri, yıkım işareti —
haritanın okunabilirliğini en çok artıracak tek şey. C3 hat renklerini eklediği için artık
zorunlu sayılır.

### 1.3 Sıçrama süresi ve hiperuzay sürücü sınıfı (küçük, yüksek keyif)

`parsecsBetween` ve `planCourse` zaten mesafeyi parsek olarak veriyor. Kanon hiperuzay
sürücü sınıfları (x0.5 Millennium Falcon, x1 standart, x2 eski nakliye) bilinen çarpanlar.
Rota planlayıcıya bir sürücü sınıfı seçici koymak, hesabı olan veriden yeni bir cevap
üretir: "bu kurs Falcon'la şu kadar, standart sürücüyle şu kadar."

Uydurma yok: çarpanlar kanon, mesafe zaten ölçülü. Kaynak gösterimi mevcut modele oturur.

### 1.4 Komut paletine hat ve yer eklemek (küçük)

`CommandPalette` bugün dünyaları ve karakterleri buluyor. Arşivde 174 ilgi noktası ve 23
hat var, ikisi de aranamıyor. "Yoda'nın Kulübesi" veya "Corellia Koşusu" yazınca doğru
yere gitmek, mevcut Fuse.js indeksine iki kaynak eklemekten ibaret.

### 1.5 İlgi noktası derin bağlantısı (küçük)

Hat artık `/galaxy?lane=<id>` ile paylaşılabiliyor; yerler paylaşılamıyor.
`/planet/:id?poi=<id>` aynı deseni tamamlar ve 174 yeri paylaşılabilir kılar.

### 1.6 Zaman ekseni: hatların ve yerlerin döneme göre durumu (büyük)

C3 için aday konulardan biriydi, seçilmedi. Dürüst olmak gerekirse önce veri araştırması
ister: hangi hat ne zaman açıldı, hangi durak ne zaman elden çıktı. Kanon bunu her hat için
söylemiyor. Araştırma boruhattı kurulmadan başlanmamalı — yoksa uydurmaya dönüşür.

### 1.7 Rota planlayıcı ile hat panelini bağlamak (küçük)

Kurs zaten hangi hattı kullandığını biliyor (`Leg.routeId`) ve panelde hat adını yazıyor.
O adı, hattın kendi panelini açan bir düğmeye çevirmek iki yüzeyi birbirine bağlar. C3'ün
tamamlayıcısı, yeni kavram getirmiyor.

### 1.8 Ekran görüntüleri bayat (küçük, bakım)

`docs/screenshots/galaxy-map.jpg` hiperuzay ağından önce çekilmiş — haritada hat yok.
README bu görüntüleri kullanıyor. C1 ve C3'ten sonra yeniden çekilmeli. Ayrıca iki
görüntüde köşede `0 fps` yazıyor; ilk kare yakalandığı için sayaç henüz sıfır, ama
yayınlanan bir ekran görüntüsünde bozuk görünüyor.

---

## 2. Tasarım

Şu anki hâl kötü değil — koyu uzay, altın marka rengi, ince HUD yazısı tutarlı uygulanmış.
Aşağıdakiler "çalışmıyor" değil, "kendine ait değil" eleştirisi. Bir Star Wars atlası
yapmanın en kolay yolu siyah + `#FFE81F` sarısıdır; herkes onu yapar. Arşivi ayırt edecek
şey, kendi malzemesi: **Standart Galaktik Grid**, parsek ölçüsü, ve dört durumlu kaynak
dürüstlüğü. Tasarım bunlardan beslenmeli.

### 2.1 En büyük tek kazanç: veri için üçüncü bir yazı tipi rolü

Bugün iki rol var (`tailwind.config.js`):

- `display`: Libre Franklin
- `hud`: Barlow Condensed

İkisi de orantılı (proportional) rakam kullanıyor. Ama bu uygulamanın gövdesi sayı:
grid kareleri (`L-19`), parsek, çap, nüfus, tur ilerlemesi (`2 / 4`), bütçe okumaları.
Gezegen panelindeki sayı sütunu bu yüzden sağa yaslı ama sol kenarı tırtıklı duruyor —
ekran görüntüsünde `4.200 km` ile `≈15.000–20.000` alt alta hizalanmıyor.

Öneri: sekmeli rakamlı (`tabular-nums`) dar bir mono yüz ekle — üçüncü rol: `data`.
Nerede sayı varsa orada bu yüz kullanılsın. Tek değişiklik şunların hepsini düzeltir:
istatistik sütunu, parsek okumaları, grid kareleri, tur sayacı, rota bacak listesi.

Bu aynı zamanda anlatısal bir seçim: mono yüz *alet* demektir. Arşiv bir seyir aleti gibi
okunmalı, bir tanıtım sayfası gibi değil. Barlow Condensed her sci-fi arayüzünün varsayılanı;
mono veri yüzü ise bu projeye ait bir karar.

### 2.2 Landing: isim değil, ölçek göster

Şu an açılış ekranı ortada duran bir kelime işareti, bir alt başlık, iki düğme. Adın
dışında hiçbir kanıt yok. Arşivin en iyi kahraman malzemesi kendi ölçeği:

```
88 cisim · 174 yer · 33 figür · 23 hiperuzay hattı · 308 durak
```

Bu sayılar zaten veriden hesaplanabiliyor (`loadAllPlanets`, `routes`, `laneLengthParsecs`).
Uydurma bir "10.000+ kayıt" değil, ölçülü bir gerçek — ki projenin bütün duruşu bu.

Arka plandaki soluk kare deseni şu an dekor. Onu **gerçek Standart Galaktik Grid**'e
çevirmek imzalık hamle olur: A–V × 1–21 kareleri, kenarda gerçek etiketler, ve öne çıkan
altı dünya kendi gerçek karelerinde otursun. Böylece açılış ekranı haritanın kendi
koordinat sistemiyle aynı şeyi konuşur, ve ziyaretçi haritaya girmeden önce onun dilini
öğrenmiş olur.

İki eşit ağırlıkta düğme (altın çerçeve / mavi çerçeve) birbiriyle yarışıyor. Biri dolu
birincil, diğeri sade metin bağlantısı olmalı. "Galaksiyi keşfet" birincil; "Holocron'u aç"
ikincil.

### 2.3 Holocron: en zayıf yüzey

114 kartın küçük resmi, gezegenin render paletinden üretilmiş bulanık radyal degrade.
Sonuç ekran görüntüsünde açıkça görülüyor: kartlar birbirinden ayırt edilemiyor, ızgara
bulanık lekeler alanına dönüşüyor. Alderaan ile Chandrila aynı yeşil-gri leke.

İki yol var:

1. **Gerçek küçük resim.** Build adımında her dünyanın küresini ekran dışı render edip
   96×96 webp olarak yaz. Motor zaten var (`planet-engine.ts`), doku boruhattı zaten var
   (`process-textures.mjs`). Maliyet: build süresi ve ~114 küçük dosya. Kazanç: ızgara bir
   anda okunur hâle gelir.
2. **Degradeyi bırak, veri işareti koy.** Küçük resim yerine kartın üstünde grid karesi,
   bölge halkası ve arketip simgesi. Daha ucuz, ve arşivin "alet" diline daha yakın.

Hangisi seçilirse seçilsin, mevcut bulanık degrade kalmamalı — hiçbir bilgi taşımıyor.

Filtreler tarayıcının varsayılan `<select>`'i; sayfanın geri kalanıyla aynı dili
konuşmuyor. Rota planlayıcıdaki `select`'ler için de aynısı geçerli.

### 2.4 Gezegen paneli: üç tür gerçeği ayır

Panel şu an tek bir uzun tanım listesi. Ama içindeki gerçekler üç farklı türden:

- **Konum** — bölge, sektör, sistem, grid
- **Ölçü** — çap, nüfus, yönetim
- **Karakter** — iklim, arazi, güneşler, aylar

Aralarına ince ayırıcı koymak ve ölçü bloğunu mono rakamla dizmek paneli taranabilir yapar.
Şu an göz her satırda aynı ağırlıkla duruyor.

Ayrıca dört durumlu kaynak modeli (sourced / authored / unstated / gap) panelin en özgün
fikri ama görsel olarak neredeyse görünmez. Her satırın sonunda küçük, tutarlı bir işaret —
kaynaklıysa nokta, arşivin kendi yazdığıysa boş halka, kanon söylemiyorsa çizgi — bu fikri
sayfanın karakterine dönüştürür.

### 2.5 Renk: dört aksandan üçe in

Token'lar: `star-gold #FFE81F`, `holo-cyan #66D9FF`, `sith-red #E0312E`,
`rebel-orange #E8632C`.

`sith-red` ile `rebel-orange` koyu zeminde ve küçük boyutta birbirine yakın düşüyor, ve
ikisinin de anlamı sabit değil. Öneri: rolleri kilitle —

- **altın** = kanon / birincil eylem / tur
- **camgöbeği** = etkileşim, bağlantı, seçim
- **kırmızı** = yıkım ve uyarı, başka hiçbir şey

`rebel-orange` yalnızca fraksiyon rozetlerinde kalsın, arayüz durumu anlatmasın.

### 2.6 Hareket: bir orkestrasyon, dağınık efekt değil

Açılış dizisi (crawl → tarama → kelime işareti → düğmeler) doğru fikir: tek koreografi.
Aynı disiplin harita tarafında yok — düğüm dönüşü, disk dönüşü, kuyruklu yıldız, geçiş
perdesi ayrı ayrı yaşıyor.

C3 buna doğal bir yer açtı: **hat turu bir uçuş gibi görünmeli.** Şu an tur, gezegen
sayfalarını sırayla açıyor. Duraklar arası geçişte kısa bir "hat boyunca kayma" anı —
kamera bir sonraki durağa hat üzerinden giderken — turu slayt gösterisinden yolculuğa
çevirir. Zaten `flyToNode` ve rota noktaları var; eksik olan aradaki eğri.

### 2.7 Erişilebilirlik: iyi durumda, iki eksik

Klavye yolları düşünülmüş (gezegen `nav`'ı, C3'te hat `nav`'ı), `aria-label`'lar yerinde,
`reducedMotion` gerçek bir dal. İki eksik:

- Sayfanın en başında "içeriğe atla" bağlantısı yok; `sr-only` listeler uzun.
- Odak halkası yalnızca `sr-only` düğmelerde tanımlı. Panel içindeki düğmelerin çoğu
  tarayıcı varsayılanına bırakılmış, ki koyu zeminde zayıf kalıyor. Tek bir
  `focus-visible` kuralı bütün arayüzde tutarlı hale getirir.

---

## 3. Önerilen sıra

1. **Harita göstergesi** (küçük) — C3'ün açtığı borç, hemen kapanır.
2. **Veri yazı tipi rolü + odak halkası** (küçük) — tek dokunuşta bütün yüzeyler kazanır.
3. **Landing ölçek satırı + gerçek grid arka planı** (orta) — ilk izlenim en çok bundan kazanır.
4. **Holocron küçük resimleri** (orta) — en zayıf yüzeyi düzeltir.
5. **Hat veri borcu** (büyük) — asıl derinlik burada; 20 kavşak dünyası.
6. **Sıçrama süresi, palet indeksi, POI derin bağlantısı** (küçük, istenildiği zaman).
7. **Zaman ekseni** (büyük) — ancak veri araştırması önden yapılırsa.
