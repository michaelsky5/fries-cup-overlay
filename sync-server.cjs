// sync-server.cjs
// FCUP Local / Cloud Program Sync Server - Room Version
//
// Run:
//   node sync-server.cjs
//
// Endpoints:
//   GET  /health
//   GET  /rooms
//   GET  /state?room=ROOM_ID
//   POST /state?room=ROOM_ID
//   GET  /events?room=ROOM_ID
//   POST /clear?room=ROOM_ID
//   POST /clear-all
//
// Optional env:
//   FCUP_SYNC_HOST=127.0.0.1
//   FCUP_SYNC_PORT=4140
//   FCUP_SYNC_TOKEN=your-token
//   FCUP_SYNC_MAX_BODY=52428800

const http = require('http');
const { URL } = require('url');

const HOST = process.env.FCUP_SYNC_HOST || '127.0.0.1';
const PORT = Number(process.env.FCUP_SYNC_PORT || 4140);
const AUTH_TOKEN = String(process.env.FCUP_SYNC_TOKEN || '').trim();
const MAX_BODY_BYTES = Number(process.env.FCUP_SYNC_MAX_BODY || 50 * 1024 * 1024);
const DEFAULT_ROOM = 'default';

const rooms = new Map();

const now = () => Date.now();

const safeJson = value => {
  try {
    return JSON.stringify(value);
  } catch (err) {
    return JSON.stringify({
      ok: false,
      error: 'JSON_SERIALIZE_FAILED',
      message: err?.message || String(err)
    });
  }
};

const normalizeRoomId = value => {
  const raw = String(value || DEFAULT_ROOM).trim() || DEFAULT_ROOM;
  const normalized = raw
    .replace(/[^\w.-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);

  return normalized || DEFAULT_ROOM;
};

const getRoomIdFromRequest = (req, requestUrl, bodyPayload = null) => {
  return normalizeRoomId(
    requestUrl.searchParams.get('room') ||
    requestUrl.searchParams.get('roomId') ||
    req.headers['x-fcup-room'] ||
    bodyPayload?.room ||
    bodyPayload?.roomId ||
    DEFAULT_ROOM
  );
};

const getTokenFromRequest = (req, requestUrl, bodyPayload = null) => {
  const authHeader = String(req.headers.authorization || '');
  const bearer = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : '';

  return String(
    requestUrl.searchParams.get('token') ||
    req.headers['x-fcup-token'] ||
    bearer ||
    bodyPayload?.token ||
    ''
  ).trim();
};

const isAuthorized = (req, requestUrl, bodyPayload = null) => {
  if (!AUTH_TOKEN) return true;
  return getTokenFromRequest(req, requestUrl, bodyPayload) === AUTH_TOKEN;
};

const getRoom = roomId => {
  const normalizedRoomId = normalizeRoomId(roomId);

  if (!rooms.has(normalizedRoomId)) {
    rooms.set(normalizedRoomId, {
      roomId: normalizedRoomId,
      currentState: null,
      sequence: 0,
      clients: new Set(),
      createdAt: now(),
      updatedAt: now()
    });
  }

  return rooms.get(normalizedRoomId);
};

const makeCorsHeaders = () => ({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Cache-Control,X-FCUP-Room,X-FCUP-Token,Authorization',
  'Access-Control-Max-Age': '86400'
});

const sendJson = (res, statusCode, payload) => {
  const body = safeJson(payload);

  res.writeHead(statusCode, {
    ...makeCorsHeaders(),
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store'
  });

  res.end(body);
};

const sendOptions = res => {
  res.writeHead(204, makeCorsHeaders());
  res.end();
};

const readRequestBody = req => {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];

    req.on('data', chunk => {
      size += chunk.length;

      if (size > MAX_BODY_BYTES) {
        reject(new Error(`REQUEST_BODY_TOO_LARGE: ${size} bytes`));
        req.destroy();
        return;
      }

      chunks.push(chunk);
    });

    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');

      if (!raw.trim()) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(new Error(`INVALID_JSON: ${err?.message || String(err)}`));
      }
    });

    req.on('error', reject);
  });
};

