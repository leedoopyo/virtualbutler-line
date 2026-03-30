const userLangMap = new Map();
const userLocationMap = new Map();
const userStateMap = new Map();

export function getSession(userId) {
  return userLangMap.get(userId) || null;
}

export function setSession(userId, lang) {
  userLangMap.set(userId, lang);
}

export function getLocation(userId) {
  return userLocationMap.get(userId) || null;
}

export function setLocation(userId, lat, lng, address = '') {
  userLocationMap.set(userId, { lat, lng, address });
}

export function getState(userId) {
  return userStateMap.get(userId) || null;
}

export function setState(userId, state) {
  if (state === null) {
    userStateMap.delete(userId);
  } else {
    userStateMap.set(userId, state);
  }
}
