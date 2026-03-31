// src/places.js

import { searchVBKPlaces } from './halal.js';

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
};

export const QUERY_MAP = {
  restaurant: '맛집',
  cafe: '카페',
  convenience: '편의점',
  culture: '문화시설',
  hotel: '호텔',
  attraction: '관광명소',
  subway: '지하철역',
  bank: '은행',
  mart: '마트',
  hospital: '병원',
  pharmacy: '약국',
  public: '공공기관',
  school: '학교',
  gas: '주유소',
  parking: '주차장',
  halal: '할랄 음식',
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
};

function kakaoMapLink(placeName, x, y) {
  if (x && y) {
    return `https://map.kakao.com/link/map/${encodeURIComponent(placeName)},${y},${x}`;
  }
  return `https://map.kakao.com/link/search/${encodeURIComponent(placeName)}`;
}

function formatPlaces(places) {
  return places
    .map((p, i) =>
      `${i + 1}. ${p.place_name}\n` +
      `   📍 ${p.road_address_name || p.address_name}\n` +
      `   📞 ${p.phone || 'No phone'}\n` +
      `   🗺️ ${kakaoMapLink(p.place_name, p.x, p.y)}`
    )
    .join('\n\n');
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

  // VBK map first for halal & prayer
  if (type === 'halal' || type === 'prayer') {
    const vbkResult = searchVBKPlaces('', type);
    if (vbkResult) {
      console.log(`[VBK] Nearby halal results from VBK map`);
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

export async function searchByKeyword(areaKeyword, type = 'restaurant') {
  const KAKAO_API_KEY = process.env.KAKAO_API_KEY;

  // VBK map first for halal & prayer
  if (type === 'halal' || type === 'prayer') {
    const vbkResult = searchVBKPlaces(areaKeyword, type);
    if (vbkResult) {
      console.log(`[VBK] Found "${areaKeyword}" in VBK map`);
      return vbkResult;
    }
    console.log(`[VBK] No results for "${areaKeyword}" in VBK map, falling back to Kakao`);
  }

  // Kakao fallback
  if (!KAKAO_API_KEY) return null;

  const geo = await geocodeLocation(areaKeyword);

  if (geo) {
    const results = await searchNearby(geo.lat, geo.lng, type);
    if (results) return results;
  }

  const queryWord = QUERY_MAP[type] || '맛집';
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
```

---

**변경 요약:**
```
halal/prayer 검색 시:
1순위 → VBK 맵 (halal.js)
       분당, 홍대, 수원 등 지역 매칭
       없으면 →
2순위 → 카카오 API (기존)

restaurant/hotel 등 일반 검색:
→ 카카오 API 그대로 사용
```

---

**테스트 예시:**
```
유저: "분당 할랄"
→ VBK에서 Bombaybrau, Indian Curry 반환 ✅

유저: "홍대 할랄"
→ VBK에서 Busanjib, Eid Halal, Halal Stacks 반환 ✅

유저: "강남 카페"
→ 카카오 API로 검색 (일반 검색) ✅
