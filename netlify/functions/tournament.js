const STORE_NAME = 'logischool';
const TOURNAMENT_KEY = 'tournament-v1';
const DAY_MS = 24 * 60 * 60 * 1000;
const ROUND_DURATION_MS = DAY_MS;
const MIN_ROUND_DURATION_MS = 60 * 60 * 1000;
const MAX_ROUND_DURATION_MS = 7 * DAY_MS;
const SEASON_DAYS = 100;
const MAX_ENTRIES = 500;
const MAX_LAST_WINNERS = 30;
const MAX_BADGES_PER_USER = 25;
const DEFAULT_GAME_ID = 'click-rush';
const ADMIN_CODE = 'Cabra2031';

let blobsModule = null;
try {
  blobsModule = require('@netlify/blobs');
} catch (err) {
  blobsModule = null;
}

const BASE_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

const jsonResponse = (statusCode, body) => ({
  statusCode,
  headers: BASE_HEADERS,
  body: JSON.stringify(body)
});

const emptyResponse = (statusCode) => ({
  statusCode,
  headers: BASE_HEADERS,
  body: ''
});

const normalizeId = (value, maxLen = 80) =>
  String(value || '')
    .trim()
    .slice(0, maxLen);

const normalizeUsername = (value) =>
  String(value || '')
    .trim()
    .slice(0, 18);

const normalizeScore = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return NaN;
  return Math.max(0, Math.round(n));
};

const normalizeTimestamp = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return NaN;
  return Math.round(n);
};

const normalizeDurationMs = (value, fallback = ROUND_DURATION_MS) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(MAX_ROUND_DURATION_MS, Math.max(MIN_ROUND_DURATION_MS, Math.round(n)));
};

const normalizeGameId = (value) =>
  String(value || '')
    .trim()
    .slice(0, 64);

const normalizeAvatarUrl = (value) => {
  const url = String(value || '')
    .trim()
    .slice(0, 500);
  return /^https?:\/\//.test(url) ? url : '';
};

const normalizeAvatarPreset = (value) =>
  String(value || '')
    .trim()
    .slice(0, 40);

const getStore = (event) => {
  if (!blobsModule || typeof blobsModule.getStore !== 'function') return null;
  try {
    if (typeof blobsModule.connectLambda === 'function') {
      blobsModule.connectLambda(event);
    }
  } catch (err) {
    // continue and try getStore anyway
  }
  try {
    return blobsModule.getStore(STORE_NAME);
  } catch (err) {
    try {
      return blobsModule.getStore({ name: STORE_NAME });
    } catch (err2) {
      return null;
    }
  }
};

const readJSON = async (store, key) => {
  try {
    const value = await store.get(key, { type: 'json' });
    if (!value || typeof value !== 'object') return null;
    return value;
  } catch (err) {
    const message = String(err?.message || '').toLowerCase();
    if (message.includes('not found')) return null;
    throw err;
  }
};

const writeJSON = async (store, key, value) => {
  if (typeof store.setJSON === 'function') {
    await store.setJSON(key, value);
    return;
  }
  await store.set(key, JSON.stringify(value));
};

const makeEvent = (startAt, gameId = DEFAULT_GAME_ID, title = '', durationMs = ROUND_DURATION_MS, seasonEndAt = NaN) => {
  const safeStart = normalizeTimestamp(startAt) || Date.now();
  const safeDuration = normalizeDurationMs(durationMs, ROUND_DURATION_MS);
  let endAt = safeStart + safeDuration;
  const cappedSeasonEnd = normalizeTimestamp(seasonEndAt);
  if (Number.isFinite(cappedSeasonEnd) && cappedSeasonEnd > safeStart) {
    endAt = Math.min(endAt, cappedSeasonEnd);
  }
  if (endAt <= safeStart) {
    endAt = safeStart + MIN_ROUND_DURATION_MS;
  }
  const safeGameId = normalizeGameId(gameId) || DEFAULT_GAME_ID;
  const safeTitle = String(title || `${safeGameId} Cup`)
    .trim()
    .slice(0, 90);
  return {
    id: `evt_${safeStart}_${Math.floor(Math.random() * 1000000)}`,
    title: safeTitle,
    gameId: safeGameId,
    startAt: safeStart,
    endAt,
    durationMs: Math.max(MIN_ROUND_DURATION_MS, endAt - safeStart),
    entries: {}
  };
};

