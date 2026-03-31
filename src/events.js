const AREA_CODE = {
  // 한글
  '서울': '1', '인천': '2', '대전': '3', '대구': '4',
  '광주': '5', '부산': '6', '울산': '7', '세종': '8',
  '경기': '31', '강원': '32', '충북': '33', '충남': '34',
  '경북': '35', '경남': '36', '전북': '37', '전남': '38', '제주': '39',
  // 영어
  'seoul': '1', 'incheon': '2', 'daejeon': '3', 'daegu': '4',
  'gwangju': '5', 'busan': '6', 'ulsan': '7', 'sejong': '8',
  'gyeonggi': '31', 'gangwon': '32', 'chungbuk': '33', 'chungnam': '34',
  'gyeongbuk': '35', 'gyeongnam': '36', 'jeonbuk': '37', 'jeonnam': '38', 'jeju': '39',
};

const AREA_DISPLAY = {
  '1': '서울', '2': '인천', '3': '대전', '4': '대구',
  '5': '광주', '6': '부산', '7': '울산', '8': '세종',
  '31': '경기', '32': '강원', '33': '충북', '34': '충남',
  '35': '경북', '36': '경남', '37': '전북', '38': '전남', '39': '제주',
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
      return { name: AREA_DISPLAY[code], code };
    }
  }
  return null;
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

function buildFestivalUrl(apiKey, today, areaCode = null) {
  const url = new URL('https://apis.data.go.kr/B551011/KorService2/searchFestival2');
  url.searchParams.set('serviceKey', apiKey);
  url.searchParams.set('numOfRows', '5');
  url.searchParams.set('pageNo', '1');
  url.searchParams.set('MobileOS', 'ETC');
  url.searchParams.set('MobileApp', 'VirtualButlerKorea');
  url.searchParams.set('_type', 'json');
  url.searchParams.set('eventStartDate', today);
  if (areaCode) url.searchParams.set('areaCode', areaCode);
  return url;
}

async function fetchEvents(apiKey, today, areaCode = null) {
  const url = buildFestivalUrl(apiKey, today, areaCode);
  console.log('Event search URL:', url.toString());
  const response = await fetch(url.toString());
  console.log('Event API status:', response.status);
  if (!response.ok) return null;
  const data = await response.json();
  const items = data?.response?.body?.items?.item;
  if (!items || items.length === 0) return null;
  return Array.isArray(items) ? items.slice(0, 5) : [items];
}

function formatEventList(list) {
  return list.map((item, i) => {
    const name = item.title || '이름 없음';
    const place = item.addr1 || '장소 미정';
    const start = item.eventstartdate
      ? item.eventstartdate.replace(/(\d{4})(\d{2})(\d{2})/, '$1.$2.$3') : '';
    const end = item.eventenddate
      ? item.eventenddate.replace(/(\d{4})(\d{2})(\d{2})/, '$1.$2.$3') : '';
    const mapLink = `https://map.kakao.com/link/search/${encodeURIComponent(name)}`;
    return `${i + 1}. ${name}\n   📍 ${place}\n   📅 ${start}${end ? ' ~ ' + end : ''}\n   🗺️ ${mapLink}`;
  }).join('\n\n');
}

function formatHeader(areaName, lang) {
  const headers = {
    en: `🎭 Events in ${areaName} today:\n\n`,
    vi: `🎭 Sự kiện tại ${areaName} hôm nay:\n\n`,
    id: `🎭 Acara di ${areaName} hari ini:\n\n`,
    mn: `🎭 ${areaName} дахь өнөөдрийн арга хэмжээ:\n\n`,
  };
  return headers[lang] || headers.en;
}

function formatNoLocal(areaName, lang) {
  const msgs = {
    en: `ℹ️ No events found in ${areaName} today. Here are events happening elsewhere in Korea:\n\n`,
    vi: `ℹ️ Không có sự kiện tại ${areaName} hôm nay. Đây là các sự kiện ở nơi khác:\n\n`,
    id: `ℹ️ Tidak ada acara di ${areaName} hari ini. Berikut acara di tempat lain:\n\n`,
    mn: `ℹ️ ${areaName}-д өнөөдөр арга хэмжээ байхгүй. Өөр газрын арга хэмжээнүүд:\n\n`,
  };
  return msgs[lang] || msgs.en;
}

function formatNoResult(lang) {
  const msgs = {
    en: `😅 No events found in Korea today. Try again tomorrow!`,
    vi: `😅 Không tìm thấy sự kiện nào ở Hàn Quốc hôm nay. Thử lại ngày mai nhé!`,
    id: `😅 Tidak ada acara di Korea hari ini. Coba lagi besok!`,
    mn: `😅 Өнөөдөр Солонгост арга хэмжээ олдсонгүй. Маргааш дахин үзнэ үү!`,
  };
  return msgs[lang] || msgs.en;
}

export async function searchEvents(userText, lang) {
  const TOUR_API_KEY = process.env.TOUR_API_KEY;
  if (!TOUR_API_KEY) return null;

  const today = getTodayString();
  const area = detectArea(userText);

  // 지역 감지된 경우 해당 지역 먼저 검색
  if (area) {
    const items = await fetchEvents(TOUR_API_KEY, today, area.code);
    if (items) {
      return formatHeader(area.name, lang) + formatEventList(items);
    }
    // 해당 지역 결과 없으면 전국 재검색
    console.log(`No events in ${area.name}, retrying nationwide`);
    const nationwideItems = await fetchEvents(TOUR_API_KEY, today);
    if (nationwideItems) {
      return formatNoLocal(area.name, lang) + formatEventList(nationwideItems);
    }
    return formatNoResult(lang);
  }

  // 지역 미감지 → 전국 검색
  const items = await fetchEvents(TOUR_API_KEY, today);
  if (items) {
    return formatHeader('Korea', lang) + formatEventList(items);
  }
  return formatNoResult(lang);
}
