export function requestLocationMessage(lang) {
  const messages = {
    en: `📍 Please share your location!

Tap the + button at the bottom of the chat
→ Select "Location"
→ Pin your current spot and send

I'll find nearby places for you 🗺️`,

    vi: `📍 Vui lòng chia sẻ vị trí của bạn!

Nhấn nút + ở cuối màn hình chat
→ Chọn "Vị trí"
→ Ghim vị trí hiện tại và gửi

Tôi sẽ tìm những nơi gần bạn 🗺️`,

    id: `📍 Silakan bagikan lokasi Anda!

Ketuk tombol + di bagian bawah chat
→ Pilih "Lokasi"
→ Tandai posisi Anda dan kirim

Saya akan mencari tempat terdekat untuk Anda 🗺️`,

    mn: `📍 Байршлаа хуваалцана уу!

Чатын доод хэсэгт + товчийг дарна уу
→ "Байршил" сонгоно уу
→ Одоогийн байрлалаа тэмдэглээд илгээнэ үү

Би ойролцоох газруудыг олж өгнө 🗺️`,
  };
  return messages[lang] || messages.en;
}

export function locationReceivedMessage(lang, address) {
  const messages = {
    en: `✅ Got your location!\n📍 ${address}\n\nWhat are you looking for?\n\n1. 🍜 Restaurants\n2. ☕ Cafes\n3. 🕌 Halal food\n4. 💊 Pharmacy\n5. 🏥 Clinic`,
    vi: `✅ Đã nhận vị trí của bạn!\n📍 ${address}\n\nBạn đang tìm gì?\n\n1. 🍜 Nhà hàng\n2. ☕ Quán cà phê\n3. 🕌 Đồ ăn halal\n4. 💊 Nhà thuốc\n5. 🏥 Phòng khám`,
    id: `✅ Lokasi Anda diterima!\n📍 ${address}\n\nAnda mencari apa?\n\n1. 🍜 Restoran\n2. ☕ Kafe\n3. 🕌 Makanan halal\n4. 💊 Apotek\n5. 🏥 Klinik`,
    mn: `✅ Байршил хүлээн авлаа!\n📍 ${address}\n\nЮу хайж байна вэ?\n\n1. 🍜 Ресторан\n2. ☕ Кафе\n3. 🕌 Халал хоол\n4. 💊 Эмийн сан\n5. 🏥 Эмнэлэг`,
  };
  return messages[lang] || messages.en;
}

export function isLocationRequest(text = '') {
  const t = text.toLowerCase();
  return (
    t.includes('nearby') || t.includes('near me') ||
    t.includes('around here') || t.includes('close to me') ||
    t.includes('restaurant near') || t.includes('food near') ||
    t.includes('cafe near') || t.includes('pharmacy near') ||
    t.includes('clinic near') ||
    t.includes('gần đây') || t.includes('gần tôi') ||
    t.includes('quán ăn gần') || t.includes('nhà hàng gần') ||
    t.includes('quán cà phê gần') || t.includes('nhà thuốc gần') ||
    t.includes('terdekat') || t.includes('dekat sini') ||
    t.includes('di sekitar') || t.includes('restoran dekat') ||
    t.includes('makanan dekat') || t.includes('apotek dekat') ||
    t.includes('ойролцоо') || t.includes('ойр') ||
    t.includes('хажууд') || t.includes('ресторан ойр')
  );
}
