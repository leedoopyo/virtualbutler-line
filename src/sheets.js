const { google } = require('googleapis');

const SHEET_ID = '여기에_SHEET_ID';
const SHEET_NAME = 'places';

const auth = new google.auth.GoogleAuth({
  keyFile: './config/google-service-account.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

let cache = [];

function parseTags(value = '') {
  return value.split(',').map(v => v.trim().toLowerCase());
}

async function loadData() {
  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A1:L`,
  });

  const rows = res.data.values;
  const headers = rows[0];

  cache = rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = row[i];
    });

    return {
      name: obj.name,
      area: parseTags(obj.area),
      category: parseTags(obj.category),
      address: obj.address,
      info: obj.info,
      mapLink: obj.mapLink,
      rating: Number(obj.rating),
      isActive: obj.isActive === 'TRUE',
      priority: Number(obj.priority),
      language: parseTags(obj.language),
      priceLevel: obj.priceLevel,
      tags: parseTags(obj.tags),
    };
  }).filter(p => p.isActive)
    .sort((a, b) => a.priority - b.priority);

  console.log('✅ Sheet loaded:', cache.length);
}

function getPlaces({ area, category, language }) {
  return cache.filter(p => {
    if (area && !p.area.includes(area)) return false;
    if (category && !p.category.includes(category)) return false;
    if (language && p.language.length && !p.language.includes(language)) return false;
    return true;
  });
}

module.exports = {
  loadData,
  getPlaces,
};
