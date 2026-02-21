const STORE_NAME = 'logischool';
const STATE_KEY = 'click-rush-online-v1';
const QUEUE_TTL_MS = 10 * 60 * 1000;
const COUNTDOWN_MS = 3200;
const GAME_DURATION_MS = 10000;
const MATCH_TTL_MS = 20 * 60 * 1000;
const MATCH_END_KEEP_MS = 90 * 1000;
const PLAYER_STALE_MS = 90 * 1000;
const MAX_DELTA = 20;
const LOBBY_LIMIT = 60;

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

const toInt = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : fallback;
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const sanitizeId = (value) =>
  String(value || '')
    .trim()
    .slice(0, 80);

const sanitizeUsername = (value) =>
  String(value || '')
    .trim()
    .slice(0, 18);

const sanitizeAvatarUrl = (value) => {
  const url = String(value || '').trim();
  return /^https?:\/\//.test(url) ? url.slice(0, 500) : '';
};

const sanitizeAvatarPreset = (value) =>
  String(value || '')
    .trim()
    .slice(0, 40);

const sanitizePlayer = (raw) => {
  if (!raw || typeof raw !== 'object') return null;
  const id = sanitizeId(raw.id);
  const username = sanitizeUsername(raw.username);
  if (!id || !username) return null;
  return {
    id,
    username,
    avatarUrl: sanitizeAvatarUrl(raw.avatarUrl),
    avatarPreset: sanitizeAvatarPreset(raw.avatarPreset)
  };
};

const getStore = (event) => {
  if (!blobsModule || typeof blobsModule.getStore !== 'function') return null;
  try {
    if (typeof blobsModule.connectLambda === 'function') {
      blobsModule.connectLambda(event);
    }
  } catch (err) {
    // continue
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
    const msg = String(err?.message || '').toLowerCase();
    if (msg.includes('not found')) return null;
    return null;
  }
};

const writeJSON = async (store, key, value) => {
  if (typeof store.setJSON === 'function') {
    await store.setJSON(key, value);
    return;
  }
  await store.set(key, JSON.stringify(value));
};

const normalizeState = (raw) => {
  const base = raw && typeof raw === 'object' ? raw : {};
  return {
    queue: Array.isArray(base.queue) ? base.queue : [],
    matches: Array.isArray(base.matches) ? base.matches : [],
    updatedAt: String(base.updatedAt || '')
  };
};

const ensureCounts = (match) => {
  if (!match || !Array.isArray(match.players) || match.players.length !== 2) return;
  if (!match.counts || typeof match.counts !== 'object') {
    match.counts = {};
  }
  const [p1, p2] = match.players;
  match.counts[p1.id] = toInt(match.counts[p1.id], 0);
  match.counts[p2.id] = toInt(match.counts[p2.id], 0);
};

const finalizeWinner = (match) => {
  if (!match || !Array.isArray(match.players) || match.players.length !== 2) return;
  ensureCounts(match);
  const [p1, p2] = match.players;
  const c1 = toInt(match.counts[p1.id], 0);
  const c2 = toInt(match.counts[p2.id], 0);
  if (c1 > c2) {
    match.winnerId = p1.id;
  } else if (c2 > c1) {
    match.winnerId = p2.id;
  } else {
    match.winnerId = '';
  }
};

const updateMatchLifecycle = (match, now) => {
  if (!match) return;
  const startAt = toInt(match.startAt, now + COUNTDOWN_MS);
  const endAt = toInt(match.endAt, startAt + GAME_DURATION_MS);
  match.startAt = startAt;
  match.endAt = endAt;

  if (match.status === 'finished') {
    if (!match.endedAt) {
      match.endedAt = now;
    }
    ensureCounts(match);
    return;
  }

  if (now < startAt) {
    match.status = 'countdown';
    ensureCounts(match);
    return;
  }

  if (now < endAt) {
    match.status = 'live';
    ensureCounts(match);
    return;
  }

  match.status = 'finished';
  match.endedAt = endAt;
  finalizeWinner(match);
};

const makeMatch = (playerA, playerB, now) => {
  const id = `cr_${now}_${Math.random().toString(36).slice(2, 9)}`;
  const startAt = now + COUNTDOWN_MS;
  const endAt = startAt + GAME_DURATION_MS;
  return {
    id,
    players: [playerA, playerB],
    counts: {
      [playerA.id]: 0,
      [playerB.id]: 0
    },
    status: 'countdown',
    startAt,
    endAt,
    winnerId: '',
    reason: '',
    lastSeen: {
      [playerA.id]: now,
      [playerB.id]: now
    },
    createdAt: now,
    updatedAt: now,
    expiresAt: now + MATCH_TTL_MS,
    endedAt: 0
  };
};

