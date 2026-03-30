import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const LANGUAGE_MAP = {
  vi: 'Vietnamese',
  id: 'Indonesian',
  mn: 'Mongolian',
  en: 'English',
};

async function downloadLineImage(messageId) {
  const response = await fetch(
    `https://api-data.line.me/v2/bot/message/${messageId}/content`,
    {
      headers: {
        Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
      },
    }
  );
  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer).toString('base64');
}

export async function analyzeImage(messageId, lang) {
  const language = LANGUAGE_MAP[lang] || 'English';
  const base64Image = await downloadLineImage(messageId);

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${base64Image}` },
          },
          {
            type: 'text',
            text: `You are Virtual Butler Korea 🇰🇷.
Analyze this image and help the user.
Reply in ${language} only. Keep it short and practical.

IMPORTANT: If you can identify a location in Korea from this image (street signs, building names, landmarks, area names), extract the location name in Korean or English.

At the very end of your response, add this line in English only (regardless of reply language):
LOCATION: [location name in Korean or English, e.g. "강남" or "Gangnam"] or LOCATION: unknown

- Menu/food photo → translate items, recommend 1-2 dishes
- Korean sign/map → explain what it says and how to get there
- Document/contract → summarize key points in simple terms
- Medicine/pharmacy bag → explain dosage and usage (add: consult a doctor disclaimer)
- Food photo → describe it, mention if likely halal or not
- Street/building photo → describe the location and area
- Unclear image → describe what you see and ask what help they need`,
          },
        ],
      },
    ],
  });

  const fullText = response.choices[0].message.content;

  // LOCATION 추출
  const locationMatch = fullText.match(/LOCATION:\s*(.+)/i);
  const location = locationMatch ? locationMatch[1].trim() : null;

  // LOCATION 줄 제거한 실제 답변
  const cleanText = fullText.replace(/LOCATION:\s*.+/i, '').trim();

  return { text: cleanText, location };
  }
