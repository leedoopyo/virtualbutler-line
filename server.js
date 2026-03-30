import crypto from 'crypto';
import dotenv from 'dotenv';
import express from 'express';

import { getSession, setSession, getLocation, setLocation, getState, setState } from './src/session.js';
import { normalizeLanguageChoice, languageSelectionMessage, welcomeMessage } from './src/language.js';
import { isEmergency, emergencyReply } from './src/emergency.js';
import { generateReply } from './src/ai.js';
import { analyzeImage } from './src/vision.js';
import { isLocationRequest, locationReceivedMessage, detectSearchType } from './src/location.js';
import { searchNearby, searchByKeyword, TYPE_LABEL } from './src/places.js';
import { isEventRequest, searchEvents } from './src/events.js';
import { detectIntent } from './src/router.js';

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
    '호텔', '식당', '맛집', '카페', '약국', '병원', '음식', '할랄',
    '영화관', '박물관', '편의점', '마트', '은행', '주차장', '주유소',
    'khách sạn', 'nhà hàng', 'cà phê', 'nhà thuốc',
    'restoran', 'apotek', 'kafe', 'makanan', 'makanan halal',
    'буудал', 'ресторан', 'эмийн сан', 'эмнэлэг',
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
    'pharmacy', 'public', 'school', 'gas', 'parking', 'halal'
  ];
  return allowed.includes(searchType) ? searchType : 'restaurant';
}

function hasExplicitCategory(text = '', routeSearchType = '') {
  if (routeSearchType && routeSearchType !== 'restaurant') return true;
  const categoryWords = [
    'hotel', 'cafe', 'coffee', 'pharmacy', 'hospital', 'clinic', 'halal',
    'movie', 'cinema', 'theater', 'museum', 'gallery',
    'convenience', 'mart', 'bank', 'atm', 'parking', 'gas',
    '호텔', '카페', '약국', '병원', '할랄', '영화관', '편의점', '마트', '은행',
    'khách sạn', 'cà phê', 'nhà thuốc', 'bệnh viện',
    'apotek', 'makanan halal',
    'буудал', 'кафе', 'эмийн сан', 'эмнэлэг',
  ];
  const t = text.toLowerCase();
  return categoryWords.some(w => t.includes(w));
}

const ASK_LOCATION = {
  en: '📍 Which area are you in?\n(e.g. Gangnam / Hongdae / Yongsan / Myeongdong)',
  vi: '📍 Bạn đang ở khu vực nào?\n(vd: Gangnam / Hongdae / Yongsan)',
  id: '📍 Anda di area mana?\n(cth: Gangnam / Hongdae / Yongsan)',
  mn: '📍 Та аль хороонд байна вэ?\n(жш: Gangnam / Hongdae / Yongsan)',
};

const ASK_CATEGORY = {
  en: (area) => `📍 I see you're near "${area}"!\nWhat are you looking for?\n\n🍜 Restaurant\n☕ Cafe\n🏨 Hotel\n🎭 Movie theater / Museum\n💊 Pharmacy\n🏥 Hospital\n🕌 Halal food\n🏪 Convenience store\n🏦 Bank\n🅿️ Parking`,
  vi: (area) => `📍 Bạn đang ở gần "${area}"!\nBạn đang tìm gì?\n\n🍜 Nhà hàng\n☕ Cà phê\n🏨 Khách sạn\n🎭 Rạp chiếu phim / Bảo tàng\n💊 Nhà thuốc\n🏥 Bệnh viện\n🕌 Đồ halal\n🏪 Cửa hàng tiện lợi\n🏦 Ngân hàng\n🅿️ Bãi đỗ xe`,
  id: (area) => `📍 Anda dekat "${area}"!\nAnda mencari apa?\n\n🍜 Restoran\n☕ Kafe\n🏨 Hotel\n🎭 Bioskop / Museum\n💊 Apotek\n🏥 Rumah sakit\n🕌 Makanan halal\n🏪 Minimarket\n🏦 Bank\n🅿️ Parkir`,
  mn: (area) => `📍 Та "${area}" орчимд байна!\nЮу хайж байна вэ?\n\n🍜 Ресторан\n☕ Кафе\n🏨 Зочид буудал\n🎭 Кино театр / Музей\n💊 Эмийн сан\n🏥 Эмнэлэг\n🕌 Халал хоол\n🏪 Дэлгүүр\n🏦 Банк\n🅿️ Зогсоол`,
};

