const STORE_NAME = 'logischool';
const SOCIAL_KEY = 'social-v1';

const MAX_STREAMS = 80;
const STREAM_STALE_MS = 45 * 1000;
const VIEWER_STALE_MS = 30 * 1000;
const SIGNAL_STALE_MS = 2 * 60 * 1000;

const MAX_STREAM_CHAT_PER_STREAM = 220;
const MAX_STREAM_CHAT_TEXT = 220;
const MAX_DM_THREADS = 800;
const MAX_DM_MESSAGES_PER_THREAD = 220;
const MAX_GROUPS = 300;
const MAX_GROUP_MESSAGES = 220;
const MAX_GROUP_MEMBERS = 32;
const MAX_FOLLOWS_PER_USER = 300;
const MAX_SIGNAL_CANDIDATES = 60;

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

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const normalizeUsername = (value) =>
  String(value || '')
    .trim()
    .slice(0, 18);

const normalizeUserKey = (value) => normalizeUsername(value).toLowerCase();

const normalizeUserId = (value) =>
  String(value || '')
    .trim()
    .slice(0, 80);

const normalizeStreamId = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

const normalizeGroupId = (value) => normalizeStreamId(value).slice(0, 60);

const normalizeGameId = (value) =>
  String(value || '')
    .trim()
    .slice(0, 60);

const normalizeGameName = (value) =>
  String(value || '')
    .trim()
    .slice(0, 80);

const normalizeTitle = (value) =>
  String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);

const normalizeText = (value, maxLen = 220) =>
  String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);

const normalizeTimestamp = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return NaN;
  return Math.round(n);
};

const normalizeCandidate = (candidate) => {
  if (!candidate || typeof candidate !== 'object') return null;
  const str = String(candidate.candidate || '').trim();
  if (!str) return null;
  const sdpMid = String(candidate.sdpMid || '').trim().slice(0, 80);
  const sdpMLineIndex = Number(candidate.sdpMLineIndex);
  const usernameFragment = String(candidate.usernameFragment || '').trim().slice(0, 80);
  return {
    candidate: str.slice(0, 3000),
    sdpMid,
    sdpMLineIndex: Number.isFinite(sdpMLineIndex) ? sdpMLineIndex : null,
    usernameFragment
  };
};

const normalizeSdp = (raw) => {
  const type = String(raw?.type || '')
    .trim()
    .toLowerCase();
  if (type !== 'offer' && type !== 'answer') return null;
  const sdp = String(raw?.sdp || '').trim();
  if (!sdp) return null;
  return {
    type,
    sdp: sdp.slice(0, 150000)
  };
};

const nowIso = (now = Date.now()) => new Date(now).toISOString();

