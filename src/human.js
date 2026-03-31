import crypto from 'crypto';
import dotenv from 'dotenv';
import express from 'express';

import {
  getSession,
  setSession,
  getLocation,
  setLocation,
  getState,
  setState,
} from './src/session.js';

import {
  normalizeLanguageChoice,
  languageSelectionMessage,
  getMainMenuMessage,
  getMapWelcomeMessage,
  getServiceMenuMessage,
} from './src/language.js';

import { isEmergency, emergencyReply } from './src/emergency.js';
import { generateReply } from './src/ai.js';
import { analyzeImage } from './src/vision.js';
import { isLocationRequest, locationReceivedMessage, detectSearchType } from './src/location.js';
import { searchNearby, searchByKeyword, TYPE_LABEL } from './src/places.js';
import { isEventRequest, searchEvents } from './src/events.js';
import { detectIntent } from './src/router.js';
import {
  isHumanRequest,
  incrementFailCount,
  shouldEscalate,
  notifyHumanViaLine,
} from './src/human.js';

import {
  MAP_LINK,
  MAP_INTRO,
  WEEKLY_CURATION,
  SERVICE_CATALOG,
  AD_SLOTS,
  getWeeklyCurationMessage,
  getServiceMessage,
  getAdMessage,
} from './src/curation.js';

dotenv.config();

const { PORT = 3000, LINE_CHANNEL_SECRET, LINE_CHANNEL_ACCESS_TOKEN } = process.env;

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

  if (messages.length === 0) return;

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
    .replace(/^찾아줘\s+/i, '')
    .trim();
}

function isCategoryOnly(text = '') {
  const categories = [
    'hotel', 'hotels', 'restaurant', 'restaurants', 'cafe', 'cafes',
    'coffee', 'pharmacy', 'hospital', 'clinic', 'halal', 'food', 'eat',
    'movie', 'cinema', 'theater', 'theatre', 'museum', 'gallery',
    'convenience', 'mart', 'supermarket', 'bank', 'atm',
    'parking', 'gas', 'gas station', 'attraction',
    'halal food', 'halal restaurant',
    'prayer', 'prayer room', 'mosque', 'masjid', 'musholla', 'musolla', 'tempat sholat',
    'hotel', 'restoran', 'kafe', 'apotek', 'rumah sakit', 'makanan halal',
    '쇼핑', '할랄', '맛집', '식당', '카페', '병원', '약국', '호텔', '기도실', '모스크',
  ];
  const t = text.trim().toLowerCase();
  return categories.some((c) => t === c);
}

function looksLikeLocation(text = '') {
  const t = text.trim().toLowerCase();
  if (!t) return false;

  const keywords = [
    'station', 'stn', 'exit', 'dong', 'gu', 'ro', 'gil',
    '역', '동', '구', '로', '길',
  ];

  if (keywords.some((k) => t.includes(k))) return true;
  return text.trim().length <= 30 && /^[a-zA-Z0-9\s\-]+$/.test(text.trim());
}

function getSafeSearchType(searchType = '') {
  const allowed = [
    'restaurant', 'cafe', 'convenience', 'culture', 'hotel',
    'attraction', 'subway', 'bank', 'mart', 'hospital',
    'pharmacy', 'public', 'school', 'gas', 'parking', 'halal',
  ];
  return allowed.includes(searchType) ? searchType : 'restaurant';
}

function hasExplicitCategory(text = '', routeSearchType = '') {
  if (routeSearchType && routeSearchType !== 'restaurant') return true;

  const categoryWords = [
    'hotel', 'cafe', 'coffee', 'pharmacy', 'hospital', 'clinic', 'halal',
    'movie', 'cinema', 'theater', 'museum', 'gallery',
    'convenience', 'mart', 'bank', 'atm', 'parking', 'gas',
    'prayer', 'prayer room', 'mosque', 'masjid', 'musholla', 'musolla',
    'restoran', 'kafe', 'apotek', 'rumah sakit', 'makanan halal',
    '할랄', '맛집', '식당', '카페', '병원', '약국', '호텔', '기도실', '모스크',
  ];

  const t = text.toLowerCase();
  return categoryWords.some((w) => t.includes(w));
}

