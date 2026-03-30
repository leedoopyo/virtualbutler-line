import crypto from 'crypto';
import dotenv from 'dotenv';
import express from 'express';

import { getSession, setSession, getLocation, setLocation, getState, setState } from './src/session.js';
import { normalizeLanguageChoice, languageSelectionMessage, welcomeMessage } from './src/language.js';
import { isEmergency, emergencyReply } from './src/emergency.js';
import { generateReply } from './src/ai.js';
import { analyzeImage } from './src/vision.js';
import { isLocationRequest, requestLocationMessage, locationReceivedMessage } from './src/location.js';
import { searchNearby } from './src/places.js';

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
          await replyMessage(event.replyToken, results);
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

      // 4. 위치 요청 감지
      if (isLocationRequest(userText)) {
        setState(userId, 'awaiting_location');
        await replyMessage(event.replyToken, requestLocationMessage(lang));
        continue;
      }

      // 5. 위치 대기 중인데 텍스트가 옴
      if (getState(userId) === 'awaiting_location') {
        await replyMessage(event.replyToken, requestLocationMessage(lang));
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