const normalizeEntry = (raw) => {
  if (!raw || typeof raw !== 'object') return null;
  const userId = normalizeId(raw.userId, 80);
  const username = normalizeUsername(raw.username);
  const score = normalizeScore(raw.score);
  if ((!userId && !username) || !Number.isFinite(score)) return null;
  return {
    userId,
    username: username || 'Player',
    score,
    updatedAt: normalizeTimestamp(raw.updatedAt) || Date.now(),
    avatarUrl: normalizeAvatarUrl(raw.avatarUrl),
    avatarPreset: normalizeAvatarPreset(raw.avatarPreset)
  };
};

const normalizeBadgesByUser = (raw) => {
  const map = {};
  if (!raw || typeof raw !== 'object') return map;
  Object.keys(raw).forEach((key) => {
    const userId = normalizeId(key, 80);
    if (!userId) return;
    const rows = Array.isArray(raw[key]) ? raw[key] : [];
    map[userId] = rows
      .map((row) => {
        if (!row || typeof row !== 'object') return null;
        const id = normalizeId(row.id, 120);
        const place = Number(row.place) || 0;
        const eventId = normalizeId(row.eventId, 90);
        const gameId = normalizeGameId(row.gameId);
        const label = String(row.label || '')
          .trim()
          .slice(0, 90);
        const awardedAt = normalizeTimestamp(row.awardedAt);
        if (!id || !place || !eventId || !gameId || !Number.isFinite(awardedAt)) return null;
        return { id, place, eventId, gameId, label, awardedAt };
      })
      .filter(Boolean)
      .sort((a, b) => b.awardedAt - a.awardedAt)
      .slice(0, MAX_BADGES_PER_USER);
  });
  return map;
};

const getSortedEntries = (event) => {
  const rows = Object.values(event?.entries || {}).map((row) => normalizeEntry(row)).filter(Boolean);
  return rows
    .sort((a, b) => {
      const scoreDiff = b.score - a.score;
      if (scoreDiff !== 0) return scoreDiff;
      return b.updatedAt - a.updatedAt;
    })
    .slice(0, MAX_ENTRIES);
};

const awardRoundBadges = (state, now) => {
  const event = state.event;
  const sorted = getSortedEntries(event);
  const winners = sorted.slice(0, 3).map((row, index) => ({
    id: `badge_${event.id}_${index + 1}_${row.userId || row.username.toLowerCase()}`,
    place: index + 1,
    eventId: event.id,
    gameId: event.gameId,
    label: `${event.gameId} Cup`,
    awardedAt: now,
    userId: row.userId || '',
    username: row.username,
    score: row.score
  }));

  if (winners.length) {
    state.lastWinners = [...winners, ...(Array.isArray(state.lastWinners) ? state.lastWinners : [])]
      .slice(0, MAX_LAST_WINNERS)
      .map((row) => ({
        id: normalizeId(row.id, 120),
        place: Number(row.place) || 0,
        eventId: normalizeId(row.eventId, 90),
        gameId: normalizeGameId(row.gameId),
        label: String(row.label || '').slice(0, 90),
        awardedAt: normalizeTimestamp(row.awardedAt) || now,
        userId: normalizeId(row.userId, 80),
        username: normalizeUsername(row.username) || 'Player',
        score: normalizeScore(row.score) || 0
      }));
  }

  winners.forEach((winner) => {
    const userId = normalizeId(winner.userId, 80);
    if (!userId) return;
    const existing = Array.isArray(state.badgesByUser[userId]) ? state.badgesByUser[userId] : [];
    if (existing.some((badge) => badge.id === winner.id)) return;
    state.badgesByUser[userId] = [
      {
        id: winner.id,
        place: winner.place,
        eventId: winner.eventId,
        gameId: winner.gameId,
        label: winner.label,
        awardedAt: winner.awardedAt
      },
      ...existing
    ]
      .sort((a, b) => Number(b.awardedAt || 0) - Number(a.awardedAt || 0))
      .slice(0, MAX_BADGES_PER_USER);
  });
};

const normalizeSeason = (raw, now) => {
  const totalDays = Math.max(1, Math.round(Number(raw?.totalDays) || SEASON_DAYS));
  let startAt = normalizeTimestamp(raw?.startAt);
  if (!Number.isFinite(startAt)) {
    const d = new Date(now);
    d.setUTCHours(0, 0, 0, 0);
    startAt = d.getTime();
  }
  const endAt = startAt + totalDays * DAY_MS;
  return {
    startAt,
    endAt,
    totalDays,
    active: now < endAt
  };
};

