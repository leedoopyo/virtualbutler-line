// src/language.js
import { MAP_LINK, MAP_INTRO } from './curation.js';

export function normalizeLanguageChoice(text = '') {
  const t = text.trim().toLowerCase();
  if (['1', 'english', 'en'].includes(t)) return 'en';
  if (['2', 'bahasa', 'indonesia', 'indonesian', 'id'].includes(t)) return 'id';
  return null;
}

export function languageSelectionMessage() {
  return [
    '🇰🇷 VirtualButler Korea',
    'Welcome! / Selamat datang!',
    '',
    'Choose your language:',
    '1️⃣ English',
    '2️⃣ Bahasa Indonesia',
  ].join('\n');
}

export function getMapWelcomeMessage(lang = 'en') {
  return [
    MAP_INTRO[lang] || MAP_INTRO.en,
    MAP_LINK,
  ].join('\n');
}

// ✅ 새로 추가: 최초 방문자용 How to use 메시지
export function getHowToUseMessage(lang = 'en') {
  const messages = {
    en: `💡 HOW TO USE VBK
━━━━━━━━━━━━━━━

Most travel bots just give information.
We actually DO things for you. 🤝

Here's what a real VBK experience looks like:

🎡 Theme Park Day
"Tomorrow I'm going to Lotte World with 3 friends. Hotel is in Myeongdong."

✅ VBK books your Lotte World tickets
✅ Reserves school uniform rental inside
✅ Our staff picks up halal food for you
✅ Drops you back at your hotel after

🏯 Cultural Tour Day
"I want a guided tour of Gyeongbokgung Palace with a history expert."

✅ VBK arranges a certified history guide
✅ Full 1-day palace tour in your language
✅ Halal lunch arranged along the way

🎬 K-Drama Filming Spots
"I want to visit the locations from my favourite K-drama."

✅ VBK takes you to the exact filming spots
✅ Recreate iconic scenes with photo help
✅ Private or group tour available

🛍️ Shopping & Halal Day
"I want to shop in Myeongdong but don't know where halal food is."

✅ VBK maps your shopping route
✅ Finds halal restaurants on the way
✅ Helps with tax refund on the spot

✈️ Just Arrived
"I just landed at Incheon. I need a SIM card and don't know how to get to my hotel."

✅ VBK guides you step by step
✅ Recommends best transport option
✅ Available 24/7 via this chat

━━━━━━━━━━━━━━━
📋 All custom requests?
We send you a quote within 1 HOUR. ⚡

💬 Just tell us your plan —
even if it's rough!
We'll figure it out together 😊

Type 0️⃣ anytime to talk to a real human.
━━━━━━━━━━━━━━━`,

    id: `💡 CARA PAKAI VBK
━━━━━━━━━━━━━━━

Kebanyakan bot wisata cuma kasih info.
Kami benar-benar LAKUKAN sesuatu untukmu. 🤝

Ini contoh pengalaman nyata dengan VBK:

🎡 Hari Taman Hiburan
"Besok saya mau ke Lotte World
bareng 3 teman. Hotel di Myeongdong."

✅ VBK pesan tiket Lotte World kamu
✅ Booking sewa seragam sekolah di dalam
✅ Staff kami ambilkan makanan halal
✅ Antar kamu balik ke hotel setelah selesai

🏯 Tur Budaya Sehari
"Saya mau tur Istana Gyeongbokgung
dengan pemandu ahli sejarah."

✅ VBK siapkan pemandu sejarah bersertifikat
✅ Tur istana seharian dalam bahasa kamu
✅ Makan siang halal sudah diatur

🎬 Lokasi Syuting K-Drama
"Saya mau ke lokasi syuting drakor favorit saya."

✅ VBK antar ke lokasi syuting yang tepat
✅ Bantu foto ulang adegan ikonik
✅ Tersedia tur pribadi atau grup

🛍️ Hari Belanja & Halal
"Mau belanja di Myeongdong tapi
tidak tahu di mana makanan halal."

✅ VBK petakan rute belanja kamu
✅ Carikan restoran halal di sepanjang jalan
✅ Bantu proses tax refund di tempat

✈️ Baru Tiba
"Baru landing di Incheon. Butuh SIM card
dan tidak tahu cara ke hotel."

✅ VBK panduan kamu step by step
✅ Rekomendasi transportasi terbaik
✅ Tersedia 24/7 lewat chat ini

━━━━━━━━━━━━━━━
📋 Semua permintaan khusus?
Kami kirim penawaran dalam 1 JAM. ⚡

💬 Ceritakan rencanamu —
meski masih kasar!
Kita atur bareng 😊

Ketik 0️⃣ kapan saja untuk bicara
langsung dengan manusia sungguhan.
━━━━━━━━━━━━━━━`,
  };
  return messages[lang] || messages.en;
}

