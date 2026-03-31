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
What do you need now?

1️⃣ Open our map
2️⃣ Halal food near me
3️⃣ Prayer room / Mosque
4️⃣ Weekly events & things to do
5️⃣ Shopping / deals
6️⃣ More services
7️⃣ Visa extension
8️⃣ Job introduction
9️⃣ Delivery service
🔟 One-day guide
0️⃣ Talk to our team

(Type a number or just tell me your need)`,

    id: `━━━━━━━━━━━━━━━
Kamu butuh apa sekarang?

1️⃣ Buka map kami
2️⃣ Makanan halal dekat sini
3️⃣ Tempat sholat / Masjid
4️⃣ Event mingguan & tempat seru
5️⃣ Shopping / promo
6️⃣ Layanan lainnya
7️⃣ Perpanjangan visa
8️⃣ Job introduction
9️⃣ Delivery service
🔟 One-day guide
0️⃣ Hubungi tim kami

(Ketik angka atau langsung tulis kebutuhan kamu)`,
  };

  return menus[lang] || menus.en;
}

export function getServiceMenuMessage(lang = 'en') {
  const menus = {
    en: `🧩 More services

7️⃣ Visa extension
8️⃣ Job introduction
9️⃣ Delivery service
🔟 One-day guide
0️⃣ Talk to our team`,

    id: `🧩 Layanan tambahan

7️⃣ Perpanjangan visa
8️⃣ Job introduction
9️⃣ Delivery service
🔟 One-day guide
0️⃣ Hubungi tim kami`,
  };

  return menus[lang] || menus.en;
}
