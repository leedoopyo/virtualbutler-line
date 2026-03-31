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
  restaurant: { en: '🍜 Restaurants', vi: '🍜 Nhà hàng', id: '🍜 Restoran', mn: '🍜 Ресторан' },
  cafe: { en: '☕ Cafes', vi: '☕ Quán cà phê', id: '☕ Kafe', mn: '☕ Кафе' },
  convenience: { en: '🏪 Convenience stores', vi: '🏪 Cửa hàng tiện lợi', id: '🏪 Minimarket', mn: '🏪 Дэлгүүр' },
  culture: { en: '🎭 Cultural facilities', vi: '🎭 Cơ sở văn hóa', id: '🎭 Fasilitas budaya', mn: '🎭 Соёлын байгууллага' },
  hotel: { en: '🏨 Hotels', vi: '🏨 Khách sạn', id: '🏨 Hotel', mn: '🏨 Зочид буудал' },
  attraction: { en: '📍 Attractions', vi: '📍 Điểm du lịch', id: '📍 Tempat wisata', mn: '📍 Аяллын газар' },
  subway: { en: '🚇 Subway stations', vi: '🚇 Ga tàu điện', id: '🚇 Stasiun subway', mn: '🚇 Метроны буудал' },
  bank: { en: '🏦 Banks', vi: '🏦 Ngân hàng', id: '🏦 Bank', mn: '🏦 Банк' },
  mart: { en: '🛒 Supermarkets', vi: '🛒 Siêu thị', id: '🛒 Supermarket', mn: '🛒 Дэлгүүр' },
  hospital: { en: '🏥 Hospitals', vi: '🏥 Bệnh viện', id: '🏥 Rumah sakit', mn: '🏥 Эмнэлэг' },
  pharmacy: { en: '💊 Pharmacies', vi: '💊 Nhà thuốc', id: '💊 Apotek', mn: '💊 Эмийн сан' },
  public: { en: '🏛️ Public offices', vi: '🏛️ Cơ quan công quyền', id: '🏛️ Kantor pemerintah', mn: '🏛️ Төрийн байгууллага' },
  school: { en: '🏫 Schools', vi: '🏫 Trường học', id: '🏫 Sekolah', mn: '🏫 Сургууль' },
  gas: { en: '⛽ Gas stations', vi: '⛽ Trạm xăng', id: '⛽ SPBU', mn: '⛽ Шатахуун' },
  parking: { en: '🅿️ Parking lots', vi: '🅿️ Bãi đỗ xe', id: '🅿️ Parkir', mn: '🅿️ Зогсоол' },
  halal: { en: '🕌 Halal food', vi: '🕌 Đồ ăn halal', id: '🕌 Makanan halal', mn: '🕌 Халал хоол' },
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