export function getMainMenuMessage(lang = 'en') {
  const menus = {
    en: `━━━━━━━━━━━━━━━
🇰🇷 VirtualButler Korea
I'm not just a bot.
Behind me is a REAL human.
I can actually DO things for you
— not just give information! 🤝
What do you need?
🗺️ MAP & GUIDE
1️⃣ Open our halal & tourist map
🕌 PRAYER
2️⃣ Nearest prayer room / mosque
3️⃣ Prayer times today
🍽️ FOOD
4️⃣ Halal food near me
5️⃣ Special restaurant picks this week
✈️ ARRIVAL
6️⃣ From airport (SIM, transport, money)
7️⃣ T-money & getting around Seoul
🏨 STAY
8️⃣ Muslim-friendly hotels & deals
🛍️ SHOPPING
9️⃣ Shopping & tax refund tips
🔟 K-beauty halal check
🏥 HEALTH & EMERGENCY
1️⃣1️⃣ Sick? Hospital & pharmacy
1️⃣2️⃣ Travel insurance
1️⃣3️⃣ Emergency (lost passport, accident)
🎤 ENTERTAINMENT
1️⃣4️⃣ K-pop & drama filming spots
1️⃣5️⃣ Free events this week
🧳 OTHER SERVICES
1️⃣6️⃣ Send package / cargo home
1️⃣7️⃣ Visa extension
1️⃣8️⃣ Job in Korea
1️⃣9️⃣ One-day guide (VBK certified)
0️⃣ Talk to me directly
   (anything — I'm a real human!)
━━━━━━━━━━━━━━━`,
    id: `━━━━━━━━━━━━━━━
🇰🇷 VirtualButler Korea
Saya bukan sekadar bot.
Di balik saya ada MANUSIA sungguhan.
Saya bisa BENAR-BENAR melakukan sesuatu
— bukan cuma kasih info! 🤝
Kamu butuh apa?
🗺️ PETA & PANDUAN
1️⃣ Buka peta halal & wisata kami
🕌 IBADAH
2️⃣ Tempat sholat / Masjid terdekat
3️⃣ Jadwal waktu sholat hari ini
🍽️ MAKAN
4️⃣ Makanan halal dekat sini
5️⃣ Rekomendasi restoran spesial minggu ini
✈️ KEDATANGAN
6️⃣ Dari bandara (SIM, transport, uang)
7️⃣ T-money & keliling Seoul
🏨 MENGINAP
8️⃣ Hotel ramah Muslim & promo
🛍️ BELANJA
9️⃣ Shopping & tips tax refund
🔟 Cek bahan halal K-beauty
🏥 KESEHATAN & DARURAT
1️⃣1️⃣ Sakit? Rumah sakit & apotek
1️⃣2️⃣ Asuransi perjalanan
1️⃣3️⃣ Darurat (paspor hilang, kecelakaan)
🎤 HIBURAN
1️⃣4️⃣ Spot K-pop & lokasi syuting drama
1️⃣5️⃣ Event gratis minggu ini
🧳 LAYANAN LAINNYA
1️⃣6️⃣ Kirim barang / kargo ke Indonesia
1️⃣7️⃣ Perpanjangan visa
1️⃣8️⃣ Cari kerja di Korea
1️⃣9️⃣ One-day guide (tersertifikasi VBK)
0️⃣ Hubungi saya langsung
   (apapun — saya manusia sungguhan!)
━━━━━━━━━━━━━━━`,
  };
  return menus[lang] || menus.en;
}

export function getServiceMenuMessage(lang = 'en') {
  const menus = {
    en: `🧳 Other Services\n\n1️⃣6️⃣ Send package / cargo home\n1️⃣7️⃣ Visa extension\n1️⃣8️⃣ Job in Korea\n1️⃣9️⃣ One-day guide (VBK certified)\n\n0️⃣ Talk to me directly`,
    id: `🧳 Layanan Lainnya\n\n1️⃣6️⃣ Kirim barang / kargo ke Indonesia\n1️⃣7️⃣ Perpanjangan visa\n1️⃣8️⃣ Cari kerja di Korea\n1️⃣9️⃣ One-day guide (tersertifikasi VBK)\n\n0️⃣ Hubungi saya langsung`,
  };
  return menus[lang] || menus.en;
}
