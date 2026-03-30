import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function detectIntent(userText, lang = 'en') {
  const prompt = `
You are an intent router for a Korea travel assistant chatbot.

Classify the user's message into ONE of these intents:
- emergency
- places
- events
- image_help
- general

Also extract:
- searchType: one of restaurant, cafe, hotel, pharmacy, hospital, halal, attraction, event, unknown
- needLocation: true or false
- followUpQuestion: short natural follow-up question if the request is ambiguous

Return ONLY valid JSON in this format:
{
  "intent": "places",
  "searchType": "restaurant",
  "needLocation": true,
  "followUpQuestion": "Which area are you in?"
}

Rules:
- emergency if user mentions urgent medical, police, fire, accident, passport lost, danger
- places if user wants nearby restaurants, cafes, hotels, pharmacy, hospital, halal food, tourist attractions
- events if user wants concerts, festivals, performances, shows, exhibitions, things to do today
- image_help if user is talking about a photo, image, menu picture, medicine photo, sign photo
- general for everything else
- needLocation should be true if nearby search would help
- If unclear, still choose the best intent and add a helpful followUpQuestion

User language: ${lang}
User message: ${userText}
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.1,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = response.choices[0].message.content?.trim() || '{}';
    const parsed = JSON.parse(raw);

    return {
      intent: parsed.intent || 'general',
      searchType: parsed.searchType || 'unknown',
      needLocation: Boolean(parsed.needLocation),
      followUpQuestion: parsed.followUpQuestion || '',
    };
  } catch (error) {
    console.error('Intent detection failed:', error.message);
    return {
      intent: 'general',
      searchType: 'unknown',
      needLocation: false,
      followUpQuestion: '',
    };
  }
}
