import OpenAI from 'openai';

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

function fallbackIntent(text = '') {
  const t = text.toLowerCase().trim();

  // emergency
  if (
    t.includes('emergency') || t.includes('police') || t.includes('accident') ||
    t.includes('ambulance') || t.includes('fire') ||
    t.includes('darurat') || t.includes('tolong cepat') ||
    t.includes('긴급') || t.includes('응급') || t.includes('경찰') || t.includes('불')
  ) {
    return { intent: 'emergency', searchType: '' };
  }

  // events
  if (
    t.includes('event') || t.includes('events') || t.includes('festival') ||
    t.includes('concert') || t.includes('performance') || t.includes('show') ||
    t.includes('exhibition') || t.includes('things to do') ||
    t.includes('acara') || t.includes('festival') ||
    t.includes('공연') || t.includes('전시') || t.includes('축제') || t.includes('행사')
  ) {
    return { intent: 'events', searchType: 'event' };
  }

  // places
  if (
    t.includes('hospital') || t.includes('clinic') || t.includes('doctor') ||
    t.includes('rumah sakit') || t.includes('klinik') ||
    t.includes('병원')
  ) {
    return { intent: 'places', searchType: 'hospital' };
  }

  if (
    t.includes('pharmacy') || t.includes('medicine') || t.includes('drug') ||
    t.includes('apotek') || t.includes('obat') ||
    t.includes('약국')
  ) {
    return { intent: 'places', searchType: 'pharmacy' };
  }

  if (
    t.includes('hotel') || t.includes('accommodation') || t.includes('stay') ||
    t.includes('motel') || t.includes('penginapan') ||
    t.includes('호텔')
  ) {
    return { intent: 'places', searchType: 'hotel' };
  }

  if (
    t.includes('halal') || t.includes('halal food') || t.includes('halal restaurant') ||
    t.includes('makanan halal') || t.includes('restoran halal') ||
    t.includes('할랄')
  ) {
    return { intent: 'places', searchType: 'halal' };
  }

  if (
    t.includes('prayer room') || t.includes('mosque') || t.includes('masjid') ||
    t.includes('musholla') || t.includes('musolla') || t.includes('tempat sholat') ||
    t.includes('기도실') || t.includes('모스크') || t.includes('기도')
  ) {
    return { intent: 'places', searchType: 'halal' };
  }

  if (
    t.includes('cafe') || t.includes('coffee') || t.includes('kafe') ||
    t.includes('카페')
  ) {
    return { intent: 'places', searchType: 'cafe' };
  }

  if (
    t.includes('movie') || t.includes('cinema') || t.includes('theater') ||
    t.includes('theatre') || t.includes('museum') || t.includes('gallery') ||
    t.includes('영화관') || t.includes('박물관')
  ) {
    return { intent: 'places', searchType: 'culture' };
  }

  if (
    t.includes('convenience store') || t.includes('convenience') ||
    t.includes('7-eleven') || t.includes('gs25') || t.includes('cu') ||
    t.includes('minimarket') || t.includes('편의점')
  ) {
    return { intent: 'places', searchType: 'convenience' };
  }

  if (
    t.includes('mart') || t.includes('supermarket') || t.includes('grocery') ||
    t.includes('마트') || t.includes('슈퍼')
  ) {
    return { intent: 'places', searchType: 'mart' };
  }

  if (
    t.includes('bank') || t.includes('atm') || t.includes('money exchange') ||
    t.includes('은행')
  ) {
    return { intent: 'places', searchType: 'bank' };
  }

  if (
    t.includes('parking') || t.includes('parkir') || t.includes('car park') ||
    t.includes('주차')
  ) {
    return { intent: 'places', searchType: 'parking' };
  }

  if (
    t.includes('gas station') || t.includes('petrol') || t.includes('fuel') ||
    t.includes('주유소')
  ) {
    return { intent: 'places', searchType: 'gas' };
  }

  if (
    t.includes('attraction') || t.includes('tourist') || t.includes('sightseeing') ||
    t.includes('tempat wisata') || t.includes('wisata') ||
    t.includes('관광') || t.includes('명소')
  ) {
    return { intent: 'places', searchType: 'attraction' };
  }

  if (
    t.includes('restaurant') || t.includes('food') || t.includes('eat') ||
    t.includes('hungry') || t.includes('restoran') || t.includes('makan') ||
    t.includes('맛집') || t.includes('식당')
  ) {
    return { intent: 'places', searchType: 'restaurant' };
  }

  return { intent: 'general', searchType: '' };
}

// named export 반드시 유지
export async function detectIntent(text = '', lang = 'en') {
  const fallback = fallbackIntent(text);

  // fallback으로 충분하면 바로 반환
  if (fallback.intent !== 'general') {
    return {
      intent: fallback.intent,
      searchType: fallback.searchType || '',
      clarifyQuestion: '',
      followUpQuestion: '',
    };
  }

  // OpenAI 키 없으면 general 반환
  if (!openai) {
    return {
      intent: 'general',
      searchType: '',
      clarifyQuestion: '',
      followUpQuestion: '',
    };
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 120,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You classify user intent for a Korea travel assistant.
Return JSON only.

{
  "intent": "places | events | emergency | general",
  "searchType": "restaurant | cafe | convenience | culture | hotel | attraction | subway | bank | mart | hospital | pharmacy | public | school | gas | parking | halal | ",
  "clarifyQuestion": "",
  "followUpQuestion": ""
}

Rules:
- Keep it simple.
- Prefer "general" if unsure.
- Do not write explanations outside JSON.
- Do not ask long clarifying questions.`,
        },
        {
          role: 'user',
          content: text,
        },
      ],
    });

    const parsed = JSON.parse(response.choices?.[0]?.message?.content || '{}');

    return {
      intent: parsed.intent || 'general',
      searchType: parsed.searchType || '',
      clarifyQuestion: '',
      followUpQuestion: '',
    };
  } catch (err) {
    console.error('AI router failed, using general fallback:', err.message);
    return {
      intent: 'general',
      searchType: '',
      clarifyQuestion: '',
      followUpQuestion: '',
    };
  }
}
