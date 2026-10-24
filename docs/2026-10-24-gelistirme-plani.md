# Geliştirme planı — 2026-10-24

**Durum (2026-10-24): Faz 0–4 tamam, commit edilmedi.** `npm run verify` temiz: lore/asset 0 hata,
364 birim testi, 41 e2e, bütçe 0 hata, `npm audit` 0. Ek bulgu: TopBar araç panelleri fareyle hiç
çalışmıyordu (pointer-events), düzeltildi. Faz 4'te zaman çizelgesi 16'ya çıktı (Jedha olayı
kaynak adı netleşmediği için eklenmedi).

Kaynak: 2026-10-24 perf/güvenlik taraması ve öneri listesi. Her faz sonunda
`tsc -b && npm run lint && npm test && npm run build && npm run budget` yeşil kalmalı.

## Faz 0 — Tarama düzeltmeleri (bitti)
- `npm audit` 9 → 0 (vite, zod, undici, vitest 5.0.5).
- `CockpitHUDModal`: 60 fps setState döngüsü → 10 Hz, lint hatası, timer sızıntısı.
- `.github/workflows/security.yml`: action commit SHA'ya sabitlendi.

## Faz 1 — Kalan timer sızıntıları
Unmount sonrası state'e yazan `setTimeout`'lar: `HyperspaceSimulator`, `DroidModal`,
`HolocronQuiz`, `AurebeshTranslator`, `GalacticIdGenerator`, `EasterEggs` (Porg).

## Faz 2 — Gezegen grafikleri (yalnız shader + motor; asset/bağımlılık yok)
1. **Güneşe duyarlı atmosfer** — gündüz kenarı parlak, gece karanlık, terminatörde
   gün batımı bandı, güneş arkadayken ileri saçılım halesi. Lav dünyalarında gece
   tarafı kor ışıması.
2. **Bulut gölgeleri** — bulutlu her dünyada, güneş yönüne kaydırılmış. (Eski verdant
   gölgesi albedo dokusu yüklenince kayboluyordu.)
3. **Gece dokusu hatası** — 7 dünya (Cato Neimoidia, Chandrila, Corellia, Ferrix, Kijimi,
   Nal Hutta, Nar Shaddaa) gece dokusunu indiriyor ama shader yalnız ekümenopolis
   dalında gösteriyordu. Tüm arketiplere açılır.
4. **Prosedürel şehir ışıkları** — gece dokusu olmayan kalabalık dünyalar
   (`effects: ["city-lights"]`).
5. **Dokudan kabartma** — albedo yüklüyken kabartma prosedürel gürültü yerine dokunun
   parlaklık gradyanından; tanjantlar dünya uzayına taşınır (eski hali dönen gezegende
   ışığı yanlış eğiyordu).
6. **Halka gölgeleri** — gezegenin halkaya, halkanın gezegene düşen gölgesi.
7. **Ay tutulmaları** — ayların yüzeye düşen gölgesi.
8. **Lens parlaması** — güneş sprite'larından ekran-uzayı flare; gezegen arkasında söner.
9. **Buz pırıltısı** — buz dünyalarında güneş yönünde kar kristali parıltısı.

## Faz 3 — Star Wars özellikleri
1. **HoloNet bandı** — seçili döneme göre zaman çizelgesi + savaş kayıtlarından manşet
   (yeni lore yok, mevcut kaynaklı kayıtlar).
2. **Sabacc (Corellian Spike)** — droid krupiyeye karşı; mantık saf fonksiyon + test.
3. **Lonca ödül panosu** — kanon ödüller, Wookieepedia kaynaklı, gezegenlere bağlı.
4. **Savaşlar haritada** — galaksi haritasında döneme duyarlı savaş katmanı.
5. **Jedi/Sith yolu** — Holocron testi sonucu → yol + tur önerisi.
6. **Ortam sesleri** — gezegen arketipine göre sentezlenmiş ortam sesi (asset yok).

## Faz 4 — Veri genişletme
- Zaman çizelgesi 8 → 16+, savaşlar 8 → 15 (Wookieepedia kaynaklı, `fetch-codex` ile
  doğrulanır). Görseli olmayan savaşlar için zarif yedek; görsel promptları
  `docs/gorsel-uretim-promptlari.md`'ye eklenir.

## Kapsam dışı
- Gemi/tür/droid görselleri üretimi (Kutluhan'ın görsel iş akışı).
- Film müziği (telif).
