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
  const messages = texts.map(text => ({ type: 'text', text }));
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
    '호텔', '식당', '맛집', '카페', '약국', '병원', '음식',
    'khách sạn', 'nhà hàng', 'cà phê', 'nhà thuốc',
    'restoran', 'apotek', 'kafe', 'makanan',
    'буудал', 'ресторан', 'эмийн сан', 'эмнэлэг',
    'nearby hotel', 'nearby restaurant', 'nearby cafe',
    'nearby pharmacy', 'nearby hospital', 'nearby food',
  ];
  const t = text.trim().toLowerCase();
  return categories.some(c => t === c || t === 'nearby ' + c);
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
        setLocation(userId, latitude, longitude, address || '');
        setState(userId, null);

        const results = await searchNearby(latitude, longitude, 'restaurant');
        const header = {
          en: '🍜 Nearby restaurants:\n\n',
          vi: '🍜 Nhà hàng gần bạn:\n\n',
          id: '🍜 Restoran terdekat:\n\n',
          mn: '🍜 Ойролцоох ресторан:\n\n',
        };

        if (results) {
          await replyMessage(event.replyToken, (header[lang || 'en']) + results);
        } else {
          await replyMessage(event.replyToken, locationReceivedMessage(lang || 'en', address || 'Current location'));
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

      // 3. 긴급 상황
      if (isEmergency(userText)) {
        await replyMessage(event.replyToken, emergencyReply(lang));
        continue;
      }

      const currentState = getState(userId);

      // 4. 위치 감지된 상태에서 카테고리 입력
      if (currentState && currentState.startsWith('has_location:')) {
        const detectedLocation = currentState.replace('has_location:', '');
        const searchType = detectSearchType(userText);
        setState(userId, null);

        try {
          const results = await searchByKeyword(detectedLocation, searchType);

          const typeLabel = {
            restaurant: { en: '🍜 Restaurants', vi: '🍜 Nhà hàng', id: '🍜 Restoran', mn: '🍜 Ресторан' },
            cafe: { en: '☕ Cafes', vi: '☕ Quán cà phê', id: '☕ Kafe', mn: '☕ Кафе' },
            hotel: { en: '🏨 Hotels', vi: '🏨 Khách sạn', id: '🏨 Hotel', mn: '🏨 Зочид буудал' },
            pharmacy: { en: '💊 Pharmacies', vi: '💊 Nhà thuốc', id: '💊 Apotek', mn: '💊 Эмийн сан' },
            hospital: { en: '🏥 Clinics', vi: '🏥 Phòng khám', id: '🏥 Klinik', mn: '🏥 Эмнэлэг' },
            halal: { en: '🕌 Halal food', vi: '🕌 Đồ ăn halal', id: '🕌 Makanan halal', mn: '🕌 Халал хоол' },
          };

          const label = (typeLabel[searchType] || typeLabel.restaurant)[lang] || typeLabel.restaurant.en;

          if (results) {
            await replyMessage(event.replyToken, `${label} near ${detectedLocation}:\n\n${results}`);
          } else {
            const notFound = {
              en: `😅 No results near "${detectedLocation}". Try typing the area name manually!\n(e.g. "Gangnam hotel")`,
              vi: `😅 Không tìm thấy gần "${detectedLocation}". Thử nhập thủ công!\n(vd: "Gangnam hotel")`,
              id: `😅 Tidak ada hasil dekat "${detectedLocation}". Coba ketik manual!\n(cth: "Gangnam hotel")`,
              mn: `😅 "${detectedLocation}" орчимд үр дүн олдсонгүй. Гараар оруулна уу!\n(жш: "Gangnam hotel")`,
            };
            await replyMessage(event.replyToken, notFound[lang] || notFound.en);
          }
        } catch (err) {
          console.error('Search failed:', err.message);
          await replyMessage(event.replyToken, await generateReply(userText, lang));
        }
        continue;
      }

      // 5. 위치 대기 상태
      if (currentState && currentState.startsWith('awaiting_location')) {
        // 카테고리만 입력했으면 지역명 다시 요청
        if (isCategoryOnly(userText)) {
          const searchType = detectSearchType(userText);
          setState(userId, 'awaiting_location_' + searchType);
          const msg = {
            en: `📍 Which area are you in?\n(e.g. Gangnam / Hongdae / Yongsan / Myeongdong)`,
            vi: `📍 Bạn đang ở khu vực nào?\n(vd: Gangnam / Hongdae / Yongsan)`,
            id: `📍 Anda di area mana?\n(cth: Gangnam / Hongdae / Yongsan)`,
            mn: `📍 Та аль хороонд байна вэ?\n(жш: Gangnam / Hongdae / Yongsan)`,
          };
          await replyMessage(event.replyToken, msg[lang] || msg.en);
          continue;
        }

        const searchType = detectSearchType(userText);
        setState(userId, null);

        try {
          const results = await searchByKeyword(userText, searchType);

          const typeLabel = {
            restaurant: { en: '🍜 Restaurants', vi: '🍜 Nhà hàng', id: '🍜 Restoran', mn: '🍜 Ресторан' },
            cafe: { en: '☕ Cafes', vi: '☕ Quán cà phê', id: '☕ Kafe', mn: '☕ Кафе' },
            hotel: { en: '🏨 Hotels', vi: '🏨 Khách sạn', id: '🏨 Hotel', mn: '🏨 Зочид буудал' },
            pharmacy: { en: '💊 Pharmacies', vi: '💊 Nhà thuốc', id: '💊 Apotek', mn: '💊 Эмийн сан' },
            hospital: { en: '🏥 Clinics', vi: '🏥 Phòng khám', id: '🏥 Klinik', mn: '🏥 Эмнэлэг' },
            halal: { en: '🕌 Halal food', vi: '🕌 Đồ ăn halal', id: '🕌 Makanan halal', mn: '🕌 Халал хоол' },
          };

          const label = (typeLabel[searchType] || typeLabel.restaurant)[lang] || typeLabel.restaurant.en;

          if (results) {
            await replyMessage(event.replyToken, `${label} near "${userText}":\n\n${results}`);
          } else {
            const notFound = {
              en: `😅 No results near "${userText}". Try another area!`,
              vi: `😅 Không tìm thấy gần "${userText}". Thử khu vực khác!`,
              id: `😅 Tidak ada hasil dekat "${userText}". Coba area lain!`,
              mn: `😅 "${userText}" орчимд үр дүн олдсонгүй. Өөр газар оруулна уу!`,
            };
            await replyMessage(event.replyToken, notFound[lang] || notFound.en);
          }
        } catch (err) {
          console.error('Search failed:', err.message);
          await replyMessage(event.replyToken, await generateReply(userText, lang));
        }
        continue;
      }

      // 6. 위치 요청 감지
      if (isLocationRequest(userText)) {
        const searchType = detectSearchType(userText);
        setState(userId, 'awaiting_location_' + searchType);

        const msg = {
          en: `📍 Which area are you in?\n\nType the area name\n(e.g. Hongdae / Myeongdong / Gangnam / Yongsan)`,
          vi: `📍 Bạn đang ở khu vực nào?\n\nNhập tên khu vực\n(vd: Hongdae / Myeongdong / Gangnam)`,
          id: `📍 Anda di area mana?\n\nKetik nama area\n(cth: Hongdae / Myeongdong / Gangnam)`,
          mn: `📍 Та аль хороонд байна вэ?\n\nГазрын нэрийг бичнэ үү\n(жш: Hongdae / Myeongdong / Gangnam)`,
        };
        await replyMessage(event.replyToken, msg[lang] || msg.en);
        continue;
      }

      // 7. 일반 AI 응답
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
