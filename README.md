# Ev Bütçe — Ev Ön Muhasebe ve Bütçe Yönetimi

Expo (React Native) ile geliştirilmiş, **iOS / Android / Web** üzerinde çalışan modern bir ev bütçesi uygulaması. TypeScript, React Navigation, react-native-paper (Material 3), SVG tabanlı Pie Chart ve kalıcı yerel depolama içerir.

## Özellikler

- **Dashboard** — Ayın gelir, gider ve net bakiye özeti; en çok harcama yapılan kategoriler; son işlemler.
- **İşlemler** — Tüm işlemleri listeler; tür (gelir/gider), ay ve arama filtreleriyle hızlı süzme; hızlı silme.
- **Ekle / Düzenle** — Tarih seçici, tutar, açıklama, kategori ve gelir/gider türü alanlı form; düzenleme + silme desteği.
- **Raporlar** — Kategoriye göre dağılımı gösteren **Pie Chart** (özel `react-native-svg` uygulaması — web ve native'de aynı çalışır) + kategori tablosu + ay seçici.
- **Ayarlar** — Kategori yönetimi (CRUD + renk + ikon), açık/koyu tema, veri sıfırlama.
- **Responsive** — Dar cihazlarda tek kolon, geniş ekranda (>= 900px) yan yana kart düzeni; 1200px'te ortalanmış web layout.

## Teknoloji

| Katman | Seçim |
|---|---|
| Framework | Expo SDK 54, React Native 0.81, React 19 |
| Dil | TypeScript (strict) |
| Navigasyon | `@react-navigation/native` + bottom tabs + native stack |
| UI | `react-native-paper` (Material 3) + `react-native-vector-icons/MaterialCommunityIcons` |
| Grafik | Özel SVG Pie Chart (`react-native-svg`) |
| Tarih Seçici | `@react-native-community/datetimepicker` (native) + yerel `<input type="date">` (web) |
| Veritabanı | **Native:** `expo-sqlite` · **Web:** `AsyncStorage` (API mock) |
| Depolama katmanı | Platform-agnostic `Repository` arayüzü (`src/db/types.ts`) |

## Hızlı Başlangıç

```bash
npm install
npm run web      # Web'de çalıştır (http://localhost:8081)
npm run android  # Android emulator / cihaz
npm run ios      # iOS simulator (macOS)
```

İlk açılışta varsayılan kategoriler (Mutfak, Kira, Faturalar, Eğlence, Ulaşım, Sağlık, Maaş, Ek Gelir) seed edilir.

## Aile Grubu (çoklu kullanıcı, Firestore)

Kullanıcılar "Aile Grubu" oluşturup davet kodu ile eşleri/aile üyelerini davet edebilir. Grup aktifken tüm kategori / işlem / alışveriş / not / varlık verileri Firestore üzerinden **grubun tüm üyeleriyle paylaşılır**; yerel moda döndüğünde kullanıcının kendi cihazındaki veri geri gelir. Özellik Firebase yapılandırması (`.env`) varsa otomatik aktif olur.

Güvenlik kuralları (`firestore.rules`) aşağıdaki prensiplere göre yazılmıştır:
- Kullanıcı yalnızca kendi `users/{uid}` dokümanını okuyup yazabilir.
- `groups/{id}` dokümanını yalnızca üyeler listeleyebilir; tekil `get` herkese açık (davet akışı için gerekli).
- Üyelik ekleme sadece "kendini ekleme" olarak izinli; silme sadece "kendini silme" olarak izinli; sahip grubu silebilir.
- `groups/{id}/{subcol}/{doc}` (categories, transactions, shoppingItems, notes, assets) sadece üyeler tarafından okunup yazılabilir.

Firestore kurallarını deploy etmek için (bir kez):

```bash
npx firebase-tools login          # Google hesabı ile
npx firebase-tools use evmuhasebeapp
npx firebase-tools deploy --only firestore:rules
```

## Proje Yapısı

```
ev-butce/
├── App.tsx                    # Kök bileşen, provider zinciri
├── src/
│   ├── components/            # PieChart, SummaryCard, TransactionItem, DatePickerField
│   ├── context/               # DataContext (repo), ThemeContext (açık/koyu)
│   ├── db/                    # types, seed, sqlite (native), webStorage (web), index (platform switch)
│   ├── navigation/            # Bottom tabs + modal stack
│   ├── screens/               # Dashboard, Transactions, AddTransaction, Reports, Settings
│   ├── theme/                 # MD3 tema (açık/koyu) + marka renkleri
│   └── utils/                 # format (tutar, tarih, ay, parse)
```

## Veri Modeli

```ts
Category { id, name, color, icon, type: 'expense' | 'income' }
Transaction { id, amount, description, date (ISO), categoryId, type }
```

Her iki platform da **aynı `Repository` arayüzünü** implement eder (`src/db/types.ts`). `src/db/index.ts` `Platform.OS`'e göre doğru implementasyonu export eder, böylece uygulamanın geri kalanı tek bir API ile çalışır.

## Responsive Kurallar

- `useWindowDimensions` ile `>= 900 px` genişlikte dashboard iki kolonlu, `>= 800 px` genişlikte raporlar Pie + Legend yan yana.
- Tüm ekranların `maxWidth` değeri 1200 px ile sınırlandırılıp `alignSelf: center` ile ortalanır — web'de ferah bir düzen sağlar.

## Geliştirme Notları

- `npx tsc --noEmit` ile tip kontrolü temiz çalışır.
- Web'de MaterialCommunityIcons font dosyası runtime'da inject edilir (`App.tsx`).
- Veriler `Platform.OS === 'web'` iken tarayıcının `localStorage`'ında, native'de SQLite dosyasında tutulur. İki platform arasında veri senkronu **yoktur** (yerel-önce / offline-first tasarım).
