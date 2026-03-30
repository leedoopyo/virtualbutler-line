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

  if (/[ăâêôơưđ]/.test(text) || t.includes('xin')) return 'vi';
  if (t.includes('halo') || t.includes('makanan')) return 'id';
  if (/[А-Яа-я]/.test(text)) return 'mn';

  return 'vi'; // 기본 베트남어
}

function isEmergency(text = '') {
  const t = text.toLowerCase();
  return (
    t.includes('accident') ||
    t.includes('hospital') ||
    t.includes('police') ||
    t.includes('passport')
  );
}

function emergencyReply(lang) {
  if (lang === 'vi')
    return '🚨 Gọi ngay: 112 (cảnh sát), 119 (cấp cứu). Gửi vị trí của bạn!';
  if (lang === 'id')
    return '🚨 Hubungi: 112 (polisi), 119 (darurat). Kirim lokasi Anda!';
  if (lang === 'mn')
    return '🚨 Яаралтай: 112 (цагдаа), 119 (түргэн). Байршлаа илгээнэ үү!';
}

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

async function generateReply(userText, lang) {
  const language =
    lang === 'vi'
      ? 'Vietnamese'
      : lang === 'id'
      ? 'Indonesian'
      : 'Mongolian';

  const response = await openai.responses.create({
    model: 'gpt-5',
    input: `Reply in ${language}. Help traveler in Korea. Keep it short.\nUser: ${userText}`,
  });

  return response.output_text;
}

app.post('/webhook', async (req, res) => {
  const signature = req.header('x-line-signature');

  if (!verifyLineSignature(LINE_CHANNEL_SECRET, req.body, signature)) {
    return res.status(401).send('Invalid');
  }

  const body = JSON.parse(req.body.toString('utf8'));
  res.status(200).send('OK');

  for (const event of body.events) {
    if (event.type !== 'message' || event.message.type !== 'text') continue;

    const userText = event.message.text;
    const lang = detectLanguage(userText);

    if (isEmergency(userText)) {
      await replyMessage(event.replyToken, emergencyReply(lang));
      continue;
    }

    const aiReply = await generateReply(userText, lang);
    await replyMessage(event.replyToken, aiReply);
  }
});

app.listen(PORT, () => {
  console.log('Server running');
});