const ensureState = (raw, now) => {
  const state = raw && typeof raw === 'object' ? raw : {};
  const season = normalizeSeason(state.season, now);

  let event = state.event && typeof state.event === 'object' ? state.event : null;
  if (!event) {
    event = makeEvent(now, DEFAULT_GAME_ID, `${DEFAULT_GAME_ID} Cup`, ROUND_DURATION_MS, season.endAt);
  }
  event.gameId = normalizeGameId(event.gameId) || DEFAULT_GAME_ID;
  event.startAt = normalizeTimestamp(event.startAt) || now;
  const rawDurationMs = Number(event.durationMs);
  const hasStoredDuration = Number.isFinite(rawDurationMs) && rawDurationMs > 0;
  const fallbackDuration = normalizeDurationMs(hasStoredDuration ? rawDurationMs : ROUND_DURATION_MS, ROUND_DURATION_MS);
  event.endAt = normalizeTimestamp(event.endAt) || event.startAt + fallbackDuration;
  if (!hasStoredDuration) {
    event.endAt = event.startAt + ROUND_DURATION_MS;
  }
  if (event.endAt <= event.startAt) event.endAt = event.startAt + fallbackDuration;
  event.endAt = Math.min(event.endAt, season.endAt);
  event.durationMs = hasStoredDuration
    ? normalizeDurationMs(rawDurationMs, ROUND_DURATION_MS)
    : ROUND_DURATION_MS;
  event.title = String(event.title || `${event.gameId} Cup`)
    .trim()
    .slice(0, 90);

  const entries = {};
  const rawEntries = event.entries && typeof event.entries === 'object' ? event.entries : {};
  Object.keys(rawEntries)
    .slice(0, MAX_ENTRIES * 2)
    .forEach((key) => {
      const id = normalizeId(key, 80);
      if (!id) return;
      const row = normalizeEntry(rawEntries[key]);
      if (!row) return;
      entries[id] = row;
    });
  event.entries = entries;

  const next = {
    season,
    event,
    lastFinalizedEventId: normalizeId(state.lastFinalizedEventId, 120),
    lastWinners: Array.isArray(state.lastWinners) ? state.lastWinners : [],
    badgesByUser: normalizeBadgesByUser(state.badgesByUser),
    updatedAt: new Date(now).toISOString()
  };

  let safety = 0;
  while (now >= next.event.endAt && safety < 240) {
    if (next.lastFinalizedEventId !== next.event.id) {
      awardRoundBadges(next, next.event.endAt);
      next.lastFinalizedEventId = next.event.id;
    }
    if (next.event.endAt >= next.season.endAt) {
      break;
    }
    const nextStart = next.event.endAt;
    const nextGameId = next.event.gameId || DEFAULT_GAME_ID;
    const nextDuration = normalizeDurationMs(next.event.durationMs, ROUND_DURATION_MS);
    next.event = makeEvent(nextStart, nextGameId, `${nextGameId} Cup`, nextDuration, next.season.endAt);
    safety += 1;
  }

  if (next.event.endAt > next.season.endAt) {
    next.event.endAt = next.season.endAt;
    next.event.durationMs = normalizeDurationMs(next.event.endAt - next.event.startAt, ROUND_DURATION_MS);
  }

  return next;
};

