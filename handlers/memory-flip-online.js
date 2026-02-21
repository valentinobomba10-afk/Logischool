const STORE_NAME = 'logischool';
const STATE_KEY = 'memory-flip-online-v1';
const QUEUE_TTL_MS = 10 * 60 * 1000;
const MATCH_TTL_MS = 20 * 60 * 1000;
const MATCH_END_KEEP_MS = 2 * 60 * 1000;
const PLAYER_STALE_MS = 90 * 1000;
const MISMATCH_HIDE_MS = 900;
const PAIR_COUNT = 8;
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

const buildDeck = () => {
  const cards = [];
  for (let i = 0; i < PAIR_COUNT; i += 1) {
    cards.push(i, i);
  }
  for (let i = cards.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = cards[i];
    cards[i] = cards[j];
    cards[j] = t;
  }
  return cards;
};

const normalizeDeck = (raw) => {
  if (!Array.isArray(raw) || raw.length !== PAIR_COUNT * 2) return buildDeck();
  return raw.map((v) => toInt(v, 0)).map((v) => Math.max(0, Math.min(PAIR_COUNT - 1, v)));
};

const uniqueSortedInts = (arr, maxLen) =>
  Array.from(
    new Set(
      (Array.isArray(arr) ? arr : [])
        .map((v) => toInt(v, -1))
        .filter((v) => v >= 0 && (maxLen === undefined || v < maxLen))
    )
  ).sort((a, b) => a - b);

const normalizePlayerState = (raw, deckLen) => {
  const ps = raw && typeof raw === 'object' ? raw : {};
  return {
    matched: uniqueSortedInts(ps.matched, deckLen),
    open: uniqueSortedInts(ps.open, deckLen).slice(0, 2),
    lockUntil: toInt(ps.lockUntil, 0),
    moves: Math.max(0, toInt(ps.moves, 0)),
    finishedAt: Math.max(0, toInt(ps.finishedAt, 0))
  };
};

const clearExpiredOpen = (state, deck, now) => {
  if (!state) return;
  if (!Array.isArray(state.open) || state.open.length !== 2) return;
  if (now < toInt(state.lockUntil, 0)) return;
  const [a, b] = state.open;
  if (deck[a] !== deck[b]) {
    state.open = [];
    state.lockUntil = 0;
  }
};

const normalizeState = (raw) => {
  const base = raw && typeof raw === 'object' ? raw : {};
  return {
    queue: Array.isArray(base.queue) ? base.queue : [],
    matches: Array.isArray(base.matches) ? base.matches : [],
    updatedAt: String(base.updatedAt || '')
  };
};

const createMatch = (playerA, playerB, now) => ({
  id: `mfo_${now}_${Math.random().toString(36).slice(2, 9)}`,
  players: [playerA, playerB],
  deck: buildDeck(),
  playerState: {
    [playerA.id]: { matched: [], open: [], lockUntil: 0, moves: 0, finishedAt: 0 },
    [playerB.id]: { matched: [], open: [], lockUntil: 0, moves: 0, finishedAt: 0 }
  },
  status: 'live',
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
});

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
    const p1 = players[0];
    const p2 = players[1];
    const deck = normalizeDeck(raw.deck);
    const playerStateRaw = raw.playerState && typeof raw.playerState === 'object' ? raw.playerState : {};
    const match = {
      ...raw,
      players,
      deck,
      status: String(raw.status || 'live'),
      winnerId: sanitizeId(raw.winnerId),
      reason: String(raw.reason || ''),
      expiresAt: toInt(raw.expiresAt, now + MATCH_TTL_MS),
      endedAt: Math.max(0, toInt(raw.endedAt, 0)),
      playerState: {
        [p1.id]: normalizePlayerState(playerStateRaw[p1.id], deck.length),
        [p2.id]: normalizePlayerState(playerStateRaw[p2.id], deck.length)
      }
    };

    if (!match.lastSeen || typeof match.lastSeen !== 'object') {
      match.lastSeen = {};
    }
    match.lastSeen[p1.id] = toInt(match.lastSeen[p1.id], now);
    match.lastSeen[p2.id] = toInt(match.lastSeen[p2.id], now);

    if (match.expiresAt < now) continue;

    clearExpiredOpen(match.playerState[p1.id], deck, now);
    clearExpiredOpen(match.playerState[p2.id], deck, now);

    if (match.status !== 'finished') {
      const stalePlayers = [p1, p2].filter((p) => now - toInt(match.lastSeen[p.id], 0) > PLAYER_STALE_MS);
      if (stalePlayers.length === 1) {
        const staleId = stalePlayers[0].id;
        const winner = staleId === p1.id ? p2 : p1;
        match.status = 'finished';
        match.winnerId = winner.id;
        match.reason = 'Opponent disconnected.';
        match.endedAt = now;
      }
    }

    if (
      match.status === 'finished' &&
      match.endedAt > 0 &&
      now - match.endedAt > MATCH_END_KEEP_MS
    ) {
      continue;
    }

    match.updatedAt = now;
    nextMatches.push(match);
  }
  state.matches = nextMatches;
  state.updatedAt = new Date(now).toISOString();
};

