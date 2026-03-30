import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function fallbackIntent(text = '') {
  const t = text.toLowerCase();

  if (t.includes('hospital') || t.includes('clinic') ||
      t.includes('bệnh viện') || t.includes('эмнэлэг') || t.includes('rumah sakit')) {
    return { intent: 'places', searchType: 'hospital' };
  }
  if (t.includes('pharmacy') || t.includes('medicine') || t.includes('drug') ||
      t.includes('thuốc') || t.includes('эмийн') || t.includes('apotek')) {
    return { intent: 'places', searchType: 'pharmacy' };
  }
  if (t.includes('hotel') || t.includes('accommodation') || t.includes('stay') || t.includes('motel') ||
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
  if (t.includes('movie') || t.includes('cinema') || t.includes('theater') || t.includes('theatre') ||
      t.includes('museum') || t.includes('gallery') || t.includes('concert hall') ||
      t.includes('영화관') || t.includes('박물관') || t.includes('공연장')) {
    return { intent: 'places', searchType: 'culture' };
  }
  if (t.includes('convenience') || t.includes('7-eleven') || t.includes('gs25') || t.includes('cu ') ||
      t.includes('편의점')) {
    return { intent: 'places', searchType: 'convenience' };
  }
  if (t.includes('mart') || t.includes('supermarket') || t.includes('grocery') ||
      t.includes('마트') || t.includes('슈퍼')) {
    return { intent: 'places', searchType: 'mart' };
  }
  if (t.includes('bank') || t.includes('atm') ||
      t.includes('ngân hàng') || t.includes('банк') || t.includes('банкны')) {
    return { intent: 'places', searchType: 'bank' };
  }
  if (t.includes('parking') || t.includes('park my car') ||
      t.includes('주차') || t.includes('parkir')) {
    return { intent: 'places', searchType: 'parking' };
  }
  if (t.includes('gas station') || t.includes('petrol') || t.includes('fuel') ||
      t.includes('주유소') || t.includes('bensin')) {
    return { intent: 'places', searchType: 'gas' };
  }
  if (t.includes('attraction') || t.includes('tourist') || t.includes('sightseeing') ||
      t.includes('관광') || t.includes('명소')) {
    return { intent: 'places', searchType: 'attraction' };
  }
  if (t.includes('restaurant') || t.includes('food') || t.includes('eat') || t.includes('hungry') ||
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
      t.includes('ambulance') || t.includes('help me now') || t.includes('fire')) {
    return { intent: 'emergency', searchType: '' };
  }

  return { intent: 'general', searchType: '' };
}

export async function detectIntent(text = '', lang = 'en') {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 200,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are an intent classifier for a Korea travel assistant chatbot.
Analyze the user message and return JSON only.

{
  "intent": "places | events | emergency | general",
  "searchType": "restaurant | cafe | convenience | culture | hotel | attraction | subway | bank | mart | hospital | pharmacy | public | school | gas | parking | halal",
  "clarifyQuestion": "if the intent is ambiguous, ask a short clarifying question in English. Otherwise empty string.",
  "followUpQuestion": "short natural follow-up in English if needed, otherwise empty string"
}

SearchType mapping:
- restaurant, food, eat, hungry → restaurant
- cafe, coffee → cafe
- hotel, accommodation, motel, stay → hotel
- hospital, clinic, doctor, sick → hospital
- pharmacy, medicine, drug → pharmacy
- movie, cinema, theater, museum, gallery, concert hall → culture
- convenience store, 7-eleven, gs25, cu → convenience
- supermarket, mart, grocery → mart
- bank, ATM, money exchange → bank
- parking, car park → parking
- gas station, petrol, fuel → gas
- tourist attraction, sightseeing → attraction
- subway, metro station → subway
- halal → halal
- concert, festival, show, performance, exhibition → events intent
- emergency, police, accident, ambulance, fire → emergency intent

IMPORTANT:
- If user says "movie" → clarifyQuestion: "Are you looking for a movie theater nearby?"
- If user says "영화" → clarifyQuestion: "Are you looking for a movie theater nearby?"
- If intent is clearly places but no location → followUpQuestion: ask for location
- If intent is clearly places and location given → followUpQuestion: empty`,
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
      clarifyQuestion: parsed.clarifyQuestion || '',
      followUpQuestion: parsed.followUpQuestion || '',
    };
  } catch (err) {
    console.error('AI router failed, using fallback:', err.message);
    const fallback = fallbackIntent(text);
    return {
      intent: fallback.intent,
      searchType: fallback.searchType || '',
      clarifyQuestion: '',
      followUpQuestion: '',
    };
  }
}
