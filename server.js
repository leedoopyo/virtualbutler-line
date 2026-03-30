좋아요! 이제 server.js 수정할게요.
GitHub에서 server.js 열고 ✏️ 클릭 → 전체 선택(Ctrl+A) 후 삭제 → 아래 코드 붙여넣기:
javascriptimport crypto from 'crypto';
import dotenv from 'dotenv';
import express from 'express';

import { getSession, setSession, getLocation, setLocation, getState, setState } from './src/session.js';
import { normalizeLanguageChoice, languageSelectionMessage, welcomeMessage } from './src/language.js';
import { isEmergency, emergencyReply } from './src/emergency.js';
import { generateReply } from './src/ai.js';
import { analyzeImage } from './src/vision.js';
import { isLocationRequest, requestLocationMessage, locationReceivedMessage } from './src/location.js';
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

async function replyMessage(replyToken, text) {
  const response = await fetch('https://api.line.me/v2/bot/message/reply', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: 'text', text }],
    }),
  });

  const resultText = await response.text();
  console.log('LINE reply:', response.status, resultText);

  if (!response.ok) {
    throw new Error(`LINE reply failed: ${response.status} ${resultText}`);
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
        setLocation(userId, latitude, longitude, address || '');
        setState(userId, null);

        const results = await searchNearby(latitude, longitude);
        if (results) {
          const header = {
            en: '🍜 Nearby restaurants:\n\n',
            vi: '🍜 Nhà hàng gần bạn:\n\n',
            id: '🍜 Restoran terdekat:\n\n',
            mn: '🍜 Ойролцоох рестораны:\n\n',
          };
          await replyMessage(event.replyToken, (header[lang || 'en']) + results);
        } else {
          await replyMessage(
            event.replyToken,
            locationReceivedMessage(lang || 'en', address || 'Current location')
          );
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
          const result = await analyzeImage(event.message.id, lang);
          await replyMessage(event.replyToken, result);
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

      // 4. 위치 대기 중 → 텍스트로 지역명 입력받기
      if (getState(userId) === 'awaiting_location') {
        setState(userId, null);
        try {
          const results = await searchByKeyword(userText);
          if (results) {
            const header = {
              en: `🍜 Restaurants near "${userText}":\n\n`,
              vi: `🍜 Nhà hàng gần "${userText}":\n\n`,
              id: `🍜 Restoran dekat "${userText}":\n\n`,
              mn: `🍜 "${userText}" орчмын ресторан:\n\n`,
            };
            await replyMessage(event.replyToken, (header[lang] || header.en) + results);
          } else {
            const notFound = {
              en: `😅 No results found near "${userText}". Try another area name!`,
              vi: `😅 Không tìm thấy kết quả gần "${userText}". Thử tên khu vực khác nhé!`,
              id: `😅 Tidak ada hasil di dekat "${userText}". Coba nama area lain!`,
              mn: `😅 "${userText}" орчимд үр дүн олдсонгүй. Өөр газрын нэр оруулна уу!`,
            };
            await replyMessage(event.replyToken, notFound[lang] || notFound.en);
          }
        } catch (err) {
          console.error('Search failed:', err.message);
          await replyMessage(event.replyToken, await generateReply(userText, lang));
        }
        continue;
      }

      // 5. 위치 요청 감지
      if (isLocationRequest(userText)) {
        setState(userId, 'awaiting_location');
        const msg = {
          en: `📍 Which area are you in?\n\nType the area name (e.g. Hongdae / Myeongdong / Gangnam / Yongsan)\nor share your location via the + button below!`,
          vi: `📍 Bạn đang ở khu vực nào?\n\nNhập tên khu vực (vd: Hongdae / Myeongdong / Gangnam)\nhoặc chia sẻ vị trí qua nút + bên dưới!`,
          id: `📍 Anda di area mana?\n\nKetik nama area (cth: Hongdae / Myeongdong / Gangnam)\natau bagikan lokasi via tombol + di bawah!`,
          mn: `📍 Та аль хороонд байна вэ?\n\nГазрын нэрийг бичнэ үү (жш: Hongdae / Myeongdong / Gangnam)\nэсвэл доорх + товчоор байршлаа илгээнэ үү!`,
        };
        await replyMessage(event.replyToken, msg[lang] || msg.en);
        continue;
      }

      // 6. 일반 AI 응답
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