const getStore = (event) => {
  if (!blobsModule || typeof blobsModule.getStore !== 'function') return null;
  try {
    if (typeof blobsModule.connectLambda === 'function') blobsModule.connectLambda(event);
  } catch (err) {
    // ignore
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

const genId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
};

const conversationKey = (a, b) => {
  const first = normalizeUserKey(a);
  const second = normalizeUserKey(b);
  if (!first || !second || first === second) return '';
  return [first, second].sort().join('|');
};

const sanitizeStream = (raw, key, now) => {
  if (!raw || typeof raw !== 'object') return null;
  const id = normalizeStreamId(raw.id || key);
  const hostUsername = normalizeUsername(raw.hostUsername || raw.username);
  const hostKey = normalizeUserKey(raw.hostKey || hostUsername);
  const hostUserId = normalizeUserId(raw.hostUserId || raw.userId);
  const gameId = normalizeGameId(raw.gameId);
  const gameName = normalizeGameName(raw.gameName);
  const title = normalizeTitle(raw.title);
  const startedAt = normalizeTimestamp(raw.startedAt) || now;
  const updatedAt = normalizeTimestamp(raw.updatedAt) || startedAt;
  if (!id || !hostUsername || !hostKey) return null;
  if (now - updatedAt > STREAM_STALE_MS) return null;
  return {
    id,
    hostUsername,
    hostKey,
    hostUserId,
    gameId,
    gameName,
    title,
    startedAt,
    updatedAt
  };
};

const sanitizeMessage = (raw, maxTextLen = 220) => {
  if (!raw || typeof raw !== 'object') return null;
  const id = String(raw.id || '').trim().slice(0, 80);
  const from = normalizeUsername(raw.from || raw.username);
  const fromKey = normalizeUserKey(raw.fromKey || from);
  const to = normalizeUsername(raw.to);
  const text = normalizeText(raw.text || raw.message, maxTextLen);
  const createdAt = normalizeTimestamp(raw.createdAt);
  if (!id || !from || !fromKey || !text || !Number.isFinite(createdAt)) return null;
  return {
    id,
    from,
    fromKey,
    to,
    text,
    createdAt,
    fromUserId: normalizeUserId(raw.fromUserId),
    titleTag: normalizeText(raw.titleTag, 28),
    chatNameColor: normalizeText(raw.chatNameColor, 12)
  };
};

const sanitizeGroup = (raw, key, now) => {
  if (!raw || typeof raw !== 'object') return null;
  const id = normalizeGroupId(raw.id || key);
  const name = normalizeTitle(raw.name || id);
  const owner = normalizeUsername(raw.owner);
  const ownerKey = normalizeUserKey(raw.ownerKey || owner);
  if (!id || !name || !owner || !ownerKey) return null;
  const members = new Set();
  members.add(ownerKey);
  toArray(raw.members)
    .slice(0, MAX_GROUP_MEMBERS * 2)
    .forEach((row) => {
      const keyPart = normalizeUserKey(row);
      if (keyPart) members.add(keyPart);
    });
  const createdAt = normalizeTimestamp(raw.createdAt) || now;
  const messagesRaw = Array.isArray(raw.messages) ? raw.messages : [];
  const messages = messagesRaw
    .map((row) => sanitizeMessage(row, MAX_STREAM_CHAT_TEXT))
    .filter(Boolean)
    .sort((a, b) => a.createdAt - b.createdAt)
    .slice(-MAX_GROUP_MESSAGES);
  return {
    id,
    name,
    owner,
    ownerKey,
    members: [...members].slice(0, MAX_GROUP_MEMBERS),
    createdAt,
    messages
  };
};

const ensureState = (rawState, now) => {
  const source = rawState && typeof rawState === 'object' ? rawState : {};

  const streams = {};
  const rawStreams = source.streams && typeof source.streams === 'object' ? source.streams : {};
  Object.keys(rawStreams)
    .slice(0, MAX_STREAMS * 2)
    .forEach((key) => {
      const stream = sanitizeStream(rawStreams[key], key, now);
      if (stream) streams[stream.id] = stream;
    });

  const viewers = {};
  const rawViewers = source.viewers && typeof source.viewers === 'object' ? source.viewers : {};
  Object.keys(rawViewers).forEach((streamIdRaw) => {
    const streamId = normalizeStreamId(streamIdRaw);
    if (!streamId || !streams[streamId]) return;
    const rawPerStream = rawViewers[streamIdRaw] && typeof rawViewers[streamIdRaw] === 'object' ? rawViewers[streamIdRaw] : {};
    const perStream = {};
    Object.keys(rawPerStream).forEach((viewerKeyRaw) => {
      const viewerKey = normalizeUserKey(viewerKeyRaw);
      const row = rawPerStream[viewerKeyRaw];
      const username = normalizeUsername(row?.username || viewerKeyRaw);
      const lastSeenAt = normalizeTimestamp(row?.lastSeenAt);
      if (!viewerKey || !username || !Number.isFinite(lastSeenAt)) return;
      if (now - lastSeenAt > VIEWER_STALE_MS) return;
      perStream[viewerKey] = { username, lastSeenAt };
    });
    if (Object.keys(perStream).length) viewers[streamId] = perStream;
  });

  const follows = {};
  const rawFollows = source.follows && typeof source.follows === 'object' ? source.follows : {};
  Object.keys(rawFollows).forEach((followerRaw) => {
    const follower = normalizeUserKey(followerRaw);
    if (!follower) return;
    const set = new Set();
    toArray(rawFollows[followerRaw])
      .slice(0, MAX_FOLLOWS_PER_USER * 2)
      .forEach((targetRaw) => {
        const target = normalizeUserKey(targetRaw);
        if (target && target !== follower) set.add(target);
      });
    if (set.size) follows[follower] = [...set].slice(0, MAX_FOLLOWS_PER_USER);
  });

  const streamChat = {};
  const rawStreamChat = source.streamChat && typeof source.streamChat === 'object' ? source.streamChat : {};
  Object.keys(rawStreamChat).forEach((streamIdRaw) => {
    const streamId = normalizeStreamId(streamIdRaw);
    if (!streamId || !streams[streamId]) return;
    const messages = (Array.isArray(rawStreamChat[streamIdRaw]) ? rawStreamChat[streamIdRaw] : [])
      .map((row) => sanitizeMessage(row, MAX_STREAM_CHAT_TEXT))
      .filter(Boolean)
      .sort((a, b) => a.createdAt - b.createdAt)
      .slice(-MAX_STREAM_CHAT_PER_STREAM);
    if (messages.length) streamChat[streamId] = messages;
  });

  const dms = {};
  const rawDms = source.dms && typeof source.dms === 'object' ? source.dms : {};
  Object.keys(rawDms)
    .slice(0, MAX_DM_THREADS * 2)
    .forEach((threadRaw) => {
      const key = String(threadRaw || '').trim().slice(0, 80);
      if (!key.includes('|')) return;
      const messages = (Array.isArray(rawDms[threadRaw]) ? rawDms[threadRaw] : [])
        .map((row) => sanitizeMessage(row, MAX_STREAM_CHAT_TEXT))
        .filter(Boolean)
        .sort((a, b) => a.createdAt - b.createdAt)
        .slice(-MAX_DM_MESSAGES_PER_THREAD);
      if (messages.length) dms[key] = messages;
    });

  const groups = {};
  const rawGroups = source.groups && typeof source.groups === 'object' ? source.groups : {};
  Object.keys(rawGroups)
    .slice(0, MAX_GROUPS * 2)
    .forEach((groupRaw) => {
      const group = sanitizeGroup(rawGroups[groupRaw], groupRaw, now);
      if (group) groups[group.id] = group;
    });

  const signals = {
    offers: {},
    answers: {},
    viewerCandidates: {},
    hostCandidates: {}
  };

  const sanitizeSignalBucket = (rawBucket, allowCandidateArray = false) => {
    const out = {};
    const sourceBucket = rawBucket && typeof rawBucket === 'object' ? rawBucket : {};
    Object.keys(sourceBucket).forEach((streamRaw) => {
      const streamId = normalizeStreamId(streamRaw);
      if (!streamId || !streams[streamId]) return;
      const row = sourceBucket[streamRaw] && typeof sourceBucket[streamRaw] === 'object' ? sourceBucket[streamRaw] : {};
      const perStream = {};
      Object.keys(row).forEach((viewerRaw) => {
        const viewerKey = normalizeUserKey(viewerRaw);
        if (!viewerKey) return;
        if (allowCandidateArray) {
          const list = Array.isArray(row[viewerRaw]) ? row[viewerRaw] : [];
          const cleaned = list
            .map((item) => {
              const candidate = normalizeCandidate(item?.candidate || item);
              const createdAt = normalizeTimestamp(item?.createdAt) || now;
              if (!candidate) return null;
              if (now - createdAt > SIGNAL_STALE_MS) return null;
              return { candidate, createdAt };
            })
            .filter(Boolean)
            .slice(-MAX_SIGNAL_CANDIDATES);
          if (cleaned.length) perStream[viewerKey] = cleaned;
        } else {
          const sdp = normalizeSdp(row[viewerRaw]?.sdp || row[viewerRaw]);
          const createdAt = normalizeTimestamp(row[viewerRaw]?.createdAt) || now;
          const viewerUsername = normalizeUsername(row[viewerRaw]?.viewerUsername || viewerRaw);
          if (!sdp) return;
          if (now - createdAt > SIGNAL_STALE_MS) return;
          perStream[viewerKey] = {
            viewerUsername,
            sdp,
            createdAt
          };
        }
      });
      if (Object.keys(perStream).length) out[streamId] = perStream;
    });
    return out;
  };

  signals.offers = sanitizeSignalBucket(source.signals?.offers, false);
  signals.answers = sanitizeSignalBucket(source.signals?.answers, false);
  signals.viewerCandidates = sanitizeSignalBucket(source.signals?.viewerCandidates, true);
  signals.hostCandidates = sanitizeSignalBucket(source.signals?.hostCandidates, true);

  return {
    streams,
    viewers,
    follows,
    streamChat,
    dms,
    groups,
    signals,
    updatedAt: nowIso(now)
  };
};

const toStore = (state, now) => ({
  streams: state.streams,
  viewers: state.viewers,
  follows: state.follows,
  streamChat: state.streamChat,
  dms: state.dms,
  groups: state.groups,
  signals: state.signals,
  updatedAt: nowIso(now)
});

const streamViewerCount = (state, streamId) => Object.keys(state.viewers[streamId] || {}).length;

const buildLiveSnapshot = (state, username) => {
  const userKey = normalizeUserKey(username);
  const followingSet = new Set((state.follows[userKey] || []).map((row) => normalizeUserKey(row)).filter(Boolean));
  const streams = Object.values(state.streams)
    .sort((a, b) => b.startedAt - a.startedAt)
    .slice(0, MAX_STREAMS)
    .map((stream) => ({
      id: stream.id,
      hostUsername: stream.hostUsername,
      hostKey: stream.hostKey,
      hostUserId: stream.hostUserId,
      gameId: stream.gameId,
      gameName: stream.gameName,
      title: stream.title,
      startedAt: stream.startedAt,
      updatedAt: stream.updatedAt,
      viewerCount: streamViewerCount(state, stream.id),
      isFollowing: userKey ? followingSet.has(stream.hostKey) : false
    }));
  const followedLive = streams.filter((stream) => userKey && followingSet.has(stream.hostKey));
  return {
    streams,
    following: [...followingSet],
    followedLive
  };
};

const ensureStreamExists = (state, streamId) => {
  const id = normalizeStreamId(streamId);
  if (!id) return null;
  return state.streams[id] || null;
};

const parseAction = (event, payload) => {
  const fromBody = String(payload?.action || '')
    .trim()
    .toLowerCase();
  if (fromBody) return fromBody;
  const fromQuery = String(event.queryStringParameters?.action || '')
    .trim()
    .toLowerCase();
  return fromQuery;
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return emptyResponse(204);
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  const store = getStore(event);
  if (!store) {
    return jsonResponse(503, { error: 'Social storage unavailable', code: 'STORAGE_UNAVAILABLE' });
  }

  let payload = {};
  if (event.httpMethod === 'POST') {
    try {
      payload = JSON.parse(event.body || '{}');
    } catch (err) {
      return jsonResponse(400, { error: 'Invalid JSON payload' });
    }
  }

  const action = parseAction(event, payload);
  if (!action) {
    return jsonResponse(400, { error: 'Missing action' });
  }

  const now = Date.now();
  let state;
  try {
    state = ensureState(await readJSON(store, SOCIAL_KEY), now);
  } catch (err) {
    return jsonResponse(500, { error: 'Failed to load social state' });
  }

  const persist = async () => {
    await writeJSON(store, SOCIAL_KEY, toStore(state, now));
  };

  if (action === 'live_snapshot') {
    const username = normalizeUsername(payload.username || event.queryStringParameters?.username);
    const snapshot = buildLiveSnapshot(state, username);
    return jsonResponse(200, {
      ok: true,
      ...snapshot,
      serverTime: now
    });
  }

  if (action === 'follow_toggle') {
    const username = normalizeUsername(payload.username);
    const userKey = normalizeUserKey(username);
    const target = normalizeUsername(payload.targetUsername || payload.target);
    const targetKey = normalizeUserKey(target);
    if (!userKey || !targetKey || userKey === targetKey) {
      return jsonResponse(400, { error: 'username and targetUsername are required.' });
    }
    const current = new Set((state.follows[userKey] || []).map((row) => normalizeUserKey(row)).filter(Boolean));
    let following = false;
    if (current.has(targetKey)) {
      current.delete(targetKey);
      following = false;
    } else {
      if (current.size >= MAX_FOLLOWS_PER_USER) {
        return jsonResponse(400, { error: 'Follow limit reached.' });
      }
      current.add(targetKey);
      following = true;
    }
    if (current.size) {
      state.follows[userKey] = [...current];
    } else {
      delete state.follows[userKey];
    }
    try {
      await persist();
    } catch (err) {
      return jsonResponse(500, { error: 'Failed to save follow list.' });
    }
    const snapshot = buildLiveSnapshot(state, username);
    return jsonResponse(200, {
      ok: true,
      followingState: following,
      target: targetKey,
      ...snapshot
    });
  }

  if (action === 'start_stream') {
    const username = normalizeUsername(payload.username);
    const userKey = normalizeUserKey(username);
    if (!username || !userKey) {
      return jsonResponse(400, { error: 'username is required.' });
    }
    const userId = normalizeUserId(payload.userId);
    const gameId = normalizeGameId(payload.gameId);
    const gameName = normalizeGameName(payload.gameName || payload.gameId || 'Live');
    const title = normalizeTitle(payload.title);
    let streamId = normalizeStreamId(payload.streamId);
    if (!streamId) streamId = genId('live');

    Object.keys(state.streams).forEach((id) => {
      if (state.streams[id].hostKey === userKey && id !== streamId) {
        delete state.streams[id];
        delete state.viewers[id];
        delete state.streamChat[id];
        delete state.signals.offers[id];
        delete state.signals.answers[id];
        delete state.signals.viewerCandidates[id];
        delete state.signals.hostCandidates[id];
      }
    });

    const currentCount = Object.keys(state.streams).length;
    if (!state.streams[streamId] && currentCount >= MAX_STREAMS) {
      return jsonResponse(400, { error: 'Live stream capacity reached.' });
    }

    state.streams[streamId] = {
      id: streamId,
      hostUsername: username,
      hostKey: userKey,
      hostUserId: userId,
      gameId,
      gameName,
      title,
      startedAt: now,
      updatedAt: now
    };

    if (!state.viewers[streamId]) state.viewers[streamId] = {};
    if (!state.streamChat[streamId]) state.streamChat[streamId] = [];
    state.signals.offers[streamId] = state.signals.offers[streamId] || {};
    state.signals.answers[streamId] = state.signals.answers[streamId] || {};
    state.signals.viewerCandidates[streamId] = state.signals.viewerCandidates[streamId] || {};
    state.signals.hostCandidates[streamId] = state.signals.hostCandidates[streamId] || {};

    try {
      await persist();
    } catch (err) {
      return jsonResponse(500, { error: 'Failed to start stream.' });
    }

    return jsonResponse(200, {
      ok: true,
      stream: {
        ...state.streams[streamId],
        viewerCount: streamViewerCount(state, streamId)
      }
    });
  }

  if (action === 'ping_stream') {
    const streamId = normalizeStreamId(payload.streamId);
    const username = normalizeUsername(payload.username);
    const stream = ensureStreamExists(state, streamId);
    if (!stream) return jsonResponse(404, { error: 'Stream not found.' });
    if (normalizeUserKey(username) !== stream.hostKey) {
      return jsonResponse(403, { error: 'Only host can ping this stream.' });
    }
    stream.updatedAt = now;
    state.streams[streamId] = stream;
    try {
      await persist();
    } catch (err) {
      return jsonResponse(500, { error: 'Failed to update stream status.' });
    }
    return jsonResponse(200, {
      ok: true,
      stream: {
        ...stream,
        viewerCount: streamViewerCount(state, streamId)
      }
    });
  }

  if (action === 'stop_stream') {
    const streamId = normalizeStreamId(payload.streamId);
    const username = normalizeUsername(payload.username);
    const stream = ensureStreamExists(state, streamId);
    if (!stream) return jsonResponse(404, { error: 'Stream not found.' });
    if (normalizeUserKey(username) !== stream.hostKey) {
      return jsonResponse(403, { error: 'Only host can stop this stream.' });
    }

    delete state.streams[streamId];
    delete state.viewers[streamId];
    delete state.streamChat[streamId];
    delete state.signals.offers[streamId];
    delete state.signals.answers[streamId];
    delete state.signals.viewerCandidates[streamId];
    delete state.signals.hostCandidates[streamId];

    try {
      await persist();
    } catch (err) {
      return jsonResponse(500, { error: 'Failed to stop stream.' });
    }
    return jsonResponse(200, { ok: true });
  }

  if (action === 'watch_ping') {
    const streamId = normalizeStreamId(payload.streamId);
    const username = normalizeUsername(payload.username);
    const viewerKey = normalizeUserKey(username);
    const stream = ensureStreamExists(state, streamId);
    if (!stream) return jsonResponse(404, { error: 'Stream not found.' });
    if (!viewerKey || !username) return jsonResponse(400, { error: 'username is required.' });
    state.viewers[streamId] = state.viewers[streamId] || {};
    state.viewers[streamId][viewerKey] = {
      username,
      lastSeenAt: now
    };
    try {
      await persist();
    } catch (err) {
      return jsonResponse(500, { error: 'Failed to update viewer presence.' });
    }
    return jsonResponse(200, {
      ok: true,
      viewerCount: streamViewerCount(state, streamId)
    });
  }

  if (action === 'stream_chat_send') {
    const streamId = normalizeStreamId(payload.streamId);
    const stream = ensureStreamExists(state, streamId);
    if (!stream) return jsonResponse(404, { error: 'Stream not found.' });
    const username = normalizeUsername(payload.username);
    const fromKey = normalizeUserKey(username);
    const text = normalizeText(payload.text, MAX_STREAM_CHAT_TEXT);
    if (!username || !fromKey || !text) {
      return jsonResponse(400, { error: 'username and text are required.' });
    }
    const message = {
      id: genId('msg'),
      from: username,
      fromKey,
      to: '',
      text,
      createdAt: now,
      fromUserId: normalizeUserId(payload.userId),
      titleTag: normalizeText(payload.titleTag, 28),
      chatNameColor: normalizeText(payload.chatNameColor, 12)
    };
    state.streamChat[streamId] = state.streamChat[streamId] || [];
    state.streamChat[streamId].push(message);
    state.streamChat[streamId] = state.streamChat[streamId].slice(-MAX_STREAM_CHAT_PER_STREAM);
    try {
      await persist();
    } catch (err) {
      return jsonResponse(500, { error: 'Failed to send stream chat message.' });
    }
    return jsonResponse(200, {
      ok: true,
      message
    });
  }

  if (action === 'stream_chat_list') {
    const streamId = normalizeStreamId(payload.streamId || event.queryStringParameters?.streamId);
    const stream = ensureStreamExists(state, streamId);
    if (!stream) return jsonResponse(404, { error: 'Stream not found.' });
    const limit = clamp(Number(payload.limit || event.queryStringParameters?.limit) || 80, 1, 160);
    const messages = (state.streamChat[streamId] || []).slice(-limit);
    return jsonResponse(200, {
      ok: true,
      messages,
      viewerCount: streamViewerCount(state, streamId)
    });
  }

  if (action === 'viewer_offer') {
    const streamId = normalizeStreamId(payload.streamId);
    const stream = ensureStreamExists(state, streamId);
    if (!stream) return jsonResponse(404, { error: 'Stream not found.' });
    const viewer = normalizeUsername(payload.viewerUsername || payload.username);
    const viewerKey = normalizeUserKey(viewer);
    const offer = normalizeSdp(payload.offer || payload.sdp);
    if (!viewerKey || !offer) return jsonResponse(400, { error: 'viewerUsername and offer are required.' });
    state.signals.offers[streamId] = state.signals.offers[streamId] || {};
    state.signals.offers[streamId][viewerKey] = {
      viewerUsername: viewer,
      sdp: offer,
      createdAt: now
    };
    try {
      await persist();
    } catch (err) {
      return jsonResponse(500, { error: 'Failed to store offer.' });
    }
    return jsonResponse(200, { ok: true });
  }

  if (action === 'host_answer') {
    const streamId = normalizeStreamId(payload.streamId);
    const stream = ensureStreamExists(state, streamId);
    if (!stream) return jsonResponse(404, { error: 'Stream not found.' });
    const host = normalizeUsername(payload.hostUsername || payload.username);
    if (normalizeUserKey(host) !== stream.hostKey) {
      return jsonResponse(403, { error: 'Only host can send answers.' });
    }
    const viewer = normalizeUsername(payload.viewerUsername || payload.viewer);
    const viewerKey = normalizeUserKey(viewer);
    const answer = normalizeSdp(payload.answer || payload.sdp);
    if (!viewerKey || !answer) return jsonResponse(400, { error: 'viewerUsername and answer are required.' });
    state.signals.answers[streamId] = state.signals.answers[streamId] || {};
    state.signals.answers[streamId][viewerKey] = {
      viewerUsername: viewer,
      sdp: answer,
      createdAt: now
    };
    try {
      await persist();
    } catch (err) {
      return jsonResponse(500, { error: 'Failed to store answer.' });
    }
    return jsonResponse(200, { ok: true });
  }

  if (action === 'viewer_ice') {
    const streamId = normalizeStreamId(payload.streamId);
    const stream = ensureStreamExists(state, streamId);
    if (!stream) return jsonResponse(404, { error: 'Stream not found.' });
    const viewer = normalizeUsername(payload.viewerUsername || payload.username);
    const viewerKey = normalizeUserKey(viewer);
    const candidate = normalizeCandidate(payload.candidate);
    if (!viewerKey || !candidate) {
      return jsonResponse(400, { error: 'viewerUsername and candidate are required.' });
    }
    state.signals.viewerCandidates[streamId] = state.signals.viewerCandidates[streamId] || {};
    state.signals.viewerCandidates[streamId][viewerKey] = state.signals.viewerCandidates[streamId][viewerKey] || [];
    state.signals.viewerCandidates[streamId][viewerKey].push({ candidate, createdAt: now });
    state.signals.viewerCandidates[streamId][viewerKey] = state.signals.viewerCandidates[streamId][viewerKey].slice(
      -MAX_SIGNAL_CANDIDATES
    );
    try {
      await persist();
    } catch (err) {
      return jsonResponse(500, { error: 'Failed to store ICE candidate.' });
    }
    return jsonResponse(200, { ok: true });
  }

  if (action === 'host_ice') {
    const streamId = normalizeStreamId(payload.streamId);
    const stream = ensureStreamExists(state, streamId);
    if (!stream) return jsonResponse(404, { error: 'Stream not found.' });
    const host = normalizeUsername(payload.hostUsername || payload.username);
    if (normalizeUserKey(host) !== stream.hostKey) {
      return jsonResponse(403, { error: 'Only host can send ICE candidates.' });
    }
    const viewer = normalizeUsername(payload.viewerUsername || payload.viewer);
    const viewerKey = normalizeUserKey(viewer);
    const candidate = normalizeCandidate(payload.candidate);
    if (!viewerKey || !candidate) {
      return jsonResponse(400, { error: 'viewerUsername and candidate are required.' });
    }
    state.signals.hostCandidates[streamId] = state.signals.hostCandidates[streamId] || {};
    state.signals.hostCandidates[streamId][viewerKey] = state.signals.hostCandidates[streamId][viewerKey] || [];
    state.signals.hostCandidates[streamId][viewerKey].push({ candidate, createdAt: now });
    state.signals.hostCandidates[streamId][viewerKey] = state.signals.hostCandidates[streamId][viewerKey].slice(
      -MAX_SIGNAL_CANDIDATES
    );
    try {
      await persist();
    } catch (err) {
      return jsonResponse(500, { error: 'Failed to store ICE candidate.' });
    }
    return jsonResponse(200, { ok: true });
  }

  if (action === 'host_signal_poll') {
    const streamId = normalizeStreamId(payload.streamId);
    const stream = ensureStreamExists(state, streamId);
    if (!stream) return jsonResponse(404, { error: 'Stream not found.' });
    const host = normalizeUsername(payload.hostUsername || payload.username);
    if (normalizeUserKey(host) !== stream.hostKey) {
      return jsonResponse(403, { error: 'Only host can poll stream signals.' });
    }

    const offersRow = state.signals.offers[streamId] || {};
    const offers = Object.keys(offersRow).map((viewerKey) => ({
      viewerKey,
      viewerUsername: offersRow[viewerKey].viewerUsername,
      offer: offersRow[viewerKey].sdp
    }));
    state.signals.offers[streamId] = {};

    const viewerCandidatesRow = state.signals.viewerCandidates[streamId] || {};
    const viewerCandidates = {};
    Object.keys(viewerCandidatesRow).forEach((viewerKey) => {
      const list = Array.isArray(viewerCandidatesRow[viewerKey]) ? viewerCandidatesRow[viewerKey] : [];
      if (!list.length) return;
      viewerCandidates[viewerKey] = list.map((item) => item.candidate).filter(Boolean);
    });
    state.signals.viewerCandidates[streamId] = {};

    try {
      await persist();
    } catch (err) {
      return jsonResponse(500, { error: 'Failed to read stream signals.' });
    }

    return jsonResponse(200, {
      ok: true,
      offers,
      viewerCandidates
    });
  }

  if (action === 'viewer_signal_poll') {
    const streamId = normalizeStreamId(payload.streamId);
    const stream = ensureStreamExists(state, streamId);
    if (!stream) return jsonResponse(404, { error: 'Stream not found.' });
    const viewer = normalizeUsername(payload.viewerUsername || payload.username);
    const viewerKey = normalizeUserKey(viewer);
    if (!viewerKey) return jsonResponse(400, { error: 'viewerUsername is required.' });

    const answerRow = state.signals.answers[streamId] || {};
    const answer = answerRow[viewerKey]?.sdp || null;
    if (answerRow[viewerKey]) delete answerRow[viewerKey];
    state.signals.answers[streamId] = answerRow;

    const hostCandidatesRow = state.signals.hostCandidates[streamId] || {};
    const candidates = (hostCandidatesRow[viewerKey] || []).map((item) => item.candidate).filter(Boolean);
    if (hostCandidatesRow[viewerKey]) delete hostCandidatesRow[viewerKey];
    state.signals.hostCandidates[streamId] = hostCandidatesRow;

    try {
      await persist();
    } catch (err) {
      return jsonResponse(500, { error: 'Failed to read viewer signals.' });
    }

    return jsonResponse(200, {
      ok: true,
      answer,
      candidates
    });
  }

  if (action === 'dm_send') {
    const from = normalizeUsername(payload.fromUsername || payload.username);
    const to = normalizeUsername(payload.toUsername || payload.targetUsername);
    const text = normalizeText(payload.text, MAX_STREAM_CHAT_TEXT);
    if (!from || !to || !text) {
      return jsonResponse(400, { error: 'fromUsername, toUsername, and text are required.' });
    }
    if (normalizeUserKey(from) === normalizeUserKey(to)) {
      return jsonResponse(400, { error: 'Cannot message yourself.' });
    }
    const thread = conversationKey(from, to);
    if (!thread) return jsonResponse(400, { error: 'Invalid DM thread.' });

    const message = {
      id: genId('dm'),
      from,
      fromKey: normalizeUserKey(from),
      to,
      text,
      createdAt: now,
      fromUserId: normalizeUserId(payload.fromUserId),
      titleTag: normalizeText(payload.titleTag, 28),
      chatNameColor: normalizeText(payload.chatNameColor, 12)
    };

    const threadCount = Object.keys(state.dms).length;
    if (!state.dms[thread] && threadCount >= MAX_DM_THREADS) {
      return jsonResponse(400, { error: 'DM capacity reached.' });
    }

    state.dms[thread] = state.dms[thread] || [];
    state.dms[thread].push(message);
    state.dms[thread] = state.dms[thread].slice(-MAX_DM_MESSAGES_PER_THREAD);

    try {
      await persist();
    } catch (err) {
      return jsonResponse(500, { error: 'Failed to send DM.' });
    }

    return jsonResponse(200, {
      ok: true,
      message
    });
  }

  if (action === 'dm_list') {
    const username = normalizeUsername(payload.username || event.queryStringParameters?.username);
    const withUsername = normalizeUsername(payload.withUsername || event.queryStringParameters?.withUsername);
    const thread = conversationKey(username, withUsername);
    if (!thread) return jsonResponse(400, { error: 'username and withUsername are required.' });
    const limit = clamp(Number(payload.limit || event.queryStringParameters?.limit) || 120, 1, MAX_DM_MESSAGES_PER_THREAD);
    const messages = (state.dms[thread] || []).slice(-limit);
    return jsonResponse(200, {
      ok: true,
      thread,
      messages
    });
  }

  if (action === 'dm_threads') {
    const username = normalizeUsername(payload.username || event.queryStringParameters?.username);
    const userKey = normalizeUserKey(username);
    if (!userKey) return jsonResponse(400, { error: 'username is required.' });

    const threads = [];
    Object.keys(state.dms).forEach((key) => {
      const parts = key.split('|');
      if (parts.length !== 2) return;
      if (parts[0] !== userKey && parts[1] !== userKey) return;
      const partnerKey = parts[0] === userKey ? parts[1] : parts[0];
      const messages = state.dms[key] || [];
      if (!messages.length) return;
      const last = messages[messages.length - 1];
      const partnerName =
        normalizeUsername(last.fromKey === partnerKey ? last.from : last.to || partnerKey) || partnerKey;
      threads.push({
        key,
        withUsername: partnerName,
        withKey: partnerKey,
        lastText: normalizeText(last.text, 80),
        lastAt: last.createdAt
      });
    });

    threads.sort((a, b) => b.lastAt - a.lastAt);
    return jsonResponse(200, {
      ok: true,
      threads: threads.slice(0, 120)
    });
  }

  if (action === 'group_create') {
    const owner = normalizeUsername(payload.ownerUsername || payload.username);
    const ownerKey = normalizeUserKey(owner);
    const name = normalizeTitle(payload.name);
    if (!owner || !ownerKey || !name) {
      return jsonResponse(400, { error: 'ownerUsername and group name are required.' });
    }

    const groupCount = Object.keys(state.groups).length;
    if (groupCount >= MAX_GROUPS) {
      return jsonResponse(400, { error: 'Group capacity reached.' });
    }

    const membersSet = new Set([ownerKey]);
    toArray(payload.members)
      .slice(0, MAX_GROUP_MEMBERS * 2)
      .forEach((entry) => {
        const key = normalizeUserKey(entry);
        if (key) membersSet.add(key);
      });

    const groupId = genId('grp').toLowerCase();
    state.groups[groupId] = {
      id: groupId,
      name,
      owner,
      ownerKey,
      members: [...membersSet].slice(0, MAX_GROUP_MEMBERS),
      createdAt: now,
      messages: []
    };

    try {
      await persist();
    } catch (err) {
      return jsonResponse(500, { error: 'Failed to create group.' });
    }

    return jsonResponse(200, {
      ok: true,
      group: {
        id: groupId,
        name,
        owner,
        members: state.groups[groupId].members
      }
    });
  }

  if (action === 'group_list') {
    const username = normalizeUsername(payload.username || event.queryStringParameters?.username);
    const userKey = normalizeUserKey(username);
    if (!userKey) return jsonResponse(400, { error: 'username is required.' });

    const groups = Object.values(state.groups)
      .filter((group) => Array.isArray(group.members) && group.members.includes(userKey))
      .map((group) => {
        const last = Array.isArray(group.messages) && group.messages.length ? group.messages[group.messages.length - 1] : null;
        return {
          id: group.id,
          name: group.name,
          owner: group.owner,
          memberCount: group.members.length,
          lastText: last ? normalizeText(last.text, 80) : '',
          lastAt: last ? Number(last.createdAt || group.createdAt || 0) : Number(group.createdAt || 0)
        };
      })
      .sort((a, b) => b.lastAt - a.lastAt);

    return jsonResponse(200, {
      ok: true,
      groups: groups.slice(0, 160)
    });
  }

  if (action === 'group_send') {
    const groupId = normalizeGroupId(payload.groupId);
    const group = state.groups[groupId];
    if (!group) return jsonResponse(404, { error: 'Group not found.' });

    const username = normalizeUsername(payload.username);
    const userKey = normalizeUserKey(username);
    const text = normalizeText(payload.text, MAX_STREAM_CHAT_TEXT);
    if (!username || !userKey || !text) {
      return jsonResponse(400, { error: 'username and text are required.' });
    }
    if (!group.members.includes(userKey)) {
      return jsonResponse(403, { error: 'You are not a member of this group.' });
    }

    const message = {
      id: genId('grpmsg'),
      from: username,
      fromKey: userKey,
      to: groupId,
      text,
      createdAt: now,
      fromUserId: normalizeUserId(payload.userId),
      titleTag: normalizeText(payload.titleTag, 28),
      chatNameColor: normalizeText(payload.chatNameColor, 12)
    };

    group.messages = Array.isArray(group.messages) ? group.messages : [];
    group.messages.push(message);
    group.messages = group.messages.slice(-MAX_GROUP_MESSAGES);
    state.groups[groupId] = group;

    try {
      await persist();
    } catch (err) {
      return jsonResponse(500, { error: 'Failed to send group message.' });
    }

    return jsonResponse(200, {
      ok: true,
      message
    });
  }

  if (action === 'group_messages') {
    const groupId = normalizeGroupId(payload.groupId || event.queryStringParameters?.groupId);
    const group = state.groups[groupId];
    if (!group) return jsonResponse(404, { error: 'Group not found.' });

    const username = normalizeUsername(payload.username || event.queryStringParameters?.username);
    const userKey = normalizeUserKey(username);
    if (!userKey || !group.members.includes(userKey)) {
      return jsonResponse(403, { error: 'Not allowed for this group.' });
    }

    const limit = clamp(Number(payload.limit || event.queryStringParameters?.limit) || 120, 1, MAX_GROUP_MESSAGES);
    return jsonResponse(200, {
      ok: true,
      group: {
        id: group.id,
        name: group.name,
        owner: group.owner,
        memberCount: group.members.length
      },
      messages: (group.messages || []).slice(-limit)
    });
  }

  return jsonResponse(400, { error: 'Unknown action.' });
};