const publicMatchForPlayer = (match, playerId, now) => {
  const players = Array.isArray(match.players) ? match.players : [];
  const opponent = players.find((p) => p.id !== playerId);
  const meState = normalizePlayerState(match.playerState?.[playerId], match.deck.length);
  const oppState = normalizePlayerState(match.playerState?.[opponent?.id], match.deck.length);
  clearExpiredOpen(meState, match.deck, now);

  const visible = new Array(match.deck.length).fill(null);
  const showAll = match.status === 'finished';
  if (showAll) {
    for (let i = 0; i < match.deck.length; i += 1) visible[i] = match.deck[i];
  } else {
    const revealIndexes = [...meState.matched, ...meState.open];
    revealIndexes.forEach((index) => {
      if (index >= 0 && index < match.deck.length) {
        visible[index] = match.deck[index];
      }
    });
  }

  return {
    id: match.id,
    status: match.status,
    winnerId: match.winnerId || '',
    reason: match.reason || '',
    players: players.map((p) => ({
      id: p.id,
      username: p.username,
      avatarUrl: p.avatarUrl || '',
      avatarPreset: p.avatarPreset || ''
    })),
    targetPairs: PAIR_COUNT,
    cards: visible,
    my: {
      matchedPairs: Math.floor(meState.matched.length / 2),
      matched: meState.matched,
      open: meState.open,
      moves: meState.moves,
      locked: now < toInt(meState.lockUntil, 0)
    },
    opponent: {
      matchedPairs: Math.floor(oppState.matched.length / 2),
      moves: oppState.moves
    },
    updatedAt: toInt(match.updatedAt, now)
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
        match = createMatch(queueOpponent.player, player, now);
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
      match.updatedAt = now;
      await writeJSON(store, STATE_KEY, state);
      return jsonResponse(200, {
        status: 'matched',
        match: publicMatchForPlayer(match, player.id, now),
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
      clearExpiredOpen(match.playerState?.[playerId], match.deck, now);
      match.updatedAt = now;
      await writeJSON(store, STATE_KEY, state);
      return jsonResponse(200, {
        status: 'matched',
        match: publicMatchForPlayer(match, playerId, now),
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

  if (action === 'flip') {
    if (!playerId || !matchId) {
      return jsonResponse(400, { error: 'Missing matchId or playerId.' });
    }
    const index = toInt(payload.index, -1);
    const match = state.matches.find((m) => m.id === matchId);
    if (!match || !match.players.some((p) => p.id === playerId)) {
      await writeJSON(store, STATE_KEY, state);
      return jsonResponse(404, { error: 'Match not found.' });
    }
    if (index < 0 || index >= match.deck.length) {
      return jsonResponse(400, { error: 'Invalid card index.' });
    }

    match.lastSeen[playerId] = now;
    match.expiresAt = now + MATCH_TTL_MS;
    const ps = normalizePlayerState(match.playerState?.[playerId], match.deck.length);
    match.playerState[playerId] = ps;
    clearExpiredOpen(ps, match.deck, now);

    if (match.status !== 'finished' && !ps.finishedAt && now >= toInt(ps.lockUntil, 0)) {
      if (!ps.matched.includes(index) && !ps.open.includes(index) && ps.open.length < 2) {
        ps.open.push(index);
      }
      if (ps.open.length === 2) {
        const [a, b] = ps.open;
        ps.moves += 1;
        if (match.deck[a] === match.deck[b]) {
          ps.matched = uniqueSortedInts([...ps.matched, a, b], match.deck.length);
          ps.open = [];
          ps.lockUntil = 0;
          if (ps.matched.length >= match.deck.length) {
            ps.finishedAt = now;
            match.status = 'finished';
            match.winnerId = playerId;
            match.reason = 'First to find all cards.';
            match.endedAt = now;
          }
        } else {
          ps.lockUntil = now + MISMATCH_HIDE_MS;
        }
      }
    }

    match.updatedAt = now;
    await writeJSON(store, STATE_KEY, state);
    return jsonResponse(200, {
      status: 'matched',
      match: publicMatchForPlayer(match, playerId, now),
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
      if (!match.players.some((p) => p.id === playerId)) continue;
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
