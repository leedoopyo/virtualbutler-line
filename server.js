import crypto from 'crypto';
import dotenv from 'dotenv';
import express from 'express';
import OpenAI from 'openai';

dotenv.config();

const {
  PORT = 3000,
  LINE_CHANNEL_SECRET,
  LINE_CHANNEL_ACCESS_TOKEN,
  OPENAI_API_KEY,
} = process.env;

const app = express();
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// 👉 유저 언어 저장 (핵심)
const userLangMap = new Map();

app.use('/webhook', express.raw({ type: '*/*' }));

function verifyLineSignature(channelSecret, rawBody, signature) {
  const hash = crypto
    .createHmac('sha256', channelSecret)
    .update(rawBody)
    .digest('base64');
  return hash === signature;
}

// 👉 언어 선택 감지
function normalizeLanguageChoice(text = '') {
  const t = text.trim().toLowerCase();

  if (t === 'vi') return 'vi';
  if (t === 'id') return 'id';
  if (t === 'mn') return 'mn';

  return null;
}

// 👉 기본 안내 (영어)
function languageSelectionMessage() {
  return `Welcome to Virtual Butler Korea 🇰🇷

Please choose your language:
1. Tiếng Việt (VI)
2. Bahasa Indonesia (ID)
3. Монгол (MN)

Type:
VI / ID / MN`;
}

// 👉 응급 대응
function isEmergency(text = '') {
  const t = text.toLowerCase();

  return (
    t.includes('hospital') ||
    t.includes('police') ||
    t.includes('accident') ||
    t.includes('emergency') ||
    t.includes('ambulance')
  );
}

function emergencyReply(lang) {
  if (lang === 'vi') {
    return '🚨 Gọi ngay: 112 (cảnh sát), 119 (cấp cứu). Gửi vị trí của bạn!';
  }
  if (lang === 'id') {
    return '🚨 Hubungi: 112 (polisi), 119 (darurat). Kirim lokasi Anda!';
  }
  if (lang === 'mn') {
    return '🚨 112 (цагдаа), 119 (түргэн). Байршлаа илгээнэ үү!';
  }
  return '🚨 Call 112 (police) or 119 (ambulance). Send your location!';
}

// 👉 GPT 응답 생성
async function generateReply(userText, lang) {
  const language =
    lang === 'vi'
      ? 'Vietnamese'
      : lang === 'id'
      ? 'Indonesian'
      : lang === 'mn'
      ? 'Mongolian'
      : 'English';

  const response = await openai.responses.create({
    model: 'gpt-5',
    input: `Reply in ${language}.
You are a Korea travel assistant for foreign tourists.

Keep responses short, practical, and helpful.

User: ${userText}`,
  });

  return response.output_text;
}

// 👉 LINE reply
async function replyMessage(replyToken, text) {
  await fetch('https://api.line.me/v2/bot/message/reply', {
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
}

// 👉 서버 체크용
app.get('/', (req, res) => {
  res.send('OK');
});

// 👉 핵심 webhook
app.post('/webhook', async (req, res) => {
  try {
    const signature = req.header('x-line-signature');

    if (!verifyLineSignature(LINE_CHANNEL_SECRET, req.body, signature)) {
      return res.status(401).send('Invalid signature');
    }

    const body = JSON.parse(req.body.toString('utf8'));

    res.status(200).send('OK');

    for (const event of body.events) {
      if (event.type !== 'message' || event.message.type !== 'text') continue;

      const userText = event.message.text;
      const userId = event.source.userId;

      console.log('User:', userId, 'Text:', userText);

      // 👉 1. 언어 선택 했는지 확인
      const selectedLang = normalizeLanguageChoice(userText);

      if (selectedLang) {
        userLangMap.set(userId, selectedLang);

        let msg = '';
        if (selectedLang === 'vi') {
          msg =
            'Xin chào! Tôi có thể giúp bạn về tàu điện, quán ăn, SIM, hoặc lịch trình. Bạn đang ở đâu?';
        } else if (selectedLang === 'id') {
          msg =
            'Halo! Saya bisa bantu subway, makanan, SIM, atau itinerary. Anda di mana sekarang?';
        } else {
          msg =
            'Сайн байна уу! Би метро, хоол, SIM, аяллын зөвлөгөө өгч чадна. Та хаана байна?';
        }

        await replyMessage(event.replyToken, msg);
        continue;
      }

      // 👉 2. 저장된 언어 확인
      const userLang = userLangMap.get(userId);

      // 👉 3. 아직 선택 안했으면 → 영어 안내
      if (!userLang) {
        await replyMessage(event.replyToken, languageSelectionMessage());
        continue;
      }

      // 👉 4. 응급 상황
      if (isEmergency(userText)) {
        await replyMessage(event.replyToken, emergencyReply(userLang));
        continue;
      }

      // 👉 5. GPT 응답
      const aiReply = await generateReply(userText, userLang);
      await replyMessage(event.replyToken, aiReply);
    }
  } catch (err) {
    console.error(err);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
