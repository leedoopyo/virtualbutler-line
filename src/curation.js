export const MAP_LINK =
  'https://www.google.com/maps/d/u/0/viewer?mid=1Hh1Cm8MlGjqKsI8Ok60UQeiY0mOB0mo&ll=37.524909532129115%2C127.22392225000002&z=11';

export const MAP_INTRO = {
  id: '🗺️ Ini peta khusus VirtualButler Korea untuk wisatawan Muslim.\nRestoran halal, masjid, musholla, spot belanja, event, dan info pilihan kami ada di sini 👇',
  en: '🗺️ This is the special VirtualButler Korea map for Muslim travelers.\nHalal restaurants, mosques, prayer rooms, shopping spots, events, and our curated updates are all here 👇',
};

export const WEEKLY_CURATION = {
  week: '2026-03-31',
  items: [
    {
      emoji: '🌸',
      title: {
        id: 'Festival Bunga Sakura di Yeouido!',
        en: 'Cherry Blossom Festival at Yeouido!',
      },
      detail: {
        id: '📍 Yeouido Hangang Park\n📅 1-10 April 2026\n✨ Spot foto terbaik minggu ini',
        en: '📍 Yeouido Hangang Park\n📅 April 1-10, 2026\n✨ Best photo spot this week',
      },
      mapLink: 'https://map.kakao.com/link/search/여의도한강공원',
    },
    {
      emoji: '🎵',
      title: {
        id: 'K-POP Street Performance di Hongdae!',
        en: 'K-POP Street Performance at Hongdae!',
      },
      detail: {
        id: '📍 Hongdae Walking Street\n📅 Sabtu & Minggu, 14:00-18:00\n🎫 Gratis',
        en: '📍 Hongdae Walking Street\n📅 Sat & Sun, 2PM-6PM\n🎫 Free',
      },
      mapLink: 'https://map.kakao.com/link/search/홍대걷고싶은거리',
    },
    {
      emoji: '🛍️',
      title: {
        id: 'Promo K-Beauty minggu ini di Myeongdong!',
        en: 'K-Beauty deals in Myeongdong this week!',
      },
      detail: {
        id: '📍 Myeongdong\n🏷️ Olive Young / Innisfree / Etude promo\n📅 Sampai 7 April',
        en: '📍 Myeongdong\n🏷️ Olive Young / Innisfree / Etude deals\n📅 Until April 7',
      },
      mapLink: 'https://map.kakao.com/link/search/명동',
    },
  ],
};

export const SERVICE_CATALOG = {
  prayer: {
    en: `🕌 Prayer support

Use our map to check mosques and prayer rooms first:
${MAP_LINK}

Tell me your area and I’ll help you narrow it down.`,
    id: `🕌 Bantuan tempat sholat

Gunakan map kami untuk cek masjid dan musholla:
${MAP_LINK}

Kasih tahu area kamu dan saya bantu cari yang lebih dekat.`,
  },
  shopping: {
    en: `🛍️ Shopping & deals

We can highlight:
• tax-free beauty shops
• Muslim-friendly shopping areas
• curated discount spots from our map updates

Popular areas:
• Myeongdong
• Dongdaemun
• Hongdae`,
    id: `🛍️ Shopping & promo

Kami bisa bantu tampilkan:
• toko tax-free
• area belanja ramah Muslim
• spot promo pilihan dari update map kami

Area populer:
• Myeongdong
• Dongdaemun
• Hongdae`,
  },
  visa: {
    en: `🛂 Visa extension support

We can connect you with our team for:
• visa extension guidance
• required documents
• basic consultation flow

Please send your nationality and current visa type if you know it.`,
    id: `🛂 Bantuan perpanjangan visa

Kami bisa hubungkan kamu ke tim kami untuk:
• panduan perpanjangan visa
• dokumen yang dibutuhkan
• alur konsultasi awal

Kalau tahu, kirim juga kewarganegaraan dan jenis visa kamu sekarang.`,
  },
  jobs: {
    en: `💼 Job introduction support

We can connect you for:
• basic job matching
• part-time / full-time opportunities
• language or service roles

Please tell us your Korean level, visa type, and work preference.`,
    id: `💼 Bantuan job introduction

Kami bisa bantu hubungkan untuk:
• pencocokan kerja dasar
• peluang part-time / full-time
• pekerjaan service / bahasa

Tolong kasih tahu level bahasa Korea, jenis visa, dan preferensi kerja kamu.`,
  },
  delivery: {
    en: `📦 Delivery support

We can help connect you for:
• local item delivery
• errand / pickup requests
• simple same-day coordination

Please tell us what item, pickup area, and destination area.`,
    id: `📦 Bantuan delivery

Kami bisa bantu hubungkan untuk:
• pengantaran barang lokal
• titip beli / pickup
• koordinasi sederhana di hari yang sama

Tolong kirim jenis barang, area ambil, dan area tujuan.`,
  },
  guide: {
    en: `🧑‍🤝‍🧑 One-day guide support

We can help connect you for:
• Muslim-friendly day guide
• shopping companion
• translation support
• local route assistance

Please tell us your date, area, and what kind of help you want.`,
    id: `🧑‍🤝‍🧑 Bantuan one-day guide

Kami bisa bantu hubungkan untuk:
• guide harian ramah Muslim
• teman shopping
• bantuan terjemahan
• bantuan rute lokal

Tolong kirim tanggal, area, dan bantuan yang kamu butuhkan.`,
  },
};

export const AD_SLOTS = {
  main: {
    en: '📢 Featured on our map: Muslim-friendly restaurants, beauty shops, and trusted local partners can be highlighted here.',
    id: '📢 Unggulan di map kami: restoran ramah Muslim, toko kecantikan, dan partner lokal terpercaya bisa ditampilkan di sini.',
  },
  shopping: {
    en: '📢 Promotion slot: tax-free shops, beauty deals, and local partner offers can be added here.',
    id: '📢 Slot promo: toko tax-free, promo beauty, dan penawaran partner lokal bisa ditambahkan di sini.',
  },
  events: {
    en: '📢 Event partner slot: pop-ups, performances, and local events can be promoted through our weekly map update.',
    id: '📢 Slot partner event: pop-up, performance, dan event lokal bisa dipromosikan lewat update map mingguan kami.',
  },
};

export function getWeeklyCurationMessage(lang = 'en') {
  const header = {
    en: `✨ This week's curated picks (${WEEKLY_CURATION.week})`,
    id: `✨ Pilihan curated minggu ini (${WEEKLY_CURATION.week})`,
  };

  const items = WEEKLY_CURATION.items
    .map((item) => {
      const title = item.title[lang] || item.title.en;
      const detail = item.detail[lang] || item.detail.en;
      return `${item.emoji} ${title}\n${detail}\n🗺️ ${item.mapLink}`;
    })
    .join('\n\n');

  return [header[lang] || header.en, '', items].join('\n');
}

export function getServiceMessage(serviceKey, lang = 'en') {
  const item = SERVICE_CATALOG[serviceKey];
  if (!item) return '';
  return item[lang] || item.en;
}

export function getAdMessage(lang = 'en', slot = 'main') {
  const item = AD_SLOTS[slot];
  if (!item) return '';
  return item[lang] || item.en;
}