const buildPayload = (state, userId) => {
  const event = state.event;
  const sorted = getSortedEntries(event);
  const top = sorted.slice(0, 10);
  const season = state.season && typeof state.season === 'object' ? state.season : normalizeSeason(null, Date.now());
  const now = Date.now();
  const myRank = userId
    ? top.findIndex((row) => String(row.userId || '') === userId) + 1 || sorted.findIndex((row) => String(row.userId || '') === userId) + 1
    : 0;
  return {
    season: {
      startAt: season.startAt,
      endAt: season.endAt,
      totalDays: season.totalDays,
      active: now < season.endAt
    },
    event: {
      id: event.id,
      title: event.title,
      gameId: event.gameId,
      startAt: event.startAt,
      endAt: event.endAt,
      durationMs: event.durationMs
    },
    top,
    myRank: myRank || 0,
    badges: userId ? state.badgesByUser[userId] || [] : [],
    lastWinners: Array.isArray(state.lastWinners) ? state.lastWinners.slice(0, 6) : [],
    updatedAt: state.updatedAt
  };
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return emptyResponse(204);
  }

  const store = getStore(event);
  if (!store) {
    return jsonResponse(503, {
      error: 'Tournament storage unavailable',
      code: 'STORAGE_UNAVAILABLE'
    });
  }

  const now = Date.now();
  let state;
  try {
    state = ensureState(await readJSON(store, TOURNAMENT_KEY), now);
  } catch (err) {
    return jsonResponse(500, { error: 'Failed to read tournament state' });
  }

  if (event.httpMethod === 'GET') {
    const userId = normalizeId(event.queryStringParameters?.userId, 80);
    const payload = buildPayload(state, userId);
    try {
      await writeJSON(store, TOURNAMENT_KEY, state);
    } catch (err) {
      // still return data
    }
    return jsonResponse(200, payload);
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (err) {
    return jsonResponse(400, { error: 'Invalid JSON body' });
  }

  const action = String(payload?.action || '')
    .trim()
    .toLowerCase();

  if (action === 'status') {
    const adminCode = String(payload?.adminCode || '').trim();
    if (adminCode !== ADMIN_CODE) {
      return jsonResponse(403, { error: 'Invalid admin code' });
    }
    try {
      await writeJSON(store, TOURNAMENT_KEY, state);
    } catch (err) {
      // ignore write failure for status
    }
    return jsonResponse(200, buildPayload(state, ''));
  }

  if (action === 'create_event') {
    const adminCode = String(payload?.adminCode || '').trim();
    if (adminCode !== ADMIN_CODE) {
      return jsonResponse(403, { error: 'Invalid admin code' });
    }
    const gameId = normalizeGameId(payload?.gameId) || DEFAULT_GAME_ID;
    const title = String(payload?.title || '')
      .trim()
      .slice(0, 90);
    const startAt = normalizeTimestamp(payload?.startAt) || now;
    if (startAt >= state.season.endAt) {
      return jsonResponse(409, { error: 'Tournament season already ended.', ...buildPayload(state, '') });
    }
    const requestedHours = Number(payload?.durationHours);
    const durationMs = normalizeDurationMs(
      Number.isFinite(requestedHours) ? requestedHours * 60 * 60 * 1000 : payload?.durationMs,
      ROUND_DURATION_MS
    );
    state.event = makeEvent(startAt, gameId, title || `${gameId} Cup`, durationMs, state.season.endAt);
    state.lastFinalizedEventId = '';
    state.updatedAt = new Date(now).toISOString();
    try {
      await writeJSON(store, TOURNAMENT_KEY, state);
    } catch (err) {
      return jsonResponse(500, { error: 'Failed to save tournament event' });
    }
    return jsonResponse(200, buildPayload(state, normalizeId(payload?.userId, 80)));
  }

  if (action !== 'submit_score') {
    return jsonResponse(400, { error: 'Unknown action' });
  }

  const userId = normalizeId(payload?.userId, 80);
  const username = normalizeUsername(payload?.username);
  const score = normalizeScore(payload?.score);
  const gameId = normalizeGameId(payload?.gameId);
  if (!userId || !username || !Number.isFinite(score)) {
    return jsonResponse(400, { error: 'Missing userId, username, or score' });
  }
  if (now >= Number(state.season?.endAt || 0)) {
    return jsonResponse(409, {
      error: 'Tournament season has ended.',
      ...buildPayload(state, userId)
    });
  }
  if (gameId && gameId !== state.event.gameId) {
    return jsonResponse(409, {
      error: `Current tournament is for ${state.event.gameId}.`,
      ...buildPayload(state, userId)
    });
  }

  const current = normalizeEntry(state.event.entries[userId]) || {
    userId,
    username,
    score: 0,
    updatedAt: now,
    avatarUrl: '',
    avatarPreset: ''
  };
  if (score >= current.score) {
    state.event.entries[userId] = {
      userId,
      username,
      score,
      updatedAt: now,
      avatarUrl: normalizeAvatarUrl(payload?.avatarUrl),
      avatarPreset: normalizeAvatarPreset(payload?.avatarPreset)
    };
  }

  state.updatedAt = new Date(now).toISOString();
  try {
    await writeJSON(store, TOURNAMENT_KEY, state);
  } catch (err) {
    return jsonResponse(500, { error: 'Failed to save tournament score' });
  }

  return jsonResponse(200, buildPayload(state, userId));
};
