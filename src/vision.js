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
            text: `You are Virtual Butler Korea.
Analyze this image and help the user.
Reply in ${language} only. Keep it short and practical.

If you can identify a location in Korea from signs, landmarks, or area names in this image, extract it.

At the very end of your response add this line in English only:
LOCATION: [location name] or LOCATION: unknown

Examples of what to do:
- Menu photo: translate and recommend dishes
- Street signs: explain location and area
- Document: summarize key points
- Medicine: explain usage with doctor disclaimer
- Food: describe and mention if halal`,
          },
        ],
      },
    ],
  });

  const fullText = response.choices[0].message.content;
  const locationMatch = fullText.match(/LOCATION:\s*(.+)/i);
  const location = locationMatch ? locationMatch[1].trim() : null;
  const cleanText = fullText.replace(/LOCATION:\s*.+/i, '').trim();

  return { text: cleanText, location };
}
