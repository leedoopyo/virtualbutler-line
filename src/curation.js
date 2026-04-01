// src/curation.js

export const MAP_LINK = 'https://www.google.com/maps/d/u/0/viewer?mid=1Hh1Cm8MlGjqKsI8Ok60UQeiY0mOB0mo&ll=37.524909532129115%2C127.22392225000002&z=11';

export const MAP_INTRO = {
  en: '🗺️ This is our special VirtualButler Korea map for Muslim travelers.\nHalal restaurants, mosques, prayer rooms, shopping spots & curated picks — all in one 👇',
  id: '🗺️ Ini peta khusus VirtualButler Korea untuk wisatawan Muslim.\nRestoran halal, masjid, musholla, spot belanja & pilihan terkurasi — semuanya ada di sini 👇',
};

export const WEEKLY_CURATION = {
  week: '2026-03-31',
  items: [
    {
      emoji: '🌸',
      title: {
        en: 'Cherry Blossom Festival at Yeouido!',
        id: 'Festival Bunga Sakura di Yeouido!',
      },
      detail: {
        en: '📍 Yeouido Hangang Park\n📅 April 1-10, 2026\n✨ Best photo spot this week',
        id: '📍 Yeouido Hangang Park\n📅 1-10 April 2026\n✨ Spot foto terbaik minggu ini',
      },
      mapLink: 'https://map.kakao.com/link/search/여의도한강공원',
    },
    {
      emoji: '🎵',
      title: {
        en: 'K-POP Street Performance at Hongdae!',
        id: 'K-POP Street Performance di Hongdae!',
      },
      detail: {
        en: '📍 Hongdae Walking Street\n📅 Sat & Sun, 2PM-6PM\n🎫 Free!',
        id: '📍 Hongdae Walking Street\n📅 Sabtu & Minggu, 14:00-18:00\n🎫 Gratis!',
      },
      mapLink: 'https://map.kakao.com/link/search/홍대걷고싶은거리',
    },
    {
      emoji: '🛍️',
      title: {
        en: 'K-Beauty deals in Myeongdong this week!',
        id: 'Promo K-Beauty di Myeongdong minggu ini!',
      },
      detail: {
        en: '📍 Myeongdong\n🏷️ Olive Young / Innisfree / Etude deals\n📅 Until April 7',
        id: '📍 Myeongdong\n🏷️ Promo Olive Young / Innisfree / Etude\n📅 Sampai 7 April',
      },
      mapLink: 'https://map.kakao.com/link/search/명동',
    },
  ],
};

