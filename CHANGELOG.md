## [Yayınlandı] - 2024-12-21 - v.1.0.21  
### Değişiklikler  
- **Test Modülü Geçişi**:  
  - Proje test modülü Jest'ten **Vitest**'e geçirildi.  
  - Jest bağımlılıkları kaldırıldı, Vitest eklendi.  
  - Test dosyaları Vitest ile uyumlu hale getirildi.  
  - Jest ile yazılmış testler Vitest ile uyumlu olarak güncellendi.  
  - Test ortamı, Vitest özellikleriyle optimize edildi.  
  - Jest'e özgü test fonksiyonları ve özellikleri, Vitest karşılıkları ile değiştirildi.

### Kaldırılanlar  
- Jest bağımlılıkları ve Jest yapılandırmaları projeden kaldırıldı.  

---

## [Yayınlandı] - 2024-12-21 - v.1.0.22  
### Düzeltmeler  
- **Tarayıcıda Boş Seçim Dosya Sıfırlama Sorunu**:  
  - Dosya seçimi ekranı kapatıldığında, seçim yapılmadan dosyanın sıfırlanması sorunu düzeltildi.

---

## [Yayınlandı] - 2024-12-24 - v.1.0.24  
### Düzeltmeler  
- Gereksiz event tetiklemeleri düzeltilerek optimizasyon yapıldı.  
- Kod okunabilirliği artırıldı.  

### Kaldırılanlar  
- Üst üste dosya yükleme işlemi iptal edildi.  
- Jest kütüphanesi ve Jest testleri kaldırıldı.  
- `onDrop`, `onDropAccepted`, `onDropRejected` fonksiyonları kaldırıldı.  

### Eklendiler  
- **Cypress** kütüphanesi ve Cypress testleri projeye dahil edildi.  
- `onUpload`, `onUploadAccepted`, `onUploadRejected` fonksiyonları eklendi.

---

## [Yayınlandı] - 2024-12-25 - v.1.0.26
### Düzeltmeler
- Drag&Drop kullanılarak bırakılan dosyalarda kabul edilmeyen olmasına rağmen input'a eklenme hatası giderildi

### Eklendiler
- `getFakePath`, `fileMimeSelector` ve `createDataTransfer` yardımcı fonksiyonları eklendi
- `validator`, `defaultValidationMessages` ve `formattedValidationMessages` yardımcı fonksyonları test kolaylığı açısından export edildi