const cleanupState = (state, now) => {
  const queueMap = new Map();
  for (const item of state.queue) {
    const player = sanitizePlayer(item && item.player);
    if (!player) continue;
    const expiresAt = toInt(item.expiresAt, 0);
    if (expiresAt && expiresAt < now) continue;
    queueMap.set(player.id, {
      player,
      queuedAt: toInt(item.queuedAt, now),
      expiresAt: now + QUEUE_TTL_MS
    });
  }
  state.queue = Array.from(queueMap.values());

  const nextMatches = [];
  for (const raw of state.matches) {
    if (!raw || typeof raw !== 'object') continue;
    const players = Array.isArray(raw.players) ? raw.players.map(sanitizePlayer).filter(Boolean) : [];
    if (players.length !== 2) continue;

    const match = {
      ...raw,
      players
    };
    if (!match.lastSeen || typeof match.lastSeen !== 'object') {
      match.lastSeen = {};
    }
    for (const p of players) {
      match.lastSeen[p.id] = toInt(match.lastSeen[p.id], now);
    }
    match.expiresAt = toInt(match.expiresAt, now + MATCH_TTL_MS);
    if (match.expiresAt < now) continue;

    if (match.status !== 'finished') {
      const stale = players.filter((p) => now - toInt(match.lastSeen[p.id], 0) > PLAYER_STALE_MS);
      if (stale.length === 1) {
        const staleId = stale[0].id;
        const winner = players.find((p) => p.id !== staleId);
        match.status = 'finished';
        match.winnerId = winner ? winner.id : '';
        match.reason = 'Opponent disconnected.';
        match.endedAt = now;
      }
    }

    updateMatchLifecycle(match, now);

    if (
      match.status === 'finished' &&
      toInt(match.endedAt, 0) > 0 &&
      now - toInt(match.endedAt, 0) > MATCH_END_KEEP_MS
    ) {
      continue;
    }
    match.updatedAt = now;
    nextMatches.push(match);
  }
  state.matches = nextMatches;
  state.updatedAt = new Date(now).toISOString();
};

const publicMatch = (match, playerId) => {
  if (!match) return null;
  ensureCounts(match);
  return {
    id: match.id,
    status: String(match.status || 'countdown'),
    players: (Array.isArray(match.players) ? match.players : []).map((p) => ({
      id: p.id,
      username: p.username,
      avatarUrl: p.avatarUrl || '',
      avatarPreset: p.avatarPreset || ''
    })),
    counts: { ...(match.counts || {}) },
    winnerId: String(match.winnerId || ''),
    reason: String(match.reason || ''),
    startAt: toInt(match.startAt, 0),
    endAt: toInt(match.endAt, 0),
    endedAt: toInt(match.endedAt, 0),
    updatedAt: toInt(match.updatedAt, 0),
    you: String(playerId || '')
  };
};