export const SERVICE_CATALOG = {
  prayer: {
    en: `🕌 Prayer Room / Mosque Finder\n\nCheck our map for mosques & prayer rooms:\n${MAP_LINK}\n\nTell me your area and I'll help find the nearest one!`,
    id: `🕌 Pencari Tempat Sholat / Masjid\n\nCek map kami untuk masjid & musholla:\n${MAP_LINK}\n\nKasih tahu area kamu, saya bantu carikan yang terdekat!`,
  },
  prayer_time: {
    en: `🕐 Prayer Times in Seoul (today)\n\nFajr: 05:12\nSyuruq: 06:41\nDhuhr: 12:31\nAsr: 15:58\nMaghrib: 18:21\nIsya: 19:45\n\n📍 Based on Seoul coordinates\n🔗 For exact times: muslim.or.kr`,
    id: `🕐 Waktu Sholat di Seoul (hari ini)\n\nSubuh: 05:12\nSyuruq: 06:41\nZuhur: 12:31\nAshar: 15:58\nMaghrib: 18:21\nIsya: 19:45\n\n📍 Berdasarkan koordinat Seoul\n🔗 Waktu akurat: muslim.or.kr`,
  },
  halal: {
    en: `🍽️ Halal Food Finder\n\nCheck our curated halal restaurant map:\n${MAP_LINK}\n\nOr tell me your area and I'll find the nearest halal food for you!`,
    id: `🍽️ Pencari Makanan Halal\n\nCek map restoran halal pilihan kami:\n${MAP_LINK}\n\nAtau kasih tahu area kamu, saya carikan makanan halal terdekat!`,
  },
  restaurant_special: {
    en: `⭐ This week's special picks:\n\n🍽️ Jipbab (Itaewon) ⭐4.9\n→ Halal Korean home cooking, viral on TikTok!\n\n🍖 EVERHALAL (near Everland) ⭐5.0\n→ Unlimited halal KBBQ + free shuttle!\n\n🌿 Cherry Garden (Dongdaemun) ⭐5.0\n→ Halal Korean + prayer room inside!\n\nWant me to find something specific? Just ask! 😊`,
    id: `⭐ Pilihan spesial minggu ini:\n\n🍽️ Jipbab (Itaewon) ⭐4.9\n→ Korean home cooking halal, viral di TikTok!\n\n🍖 EVERHALAL (dekat Everland) ⭐5.0\n→ KBBQ halal unlimited + shuttle gratis!\n\n🌿 Cherry Garden (Dongdaemun) ⭐5.0\n→ Korean halal + ada prayer room!\n\nMau cari yang spesifik? Bilang aja! 😊`,
  },
  airport: {
    en: `✈️ Just arrived at Incheon Airport?\n\n📱 SIM Card:\n→ Buy at arrival hall (SKT/KT/LGU+)\n→ ~30,000-50,000 KRW for 10 days\n\n💰 Money Exchange:\n→ Airport rate is OK for first exchange\n→ Better rates in Myeongdong later\n\n🚌 To Seoul:\n→ AREX Train: 43 min to Seoul Station (9,500 KRW)\n→ Airport Bus: cheaper, slower\n→ Taxi: ~80,000 KRW to city center\n\n💳 T-money card:\n→ Buy at convenience store in airport\n→ Recharge at any CU/GS25/7-Eleven\n\nNeed more help? Just ask! 🙌`,
    id: `✈️ Baru tiba di Bandara Incheon?\n\n📱 SIM Card:\n→ Beli di aula kedatangan (SKT/KT/LGU+)\n→ ~30,000-50,000 KRW untuk 10 hari\n\n💰 Tukar Uang:\n→ Kurs bandara cukup OK untuk tukar pertama\n→ Kurs lebih bagus di Myeongdong nanti\n\n🚌 Ke Seoul:\n→ Kereta AREX: 43 menit ke Seoul Station (9,500 KRW)\n→ Bus Bandara: lebih murah, lebih lama\n→ Taksi: ~80,000 KRW ke pusat kota\n\n💳 Kartu T-money:\n→ Beli di minimarket di bandara\n→ Isi ulang di CU/GS25/7-Eleven mana saja\n\nButuh bantuan lebih? Bilang aja! 🙌`,
  },
  transport: {
    en: `🚇 Getting Around Seoul\n\n💳 T-money card (essential!)\n→ Buy at any convenience store\n→ Works for subway, bus & taxi\n→ Recharge at CU/GS25/7-Eleven\n\n🗺️ Best apps:\n→ Naver Map (best for public transport)\n→ Kakao Map (good for walking)\n→ KakaoTaxi (for taxis)\n\n⚠️ Google Maps doesn't work well for buses!\n\n🕐 Last subway: around 11:30PM-12AM\n\nNeed directions somewhere specific?\nTell me where you are → where you want to go!\nI'll help you step by step 🙌`,
    id: `🚇 Keliling Seoul\n\n💳 Kartu T-money (wajib!)\n→ Beli di minimarket mana saja\n→ Bisa untuk subway, bus & taksi\n→ Isi ulang di CU/GS25/7-Eleven\n\n🗺️ Aplikasi terbaik:\n→ Naver Map (terbaik untuk transportasi umum)\n→ Kakao Map (bagus untuk jalan kaki)\n→ KakaoTaxi (untuk taksi)\n\n⚠️ Google Maps kurang akurat untuk bus!\n\n🕐 Subway terakhir: sekitar 23:30-00:00\n\nMau ke mana? Kasih tahu posisi kamu sekarang\n→ saya bantu step by step! 🙌`,
  },
  hotel: {
    en: `🏨 Muslim-Friendly Hotels in Seoul\n\n⭐ Our top picks:\n\n📍 Itaewon area\n→ Near Seoul Central Mosque\n→ Halal restaurants walking distance\n\n📍 Myeongdong area\n→ Central location\n→ Near KampungKu & halal spots\n\n📍 Hongdae area\n→ Great for young travelers\n→ Near halal restaurants\n\n💰 Want best price?\nCheck: Agoda / Traveloka / Booking.com\n\nTell me your dates & budget\nI'll find the best deal for you! 🙌`,
    id: `🏨 Hotel Ramah Muslim di Seoul\n\n⭐ Pilihan terbaik kami:\n\n📍 Area Itaewon\n→ Dekat Masjid Seoul
