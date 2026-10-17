# CLAUDE.md — eeuek (MIOE-LIMITED)

Bu depoda çalışan Claude oturumları için kalıcı kurallar. Dil: tüm görünen metin Türkçe.

## 📍 Nerede kaldık — her oturumda zorunlu (karar 17.10.2026, Eşref Bey)

Kullanıcı aynı anda birçok yerel ve bulut oturumu izliyor. **Her iş yanıtının en sonuna** şu bloğu yaz (en çok 4 kısa satır, Türkçe):

```
📍 Nerede kaldık
- Yapıldı: bu turda yapılan (1 satır)
- Kalan: bu işte kalan (1 satır; yoksa "yok")
- Sizden: kullanıcının çalıştıracağı komut / vereceği onay (yoksa "yok")
- Oturum: oturum adı · dal
```

- Komut verirken depo klasörüne girmeyi unutma: önce `cd <tam yol>` ayrı blokta, sonra komut (PowerShell 5.1, `&&` yok).
- Depoda `durum/` panosu varsa aynı bilgi `durum/<dal-adı>.md` dosyasına da yazılır ve işle aynı commit'te push edilir.
- Yerel oturumlarda aynı kural `C:\Users\pc\.claude\CLAUDE.md`'de de var; bu bölüm bulut oturumları içindir (onlar o dosyayı görmez).