const buildLobbyPayload = (state, viewerId = '') => {
  const scoreState = {
    queue: 3,
    in_match: 2,
    recent: 1
  };
  const byId = new Map();
  const upsert = (rawPlayer, stateLabel) => {
    const player = sanitizePlayer(rawPlayer);
    if (!player) return;
    const rank = scoreState[stateLabel] || 0;
    const existing = byId.get(player.id);
    if (existing && (existing.__rank || 0) >= rank) return;
    byId.set(player.id, {
      id: player.id,
      username: player.username,
      avatarUrl: player.avatarUrl || '',
      avatarPreset: player.avatarPreset || '',
      state: stateLabel,
      __rank: rank
    });
  };

  (Array.isArray(state.queue) ? state.queue : []).forEach((item) => {
    upsert(item?.player, 'queue');
  });
  (Array.isArray(state.matches) ? state.matches : []).forEach((match) => {
    const status = String(match?.status || '').toLowerCase();
    const stateLabel = status === 'finished' ? 'recent' : 'in_match';
    (Array.isArray(match?.players) ? match.players : []).forEach((player) => upsert(player, stateLabel));
  });

  const onlineRows = Array.from(byId.values())
    .sort((a, b) => {
      const rankDiff = (b.__rank || 0) - (a.__rank || 0);
      if (rankDiff !== 0) return rankDiff;
      return String(a.username || '').localeCompare(String(b.username || ''));
    })
    .slice(0, LOBBY_LIMIT)
    .map((row) => ({
      id: row.id,
      username: row.username,
      avatarUrl: row.avatarUrl,
      avatarPreset: row.avatarPreset,
      state: row.state
    }));

  const queueRows = onlineRows.filter((row) => row.state === 'queue');
  const availableRows = queueRows.filter((row) => row.id !== viewerId);
  return {
    onlinePlayers: onlineRows,
    availablePlayers: availableRows,
    onlineCount: onlineRows.length,
    queuePlayers: queueRows.length
  };
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return emptyResponse(204);
  }

  const store = getStore(event);
  if (!store) {
    return jsonResponse(503, {
      error: 'Online mode unavailable right now.'
    });
  }

  if (event.httpMethod === 'GET') {
    const resource = String(event.queryStringParameters?.resource || '')
      .trim()
      .toLowerCase();
    if (resource === 'health' || resource === 'debug') {
      return jsonResponse(200, { ok: true });
    }
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  let payload = {};
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (err) {
    return jsonResponse(400, { error: 'Invalid JSON' });
  }
  const action = String(payload.action || '')
    .trim()
    .toLowerCase();
  const now = Date.now();

  const state = normalizeState((await readJSON(store, STATE_KEY)) || {});
  cleanupState(state, now);

  const player = sanitizePlayer(payload.player);
  const playerId = sanitizeId(payload.playerId || (player && player.id) || '');
  const matchId = sanitizeId(payload.matchId);

  const findMatch = () => {
    if (matchId) {
      const exact = state.matches.find((m) => m.id === matchId);
      if (exact) return exact;
    }
    if (playerId) {
      return state.matches.find((m) => m.players.some((p) => p.id === playerId));
    }
    return null;
  };

  if (action === 'join') {
    if (!player) return jsonResponse(400, { error: 'Missing player identity.' });
    state.queue = state.queue.filter((q) => q.player.id !== player.id);

    let match = state.matches.find((m) => m.players.some((p) => p.id === player.id));
    if (!match) {
      const queueOpponent = state.queue.find((q) => q.player.id !== player.id);
      if (queueOpponent) {
        state.queue = state.queue.filter((q) => q.player.id !== queueOpponent.player.id);
        match = makeMatch(queueOpponent.player, player, now);
        state.matches.push(match);
      } else {
        state.queue.push({
          player,
          queuedAt: now,
          expiresAt: now + QUEUE_TTL_MS
        });
      }
    }

    if (match) {
      match.lastSeen[player.id] = now;
      match.expiresAt = now + MATCH_TTL_MS;
      updateMatchLifecycle(match, now);
      await writeJSON(store, STATE_KEY, state);
      return jsonResponse(200, {
        status: 'matched',
        match: publicMatch(match, player.id),
        ...buildLobbyPayload(state, player.id),
        serverTime: now
      });
    }

    await writeJSON(store, STATE_KEY, state);
    return jsonResponse(200, {
      status: 'waiting',
      queueSize: state.queue.length,
      message: 'Waiting for another player...',
      ...buildLobbyPayload(state, player.id),
      serverTime: now
    });
  }

  if (action === 'state') {
    if (!playerId) return jsonResponse(400, { error: 'Missing playerId.' });
    const match = findMatch();
    if (match) {
      match.lastSeen[playerId] = now;
      match.expiresAt = now + MATCH_TTL_MS;
      updateMatchLifecycle(match, now);
      match.updatedAt = now;
      await writeJSON(store, STATE_KEY, state);
      return jsonResponse(200, {
        status: 'matched',
        match: publicMatch(match, playerId),
        ...buildLobbyPayload(state, playerId),
        serverTime: now
      });
    }
    const inQueue = state.queue.some((q) => q.player.id === playerId);
    await writeJSON(store, STATE_KEY, state);
    return jsonResponse(200, {
      status: inQueue ? 'waiting' : 'idle',
      queueSize: state.queue.length,
      message: inQueue ? 'Waiting for another player...' : 'Not in queue.',
      ...buildLobbyPayload(state, playerId),
      serverTime: now
    });
  }

  if (action === 'click') {
    if (!playerId || !matchId) {
      return jsonResponse(400, { error: 'Missing matchId or playerId.' });
    }
    const delta = clamp(toInt(payload.delta, 0), 0, MAX_DELTA);
    if (delta <= 0) {
      return jsonResponse(400, { error: 'Invalid click delta.' });
    }

    const match = state.matches.find((m) => m.id === matchId);
    if (!match || !match.players.some((p) => p.id === playerId)) {
      await writeJSON(store, STATE_KEY, state);
      return jsonResponse(404, { error: 'Match not found.' });
    }

    match.lastSeen[playerId] = now;
    match.expiresAt = now + MATCH_TTL_MS;
    updateMatchLifecycle(match, now);
    if (match.status === 'live') {
      ensureCounts(match);
      match.counts[playerId] = toInt(match.counts[playerId], 0) + delta;
    }
    updateMatchLifecycle(match, now);
    match.updatedAt = now;

    await writeJSON(store, STATE_KEY, state);
    return jsonResponse(200, {
      status: 'matched',
      match: publicMatch(match, playerId),
      ...buildLobbyPayload(state, playerId),
      serverTime: now
    });
  }

  if (action === 'leave') {
    if (!playerId) {
      return jsonResponse(400, { error: 'Missing playerId.' });
    }
    state.queue = state.queue.filter((q) => q.player.id !== playerId);

    for (const match of state.matches) {
      if (!match.players || !match.players.some((p) => p.id === playerId)) continue;
      updateMatchLifecycle(match, now);
      if (match.status === 'finished') continue;
      const opponent = match.players.find((p) => p.id !== playerId);
      match.status = 'finished';
      match.winnerId = opponent ? opponent.id : '';
      match.reason = 'Opponent left the match.';
      match.endedAt = now;
      match.updatedAt = now;
    }

    await writeJSON(store, STATE_KEY, state);
    return jsonResponse(200, {
      status: 'left',
      ...buildLobbyPayload(state, playerId),
      serverTime: now
    });
  }

  return jsonResponse(400, { error: 'Unknown action.' });
};
