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
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`,
            },
          },
          {
            type: 'text',
            text: `You are Virtual Butler Korea 🇰🇷.
Analyze this image and help the user.
Reply in ${language} only. Keep it short and practical.

- Menu/food photo → translate items, recommend 1-2 dishes
- Korean sign/map → explain what it says and how to get there
- Document/contract → summarize key points in simple terms
- Medicine/pharmacy bag → explain dosage and usage (add: consult a doctor disclaimer)
- Food photo → describe it, mention if likely halal or not
- Subway map or route → explain the route step by step
- Unclear image → describe what you see and ask what help they need`,
          },
        ],
      },
    ],
  });

  return response.choices[0].message.content;
}
