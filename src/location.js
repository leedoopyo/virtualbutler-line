export function requestLocationMessage(lang) {
  const messages = {
    en: `📍 Which area are you in?

Type the area name (e.g. Hongdae / Myeongdong / Gangnam / Yongsan)
or share your location via the + button below!`,

    vi: `📍 Bạn đang ở khu vực nào?

Nhập tên khu vực (vd: Hongdae / Myeongdong / Gangnam)
hoặc chia sẻ vị trí qua nút + bên dưới!`,

    id: `📍 Anda di area mana?

Ketik nama area (cth: Hongdae / Myeongdong / Gangnam)
atau bagikan lokasi via tombol + di bawah!`,

    mn: `📍 Та аль хороонд байна вэ?

Газрын нэрийг бичнэ үү (жш: Hongdae / Myeongdong / Gangnam)
эсвэл доорх + товчоор байршлаа илгээнэ үү!`,
  };
  return messages[lang] || messages.en;
}

export function locationReceivedMessage(lang, address) {
  const messages = {
    en: `✅ Got your location!\n📍 ${address}\n\nWhat are you looking for?\n\n1. 🍜 Restaurants\n2. ☕ Cafes\n3. 🕌 Halal food\n4. 💊 Pharmacy\n5. 🏥 Clinic\n6. 🏨 Hotels`,
    vi: `✅ Đã nhận vị trí của bạn!\n📍 ${address}\n\nBạn đang tìm gì?\n\n1. 🍜 Nhà hàng\n2. ☕ Quán cà phê\n3. 🕌 Đồ ăn halal\n4. 💊 Nhà thuốc\n5. 🏥 Phòng khám\n6. 🏨 Khách sạn`,
    id: `✅ Lokasi Anda diterima!\n📍 ${address}\n\nAnda mencari apa?\n\n1. 🍜 Restoran\n2. ☕ Kafe\n3. 🕌 Makanan halal\n4. 💊 Apotek\n5. 🏥 Klinik\n6. 🏨 Hotel`,
    mn: `✅ Байршил хүлээн авлаа!\n📍 ${address}\n\nЮу хайж байна вэ?\n\n1. 🍜 Ресторан\n2. ☕ Кафе\n3. 🕌 Халал хоол\n4. 💊 Эмийн сан\n5. 🏥 Эмнэлэг\n6. 🏨 Зочид буудал`,
  };
  return messages[lang] || messages.en;
}

export function detectSearchType(text = '') {
  const t = text.toLowerCase();
  if (t.includes('hotel') || t.includes('khách sạn') || t.includes('буудал') || t.includes('penginapan')) return 'hotel';
  if (t.includes('cafe') || t.includes('coffee') || t.includes('cà phê') || t.includes('кафе') || t.includes('kopi')) return 'cafe';
  if (t.includes('pharmacy') || t.includes('thuốc') || t.includes('эмийн') || t.includes('apotek')) return 'pharmacy';
  if (t.includes('hospital') || t.includes('clinic') || t.includes('doctor')) return 'hospital';
  if (t.includes('halal')) return 'halal';
  return 'restaurant';
}

export function isLocationRequest(text = '') {
  const t = text.toLowerCase();
  return (
    t.includes('nearby') || t.includes('near me') ||
    t.includes('around here') || t.includes('close to me') ||
    t.includes('hotel') || t.includes('restaurant') ||
    t.includes('restaurants') || t.includes('cafe') ||
    t.includes('coffee') || t.includes('pharmacy') ||
    t.includes('food near') || t.includes('where to eat') ||
    t.includes('where to stay') ||
    t.includes('gần đây') || t.includes('gần tôi') ||
    t.includes('nhà hàng') || t.includes('quán ăn') ||
    t.includes('khách sạn') || t.includes('cà phê') ||
    t.includes('nhà thuốc') ||
    t.includes('terdekat') || t.includes('dekat sini') ||
    t.includes('restoran') || t.includes('makanan') ||
    t.includes('hotel') || t.includes('apotek') ||
    t.includes('ойролцоо') || t.includes('ойр') ||
    t.includes('хажууд') || t.includes('буудал') ||
    t.includes('ресторан') || t.includes('хоол')
  );
}