const normalizeIncomingState = (room, payload) => {
  const incomingScene =
    payload?.programScene ||
    payload?.globalScene ||
    payload?.matchData?.globalScene ||
    'LIVE';

  const incomingMatchData = payload?.matchData && typeof payload.matchData === 'object'
    ? {
        ...payload.matchData,
        globalScene: incomingScene
      }
    : {
        globalScene: incomingScene
      };

  room.sequence += 1;
  room.updatedAt = now();

  return {
    type: 'FCUP_PROGRAM_STATE',
    ok: true,
    roomId: room.roomId,
    room: room.roomId,
    sequence: room.sequence,
    timestamp: room.updatedAt,
    programScene: incomingScene,
    globalScene: incomingScene,
    matchData: incomingMatchData,
    source: payload?.source || 'console'
  };
};

const broadcastState = (room, state) => {
  const data = safeJson(state);

  for (const client of [...room.clients]) {
    try {
      client.write(`id: ${state.sequence}\n`);
      client.write('event: program-state\n');
      client.write(`data: ${data}\n\n`);
    } catch (err) {
      room.clients.delete(client);
    }
  }
};

const getRoomSummary = room => ({
  roomId: room.roomId,
  room: room.roomId,
  sequence: room.sequence,
  clients: room.clients.size,
  hasState: !!room.currentState,
  programScene: room.currentState?.programScene || 'LIVE',
  createdAt: room.createdAt,
  updatedAt: room.updatedAt
});

const handleEvents = (req, res, requestUrl) => {
  if (!isAuthorized(req, requestUrl)) {
    sendJson(res, 401, {
      ok: false,
      error: 'UNAUTHORIZED'
    });
    return;
  }

  const roomId = getRoomIdFromRequest(req, requestUrl);
  const room = getRoom(roomId);

  res.writeHead(200, {
    ...makeCorsHeaders(),
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no'
  });

  res.write(`: FCUP sync connected room=${room.roomId}\n\n`);

  room.clients.add(res);

  if (room.currentState) {
    res.write(`id: ${room.currentState.sequence}\n`);
    res.write('event: program-state\n');
    res.write(`data: ${safeJson(room.currentState)}\n\n`);
  }

  const heartbeat = setInterval(() => {
    try {
      res.write(`: heartbeat ${now()} room=${room.roomId}\n\n`);
    } catch (err) {
      clearInterval(heartbeat);
      room.clients.delete(res);
    }
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
    room.clients.delete(res);
  });
};

