const STORE_NAME = 'logischool';
const STATE_KEY = 'rps-online-v1';
const TARGET_SCORE = 5;
const QUEUE_TTL_MS = 10 * 60 * 1000;
const MATCH_TTL_MS = 20 * 60 * 1000;
const MATCH_END_KEEP_MS = 90 * 1000;
const ROUND_REVEAL_MS = 2200;
const PLAYER_STALE_MS = 90 * 1000;
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

const safeInt = (value, fallback = 0) => {
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

const nowISO = () => new Date().toISOString();

const normalizeState = (raw) => {
  const base = raw && typeof raw === 'object' ? raw : {};
  return {
    queue: Array.isArray(base.queue) ? base.queue : [],
    matches: Array.isArray(base.matches) ? base.matches : [],
    updatedAt: String(base.updatedAt || '')
  };
};

const beats = (a, b) =>
  (a === 'rock' && b === 'scissors') ||
  (a === 'paper' && b === 'rock') ||
  (a === 'scissors' && b === 'paper');

const buildRoundMessage = (moveA, moveB, winnerId, idA, idB) => {
  if (!winnerId) return 'Tie round.';
  if (winnerId === idA) return `${moveA} beats ${moveB}.`;
  if (winnerId === idB) return `${moveB} beats ${moveA}.`;
  return 'Round complete.';
};

const startRound = (match) => {
  const prevRound = match.round && typeof match.round === 'object' ? match.round : {};
  match.round = {
    number: safeInt(prevRound.number, 0) + 1,
    status: 'choosing',
    moves: {},
    winnerId: '',
    revealAt: 0,
    message: 'Choose rock, paper, or scissors.'
  };
  match.nextRoundAt = 0;
};

const resolveRoundIfReady = (match, now) => {
  if (!match || match.winnerId) return;
  const players = Array.isArray(match.players) ? match.players : [];
  if (players.length !== 2) return;
  const idA = players[0].id;
  const idB = players[1].id;
  if (!idA || !idB) return;

  if (!match.round || typeof match.round !== 'object') {
    startRound(match);
  }
  if (match.round.status !== 'choosing') return;

  const moves = match.round.moves && typeof match.round.moves === 'object' ? match.round.moves : {};
  const moveA = String(moves[idA] || '');
  const moveB = String(moves[idB] || '');
  if (!moveA || !moveB) return;

  if (!match.scores || typeof match.scores !== 'object') {
    match.scores = {};
  }
  match.scores[idA] = safeInt(match.scores[idA], 0);
  match.scores[idB] = safeInt(match.scores[idB], 0);

  let winnerId = '';
  if (moveA !== moveB) {
    winnerId = beats(moveA, moveB) ? idA : idB;
    match.scores[winnerId] += 1;
  }

  match.round.status = 'revealed';
  match.round.winnerId = winnerId;
  match.round.revealAt = now;
  match.round.message = buildRoundMessage(moveA, moveB, winnerId, idA, idB);

  if (match.scores[idA] >= TARGET_SCORE) {
    match.winnerId = idA;
    match.endedAt = now;
    match.nextRoundAt = 0;
    return;
  }
  if (match.scores[idB] >= TARGET_SCORE) {
    match.winnerId = idB;
    match.endedAt = now;
    match.nextRoundAt = 0;
    return;
  }
  match.nextRoundAt = now + ROUND_REVEAL_MS;
};

const createMatch = (playerA, playerB, now) => {
  const id = `m_${now}_${Math.random().toString(36).slice(2, 9)}`;
  const match = {
    id,
    players: [playerA, playerB],
    scores: {
      [playerA.id]: 0,
      [playerB.id]: 0
    },
    winnerId: '',
    round: {
      number: 1,
      status: 'choosing',
      moves: {},
      winnerId: '',
      revealAt: 0,
      message: 'Choose rock, paper, or scissors.'
    },
    nextRoundAt: 0,
    lastSeen: {
      [playerA.id]: now,
      [playerB.id]: now
    },
    createdAt: now,
    updatedAt: now,
    expiresAt: now + MATCH_TTL_MS,
    endedAt: 0
  };
  return match;
};

const cleanupState = (state, now) => {
  const queueById = new Map();
  for (const item of state.queue) {
    const player = sanitizePlayer(item && item.player);
    if (!player) continue;
    const expiresAt = safeInt(item.expiresAt, 0);
    if (expiresAt && expiresAt < now) continue;
    queueById.set(player.id, {
      player,
      queuedAt: safeInt(item.queuedAt, now),
      expiresAt: now + QUEUE_TTL_MS
    });
  }
  state.queue = Array.from(queueById.values());

  const nextMatches = [];
  for (const matchRaw of state.matches) {
    if (!matchRaw || typeof matchRaw !== 'object') continue;
    const players = Array.isArray(matchRaw.players) ? matchRaw.players.map(sanitizePlayer).filter(Boolean) : [];
    if (players.length !== 2) continue;

    const match = {
      ...matchRaw,
      players
    };

    match.expiresAt = safeInt(match.expiresAt, now + MATCH_TTL_MS);
    if (match.expiresAt < now) continue;

    if (!match.lastSeen || typeof match.lastSeen !== 'object') {
      match.lastSeen = {};
    }
    for (const p of players) {
      match.lastSeen[p.id] = safeInt(match.lastSeen[p.id], now);
    }

    if (!match.winnerId) {
      const stalePlayers = players.filter((p) => now - safeInt(match.lastSeen[p.id], 0) > PLAYER_STALE_MS);
      if (stalePlayers.length === 1) {
        const staleId = stalePlayers[0].id;
        const winner = players.find((p) => p.id !== staleId);
        if (winner) {
          match.winnerId = winner.id;
          match.endedAt = now;
          if (!match.round || typeof match.round !== 'object') {
            match.round = {};
          }
          match.round.status = 'revealed';
          match.round.message = 'Opponent disconnected.';
          match.round.winnerId = winner.id;
        }
      }
    }

    if (!match.winnerId && match.nextRoundAt && now >= safeInt(match.nextRoundAt, 0)) {
      startRound(match);
    }
    resolveRoundIfReady(match, now);

    if (match.winnerId && safeInt(match.endedAt, 0) && now - safeInt(match.endedAt, 0) > MATCH_END_KEEP_MS) {
      continue;
    }

    match.updatedAt = now;
    nextMatches.push(match);
  }
  state.matches = nextMatches;
  state.updatedAt = nowISO();
};

const publicMatchForPlayer = (match, playerId) => {
  const players = Array.isArray(match.players) ? match.players : [];
  const opponent = players.find((p) => p.id !== playerId);
  const round = match.round && typeof match.round === 'object' ? match.round : {};
  const roundMoves = round.moves && typeof round.moves === 'object' ? round.moves : {};
  const myMove = String(roundMoves[playerId] || '');
  const opponentId = opponent ? opponent.id : '';
  const opponentMove =
    round.status === 'revealed' || match.winnerId ? String(roundMoves[opponentId] || '') : '';

  return {
    id: match.id,
    players: players.map((p) => ({
      id: p.id,
      username: p.username,
      avatarUrl: p.avatarUrl || '',
      avatarPreset: p.avatarPreset || ''
    })),
    scores: { ...(match.scores || {}) },
    targetScore: TARGET_SCORE,
    winnerId: String(match.winnerId || ''),
    endedAt: safeInt(match.endedAt, 0),
    updatedAt: safeInt(match.updatedAt, 0),
    round: {
      number: safeInt(round.number, 1),
      status: String(round.status || 'choosing'),
      winnerId: String(round.winnerId || ''),
      message: String(round.message || ''),
      revealAt: safeInt(round.revealAt, 0),
      myMove,
      opponentMove,
      mySubmitted: !!myMove,
      opponentSubmitted: !!(opponentId && roundMoves[opponentId])
    }
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
      return jsonResponse(200, {
        ok: true
      });
    }
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (err) {
    return jsonResponse(400, { error: 'Invalid JSON' });
  }

  const action = String(payload.action || '')
    .trim()
    .toLowerCase();
  const now = Date.now();

  const rawState = (await readJSON(store, STATE_KEY)) || {};
  const state = normalizeState(rawState);
  cleanupState(state, now);

  const player = sanitizePlayer(payload.player);
  const playerId = sanitizeId(payload.playerId || (player && player.id) || '');
  const matchId = sanitizeId(payload.matchId);
  const move = String(payload.move || '')
    .trim()
    .toLowerCase();

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
    if (!player) {
      return jsonResponse(400, { error: 'Missing player identity.' });
    }

    state.queue = state.queue.filter((q) => q.player.id !== player.id);
    let match = state.matches.find((m) => m.players.some((p) => p.id === player.id));
    if (!match) {
      const opponentQueueItem = state.queue.find((q) => q.player.id !== player.id);
      if (opponentQueueItem) {
        state.queue = state.queue.filter((q) => q.player.id !== opponentQueueItem.player.id);
        match = createMatch(opponentQueueItem.player, player, now);
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
        match: publicMatchForPlayer(match, player.id),
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
    if (!playerId) {
      return jsonResponse(400, { error: 'Missing playerId.' });
    }
    const match = findMatch();
    if (match) {
      match.lastSeen[playerId] = now;
      match.expiresAt = now + MATCH_TTL_MS;
      if (!match.winnerId && match.nextRoundAt && now >= safeInt(match.nextRoundAt, 0)) {
        startRound(match);
      }
      resolveRoundIfReady(match, now);
      match.updatedAt = now;
      await writeJSON(store, STATE_KEY, state);
      return jsonResponse(200, {
        status: 'matched',
        match: publicMatchForPlayer(match, playerId),
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

  if (action === 'move') {
    if (!playerId || !matchId) {
      return jsonResponse(400, { error: 'Missing matchId or playerId.' });
    }
    if (!['rock', 'paper', 'scissors'].includes(move)) {
      return jsonResponse(400, { error: 'Invalid move.' });
    }

    const match = state.matches.find((m) => m.id === matchId);
    if (!match || !match.players.some((p) => p.id === playerId)) {
      await writeJSON(store, STATE_KEY, state);
      return jsonResponse(404, { error: 'Match not found.' });
    }

    match.lastSeen[playerId] = now;
    match.expiresAt = now + MATCH_TTL_MS;
    if (!match.round || typeof match.round !== 'object') {
      startRound(match);
    }
    if (!match.winnerId && match.round.status === 'choosing') {
      const roundMoves = match.round.moves && typeof match.round.moves === 'object' ? match.round.moves : {};
      if (!roundMoves[playerId]) {
        roundMoves[playerId] = move;
      }
      match.round.moves = roundMoves;
      resolveRoundIfReady(match, now);
      if (!match.winnerId && match.nextRoundAt && now >= safeInt(match.nextRoundAt, 0)) {
        startRound(match);
      }
    }
    match.updatedAt = now;

    await writeJSON(store, STATE_KEY, state);
    return jsonResponse(200, {
      status: 'matched',
      match: publicMatchForPlayer(match, playerId),
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
      if (match.winnerId) continue;
      const opponent = match.players.find((p) => p.id !== playerId);
      if (opponent) {
        match.winnerId = opponent.id;
        match.endedAt = now;
        if (!match.round || typeof match.round !== 'object') {
          match.round = {};
        }
        match.round.status = 'revealed';
        match.round.winnerId = opponent.id;
        match.round.message = 'Opponent left the match.';
        match.updatedAt = now;
      }
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
