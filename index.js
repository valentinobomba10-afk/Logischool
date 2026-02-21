const { onRequest } = require('firebase-functions/v2/https');

const handlers = {
  leaderboard: require('./handlers/leaderboard').handler,
  'game-chat': require('./handlers/game-chat').handler,
  tournament: require('./handlers/tournament').handler,
  'game-votes': require('./handlers/game-votes').handler,
  'rps-online': require('./handlers/rps-online').handler,
  'connect4-online': require('./handlers/connect4-online').handler,
  'click-rush-online': require('./handlers/click-rush-online').handler,
  'memory-flip-online': require('./handlers/memory-flip-online').handler,
  recovery: require('./handlers/recovery').handler,
  social: require('./handlers/social').handler
};

const toQueryParams = (query = {}) => {
  const out = {};
  Object.keys(query).forEach((key) => {
    const value = query[key];
    if (Array.isArray(value)) {
      out[key] = value.length ? String(value[0]) : '';
      return;
    }
    if (value === undefined || value === null) return;
    out[key] = String(value);
  });
  return out;
};

const getFunctionNameFromPath = (pathValue = '') => {
  const path = String(pathValue || '').split('?')[0];
  const marker = '/.netlify/functions/';
  if (path.includes(marker)) {
    const tail = path.split(marker)[1] || '';
    return tail.split('/')[0].trim();
  }
  const cleaned = path.replace(/^\/+|\/+$/g, '');
  if (cleaned && handlers[cleaned]) return cleaned;
  return '';
};

const buildEventBody = (req) => {
  if (req.rawBody && req.rawBody.length) {
    return req.rawBody.toString('utf8');
  }
  if (typeof req.body === 'string') return req.body;
  if (req.body && typeof req.body === 'object') {
    try {
      return JSON.stringify(req.body);
    } catch (err) {
      return '';
    }
  }
  return '';
};

exports.netlifyFunctions = onRequest(
  {
    cors: true,
    invoker: 'public',
    timeoutSeconds: 60,
    memory: '512MiB'
  },
  async (req, res) => {
    const fnName = getFunctionNameFromPath(req.path || req.originalUrl || req.url || '');
    const handler = handlers[fnName];

    if (!handler) {
      res.status(404).json({ error: 'Function not found', function: fnName || null });
      return;
    }

    const event = {
      httpMethod: String(req.method || 'GET').toUpperCase(),
      path: req.path || req.originalUrl || req.url || '',
      queryStringParameters: toQueryParams(req.query || {}),
      headers: req.headers || {},
      body: buildEventBody(req),
      isBase64Encoded: false
    };

    try {
      const output = await handler(event);
      const statusCode = Number(output?.statusCode || 200);
      const headers = output?.headers && typeof output.headers === 'object' ? output.headers : {};
      Object.keys(headers).forEach((key) => {
        if (headers[key] !== undefined && headers[key] !== null) {
          res.setHeader(key, String(headers[key]));
        }
      });
      const body = output?.body;
      if (statusCode === 204) {
        res.status(204).send('');
        return;
      }
      if (body === undefined || body === null) {
        res.status(statusCode).send('');
        return;
      }
      if (typeof body === 'string') {
        res.status(statusCode).send(body);
        return;
      }
      res.status(statusCode).json(body);
    } catch (err) {
      res.status(500).json({
        error: 'Function execution failed',
        function: fnName,
        message: String(err?.message || err)
      });
    }
  }
);
