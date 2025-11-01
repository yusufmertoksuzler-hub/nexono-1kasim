# Nexono Finans - AI Destekli Finansal Platform

Modern ve akıllı finansal analiz platformu. OpenRouter AI (Qwen 2.5 VL) entegrasyonu ile kullanıcılara profesyonel finansal tavsiyeler ve gelecek tahminleri sunar.

## 🚀 Özellikler

- **AI Finansal Danışman**: OpenRouter AI (Qwen 2.5 VL) ile entegre akıllı finansal analiz
- **Portföy Analizi**: Kullanıcı portföyünün detaylı analizi ve gelecek tahminleri
- **Gerçek Zamanlı Veriler**: BIST hisseleri ve kripto para fiyatları
- **Teknik Analiz**: Grafik ve trend analizleri
- **Mobil Uyumlu**: Responsive tasarım ve PWA desteği
- **Firebase Entegrasyonu**: Güvenli kullanıcı yönetimi ve veri saklama

## 🤖 AI Entegrasyonu

Bu platform Nexono AI ile entegre olarak:

- **Portföy Analizi**: Kullanıcının tüm varlıklarını analiz eder
- **Gelecek Tahminleri**: Yüksek doğruluk payında fiyat tahminleri
- **Finansal Tavsiyeler**: Profesyonel yatırım önerileri
- **Risk Analizi**: Portföy risk dağılımı değerlendirmesi
- **Teknik Analiz**: Grafik ve trend analizleri

Nexono AI kullanıcıya "efendim" diye hitap eder ve Türkçe profesyonel finansal terminoloji kullanır.

## 🛠️ Kurulum

### Gereksinimler

- Node.js 18+
- npm veya yarn
- OpenRouter API Key
- Firebase projesi

### Adımlar

```bash
# 1. Projeyi klonlayın
git clone <YOUR_GIT_URL>
cd nexono-finans

# 2. Bağımlılıkları yükleyin
npm install

# 3. Environment variables ayarlayın
cp .env.example .env
# .env dosyasını düzenleyerek API anahtarlarınızı ekleyin

# 4. Development server'ı başlatın
npm run dev

# 5. Veri sunucusunu başlatın (ayrı terminal)
npm run server
```

### Environment Variables

`.env` dosyasında aşağıdaki değişkenleri ayarlayın:

```env
# OpenRouter AI API Key
VITE_OPENROUTER_API_KEY=your_openrouter_api_key_here

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## 📱 Kullanım

### Nexono AI

1. **Dashboard'da**: Header'daki "NEXONO AI" butonuna tıklayın
2. **Sohbet**: AI ile finansal konularda sohbet edin, analiz isteyin
3. **Portföy Analizi**: AI otomatik olarak portföyünüzü görür ve analiz eder

### Portföy Yönetimi

- Varlık ekleme/çıkarma
- Gerçek zamanlı kar/zarar takibi
- AI destekli portföy analizi

### Piyasa Analizi

- BIST hisse senetleri
- Kripto para birimleri
- Gerçek zamanlı fiyat takibi
- Teknik analiz grafikleri

## 🏗️ Teknolojiler

- **Frontend**: React 18, TypeScript, Vite
- **UI**: shadcn/ui, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express
- **AI**: Nexono AI (OpenRouter - Qwen 2.5 VL 32B)
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Charts**: Recharts
- **Real-time Data**: Yahoo Finance API, CoinGecko API

## 📊 API Entegrasyonları

- **Yahoo Finance**: BIST hisse senedi verileri
- **CoinGecko**: Kripto para verileri
- **Nexono AI**: AI finansal analiz
- **Firebase**: Kullanıcı yönetimi ve veri saklama

## 🚀 Deployment

### Vercel (Önerilen)

```bash
# Vercel CLI ile
npm i -g vercel
vercel

# Veya GitHub ile otomatik deployment
```

### Diğer Platformlar

- Netlify
- Railway
- Heroku
- AWS Amplify

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📞 İletişim

- **Proje URL**: https://lovable.dev/projects/bb45fe55-9940-4055-a46f-2de2effdefa7
- **Issues**: GitHub Issues kullanın

---

**Not**: Bu platform eğitim amaçlıdır. Gerçek yatırım kararları almadan önce profesyonel finansal danışmanlık alın.
"# nexono-1kasim" 
"# nexono-1kasim" 
"# nexono-1kasim" 
