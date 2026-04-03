import { google } from 'googleapis';

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

// ✅ 수정: 여러 탭 지원
const SHEET_TABS = process.env.GOOGLE_SHEET_TABS
  ? process.env.GOOGLE_SHEET_TABS.split(',').map((t) => t.trim())
  : (process.env.GOOGLE_SHEET_NAME ? [process.env.GOOGLE_SHEET_NAME] : ['food_places']);

function getGoogleCredentials() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (!raw) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is missing');
  }

  const creds = JSON.parse(raw);

  return {
    ...creds,
    private_key: creds.private_key?.replace(/\\n/g, '\n'),
  };
}

const auth = new google.auth.GoogleAuth({
  credentials: getGoogleCredentials(),
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

let cache = [];

function parseList(value = '') {
  return String(value)
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

function parseListLower(value = '') {
  return String(value)
    .split(',')
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toBoolean(value) {
  const v = String(value || '').trim().toLowerCase();
  return v === 'true' || v === '1' || v === 'yes';
}

function normalizePlace(obj = {}) {
  return {
    name: obj.name || '',
    area: parseListLower(obj.area),
    category: parseListLower(obj.category),
    address: obj.address || '',
    info: obj.info || '',
    mapLink: obj.mapLink || '',
    rating: toNumber(obj.rating, 0),
    isActive: toBoolean(obj.isActive),
    priority: toNumber(obj.priority, 999),
    language: parseListLower(obj.language),
    priceLevel: obj.priceLevel || '',
    tags: parseListLower(obj.tags),

    // 확장 컬럼
    sourceName: obj.sourceName || '',
    sourceTrust: String(obj.sourceTrust || '').trim().toLowerCase(),
    muslimCategory: String(obj.muslimCategory || '').trim().toLowerCase(),
    halalFeatures: parseListLower(obj.halalFeatures),
    verificationNote: obj.verificationNote || '',
    lastChecked: obj.lastChecked || '',
  };
}

function mapRowToObject(headers = [], row = []) {
  const obj = {};
  headers.forEach((header, idx) => {
    obj[String(header || '').trim()] = row[idx] || '';
  });
  return obj;
}

// ✅ 구글맵 링크 자동 변환
function buildMapLink(place) {
  // 구글맵 링크면 그대로
  if (place.mapLink && place.mapLink.includes('google.com/maps')) {
    return place.mapLink;
  }

  // 카카오맵 포함 나머지 전부 구글맵으로 변환
  if (place.address) {
    return `https://www.google.com/maps/search/${encodeURIComponent(place.name + ', ' + place.address)}`;
  }

  return `https://www.google.com/maps/search/${encodeURIComponent(place.name)}`;
}

// ✅ 새로 추가: 탭 하나 읽기
async function loadSheetTab(sheets, tabName) {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${tabName}!A:Z`,
    });

    const rows = res.data.values || [];

    if (rows.length < 2) {
      console.log(`[Sheets] No rows in tab: ${tabName}`);
      return [];
    }

    const headers = rows[0];

    const places = rows
      .slice(1)
      .map((row) => mapRowToObject(headers, row))
      .map((obj) => normalizePlace(obj))
      .filter((p) => p.name && p.isActive);

    console.log(`[Sheets] Loaded ${places.length} places from tab: ${tabName}`);
    return places;

  } catch (err) {
    console.error(`[Sheets] Failed to load tab "${tabName}":`, err.message);
    return [];
  }
}

export async function loadSheetsData() {
  if (!SHEET_ID) {
    console.warn('[Sheets] GOOGLE_SHEET_ID is missing');
    cache = [];
    return cache;
  }

  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  // ✅ 모든 탭 병렬로 읽기
  const allResults = await Promise.all(
    SHEET_TABS.map((tab) => loadSheetTab(sheets, tab))
  );

  // ✅ 모든 탭 결과 합치기
  cache = allResults
    .flat()
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return b.rating - a.rating;
    });

  console.log(`[Sheets] Total loaded: ${cache.length} places from ${SHEET_TABS.length} tabs`);
  return cache;
}

export function getAllPlacesFromSheets() {
  return cache;
}

export function getPlacesFromSheets({
  area = '',
  categories = [],
  language = '',
  searchType = '',
} = {}) {
  const areaKey = String(area || '').trim().toLowerCase();
  const languageKey = String(language || '').trim().toLowerCase();
  const categoryKeys = (categories || []).map((v) => String(v).trim().toLowerCase()).filter(Boolean);
  const typeKey = String(searchType || '').trim().toLowerCase();

  return cache.filter((p) => {
    if (areaKey) {
      const areaMatched =
        p.area.includes(areaKey) ||
        p.address.toLowerCase().includes(areaKey) ||
        p.tags.some((tag) => tag.includes(areaKey) || areaKey.includes(tag));

      if (!areaMatched) return false;
    }

    if (languageKey && p.language.length > 0 && !p.language.includes(languageKey)) {
      return false;
    }

    if (categoryKeys.length > 0) {
      const categoryMatched =
        p.category.some((c) => categoryKeys.includes(c)) ||
        categoryKeys.includes(p.muslimCategory);

      if (!categoryMatched) return false;
    }

    if (typeKey === 'halal') {
      const halalMatched =
        p.category.includes('halal-restaurant') ||
        p.category.includes('muslim-friendly') ||
        p.category.includes('pork-free') ||
        p.muslimCategory === 'halal-certified' ||
        p.muslimCategory === 'self-certified' ||
        p.muslimCategory === 'muslim-friendly' ||
        p.muslimCategory === 'pork-free' ||
        p.tags.includes('halal') ||
        p.tags.includes('halal-menu') ||
        p.tags.includes('pork-free') ||
        p.halalFeatures.includes('halal-menu') ||
        p.halalFeatures.includes('pork-free');

      if (!halalMatched) return false;
    }

    if (typeKey === 'prayer') {
      const prayerMatched =
        p.category.includes('masjid') ||
        p.category.includes('prayer-room') ||
        p.tags.includes('masjid') ||
        p.tags.includes('prayer') ||
        p.tags.includes('prayer-room') ||
        p.halalFeatures.includes('prayer-room') ||
        p.halalFeatures.includes('prayer-room-possible');

      if (!prayerMatched) return false;
    }

    return true;
  });
}

export function formatSheetPlaces(places = [], options = {}) {
  const {
    limit = 3,
    showMeta = false,
  } = options;

  return places
    .slice(0, limit)
    .map((p, i) => {
      const lines = [
        `${i + 1}. ${p.name}`,
        `   📍 ${p.address || 'No address'}`,
      ];

      // ✅ 평점 있으면 표시
      if (p.rating && p.rating > 0) {
        lines.push(`   ⭐ ${p.rating}`);
      }

      lines.push(`   ℹ️ ${p.info || 'No description'}`);

      if (showMeta) {
        const meta = [
          p.muslimCategory,
          ...(p.halalFeatures || []).slice(0, 3),
        ].filter(Boolean);

        if (meta.length) {
          lines.push(`   ✅ ${meta.join(' · ')}`);
        }
      }

      // ✅ 구글맵 링크로 자동 변환
      const mapUrl = buildMapLink(p);
      lines.push(`   🗺️ ${mapUrl}`);

      return lines.join('\n');
    })
    .join('\n\n');
}

export async function refreshSheetsData() {
  return loadSheetsData();
}
