import crypto from 'crypto';
import dotenv from 'dotenv';
import express from 'express';

import {
  getSession, setSession,
  getLocation, setLocation,
  getState, setState,
} from './src/session.js';

import {
  normalizeLanguageChoice,
  languageSelectionMessage,
  getMainMenuMessage,
  getMapWelcomeMessage,
} from './src/language.js';

import { isEmergency } from './src/emergency.js';
import { generateReply } from './src/ai.js';
import { analyzeImage } from './src/vision.js';
import { isLocationRequest, locationReceivedMessage, detectSearchType } from './src/location.js';
import { searchNearby, searchByKeyword, TYPE_LABEL } from './src/places.js';
import { searchEvents } from './src/events.js';
import { detectIntent } from './src/router.js';
import {
  isHumanRequest,
  incrementFailCount,
  shouldEscalate,
  notifyHumanViaLine,
} from './src/human.js';

import {
  getWeeklyCurationMessage,
  getServiceMessage,
  getAdMessage,
} from './src/curation.js';

import { loadSheetsData, refreshSheetsData } from './src/sheets.js';

dotenv.config();

const {
  PORT = 3000,
  LINE_CHANNEL_SECRET,
  LINE_CHANNEL_ACCESS_TOKEN,
} = process.env;

const app = express();
app.use('/webhook', express.raw({ type: '*/*' }));

function verifyLineSignature(channelSecret, rawBody, signature) {
  const hash = crypto
    .createHmac('sha256', channelSecret)
    .update(rawBody)
    .digest('base64');
  return hash === signature;
}

async function replyMessage(replyToken, ...texts) {
  const messages = texts
    .filter(Boolean)
    .map((text) => ({ type: 'text', text }));

  if (!messages.length) return;

  const response = await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ replyToken, messages }),
  });

  const resultText = await response.text();
  console.log('LINE reply:', response.status, resultText);

  if (!response.ok) {
    throw new Error(`LINE reply failed: ${response.status} ${resultText}`);
  }
}

function cleanLocationText(text = '') {
  return text
    .replace(/^nearby\s+/i, '')
    .replace(/^near\s+/i, '')
    .replace(/^around\s+/i, '')
    .replace(/^cari\s+/i, '')
    .replace(/^find\s+/i, '')
    .replace(/^찾아줘\s+/i, '')
    .trim();
}

function isCategoryOnly(text = '') {
  const categories = [
    'hotel', 'hotels', 'restaurant', 'restaurants', 'cafe', 'cafes',
    'coffee', 'pharmacy', 'hospital', 'clinic', 'halal', 'food', 'eat',
    'movie', 'cinema', 'theater', 'museum', 'gallery', 'convenience',
    'mart', 'supermarket', 'bank', 'atm', 'parking', 'gas',
    'halal food', 'halal restaurant', 'prayer', 'prayer room',
    'mosque', 'masjid', 'musholla', 'tempat sholat',
    'restoran', 'kafe', 'apotek', 'rumah sakit', 'makanan halal',
  ];

  const t = text.trim().toLowerCase();
  return categories.some((c) => t === c);
}

function looksLikeLocation(text = '') {
  const t = text.trim().toLowerCase();
  if (!t) return false;

  const keywords = ['station', 'stn', 'exit', 'dong', 'gu', 'ro', 'gil', '역', '동', '구', '로', '길'];
  if (keywords.some((k) => t.includes(k))) return true;

  return text.trim().length <= 30 && /^[a-zA-Z0-9\s\-]+$/.test(text.trim());
}

function getSafeSearchType(searchType = '') {
  const allowed = [
    'restaurant', 'cafe', 'convenience', 'culture', 'hotel',
    'attraction', 'subway', 'bank', 'mart', 'hospital',
    'pharmacy', 'public', 'school', 'gas', 'parking', 'halal', 'prayer',
  ];
  return allowed.includes(searchType) ? searchType : 'restaurant';
}

function hasExplicitCategory(text = '', routeSearchType = '') {
  if (routeSearchType && routeSearchType !== 'restaurant') return true;

  const categoryWords = [
    'hotel', 'cafe', 'coffee', 'pharmacy', 'hospital', 'halal',
    'movie', 'cinema', 'museum', 'convenience', 'mart', 'bank',
    'prayer', 'mosque', 'masjid', 'musholla',
    'restoran', 'kafe', 'apotek', 'makanan halal',
  ];

  return categoryWords.some((w) => text.toLowerCase().includes(w));
}

