export function normalizeLanguageChoice(text = '') {
  const t = text.trim().toLowerCase();
  if (t === '0' || t === 'en' || t === 'english') return 'en';
  if (t === '1' || t === 'vi' || t === 'vietnamese') return 'vi';
  if (t === '2' || t === 'id' || t === 'indonesian' || t === 'bahasa') return 'id';
  if (t === '3' || t === 'mn' || t === 'mongolian' || t === 'монгол') return 'mn';
  return null;
}

export function languageSelectionMessage() {
  return `Welcome to Virtual Butler Korea 🇰🇷

Please choose your language:

0. English
1. Tiếng Việt
2. Bahasa Indonesia
3. Монгол

Type: EN / VI / ID / MN
or:   0  /  1  /  2  /  3`;
}

export function welcomeMessage(lang) {
  const messages = {
    en: 'Hello! I can help you in Korea with subway, buses, restaurants, halal food, SIM/eSIM, T-money, translation, and travel plans. Where are you now?',
    vi: 'Xin chào! Tôi có thể giúp bạn ở Hàn Quốc về tàu điện, xe buýt, quán ăn, đồ halal, SIM/eSIM, T-money, dịch ngôn ngữ và lịch trình. Bạn đang ở đâu?',
    id: 'Halo! Saya bisa membantu Anda di Korea dengan subway, bus, restoran, makanan halal, SIM/eSIM, T-money, terjemahan, dan rencana perjalanan. Anda sedang di mana?',
    mn: 'Сайн байна уу! Би Солонгост метро, автобус, ресторан, халал хоол, SIM/eSIM, T-money, орчуулга, аяллын төлөвлөгөөний талаар тусалж чадна. Та одоо хаана байна?',
  };
  return messages[lang] || messages.en;
}
