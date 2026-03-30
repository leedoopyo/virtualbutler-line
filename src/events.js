const AREA_CODE = {
  '서울': '1', 'seoul': '1',
  '인천': '2', 'incheon': '2',
  '대전': '3', 'daejeon': '3',
  '대구': '4', 'daegu': '4',
  '광주': '5', 'gwangju': '5',
  '부산': '6', 'busan': '6',
  '울산': '7', 'ulsan': '7',
  '세종': '8', 'sejong': '8',
  '경기': '31', 'gyeonggi': '31',
  '강원': '32', 'gangwon': '32',
  '충북': '33',
  '충남': '34',
  '경북': '35',
  '경남': '36',
  '전북': '37',
  '전남': '38',
  '제주': '39', 'jeju': '39',
};

function getTodayString() {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

function detectArea(text = '') {
  const t = text.toLowerCase();
  for (const [key, code] of Object.entries(AREA_CODE)) {
    if (t.includes(key.toLowerCase())) {
      return { name: key, code };
    }
  }
  return null;
}

function detectEventType(text = '') {
  const t = text.toLowerCase();
  if (t.includes('공연') || t.includes('concert') || t.includes('performance')) return 'concert';
  if (t.includes('전시') || t.includes('exhibition') || t.includes('exhibit')) return 'exhibition';
  if (t.includes('축제') || t.includes('festival')) return 'festival';
  return 'all';
}

export function isEventRequest(text = '') {
  const t = text.toLowerCase();
  return (
    t.includes('공연') || t.includes('전시') || t.includes('축제') ||
    t.includes('concert') || t.includes('exhibition') || t.includes('festival') ||
    t.includes('performance') || t.includes('event') || t.includes('행사') ||
    t.includes('볼만한') || t.includes('놀거리') || t.includes('문화')
  );
}

export async function searchEvents(userText, lang) {
  const TOUR_API_KEY = process.env.TOUR_API_KEY;
  if (!TOUR_API_KEY) return null;

  const today = getTodayString();
  const area = detectArea(userText);
  const areaCode = area ? area.code : '1'; // 기본 서울
  const areaName = area ? area.name : '서울';

  const url = new URL('https://apis.data.go.kr/B551011/KorService2/searchFestival2');
  url.searchParams.set('serviceKey', TOUR_API_KEY);
  url.searchParams.set('numOfRows', '5');
  url.searchParams.set('pageNo', '1');
  url.searchParams.set('MobileOS', 'ETC');
  url.searchParams.set('MobileApp', 'VirtualButlerKorea');
  url.searchParams.set('_type', 'json');
  url.searchParams.set('eventStartDate', today);
  url.searchParams.set('areaCode', areaCode);

  console.log('Event search URL:', url.toString());

  const response = await fetch(url.toString());
  console.log('Event API status:', response.status);

  if (!response.ok) return null;

  const data = await response.json();
  const items = data?.response?.body?.items?.item;

  if (!items || items.length === 0) return null;

  const list = Array.isArray(items) ? items.slice(0, 5) : [items];

  const header = {
    en: `🎭 Events in ${areaName} today:\n\n`,
    vi: `🎭 Sự kiện tại ${areaName} hôm nay:\n\n`,
    id: `🎭 Acara di ${areaName} hari ini:\n\n`,
    mn: `🎭 ${areaName} дахь өнөөдрийн арга хэмжээ:\n\n`,
  };

  const eventList = list.map((item, i) => {
    const name = item.title || '이름 없음';
    const place = item.addr1 || '장소 미정';
    const start = item.eventstartdate ? item.eventstartdate.replace(/(\d{4})(\d{2})(\d{2})/, '$1.$2.$3') : '';
    const end = item.eventenddate ? item.eventenddate.replace(/(\d{4})(\d{2})(\d{2})/, '$1.$2.$3') : '';
    const mapLink = `https://map.kakao.com/link/search/${encodeURIComponent(name)}`;

    return `${i + 1}. ${name}\n   📍 ${place}\n   📅 ${start}${end ? ' ~ ' + end : ''}\n   🗺️ ${mapLink}`;
  }).join('\n\n');

  return (header[lang] || header.en) + eventList;
}
