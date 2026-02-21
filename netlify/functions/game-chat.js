const STORE_NAME = 'logischool';
const CHAT_KEY = 'game-chat-v1';
const CHAT_MOD_KEY = 'game-chat-moderation-v1';
const ADMIN_CODE = 'Cabra2031';

const MAX_ROOMS = 24;
const MAX_MESSAGES_PER_ROOM = 200;
const MAX_PUBLIC_LIMIT = 120;
const MAX_MESSAGE_LENGTH = 220;
const SEND_COOLDOWN_MS = 700;
const MAX_REPORTS = 300;
const MAX_BANNED_WORDS = 80;
const MAX_MUTE_MINUTES = 60 * 24 * 30;

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

const normalizeId = (value, maxLen = 80) =>
  String(value || '')
    .trim()
    .slice(0, maxLen);

const normalizeUsername = (value) =>
  String(value || '')
    .trim()
    .slice(0, 18);

const normalizeRoom = (value) => {
  const room = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return room || 'global-games';
};

const normalizeMessageText = (value) =>
  String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_MESSAGE_LENGTH);

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

const normalizeGameId = (value) =>
  String(value || '')
    .trim()
    .slice(0, 60);

const normalizeGameName = (value) =>
  String(value || '')
    .trim()
    .slice(0, 60);

const normalizeTitleTag = (value) =>
  String(value || '')
    .trim()
    .slice(0, 28);

const normalizeChatColor = (value) => {
  const color = String(value || '')
    .trim()
    .toLowerCase();
  if (!color) return '';
  if (/^#[0-9a-f]{3}([0-9a-f]{3})?$/.test(color)) return color;
  return '';
};

const normalizeTimestamp = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return NaN;
  return Math.round(n);
};

const normalizeBannedWord = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .slice(0, 32);

const containsBannedWord = (text, bannedWords) => {
  const lower = String(text || '').toLowerCase();
  for (let i = 0; i < bannedWords.length; i += 1) {
    const word = bannedWords[i];
    if (word && lower.includes(word)) return word;
  }
  return '';
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

const normalizeMessageRecord = (raw, fallbackRoom) => {
  if (!raw || typeof raw !== 'object') return null;
  const id = normalizeId(raw.id, 80);
  const username = normalizeUsername(raw.username);
  const text = normalizeMessageText(raw.text || raw.message);
  const createdAt = normalizeTimestamp(raw.createdAt);
  if (!id || !username || !text || !Number.isFinite(createdAt)) return null;
  return {
    id,
    room: normalizeRoom(raw.room || fallbackRoom),
    userId: normalizeId(raw.userId, 80),
    username,
    text,
    createdAt,
    avatarUrl: normalizeAvatarUrl(raw.avatarUrl),
    avatarPreset: normalizeAvatarPreset(raw.avatarPreset),
    gameId: normalizeGameId(raw.gameId),
    gameName: normalizeGameName(raw.gameName),
    titleTag: normalizeTitleTag(raw.titleTag),
    chatNameColor: normalizeChatColor(raw.chatNameColor)
  };
};

const normalizeReportRecord = (raw) => {
  if (!raw || typeof raw !== 'object') return null;
  const id = normalizeId(raw.id, 90);
  const room = normalizeRoom(raw.room);
  const messageId = normalizeId(raw.messageId, 80);
  const reporterName = normalizeUsername(raw.reporterName);
  const targetUsername = normalizeUsername(raw.targetUsername);
  const reason = String(raw.reason || '')
    .trim()
    .slice(0, 160);
  const createdAt = normalizeTimestamp(raw.createdAt);
  if (!id || !room || !messageId || !reporterName || !targetUsername || !Number.isFinite(createdAt)) return null;
  return {
    id,
    room,
    messageId,
    reporterId: normalizeId(raw.reporterId, 80),
    reporterName,
    targetUserId: normalizeId(raw.targetUserId, 80),
    targetUsername,
    messageText: normalizeMessageText(raw.messageText),
    reason: reason || 'No reason provided.',
    createdAt
  };
};

const ensureChatState = (rawState, now) => {
  const state = rawState && typeof rawState === 'object' ? rawState : {};
  const rawRooms = state.rooms && typeof state.rooms === 'object' ? state.rooms : {};
  const rooms = {};

  Object.keys(rawRooms)
    .slice(0, MAX_ROOMS * 2)
    .forEach((key) => {
      const roomId = normalizeRoom(key);
      if (!roomId) return;
      const rawMessages = Array.isArray(rawRooms[key]) ? rawRooms[key] : [];
      const cleaned = rawMessages
        .map((row) => normalizeMessageRecord(row, roomId))
        .filter(Boolean)
        .sort((a, b) => a.createdAt - b.createdAt)
        .slice(-MAX_MESSAGES_PER_ROOM);
      if (cleaned.length) {
        rooms[roomId] = cleaned;
      }
    });

  return {
    rooms,
    updatedAt: new Date(now).toISOString()
  };
};

const ensureModerationState = (rawState, now) => {
  const state = rawState && typeof rawState === 'object' ? rawState : {};

  const mutedById = {};
  if (state.mutedById && typeof state.mutedById === 'object') {
    Object.keys(state.mutedById).forEach((key) => {
      const id = normalizeId(key, 80);
      const until = normalizeTimestamp(state.mutedById[key]);
      if (id && Number.isFinite(until) && until > now) mutedById[id] = until;
    });
  }

  const mutedByName = {};
  if (state.mutedByName && typeof state.mutedByName === 'object') {
    Object.keys(state.mutedByName).forEach((key) => {
      const lower = normalizeUsername(key).toLowerCase();
      const until = normalizeTimestamp(state.mutedByName[key]);
      if (lower && Number.isFinite(until) && until > now) mutedByName[lower] = until;
    });
  }

  const bannedWordsSet = new Set();
  const bannedWordsRaw = Array.isArray(state.bannedWords) ? state.bannedWords : [];
  bannedWordsRaw.slice(0, MAX_BANNED_WORDS * 2).forEach((word) => {
    const clean = normalizeBannedWord(word);
    if (clean) bannedWordsSet.add(clean);
  });
  const bannedWords = [...bannedWordsSet].slice(0, MAX_BANNED_WORDS);

  const reportsRaw = Array.isArray(state.reports) ? state.reports : [];
  const reports = reportsRaw
    .map((row) => normalizeReportRecord(row))
    .filter(Boolean)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, MAX_REPORTS);

  return {
    mutedById,
    mutedByName,
    bannedWords,
    reports,
    updatedAt: new Date(now).toISOString()
  };
};

