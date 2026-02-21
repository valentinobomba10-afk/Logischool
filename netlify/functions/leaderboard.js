const STORE_NAME = 'logischool';
const LEADERBOARD_KEY = 'leaderboard-v1';
const TIMER_KEY = 'update-v2-target';
const TIMERS_KEY = 'custom-timers-v1';
const MODERATION_KEY = 'leaderboard-moderation-v1';
const TIMER_PROFILE = 'editable-release-v1';
const MAIN_TIMER_ID = 'update-release';
const MAIN_TIMER_LABEL = 'Update 2.00 Release';

const UPDATE_RELEASE_DELAY_MS = 1 * 60 * 60 * 1000;
const UPDATE_MAX_AHEAD_MS = 365 * 24 * 60 * 60 * 1000;
const TIMER_MAX_COUNT = 60;

const MAX_ENTRIES = 300;
const PUBLIC_MAX_LIMIT = 100;
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

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const normalizeName = (name) => {
  if (!name) return '';
  return String(name).trim().slice(0, 18);
};

const normalizeId = (id) => {
  if (!id) return '';
  return String(id).trim().slice(0, 80);
};

const normalizePoints = (points) => {
  const n = Number(points);
  if (!Number.isFinite(n)) return NaN;
  return Math.max(0, Math.round(n));
};

const makeFallbackId = (username) =>
  `u_${String(username || '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, 32)}`;

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

const contextDebug = () => ({
  hasBlobsModule: !!blobsModule,
  hasConnectLambda: !!(blobsModule && typeof blobsModule.connectLambda === 'function'),
  hasGetStore: !!(blobsModule && typeof blobsModule.getStore === 'function'),
  hasBlobsContextVar: !!process.env.NETLIFY_BLOBS_CONTEXT,
  hasGlobalBlobsContext: !!globalThis.netlifyBlobsContext
});

const sortEntries = (entries) =>
  entries.slice().sort((a, b) => {
    const pointsDiff = (b.points || 0) - (a.points || 0);
    if (pointsDiff !== 0) return pointsDiff;
    return String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''));
  });

const normalizeAnnouncement = (rawAnnouncement, now) => {
  if (!rawAnnouncement || typeof rawAnnouncement !== 'object') return null;
  const message = String(rawAnnouncement.message || '')
    .trim()
    .slice(0, 320);
  const expiresAt = Number(rawAnnouncement.expiresAt);
  if (!message || !Number.isFinite(expiresAt) || expiresAt <= now) return null;
  const id = String(rawAnnouncement.id || `ann_${expiresAt}`)
    .trim()
    .slice(0, 80);
  if (!id) return null;
  return {
    id,
    message,
    expiresAt,
    createdAt: rawAnnouncement.createdAt || new Date(now).toISOString(),
    createdBy: normalizeName(rawAnnouncement.createdBy || 'Admin') || 'Admin'
  };
};

const normalizeReactionKey = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9:_-]/g, '')
    .slice(0, 120);

const normalizeReactionValue = (value) => {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();
  if (normalized === 'up' || normalized === 'thumbsup' || normalized === 'like') return 'up';
  if (normalized === 'down' || normalized === 'thumbsdown' || normalized === 'dislike') return 'down';
  return '';
};

const getReactionKeyFromIdentity = (id, username) => {
  const normalizedId = normalizeId(id);
  if (normalizedId) return `id:${normalizedId}`;
  const normalizedName = normalizeName(username).toLowerCase();
  if (normalizedName) return `name:${normalizedName}`;
  return '';
};

const buildAnnouncementPayload = (announcement, announcementVotes = {}, reactionKey = '') => {
  if (!announcement) return null;
  let up = 0;
  let down = 0;
  if (announcementVotes && typeof announcementVotes === 'object') {
    Object.keys(announcementVotes)
      .slice(0, 20000)
      .forEach((key) => {
        const reaction = normalizeReactionValue(announcementVotes[key]);
        if (reaction === 'up') up += 1;
        if (reaction === 'down') down += 1;
      });
  }
  const payload = {
    ...announcement,
    reactions: {
      up,
      down,
      total: up + down
    }
  };
  const key = normalizeReactionKey(reactionKey);
  if (key) {
    const userReaction = normalizeReactionValue(announcementVotes?.[key]);
    if (userReaction) payload.userReaction = userReaction;
  }
  return payload;
};

