import { google } from 'googleapis';

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_NAME = process.env.GOOGLE_SHEET_NAME || 'places';

const auth = new google.auth.GoogleAuth({
  keyFile: './config/google-service-account.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

let cache = [];

function parseTags(value = '') {
  return String(value)
    .split(',')
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
}

function normalizePlace(obj = {}) {
  return {
    name: obj.name || '',
    area: parseTags(obj.area),
    category: parseTags(obj.category),
    address: obj.address || '',
    info: obj.info || '',
    mapLink: obj.mapLink || '',
    rating: Number(obj.rating || 0),
    isActive: String(obj.isActive || '').toUpperCase() === 'TRUE',
    priority: Number(obj.priority || 999),
    language: parseTags(obj.language),
    priceLevel: obj.priceLevel || '',
    tags: parseTags(obj.tags),
  };
}

export async function loadSheetsData() {
  if (!SHEET_ID) {
    console.warn('[Sheets] GOOGLE_SHEET_ID is missing');
    cache = [];
    return cache;
  }

  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A1:L`,
  });

  const rows = res.data.values || [];
  if (rows.length < 2) {
    cache = [];
    console.log('[Sheets] No rows found');
    return cache;
  }

  const headers = rows[0];
  cache = rows
    .slice(1)
    .map((row) => {
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = row[i] || '';
      });
      return normalizePlace(obj);
    })
    .filter((p) => p.isActive)
    .sort((a, b) => a.priority - b.priority);

  console.log(`[Sheets] Loaded ${cache.length} places`);
  return cache;
}

export function getPlacesFromSheets({ area = '', category = '', language = '' } = {}) {
  const areaKey = String(area || '').trim().toLowerCase();
  const categoryKey = String(category || '').trim().toLowerCase();
  const languageKey = String(language || '').trim().toLowerCase();

  return cache.filter((p) => {
    if (areaKey && !p.area.includes(areaKey)) return false;
    if (categoryKey && !p.category.includes(categoryKey)) return false;
    if (languageKey && p.language.length > 0 && !p.language.includes(languageKey)) return false;
    return true;
  });
}

export function formatSheetPlaces(places = []) {
  return places
    .map(
      (p, i) =>
        `${i + 1}. ${p.name}\n` +
        `   📍 ${p.address || 'No address'}\n` +
        `   ℹ️ ${p.info || 'No description'}\n` +
        `   🗺️ ${p.mapLink || 'No map link'}`
    )
    .join('\n\n');
}

export async function refreshSheetsData() {
  return loadSheetsData();
}
