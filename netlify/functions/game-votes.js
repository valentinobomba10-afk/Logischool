const STORE_NAME = 'logischool';
const VOTES_KEY = 'game-votes-v2';
const VOTE_WINDOW_MS = 6 * 60 * 60 * 1000;

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

const normalizeId = (value, maxLen) =>
  String(value || '')
    .trim()
    .slice(0, maxLen);

const normalizeCountsObject = (raw) => {
  const output = {};
  if (!raw || typeof raw !== 'object') return output;
  Object.keys(raw).forEach((key) => {
    const gameId = normalizeId(key, 64);
    const votes = Math.max(0, Math.round(Number(raw[key]) || 0));
    if (gameId && votes > 0) output[gameId] = votes;
  });
  return output;
};

const normalizeChoicesObject = (raw) => {
  const output = {};
  if (!raw || typeof raw !== 'object') return output;
  Object.keys(raw).forEach((key) => {
    const userId = normalizeId(key, 80);
    const gameId = normalizeId(raw[key], 64);
    if (userId && gameId) output[userId] = gameId;
  });
  return output;
};

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

const ensureState = (rawState, now) => {
  const existing = rawState && typeof rawState === 'object' ? rawState : {};
  const savedTarget = Number(existing.target);
  const target = Number.isFinite(savedTarget) && savedTarget > 0 ? savedTarget : now + VOTE_WINDOW_MS;
  return {
    target,
    votesByGame: normalizeCountsObject(existing.votesByGame),
    votesByUser: normalizeChoicesObject(existing.votesByUser),
    createdAt: existing.createdAt || new Date(now).toISOString(),
    updatedAt: new Date(now).toISOString()
  };
};

const toSortedCountsArray = (votesByGame) =>
  Object.entries(normalizeCountsObject(votesByGame))
    .map(([gameId, votes]) => ({ gameId, votes }))
    .sort((a, b) => b.votes - a.votes || a.gameId.localeCompare(b.gameId));

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return emptyResponse(204);
  }

  const store = getStore(event);
  if (!store) {
    return jsonResponse(503, { error: 'Voting storage unavailable', code: 'STORAGE_UNAVAILABLE' });
  }

  const now = Date.now();
  let state;
  try {
    state = ensureState(await readJSON(store, VOTES_KEY), now);
  } catch (err) {
    return jsonResponse(500, { error: 'Failed to read vote data' });
  }

  if (event.httpMethod === 'GET') {
    const userId = normalizeId(event.queryStringParameters?.userId, 80);
    const counts = toSortedCountsArray(state.votesByGame);
    const votedGameId = userId ? normalizeId(state.votesByUser[userId], 64) : '';
    try {
      await writeJSON(store, VOTES_KEY, state);
    } catch (err) {
      // return current state even if write fails
    }
    return jsonResponse(200, {
      target: state.target,
      active: now < state.target,
      counts,
      votedGameId,
      updatedAt: state.updatedAt
    });
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

  const userId = normalizeId(payload?.userId, 80);
  const gameId = normalizeId(payload?.gameId, 64);
  if (!userId || !gameId) {
    return jsonResponse(400, { error: 'Missing userId or gameId' });
  }

  if (now >= state.target) {
    return jsonResponse(409, {
      error: 'Voting has ended',
      target: state.target,
      active: false,
      counts: toSortedCountsArray(state.votesByGame),
      votedGameId: normalizeId(state.votesByUser[userId], 64)
    });
  }

  const previousGameId = normalizeId(state.votesByUser[userId], 64);
  if (previousGameId && previousGameId !== gameId) {
    const priorVotes = Math.max(0, Math.round(Number(state.votesByGame[previousGameId]) || 0) - 1);
    if (priorVotes > 0) {
      state.votesByGame[previousGameId] = priorVotes;
    } else {
      delete state.votesByGame[previousGameId];
    }
  }

  if (previousGameId !== gameId) {
    const nextVotes = Math.max(0, Math.round(Number(state.votesByGame[gameId]) || 0)) + 1;
    state.votesByGame[gameId] = nextVotes;
    state.votesByUser[userId] = gameId;
  }

  state.updatedAt = new Date(now).toISOString();

  try {
    await writeJSON(store, VOTES_KEY, state);
  } catch (err) {
    return jsonResponse(500, { error: 'Failed to save vote' });
  }

  return jsonResponse(200, {
    ok: true,
    target: state.target,
    active: true,
    votedGameId: normalizeId(state.votesByUser[userId], 64),
    counts: toSortedCountsArray(state.votesByGame),
    updatedAt: state.updatedAt
  });
};
