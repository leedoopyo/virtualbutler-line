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

app.use('/webhook', express.raw({ type: '*/*' }));

function verifyLineSignature(channelSecret, rawBody, signature) {
  const hash = crypto
    .createHmac('sha256', channelSecret)
    .update(rawBody)
    .digest('base64');
  return hash === signature;
}

function detectLanguage(text = '') {
  const t = text.toLowerCase();

  // 한국어
  if (/[가-힣]/.test(text)) return 'ko';

  // 베트남어
  if (
    /[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i.test(text) ||
    t.includes('xin') ||
    t.includes('chào') ||
    t.includes('giúp')
  ) {
    return 'vi';
  }

  // 인도네시아어
  if (
    t.includes('halo') ||
    t.includes('makanan') ||
    t.includes('restoran') ||
    t.includes('tolong') ||
    t.includes('rumah sakit')
  ) {
    return 'id';
  }

  // 몽골어
  if (/[А-Яа-яӨөҮүЁё]/.test(text)) return 'mn';

  // 영어
  if (/[a-zA-Z]/.test(text)) return 'en';

  return 'unknown';
}

function isEmergency(text = '') {
  const t = text.toLowerCase();

  return (
    t.includes('accident') ||
    t.includes('hospital') ||
    t.includes('police') ||
    t.includes('passport lost') ||
    t.includes('emergency') ||
    t.includes('ambulance') ||
    t.includes('help me') ||
    t.includes('hospital now') ||
    t.includes('hospital') ||
    t.includes('tai nạn') ||
    t.includes('cấp cứu') ||
    t.includes('bệnh viện') ||
    t.includes('polisi') ||
    t.includes('darurat') ||
    t.includes('rumah sakit') ||
    t.includes('osol') ||
    t.includes('turgen') ||
    t.includes('эмнэлэг') ||
    t.includes('цагдаа')
  );
}

function emergencyReply(lang) {
  if (lang === 'vi') {
    return '🚨 Gọi ngay: 112 (cảnh sát), 119 (cấp cứu). Gửi vị trí hiện tại của bạn!';
  }
  if (lang === 'id') {
    return '🚨 Hubungi segera: 112 (polisi), 119 (darurat). Kirim lokasi Anda sekarang!';
  }
  if (lang === 'mn') {
    return '🚨 Яаралтай: 112 (цагдаа), 119 (түргэн тусламж). Одоогийн байршлаа илгээнэ үү!';
  }
  if (lang === 'ko') {
    return '🚨 긴급 상황이면 112(경찰), 119(구급)로 바로 전화하세요. 현재 위치를 보내주세요.';
  }
  return '🚨 Call 112 (police) or 119 (ambulance) now. Please send your current location.';
}

function languageSelectionMessage(lang = 'en') {
  if (lang === 'ko') {
    return `이 서비스는 베트남어, 인도네시아어, 몽골어 여행객용입니다.

언어를 선택해 주세요:
1. Tiếng Việt
2. Bahasa Indonesia
3. Монгол

아래 중 하나를 보내주세요:
VI / ID / MN`;
  }

  return `Welcome to Virtual Butler Korea 🇰🇷

Please choose your language:
1. Tiếng Việt
2. Bahasa Indonesia
3. Монгол

Please send:
VI / ID / MN`;
}

function normalizeLanguageChoice(text = '') {
  const t = text.trim().toLowerCase();

  if (t === 'vi' || t === 'vietnamese' || t === 'tiếng việt' || t === 'viet') {
    return 'vi';
  }
  if (t === 'id' || t === 'indonesian' || t === 'bahasa' || t === 'bahasa indonesia') {
    return 'id';
  }
  if (t === 'mn' || t === 'mongolian' || t === 'монгол') {
    return 'mn';
  }

  return null;
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
  console.log('LINE reply status:', response.status, resultText);

  if (!response.ok) {
    throw new Error(`LINE reply failed: ${response.status} ${resultText}`);
  }
}

async function generateReply(userText, lang) {
  if (lang === 'unknown' || lang === 'en') {
    return languageSelectionMessage('en');
  }

  if (lang === 'ko') {
    return languageSelectionMessage('ko');
  }

  const language =
    lang === 'vi'
      ? 'Vietnamese'
      : lang === 'id'
      ? 'Indonesian'
      : 'Mongolian';

  const response = await openai.responses.create({
    model: 'gpt-5',
    input: `Reply in ${language}. 
You are a helpful Korea travel assistant for foreign travelers.
Keep the reply short, practical, and friendly.
If the user asks about transport, food, SIM, T-money, translation, or nearby places, answer simply and ask one useful follow-up question when needed.

User: ${userText}`,
  });

  return response.output_text;
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

    res.status(200).send('OK');

    for (const event of body.events) {
      console.log('Event type:', event.type);

      if (event.type !== 'message' || event.message.type !== 'text') {
        continue;
      }

      const userText = event.message.text || '';
      console.log('User text:', userText);

      const forcedChoice = normalizeLanguageChoice(userText);
      if (forcedChoice) {
        let welcome = '';
        if (forcedChoice === 'vi') {
          welcome =
            'Xin chào! Tôi có thể hỗ trợ du lịch ở Hàn Quốc: tàu điện/bus, quán ăn gần bạn, SIM/T-money, dịch nhanh tiếng Hàn, hoặc gợi ý lịch trình. Bạn đang ở đâu?';
        } else if (forcedChoice === 'id') {
          welcome =
            'Halo! Saya bisa membantu perjalanan Anda di Korea: subway/bus, rekomendasi makanan terdekat, SIM/T-money, terjemahan cepat bahasa Korea, atau saran itinerary. Anda sedang di mana?';
        } else {
          welcome =
            'Сайн байна уу! Би Солонгос дахь аялалд тань тусалж чадна: метро/автобус, ойролцоох хоолны газар, SIM/T-money, солонгос хэлний хурдан орчуулга, эсвэл аяллын санал. Та одоо хаана байна?';
        }

        await replyMessage(event.replyToken, welcome);
        continue;
      }

      const lang = detectLanguage(userText);

      if (isEmergency(userText)) {
        await replyMessage(event.replyToken, emergencyReply(lang));
        continue;
      }

      const aiReply = await generateReply(userText, lang);
      await replyMessage(event.replyToken, aiReply);
    }
  } catch (error) {
    console.error('Webhook handling failed:', error);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
