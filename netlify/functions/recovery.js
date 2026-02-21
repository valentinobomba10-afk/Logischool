const crypto = require('crypto');

const STORE_NAME = 'logischool';
const RECOVERY_KEY = 'account-recovery-v1';

const CODE_TTL_MS = 10 * 60 * 1000;
const MIN_SEND_INTERVAL_MS = 60 * 1000;
const SEND_WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_SENDS_PER_WINDOW = 8;
const MAX_VERIFY_ATTEMPTS = 6;
const MAX_ACTIVE_CODES = 2000;

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
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
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

const getStore = (event) => {
  if (!blobsModule || typeof blobsModule.getStore !== 'function') return null;
  try {
    if (typeof blobsModule.connectLambda === 'function') {
      blobsModule.connectLambda(event);
    }
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

const normalizeUsername = (username) => String(username || '').trim().slice(0, 18);

const normalizeMethod = (method) => {
  const value = String(method || '')
    .trim()
    .toLowerCase();
  if (value === 'email' || value === 'sms') return value;
  return '';
};

const normalizeEmail = (value) => {
  const email = String(value || '')
    .trim()
    .toLowerCase()
    .slice(0, 180);
  if (!email) return '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return '';
  return email;
};

const normalizePhone = (value) => {
  let phone = String(value || '')
    .trim()
    .replace(/[\s().-]/g, '');
  if (!phone) return '';
  if (phone.startsWith('00')) {
    phone = `+${phone.slice(2)}`;
  }
  if (phone.startsWith('+')) {
    const digits = phone.slice(1).replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 15) return '';
    return `+${digits}`;
  }
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length >= 11 && digits.length <= 15) return `+${digits}`;
  return '';
};

const normalizeDestination = (method, destination) => {
  if (method === 'email') return normalizeEmail(destination);
  if (method === 'sms') return normalizePhone(destination);
  return '';
};

const maskEmail = (email) => {
  const normalized = normalizeEmail(email);
  if (!normalized) return '';
  const parts = normalized.split('@');
  const local = parts[0] || '';
  const domain = parts[1] || '';
  const maskedLocal =
    local.length <= 2
      ? `${local.slice(0, 1)}*`
      : `${local.slice(0, 1)}${'*'.repeat(Math.min(6, local.length - 2))}${local.slice(-1)}`;
  const domainParts = domain.split('.');
  const domainName = domainParts.shift() || '';
  const tld = domainParts.join('.') || '';
  const maskedDomain = domainName
    ? `${domainName.slice(0, 1)}${'*'.repeat(Math.max(1, Math.min(6, domainName.length - 1)))}`
    : '***';
  return tld ? `${maskedLocal}@${maskedDomain}.${tld}` : `${maskedLocal}@${maskedDomain}`;
};

const maskPhone = (phone) => {
  const normalized = normalizePhone(phone);
  if (!normalized) return '';
  const digits = normalized.replace(/\D/g, '');
  const tail = digits.slice(-2);
  const hiddenCount = Math.max(0, digits.length - 2);
  return `+${'*'.repeat(hiddenCount)}${tail}`;
};

const maskDestination = (method, destination) => {
  if (method === 'email') return maskEmail(destination);
  if (method === 'sms') return maskPhone(destination);
  return '';
};

const safeKeyPart = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9@+._-]/g, '')
    .slice(0, 200);

const makeEntryKey = (username, method, destination) => {
  const name = safeKeyPart(username);
  const mode = safeKeyPart(method);
  const dest = safeKeyPart(destination);
  return `${name}|${mode}|${dest}`;
};

const makeHistoryKey = (method, destination) => {
  const mode = safeKeyPart(method);
  const dest = safeKeyPart(destination);
  return `${mode}|${dest}`;
};

const hashCode = (code, salt) => crypto.createHash('sha256').update(`${String(code)}:${String(salt)}`).digest('hex');

const generateCode = () => `${Math.floor(100000 + Math.random() * 900000)}`;