function isPrayerRequest(text = '') {
  const t = text.trim().toLowerCase();
  const keywords = [
    '3',
    'prayer', 'prayer room', 'mosque', 'masjid', 'tempat sholat',
    'shalat', 'musholla', 'musolla',
    '기도', '기도실', '모스크',
  ];
  return keywords.some((k) => t === k || t.includes(k));
}

function isHalalRequest(text = '') {
  const t = text.trim().toLowerCase();
  const keywords = [
    '2',
    'halal', 'halal food', 'halal restaurant',
    'makanan halal', 'restoran halal',
    '할랄', '할랄 음식', '할랄 식당',
  ];
  return keywords.some((k) => t === k || t.includes(k));
}

function isShoppingRequest(text = '') {
  const t = text.trim().toLowerCase();
  const keywords = [
    '5',
    'shopping', 'discount', 'sale', 'tax free', 'cosmetics',
    'belanja', 'diskon',
    '쇼핑', '할인', '면세',
  ];
  return keywords.some((k) => t === k || t.includes(k));
}

function isMenuRequest(text = '') {
  const t = text.trim().toLowerCase();
  const keywords = [
    'menu', 'start', 'home', 'options', '0', 'back',
    'mulai', 'bantuan', 'kembali',
    '메뉴', '처음', '홈',
  ];
  return keywords.some((k) => t === k || t.includes(k));
}

function isServiceMenuRequest(text = '') {
  const t = text.trim().toLowerCase();
  return t === '6' || t.includes('service') || t.includes('layanan') || t.includes('서비스');
}

function isVisaRequest(text = '') {
  const t = text.trim().toLowerCase();
  return t === '7' || t.includes('visa') || t.includes('extension') || t.includes('visa extension') || t.includes('perpanjang visa') || t.includes('비자');
}

function isJobRequest(text = '') {
  const t = text.trim().toLowerCase();
  return t === '8' || t.includes('job') || t.includes('work') || t.includes('recruit') || t.includes('lowongan') || t.includes('kerja') || t.includes('직업') || t.includes('구인');
}

function isDeliveryRequest(text = '') {
  const t = text.trim().toLowerCase();
  return t === '9' || t.includes('delivery') || t.includes('send package') || t.includes('barang') || t.includes('courier') || t.includes('물품') || t.includes('배달');
}

function isGuideRequest(text = '') {
  const t = text.trim().toLowerCase();
  return t === '10' || t.includes('guide') || t.includes('day guide') || t.includes('tour guide') || t.includes('pendamping') || t.includes('가이드');
}

const ASK_LOCATION = {
  en: '📍 Which area are you in?\n(e.g. Gangnam / Hongdae / Yongsan / Myeongdong)',
  id: '📍 Kamu ada di area mana?\n(contoh: Gangnam / Hongdae / Yongsan / Myeongdong)',
};

const ASK_CATEGORY = {
  en: (area) =>
    `📍 I see you're near "${area}"!\nWhat are you looking for?\n\n2️⃣ Halal food\n3️⃣ Prayer room / Mosque\n4️⃣ Events\n5️⃣ Shopping / deals\n6️⃣ More services`,
  id: (area) =>
    `📍 Saya lihat kamu dekat "${area}"!\nKamu cari apa?\n\n2️⃣ Makanan halal\n3️⃣ Tempat sholat / Masjid\n4️⃣ Event hari ini\n5️⃣ Shopping / promo\n6️⃣ Layanan lainnya`,
};

const MAP_GUIDE = {
  en: '🗺️ Tap the link to open directions.',
  id: '🗺️ Klik link untuk buka petunjuk arah.',
};

const HUMAN_HANDOFF_MESSAGE = {
  en: `👤 Connecting you to our team now.
Please stay in this chat.

🔒 For your safety, do not share personal contact details.`,
  id: `👤 Kami sedang menghubungkan kamu ke tim kami.
Mohon tetap di chat ini.

🔒 Demi keamanan, jangan bagikan kontak pribadi.`,
};

