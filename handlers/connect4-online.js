const STORE_NAME = 'logischool';
const STATE_KEY = 'connect4-online-v1';
const QUEUE_TTL_MS = 10 * 60 * 1000;
const MATCH_TTL_MS = 20 * 60 * 1000;
const MATCH_END_KEEP_MS = 2 * 60 * 1000;
const PLAYER_STALE_MS = 90 * 1000;
const ROWS = 6;
const COLS = 7;
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

const createBoard = () => Array.from({ length: ROWS }, () => Array(COLS).fill(0));

const normalizeBoard = (raw) => {
  if (!Array.isArray(raw)) return createBoard();
  const board = createBoard();
  for (let r = 0; r < ROWS; r += 1) {
    for (let c = 0; c < COLS; c += 1) {
      const value = toInt(raw?.[r]?.[c], 0);
      board[r][c] = value === 1 || value === 2 ? value : 0;
    }
  }
  return board;
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

const dropDisc = (board, col, token) => {
  for (let r = ROWS - 1; r >= 0; r -= 1) {
    if (board[r][col] === 0) {
      board[r][col] = token;
      return r;
    }
  }
  return -1;
};

const boardFull = (board) => board.every((row) => row.every((cell) => cell !== 0));

const checkWin = (board, row, col, token) => {
  const dirs = [
    [1, 0],
    [0, 1],
    [1, 1],
    [1, -1]
  ];
  for (const [dr, dc] of dirs) {
    let count = 1;
    for (const sign of [-1, 1]) {
      let rr = row + dr * sign;
      let cc = col + dc * sign;
      while (rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS && board[rr][cc] === token) {
        count += 1;
        rr += dr * sign;
        cc += dc * sign;
      }
    }
    if (count >= 4) return true;
  }
  return false;
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
  id: `c4_${now}_${Math.random().toString(36).slice(2, 9)}`,
  players: [playerA, playerB],
  board: createBoard(),
  currentTurn: playerA.id,
  winnerId: '',
  isDraw: false,
  status: 'live',
  moveCount: 0,
  lastMove: null,
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
    const match = {
      ...raw,
      players,
      board: normalizeBoard(raw.board),
      currentTurn: sanitizeId(raw.currentTurn) || p1.id,
      winnerId: sanitizeId(raw.winnerId),
      status: String(raw.status || 'live'),
      moveCount: toInt(raw.moveCount, 0),
      lastMove:
        raw.lastMove && typeof raw.lastMove === 'object'
          ? {
              row: toInt(raw.lastMove.row, -1),
              col: toInt(raw.lastMove.col, -1),
              playerId: sanitizeId(raw.lastMove.playerId)
            }
          : null,
      reason: String(raw.reason || ''),
      isDraw: !!raw.isDraw,
      expiresAt: toInt(raw.expiresAt, now + MATCH_TTL_MS),
      endedAt: toInt(raw.endedAt, 0)
    };

    if (!match.lastSeen || typeof match.lastSeen !== 'object') {
      match.lastSeen = {};
    }
    match.lastSeen[p1.id] = toInt(match.lastSeen[p1.id], now);
    match.lastSeen[p2.id] = toInt(match.lastSeen[p2.id], now);

    if (match.expiresAt < now) continue;

    if (match.status !== 'finished') {
      if (match.currentTurn !== p1.id && match.currentTurn !== p2.id) {
        match.currentTurn = p1.id;
      }
      const stalePlayers = [p1, p2].filter((p) => now - toInt(match.lastSeen[p.id], 0) > PLAYER_STALE_MS);
      if (stalePlayers.length === 1) {
        const staleId = stalePlayers[0].id;
        const winner = staleId === p1.id ? p2 : p1;
        match.status = 'finished';
        match.winnerId = winner.id;
        match.isDraw = false;
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

const publicMatch = (match) => ({
  id: match.id,
  players: match.players.map((p) => ({
    id: p.id,
    username: p.username,
    avatarUrl: p.avatarUrl || '',
    avatarPreset: p.avatarPreset || ''
  })),
  board: normalizeBoard(match.board),
  currentTurn: match.currentTurn || '',
  winnerId: match.winnerId || '',
  isDraw: !!match.isDraw,
  status: match.status || 'live',
  moveCount: toInt(match.moveCount, 0),
  lastMove: match.lastMove || null,
  reason: String(match.reason || ''),
  updatedAt: toInt(match.updatedAt, 0)
});

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
        match: publicMatch(match),
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
      match.updatedAt = now;
      await writeJSON(store, STATE_KEY, state);
      return jsonResponse(200, {
        status: 'matched',
        match: publicMatch(match),
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
    const col = toInt(payload.col, -1);
    if (col < 0 || col >= COLS) {
      return jsonResponse(400, { error: 'Invalid column.' });
    }

    const match = state.matches.find((m) => m.id === matchId);
    if (!match || !match.players.some((p) => p.id === playerId)) {
      await writeJSON(store, STATE_KEY, state);
      return jsonResponse(404, { error: 'Match not found.' });
    }

    match.lastSeen[playerId] = now;
    match.expiresAt = now + MATCH_TTL_MS;
    if (match.status !== 'finished') {
      if (match.currentTurn !== playerId) {
        await writeJSON(store, STATE_KEY, state);
        return jsonResponse(200, {
          status: 'matched',
          match: publicMatch(match),
          message: 'Not your turn.',
          serverTime: now
        });
      }
      const p1Id = match.players[0].id;
      const token = playerId === p1Id ? 1 : 2;
      const row = dropDisc(match.board, col, token);
      if (row === -1) {
        await writeJSON(store, STATE_KEY, state);
        return jsonResponse(400, { error: 'Column is full.' });
      }
      match.lastMove = { row, col, playerId };
      match.moveCount = toInt(match.moveCount, 0) + 1;

      if (checkWin(match.board, row, col, token)) {
        match.status = 'finished';
        match.winnerId = playerId;
        match.isDraw = false;
        match.endedAt = now;
      } else if (boardFull(match.board)) {
        match.status = 'finished';
        match.winnerId = '';
        match.isDraw = true;
        match.endedAt = now;
      } else {
        const nextTurn = match.players.find((p) => p.id !== playerId);
        match.currentTurn = nextTurn ? nextTurn.id : playerId;
      }
    }
    match.updatedAt = now;

    await writeJSON(store, STATE_KEY, state);
    return jsonResponse(200, {
      status: 'matched',
      match: publicMatch(match),
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
      match.isDraw = false;
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
