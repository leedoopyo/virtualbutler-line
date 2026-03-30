import { generateReply } from './ai.js';

// 키워드 기반 fallback
function fallbackIntent(text = '') {
  const t = text.toLowerCase();

  if (t.includes('hospital') || t.includes('clinic')) {
    return { intent: 'places', searchType: 'hospital' };
  }

  if (t.includes('pharmacy') || t.includes('medicine')) {
    return { intent: 'places', searchType: 'pharmacy' };
  }

  if (t.includes('hotel') || t.includes('stay')) {
    return { intent: 'places', searchType: 'hotel' };
  }

  if (t.includes('restaurant') || t.includes('food') || t.includes('eat')) {
    return { intent: 'places', searchType: 'restaurant' };
  }

  if (t.includes('cafe') || t.includes('coffee')) {
    return { intent: 'places', searchType: 'cafe' };
  }

  if (t.includes('halal')) {
    return { intent: 'places', searchType: 'halal' };
  }

  if (t.includes('event') || t.includes('concert') || t.includes('festival') || t.includes('show') || t.includes('dance')) {
    return { intent: 'events', searchType: 'event' };
  }

  if (t.includes('help') || t.includes('emergency') || t.includes('police')) {
    return { intent: 'emergency' };
  }

  return { intent: 'general' };
}

export async function detectIntent(text = '', lang = 'en') {
  try {
    const prompt = `
You are an intent classifier for a travel assistant.

Analyze the user's message and return JSON only.

{
  "intent": "places | events | emergency | general",
  "searchType": "restaurant | cafe | hotel | pharmacy | hospital | halal | attraction | event",
  "followUpQuestion": "natural question to continue conversation"
}

Rules:
- "hospital", "pharmacy" → places
- "concert", "festival", "dance", "show" → events
- "help", "emergency" → emergency
- If unclear → general

VERY IMPORTANT:
- followUpQuestion MUST be natural and human-like
- Do NOT repeat same question
- If user already gave location → ask what they need
- If user gave category → ask location
- If both → no follow-up needed (empty string)

User message:
"${text}"
`;

    const aiResponse = await generateReply(prompt, 'en');

    // JSON 파싱 시도
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);

      return {
        intent: parsed.intent || 'general',
        searchType: parsed.searchType || '',
        followUpQuestion: parsed.followUpQuestion || '',
      };
    }

    throw new Error('Invalid JSON');
  } catch (err) {
    console.error('AI router failed, using fallback:', err.message);

    const fallback = fallbackIntent(text);

    return {
      intent: fallback.intent,
      searchType: fallback.searchType || '',
      followUpQuestion: '',
    };
  }
}
