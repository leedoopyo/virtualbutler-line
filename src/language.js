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