const HUMAN_WAITING_MESSAGE = {
  en: `👤 Our team has already been notified.
Please wait here a moment.`,
  id: `👤 Tim kami sudah diberi tahu.
Mohon tunggu sebentar di chat ini.`,
};

async function sendHumanHandoff(replyToken, userId, userText, lang, reason) {
  const currentState = getState(userId);

  if (currentState === 'waiting_human') {
    await replyMessage(replyToken, HUMAN_WAITING_MESSAGE[lang] || HUMAN_WAITING_MESSAGE.en);
    return;
  }

  await notifyHumanViaLine({
    userId,
    userMessage: userText,
    lang,
    reason,
  });

  setState(userId, 'waiting_human');
  await replyMessage(replyToken, HUMAN_HANDOFF_MESSAGE[lang] || HUMAN_HANDOFF_MESSAGE.en);
}

async function handleSearch(replyToken, areaText, searchType, lang, originalUserText = '') {
  try {
    const results = await searchByKeyword(areaText, searchType);
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
      en: `😅 No results near "${areaText}". Try another area!`,
      id: `😅 Tidak ada hasil dekat "${areaText}". Coba area lain ya!`,
    };
    await replyMessage(replyToken, notFound[lang] || notFound.en);
  } catch (err) {
    console.error('Search failed:', err.message);
    await replyMessage(replyToken, await generateReply(originalUserText || areaText, lang));
  }
}

async function translateClarify(question, lang) {
  if (!question || lang === 'en') return question;

  try {
    return await generateReply(
      `Translate this short question naturally into Indonesian. Output only the translation:\n"${question}"`,
      'id'
    );
  } catch {
    return question;
  }
}

