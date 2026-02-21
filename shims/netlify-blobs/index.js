const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const { FieldValue } = admin.firestore;

const cleanForFirestore = (value) => {
  if (value === undefined) return null;
  if (value === null) return null;
  if (Array.isArray(value)) return value.map((item) => cleanForFirestore(item));
  if (typeof value === 'object') {
    const out = {};
    Object.keys(value).forEach((key) => {
      const next = cleanForFirestore(value[key]);
      if (next !== undefined) out[key] = next;
    });
    return out;
  }
  return value;
};

const encodeKey = (key) =>
  Buffer.from(String(key || ''), 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
    .slice(0, 1200);

const parseStoreName = (input) => {
  if (typeof input === 'string') return input.trim() || 'default';
  if (input && typeof input === 'object') {
    const fromName = String(input.name || '').trim();
    if (fromName) return fromName;
  }
  return 'default';
};

const getDocRef = (storeName, key) =>
  db
    .collection('__blobStores')
    .doc(storeName)
    .collection('keys')
    .doc(encodeKey(key));

const getStore = (input) => {
  const storeName = parseStoreName(input);
  return {
    async get(key, options = {}) {
      const snap = await getDocRef(storeName, key).get();
      if (!snap.exists) {
        throw new Error('not found');
      }
      const data = snap.data() || {};
      if (options && options.type === 'json') {
        if (data.kind === 'json') return data.value ?? null;
        if (typeof data.value === 'string') {
          try {
            return JSON.parse(data.value);
          } catch (err) {
            return null;
          }
        }
        return data.value ?? null;
      }
      if (data.kind === 'json') {
        return JSON.stringify(data.value ?? null);
      }
      return String(data.value ?? '');
    },
    async set(key, value) {
      await getDocRef(storeName, key).set({
        kind: 'text',
        value: String(value ?? ''),
        updatedAt: FieldValue.serverTimestamp()
      });
    },
    async setJSON(key, value) {
      await getDocRef(storeName, key).set({
        kind: 'json',
        value: cleanForFirestore(value),
        updatedAt: FieldValue.serverTimestamp()
      });
    }
  };
};

const connectLambda = () => {
  return null;
};

module.exports = {
  getStore,
  connectLambda
};
