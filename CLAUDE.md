# Erasmus YDYS Sınav Hazırlık Platformu

## Proje Bilgisi
- **Ad:** Erasmus Sınav Hazırlık
- **Başlangıç:** 2026-02-19
- **Tech:** Vanilla HTML/CSS/JS — kurulum yok, `index.html` aç ve çalış
- **Veri:** localStorage ile ilerleme, skorlar, hatalı sorular
- **Format:** ADÜ Erasmus YDYS — 50 soru, 5 şık (A-E), 90 dakika, 100 puan

## Kurallar
- Tüm açıklamalar Türkçe (A1-A2 seviye kullanıcı)
- 5 şıklı (A-E) format — her yerde
- Her sorunun 5 parçalı hata kartı: cevap + doğru + neden + kural + ipucu
- Sağlık bilimleri örnekleri öncelikli
- Adaptif zorluk: A2 → B1 → B2
- Responsive: telefon + tablet + laptop

## Dosya Yapısı
- `index.html` → Ana dashboard
- `pages/` → Alt sayfalar
- `js/` → Motorlar (app, storage, quiz-engine, adaptive-engine, teach-engine, error-journal, daily-report, timer)
- `data/` → Soru ve öğretim verileri (JSON)
- `css/` → Stiller