const normalizeState = (rawState, now) => {
  const source = rawState && typeof rawState === 'object' ? rawState : {};
  const rawEntries = source.entries && typeof source.entries === 'object' ? source.entries : {};
  const rawHistory = source.history && typeof source.history === 'object' ? source.history : {};

  const entries = {};
  Object.keys(rawEntries)
    .slice(0, MAX_ACTIVE_CODES * 2)
    .forEach((key) => {
      const row = rawEntries[key];
      if (!row || typeof row !== 'object') return;
      const username = normalizeUsername(row.username);
      const method = normalizeMethod(row.method);
      const destination = normalizeDestination(method, row.destination);
      const expiresAt = Math.round(Number(row.expiresAt) || 0);
      const attempts = Math.max(0, Math.round(Number(row.attempts) || 0));
      const salt = String(row.salt || '').trim().slice(0, 64);
      const codeHash = String(row.codeHash || '').trim().slice(0, 128);

      if (!username || !method || !destination || !expiresAt || expiresAt <= now) return;
      if (!salt || !codeHash || attempts >= MAX_VERIFY_ATTEMPTS) return;

      const normalizedKey = makeEntryKey(username, method, destination);
      entries[normalizedKey] = {
        username,
        method,
        destination,
        expiresAt,
        attempts,
        salt,
        codeHash,
        createdAt: row.createdAt || new Date(now).toISOString(),
        updatedAt: row.updatedAt || new Date(now).toISOString()
      };
    });

  const history = {};
  Object.keys(rawHistory)
    .slice(0, MAX_ACTIVE_CODES * 2)
    .forEach((key) => {
      const row = rawHistory[key];
      if (!row || typeof row !== 'object') return;
      const windowStart = Math.round(Number(row.windowStart) || 0);
      const lastSentAt = Math.round(Number(row.lastSentAt) || 0);
      let count = Math.max(0, Math.round(Number(row.count) || 0));
      if (!windowStart || now - windowStart > SEND_WINDOW_MS) {
        count = 0;
      }
      if (count <= 0 && (!lastSentAt || now - lastSentAt > SEND_WINDOW_MS)) return;
      history[safeKeyPart(key)] = {
        windowStart: windowStart && now - windowStart <= SEND_WINDOW_MS ? windowStart : now,
        lastSentAt,
        count
      };
    });

  return {
    entries,
    history,
    updatedAt: new Date(now).toISOString()
  };
};

const toStorableState = (state, nowISO) => ({
  entries: state.entries,
  history: state.history,
  updatedAt: nowISO
});

const sendEmailCode = async (to, code) => {
  const apiKey = String(process.env.RESEND_API_KEY || '').trim();
  const from = String(process.env.RECOVERY_EMAIL_FROM || '').trim();
  if (!apiKey || !from) {
    return {
      ok: false,
      statusCode: 503,
      error: 'Email recovery is not configured yet.'
    };
  }

  const body = {
    from,
    to: [to],
    subject: 'Your LogiSchool recovery code',
    text: `Your LogiSchool verification code is ${code}. It expires in 10 minutes.`
  };

  let response;
  try {
    response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
  } catch (err) {
    return {
      ok: false,
      statusCode: 502,
      error: 'Email provider request failed.'
    };
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch (err) {
    payload = null;
  }

  if (!response.ok) {
    const msg = String(payload?.message || payload?.error || 'Email provider rejected the request.').slice(0, 160);
    return {
      ok: false,
      statusCode: response.status || 502,
      error: msg
    };
  }

  return {
    ok: true,
    providerId: String(payload?.id || '').slice(0, 80)
  };
};

const sendSmsCode = async (to, code) => {
  const sid = String(process.env.TWILIO_ACCOUNT_SID || '').trim();
  const token = String(process.env.TWILIO_AUTH_TOKEN || '').trim();
  const from = String(process.env.TWILIO_FROM_NUMBER || '').trim();
  if (!sid || !token || !from) {
    return {
      ok: false,
      statusCode: 503,
      error: 'SMS recovery is not configured yet.'
    };
  }

  const params = new URLSearchParams();
  params.set('To', to);
  params.set('From', from);
  params.set('Body', `LogiSchool code: ${code}. Expires in 10 min.`);

  const auth = Buffer.from(`${sid}:${token}`).toString('base64');

  let response;
  try {
    response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });
  } catch (err) {
    return {
      ok: false,
      statusCode: 502,
      error: 'SMS provider request failed.'
    };
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch (err) {
    payload = null;
  }

  if (!response.ok) {
    const msg = String(payload?.message || payload?.error || 'SMS provider rejected the request.').slice(0, 160);
    return {
      ok: false,
      statusCode: response.status || 502,
      error: msg
    };
  }

  return {
    ok: true,
    providerId: String(payload?.sid || '').slice(0, 80)
  };
};