const normalizeModerationState = (rawState, now) => {
  const state = rawState && typeof rawState === 'object' ? rawState : {};

  const bannedIds = {};
  if (state.bannedIds && typeof state.bannedIds === 'object') {
    Object.keys(state.bannedIds).forEach((key) => {
      const id = normalizeId(key);
      if (id && state.bannedIds[key]) bannedIds[id] = true;
    });
  }

  const bannedNames = {};
  if (state.bannedNames && typeof state.bannedNames === 'object') {
    Object.keys(state.bannedNames).forEach((key) => {
      const lower = normalizeName(key).toLowerCase();
      if (lower && state.bannedNames[key]) bannedNames[lower] = true;
    });
  }

  const kickedById = {};
  if (state.kickedById && typeof state.kickedById === 'object') {
    Object.keys(state.kickedById).forEach((key) => {
      const id = normalizeId(key);
      const until = Number(state.kickedById[key]);
      if (id && Number.isFinite(until) && until > now) kickedById[id] = until;
    });
  }

  const kickedByName = {};
  if (state.kickedByName && typeof state.kickedByName === 'object') {
    Object.keys(state.kickedByName).forEach((key) => {
      const lower = normalizeName(key).toLowerCase();
      const until = Number(state.kickedByName[key]);
      if (lower && Number.isFinite(until) && until > now) kickedByName[lower] = until;
    });
  }

  const announcement = normalizeAnnouncement(state.announcement, now);
  const announcementVotes = {};
  if (announcement && state.announcementVotes && typeof state.announcementVotes === 'object') {
    Object.keys(state.announcementVotes)
      .slice(0, 20000)
      .forEach((key) => {
        const normalizedKey = normalizeReactionKey(key);
        if (!normalizedKey) return;
        const reaction = normalizeReactionValue(state.announcementVotes[key]);
        if (!reaction) return;
        announcementVotes[normalizedKey] = reaction;
      });
  }

  return {
    bannedIds,
    bannedNames,
    kickedById,
    kickedByName,
    announcement,
    announcementVotes,
    updatedAt: new Date(now).toISOString()
  };
};

const getBlockStatus = (player, moderation, now) => {
  const id = normalizeId(player?.id);
  const username = normalizeName(player?.username);
  const lower = username.toLowerCase();

  if ((id && moderation.bannedIds[id]) || (lower && moderation.bannedNames[lower])) {
    return {
      code: 'BANNED',
      message: 'You are banned from global leaderboard sync.'
    };
  }

  const kickedUntil = Math.max(
    Number((id && moderation.kickedById[id]) || 0),
    Number((lower && moderation.kickedByName[lower]) || 0)
  );

  if (Number.isFinite(kickedUntil) && kickedUntil > now) {
    return {
      code: 'KICKED',
      message: `You are kicked until ${new Date(kickedUntil).toLocaleString()}.`,
      until: kickedUntil
    };
  }

  return null;
};

const buildPublicEntry = (entry) => ({
  username: normalizeName(entry.username) || 'Player',
  points: normalizePoints(entry.points) || 0,
  tier: String(entry.tier || '').slice(0, 32),
  avatarUrl: String(entry.avatarUrl || '').slice(0, 500),
  avatarPreset: String(entry.avatarPreset || '').slice(0, 40),
  updatedAt: entry.updatedAt || null
});

const buildAdminEntry = (entry, moderation, now) => {
  const id = normalizeId(entry.id);
  const username = normalizeName(entry.username);
  const lower = username.toLowerCase();
  const banned = Boolean((id && moderation.bannedIds[id]) || (lower && moderation.bannedNames[lower]));
  const kickedUntil = Math.max(
    Number((id && moderation.kickedById[id]) || 0),
    Number((lower && moderation.kickedByName[lower]) || 0)
  );

  return {
    id,
    username,
    points: normalizePoints(entry.points) || 0,
    tier: String(entry.tier || '').slice(0, 32),
    avatarUrl: String(entry.avatarUrl || '').slice(0, 500),
    avatarPreset: String(entry.avatarPreset || '').slice(0, 40),
    updatedAt: entry.updatedAt || null,
    banned,
    kickedUntil: Number.isFinite(kickedUntil) && kickedUntil > now ? kickedUntil : 0
  };
};

