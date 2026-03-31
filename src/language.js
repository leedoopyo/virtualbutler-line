import { MAP_LINK, MAP_INTRO, EMERGENCY_GUIDE, WEEKLY_CURATION } from './curation.js';

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

export function welcomeMessage(lang) {
  const greetings = {
    en: '🇰🇷 Hello! Welcome to VirtualButler Korea!\n\nI\'ll be your faithful travel companion throughout your stay in Korea 🤝\nHalal food, attractions, K-pop info, emergencies — just ask me anything!',
    id: '🇰🇷 Halo! Selamat datang di VirtualButler Korea!\n\nSaya akan menjadi teman perjalanan setia Anda selama di Korea 🤝\nRestoran halal, tempat wisata, info K-pop, hingga darurat — semua bisa tanya saya!',
  };

  const curationHeader = {
    en: '✨ This week\'s highlights:',
    id: '✨ Highlight minggu ini:',
  };

  const curationItems = WEEKLY_CURATION.items.map(item => {
    const title = item.title[lang] || item.title.en;
    const detail = item.detail[lang] || item.detail.en;
    return `${item.emoji} ${title}\n${detail}\n🗺️ ${item.mapLink}`;
  }).join('\n\n');

  return [
    greetings[lang] || greetings.en,
    '',
    '─────────────────',
    MAP_INTRO[lang] || MAP_INTRO.en,
    MAP_LINK,
    '─────────────────',
    curationHeader[lang] || curationHeader.en,
    '',
    curationItems,
    '─────────────────',
    EMERGENCY_GUIDE[lang] || EMERGENCY_GUIDE.en,
  ].join('\n');
}