const clearRoom = room => {
  room.sequence += 1;
  room.updatedAt = now();

  room.currentState = {
    type: 'FCUP_PROGRAM_STATE',
    ok: true,
    cleared: true,
    roomId: room.roomId,
    room: room.roomId,
    sequence: room.sequence,
    timestamp: room.updatedAt,
    programScene: 'LIVE',
    globalScene: 'LIVE',
    matchData: {
      globalScene: 'LIVE'
    },
    source: 'server-clear'
  };

  broadcastState(room, room.currentState);

  return room.currentState;
};

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host || `${HOST}:${PORT}`}`);
  const pathname = requestUrl.pathname;

  if (req.method === 'OPTIONS') {
    sendOptions(res);
    return;
  }

  if (req.method === 'GET' && pathname === '/health') {
    sendJson(res, 200, {
      ok: true,
      service: 'fcup-sync-server',
      mode: 'room',
      host: HOST,
      port: PORT,
      authEnabled: !!AUTH_TOKEN,
      rooms: rooms.size,
      totalClients: [...rooms.values()].reduce((sum, room) => sum + room.clients.size, 0),
      timestamp: now()
    });
    return;
  }

  if (req.method === 'GET' && pathname === '/rooms') {
    if (!isAuthorized(req, requestUrl)) {
      sendJson(res, 401, {
        ok: false,
        error: 'UNAUTHORIZED'
      });
      return;
    }

    sendJson(res, 200, {
      ok: true,
      rooms: [...rooms.values()].map(getRoomSummary),
      timestamp: now()
    });
    return;
  }

  if (req.method === 'GET' && pathname === '/state') {
    if (!isAuthorized(req, requestUrl)) {
      sendJson(res, 401, {
        ok: false,
        error: 'UNAUTHORIZED'
      });
      return;
    }

    const roomId = getRoomIdFromRequest(req, requestUrl);
    const room = getRoom(roomId);

    sendJson(res, 200, {
      ok: true,
      roomId: room.roomId,
      room: room.roomId,
      state: room.currentState,
      sequence: room.sequence,
      clients: room.clients.size,
      timestamp: now()
    });
    return;
  }

  if (req.method === 'GET' && pathname === '/events') {
    handleEvents(req, res, requestUrl);
    return;
  }

  if (req.method === 'POST' && pathname === '/state') {
    try {
      const payload = await readRequestBody(req);
      const roomId = getRoomIdFromRequest(req, requestUrl, payload);

      if (!isAuthorized(req, requestUrl, payload)) {
        sendJson(res, 401, {
          ok: false,
          error: 'UNAUTHORIZED'
        });
        return;
      }

      const room = getRoom(roomId);
      room.currentState = normalizeIncomingState(room, payload);
      broadcastState(room, room.currentState);

      sendJson(res, 200, {
        ok: true,
        accepted: true,
        roomId: room.roomId,
        room: room.roomId,
        sequence: room.currentState.sequence,
        programScene: room.currentState.programScene,
        clients: room.clients.size,
        timestamp: room.currentState.timestamp
      });
    } catch (err) {
      sendJson(res, 400, {
        ok: false,
        error: 'PUBLISH_FAILED',
        message: err?.message || String(err)
      });
    }

    return;
  }

  if (req.method === 'POST' && pathname === '/clear') {
    try {
      const payload = await readRequestBody(req);
      const roomId = getRoomIdFromRequest(req, requestUrl, payload);

      if (!isAuthorized(req, requestUrl, payload)) {
        sendJson(res, 401, {
          ok: false,
          error: 'UNAUTHORIZED'
        });
        return;
      }

      const room = getRoom(roomId);
      const state = clearRoom(room);

      sendJson(res, 200, {
        ok: true,
        cleared: true,
        roomId: room.roomId,
        room: room.roomId,
        sequence: state.sequence,
        timestamp: state.timestamp
      });
    } catch (err) {
      sendJson(res, 400, {
        ok: false,
        error: 'CLEAR_FAILED',
        message: err?.message || String(err)
      });
    }

    return;
  }

  if (req.method === 'POST' && pathname === '/clear-all') {
    try {
      const payload = await readRequestBody(req);

      if (!isAuthorized(req, requestUrl, payload)) {
        sendJson(res, 401, {
          ok: false,
          error: 'UNAUTHORIZED'
        });
        return;
      }

      const clearedRooms = [];

      for (const room of rooms.values()) {
        const state = clearRoom(room);
        clearedRooms.push({
          roomId: room.roomId,
          room: room.roomId,
          sequence: state.sequence,
          timestamp: state.timestamp
        });
      }

      sendJson(res, 200, {
        ok: true,
        cleared: true,
        rooms: clearedRooms,
        timestamp: now()
      });
    } catch (err) {
      sendJson(res, 400, {
        ok: false,
        error: 'CLEAR_ALL_FAILED',
        message: err?.message || String(err)
      });
    }

    return;
  }

  sendJson(res, 404, {
    ok: false,
    error: 'NOT_FOUND',
    path: pathname
  });
});

server.on('error', err => {
  console.error('[FCUP_SYNC] Server error:', err);
});

server.listen(PORT, HOST, () => {
  console.log('');
  console.log('======================================================');
  console.log('  FCUP Program Sync Server - Room Version');
  console.log('======================================================');
  console.log(`  Health: http://${HOST}:${PORT}/health`);
  console.log(`  Rooms : http://${HOST}:${PORT}/rooms`);
  console.log(`  State : http://${HOST}:${PORT}/state?room=${DEFAULT_ROOM}`);
  console.log(`  Events: http://${HOST}:${PORT}/events?room=${DEFAULT_ROOM}`);
  console.log(`  Auth  : ${AUTH_TOKEN ? 'enabled' : 'disabled'}`);
  console.log('');
  console.log('  Example console:');
  console.log(`    http://localhost:5173/?room=fcup26-match001&syncUrl=http://${HOST}:${PORT}`);
  console.log('  Example overlay:');
  console.log(`    http://localhost:5173/?room=fcup26-match001&syncUrl=http://${HOST}:${PORT}#overlay`);
  console.log('');
  console.log('  Keep this terminal open while broadcasting.');
  console.log('======================================================');
  console.log('');
});

const shutdown = signal => {
  console.log(`\n[FCUP_SYNC] Received ${signal}, shutting down...`);

  for (const room of rooms.values()) {
    for (const client of [...room.clients]) {
      try {
        client.end();
      } catch {}
    }

    room.clients.clear();
  }

  server.close(() => {
    console.log('[FCUP_SYNC] Server closed.');
    process.exit(0);
  });

  setTimeout(() => process.exit(0), 1500).unref();
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));