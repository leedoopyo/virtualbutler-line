const EMERGENCY_KEYWORDS = [
  'hospital', 'police', 'accident', 'emergency',
  'ambulance', 'passport lost', 'help me now', 'fire',
  'tai nạn', 'bệnh viện', 'cấp cứu', 'cảnh sát',
  'hỏa hoạn', 'mất hộ chiếu',
  'darurat', 'rumah sakit', 'polisi', 'kecelakaan',
  'kebakaran', 'paspor hilang',
  'паспорт', 'эмнэлэг', 'цагдаа', 'яаралтай',
  'түргэн тусламж',
];

export function isEmergency(text = '') {
  const t = text.toLowerCase();
  return EMERGENCY_KEYWORDS.some(keyword => t.includes(keyword));
}

export function emergencyReply(lang) {
  const replies = {
    en: '🚨 Emergency!\n• 119 — Ambulance / Fire\n• 112 — Police\n• 1330 — Tourism helpline (English)\n\nPlease send your current location now!',
    vi: '🚨 Khẩn cấp!\n• 119 — Cấp cứu / Cháy\n• 112 — Cảnh sát\n• 1330 — Hỗ trợ du lịch (tiếng Việt)\n\nHãy gửi vị trí hiện tại của bạn ngay!',
    id: '🚨 Darurat!\n• 119 — Ambulans / Kebakaran\n• 112 — Polisi\n• 1330 — Bantuan wisata (Bahasa Indonesia)\n\nKirim lokasi Anda sekarang!',
    mn: '🚨 Яаралтай!\n• 119 — Түргэн тусламж / Гал\n• 112 — Цагдаа\n• 1330 — Аялал жуулчлалын тусламж\n\nОдоогийн байршлаа яаралтай илгээнэ үү!',
  };
  return replies[lang] || replies.en;
}
