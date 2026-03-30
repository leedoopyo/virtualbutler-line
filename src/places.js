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

// 영문 주소를 한글로 변환
async function convertToKoreanAddress(address) {
  const KAKAO_API_KEY = process.env.KAKAO_API_KEY;
  const url = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`;

  const response = await fetch(url, {
    headers: { Authorization: `KakaoAK ${KAKAO_API_KEY}` },
  });

  if (!response.ok) return address;

  const data = await response.json();
  if (data.documents && data.documents.length > 0) {
    return data.documents[0].address_name || address;
  }
  return address;
}

export async function searchByKeyword(areaKeyword, type = 'restaurant') {
  const KAKAO_API_KEY = process.env.KAKAO_API_KEY;
  if (!KAKAO_API_KEY) return null;

  // 영문이 포함된 경우 한글 변환 시도
  const hasEnglish = /[a-zA-Z]/.test(areaKeyword);
  const searchArea = hasEnglish
    ? await convertToKoreanAddress(areaKeyword)
    : areaKeyword;

  const categoryCode = CATEGORY_MAP[type] || 'FD6';
  const queryWord = QUERY_MAP[type] || '맛집';
  const searchQuery = `${searchArea} ${queryWord}`;

  const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(searchQuery)}&category_group_code=${categoryCode}&size=3`;

  const response = await fetch(url, {
    headers: { Authorization: `KakaoAK ${KAKAO_API_KEY}` },
  });

  if (!response.ok) return null;

  const data = await response.json();
  const places = data.documents?.slice(0, 3);
  if (!places || places.length === 0) return null;

  return places
    .map((p, i) => `${i + 1}. ${p.place_name}\n   📍 ${p.road_address_name || p.address_name}\n   📞 ${p.phone || '번호 없음'}`)
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
    .map((p, i) => `${i + 1}. ${p.place_name}\n   📍 ${p.road_address_name || p.address_name}\n   📞 ${p.phone || '번호 없음'}\n   🚶 ${p.distance}m`)
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