function isPrayerKeyword(text = '') {
  const keywords = [
    'prayer', 'prayer room', 'mosque', 'masjid', 'tempat sholat',
    'shalat', 'musholla', '기도', '기도실', '모스크',
  ];
  return keywords.some((k) => text.toLowerCase().includes(k));
}

function isHalalKeyword(text = '') {
  const keywords = [
    'halal', 'halal food', 'halal restaurant',
    'makanan halal', 'restoran halal', '할랄',
  ];
  return keywords.some((k) => text.toLowerCase().includes(k));
}

function isShoppingKeyword(text = '') {
  const keywords = ['shopping', 'discount', 'sale', 'tax free', 'cosmetics', 'belanja', 'diskon', '쇼핑', '할인'];
  return keywords.some((k) => text.toLowerCase().includes(k));
}

function isTransportKeyword(text = '') {
  const keywords = [
    'how to get', 'how do i get', 'how can i get', 'direction', 'route',
    'subway', 'bus', 'taxi', 'train', 'from', 'to get to',
    'cara ke', 'naik apa', 'gimana ke', 'stasiun', 'kereta',
  ];
  return keywords.some((k) => text.toLowerCase().includes(k));
}

function isMenuRequest(text = '') {
  const keywords = ['menu', 'start', 'home', 'options', 'back', 'mulai', 'kembali', '메뉴', '처음', '홈'];
  const t = text.trim().toLowerCase();
  return keywords.some((k) => t === k || t.includes(k));
}

// ✅ 새로 추가: 인사말 감지
function isGreeting(text = '') {
  const greetings = [
    'hi', 'hello', 'halo', 'hai', 'hey',
    'assalamualaikum', 'assalamu', 'salam',
    '안녕', '안녕하세요',
  ];
  const t = text.trim().toLowerCase();
  return greetings.some((k) => t === k || t.startsWith(k));
}

function isInsuranceKeyword(text = '') {
  const keywords = ['insurance', 'asuransi', 'insure', '보험'];
  return keywords.some((k) => text.toLowerCase().includes(k));
}

function isHospitalKeyword(text = '') {
  const keywords = [
    'sick', 'hospital', 'doctor', 'medicine', 'pharmacy', 'hurt', 'pain', 'ill',
    'sakit', 'rumah sakit', 'dokter', 'obat', 'apotek',
    '아파', '병원', '약국', '의사',
  ];
  return keywords.some((k) => text.toLowerCase().includes(k));
}

function isAirportKeyword(text = '') {
  const keywords = ['airport', 'arrived', 'incheon', 'just landed', 'bandara', 'baru tiba', '공항'];
  return keywords.some((k) => text.toLowerCase().includes(k));
}

function isKpopKeyword(text = '') {
  const keywords = ['kpop', 'k-pop', 'bts', 'drama', 'kdrama', 'idol', 'sm', 'hybe', 'filming', 'syuting'];
  return keywords.some((k) => text.toLowerCase().includes(k));
}

function isEndHumanSession(text = '') {
  return ['#end', '#done', '#bot', '#selesai'].includes(text.trim().toLowerCase());
}

const ASK_LOCATION = {
  en: '📍 Tell me your area.\n(e.g. Gangnam / Hongdae / Myeongdong)',
  id: '📍 Kasih tahu area kamu.\n(contoh: Gangnam / Hongdae / Myeongdong)',
};

const ASK_CATEGORY = {
  en: (area) => `📍 You're near "${area}"!\nWhat do you need?\n\n2️⃣ Nearest prayer room / mosque\n4️⃣ Halal food near me\n5️⃣ Special restaurant picks this week\n9️⃣ Shopping tips\n1️⃣5️⃣ Free events this week`,
  id: (area) => `📍 Kamu dekat "${area}"!\nKamu butuh apa?\n\n2️⃣ Tempat sholat / masjid terdekat\n4️⃣ Makanan halal dekat saya\n5️⃣ Rekomendasi restoran spesial minggu ini\n9️⃣ Tips belanja\n1️⃣5️⃣ Event gratis minggu ini`,
};

const MAP_GUIDE = {
  en: '🗺️ Tap the link to open directions.',
  id: '🗺️ Klik link untuk buka petunjuk arah.',
};

