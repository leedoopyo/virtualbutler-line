const AREA_MAP = {
  'yongsan': '용산',
  'hongdae': '홍대',
  'gangnam': '강남',
  'myeongdong': '명동',
  'itaewon': '이태원',
  'sinchon': '신촌',
  'sincheon': '신천',
  'jongno': '종로',
  'insadong': '인사동',
  'dongdaemun': '동대문',
  'mapo': '마포',
  'yeouido': '여의도',
  'hapjeong': '합정',
  'sangam': '상암',
  'apgujeong': '압구정',
  'cheongdam': '청담',
  'samsung': '삼성동',
  'seolleung': '선릉',
  'jamsil': '잠실',
  'songpa': '송파',
  'suwon': '수원',
  'incheon': '인천',
  'busan': '부산',
  'jeju': '제주',
  'sokcho': '속초',
  'seoul': '서울',
  'gangwon': '강원',
  'daejeon': '대전',
  'daegu': '대구',
  'gwangju': '광주',
  'bucheon': '부천',
  'bundang': '분당',
  'ilsan': '일산',
  'suwon': '수원',
};

function translateArea(text = '') {
  const t = text.trim().toLowerCase();
  return AREA_MAP[t] || text;
}

function kakaoMapLink(placeName, x, y) {
  if (x && y) {
    return `https://map.kakao.com/link/map/${encodeURIComponent(placeName)},${y},${x}`;
  }
  return `https://map.kakao.com/link/search/${encodeURIComponent(placeName)}`;
}

const CATEGORY_MAP = {
  restaurant: 'FD6',
  cafe: 'CE7',
  halal: 'FD6',
  pharmacy: 'PM9',
  hospital: 'HP8',
  hotel: 'AD5',
};

const QUERY_MAP = {
  restaurant: '맛집',
  cafe: '카페',
  halal: '할랄 음식',
  pharmacy: '약국',
  hospital: '병원',
  hotel: '호텔',
};

export async function searchByKeyword(areaKeyword, type = 'restaurant') {
  const translatedArea = translateArea(areaKeyword);
  const KAKAO_API_KEY = process.env.KAKAO_API_KEY;

  console.log('Kakao search:', translatedArea, type);

  if (!KAKAO_API_KEY) return null;

  const categoryCode = CATEGORY_MAP[type] || 'FD6';
  const queryWord = QUERY_MAP[type] || '맛집';
  const searchQuery = `${translatedArea} ${queryWord}`;

  const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(searchQuery)}&size=3`;

  const response = await fetch(url, {
    headers: { Authorization: `KakaoAK ${KAKAO_API_KEY}` },
  });

  console.log('Kakao status:', response.status);

  if (!response.ok) return null;

  const data = await response.json();
  const places = data.documents?.slice(0, 3);
  if (!places || places.length === 0) return null;

  return places
    .map((p, i) =>
      `${i + 1}. ${p.place_name}\n` +
      `   📍 ${p.road_address_name || p.address_name}\n` +
      `   📞 ${p.phone || '번호 없음'}\n` +
      `   🗺️ ${kakaoMapLink(p.place_name, p.x, p.y)}`
    )
    .join('\n\n');
}

export async function searchNearby(lat, lng, type = 'restaurant') {
  const KAKAO_API_KEY = process.env.KAKAO_API_KEY;
  if (!KAKAO_API_KEY) return null;

  const categoryCode = CATEGORY_MAP[type] || 'FD6';
  const url = `https://dapi.kakao.com/v2/local/search/category.json?category_group_code=${categoryCode}&x=${lng}&y=${lat}&radius=500&sort=distance`;

  const response = await fetch(url, {
    headers: { Authorization: `KakaoAK ${KAKAO_API_KEY}` },
  });

  if (!response.ok) return null;

  const data = await response.json();
  const places = data.documents?.slice(0, 3);
  if (!places || places.length === 0) return null;

  return places
    .map((p, i) =>
      `${i + 1}. ${p.place_name}\n` +
      `   📍 ${p.road_address_name || p.address_name}\n` +
      `   📞 ${p.phone || '번호 없음'}\n` +
      `   🚶 ${p.distance}m\n` +
      `   🗺️ ${kakaoMapLink(p.place_name, p.x, p.y)}`
    )
    .join('\n\n');
}

export function formatPlaceholder(lang) {
  const messages = {
    en: '🔍 Location search coming soon!\nFor now, try Naver Map or Kakao Map app.',
    vi: '🔍 Tính năng tìm kiếm gần bạn sắp ra mắt!\nTạm thời hãy dùng app Naver Map hoặc Kakao Map.',
    id: '🔍 Fitur pencarian terdekat segera hadir!\nSementara coba Naver Map atau Kakao Map.',
    mn: '🔍 Ойролцоох хайлт удахгүй нэмэгдэнэ!\nОдоохондоо Naver Map эсвэл Kakao Map ашиглаарай.',
  };
  return messages[lang] || messages.en;
}