const sendCode = async (method, destination, code) => {
  if (method === 'email') return sendEmailCode(destination, code);
  if (method === 'sms') return sendSmsCode(destination, code);
  return { ok: false, statusCode: 400, error: 'Unsupported recovery method.' };
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return emptyResponse(204);
  }

  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  const store = getStore(event);
  if (!store) {
    return jsonResponse(503, {
      error: 'Recovery service unavailable',
      code: 'STORAGE_UNAVAILABLE'
    });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (err) {
    return jsonResponse(400, { error: 'Invalid JSON payload' });
  }

  const action = String(payload?.action || '')
    .trim()
    .toLowerCase();

  const now = Date.now();
  const nowISO = new Date(now).toISOString();

  let state;
  try {
    state = normalizeState(await readJSON(store, RECOVERY_KEY), now);
  } catch (err) {
    return jsonResponse(500, { error: 'Failed to load recovery state' });
  }

  if (action === 'send') {
    const username = normalizeUsername(payload?.username);
    const method = normalizeMethod(payload?.method);
    const destination = normalizeDestination(method, payload?.destination);
    if (!username || !method || !destination) {
      return jsonResponse(400, { error: 'username, method, and destination are required.' });
    }

    const entryKey = makeEntryKey(username, method, destination);
    const historyKey = makeHistoryKey(method, destination);
    const history = state.history[historyKey] || { windowStart: now, lastSentAt: 0, count: 0 };

    if (history.lastSentAt && now - history.lastSentAt < MIN_SEND_INTERVAL_MS) {
      const retrySeconds = Math.ceil((MIN_SEND_INTERVAL_MS - (now - history.lastSentAt)) / 1000);
      return jsonResponse(429, {
        error: `Please wait ${retrySeconds}s before requesting another code.`
      });
    }

    let nextWindowStart = history.windowStart || now;
    let nextCount = history.count || 0;
    if (!nextWindowStart || now - nextWindowStart > SEND_WINDOW_MS) {
      nextWindowStart = now;
      nextCount = 0;
    }
    if (nextCount >= MAX_SENDS_PER_WINDOW) {
      return jsonResponse(429, {
        error: 'Too many recovery requests. Try again later.'
      });
    }

    const code = generateCode();
    const sendResult = await sendCode(method, destination, code);
    if (!sendResult.ok) {
      return jsonResponse(sendResult.statusCode || 502, {
        error: sendResult.error || 'Failed to send recovery code.'
      });
    }

    const salt = crypto.randomBytes(8).toString('hex');
    state.entries[entryKey] = {
      username,
      method,
      destination,
      expiresAt: now + CODE_TTL_MS,
      attempts: 0,
      salt,
      codeHash: hashCode(code, salt),
      createdAt: nowISO,
      updatedAt: nowISO
    };

    state.history[historyKey] = {
      windowStart: nextWindowStart,
      lastSentAt: now,
      count: nextCount + 1
    };

    const keys = Object.keys(state.entries);
    if (keys.length > MAX_ACTIVE_CODES) {
      keys
        .sort((a, b) => Number(state.entries[a]?.expiresAt || 0) - Number(state.entries[b]?.expiresAt || 0))
        .slice(0, keys.length - MAX_ACTIVE_CODES)
        .forEach((key) => {
          delete state.entries[key];
        });
    }

    state.updatedAt = nowISO;
    try {
      await writeJSON(store, RECOVERY_KEY, toStorableState(state, nowISO));
    } catch (err) {
      return jsonResponse(500, { error: 'Failed to save recovery request.' });
    }

    return jsonResponse(200, {
      ok: true,
      method,
      maskedDestination: maskDestination(method, destination),
      expiresAt: now + CODE_TTL_MS
    });
  }

  if (action === 'verify') {
    const username = normalizeUsername(payload?.username);
    const method = normalizeMethod(payload?.method);
    const destination = normalizeDestination(method, payload?.destination);
    const code = String(payload?.code || '')
      .trim()
      .slice(0, 8);

    if (!username || !method || !destination || !/^\d{6}$/.test(code)) {
      return jsonResponse(400, { error: 'username, method, destination, and a 6-digit code are required.' });
    }

    const entryKey = makeEntryKey(username, method, destination);
    const entry = state.entries[entryKey];
    if (!entry) {
      return jsonResponse(404, { error: 'Recovery code not found. Request a new code.' });
    }

    if (!Number.isFinite(Number(entry.expiresAt)) || Number(entry.expiresAt) <= now) {
      delete state.entries[entryKey];
      state.updatedAt = nowISO;
      try {
        await writeJSON(store, RECOVERY_KEY, toStorableState(state, nowISO));
      } catch (err) {
        // ignore persistence failure for expired cleanup
      }
      return jsonResponse(410, { error: 'Recovery code expired. Request a new code.' });
    }

    const expectedHash = hashCode(code, entry.salt);
    if (expectedHash !== entry.codeHash) {
      entry.attempts = Math.max(0, Number(entry.attempts) || 0) + 1;
      entry.updatedAt = nowISO;
      const attemptsLeft = Math.max(0, MAX_VERIFY_ATTEMPTS - entry.attempts);
      if (entry.attempts >= MAX_VERIFY_ATTEMPTS) {
        delete state.entries[entryKey];
      } else {
        state.entries[entryKey] = entry;
      }
      state.updatedAt = nowISO;
      try {
        await writeJSON(store, RECOVERY_KEY, toStorableState(state, nowISO));
      } catch (err) {
        return jsonResponse(500, { error: 'Failed to update verification attempts.' });
      }
      return jsonResponse(400, {
        error: attemptsLeft
          ? `Invalid code. ${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} left.`
          : 'Too many invalid attempts. Request a new code.'
      });
    }

    delete state.entries[entryKey];
    state.updatedAt = nowISO;
    try {
      await writeJSON(store, RECOVERY_KEY, toStorableState(state, nowISO));
    } catch (err) {
      return jsonResponse(500, { error: 'Failed to finalize verification.' });
    }

    return jsonResponse(200, {
      ok: true,
      verifiedAt: nowISO
    });
  }

  return jsonResponse(400, { error: 'Unknown action. Use send or verify.' });
};
