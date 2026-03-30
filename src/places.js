const CATEGORY_MAP = {
  restaurant: 'FD6',
  cafe: 'CE7',
  halal: 'FD6',
  pharmacy: 'PM9',
  hospital: 'HP8',
  hotel: 'AD5',
  attraction: 'AT4',
};

const QUERY_MAP = {
  restaurant: '맛집',
  cafe: '카페',
  halal: '할랄 음식',
  pharmacy: '약국',
  hospital: '병원',
  hotel: '호텔',
  attraction: '관광지',
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
      `   📞 ${p.phone || '번호 없음'}\n` +
      `   🗺️ ${kakaoMapLink(p.place_name, p.x, p.y)}`
    )
    .join('\n\n');
}

// 지명 → 좌표 변환
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

    console.log(`Geocoded "${locationName}" → ${place.place_name} (${place.y}, ${place.x})`);

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

// 좌표 기반 반경 검색
export async function searchNearby(lat, lng, type = 'restaurant') {
  const KAKAO_API_KEY = process.env.KAKAO_API_KEY;
  if (!KAKAO_API_KEY) return null;

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

// 지명 + 카테고리 검색 (지명을 좌표로 변환 후 반경 검색)
export async function searchByKeyword(areaKeyword, type = 'restaurant') {
  const KAKAO_API_KEY = process.env.KAKAO_API_KEY;
  if (!KAKAO_API_KEY) return null;

  console.log(`searchByKeyword: "${areaKeyword}" / type: ${type}`);

  // 1. 지명 → 좌표 변환
  const geo = await geocodeLocation(areaKeyword);

  if (geo) {
    // 2. 좌표 기반 반경 500m 검색
    const results = await searchNearby(geo.lat, geo.lng, type);
    if (results) return results;
  }

  // 3. 좌표 변환 실패 or 반경 내 결과 없음 → 키워드 직접 검색
  console.log(`Fallback to keyword search: "${areaKeyword} ${QUERY_MAP[type]}"`);

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
