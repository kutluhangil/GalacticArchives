# SENDEN GEREKENLER — Galactic Archives

**Canlı:** https://galactic-archives.vercel.app · **Branch:** `main`

Sadece **senin yapman gereken** iki iş kaldı. Gerisi bende.

---

## 1. Gezegen dokuları (Gemini görselleri)

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
Script dikiş testi yapar, 4K/2K/1K kalite katmanlarını üretir, manifest yazar.

**Sıra:** önce 5 kahraman gezegen — **Tatooine, Coruscant (+night), Mustafar (+emissive), Hoth, Bespin**. Motorda görüp stil kilidini onaylayalım, kalanları seri üretiriz. Her gezegenin birebir prompt'u `design.md §1`'de hazır.

> Şu an Gemini API görsel limiti aşımında — limit açılınca üretime başlarız.

---

## 2. .dmg imzalama (Apple Developer)

`Galactic Archives_1.1.0_aarch64.dmg` hazır ama **imzasız**: karşı taraf ilk açılışta sağ tık → Aç yapmak zorunda.

Developer hesabın olduğunu söyledin. Her şey bitince haber ver — Developer ID sertifikasıyla notarization'ı kurarım, imzalı `.dmg` çıkar.

---

## Hızlı komut kartı

```bash
cd /Volumes/ProjectVault/GalacticArchives/app

npm run dev          # geliştirme sunucusu
npm run build        # üretim derlemesi + statik meta sayfaları
npm run lint         # eslint
npm run textures     # raw/planets/*.png -> public/textures/planets
npm run desktop      # tauri build -> .dmg

vercel deploy --prod --yes
```
