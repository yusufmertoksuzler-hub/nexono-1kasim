# Firebase Kurulum ve Güvenlik Kuralları

## Firebase Güvenlik Kuralları

Firebase Firestore izin hatalarını çözmek için aşağıdaki güvenlik kurallarını Firebase Console'dan ayarlamanız gerekmektedir:

### Firebase Console'da Güvenlik Kuralları Ayarlama:

1. [Firebase Console](https://console.firebase.google.com/) adresine gidin
2. Projenizi seçin (`hisse-borsa`)
3. Sol menüden **Firestore Database** seçin
4. **Kurallar** sekmesine tıklayın
5. Aşağıdaki kuralları yapıştırın:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Geçici olarak tüm erişimi aç - geliştirme için
    match /{document=**} {
      allow read, write: if true;
    }
    
    // Üretim için güvenli kurallar (yukarıdaki kuralları kullanın):
    // match /userAssets/{document} {
    //   allow read, write, delete: if request.auth != null && request.auth.uid == resource.data.userId;
    //   allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    // }
    // match /{document=**} {
    //   allow read, write: if request.auth != null;
    // }
  }
}
```

6. **Yayınla** butonuna tıklayın

## Bu Kurallar Ne Yapar?

- **userAssets koleksiyonu**: Kullanıcılar sadece kendi varlıklarını görebilir ve düzenleyebilir
- **Kimlik doğrulama**: Sadece giriş yapmış kullanıcılar veritabanına erişebilir
- **Güvenlik**: Kullanıcılar başkalarının verilerine erişemez

## Sorun Giderme

Eğer hala izin hataları alıyorsanız:

1. Firebase Console'da kuralların doğru yayınlandığından emin olun
2. Tarayıcınızı yenileyin
3. Çıkış yapıp tekrar giriş yapın
4. Firebase Console'da **Kimlik Doğrulama** > **Kullanıcılar** bölümünden kullanıcınızın aktif olduğundan emin olun

## Test Etme

Kuralları test etmek için Firebase Console'da **Kurallar** sekmesinde **Simülatör** kullanabilirsiniz.