const parseTarget = (payload) => {
  const rawTarget = String(payload?.target || '')
    .trim()
    .slice(0, 80);
  const targetId = normalizeId(payload?.targetId || (rawTarget.startsWith('u_') ? rawTarget : ''));
  const targetName = normalizeName(payload?.targetUsername || rawTarget);
  return {
    targetId,
    targetName,
    targetNameLower: targetName.toLowerCase()
  };
};

const MAIN_TIMER_ALIASES = new Set([MAIN_TIMER_ID, 'update', 'update2', 'update-release', 'release']);

const normalizeTimerId = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

const normalizeTimerLabel = (value, fallback = '') => {
  const label = String(value || '')
    .trim()
    .slice(0, 64);
  if (label) return label;
  return String(fallback || '').trim().slice(0, 64);
};

const normalizeStoredTimerTarget = (value) => {
  const target = Number(value);
  if (!Number.isFinite(target) || target <= 0) return NaN;
  return Math.round(target);
};

const parseTimerTargetFromPayload = (payload, now) => {
  const rawTarget = payload?.target;

  if (Number.isFinite(Number(rawTarget))) {
    const targetFromNumber = normalizeStoredTimerTarget(Number(rawTarget));
    if (Number.isFinite(targetFromNumber)) return targetFromNumber;
  }

  if (typeof rawTarget === 'string') {
    const parsedDate = Date.parse(rawTarget);
    const targetFromDate = normalizeStoredTimerTarget(parsedDate);
    if (Number.isFinite(targetFromDate)) return targetFromDate;
  }

  const rawMinutes = payload?.minutesFromNow ?? payload?.minutes;
  const minutes = Math.round(Number(rawMinutes) || 0);
  if (minutes > 0) {
    const fromNow = now + minutes * 60 * 1000;
    const targetFromMinutes = normalizeStoredTimerTarget(fromNow);
    if (Number.isFinite(targetFromMinutes)) return targetFromMinutes;
  }

  return NaN;
};

const ensureMainTimer = (rawTimer, now) => {
  const timer = rawTimer && typeof rawTimer === 'object' ? rawTimer : {};
  const storedTarget = normalizeStoredTimerTarget(timer.target);
  const profile = String(timer.profile || '').trim();
  const shouldReset =
    profile !== TIMER_PROFILE ||
    !Number.isFinite(storedTarget) ||
    storedTarget - now > UPDATE_MAX_AHEAD_MS;

  const target = shouldReset ? now + UPDATE_RELEASE_DELAY_MS : storedTarget;

  return {
    id: MAIN_TIMER_ID,
    label: MAIN_TIMER_LABEL,
    target,
    createdAt: timer.createdAt || new Date(now).toISOString(),
    updatedAt: new Date(now).toISOString(),
    createdBy: normalizeName(timer.createdBy || 'System') || 'System',
    version: '2.00',
    profile: TIMER_PROFILE,
    isMain: true
  };
};

const toMainTimerStore = (mainTimer) => ({
  target: normalizeStoredTimerTarget(mainTimer?.target),
  createdAt: mainTimer?.createdAt || new Date().toISOString(),
  updatedAt: mainTimer?.updatedAt || new Date().toISOString(),
  createdBy: normalizeName(mainTimer?.createdBy || 'System') || 'System',
  version: '2.00',
  profile: TIMER_PROFILE
});

const normalizeCustomTimersState = (rawState, now) => {
  const state = rawState && typeof rawState === 'object' ? rawState : {};
  const rawTimers = state.timers && typeof state.timers === 'object' ? state.timers : {};
  const timers = {};

  Object.keys(rawTimers)
    .slice(0, TIMER_MAX_COUNT * 2)
    .forEach((key) => {
      const timerId = normalizeTimerId(key);
      if (!timerId || MAIN_TIMER_ALIASES.has(timerId)) return;
      const rawTimer = rawTimers[key];
      if (!rawTimer || typeof rawTimer !== 'object') return;
      const target = normalizeStoredTimerTarget(rawTimer.target);
      if (!Number.isFinite(target) || target - now > UPDATE_MAX_AHEAD_MS) return;
      timers[timerId] = {
        id: timerId,
        label: normalizeTimerLabel(rawTimer.label, timerId),
        target,
        createdAt: rawTimer.createdAt || new Date(now).toISOString(),
        updatedAt: rawTimer.updatedAt || new Date(now).toISOString(),
        createdBy: normalizeName(rawTimer.createdBy || 'Admin') || 'Admin',
        isMain: false
      };
    });

  return {
    timers,
    updatedAt: new Date(now).toISOString()
  };
};