const buildModSummary = (modState, now, includeReports = false) => {
  const muted = [];
  Object.keys(modState.mutedById).forEach((id) => {
    const until = Number(modState.mutedById[id]);
    if (Number.isFinite(until) && until > now) {
      muted.push({ target: id, type: 'id', until });
    }
  });
  Object.keys(modState.mutedByName).forEach((name) => {
    const until = Number(modState.mutedByName[name]);
    if (Number.isFinite(until) && until > now) {
      muted.push({ target: name, type: 'name', until });
    }
  });
  muted.sort((a, b) => a.until - b.until);

  return {
    muted,
    mutedCount: muted.length,
    bannedWords: modState.bannedWords.slice(0, MAX_BANNED_WORDS),
    bannedWordsCount: modState.bannedWords.length,
    reportsCount: modState.reports.length,
    reports: includeReports ? modState.reports.slice(0, 80) : undefined,
    updatedAt: modState.updatedAt
  };
};

const getMuteUntil = (userId, username, modState, now) => {
  const id = normalizeId(userId, 80);
  const lower = normalizeUsername(username).toLowerCase();
  const byId = Number((id && modState.mutedById[id]) || 0);
  const byName = Number((lower && modState.mutedByName[lower]) || 0);
  const until = Math.max(byId, byName);
  if (Number.isFinite(until) && until > now) return until;
  return 0;
};