const HUMAN_HANDOFF_MESSAGE = {
  en: `👤 Connecting you to our team now.\n\nPlease stay in this chat — a real human will respond shortly.\n\n🔒 For your safety, do not share personal contact details here.`,
  id: `👤 Menghubungkan kamu ke tim kami sekarang.\n\nMohon tetap di chat ini — manusia sungguhan akan segera merespons.\n\n🔒 Demi keamanan, jangan bagikan kontak pribadi di sini.`,
};

const BACK_TO_BOT_MESSAGE = {
  en: `✅ You're now connected back to our bot!\n\nType "menu" to see all options.\nOr just tell me what you need 😊`,
  id: `✅ Kamu sekarang terhubung kembali ke bot kami!\n\nKetik "menu" untuk lihat semua pilihan.\nAtau langsung ceritakan kebutuhanmu 😊`,
};

// ✅ 수정: prefixMessage 파라미터 추가로 replyToken 중복 제거
async function sendHumanHandoff(replyToken, userId, userText, lang, reason, prefixMessage = null) {
  await notifyHumanViaLine({ userId, userMessage: userText, lang, reason });
  setState(userId, 'waiting_human');
  const handoffMsg = HUMAN_HANDOFF_MESSAGE[lang] || HUMAN_HANDOFF_MESSAGE.en;
  if (prefixMessage) {
    await replyMessage(replyToken, prefixMessage, handoffMsg);
  } else {
    await replyMessage(replyToken, handoffMsg);
  }
}

async function handleSearch(replyToken, areaText, searchType, lang, originalUserText = '') {
  try {
    const results = await searchByKeyword(areaText, searchType, lang);
    const labelObj = TYPE_LABEL[searchType] || TYPE_LABEL.restaurant;
    const label = labelObj[lang] || labelObj.en;

    if (results) {
      await replyMessage(
        replyToken,
        `${label} near "${areaText}":\n\n${results}`,
        MAP_GUIDE[lang] || MAP_GUIDE.en
      );
      return;
    }

    const notFound = {
      en: `😅 No results near "${areaText}". Try another area.`,
      id: `😅 Tidak ada hasil dekat "${areaText}". Coba area lain ya.`,
    };

    await replyMessage(replyToken, notFound[lang] || notFound.en);
  } catch (err) {
    console.error('Search failed:', err.message);
    await replyMessage(replyToken, await generateReply(originalUserText || areaText, lang));
  }
}

function buildNoMoreEventsMessage(lang) {
  return {
    en: 'No more events right now. Check our map for updates!',
    id: 'Belum ada event tambahan. Cek update map kami ya!',
  }[lang] || 'No more events right now.';
}

app.get('/', (req, res) => {
  res.status(200).send('VirtualButler.Korea is running');
});

