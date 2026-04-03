import { searchVBKPlaces } from './halal.js';
import {
  getPlacesFromSheets,
  formatSheetPlaces,
} from './sheets.js';

export const CATEGORY_MAP = {
  restaurant: 'FD6',
  cafe: 'CE7',
  convenience: 'CS2',
  culture: 'CT1',
  hotel: 'AD5',
  attraction: 'AT4',
  subway: 'SW8',
  bank: 'BK9',
  mart: 'MT1',
  hospital: 'HP8',
  pharmacy: 'PM9',
  public: 'PO3',
  school: 'SC4',
  gas: 'OL7',
  parking: 'PK6',
  halal: 'FD6',
  prayer: 'FD6',
};

// ✅ 수정: 한국어 쿼리로 교체
const KAKAO_QUERY_MAP = {
  restaurant: '음식점',
  cafe: '카페',
  convenience: '편의점',
  culture: '문화시설',
  hotel: '호텔',
  attraction: '관광지',
  subway: '지하철역',
  bank: '은행',
  mart: '마트',
  hospital: '병원',
  pharmacy: '약국',
  public: '공공기관',
  school: '학교',
  gas: '주유소',
  parking: '주차장',
  halal: '음식점',
  prayer: '기도실',
};

export const TYPE_EMOJI = {
  restaurant: '🍜',
  cafe: '☕',
  convenience: '🏪',
  culture: '🎭',
  hotel: '🏨',
  attraction: '📍',
  subway: '🚇',
  bank: '🏦',
  mart: '🛒',
  hospital: '🏥',
  pharmacy: '💊',
  public: '🏛️',
  school: '🏫',
  gas: '⛽',
  parking: '🅿️',
  halal: '🕌',
  prayer: '🕌',
};

export const TYPE_LABEL = {
  restaurant: { en: '🍜 Restaurants', id: '🍜 Restoran' },
  cafe: { en: '☕ Cafes', id: '☕ Kafe' },
  convenience: { en: '🏪 Convenience stores', id: '🏪 Minimarket' },
  culture: { en: '🎭 Cultural facilities', id: '🎭 Fasilitas budaya' },
  hotel: { en: '🏨 Hotels', id: '🏨 Hotel' },
  attraction: { en: '📍 Attractions', id: '📍 Tempat wisata' },
  subway: { en: '🚇 Subway stations', id: '🚇 Stasiun subway' },
  bank: { en: '🏦 Banks', id: '🏦 Bank' },
  mart: { en: '🛒 Supermarkets', id: '🛒 Supermarket' },
  hospital: { en: '🏥 Hospitals', id: '🏥 Rumah sakit' },
  pharmacy: { en: '💊 Pharmacies', id: '💊 Apotek' },
  public: { en: '🏛️ Public offices', id: '🏛️ Kantor pemerintah' },
  school: { en: '🏫 Schools', id: '🏫 Sekolah' },
  gas: { en: '⛽ Gas stations', id: '⛽ SPBU' },
  parking: { en: '🅿️ Parking lots', id: '🅿️ Parkir' },
  halal: { en: '🕌 Halal food', id: '🕌 Makanan halal' },
  prayer: { en: '🕌 Prayer places', id: '🕌 Tempat sholat' },
};

// ✅ 수정: 구글맵 링크로 변경
function googleMapLink(placeName, x, y) {
  if (x && y) {
    // 좌표가 있으면 좌표로 정확하게
    return `https://www.google.com/maps/search/?api=1&query=${y},${x}`;
  }
  // 이름으로 검색
  return `https://www.google.com/maps/search/${encodeURIComponent(placeName)}`;
}

function formatPlaces(places) {
  return places
    .map(
      (p, i) =>
        `${i + 1}. ${p.place_name}\n` +
        `   📍 ${p.road_address_name || p.address_name}\n` +
        `   📞 ${p.phone || 'No phone'}\n` +
        `   🗺️ ${googleMapLink(p.place_name, p.x, p.y)}`
    )
    .join('\n\n');
}

function findAreaKeyword(areaKeyword = '') {
  const t = String(areaKeyword).toLowerCase();

  if (t.includes('itaewon') || t.includes('이태원')) return '이태원';
  if (t.includes('myeongdong') || t.includes('명동')) return '명동';
  if (t.includes('hongdae') || t.includes('홍대')) return '홍대';
  if (t.includes('gangnam') || t.includes('강남')) return '강남';
  if (t.includes('jongno') || t.includes('종로')) return '종로';
  if (t.includes('gwanghwamun') || t.includes('광화문')) return '광화문';
  if (t.includes('dongdaemun') || t.includes('동대문')) return '동대문';
  if (t.includes('sinchon') || t.includes('신촌')) return '신촌';
  if (t.includes('jamsil') || t.includes('잠실')) return '잠실';
  if (t.includes('ansan') || t.includes('안산')) return '안산';
  if (t.includes('suwon') || t.includes('수원')) return '수원';
  if (t.includes('incheon') || t.includes('인천')) return '인천';
  if (t.includes('gwanak') || t.includes('관악')) return '관악';
  if (t.includes('bucheon') || t.includes('부천')) return '부천';
  if (t.includes('busan') || t.includes('부산')) return '부산';
  if (t.includes('jeju') || t.includes('제주')) return '제주';
  if (t.includes('insadong') || t.includes('인사동')) return '인사동';
  if (t.includes('bukchon') || t.includes('북촌')) return '북촌';
  if (t.includes('mapo') || t.includes('마포')) return '마포';
  if (t.includes('yongsan') || t.includes('용산')) return '용산';

  return t.trim();
}

