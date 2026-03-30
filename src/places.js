const CATEGORY_MAP = {
  '1': 'FD6',
  '2': 'CE7',
  '3': 'FD6',
  '4': 'PM9',
  '5': 'HP8',
};

// 지역명으로 키워드 검색
export async function searchByKeyword(keyword, category = 'FD6') {
  const KAKAO_API_KEY = process.env.KAKAO_API_KEY;
  if (!KAKAO_API_KEY) return null;

  const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(keyword + ' 맛집')}&category_group_code=${category}&size=3`;

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

// 좌표로 근처 검색
export async function searchNearby(lat, lng, category = '1') {
  const KAKAO_API_KEY = process.env.KAKAO_API_KEY;
  if (!KAKAO_API_KEY) return null;

  const categoryCode = CATEGORY_MAP[category] || 'FD6';
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
