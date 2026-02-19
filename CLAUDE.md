# ERASMUS — Proje Kuralları

## JARVIS DNA
Bu proje JARVIS DNA ile çalışır. Her session'da:
1. `~/jarvis-dna/JARVIS_CORE.md` → DNA yükle (75 feature, 15 kategori, 9 SEP)
2. Proje CLAUDE.md (bu dosya) → proje kuralları
3. Global MEMORY.md → bağlam

## Tek Beden Protokolü: AKTİF
- Gereksiz onay sorma, geri alınabilir işleri direkt yap
- Türkçe konuş, teknik terimleri açıkla
- Her işte NEDEN'i söyle
- Scope creep'i engelle

## Proje Bilgileri
- **Ad:** Erasmus
- **Başlangıç:** 2026-02-19
- **Durum:** Kurulum tamamlandı, kapsam belirleniyor
- **Repo:** Local — ~/erasmus
- **Maestro:** Melih
- **Motor:** JARVIS (Claude Code, Opus 4.6)

## Dizin Yapısı
```
erasmus/
├── CLAUDE.md              ← Bu dosya
├── memory/
│   ├── knowledge/         ← Öğrenilen pattern'lar
│   └── failures/          ← Başarısızlık logları
└── src/                   ← Proje kaynak kodu (yapılacak)
```

## Aktif Kurallar
- JARVIS_CORE.md'deki tüm feature'lar composable ve aktif
- 10 Persona QA Panel büyük output'larda çalışır
- Git checkpoint her anlamlı iş bitişinde
- Memory güncellemesi her session sonunda