function getSheetCategories(type = '') {
  if (type === 'halal') {
    return [
      'halal-restaurant',
      'muslim-friendly',
      'pork-free',
    ];
  }

  if (type === 'prayer') {
    return [
      'masjid',
      'prayer-room',
    ];
  }

  return [];
}

function searchSheetsPlaces(areaKeyword, type = 'halal', language = 'en') {
  const categories = getSheetCategories(type);
  const area = findAreaKeyword(areaKeyword);

  if (!categories.length) return null;

  const results = getPlacesFromSheets({
    area,
    categories,
    language,
    searchType: type,
  });

  if (!results.length) return null;

  return formatSheetPlaces(results, {
    limit: 5,
    showMeta: type === 'halal',
  });
}

async function geocodeLocation(locationName) {
  const KAKAO_API_KEY = process.env.KAKAO_API_KEY;
  if (!KAKAO_API_KEY) return null;

  const koreanArea = findAreaKeyword(locationName);
  const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(koreanArea)}&size=1`;

  try {
    const response = await fetch(url, {
      headers: { Authorization: `KakaoAK ${KAKAO_API_KEY}` },
    });

    if (!response.ok) return null;

    const data = await response.json();
    const place = data.documents?.[0];
    if (!place) return null;

    return {
      lat: parseFloat(place.y),
      lng: parseFloat(place.x),
      name: place.place_name,
    };
  } catch (err) {
    console.error('Geocode failed:', err.message);
    return null;
  }
}

export async function searchNearby(lat, lng, type = 'restaurant') {
  const KAKAO_API_KEY = process.env.KAKAO_API_KEY;
  if (!KAKAO_API_KEY) return null;

  if (type === 'halal' || type === 'prayer') {
    const vbkResult = searchVBKPlaces('', type);
    if (vbkResult) {
      console.log('[VBK] Nearby halal/prayer results from VBK map');
      return vbkResult;
    }
  }

  const categoryCode = CATEGORY_MAP[type] || 'FD6';
  const url = `https://dapi.kakao.com/v2/local/search/category.json?category_group_code=${categoryCode}&x=${lng}&y=${lat}&radius=500&sort=distance`;

  try {
    const response = await fetch(url, {
      headers: { Authorization: `KakaoAK ${KAKAO_API_KEY}` },
    });

    if (!response.ok) return null;

    const data = await response.json();
    const places = data.documents?.slice(0, 3);
    if (!places || places.length === 0) return null;

    return formatPlaces(places);
  } catch (err) {
    console.error('searchNearby failed:', err.message);
    return null;
  }
}

export async function searchByKeyword(areaKeyword, type = 'restaurant', language = 'en') {
  const KAKAO_API_KEY = process.env.KAKAO_API_KEY;

  if (type === 'halal' || type === 'prayer') {
    const sheetsResult = searchSheetsPlaces(areaKeyword, type, language);
    if (sheetsResult) {
      console.log(`[Sheets] Found in Sheets DB: ${areaKeyword}`);
      return sheetsResult;
    }

    const vbkResult = searchVBKPlaces(areaKeyword, type);
    if (vbkResult) {
      console.log(`[VBK] Found in VBK map: ${areaKeyword}`);
      return vbkResult;
    }

    console.log('[VBK] No results in Sheets/VBK, falling back to Kakao');
  }

  if (!KAKAO_API_KEY) return null;

  const koreanArea = findAreaKeyword(areaKeyword);
  const geo = await geocodeLocation(koreanArea);

  if (geo) {
    const results = await searchNearby(geo.lat, geo.lng, type);
    if (results) return results;
  }

  // ✅ 수정: 한국어 쿼리 사용
  const queryWord = KAKAO_QUERY_MAP[type] || '음식점';
  const searchQuery = `${koreanArea} ${queryWord}`;
  const categoryCode = CATEGORY_MAP[type] || 'FD6';

  console.log(`[Kakao] Searching: "${searchQuery}"`);

  try {
    const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(searchQuery)}&category_group_code=${categoryCode}&size=3`;

    const response = await fetch(url, {
      headers: { Authorization: `KakaoAK ${KAKAO_API_KEY}` },
    });

    if (!response.ok) return null;

    const data = await response.json();
    const places = data.documents?.slice(0, 3);
    if (!places || places.length === 0) return null;

    return formatPlaces(places);
  } catch (err) {
    console.error('Keyword search failed:', err.message);
    return null;
  }
}
