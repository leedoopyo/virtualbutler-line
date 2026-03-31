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

export const QUERY_MAP = {
  restaurant: 'restaurant',
  cafe: 'cafe',
  convenience: 'convenience store',
  culture: 'cultural facility',
  hotel: 'hotel',
  attraction: 'attraction',
  subway: 'subway station',
  bank: 'bank',
  mart: 'supermarket',
  hospital: 'hospital',
  pharmacy: 'pharmacy',
  public: 'public office',
  school: 'school',
  gas: 'gas station',
  parking: 'parking',
  halal: 'halal food',
  prayer: 'prayer room',
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

function kakaoMapLink(placeName, x, y) {
  if (x && y) {
    return `https://map.kakao.com/link/map/${encodeURIComponent(placeName)},${y},${x}`;
  }
  return `https://map.kakao.com/link/search/${encodeURIComponent(placeName)}`;
}

function formatPlaces(places) {
  return places
    .map(
      (p, i) =>
        `${i + 1}. ${p.place_name}\n` +
        `   📍 ${p.road_address_name || p.address_name}\n` +
        `   📞 ${p.phone || 'No phone'}\n` +
        `   🗺️ ${kakaoMapLink(p.place_name, p.x, p.y)}`
    )
    .join('\n\n');
}

function findAreaKeyword(areaKeyword = '') {
  const t = String(areaKeyword).toLowerCase();

  if (t.includes('itaewon')) return 'itaewon';
  if (t.includes('myeongdong')) return 'myeongdong';
  if (t.includes('hongdae')) return 'hongdae';
  if (t.includes('gangnam')) return 'gangnam';
  if (t.includes('jongno')) return 'jongno';
  if (t.includes('gwanghwamun')) return 'gwanghwamun';
  if (t.includes('dongdaemun')) return 'dongdaemun';
  if (t.includes('sinchon')) return 'sinchon';
  if (t.includes('jamsil')) return 'jamsil';
  if (t.includes('ansan')) return 'ansan';
  if (t.includes('suwon')) return 'suwon';
  if (t.includes('incheon')) return 'incheon';
  if (t.includes('gwanak')) return 'gwanak';
  if (t.includes('bucheon')) return 'bucheon';

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

  const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(locationName)}&size=1`;

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

  const geo = await geocodeLocation(areaKeyword);

  if (geo) {
    const results = await searchNearby(geo.lat, geo.lng, type);
    if (results) return results;
  }

  const queryWord = QUERY_MAP[type] || 'restaurant';
  const searchQuery = `${areaKeyword} ${queryWord}`;
  const categoryCode = CATEGORY_MAP[type] || 'FD6';

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
