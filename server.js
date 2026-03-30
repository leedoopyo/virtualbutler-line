import crypto from 'crypto';
import dotenv from 'dotenv';
import express from 'express';

import { getSession, setSession, getLocation, setLocation, getState, setState } from './src/session.js';
import { normalizeLanguageChoice, languageSelectionMessage, welcomeMessage } from './src/language.js';
import { isEmergency, emergencyReply } from './src/emergency.js';
import { generateReply } from './src/ai.js';
import { analyzeImage } from './src/vision.js';
import { isLocationRequest, locationReceivedMessage, detectSearchType } from './src/location.js';
import { searchNearby, searchByKeyword } from './src/places.js';
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

function isCategoryOnly(text = '') {
  const categories = [
    'hotel', 'hotels', 'restaurant', 'restaurants', 'cafe', 'cafes',
    'coffee', 'pharmacy', 'hospital', 'clinic', 'halal', 'food', 'eat',
    'hotel near', 'restaurant near', 'cafe near', 'pharmacy near', 'hospital near',
    '호텔', '식당', '맛집', '카페', '약국', '병원', '음식',
    'khách sạn', 'nhà hàng', 'cà phê', 'nhà thuốc',
    'restoran', 'apotek', 'kafe', 'makanan',
    'буудал', 'ресторан', 'эмийн сан', 'эмнэлэг',
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

  const shortPlaceLike =
    text.trim().length <= 30 &&
    /^[a-zA-Z0-9\s\-]+$/.test(text.trim());

  return shortPlaceLike;
}

const typeLabel = {
  restaurant: { en: '🍜 Restaurants', vi: '🍜 Nhà hàng', id: '🍜 Restoran', mn: '🍜 Ресторан' },
  cafe: { en: '☕ Cafes', vi: '☕ Quán cà phê', id: '☕ Kafe', mn: '☕ Кафе' },
  hotel: { en: '🏨 Hotels', vi: '🏨 Khách sạn', id: '🏨 Hotel', mn: '🏨 Зочид буудал' },
  pharmacy: { en: '💊 Pharmacies', vi: '💊 Nhà thuốc', id: '💊 Apotek', mn: '💊 Эмийн сан' },
  hospital: { en: '🏥 Clinics', vi: '🏥 Phòng khám', id: '🏥 Klinik', mn: '🏥 Эмнэлэг' },
  halal: { en: '🕌 Halal food', vi: '🕌 Đồ ăn halal', id: '🕌 Makanan halal', mn: '🕌 Халал хоол' },
  attraction: { en: '📍 Attractions', vi: '📍 Điểm du lịch', id: '📍 Tempat wisata', mn: '📍 Аяллын газар' },
  event: { en: '🎭 Events', vi: '🎭 Sự kiện', id: '🎭 Event', mn: '🎭 Арга хэмжээ' },
};

async function translateFollowUp(text, lang) {
  if (!text) return '';
  if (lang === 'en') return text;

  try {
    return await generateReply(
      `Translate this into the user's language naturally and briefly. Only output the translated sentence:\n\n${text}`,
      lang
    );
  } catch (err) {
    console.error('Follow-up translation failed:', err.message);
    return text;
  }
}

async function handleSearch(replyToken, areaText, searchType, lang, originalUserText = '') {
  try {
    const results = await searchByKeyword(areaText, searchType);
    const label = (typeLabel[searchType] || typeLabel.restaurant)[lang] || typeLabel.restaurant.en;

    const mapGuide = {
      en: '🗺️ Tap the link to open in Kakao Map and get directions!',
      vi: '🗺️ Nhấn vào link để mở Kakao Map và chỉ đường!',
      id: '🗺️ Ketuk link untuk membuka Kakao Map dan petunjuk arah!',
      mn: '🗺️ Линк дээр дарж Kakao Map дээр нээж чиглэл авна уу!',
    };

    if (results) {
      await replyMessage(
        replyToken,
        `${label} near "${areaText}":\n\n${results}`,
        mapGuide[lang] || mapGuide.en
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
    await replyMessage(
      replyToken,
      await generateReply(
        originalUserText || `${searchType} near ${areaText}`,
        lang
      )
    );
  }
}

function getSafeSearchType(searchType = '') {
  const allowed = [
    'restaurant',
    'cafe',
    'hotel',
    'pharmacy',
    'hospital',
    'halal',
    'attraction',
    'event',
  ];

  return allowed.includes(searchType) ? searchType : 'restaurant';
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

      // 위치 메시지 처리
      if (event.message.type === 'location') {
        const { latitude, longitude, address } = event.message;

        const currentState = getState(userId);
        const wantedType =
          currentState && currentState.startsWith('awaiting_location_')
            ? currentState.replace('awaiting_location_', '')
            : 'restaurant';

        setLocation(userId, latitude, longitude, address || '');
        setState(userId, null);

        try {
          const results = await searchNearby(latitude, longitude, wantedType);
          const label = (typeLabel[wantedType] || typeLabel.restaurant)[lang || 'en'] || typeLabel.restaurant.en;

          if (results) {
            await replyMessage(event.replyToken, `${label} nearby:\n\n${results}`);
          } else {
            await replyMessage(
              event.replyToken,
              locationReceivedMessage(lang || 'en', address || 'Current location')
            );
          }
        } catch (err) {
          console.error('Location search failed:', err.message);
          await replyMessage(
            event.replyToken,
            locationReceivedMessage(lang || 'en', address || 'Current location')
          );
        }
        continue;
      }

      // 이미지 메시지 처리
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
              en: `📍 I can see you're near "${detectedLocation}"!\nWhat do you need?\n(e.g. "hotel" / "restaurant" / "pharmacy")`,
              vi: `📍 Tôi thấy bạn đang ở gần "${detectedLocation}"!\nBạn cần gì?\n(vd: "hotel" / "nhà hàng" / "nhà thuốc")`,
              id: `📍 Saya lihat Anda dekat "${detectedLocation}"!\nAnda butuh apa?\n(cth: "hotel" / "restoran" / "apotek")`,
              mn: `📍 Та "${detectedLocation}" орчимд байна!\nЮу хэрэгтэй вэ?\n(жш: "hotel" / "ресторан" / "эмийн сан")`,
            };

            await replyMessage(event.replyToken, analysisText, followUp[lang] || followUp.en);
          } else {
            setState(userId, 'awaiting_location_restaurant');

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

      // 텍스트 메시지 처리
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

      // 3. 텍스트 위치 저장
      if (!savedLocation && looksLikeLocation(userText) && !isCategoryOnly(userText)) {
        setLocation(userId, null, null, userText);

        const gotLocation = {
          en: `📍 Got it! You're near "${userText}". What do you need?\n(e.g. hotel / restaurant / pharmacy)`,
          vi: `📍 Đã hiểu! Bạn đang ở gần "${userText}". Bạn cần gì?\n(vd: hotel / nhà hàng / nhà thuốc)`,
          id: `📍 Baik! Anda berada dekat "${userText}". Anda butuh apa?\n(cth: hotel / restoran / apotek)`,
          mn: `📍 Ойлголоо! Та "${userText}" орчимд байна. Юу хэрэгтэй вэ?\n(жш: hotel / ресторан / эмийн сан)`,
        };

        await replyMessage(event.replyToken, gotLocation[lang] || gotLocation.en);
        continue;
      }

      // 4. AI 라우팅
      const route = await detectIntent(userText, lang);
      console.log('AI route:', route);

      const followUp = await translateFollowUp(route.followUpQuestion, lang);

      // 5. 긴급 상황
      if (route.intent === 'emergency' || isEmergency(userText)) {
        await replyMessage(event.replyToken, emergencyReply(lang));
        continue;
      }

      // 6. 문화행사 검색
      if (route.intent === 'events' || isEventRequest(userText)) {
        try {
          const results = await searchEvents(userText, lang);

          if (results) {
            const guide = {
              en: '🗺️ Tap the link to find on Kakao Map!',
              vi: '🗺️ Nhấn link để tìm trên Kakao Map!',
              id: '🗺️ Ketuk link untuk mencari di Kakao Map!',
              mn: '🗺️ Линк дээр дарж Kakao Map дээр хайна уу!',
            };
            await replyMessage(event.replyToken, results, guide[lang] || guide.en);
          } else if (followUp) {
            await replyMessage(event.replyToken, followUp);
          } else {
            const notFound = {
              en: '😅 No events found. Try searching with a city name like "Seoul concert" or "Busan festival".',
              vi: '😅 Không tìm thấy sự kiện. Hãy thử thêm tên thành phố như "Seoul concert" hoặc "Busan festival".',
              id: '😅 Tidak ada acara ditemukan. Coba tambahkan nama kota seperti "Seoul concert" atau "Busan festival".',
              mn: '😅 Арга хэмжээ олдсонгүй. "Seoul concert" эсвэл "Busan festival" гэж хотын нэртэй хайна уу.',
            };
            await replyMessage(event.replyToken, notFound[lang] || notFound.en);
          }
        } catch (err) {
          console.error('Event search failed:', err.message);
          await replyMessage(event.replyToken, await generateReply(userText, lang));
        }
        continue;
      }

      // 7. 이미지에서 위치 감지된 상태에서 카테고리 입력
      if (currentState && currentState.startsWith('has_location:')) {
        const detectedLocation = currentState.replace('has_location:', '');
        const searchType = getSafeSearchType(route.searchType || detectSearchType(userText));
        setState(userId, null);
        await handleSearch(event.replyToken, detectedLocation, searchType, lang, userText);
        continue;
      }

      // 8. 위치 대기 상태
      if (currentState && currentState.startsWith('awaiting_location')) {
        if (isCategoryOnly(userText)) {
          const newSearchType = getSafeSearchType(route.searchType || detectSearchType(userText));
          setState(userId, 'awaiting_location_' + newSearchType);

          const msg = {
            en: `📍 Which area are you in?\n(e.g. Gangnam / Hongdae / Yongsan / Myeongdong)`,
            vi: `📍 Bạn đang ở khu vực nào?\n(vd: Gangnam / Hongdae / Yongsan)`,
            id: `📍 Anda di area mana?\n(cth: Gangnam / Hongdae / Yongsan)`,
            mn: `📍 Та аль хороонд байна вэ?\n(жш: Gangnam / Hongdae / Yongsan)`,
          };
          await replyMessage(event.replyToken, msg[lang] || msg.en);
          continue;
        }

        const savedType = currentState.replace('awaiting_location_', '');
        const searchType = getSafeSearchType(
          savedType && savedType !== 'awaiting_location'
            ? savedType
            : route.searchType || detectSearchType(userText)
        );

        setState(userId, null);
        await handleSearch(event.replyToken, userText, searchType, lang, userText);
        continue;
      }

      // 9. 저장된 텍스트 위치 + 카테고리 입력
      if (savedLocation && savedLocation.address && isCategoryOnly(userText)) {
        const searchType = getSafeSearchType(route.searchType || detectSearchType(userText));
        await handleSearch(event.replyToken, savedLocation.address, searchType, lang, userText);
        continue;
      }

      // 10. 장소 검색 의도
      if (route.intent === 'places' || isLocationRequest(userText)) {
        const searchType = getSafeSearchType(route.searchType || detectSearchType(userText));

        if (savedLocation && savedLocation.address) {
          await handleSearch(event.replyToken, savedLocation.address, searchType, lang, userText);
        } else if (savedLocation && savedLocation.lat && savedLocation.lng) {
          try {
            const results = await searchNearby(savedLocation.lat, savedLocation.lng, searchType);
            const label = (typeLabel[searchType] || typeLabel.restaurant)[lang] || typeLabel.restaurant.en;

            if (results) {
              await replyMessage(event.replyToken, `${label} nearby:\n\n${results}`);
            } else if (followUp) {
              await replyMessage(event.replyToken, followUp);
            } else {
              await replyMessage(event.replyToken, await generateReply(userText, lang));
            }
          } catch (err) {
            console.error('Nearby search failed:', err.message);
            await replyMessage(event.replyToken, await generateReply(userText, lang));
          }
        } else {
          setState(userId, 'awaiting_location_' + searchType);

          const askLocation = {
            en: followUp || 'Please send your location or tell me your area, like Hongdae, Gangnam, or Myeongdong.',
            vi: followUp || 'Vui lòng gửi vị trí của bạn hoặc cho tôi biết khu vực như Hongdae, Gangnam hoặc Myeongdong.',
            id: followUp || 'Silakan kirim lokasi Anda atau sebutkan area seperti Hongdae, Gangnam, atau Myeongdong.',
            mn: followUp || 'Байршлаа илгээх эсвэл Hongdae, Gangnam, Myeongdong гэх мэт газраа бичнэ үү.',
          };

          await replyMessage(event.replyToken, askLocation[lang] || askLocation.en);
        }
        continue;
      }

      // 11. 일반 AI 응답
      if (followUp) {
        const aiReply = await generateReply(
          `${userText}\n\nAsk this follow-up naturally if needed: ${followUp}`,
          lang
        );
        await replyMessage(event.replyToken, aiReply);
      } else {
        const aiReply = await generateReply(userText, lang);
        await replyMessage(event.replyToken, aiReply);
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
});

app.listen(PORT, () => {
  console.log(`VirtualButler.Korea running on port ${PORT}`);
});
