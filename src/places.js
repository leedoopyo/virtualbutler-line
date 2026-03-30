export async function searchNearby(lat, lng, category = 'restaurant') {
  // 카카오 API 키 받으면 여기 채웁니다
  // const KAKAO_API_KEY = process.env.KAKAO_API_KEY;
  // GET https://dapi.kakao.com/v2/local/search/category.json
  //   ?category_group_code=FD6
  //   &x=${lng}&y=${lat}&radius=500

  return null;
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
