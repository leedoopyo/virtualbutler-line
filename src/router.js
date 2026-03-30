import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function fallbackIntent(text = '') {
  const t = text.toLowerCase();

  if (t.includes('hospital') || t.includes('clinic') ||
      t.includes('bệnh viện') || t.includes('эмнэлэг') || t.includes('rumah sakit')) {
    return { intent: 'places', searchType: 'hospital' };
  }
  if (t.includes('pharmacy') || t.includes('medicine') ||
      t.includes('thuốc') || t.includes('эмийн') || t.includes('apotek')) {
    return { intent: 'places', searchType: 'pharmacy' };
  }
  if (t.includes('hotel') || t.includes('stay') ||
      t.includes('khách sạn') || t.includes('буудал') || t.includes('penginapan')) {
    return { intent: 'places', searchType: 'hotel' };
  }
  if (t.includes('halal')) {
    return { intent: 'places', searchType: 'halal' };
  }
  if (t.includes('cafe') || t.includes('coffee') ||
      t.includes('cà phê') || t.includes('кафе') || t.includes('kopi')) {
    return { intent: 'places', searchType: 'cafe' };
  }
  if (t.includes('restaurant') || t.includes('food') || t.includes('eat') ||
      t.includes('nhà hàng') || t.includes('ресторан') || t.includes('restoran') ||
      t.includes('맛집') || t.includes('식당')) {
    return { intent: 'places', searchType: 'restaurant' };
  }
  if (t.includes('event') || t.includes('concert') || t.includes('festival') ||
      t.includes('show') || t.includes('performance') || t.includes('exhibition') ||
      t.includes('공연') || t.includes('전시') || t.includes('축제') || t.includes('행사')) {
    return { intent: 'events', searchType: 'event' };
  }
  if (t.includes('emergency') || t.includes('police') || t.includes('accident') ||
      t.includes('ambulance') || t.includes('help me now')) {
    return { intent: 'emergency', searchType: '' };
  }

  return { intent: 'general', searchType: '' };
}

export async function detectIntent(text = '', lang = 'en') {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 150,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are an intent classifier for a Korea travel assistant chatbot.
Analyze the user message and return JSON only.

{
  "intent": "places | events | emergency | general",
  "searchType": "restaurant | cafe | hotel | pharmacy | hospital | halal | attraction | event",
  "followUpQuestion": "short natural follow-up question in English, or empty string"
}

Rules:
- hospital, clinic, doctor → places / hospital
- pharmacy, medicine, drug → places / pharmacy  
- hotel, accommodation, stay → places / hotel
- cafe, coffee → places / cafe
- halal → places / halal
- restaurant, food, eat, hungry → places / restaurant
- concert, festival, show, exhibition, performance, event → events / event
- emergency, accident, police, ambulance → emergency
- everything else → general
- followUpQuestion: if user gave category but no location → ask location. If gave location but no category → ask what they need. If both given → empty string.`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
    });

    const parsed = JSON.parse(response.choices[0].message.content);
    return {
      intent: parsed.intent || 'general',
      searchType: parsed.searchType || '',
      followUpQuestion: parsed.followUpQuestion || '',
    };
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
