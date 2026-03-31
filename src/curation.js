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
    id: `🏨 Hotel Ramah Muslim di Seoul\n\n⭐ Pilihan terbaik kami:\n\n📍 Area Itaewon\n→ Dekat Masjid Seoul Central\n→ Restoran halal bisa jalan kaki\n\n📍 Area Myeongdong\n→ Lokasi sentral\n→ Dekat KampungKu & spot halal\n\n📍 Area Hongdae\n→ Cocok untuk traveler muda\n→ Dekat restoran halal\n\n💰 Mau harga terbaik?\nCek: Agoda / Traveloka / Booking.com\n\nKasih tahu tanggal & budget kamu\nSaya carikan deal terbaik! 🙌`,
  },
  shopping: {
    en: `🛍️ Shopping in Korea\n\n🏪 Best areas:\n→ Myeongdong: K-beauty, street food\n→ Hongdae: fashion, indie shops\n→ Dongdaemun: wholesale, open 24hrs\n→ Starfield COEX: premium mall\n\n💰 Tax Refund Tips:\n→ Spend 30,000+ KRW at one store\n→ Show passport at counter\n→ Get tax refund slip\n→ Claim at airport before departure\n\n🛍️ K-Beauty Halal Tips:\n→ Ask me before buying!\n→ Some products contain alcohol/pork ingredients\n→ I'll check for you! 🙌`,
    id: `🛍️ Belanja di Korea\n\n🏪 Area terbaik:\n→ Myeongdong: K-beauty, street food\n→ Hongdae: fashion, toko unik\n→ Dongdaemun: grosir, buka 24 jam\n→ Starfield COEX: mall premium\n\n💰 Tips Tax Refund:\n→ Belanja 30,000+ KRW di satu toko\n→ Tunjukkan paspor di kasir\n→ Minta slip tax refund\n→ Klaim di bandara sebelum pulang\n\n🛍️ Tips K-Beauty Halal:\n→ Tanya saya sebelum beli!\n→ Beberapa produk mengandung alkohol/babi\n→ Saya bantu cek untuk kamu! 🙌`,
  },
  hospital: {
    en: `🏥 Sick in Korea?\n\nDon't worry — I'll help you!\n\n🚨 Emergency: Call 119 (ambulance, free)\n👮 Police: Call 112\n\n🏥 English-friendly hospitals in Seoul:\n→ Severance Hospital (Sinchon)\n→ Samsung Medical Center (Gangnam)\n→ Asan Medical Center (Songpa)\n\n💊 Pharmacy (약국):\n→ Available everywhere\n→ Show symptoms, they'll help\n→ No prescription needed for basic medicine\n\n💰 Without insurance:\n→ General clinic: 50,000-100,000 KRW\n→ Emergency room: 200,000-500,000 KRW\n\n📋 Do you have travel insurance?\nIf not, see option 1️⃣2️⃣ first!\n\nTell me your symptoms\nI'll find the nearest clinic for you! 🙌`,
    id: `🏥 Sakit di Korea?\n\nJangan khawatir — saya bantu!\n\n🚨 Darurat: Hubungi 119 (ambulans, gratis)\n👮 Polisi: Hubungi 112\n\n🏥 Rumah sakit ramah bahasa Inggris:\n→ Severance Hospital (Sinchon)\n→ Samsung Medical Center (Gangnam)\n→ Asan Medical Center (Songpa)\n\n💊 Apotek (약국):\n→ Ada di mana-mana\n→ Tunjukkan gejala, mereka bantu\n→ Obat dasar tanpa resep\n\n💰 Tanpa asuransi:\n→ Klinik umum: 50,000-100,000 KRW\n→ UGD: 200,000-500,000 KRW\n\n📋 Punya asuransi perjalanan?\nKalau belum, lihat pilihan 1️⃣2️⃣ dulu!\n\nCeritakan gejalamu\nSaya carikan klinik terdekat! 🙌`,
  },
  insurance: {
    en: `🛡️ Travel Insurance\n\nVery important for Korea!\nWithout insurance, hospital bills can be very expensive.\n\n✅ Recommended (buy online before trip):\n\n⭐ Zurich Syariah (Halal certified!)\n→ travellin.co.id\n\n📱 Traveloka Insurance (easiest)\n→ In Traveloka app\n\n🌍 Allianz TravelPRO\n→ allianz.co.id\n\n💡 Already in Korea & no insurance?\n→ Zurich allows purchase within 3 days of departure!\n\nNeed help choosing? Just ask! 🙌`,
    id: `🛡️ Asuransi Perjalanan\n\nSangat penting untuk ke Korea!\nTanpa asuransi, biaya rumah sakit bisa sangat mahal.\n\n✅ Rekomendasi (beli online sebelum berangkat):\n\n⭐ Zurich Syariah (Halal certified!)\n→ travellin.co.id\n\n📱 Traveloka Insurance (paling mudah)\n→ Di aplikasi Traveloka\n\n🌍 Allianz TravelPRO\n→ allianz.co.id\n\n💡 Sudah di Korea & belum punya asuransi?\n→ Zurich masih bisa dibeli dalam 3 hari setelah berangkat!\n\nMau saya bantu pilih? Bilang aja! 🙌`,
  },
  emergency: {
    en: `🚨 Emergency Help\n\n📞 Emergency numbers:\n→ 119: Ambulance / Fire\n→ 112: Police\n→ 1330: Korea Tourism Helpline (English 24/7)\n\n🆘 Lost passport?\n→ Go to Indonesian Embassy\n→ 📍 Yongsan-gu, Seoul\n→ ☎️ 02-783-5675\n\n💳 Lost wallet/card?\n→ Block card immediately via app\n→ Nearest bank for emergency cash\n\n🏥 Medical emergency?\n→ Call 119 immediately\n→ They have English support\n\n👤 I'm here for you!\nType 0 to talk to me directly RIGHT NOW`,
    id: `🚨 Bantuan Darurat\n\n📞 Nomor darurat:\n→ 119: Ambulans / Kebakaran\n→ 112: Polisi\n→ 1330: Hotline Pariwisata Korea (Inggris 24/7)\n\n🆘 Paspor hilang?\n→ Ke Kedutaan Indonesia\n→ 📍 Yongsan-gu, Seoul\n→ ☎️ 02-783-5675\n\n💳 Dompet/kartu hilang?\n→ Blokir kartu segera via aplikasi\n→ Bank terdekat untuk cash darurat\n\n🏥 Darurat medis?\n→ Hubungi 119 segera\n→ Ada dukungan bahasa Inggris\n\n👤 Saya di sini untuk kamu!\nKetik 0 untuk bicara langsung dengan saya SEKARANG`,
  },
  kpop: {
    en: `🎤 K-Pop & K-Drama in Seoul\n\n📸 Must-visit spots:\n→ SM Entertainment building (giant LED screen!)\n→ HYBE (BTS company) - Yongsan\n→ Kakao Friends Hongdae\n→ Line Friends Myeongdong\n\n🎬 Drama filming locations:\n→ Gyeongbokgung (Goblin, Mr. Sunshine)\n→ Bukchon Hanok Village (many dramas)\n→ Danbam bar (Itaewon Class)\n→ N Seoul Tower (Goblin)\n\n🎵 Free performances:\n→ Hongdae busking: every Sat & Sun\n→ K-pop random dance: Hongdae plaza\n\n💿 Buy K-pop merch:\n→ COEX SM Town\n→ Music Korea (Myeongdong)\n\nWant a K-pop day tour? Type 1️⃣9️⃣! 😊`,
    id: `🎤 K-Pop & K-Drama di Seoul\n\n📸 Wajib dikunjungi:\n→ Gedung SM Entertainment (layar LED raksasa!)\n→ HYBE (perusahaan BTS) - Yongsan\n→ Kakao Friends Hongdae\n→ Line Friends Myeongdong\n\n🎬 Lokasi syuting drama:\n→ Gyeongbokgung (Goblin, Mr. Sunshine)\n→ Bukchon Hanok Village (banyak drakor)\n→ Bar Danbam (Itaewon Class)\n→ N Seoul Tower (Goblin)\n\n🎵 Pertunjukan gratis:\n→ Busking Hongdae: setiap Sabtu & Minggu\n→ K-pop random dance: plaza Hongdae\n\n💿 Beli merchandise K-pop:\n→ COEX SM Town\n→ Music Korea (Myeongdong)\n\nMau tur K-pop seharian? Ketik 1️⃣9️⃣! 😊`,
  },
  events: {
    en: `🎉 Events & Free Things This Week`,
    id: `🎉 Event & Hal Gratis Minggu Ini`,
  },
  delivery: {
    en: `📦 Send Package / Cargo\n\nNeed to send items back to Indonesia?\n\n📮 Options:\n→ EMS (Korea Post): reliable, tracked\n→ DHL/FedEx: faster, more expensive\n→ Sea cargo: cheapest, 2-4 weeks\n\n📦 Overweight luggage?\n→ Ship excess items home!\n→ Usually cheaper than airline fees\n\n🛒 Need boxes?\n→ Any convenience store or Daiso\n\nTell me:\n- What items?\n- How heavy?\n- Destination city?\nI'll help you find the best option! 🙌`,
    id: `📦 Kirim Barang / Kargo\n\nMau kirim barang ke Indonesia?\n\n📮 Pilihan:\n→ EMS (Korea Post): terpercaya, ada tracking\n→ DHL/FedEx: lebih cepat, lebih mahal\n→ Kargo laut: paling murah, 2-4 minggu\n\n📦 Bagasi overweight?\n→ Kirim barang berlebih ke rumah!\n→ Biasanya lebih murah dari biaya maskapai\n\n🛒 Butuh kardus?\n→ Di minimarket atau Daiso mana saja\n\nCeritakan:\n- Barang apa?\n- Berapa berat?\n- Kota tujuan?\nSaya bantu carikan opsi terbaik! 🙌`,
  },
  visa: {
    en: `🛂 Visa Extension\n\nNeed to extend your stay in Korea?\n\n📋 Requirements:\n→ Valid passport\n→ Current visa\n→ Proof of accommodation\n→ Financial proof\n→ Application fee\n\n🏢 Immigration offices in Seoul:\n→ Seoul Immigration Office (Mapo)\n→ Incheon Airport Immigration\n\n⚠️ Process takes 1-2 weeks\n\nOur team can guide you through the process!\nType 0 to talk to us directly 🙌`,
    id: `🛂 Perpanjangan Visa\n\nMau perpanjang tinggal di Korea?\n\n📋 Persyaratan:\n→ Paspor yang masih berlaku\n→ Visa saat ini\n→ Bukti akomodasi\n→ Bukti keuangan\n→ Biaya aplikasi\n\n🏢 Kantor imigrasi di Seoul:\n→ Seoul Immigration Office (Mapo)\n→ Imigrasi Bandara Incheon\n\n⚠️ Proses memakan waktu 1-2 minggu\n\nTim kami bisa panduan prosesnya!\nKetik 0 untuk bicara langsung 🙌`,
  },
  jobs: {
    en: `💼 Job in Korea\n\nLooking for work in Korea?\n\n✅ Common jobs for Indonesians:\n→ Restaurant (halal/Asian food)\n→ Language instructor\n→ Tourism guide\n→ Factory work (visa required)\n\n📋 Requirements:\n→ Valid visa that allows work\n→ Korean language helps a lot\n→ ARC (Alien Registration Card)\n\n⚠️ Working without proper visa = illegal!\n\nOur team can connect you with opportunities!\nType 0 to talk to us directly 🙌`,
    id: `💼 Kerja di Korea\n\nCari kerja di Korea?\n\n✅ Pekerjaan umum untuk orang Indonesia:\n→ Restoran (halal/makanan Asia)\n→ Instruktur bahasa\n→ Pemandu wisata\n→ Kerja pabrik (butuh visa khusus)\n\n📋 Persyaratan:\n→ Visa yang mengizinkan bekerja\n→ Bahasa Korea sangat membantu\n→ ARC (Kartu Registrasi Orang Asing)\n\n⚠️ Kerja tanpa visa yang tepat = ilegal!\n\nTim kami bisa hubungkan dengan peluang kerja!\nKetik 0 untuk bicara langsung 🙌`,
  },
  guide: {
    en: `🧑‍🤝‍🧑 One-Day Guide (VBK Certified)\n\nWant a personal guide for a day in Korea?\n\n✅ Our verified guides can:\n→ Speak Indonesian/English\n→ Know all halal spots\n→ Respect prayer times\n→ Customize your day\n\n🎯 Popular packages:\n→ K-Pop & Drama filming locations\n→ Muslim-friendly Seoul tour\n→ K-Beauty shopping guide\n→ Han River & nature tour\n\n💰 Starting from 100,000 KRW/day\n\nTell us:\n- Date\n- Area of interest\n- Group size\nWe'll match you with the perfect guide! 🙌`,
    id: `🧑‍🤝‍🧑 One-Day Guide (Tersertifikasi VBK)\n\nMau pemandu pribadi untuk sehari di Korea?\n\n✅ Guide terverifikasi kami bisa:\n→ Berbicara Indonesia/Inggris\n→ Tahu semua spot halal\n→ Menghormati waktu sholat\n→ Menyesuaikan hari kamu\n\n🎯 Paket populer:\n→ Lokasi K-Pop & syuting drama\n→ Tur Seoul ramah Muslim\n→ Panduan belanja K-Beauty\n→ Han River & tur alam\n\n💰 Mulai dari 100,000 KRW/hari\n\nCeritakan:\n- Tanggal\n- Minat\n- Jumlah orang\nKami cocokkan dengan guide terbaik! 🙌`,
  },
};

export const AD_SLOTS = {
  main: {
    en: `💡 Tip: Tap "1" anytime to open our Muslim-friendly map of Seoul & Gyeonggi!`,
    id: `💡 Tips: Ketik "1" kapan saja untuk buka peta Muslim-friendly Seoul & Gyeonggi kami!`,
  },
  shopping: {
    en: `🗺️ See all shopping spots on our map → ${MAP_LINK}`,
    id: `🗺️ Lihat semua spot belanja di peta kami → ${MAP_LINK}`,
  },
  events: {
    en: `📍 Check our map for event locations → ${MAP_LINK}`,
    id: `📍 Cek peta kami untuk lokasi event → ${MAP_LINK}`,
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