const MAP_GUIDE = {
  en: '🗺️ Tap the link to open in Kakao Map and get directions!',
  vi: '🗺️ Nhấn vào link để mở Kakao Map và chỉ đường!',
  id: '🗺️ Ketuk link untuk membuka Kakao Map dan petunjuk arah!',
  mn: '🗺️ Линк дээр дарж Kakao Map дээр нээж чиглэл авна уу!',
};

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
    } else {
      const notFound = {
        en: `😅 No results near "${areaText}". Try another area!`,
        vi: `😅 Không tìm thấy gần "${areaText}". Thử khu vực khác!`,
        id: `😅 Tidak ada hasil dekat "${areaText}". Coba area lain!`,
        mn: `😅 "${areaText}" орчимд үр дүн олдсонгүй. Өөр газар оруулна уу!`,
      };
      await replyMessage(replyToken, notFound[lang] || notFound.en);
    }
  } catch (err) {
    console.error('Search failed:', err.message);
    await replyMessage(replyToken, await generateReply(originalUserText || areaText, lang));
  }
}

async function translateClarify(question, lang) {
  if (!question || lang === 'en') return question;
  try {
    return await generateReply(
      `Translate this short question naturally into the target language. Output only the translation:\n"${question}"`,
      lang
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

      // ── 위치 메시지 처리 ──
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
            const results = await searchNearby(latitude, longitude, wantedType);
            const labelObj = TYPE_LABEL[wantedType] || TYPE_LABEL.restaurant;
            const label = labelObj[lang || 'en'] || labelObj.en;
            if (results) {
              await replyMessage(event.replyToken, `${label} nearby:\n\n${results}`, MAP_GUIDE[lang || 'en']);
            } else {
              await replyMessage(event.replyToken, locationReceivedMessage(lang || 'en', address || 'Current location'));
            }
          } catch (err) {
            await replyMessage(event.replyToken, locationReceivedMessage(lang || 'en', address || 'Current location'));
          }
        } else {
          setState(userId, 'awaiting_category');
          const askCat = ASK_CATEGORY[lang || 'en'] || ASK_CATEGORY.en;
          await replyMessage(event.replyToken, askCat(address || 'your location'));
        }
        continue;
      }

      // ── 이미지 메시지 처리 ──
      if (event.message.type === 'image') {
        if (!lang) {
          await replyMessage(event.replyToken, languageSelectionMessage());
          continue;
        }
        try {
          const { text: analysisText, location: detectedLocation } = await analyzeImage(event.message.id, lang);

          if (detectedLocation && detectedLocation.toLowerCase() !== 'unknown') {
            setState(userId, 'has_location:' + detectedLocation);
            const followUp = {
              en: `📍 I can see you're near "${detectedLocation}"!\nWhat do you need?\n(e.g. "hotel" / "restaurant" / "movie theater")`,
              vi: `📍 Tôi thấy bạn đang ở gần "${detectedLocation}"!\nBạn cần gì?\n(vd: "hotel" / "nhà hàng" / "rạp chiếu phim")`,
              id: `📍 Saya lihat Anda dekat "${detectedLocation}"!\nAnda butuh apa?\n(cth: "hotel" / "restoran" / "bioskop")`,
              mn: `📍 Та "${detectedLocation}" орчимд байна!\nЮу хэрэгтэй вэ?\n(жш: "hotel" / "ресторан" / "кино театр")`,
            };
            await replyMessage(event.replyToken, analysisText, followUp[lang] || followUp.en);
          } else {
            setState(userId, 'awaiting_location_unknown');
            const followUp = {
              en: `📍 Want to find nearby places?\nType area name + what you need!\n(e.g. "Gangnam hotel" / "Hongdae restaurant")`,
              vi: `📍 Muốn tìm nơi gần đây?\nNhập tên khu vực + nhu cầu!\n(vd: "Gangnam hotel" / "Hongdae nhà hàng")`,
              id: `📍 Ingin mencari tempat terdekat?\nKetik nama area + kebutuhan!\n(cth: "Gangnam hotel" / "Hongdae restoran")`,
              mn: `📍 Ойролцоох газар хайх уу?\nГазрын нэр + хэрэгцээгээ бичнэ үү!\n(жш: "Gangnam hotel" / "Hongdae ресторан")`,
            };
            await replyMessage(event.replyToken, analysisText, followUp[lang] || followUp.en);
          }
        } catch (err) {
          console.error('Image analysis failed:', err.message);
          const errorMsg = {
            en: '⚠️ Sorry, I could not analyze the image. Please try again.',
            vi: '⚠️ Xin lỗi, tôi không thể phân tích ảnh. Vui lòng thử lại.',
            id: '⚠️ Maaf, saya tidak bisa menganalisis gambar. Silakan coba lagi.',
            mn: '⚠️ Уучлаарай, зургийг шинжлэх боломжгүй байна. Дахин оролдоно уу.',
          };
          await replyMessage(event.replyToken, errorMsg[lang] || errorMsg.en);
        }
        continue;
      }

      // ── 텍스트 메시지 처리 ──
      if (event.message.type !== 'text') continue;

      const userText = (event.message.text || '').trim();
      console.log(`[${userId}] ${userText}`);

      // 1. 언어 선택
      const selectedLang = normalizeLanguageChoice(userText);
      if (selectedLang) {
        setSession(userId, selectedLang);
        setState(userId, null);
        await replyMessage(event.replyToken, welcomeMessage(selectedLang));
        continue;
      }

      // 2. 언어 미선택
      if (!lang) {
        await replyMessage(event.replyToken, languageSelectionMessage());
        continue;
      }

      const currentState = getState(userId);
      const savedLocation = getLocation(userId);

      // 3. AI 라우팅
      const route = await detectIntent(userText, lang);
      console.log('AI route:', route);

      // 4. 긴급 상황 (최우선)
      if (route.intent === 'emergency' || isEmergency(userText)) {
        await replyMessage(event.replyToken, emergencyReply(lang));
        continue;
      }

      // 5. 문화행사 검색
      if (route.intent === 'events' || isEventRequest(userText)) {
        try {
          const results = await searchEvents(userText, lang);
          if (results) {
            await replyMessage(event.replyToken, results, MAP_GUIDE[lang] || MAP_GUIDE.en);
          } else {
            const notFound = {
              en: '😅 No events found. Try "Seoul concert" or "Busan festival".',
              vi: '😅 Không tìm thấy sự kiện. Thử "Seoul concert" hoặc "Busan festival".',
              id: '😅 Tidak ada acara. Coba "Seoul concert" atau "Busan festival".',
              mn: '😅 Арга хэмжээ олдсонгүй. "Seoul concert" эсвэл "Busan festival" гэж хайна уу.',
            };
            await replyMessage(event.replyToken, notFound[lang] || notFound.en);
          }
        } catch (err) {
          console.error('Event search failed:', err.message);
          await replyMessage(event.replyToken, await generateReply(userText, lang));
        }
        continue;
      }

      // 6. 카테고리 대기 상태
      if (currentState === 'awaiting_category') {
        // clarifyQuestion 있으면 먼저 확인 질문
        if (route.clarifyQuestion) {
          const translated = await translateClarify(route.clarifyQuestion, lang);
          setState(userId, 'awaiting_clarify:' + (route.searchType || 'general'));
          await replyMessage(event.replyToken, translated);
          continue;
        }

        const searchType = getSafeSearchType(route.searchType || detectSearchType(userText));
        setState(userId, null);
        const loc = getLocation(userId);
        if (loc?.lat && loc?.lng) {
          const results = await searchNearby(loc.lat, loc.lng, searchType);
          const labelObj = TYPE_LABEL[searchType] || TYPE_LABEL.restaurant;
          const label = labelObj[lang] || labelObj.en;
          if (results) {
            await replyMessage(event.replyToken, `${label} nearby:\n\n${results}`, MAP_GUIDE[lang] || MAP_GUIDE.en);
          } else {
            await replyMessage(event.replyToken, await generateReply(userText, lang));
          }
        } else if (loc?.address) {
          await handleSearch(event.replyToken, loc.address, searchType, lang, userText);
        } else {
          setState(userId, 'awaiting_location_' + searchType);
          await replyMessage(event.replyToken, ASK_LOCATION[lang] || ASK_LOCATION.en);
        }
        continue;
      }

      // 7. 명확화 대기 상태 (yes/no 응답)
      if (currentState && currentState.startsWith('awaiting_clarify:')) {
        const pendingType = currentState.replace('awaiting_clarify:', '');
        const t = userText.toLowerCase();
        const isYes = t.includes('yes') || t.includes('네') || t.includes('응') ||
          t.includes('yeah') || t.includes('yep') || t.includes('맞아') || t.includes('그래');

        if (isYes) {
          setState(userId, null);
          const searchType = getSafeSearchType(pendingType);
          const loc = getLocation(userId);
          if (loc?.address) {
            await handleSearch(event.replyToken, loc.address, searchType, lang, userText);
          } else if (loc?.lat && loc?.lng) {
            const results = await searchNearby(loc.lat, loc.lng, searchType);
            const labelObj = TYPE_LABEL[searchType] || TYPE_LABEL.restaurant;
            const label = labelObj[lang] || labelObj.en;
            if (results) {
              await replyMessage(event.replyToken, `${label} nearby:\n\n${results}`, MAP_GUIDE[lang] || MAP_GUIDE.en);
            } else {
              setState(userId, 'awaiting_location_' + searchType);
              await replyMessage(event.replyToken, ASK_LOCATION[lang] || ASK_LOCATION.en);
            }
          } else {
            setState(userId, 'awaiting_location_' + searchType);
            await replyMessage(event.replyToken, ASK_LOCATION[lang] || ASK_LOCATION.en);
          }
        } else {
          setState(userId, 'awaiting_category');
          const askCat = ASK_CATEGORY[lang] || ASK_CATEGORY.en;
          const loc = getLocation(userId);
          await replyMessage(event.replyToken, askCat(loc?.address || 'your location'));
        }
        continue;
      }

      // 8. 이미지에서 위치 감지된 상태
      if (currentState && currentState.startsWith('has_location:')) {
        const detectedLocation = currentState.replace('has_location:', '');

        if (route.clarifyQuestion) {
          const translated = await translateClarify(route.clarifyQuestion, lang);
          setState(userId, 'awaiting_clarify:' + (route.searchType || 'culture'));
          setLocation(userId, null, null, detectedLocation);
          await replyMessage(event.replyToken, translated);
          continue;
        }

        const searchType = getSafeSearchType(route.searchType || detectSearchType(userText));
        setState(userId, null);
        await handleSearch(event.replyToken, detectedLocation, searchType, lang, userText);
        continue;
      }

      // 9. 위치 대기 상태
      if (currentState && currentState.startsWith('awaiting_location')) {
        if (isCategoryOnly(userText)) {
          const newSearchType = getSafeSearchType(route.searchType || detectSearchType(userText));
          setState(userId, 'awaiting_location_' + newSearchType);
          await replyMessage(event.replyToken, ASK_LOCATION[lang] || ASK_LOCATION.en);
          continue;
        }
        const savedType = currentState.replace('awaiting_location_', '');
        const searchType = getSafeSearchType(
          savedType && savedType !== 'awaiting_location' && savedType !== 'unknown'
            ? savedType
            : route.searchType || detectSearchType(userText)
        );
        setState(userId, null);
        await handleSearch(event.replyToken, userText, searchType, lang, userText);
        continue;
      }

      // 10. 저장된 위치 + 카테고리 입력
      if (savedLocation && isCategoryOnly(userText)) {
        if (route.clarifyQuestion) {
          const translated = await translateClarify(route.clarifyQuestion, lang);
          setState(userId, 'awaiting_clarify:' + (route.searchType || 'culture'));
          await replyMessage(event.replyToken, translated);
          continue;
        }

        const searchType = getSafeSearchType(route.searchType || detectSearchType(userText));
        if (savedLocation.address) {
          await handleSearch(event.replyToken, savedLocation.address, searchType, lang, userText);
        } else if (savedLocation.lat && savedLocation.lng) {
          const results = await searchNearby(savedLocation.lat, savedLocation.lng, searchType);
          const labelObj = TYPE_LABEL[searchType] || TYPE_LABEL.restaurant;
          const label = labelObj[lang] || labelObj.en;
          if (results) {
            await replyMessage(event.replyToken, `${label} nearby:\n\n${results}`, MAP_GUIDE[lang] || MAP_GUIDE.en);
          } else {
            await replyMessage(event.replyToken, await generateReply(userText, lang));
          }
        }
        continue;
      }

      // 11. 장소 검색 의도
      if (route.intent === 'places' || isLocationRequest(userText)) {
        const searchType = getSafeSearchType(route.searchType || detectSearchType(userText));
        const categoryExplicit = hasExplicitCategory(userText, route.searchType);

        // clarify 질문이 있으면 먼저 물어보기
        if (route.clarifyQuestion) {
          const translated = await translateClarify(route.clarifyQuestion, lang);
          setState(userId, 'awaiting_clarify:' + searchType);
          await replyMessage(event.replyToken, translated);
          continue;
        }

        if (savedLocation?.address) {
          if (categoryExplicit) {
            await handleSearch(event.replyToken, savedLocation.address, searchType, lang, userText);
          } else {
            setState(userId, 'awaiting_category');
            const askCat = ASK_CATEGORY[lang] || ASK_CATEGORY.en;
            await replyMessage(event.replyToken, askCat(savedLocation.address));
          }
        } else if (savedLocation?.lat && savedLocation?.lng) {
          if (categoryExplicit) {
            const results = await searchNearby(savedLocation.lat, savedLocation.lng, searchType);
            const labelObj = TYPE_LABEL[searchType] || TYPE_LABEL.restaurant;
            const label = labelObj[lang] || labelObj.en;
            if (results) {
              await replyMessage(event.replyToken, `${label} nearby:\n\n${results}`, MAP_GUIDE[lang] || MAP_GUIDE.en);
            } else {
              setState(userId, 'awaiting_location_' + searchType);
              await replyMessage(event.replyToken, ASK_LOCATION[lang] || ASK_LOCATION.en);
            }
          } else {
            setState(userId, 'awaiting_category');
            const askCat = ASK_CATEGORY[lang] || ASK_CATEGORY.en;
            await replyMessage(event.replyToken, askCat('your location'));
          }
        } else {
          if (categoryExplicit) {
            setState(userId, 'awaiting_location_' + searchType);
            await replyMessage(event.replyToken, ASK_LOCATION[lang] || ASK_LOCATION.en);
          } else if (looksLikeLocation(userText)) {
            const cleanedLocation = cleanLocationText(userText);
            setLocation(userId, null, null, cleanedLocation);
            setState(userId, 'awaiting_category');
            const askCat = ASK_CATEGORY[lang] || ASK_CATEGORY.en;
            await replyMessage(event.replyToken, askCat(cleanedLocation));
          } else {
            setState(userId, 'awaiting_location_' + searchType);
            await replyMessage(event.replyToken, ASK_LOCATION[lang] || ASK_LOCATION.en);
          }
        }
        continue;
      }

      // 12. 일반 AI 응답
      const aiReply = await generateReply(userText, lang);
      await replyMessage(event.replyToken, aiReply);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
});

app.listen(PORT, () => {
  console.log(`VirtualButler.Korea running on port ${PORT}`);
});