const toCustomTimersStore = (timersState, nowISO) => {
  const source = timersState && typeof timersState === 'object' ? timersState.timers : {};
  const timerIds = Object.keys(source)
    .map((key) => normalizeTimerId(key))
    .filter((id) => id && !MAIN_TIMER_ALIASES.has(id))
    .slice(0, TIMER_MAX_COUNT);
  const timers = {};

  timerIds.forEach((id) => {
    const row = source[id] || {};
    const target = normalizeStoredTimerTarget(row.target);
    if (!Number.isFinite(target)) return;
    timers[id] = {
      label: normalizeTimerLabel(row.label, id),
      target,
      createdAt: row.createdAt || nowISO,
      updatedAt: row.updatedAt || nowISO,
      createdBy: normalizeName(row.createdBy || 'Admin') || 'Admin'
    };
  });

  return {
    timers,
    updatedAt: nowISO
  };
};

const buildTimersList = (mainTimer, timersState) => {
  const items = [];
  if (mainTimer && Number.isFinite(Number(mainTimer.target))) {
    items.push({
      id: MAIN_TIMER_ID,
      label: MAIN_TIMER_LABEL,
      target: normalizeStoredTimerTarget(mainTimer.target),
      createdAt: mainTimer.createdAt || null,
      updatedAt: mainTimer.updatedAt || null,
      createdBy: normalizeName(mainTimer.createdBy || 'System') || 'System',
      isMain: true
    });
  }

  const rawCustom = timersState && typeof timersState === 'object' ? timersState.timers : {};
  Object.keys(rawCustom).forEach((id) => {
    const timerId = normalizeTimerId(id);
    if (!timerId || MAIN_TIMER_ALIASES.has(timerId)) return;
    const row = rawCustom[id];
    const target = normalizeStoredTimerTarget(row?.target);
    if (!Number.isFinite(target)) return;
    items.push({
      id: timerId,
      label: normalizeTimerLabel(row?.label, timerId),
      target,
      createdAt: row?.createdAt || null,
      updatedAt: row?.updatedAt || null,
      createdBy: normalizeName(row?.createdBy || 'Admin') || 'Admin',
      isMain: false
    });
  });

  return items.sort((a, b) => {
    const targetDiff = Number(a.target || 0) - Number(b.target || 0);
    if (targetDiff !== 0) return targetDiff;
    if (a.isMain !== b.isMain) return a.isMain ? -1 : 1;
    return String(a.id || '').localeCompare(String(b.id || ''));
  });
};

const isMainTimerId = (value) => {
  const timerId = normalizeTimerId(value);
  if (!timerId) return true;
  return MAIN_TIMER_ALIASES.has(timerId);
};

const findEntryIndex = (entries, target) =>
  entries.findIndex((entry) => {
    const entryId = normalizeId(entry.id);
    const entryLower = normalizeName(entry.username).toLowerCase();
    if (target.targetId && entryId === target.targetId) return true;
    if (target.targetNameLower && entryLower === target.targetNameLower) return true;
    return false;
  });

const ensureLeaderboardData = (rawData) => {
  const entries = Array.isArray(rawData?.entries) ? rawData.entries : [];
  return {
    entries,
    updatedAt: rawData?.updatedAt || null
  };
};

const saveLeaderboard = async (store, entries, nowISO) => {
  const trimmed = sortEntries(entries).slice(0, MAX_ENTRIES);
  await writeJSON(store, LEADERBOARD_KEY, { entries: trimmed, updatedAt: nowISO });
  return trimmed;
};

const saveModeration = async (store, moderation) => {
  await writeJSON(store, MODERATION_KEY, moderation);
};

