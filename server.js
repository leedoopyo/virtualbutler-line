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

// 유저별 언어 선택 저장
const userLangMap = new Map();

// LINE webhook은 raw body가 필요함
app.use('/webhook', express.raw({ type: '*/*' }));

function verifyLineSignature(channelSecret, rawBody, signature) {
  const hash = crypto
    .createHmac('sha256', channelSecret)
    .update(rawBody)
    .digest('base64');

  return hash === signature;
}

function normalizeLanguageChoice(text = '') {
  const t = text.trim().toLowerCase();

  if (t === '0' || t === 'en' || t === 'english') return 'en';
  if (t === '1' || t === 'vi' || t === 'vietnamese') return 'vi';
  if (t === '2' || t === 'id' || t === 'indonesian' || t === 'bahasa') return 'id';
  if (t === '3' || t === 'mn' || t === 'mongolian' || t === 'монгол') return 'mn';

  return null;
}

function languageSelectionMessage() {
  return `Welcome to Virtual Butler Korea 🇰🇷

Please choose your language:

0. English
1. Tiếng Việt
2. Bahasa Indonesia
3. Монгол

Type:
EN / VI / ID / MN
or
0 / 1 / 2 / 3`;
}

function isEmergency(text = '') {
  const t = text.toLowerCase();

  return (
    t.includes('hospital') ||
    t.includes('police') ||
    t.includes('accident') ||
    t.includes('emergency') ||
    t.includes('ambulance') ||
    t.includes('passport lost') ||
    t.includes('help me now') ||
    t.includes('tai nạn') ||
    t.includes('bệnh viện') ||
    t.includes('cấp cứu') ||
    t.includes('cảnh sát') ||
    t.includes('darurat') ||
    t.includes('rumah sakit') ||
    t.includes('polisi') ||
    t.includes('паспорт') ||
    t.includes('эмнэлэг') ||
    t.includes('цагдаа')
  );
}

function emergencyReply(lang) {
  if (lang === 'vi') {
    return '🚨 Khẩn cấp: hãy gọi 112 (cảnh sát) hoặc 119 (cấp cứu) ngay. Hãy gửi vị trí hiện tại của bạn.';
  }

  if (lang === 'id') {
    return '🚨 Darurat: segera hubungi 112 (polisi) atau 119 (ambulans). Kirim lokasi Anda sekarang.';
  }

  if (lang === 'mn') {
    return '🚨 Яаралтай: 112 (цагдаа) эсвэл 119 (түргэн) рүү шууд залгана уу. Одоогийн байршлаа илгээнэ үү.';
  }

  return '🚨 Emergency: please call 112 (police) or 119 (ambulance) now. Please send your current location.';
}

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
You are Virtual Butler Korea, a helpful travel assistant for foreign visitors in Korea.

Rules:
- Keep the answer short, practical, and friendly.
- Help with subway, bus, directions, restaurants, halal food, SIM/eSIM, T-money, translation, emergency help, and simple itinerary suggestions.
- Ask one useful follow-up question if needed.
- Do not switch language. Reply only in ${language}.

User: ${userText}`,
  });

  return response.output_text;
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
      messages: [
        {
          type: 'text',
          text,
        },
      ],
    }),
  });

  const resultText = await response.text();
  console.log('LINE reply status:', response.status, resultText);

  if (!response.ok) {
    throw new Error(`LINE reply failed: ${response.status} ${resultText}`);
  }
}

app.get('/', (req, res) => {
  res.status(200).send('Virtual Butler LINE bot is running.');
});

app.post('/webhook', async (req, res) => {
  console.log('Webhook received at:', new Date().toISOString());

  try {
    const signature = req.header('x-line-signature');

    if (!verifyLineSignature(LINE_CHANNEL_SECRET, req.body, signature)) {
      console.error('Invalid LINE signature');
      return res.status(401).send('Invalid signature');
    }

    const body = JSON.parse(req.body.toString('utf8'));
    console.log('LINE events count:', body.events?.length || 0);

    // LINE에는 먼저 200 반환
    res.status(200).send('OK');

    for (const event of body.events) {
      console.log('Event type:', event.type);

      if (event.type !== 'message' || event.message.type !== 'text') {
        continue;
      }

      const userText = (event.message.text || '').trim();
      const userId = event.source?.userId || 'unknown-user';

      console.log('User ID:', userId);
      console.log('User text:', userText);

      // 1. 언어 선택 명령 처리
      const selectedLang = normalizeLanguageChoice(userText);
      if (selectedLang) {
        userLangMap.set(userId, selectedLang);

        let welcome = '';

        if (selectedLang === 'en') {
          welcome =
            'Hello! I can help you in Korea with subway, buses, restaurants, halal food, SIM/eSIM, T-money, translation, and travel plans. Where are you now?';
        } else if (selectedLang === 'vi') {
          welcome =
            'Xin chào! Tôi có thể giúp bạn ở Hàn Quốc về tàu điện, xe buýt, quán ăn, đồ halal, SIM/eSIM, T-money, dịch ngôn ngữ và lịch trình. Bạn đang ở đâu?';
        } else if (selectedLang === 'id') {
          welcome =
            'Halo! Saya bisa membantu Anda di Korea dengan subway, bus, restoran, makanan halal, SIM/eSIM, T-money, terjemahan, dan rencana perjalanan. Anda sedang di mana?';
        } else if (selectedLang === 'mn') {
          welcome =
            'Сайн байна уу! Би Солонгост метро, автобус, ресторан, халал хоол, SIM/eSIM, T-money, орчуулга, аяллын төлөвлөгөөний талаар тусалж чадна. Та одоо хаана байна?';
        }

        await replyMessage(event.replyToken, welcome);
        continue;
      }

      // 2. 아직 언어 선택 안 했으면 영어 기본 안내
      const savedLang = userLangMap.get(userId);
      if (!savedLang) {
        await replyMessage(event.replyToken, languageSelectionMessage());
        continue;
      }

      // 3. 응급 상황 처리
      if (isEmergency(userText)) {
        await replyMessage(event.replyToken, emergencyReply(savedLang));
        continue;
      }

      // 4. 일반 GPT 응답
      const aiReply = await generateReply(userText, savedLang);
      await replyMessage(event.replyToken, aiReply);
    }
  } catch (error) {
    console.error('Webhook handling failed:', error);
    if (!res.headersSent) {
      res.status(500).send('Internal Server Error');
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
