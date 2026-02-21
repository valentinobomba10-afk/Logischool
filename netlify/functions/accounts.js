const STORE_NAME = 'logischool';
const ACCOUNTS_KEY = 'accounts-v1';
const ADMIN_CODE = 'Cabra2031';

const BASE_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

let blobsModule = null;
try {
  blobsModule = require('@netlify/blobs');
} catch (err) {
  blobsModule = null;
}

const jsonResponse = (statusCode, body) => ({
  statusCode,
  headers: BASE_HEADERS,
  body: JSON.stringify(body || {})
});

const safeJsonParse = (raw) => {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (err) {
    return {};
  }
};

const getStore = (event) => {
  if (!blobsModule || typeof blobsModule.getStore !== 'function') return null;
  try {
    if (typeof blobsModule.connectLambda === 'function') blobsModule.connectLambda(event);
  } catch (err) {}
  try {
    return blobsModule.getStore(STORE_NAME);
  } catch (err) {
    return null;
  }
};

const normalizeName = (value) => String(value || '').trim().slice(0, 18);
const normalizePin = (value) => String(value || '').trim();
const normalizeId = (value) => String(value || '').trim().slice(0, 80);

const sanitizeUser = (user) => {
  if (!user || typeof user !== 'object') return null;
  const id = normalizeId(user.id) || `u_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
  const username = normalizeName(user.username);
  const pin = normalizePin(user.pin);
  if (!username || !/^\d{4}$/.test(pin)) return null;
  return {
    id,
    username,
    pin,
    createdAt: String(user.createdAt || new Date().toISOString()),
    recovery: user.recovery && typeof user.recovery === 'object' ? user.recovery : { email: '', phone: '' },
    bonusPoints: Number(user.bonusPoints || 0),
    stats: user.stats && typeof user.stats === 'object' ? user.stats : { bestScores: {}, gamesPlayed: [] },
    cosmetics: user.cosmetics && typeof user.cosmetics === 'object' ? user.cosmetics : {}
  };
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: BASE_HEADERS, body: '' };
  if (event.httpMethod !== 'POST') return jsonResponse(405, { error: 'Method not allowed' });

  const store = getStore(event);
  if (!store) return jsonResponse(500, { error: 'Store unavailable' });

  const payload = safeJsonParse(event.body);
  const action = String(payload.action || '').trim().toLowerCase();

  const db = (await store.get(ACCOUNTS_KEY, { type: 'json' })) || { users: [] };
  if (!Array.isArray(db.users)) db.users = [];

  if (action === 'register') {
    const user = sanitizeUser(payload.user);
    if (!user) return jsonResponse(400, { error: 'Invalid user data.' });
    const exists = db.users.some((u) => String(u.username || '').toLowerCase() === user.username.toLowerCase());
    if (exists) return jsonResponse(409, { error: 'Username already exists.' });
    db.users.push(user);
    await store.setJSON(ACCOUNTS_KEY, db);
    return jsonResponse(200, { ok: true, user });
  }

  if (action === 'login') {
    const username = normalizeName(payload.username);
    const pin = normalizePin(payload.pin);
    const user = db.users.find(
      (u) => String(u.username || '').toLowerCase() === username.toLowerCase() && String(u.pin || '') === pin
    );
    if (!user) return jsonResponse(401, { error: 'Incorrect username or PIN.' });
    return jsonResponse(200, { ok: true, user });
  }

  if (action === 'upsert') {
    const user = sanitizeUser(payload.user);
    if (!user) return jsonResponse(400, { error: 'Invalid user data.' });
    const idx = db.users.findIndex((u) => normalizeId(u.id) === user.id);
    if (idx >= 0) db.users[idx] = { ...db.users[idx], ...user };
    else db.users.push(user);
    await store.setJSON(ACCOUNTS_KEY, db);
    return jsonResponse(200, { ok: true, user });
  }

  if (action === 'admin_reset_pin') {
    if (String(payload.adminCode || '') !== ADMIN_CODE) return jsonResponse(403, { error: 'Invalid admin code.' });
    const target = String(payload.target || '').trim().toLowerCase();
    const newPin = normalizePin(payload.newPin);
    if (!target) return jsonResponse(400, { error: 'Target required.' });
    if (!/^\d{4}$/.test(newPin)) return jsonResponse(400, { error: 'PIN must be 4 digits.' });
    const user = db.users.find((u) => {
      const id = normalizeId(u.id).toLowerCase();
      const username = normalizeName(u.username).toLowerCase();
      return id === target || username === target;
    });
    if (!user) return jsonResponse(404, { error: 'User not found.' });
    user.pin = newPin;
    await store.setJSON(ACCOUNTS_KEY, db);
    return jsonResponse(200, { ok: true, username: user.username });
  }

  return jsonResponse(400, { error: 'Unknown action.' });
};
