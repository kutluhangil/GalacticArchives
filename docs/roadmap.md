# Roadmap — Galactic Archives

**Güncelleme:** 2026-10-24

Yalnız **açık** işler. Biten madde silinir; ne zaman, nasıl bittiği `CHANGELOG.md`'de.
Senin yapacakların `senden-gerekenler.md` içinde.

## Kod tarafı — bende, sırayla

Her biri 2026-10-24'te kodda hâlâ duruyor olarak doğrulandı.

- [ ] **Ölü saat hook'u:** `app/src/hooks/useSimClock.ts` hiçbir yerden import edilmiyor; asıl
  saat `lib/sim-clock.ts`. Silinecek.
- [ ] **`components.json` yanlış yol:** Tailwind config olarak `postcss.config.js` gösteriyor;
  yeni shadcn bileşeni ekleme akışını bozar.
- [ ] **Tauri paket kimliği yer tutucu:** `app/src-tauri/Cargo.toml` → `description = "A Tauri App"`,
  `authors = ["you"]`, `license = ""`. `.dmg` imzalamadan önce düzeltilmeli.
- [ ] **Harita göstergesi (legend):** düğüm rengi (dönem bağlılığı), yok edilmiş dünya (⌀),
  Legends ve hiperuzay çizgileri, yeni ⚔ savaş işareti hiçbir yerde açıklanmıyor.
- [ ] **POI derin bağlantısı:** `/planet/<id>?poi=<poi-id>` ile bir ilgi noktası açık gelmiyor;
  paylaşılabilir değil.
- [ ] **Landing ölçek satırı:** açılış sayfası arşivin büyüklüğünü (88 gök cismi, 23 hat,
  15 savaş…) göstermiyor.
- [ ] **Veri yazı tipi rolü:** sayılar için tabular rakamlı ayrı bir `--font-data` yok; paneller
  ve tablolarda rakamlar hizalanmıyor.

## Senin kararına bağlı

- [ ] **Yeni megayapı:** renderer hazır (`buildStationBody`, `ringworld`); hangi yapı olduğu ve
  görselleri gelince kaydı + testi yazarım. → `senden-gerekenler.md` bölüm 6.
- [ ] **Üçüncü dil:** gelirse `i18next`'e geçiş yeniden değerlendirilir.
- [ ] **İmzalı `.dmg`:** Apple Developer secret'ları gelince imzalama + notarization adımlarını
  workflow'a eklerim. → `senden-gerekenler.md` bölüm 5.

## Büyük, araştırma isteyen

- [ ] **Hat ve yerler için zaman ekseni:** hiperuzay hatlarının ve dünyaların döneme göre
  durumu (açık/kapalı, kim tutuyor). Önce kaynaklı veri araştırması gerekiyor; veri yoksa
  yapılmaz.
- [ ] **Kalan iki hat durağı:** `salin-corridor` (Salin) ve `lipsec-run` (Wretch of Tayron)
  kanonda grid hücresi olmadığı için çizilmiyor. Kanon bir hücre verirse eklenir.