app.get('/admin/refresh-sheets', async (req, res) => {
  try {
    await refreshSheetsData();
    res.status(200).json({ ok: true, message: 'Sheets refreshed successfully' });
  } catch (err) {
    console.error('[Sheets] Manual refresh failed:', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/webhook', async (req, res) => {
  console.log('Webhook received:', new Date().toISOString());

  try {
    const signature = req.header('x-line-signature');
    if (!verifyLineSignature(LINE_CHANNEL_SECRET, req.body, signature)) {
      return res.status(401).send('Invalid signature');
    }

    const body = JSON.parse(req.body.toString('utf8'));
    res.status(200).send('OK');

    for (const event of body.events) {
      if (event.type !== 'message') continue;

      const userId = event.source?.userId || 'unknown';
      const lang = getSession(userId);
      const currentState = getState(userId);

      if (currentState === 'waiting_human') {
        if (event.message.type === 'text' && isEndHumanSession(event.message.text || '')) {
          setState(userId, null);
          await replyMessage(event.replyToken, BACK_TO_BOT_MESSAGE[lang] || BACK_TO_BOT_MESSAGE.en);
          console.log(`[${userId}] Human session ended - bot reactivated`);
          continue;
        }
        console.log(`[${userId}] waiting_human - bot silent`);
        continue;
      }

      if (event.message.type === 'location') {
        const { latitude, longitude, address } = event.message;
        const wantedType = currentState?.startsWith('awaiting_location_')
          ? currentState.replace('awaiting_location_', '')
          : null;

        setLocation(userId, latitude, longitude, address || '');
        setState(userId, null);

        if (wantedType && wantedType !== 'unknown') {
          try {
            const actualType = wantedType === 'prayer' ? 'prayer' : wantedType;
            const results = await searchNearby(latitude, longitude, actualType);
            const labelObj = TYPE_LABEL[actualType] || TYPE_LABEL.restaurant;
            const label = labelObj[lang || 'en'] || labelObj.en;

            if (results) {
              await replyMessage(
                event.replyToken,
                `${label} nearby:\n\n${results}`,
                MAP_GUIDE[lang || 'en']
              );
            } else {
              await replyMessage(
                event.replyToken,
                locationReceivedMessage(lang || 'en', address || 'Current location')
              );
            }
          } catch (err) {
            console.error('[Location] searchNearby failed:', err.message);
            await replyMessage(
              event.replyToken,
              locationReceivedMessage(lang || 'en', address || 'Current location')
            );
          }
        } else {
          setState(userId, 'awaiting_category');
          await replyMessage(
            event.replyToken,
            (ASK_CATEGORY[lang || 'id'] || ASK_CATEGORY.id)(address || 'your location')
          );
        }
        continue;
      }

      if (event.message.type === 'image') {
        if (!lang) {
          setState(userId, 'awaiting_language');
          await replyMessage(event.replyToken, languageSelectionMessage());
          continue;
        }

        try {
          const { text: analysisText, location: detectedLocation } = await analyzeImage(event.message.id, lang);

          if (detectedLocation && detectedLocation.toLowerCase() !== 'unknown') {
            setState(userId, `has_location:${detectedLocation}`);
            await replyMessage(
              event.replyToken,
              analysisText,
              (ASK_CATEGORY[lang] || ASK_CATEGORY.en)(detectedLocation)
            );
          } else {
            setState(userId, 'awaiting_location_unknown');
            const followUp = {
              en: 'Could not detect location. Please type your area.',
              id: 'Belum bisa baca lokasi. Tolong ketik area kamu.',
            };
            await replyMessage(event.replyToken, analysisText, followUp[lang] || followUp.en);
          }
        } catch (err) {
          console.error('[Image] analyzeImage failed:', err.message);
          const errorMsg = {
            en: 'Could not analyze image. Please try again.',
            id: 'Gagal analisis gambar. Coba lagi ya.',
          };
          await replyMessage(event.replyToken, errorMsg[lang] || errorMsg.en);
        }
        continue;
      }

      if (event.message.type !== 'text') continue;

      const userText = (event.message.text || '').trim();
      const lowered = userText.toLowerCase();
      console.log(`[${userId}] ${userText}`);

      const selectedLang = currentState === 'awaiting_language'
        ? normalizeLanguageChoice(userText)
        : null;

      if (selectedLang) {
        setSession(userId, selectedLang);
        setState(userId, null);
        await replyMessage(
          event.replyToken,
          getMapWelcomeMessage(selectedLang),
          getMainMenuMessage(selectedLang)
        );
        continue;
      }

      if (!lang) {
        if (!currentState) setState(userId, 'awaiting_language');
        await replyMessage(event.replyToken, languageSelectionMessage());
        continue;
      }

      const savedLocation = getLocation(userId);

      // ✅ 인사말 처리
      if (isGreeting(userText)) {
        await replyMessage(
          event.replyToken,
          getMapWelcomeMessage(lang),
          getMainMenuMessage(lang)
        );
        continue;
      }

      if (isMenuRequest(userText)) {
        await replyMessage(event.replyToken, getMainMenuMessage(lang));
        continue;
      }

      if (isEmergency(userText)) {
        await sendHumanHandoff(
          event.replyToken, userId, userText, lang, 'emergency',
          getServiceMessage('emergency', lang)
        );
        continue;
      }

      if (lowered === '1') {
        await replyMessage(
          event.replyToken,
          getMapWelcomeMessage(lang),
          getMainMenuMessage(lang)
        );
        continue;
      }

      if (lowered === '2') {
        if (savedLocation?.address) {
          await handleSearch(event.replyToken, savedLocation.address, 'prayer', lang, userText);
        } else if (savedLocation?.lat && savedLocation?.lng) {
          const results = await searchNearby(savedLocation.lat, savedLocation.lng, 'prayer');
          if (results) {
            const label = (TYPE_LABEL.prayer || TYPE_LABEL.halal)[lang] || (TYPE_LABEL.prayer || TYPE_LABEL.halal).en;
            await replyMessage(event.replyToken, `${label} nearby:\n\n${results}`, MAP_GUIDE[lang]);
          } else {
            setState(userId, 'awaiting_location_prayer');
            await replyMessage(event.replyToken, getServiceMessage('prayer', lang));
          }
        } else {
          setState(userId, 'awaiting_location_prayer');
          await replyMessage(event.replyToken, getServiceMessage('prayer', lang));
        }
        continue;
      }

      if (lowered === '3') {
        // ✅ 수정: prayer_times → prayer_time
        await replyMessage(event.replyToken, getServiceMessage('prayer_time', lang) || getServiceMessage('prayer', lang));
        continue;
      }

      if (lowered === '4') {
        if (savedLocation?.address) {
          await handleSearch(event.replyToken, savedLocation.address, 'halal', lang, userText);
        } else if (savedLocation?.lat && savedLocation?.lng) {
          const results = await searchNearby(savedLocation.lat, savedLocation.lng, 'halal');
          if (results) {
            const label = (TYPE_LABEL.halal || TYPE_LABEL.restaurant)[lang] || (TYPE_LABEL.halal || TYPE_LABEL.restaurant).en;
            await replyMessage(event.replyToken, `${label} nearby:\n\n${results}`, MAP_GUIDE[lang]);
          } else {
            setState(userId, 'awaiting_location_halal');
            await replyMessage(event.replyToken, ASK_LOCATION[lang] || ASK_LOCATION.en);
          }
        } else {
          setState(userId, 'awaiting_location_halal');
          await replyMessage(event.replyToken, ASK_LOCATION[lang] || ASK_LOCATION.en);
        }
        continue;
      }

      if (lowered === '5') {
        await replyMessage(event.replyToken, getServiceMessage('restaurant_special', lang));
        continue;
      }

      if (lowered === '6') {
        await replyMessage(event.replyToken, getServiceMessage('airport', lang));
        continue;
      }

      if (lowered === '7') {
        await replyMessage(event.replyToken, getServiceMessage('transport', lang));
        continue;
      }

      if (lowered === '8') {
        await replyMessage(event.replyToken, getServiceMessage('hotel', lang));
        continue;
      }

      if (lowered === '9') {
        await replyMessage(event.replyToken, getServiceMessage('shopping', lang), getAdMessage(lang, 'shopping'));
        continue;
      }

      if (lowered === '10') {
        const kbeauty = {
          en: 'K-Beauty Halal Check\n\nNot sure if a product is halal?\nSend me:\n- Product name\n- Brand name\n- Or a photo of the ingredients\n\nI will check for you!',
          id: 'Cek Halal K-Beauty\n\nTidak yakin produk halal atau tidak?\nKirim ke saya:\n- Nama produk\n- Nama brand\n- Atau foto bahan-bahannya\n\nSaya cek untuk kamu!',
        };
        await replyMessage(event.replyToken, kbeauty[lang] || kbeauty.en);
        continue;
      }

      if (lowered === '11') {
        await replyMessage(event.replyToken, getServiceMessage('hospital', lang));
        continue;
      }

      if (lowered === '12') {
        await replyMessage(event.replyToken, getServiceMessage('insurance', lang));
        continue;
      }

      if (lowered === '13') {
        await replyMessage(event.replyToken, getServiceMessage('emergency', lang));
        continue;
      }

      if (lowered === '14') {
        await replyMessage(event.replyToken, getServiceMessage('kpop', lang));
        continue;
      }

      if (lowered === '15') {
        try {
          const results = await searchEvents(userText, lang);
          await replyMessage(
            event.replyToken,
            getWeeklyCurationMessage(lang),
            results || buildNoMoreEventsMessage(lang)
          );
        } catch (err) {
          console.error('[Events] searchEvents failed:', err.message);
          await replyMessage(
            event.replyToken,
            getWeeklyCurationMessage(lang),
            buildNoMoreEventsMessage(lang)
          );
        }
        continue;
      }

      // ✅ 수정: replyToken 중복 제거 - prefixMessage로 통합
      if (lowered === '16') {
        await sendHumanHandoff(
          event.replyToken, userId, userText, lang, 'delivery',
          getServiceMessage('delivery', lang)
        );
        continue;
      }

      if (lowered === '17') {
        await sendHumanHandoff(
          event.replyToken, userId, userText, lang, 'visa',
          getServiceMessage('visa', lang)
        );
        continue;
      }

      if (lowered === '18') {
        await sendHumanHandoff(
          event.replyToken, userId, userText, lang, 'jobs',
          getServiceMessage('jobs', lang)
        );
        continue;
      }

      if (lowered === '19') {
        await sendHumanHandoff(
          event.replyToken, userId, userText, lang, 'guide',
          getServiceMessage('guide', lang)
        );
        continue;
      }

      if (lowered === '0') {
        await sendHumanHandoff(event.replyToken, userId, userText, lang, 'manual');
        continue;
      }

      if (isHumanRequest(userText)) {
        await sendHumanHandoff(event.replyToken, userId, userText, lang, 'manual');
        continue;
      }

      if (isAirportKeyword(userText)) {
        await replyMessage(event.replyToken, getServiceMessage('airport', lang));
        continue;
      }

      if (isInsuranceKeyword(userText)) {
        await replyMessage(event.replyToken, getServiceMessage('insurance', lang));
        continue;
      }

      if (isHospitalKeyword(userText)) {
        await replyMessage(event.replyToken, getServiceMessage('hospital', lang));
        continue;
      }

      // ✅ 수정: replyToken 중복 제거 - prefixMessage로 통합
      if (isTransportKeyword(userText)) {
        await sendHumanHandoff(
          event.replyToken, userId, userText, lang, 'transport',
          getServiceMessage('transport', lang)
        );
        continue;
      }

      if (isKpopKeyword(userText)) {
        await replyMessage(event.replyToken, getServiceMessage('kpop', lang));
        continue;
      }

      if (isShoppingKeyword(userText)) {
        await replyMessage(event.replyToken, getServiceMessage('shopping', lang), getAdMessage(lang, 'shopping'));
        continue;
      }

      if (isHalalKeyword(userText)) {
        if (savedLocation?.address) {
          await handleSearch(event.replyToken, savedLocation.address, 'halal', lang, userText);
        } else if (savedLocation?.lat && savedLocation?.lng) {
          const results = await searchNearby(savedLocation.lat, savedLocation.lng, 'halal');
          if (results) {
            const label = (TYPE_LABEL.halal || TYPE_LABEL.restaurant)[lang] || (TYPE_LABEL.halal || TYPE_LABEL.restaurant).en;
            await replyMessage(event.replyToken, `${label} nearby:\n\n${results}`, MAP_GUIDE[lang]);
          } else {
            setState(userId, 'awaiting_location_halal');
            await replyMessage(event.replyToken, ASK_LOCATION[lang] || ASK_LOCATION.en);
          }
        } else {
          setState(userId, 'awaiting_location_halal');
          await replyMessage(event.replyToken, ASK_LOCATION[lang] || ASK_LOCATION.en);
        }
        continue;
      }

      if (isPrayerKeyword(userText)) {
        if (savedLocation?.address) {
          await handleSearch(event.replyToken, savedLocation.address, 'prayer', lang, userText);
        } else if (savedLocation?.lat && savedLocation?.lng) {
          const results = await searchNearby(savedLocation.lat, savedLocation.lng, 'prayer');
          if (results) {
            const label = (TYPE_LABEL.prayer || TYPE_LABEL.halal)[lang] || (TYPE_LABEL.prayer || TYPE_LABEL.halal).en;
            await replyMessage(event.replyToken, `${label} nearby:\n\n${results}`, MAP_GUIDE[lang]);
          } else {
            setState(userId, 'awaiting_location_prayer');
            await replyMessage(event.replyToken, ASK_LOCATION[lang] || ASK_LOCATION.en);
          }
        } else {
          setState(userId, 'awaiting_location_prayer');
          await replyMessage(event.replyToken, ASK_LOCATION[lang] || ASK_LOCATION.en);
        }
        continue;
      }

      if (lowered === 'more' || lowered === 'more events') {
        try {
          const results = await searchEvents(userText, lang);
          await replyMessage(event.replyToken, results || buildNoMoreEventsMessage(lang));
        } catch (err) {
          console.error('[Events] more events failed:', err.message);
          await replyMessage(event.replyToken, buildNoMoreEventsMessage(lang));
        }
        continue;
      }

      if (currentState === 'awaiting_category') {
        let searchType = getSafeSearchType(detectSearchType(userText));
        if (isPrayerKeyword(userText)) searchType = 'prayer';
        if (isHalalKeyword(userText)) searchType = 'halal';

        setState(userId, null);
        const loc = getLocation(userId);

        if (loc?.lat && loc?.lng) {
          const results = await searchNearby(loc.lat, loc.lng, searchType);
          const label = (TYPE_LABEL[searchType] || TYPE_LABEL.restaurant)[lang] || (TYPE_LABEL[searchType] || TYPE_LABEL.restaurant).en;

          if (results) {
            await replyMessage(event.replyToken, `${label} nearby:\n\n${results}`, MAP_GUIDE[lang]);
          } else {
            await replyMessage(event.replyToken, getMainMenuMessage(lang));
          }
        } else if (loc?.address) {
          await handleSearch(event.replyToken, loc.address, searchType, lang, userText);
        } else {
          setState(userId, `awaiting_location_${searchType}`);
          await replyMessage(event.replyToken, ASK_LOCATION[lang] || ASK_LOCATION.en);
        }
        continue;
      }

      if (currentState?.startsWith('has_location:')) {
        const detectedLocation = currentState.replace('has_location:', '');
        let searchType = getSafeSearchType(detectSearchType(userText));
        if (isPrayerKeyword(userText)) searchType = 'prayer';
        if (isHalalKeyword(userText)) searchType = 'halal';

        setState(userId, null);
        await handleSearch(event.replyToken, detectedLocation, searchType, lang, userText);
        continue;
      }

      if (currentState?.startsWith('awaiting_location')) {
        if (isCategoryOnly(userText)) {
          let newType = getSafeSearchType(detectSearchType(userText));
          if (isPrayerKeyword(userText)) newType = 'prayer';
          if (isHalalKeyword(userText)) newType = 'halal';

          setState(userId, `awaiting_location_${newType}`);
          await replyMessage(event.replyToken, ASK_LOCATION[lang] || ASK_LOCATION.en);
          continue;
        }

        const savedType = currentState.replace('awaiting_location_', '');
        const searchType = getSafeSearchType(savedType || detectSearchType(userText));

        setState(userId, null);
        await handleSearch(event.replyToken, userText, searchType, lang, userText);
        continue;
      }

      if (savedLocation && isCategoryOnly(userText)) {
        let searchType = getSafeSearchType(detectSearchType(userText));
        if (isPrayerKeyword(userText)) searchType = 'prayer';
        if (isHalalKeyword(userText)) searchType = 'halal';

        if (savedLocation.address) {
          await handleSearch(event.replyToken, savedLocation.address, searchType, lang, userText);
        } else if (savedLocation.lat && savedLocation.lng) {
          const results = await searchNearby(savedLocation.lat, savedLocation.lng, searchType);
          const label = (TYPE_LABEL[searchType] || TYPE_LABEL.restaurant)[lang] || (TYPE_LABEL[searchType] || TYPE_LABEL.restaurant).en;

          if (results) {
            await replyMessage(event.replyToken, `${label} nearby:\n\n${results}`, MAP_GUIDE[lang]);
          } else {
            await replyMessage(event.replyToken, getMainMenuMessage(lang));
          }
        }
        continue;
      }

      if (isLocationRequest(userText)) {
        const routeDetectedType = detectSearchType(userText);
        let searchType = getSafeSearchType(routeDetectedType);
        const categoryExplicit = hasExplicitCategory(userText, routeDetectedType);

        if (isPrayerKeyword(userText)) searchType = 'prayer';
        if (isHalalKeyword(userText)) searchType = 'halal';

        if (savedLocation?.address) {
          if (categoryExplicit) {
            await handleSearch(event.replyToken, savedLocation.address, searchType, lang, userText);
          } else {
            setState(userId, 'awaiting_category');
            await replyMessage(event.replyToken, (ASK_CATEGORY[lang] || ASK_CATEGORY.en)(savedLocation.address));
          }
        } else if (savedLocation?.lat && savedLocation?.lng) {
          if (categoryExplicit) {
            const results = await searchNearby(savedLocation.lat, savedLocation.lng, searchType);
            const label = (TYPE_LABEL[searchType] || TYPE_LABEL.restaurant)[lang] || (TYPE_LABEL[searchType] || TYPE_LABEL.restaurant).en;

            if (results) {
              await replyMessage(event.replyToken, `${label} nearby:\n\n${results}`, MAP_GUIDE[lang]);
            } else {
              setState(userId, `awaiting_location_${searchType}`);
              await replyMessage(event.replyToken, ASK_LOCATION[lang] || ASK_LOCATION.en);
            }
          } else {
            setState(userId, 'awaiting_category');
            await replyMessage(event.replyToken, (ASK_CATEGORY[lang] || ASK_CATEGORY.en)('your location'));
          }
        } else {
          if (categoryExplicit) {
            setState(userId, `awaiting_location_${searchType}`);
            await replyMessage(event.replyToken, ASK_LOCATION[lang] || ASK_LOCATION.en);
          } else if (looksLikeLocation(userText)) {
            const cleanedLocation = cleanLocationText(userText);
            setLocation(userId, null, null, cleanedLocation);
            setState(userId, 'awaiting_category');
            await replyMessage(event.replyToken, (ASK_CATEGORY[lang] || ASK_CATEGORY.en)(cleanedLocation));
          } else {
            setState(userId, 'awaiting_category');
            await replyMessage(event.replyToken, ASK_LOCATION[lang] || ASK_LOCATION.en);
          }
        }
        continue;
      }

      const route = await detectIntent(userText, lang);

      if (route.intent === 'emergency') {
        await replyMessage(event.replyToken, getServiceMessage('emergency', lang));
        continue;
      }

      if (route.intent === 'events') {
        try {
          const results = await searchEvents(userText, lang);
          await replyMessage(
            event.replyToken,
            getWeeklyCurationMessage(lang),
            results || buildNoMoreEventsMessage(lang)
          );
        } catch (err) {
          console.error('[Events] detectIntent events failed:', err.message);
          await replyMessage(event.replyToken, getWeeklyCurationMessage(lang));
        }
        continue;
      }

      if (route.intent === 'places') {
        let searchType = getSafeSearchType(route.searchType || detectSearchType(userText));
        if (isPrayerKeyword(userText)) searchType = 'prayer';
        if (isHalalKeyword(userText)) searchType = 'halal';

        const areaText = cleanLocationText(userText);

        if (savedLocation?.address) {
          await handleSearch(event.replyToken, savedLocation.address, searchType, lang, userText);
        } else if (looksLikeLocation(areaText)) {
          await handleSearch(event.replyToken, areaText, searchType, lang, userText);
        } else {
          setState(userId, `awaiting_location_${searchType}`);
          await replyMessage(event.replyToken, ASK_LOCATION[lang] || ASK_LOCATION.en);
        }
        continue;
      }

      let aiReply = null;
      try {
        aiReply = await generateReply(userText, lang);
      } catch (err) {
        console.error('[AI] generateReply failed:', err.message);
      }

      if (!aiReply) {
        const session = { failCount: getState(`${userId}_failcount`) || 0 };
        const failCount = incrementFailCount(session);
        setState(`${userId}_failcount`, failCount);

        if (shouldEscalate(session)) {
          await sendHumanHandoff(event.replyToken, userId, userText, lang, 'threshold');
          setState(`${userId}_failcount`, 0);
        } else {
          await sendHumanHandoff(event.replyToken, userId, userText, lang, 'ai_fail');
        }
        continue;
      }

      setState(`${userId}_failcount`, 0);
      await replyMessage(event.replyToken, aiReply);
    }
  } catch (error) {
    console.error('Webhook error:', error.message);
  }
});

async function bootstrap() {
  try {
    await loadSheetsData();

    setInterval(async () => {
      try {
        await refreshSheetsData();
      } catch (err) {
        console.error('[Sheets] Refresh failed:', err.message);
      }
    }, 10 * 60 * 1000);

    app.listen(PORT, () => {
      console.log(`VirtualButler.Korea running on port ${PORT}`);
    });
  } catch (err) {
    console.error('[Startup] Failed to load Sheets:', err.message);
    app.listen(PORT, () => {
      console.log(`VirtualButler.Korea running on port ${PORT} (without sheets)`);
    });
  }
}

bootstrap();