const parseTarget = (payload) => {
  const rawTarget = String(payload?.target || '')
    .trim()
    .slice(0, 80);
  const targetId = normalizeId(payload?.targetId || (rawTarget.startsWith('u_') ? rawTarget : ''), 80);
  const targetName = normalizeUsername(payload?.targetUsername || rawTarget);
  return {
    targetId,
    targetName,
    targetNameLower: targetName.toLowerCase()
  };
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return emptyResponse(204);
  }

  const store = getStore(event);
  if (!store) {
    return jsonResponse(503, {
      error: 'Chat storage unavailable',
      code: 'STORAGE_UNAVAILABLE'
    });
  }

  const now = Date.now();
  let chatState;
  let modState;
  try {
    chatState = ensureChatState(await readJSON(store, CHAT_KEY), now);
    modState = ensureModerationState(await readJSON(store, CHAT_MOD_KEY), now);
  } catch (err) {
    return jsonResponse(500, { error: 'Failed to read chat state' });
  }

  if (event.httpMethod === 'GET') {
    const room = normalizeRoom(event.queryStringParameters?.room || 'global-games');
    const limit = clamp(Number(event.queryStringParameters?.limit) || 80, 1, MAX_PUBLIC_LIMIT);
    const since = normalizeTimestamp(event.queryStringParameters?.since);
    const userId = normalizeId(event.queryStringParameters?.userId, 80);
    const username = normalizeUsername(event.queryStringParameters?.username);
    const muteUntil = getMuteUntil(userId, username, modState, now);

    let messages = Array.isArray(chatState.rooms[room]) ? chatState.rooms[room] : [];
    if (Number.isFinite(since)) {
      messages = messages.filter((row) => row.createdAt > since);
    }
    messages = messages.slice(-limit);

    return jsonResponse(200, {
      room,
      messages,
      serverTime: now,
      mutedUntil: muteUntil || null
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

  const action = String(payload?.action || '')
    .trim()
    .toLowerCase();

  if (action === 'report_message') {
    const room = normalizeRoom(payload?.room || 'global-games');
    const messageId = normalizeId(payload?.messageId, 80);
    const reporterName = normalizeUsername(payload?.reporterName || payload?.username);
    const reporterId = normalizeId(payload?.reporterId || payload?.userId, 80);
    const reason = String(payload?.reason || '')
      .trim()
      .slice(0, 160);

    if (!room || !messageId || !reporterName) {
      return jsonResponse(400, { error: 'room, messageId, and reporterName are required.' });
    }

    const message = (chatState.rooms[room] || []).find((row) => row.id === messageId);
    if (!message) {
      return jsonResponse(404, { error: 'Message not found.' });
    }

    const report = {
      id: `rep_${Date.now()}_${Math.floor(Math.random() * 1000000)}`,
      room,
      messageId,
      reporterId,
      reporterName,
      targetUserId: message.userId || '',
      targetUsername: message.username || 'Player',
      messageText: message.text || '',
      reason: reason || 'No reason provided.',
      createdAt: now
    };

    const reportKey = `${room}:${messageId}:${reporterId || reporterName.toLowerCase()}`;
    const already = modState.reports.some(
      (row) =>
        `${row.room}:${row.messageId}:${row.reporterId || row.reporterName.toLowerCase()}` === reportKey
    );
    if (!already) {
      modState.reports.unshift(report);
      modState.reports = modState.reports.slice(0, MAX_REPORTS);
      modState.updatedAt = new Date(now).toISOString();
      try {
        await writeJSON(store, CHAT_MOD_KEY, modState);
      } catch (err) {
        return jsonResponse(500, { error: 'Failed to save report.' });
      }
    }

    return jsonResponse(200, {
      ok: true,
      reportId: report.id,
      moderation: buildModSummary(modState, now, false)
    });
  }

  if (action) {
    if (String(payload?.adminCode || '') !== ADMIN_CODE) {
      return jsonResponse(403, { error: 'Invalid admin code.' });
    }

    const mutateAndSave = async () => {
      modState.updatedAt = new Date(now).toISOString();
      await writeJSON(store, CHAT_MOD_KEY, modState);
      await writeJSON(store, CHAT_KEY, chatState);
    };

    if (action === 'status') {
      return jsonResponse(200, {
        ok: true,
        action,
        moderation: buildModSummary(modState, now, true)
      });
    }

    if (action === 'mute_user') {
      const target = parseTarget(payload);
      const minutes = clamp(Math.round(Number(payload?.minutes) || 15), 1, MAX_MUTE_MINUTES);
      const until = now + minutes * 60 * 1000;
      if (!target.targetId && !target.targetNameLower) {
        return jsonResponse(400, { error: 'Target user is required.' });
      }
      if (target.targetId) modState.mutedById[target.targetId] = until;
      if (target.targetNameLower) modState.mutedByName[target.targetNameLower] = until;
      try {
        await mutateAndSave();
      } catch (err) {
        return jsonResponse(500, { error: 'Failed to save mute.' });
      }
      return jsonResponse(200, {
        ok: true,
        action,
        moderation: buildModSummary(modState, now, true)
      });
    }

    if (action === 'unmute_user') {
      const target = parseTarget(payload);
      if (!target.targetId && !target.targetNameLower) {
        return jsonResponse(400, { error: 'Target user is required.' });
      }
      if (target.targetId) delete modState.mutedById[target.targetId];
      if (target.targetNameLower) delete modState.mutedByName[target.targetNameLower];
      try {
        await mutateAndSave();
      } catch (err) {
        return jsonResponse(500, { error: 'Failed to save unmute.' });
      }
      return jsonResponse(200, {
        ok: true,
        action,
        moderation: buildModSummary(modState, now, true)
      });
    }

    if (action === 'delete_message') {
      const room = normalizeRoom(payload?.room || 'global-games');
      const messageId = normalizeId(payload?.messageId, 80);
      if (!messageId) {
        return jsonResponse(400, { error: 'messageId is required.' });
      }
      const roomList = room ? [room] : Object.keys(chatState.rooms);
      let removed = false;
      roomList.forEach((roomId) => {
        const rows = Array.isArray(chatState.rooms[roomId]) ? chatState.rooms[roomId] : [];
        const next = rows.filter((row) => row.id !== messageId);
        if (next.length !== rows.length) {
          chatState.rooms[roomId] = next;
          removed = true;
        }
      });
      if (!removed) {
        return jsonResponse(404, { error: 'Message not found.' });
      }
      try {
        await mutateAndSave();
      } catch (err) {
        return jsonResponse(500, { error: 'Failed to delete message.' });
      }
      return jsonResponse(200, {
        ok: true,
        action,
        moderation: buildModSummary(modState, now, true)
      });
    }

    if (action === 'set_banned_words') {
      const wordsRaw = Array.isArray(payload?.words)
        ? payload.words
        : String(payload?.wordsText || payload?.words || '')
            .split(',')
            .map((word) => word.trim());
      const set = new Set();
      wordsRaw.slice(0, MAX_BANNED_WORDS * 2).forEach((word) => {
        const clean = normalizeBannedWord(word);
        if (clean) set.add(clean);
      });
      modState.bannedWords = [...set].slice(0, MAX_BANNED_WORDS);
      try {
        await mutateAndSave();
      } catch (err) {
        return jsonResponse(500, { error: 'Failed to save banned words.' });
      }
      return jsonResponse(200, {
        ok: true,
        action,
        moderation: buildModSummary(modState, now, true)
      });
    }

    if (action === 'clear_reports') {
      modState.reports = [];
      try {
        await mutateAndSave();
      } catch (err) {
        return jsonResponse(500, { error: 'Failed to clear reports.' });
      }
      return jsonResponse(200, {
        ok: true,
        action,
        moderation: buildModSummary(modState, now, true)
      });
    }

    return jsonResponse(400, { error: 'Unknown admin action.' });
  }

  const room = normalizeRoom(payload?.room || 'global-games');
  const username = normalizeUsername(payload?.username);
  const text = normalizeMessageText(payload?.message);
  const userId = normalizeId(payload?.userId || payload?.id, 80);
  const muteUntil = getMuteUntil(userId, username, modState, now);

  if (!username || !text) {
    return jsonResponse(400, { error: 'Username and message are required.' });
  }
  if (muteUntil) {
    return jsonResponse(403, {
      error: `You are muted until ${new Date(muteUntil).toLocaleString()}.`,
      code: 'MUTED',
      until: muteUntil
    });
  }

  const blockedWord = containsBannedWord(text, modState.bannedWords);
  if (blockedWord) {
    return jsonResponse(400, {
      error: `Message blocked by chat filter (${blockedWord}).`,
      code: 'BANNED_WORD'
    });
  }

  const roomIds = Object.keys(chatState.rooms);
  if (!chatState.rooms[room] && roomIds.length >= MAX_ROOMS) {
    return jsonResponse(400, { error: 'Chat room limit reached.' });
  }

  const messages = Array.isArray(chatState.rooms[room]) ? chatState.rooms[room] : [];
  const nowMs = Date.now();
  const sameUser = (row) =>
    (userId && row.userId && row.userId === userId) || row.username.toLowerCase() === username.toLowerCase();
  const latestByUser = [...messages].reverse().find(sameUser);
  if (latestByUser && nowMs - latestByUser.createdAt < SEND_COOLDOWN_MS) {
    return jsonResponse(429, { error: 'Please wait a moment before sending again.' });
  }

  const next = {
    id: `msg_${nowMs}_${Math.floor(Math.random() * 1000000)}`,
    room,
    userId,
    username,
    text,
    createdAt: nowMs,
    avatarUrl: normalizeAvatarUrl(payload?.avatarUrl),
    avatarPreset: normalizeAvatarPreset(payload?.avatarPreset),
    gameId: normalizeGameId(payload?.gameId),
    gameName: normalizeGameName(payload?.gameName),
    titleTag: normalizeTitleTag(payload?.titleTag),
    chatNameColor: normalizeChatColor(payload?.chatNameColor)
  };

  const nextMessages = [...messages, next]
    .sort((a, b) => a.createdAt - b.createdAt)
    .slice(-MAX_MESSAGES_PER_ROOM);
  chatState.rooms[room] = nextMessages;
  chatState.updatedAt = new Date(nowMs).toISOString();

  try {
    await writeJSON(store, CHAT_KEY, chatState);
  } catch (err) {
    return jsonResponse(500, { error: 'Failed to save message' });
  }

  return jsonResponse(200, {
    ok: true,
    room,
    message: next
  });
};