const adminError = (statusCode, error, announcement = null) =>
  jsonResponse(statusCode, {
    error,
    announcement
  });

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return emptyResponse(204);
  }

  const resource = String(event.queryStringParameters?.resource || '')
    .trim()
    .toLowerCase();
  const store = getStore(event);

  if (event.httpMethod === 'GET' && (resource === 'health' || resource === 'debug')) {
    return jsonResponse(200, {
      ok: !!store,
      configured: !!store,
      debug: contextDebug()
    });
  }

  if (!store) {
    return jsonResponse(503, {
      error: 'Global leaderboard storage unavailable',
      code: 'STORAGE_UNAVAILABLE',
      debug: contextDebug()
    });
  }

  if (resource === 'admin') {
    if (event.httpMethod !== 'POST') {
      return jsonResponse(405, { error: 'Method not allowed' });
    }

    let payload;
    try {
      payload = JSON.parse(event.body || '{}');
    } catch (err) {
      return jsonResponse(400, { error: 'Invalid JSON' });
    }

    if (String(payload?.adminCode || '') !== ADMIN_CODE) {
      return jsonResponse(403, { error: 'Invalid admin code' });
    }

    const now = Date.now();
    const nowISO = new Date(now).toISOString();

    let leaderboardData;
    let moderation;
    let mainTimer;
    let timersState;
    try {
      leaderboardData = ensureLeaderboardData(await readJSON(store, LEADERBOARD_KEY));
      moderation = normalizeModerationState(await readJSON(store, MODERATION_KEY), now);
      mainTimer = ensureMainTimer(await readJSON(store, TIMER_KEY), now);
      timersState = normalizeCustomTimersState(await readJSON(store, TIMERS_KEY), now);
    } catch (err) {
      return jsonResponse(500, { error: 'Failed to load admin data' });
    }

    const entries = Array.isArray(leaderboardData.entries) ? leaderboardData.entries : [];
    const action = String(payload?.action || 'status')
      .trim()
      .toLowerCase();

    const responsePayload = () => ({
      ok: true,
      action,
      announcement: buildAnnouncementPayload(moderation.announcement, moderation.announcementVotes),
      moderation,
      timers: buildTimersList(mainTimer, timersState),
      entries: sortEntries(entries).map((entry) => buildAdminEntry(entry, moderation, now)),
      updatedAt: nowISO
    });

    if (action === 'status') {
      try {
        await saveModeration(store, moderation);
        await writeJSON(store, TIMER_KEY, toMainTimerStore(mainTimer));
        await writeJSON(store, TIMERS_KEY, toCustomTimersStore(timersState, nowISO));
      } catch (err) {
        // continue returning status
      }
      return jsonResponse(200, responsePayload());
    }

    const target = parseTarget(payload);
    const targetIndex = findEntryIndex(entries, target);
    const targetEntry = targetIndex >= 0 ? entries[targetIndex] : null;

    if (action === 'set_announcement') {
      const message = String(payload?.message || '')
        .trim()
        .slice(0, 320);
      const minutes = clamp(Math.round(Number(payload?.minutes) || 30), 1, 1440);
      const createdBy = normalizeName(payload?.adminUsername || 'Admin') || 'Admin';
      if (!message) {
        return adminError(400, 'Announcement message is required.', moderation.announcement);
      }
      moderation.announcement = {
        id: `ann_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
        message,
        expiresAt: now + minutes * 60 * 1000,
        createdAt: nowISO,
        createdBy
      };
      moderation.announcementVotes = {};
    } else if (action === 'clear_announcement') {
      moderation.announcement = null;
      moderation.announcementVotes = {};
    } else if (action === 'set_timer_one_hour') {
      mainTimer.target = now + UPDATE_RELEASE_DELAY_MS;
      mainTimer.updatedAt = nowISO;
      mainTimer.createdBy = normalizeName(payload?.adminUsername || 'Admin') || 'Admin';
    } else if (action === 'set_timer') {
      const requestedId = normalizeTimerId(payload?.timerId || payload?.id || payload?.name || '');
      if (!requestedId) {
        return adminError(400, 'Timer ID is required.', moderation.announcement);
      }
      const targetFromPayload = parseTimerTargetFromPayload(payload, now);
      if (!Number.isFinite(targetFromPayload) || targetFromPayload - now > UPDATE_MAX_AHEAD_MS) {
        return adminError(400, 'Timer target is invalid or too far in the future.', moderation.announcement);
      }
      const createdBy = normalizeName(payload?.adminUsername || 'Admin') || 'Admin';

      if (isMainTimerId(requestedId)) {
        mainTimer.target = targetFromPayload;
        mainTimer.updatedAt = nowISO;
        mainTimer.createdBy = createdBy;
      } else {
        const existingTimer = timersState.timers[requestedId] || {};
        timersState.timers[requestedId] = {
          id: requestedId,
          label: normalizeTimerLabel(payload?.label, existingTimer.label || requestedId),
          target: targetFromPayload,
          createdAt: existingTimer.createdAt || nowISO,
          updatedAt: nowISO,
          createdBy: existingTimer.createdBy || createdBy,
          isMain: false
        };
      }
    } else if (action === 'delete_timer') {
      const requestedId = normalizeTimerId(payload?.timerId || payload?.id || payload?.name || '');
      if (!requestedId) {
        return adminError(400, 'Timer ID is required.', moderation.announcement);
      }
      if (isMainTimerId(requestedId)) {
        return adminError(400, 'Main update timer cannot be deleted. Update it instead.', moderation.announcement);
      }
      if (!timersState.timers[requestedId]) {
        return adminError(404, 'Timer not found.', moderation.announcement);
      }
      delete timersState.timers[requestedId];
    } else if (action === 'give_points') {
      const delta = Math.round(Number(payload?.pointsDelta) || 0);
      if (!targetEntry) {
        return adminError(404, 'Target player was not found.', moderation.announcement);
      }
      if (!delta) {
        return adminError(400, 'Points delta cannot be zero.', moderation.announcement);
      }
      targetEntry.points = Math.max(0, (normalizePoints(targetEntry.points) || 0) + delta);
      targetEntry.updatedAt = nowISO;
    } else if (action === 'give_points_all') {
      const delta = Math.round(Number(payload?.pointsDelta) || 0);
      if (!delta) {
        return adminError(400, 'Points delta cannot be zero.', moderation.announcement);
      }
      entries.forEach((entry) => {
        entry.points = Math.max(0, (normalizePoints(entry.points) || 0) + delta);
        entry.updatedAt = nowISO;
      });
    } else if (action === 'kick_player') {
      const minutes = clamp(Math.round(Number(payload?.minutes) || 15), 1, 1440);
      const kickUntil = now + minutes * 60 * 1000;
      const kickId = normalizeId(targetEntry?.id || target.targetId);
      const kickNameLower = normalizeName(targetEntry?.username || target.targetName).toLowerCase();
      if (!kickId && !kickNameLower) {
        return adminError(400, 'Target player is required for kick.', moderation.announcement);
      }
      if (kickId) moderation.kickedById[kickId] = kickUntil;
      if (kickNameLower) moderation.kickedByName[kickNameLower] = kickUntil;
    } else if (action === 'ban_player') {
      const banId = normalizeId(targetEntry?.id || target.targetId);
      const banNameLower = normalizeName(targetEntry?.username || target.targetName).toLowerCase();
      if (!banId && !banNameLower) {
        return adminError(400, 'Target player is required for ban.', moderation.announcement);
      }
      if (banId) {
        moderation.bannedIds[banId] = true;
        delete moderation.kickedById[banId];
      }
      if (banNameLower) {
        moderation.bannedNames[banNameLower] = true;
        delete moderation.kickedByName[banNameLower];
      }
      if (targetIndex >= 0) {
        entries.splice(targetIndex, 1);
      }
    } else if (action === 'unban_player') {
      const unbanId = normalizeId(targetEntry?.id || target.targetId);
      const unbanNameLower = normalizeName(targetEntry?.username || target.targetName).toLowerCase();
      if (!unbanId && !unbanNameLower) {
        return adminError(400, 'Target player is required for unban.', moderation.announcement);
      }
      if (unbanId) {
        delete moderation.bannedIds[unbanId];
        delete moderation.kickedById[unbanId];
      }
      if (unbanNameLower) {
        delete moderation.bannedNames[unbanNameLower];
        delete moderation.kickedByName[unbanNameLower];
      }
    } else if (action === 'remove_player') {
      if (targetIndex < 0) {
        return adminError(404, 'Target player was not found.', moderation.announcement);
      }
      entries.splice(targetIndex, 1);
    } else {
      return adminError(400, 'Unknown admin action.', moderation.announcement);
    }

    moderation.updatedAt = nowISO;
    timersState.updatedAt = nowISO;
    mainTimer.updatedAt = mainTimer.updatedAt || nowISO;

    try {
      await saveLeaderboard(store, entries, nowISO);
      await saveModeration(store, moderation);
      await writeJSON(store, TIMER_KEY, toMainTimerStore(mainTimer));
      await writeJSON(store, TIMERS_KEY, toCustomTimersStore(timersState, nowISO));
    } catch (err) {
      return adminError(500, 'Failed to save admin action.', moderation.announcement);
    }

    return jsonResponse(200, responsePayload());
  }

  if (resource === 'announcement-reaction') {
    if (event.httpMethod !== 'POST') {
      return jsonResponse(405, { error: 'Method not allowed' });
    }

    let payload;
    try {
      payload = JSON.parse(event.body || '{}');
    } catch (err) {
      return jsonResponse(400, { error: 'Invalid JSON' });
    }

    const now = Date.now();
    const nowISO = new Date(now).toISOString();
    let moderation;
    try {
      moderation = normalizeModerationState(await readJSON(store, MODERATION_KEY), now);
    } catch (err) {
      return jsonResponse(500, { error: 'Failed to load announcement data' });
    }

    const reactionKey = getReactionKeyFromIdentity(
      payload?.userId || payload?.playerId || payload?.id || '',
      payload?.username || payload?.playerName || ''
    );
    if (!reactionKey) {
      return jsonResponse(400, { error: 'userId or username is required.' });
    }

    if (!moderation.announcement) {
      moderation.announcementVotes = {};
      return jsonResponse(409, {
        error: 'No active announcement.',
        announcement: null
      });
    }

    const activeAnnouncement = moderation.announcement;
    const requestedAnnouncementId = String(payload?.announcementId || '')
      .trim()
      .slice(0, 80);
    if (requestedAnnouncementId && requestedAnnouncementId !== activeAnnouncement.id) {
      return jsonResponse(409, {
        error: 'Announcement changed. Refresh and try again.',
        announcement: buildAnnouncementPayload(activeAnnouncement, moderation.announcementVotes, reactionKey)
      });
    }

    const rawReaction = String(payload?.reaction || '')
      .trim()
      .toLowerCase();
    const reaction = normalizeReactionValue(rawReaction);
    const clearReaction = !rawReaction || rawReaction === 'clear' || rawReaction === 'none' || rawReaction === 'unset';
    if (!clearReaction && !reaction) {
      return jsonResponse(400, { error: 'Reaction must be "up", "down", or "clear".' });
    }

    if (clearReaction) {
      delete moderation.announcementVotes[reactionKey];
    } else {
      moderation.announcementVotes[reactionKey] = reaction;
    }
    moderation.updatedAt = nowISO;

    try {
      await saveModeration(store, moderation);
    } catch (err) {
      return jsonResponse(500, { error: 'Failed to save reaction.' });
    }

    return jsonResponse(200, {
      ok: true,
      announcement: buildAnnouncementPayload(moderation.announcement, moderation.announcementVotes, reactionKey)
    });
  }

  if (event.httpMethod === 'GET') {
    if (resource === 'timer' || resource === 'update' || resource === 'update2') {
      const now = Date.now();
      let mainTimerRaw = {};
      let customTimersRaw = {};
      try {
        mainTimerRaw = (await readJSON(store, TIMER_KEY)) || {};
        customTimersRaw = (await readJSON(store, TIMERS_KEY)) || {};
      } catch (err) {
        mainTimerRaw = {};
        customTimersRaw = {};
      }

      const mainTimer = ensureMainTimer(mainTimerRaw, now);
      const timersState = normalizeCustomTimersState(customTimersRaw, now);
      const timers = buildTimersList(mainTimer, timersState);
      const requestedTimerId = normalizeTimerId(
        event.queryStringParameters?.timerId || event.queryStringParameters?.id || ''
      );
      const shouldList = ['1', 'true', 'all', 'yes'].includes(
        String(event.queryStringParameters?.list || '')
          .trim()
          .toLowerCase()
      );

      const selectedTimer = shouldList
        ? null
        : isMainTimerId(requestedTimerId)
          ? timers.find((item) => item.isMain) || null
          : timers.find((item) => item.id === requestedTimerId) || null;

      try {
        await writeJSON(store, TIMER_KEY, toMainTimerStore(mainTimer));
        await writeJSON(store, TIMERS_KEY, toCustomTimersStore(timersState, new Date(now).toISOString()));
      } catch (err) {
        // continue with response even if persistence fails
      }

      if (shouldList) {
        return jsonResponse(200, {
          target: mainTimer.target,
          version: '2.00',
          timers
        });
      }

      if (!selectedTimer) {
        return jsonResponse(404, {
          error: 'Timer not found',
          id: requestedTimerId || MAIN_TIMER_ID,
          target: mainTimer.target,
          version: '2.00'
        });
      }

      return jsonResponse(200, {
        id: selectedTimer.id,
        label: selectedTimer.label,
        target: selectedTimer.target,
        isMain: !!selectedTimer.isMain,
        version: '2.00'
      });
    }

    const limit = clamp(Number(event.queryStringParameters?.limit) || 10, 1, PUBLIC_MAX_LIMIT);
    const now = Date.now();
    let leaderboardData;
    let moderation;

    try {
      leaderboardData = ensureLeaderboardData(await readJSON(store, LEADERBOARD_KEY));
      moderation = normalizeModerationState(await readJSON(store, MODERATION_KEY), now);
    } catch (err) {
      return jsonResponse(500, { error: 'Failed to read leaderboard' });
    }

    const visibleEntries = sortEntries(leaderboardData.entries)
      .filter((entry) => !getBlockStatus(entry, moderation, now))
      .slice(0, limit)
      .map(buildPublicEntry);
    const reactionKey = getReactionKeyFromIdentity(
      event.queryStringParameters?.userId || event.queryStringParameters?.id || '',
      event.queryStringParameters?.username || event.queryStringParameters?.name || ''
    );

    return jsonResponse(200, {
      entries: visibleEntries,
      updatedAt: leaderboardData.updatedAt || null,
      announcement: buildAnnouncementPayload(moderation.announcement, moderation.announcementVotes, reactionKey)
    });
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

  const username = normalizeName(payload?.username);
  const points = normalizePoints(payload?.points);
  const rawId = normalizeId(payload?.id);
  const id = rawId || makeFallbackId(username);
  const tier = String(payload?.tier || '').trim().slice(0, 32);
  const avatarUrlRaw = String(payload?.avatarUrl || '').trim();
  const avatarPresetRaw = String(payload?.avatarPreset || '').trim();
  const avatarUrl = /^https?:\/\//.test(avatarUrlRaw) ? avatarUrlRaw.slice(0, 500) : '';
  const avatarPreset = avatarPresetRaw.slice(0, 40);

  if (!username || !id || !Number.isFinite(points)) {
    return jsonResponse(400, { error: 'Missing username or points' });
  }

  const now = Date.now();
  const nowISO = new Date(now).toISOString();
  let leaderboardData;
  let moderation;

  try {
    leaderboardData = ensureLeaderboardData(await readJSON(store, LEADERBOARD_KEY));
    moderation = normalizeModerationState(await readJSON(store, MODERATION_KEY), now);
  } catch (err) {
    return jsonResponse(500, { error: 'Failed to read leaderboard' });
  }

  const blocked = getBlockStatus({ id, username }, moderation, now);
  if (blocked) {
    return jsonResponse(403, {
      error: blocked.message,
      code: blocked.code,
      until: blocked.until || null,
      announcement: buildAnnouncementPayload(
        moderation.announcement,
        moderation.announcementVotes,
        getReactionKeyFromIdentity(id, username)
      )
    });
  }

  const entries = Array.isArray(leaderboardData.entries) ? leaderboardData.entries : [];
  const sameName = username.toLowerCase();
  const existingIndex = entries.findIndex(
    (entry) =>
      normalizeId(entry.id) === id || normalizeName(entry.username).toLowerCase() === sameName
  );

  const nextEntry = {
    id,
    username,
    points,
    tier,
    avatarUrl,
    avatarPreset,
    updatedAt: nowISO
  };

  if (existingIndex >= 0) {
    entries[existingIndex] = {
      ...entries[existingIndex],
      ...nextEntry
    };
  } else {
    entries.push(nextEntry);
  }

  try {
    await saveLeaderboard(store, entries, nowISO);
    await saveModeration(store, moderation);
  } catch (err) {
    return jsonResponse(500, { error: 'Failed to save leaderboard' });
  }

  return jsonResponse(200, {
    ok: true,
    entry: {
      username,
      points,
      tier
    },
    announcement: buildAnnouncementPayload(
      moderation.announcement,
      moderation.announcementVotes,
      getReactionKeyFromIdentity(id, username)
    )
  });
};