app.get('/', (req, res) => {
  res.status(200).send('VirtualButler.Korea is running 🇰🇷');
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

      if (event.message.type === 'location') {
        const { latitude, longitude, address } = event.message;
        const currentState = getState(userId);
        const wantedType = currentState && currentState.startsWith('awaiting_location_')
          ? currentState.replace('awaiting_location_', '')
          : null;

        setLocation(userId, latitude, longitude, address || '');
        setState(userId, null);

        if (wantedType && wantedType !== 'unknown') {
          try {
            const actualType = wantedType === 'prayer' ? 'halal' : wantedType;
            const results = await searchNearby(latitude, longitude, actualType);
            const labelObj = TYPE_LABEL[actualType] || TYPE_LABEL.restaurant;
            const label = labelObj[lang || 'en'] || labelObj.en;

            if (results) {
              await replyMessage(
                event.replyToken,
                `${label} nearby:\n\n${results}`,
                wantedType === 'prayer'
                  ? MAP_LINK
                  : (MAP_GUIDE[lang || 'en'] || MAP_GUIDE.en)
              );
            } else {
              await replyMessage(
                event.replyToken,
                locationReceivedMessage(lang || 'en', address || 'Current location')
              );
            }
          } catch (err) {
            await replyMessage(
              event.replyToken,
              locationReceivedMessage(lang || 'en', address || 'Current location')
            );
          }
        } else {
          setState(userId, 'awaiting_category');
          const askCat = ASK_CATEGORY[lang || 'id'] || ASK_CATEGORY.id;
          await replyMessage(event.replyToken, askCat(address || 'your location'));
        }
        continue;
      }

      if (event.message.type === 'image') {
        if (!lang) {
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
              ASK_CATEGORY[lang](detectedLocation)
            );
          } else {
            setState(userId, 'awaiting_location_unknown');
            const followUp = {
              en: `📍 I couldn't detect the location clearly.\nPlease type your area.\n(e.g. Gangnam / Hongdae / Myeongdong)`,
              id: `📍 Saya belum bisa membaca lokasinya dengan jelas.\nTolong ketik area kamu.\n(contoh: Gangnam / Hongdae / Myeongdong)`,
            };
            await replyMessage(event.replyToken, analysisText, followUp[lang] || followUp.en);
          }
        } catch (err) {
          console.error('Image analysis failed:', err.message);
          const errorMsg = {
            en: '⚠️ Sorry, I could not analyze the image. Please try again.',
            id: '⚠️ Maaf, saya belum bisa menganalisis gambar itu. Coba lagi ya.',
          };
          await replyMessage(event.replyToken, errorMsg[lang] || errorMsg.en);
        }
        continue;
      }

      if (event.message.type !== 'text') continue;

      const userText = (event.message.text || '').trim();
      const lowered = userText.toLowerCase();
      console.log(`[${userId}] ${userText}`);

      const selectedLang = normalizeLanguageChoice(userText);
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
        await replyMessage(event.replyToken, languageSelectionMessage());
        continue;
      }

      const currentState = getState(userId);
      const savedLocation = getLocation(userId);

      if (currentState === 'waiting_human') {
        if (isHumanRequest(userText) || lowered === '0') {
          await replyMessage(event.replyToken, HUMAN_WAITING_MESSAGE[lang] || HUMAN_WAITING_MESSAGE.en);
          continue;
        }
      }

      if (isMenuRequest(userText)) {
        await replyMessage(event.replyToken, getMainMenuMessage(lang));
        continue;
      }

      if (routeSafeEmergency(userText)) {
        await replyMessage(event.replyToken, emergencyReply(lang));
        continue;
      }

      if (lowered === '1') {
        await replyMessage(
          event.replyToken,
          getMapWelcomeMessage(lang),
          getAdMessage(lang, 'main'),
          getMainMenuMessage(lang)
        );
        continue;
      }

      if (lowered === '2' || isHalalRequest(userText)) {
        if (savedLocation?.address) {
          await handleSearch(event.replyToken, savedLocation.address, 'halal', lang, userText);
        } else if (savedLocation?.lat && savedLocation?.lng) {
          const results = await searchNearby(savedLocation.lat, savedLocation.lng, 'halal');
          if (results) {
            const labelObj = TYPE_LABEL.halal || TYPE_LABEL.restaurant;
            const label = labelObj[lang] || labelObj.en;
            await replyMessage(event.replyToken, `${label} nearby:\n\n${results}`, MAP_GUIDE[lang] || MAP_GUIDE.en);
          } else {
            setState(userId, 'awaiting_location_halal');
            await replyMessage(
              event.replyToken,
              MAP_INTRO[lang] || MAP_INTRO.en,
              MAP_LINK,
              ASK_LOCATION[lang] || ASK_LOCATION.en
            );
          }
        } else {
          setState(userId, 'awaiting_location_halal');
          await replyMessage(
            event.replyToken,
            MAP_INTRO[lang] || MAP_INTRO.en,
            MAP_LINK,
            ASK_LOCATION[lang] || ASK_LOCATION.en
          );
        }
        continue;
      }

      if (lowered === '3' || isPrayerRequest(userText)) {
        setState(userId, 'awaiting_location_prayer');
        await replyMessage(
          event.replyToken,
          getServiceMessage('prayer', lang),
          MAP_LINK,
          ASK_LOCATION[lang] || ASK_LOCATION.en
        );
        continue;
      }

      if (lowered === '4' || isEventRequest(userText)) {
        const curated = getWeeklyCurationMessage(lang);
        const adText = getAdMessage(lang, 'events');
        await replyMessage(event.replyToken, curated, adText, buildMoreEventsPrompt(lang));
        continue;
      }

      if (lowered === '4 more' || lowered === 'more events' || lowered === 'more') {
        try {
          const results = await searchEvents(userText, lang);
          if (results) {
            await replyMessage(event.replyToken, results);
          } else {
            await replyMessage(event.replyToken, buildNoMoreEventsMessage(lang));
          }
        } catch (err) {
          console.error('Event search failed:', err.message);
          await replyMessage(event.replyToken, buildNoMoreEventsMessage(lang));
        }
        continue;
      }

      if (lowered === '5' || isShoppingRequest(userText)) {
        await replyMessage(
          event.replyToken,
          getServiceMessage('shopping', lang),
          getAdMessage(lang, 'shopping')
        );
        continue;
      }

      if (lowered === '6' || isServiceMenuRequest(userText)) {
        await replyMessage(event.replyToken, getServiceMenuMessage(lang));
        continue;
      }

      if (isVisaRequest(userText)) {
        await replyMessage(event.replyToken, getServiceMessage('visa', lang));
        await sendHumanHandoff(event.replyToken, userId, userText, lang, 'visa');
        continue;
      }

      if (isJobRequest(userText)) {
        await replyMessage(event.replyToken, getServiceMessage('jobs', lang));
        await sendHumanHandoff(event.replyToken, userId, userText, lang, 'jobs');
        continue;
      }

      if (isDeliveryRequest(userText)) {
        await replyMessage(event.replyToken, getServiceMessage('delivery', lang));
        await sendHumanHandoff(event.replyToken, userId, userText, lang, 'delivery');
        continue;
      }

      if (isGuideRequest(userText)) {
        await replyMessage(event.replyToken, getServiceMessage('guide', lang));
        await sendHumanHandoff(event.replyToken, userId, userText, lang, 'guide');
        continue;
      }

      if (lowered === '0' || isHumanRequest(userText)) {
        await sendHumanHandoff(event.replyToken, userId, userText, lang, 'manual');
        continue;
      }

      if (currentState === 'awaiting_category') {
        let searchType = getSafeSearchType(detectSearchType(userText));

        if (isPrayerRequest(userText)) searchType = 'halal';
        if (isHalalRequest(userText)) searchType = 'halal';

        setState(userId, null);
        const loc = getLocation(userId);

        if (loc?.lat && loc?.lng) {
          const results = await searchNearby(loc.lat, loc.lng, searchType);
          const labelObj = TYPE_LABEL[searchType] || TYPE_LABEL.restaurant;
          const label = labelObj[lang] || labelObj.en;
          if (results) {
            await replyMessage(event.replyToken, `${label} nearby:\n\n${results}`, MAP_GUIDE[lang] || MAP_GUIDE.en);
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

      if (currentState && currentState.startsWith('has_location:')) {
        const detectedLocation = currentState.replace('has_location:', '');
        let searchType = getSafeSearchType(detectSearchType(userText));

        if (isPrayerRequest(userText)) searchType = 'halal';
        if (isHalalRequest(userText)) searchType = 'halal';

        setState(userId, null);
        await handleSearch(event.replyToken, detectedLocation, searchType, lang, userText);
        continue;
      }

      if (currentState && currentState.startsWith('awaiting_location')) {
        if (isCategoryOnly(userText)) {
          let newSearchType = getSafeSearchType(detectSearchType(userText));
          if (isPrayerRequest(userText)) newSearchType = 'halal';
          if (isHalalRequest(userText)) newSearchType = 'halal';

          setState(userId, `awaiting_location_${newSearchType}`);
          await replyMessage(event.replyToken, ASK_LOCATION[lang] || ASK_LOCATION.en);
          continue;
        }

        let savedType = currentState.replace('awaiting_location_', '');
        if (savedType === 'prayer') savedType = 'halal';

        const searchType = getSafeSearchType(savedType || detectSearchType(userText));

        setState(userId, null);

        if (savedType === 'prayer') {
          setLocation(userId, null, null, userText);
          await replyMessage(event.replyToken, getServiceMessage('prayer', lang), MAP_LINK);
          continue;
        }

        await handleSearch(event.replyToken, userText, searchType, lang, userText);
        continue;
      }

      if (savedLocation && isCategoryOnly(userText)) {
        let searchType = getSafeSearchType(detectSearchType(userText));
        if (isPrayerRequest(userText)) searchType = 'halal';
        if (isHalalRequest(userText)) searchType = 'halal';

        if (savedLocation.address) {
          await handleSearch(event.replyToken, savedLocation.address, searchType, lang, userText);
        } else if (savedLocation.lat && savedLocation.lng) {
          const results = await searchNearby(savedLocation.lat, savedLocation.lng, searchType);
          const labelObj = TYPE_LABEL[searchType] || TYPE_LABEL.restaurant;
          const label = labelObj[lang] || labelObj.en;
          if (results) {
            await replyMessage(event.replyToken, `${label} nearby:\n\n${results}`, MAP_GUIDE[lang] || MAP_GUIDE.en);
          } else {
            await replyMessage(event.replyToken, getMainMenuMessage(lang));
          }
        }
        continue;
      }

      if (isLocationRequest(userText)) {
        const searchType = getSafeSearchType(detectSearchType(userText));
        const categoryExplicit = hasExplicitCategory(userText);

        if (savedLocation?.address) {
          if (categoryExplicit) {
            await handleSearch(event.replyToken, savedLocation.address, searchType, lang, userText);
          } else {
            setState(userId, 'awaiting_category');
            await replyMessage(event.replyToken, ASK_CATEGORY[lang](savedLocation.address));
          }
        } else if (savedLocation?.lat && savedLocation?.lng) {
          if (categoryExplicit) {
            const results = await searchNearby(savedLocation.lat, savedLocation.lng, searchType);
            const labelObj = TYPE_LABEL[searchType] || TYPE_LABEL.restaurant;
            const label = labelObj[lang] || labelObj.en;
            if (results) {
              await replyMessage(event.replyToken, `${label} nearby:\n\n${results}`, MAP_GUIDE[lang] || MAP_GUIDE.en);
            } else {
              setState(userId, `awaiting_location_${searchType}`);
              await replyMessage(event.replyToken, ASK_LOCATION[lang] || ASK_LOCATION.en);
            }
          } else {
            setState(userId, 'awaiting_category');
            await replyMessage(event.replyToken, ASK_CATEGORY[lang]('your location'));
          }
        } else {
          if (categoryExplicit) {
            setState(userId, `awaiting_location_${searchType}`);
            await replyMessage(event.replyToken, ASK_LOCATION[lang] || ASK_LOCATION.en);
          } else if (looksLikeLocation(userText)) {
            const cleanedLocation = cleanLocationText(userText);
            setLocation(userId, null, null, cleanedLocation);
            setState(userId, 'awaiting_category');
            await replyMessage(event.replyToken, ASK_CATEGORY[lang](cleanedLocation));
          } else {
            setState(userId, 'awaiting_category');
            await replyMessage(event.replyToken, ASK_LOCATION[lang] || ASK_LOCATION.en);
          }
        }
        continue;
      }

      const route = await detectIntent(userText, lang);

      if (route.intent === 'emergency' || isEmergency(userText)) {
        await replyMessage(event.replyToken, emergencyReply(lang));
        continue;
      }

      if (route.intent === 'events') {
        try {
          const curated = getWeeklyCurationMessage(lang);
          const results = await searchEvents(userText, lang);
          if (results) {
            await replyMessage(event.replyToken, curated, results);
          } else {
            await replyMessage(event.replyToken, curated, buildNoMoreEventsMessage(lang));
          }
        } catch (err) {
          console.error('Event search failed:', err.message);
          await replyMessage(event.replyToken, getWeeklyCurationMessage(lang));
        }
        continue;
      }

      if (route.intent === 'places') {
        const searchType = getSafeSearchType(route.searchType || detectSearchType(userText));
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
        console.error('AI error:', err.message);
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
    console.error('Error:', error.message);
  }
});

function routeSafeEmergency(userText = '') {
  return isEmergency(userText);
}

function buildMoreEventsPrompt(lang) {
  const map = {
    en: 'Type "more" if you want more event results from the Korea tourism feed.',
    id: 'Ketik "more" kalau kamu mau lihat event tambahan dari feed pariwisata Korea.',
  };
  return map[lang] || map.en;
}

function buildNoMoreEventsMessage(lang) {
  const map = {
    en: '😅 I could not find more event data right now. Please check our curated map updates first.',
    id: '😅 Saya belum menemukan event tambahan saat ini. Coba cek update map kami dulu ya.',
  };
  return map[lang] || map.en;
}

app.listen(PORT, () => {
  console.log(`VirtualButler.Korea running on port ${PORT}`);
});
