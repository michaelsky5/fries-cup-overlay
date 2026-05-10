// src/services/programSyncClient.js
// FCUP Program Sync Client - Room Version
//
// Console:
//   publishProgramState({ matchData, globalScene, programScene })
//
// Overlay:
//   subscribeProgramState(payload => { ... })
//
// URL Examples:
//   https://console.fries-cup.com/?room=fcup26-match001
//   https://console.fries-cup.com/?room=fcup26-match001#overlay
//   https://console.fries-cup.com/?room=fcup26-match001&syncUrl=http://127.0.0.1:4140#overlay

const DEFAULT_SYNC_SERVER_URL = 'http://127.0.0.1:4140';
const DEFAULT_ROOM_ID = 'default';

const SYNC_SERVER_URL_STORAGE_KEY = 'fcup-sync-server-url';
const TOKEN_STORAGE_KEY = 'fcup-sync-token';

const LOCAL_SYNC_CHANNEL_PREFIX = 'fcup-program-sync';
const LOCAL_SYNC_STORAGE_PREFIX = 'fcup-program-state';

const isBrowser = () => typeof window !== 'undefined';
const now = () => Date.now();

const normalizeRoomId = value => {
  const raw = String(value || DEFAULT_ROOM_ID).trim() || DEFAULT_ROOM_ID;
  const normalized = raw
    .replace(/[^\w.-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);

  return normalized || DEFAULT_ROOM_ID;
};

const removeTrailingSlash = value => String(value || '').replace(/\/+$/, '');

const safeParseJson = value => {
  if (!value || typeof value !== 'string') return null;

  try {
    return JSON.parse(value);
  } catch (err) {
    console.warn('[FCUP_PROGRAM_SYNC] Failed to parse JSON.', err);
    return null;
  }
};

const safeStringify = value => {
  try {
    return JSON.stringify(value);
  } catch (err) {
    console.warn('[FCUP_PROGRAM_SYNC] Failed to stringify payload.', err);
    return '{}';
  }
};

const getSearchParam = key => {
  if (!isBrowser()) return '';

  try {
    const searchParams = new URLSearchParams(window.location.search);
    const fromSearch = searchParams.get(key);
    if (fromSearch) return fromSearch;
  } catch {}

  try {
    const hash = String(window.location.hash || '');
    const hashQueryIndex = hash.indexOf('?');

    if (hashQueryIndex >= 0) {
      const hashParams = new URLSearchParams(hash.slice(hashQueryIndex + 1));
      const fromHashQuery = hashParams.get(key);
      if (fromHashQuery) return fromHashQuery;
    }

    if (hash.includes('&')) {
      const maybeQuery = hash.slice(hash.indexOf('&') + 1);
      const hashParams = new URLSearchParams(maybeQuery);
      const fromHashAmp = hashParams.get(key);
      if (fromHashAmp) return fromHashAmp;
    }
  } catch {}

  return '';
};

export const getProgramSyncServerUrl = explicitUrl => {
  if (explicitUrl) return removeTrailingSlash(explicitUrl);

  if (!isBrowser()) return DEFAULT_SYNC_SERVER_URL;

  try {
    const fromQuery = getSearchParam('syncUrl') || getSearchParam('sync');
    if (fromQuery) return removeTrailingSlash(fromQuery);
  } catch {}

  try {
    const fromWindow = window.__FCUP_SYNC_SERVER_URL__;
    if (fromWindow) return removeTrailingSlash(fromWindow);
  } catch {}

  try {
    const fromStorage = window.localStorage.getItem(SYNC_SERVER_URL_STORAGE_KEY);
    if (fromStorage) return removeTrailingSlash(fromStorage);
  } catch {}

  return DEFAULT_SYNC_SERVER_URL;
};

export const setProgramSyncServerUrl = url => {
  if (!isBrowser()) return;

  try {
    window.localStorage.setItem(
      SYNC_SERVER_URL_STORAGE_KEY,
      removeTrailingSlash(url || DEFAULT_SYNC_SERVER_URL)
    );
  } catch (err) {
    console.warn('[FCUP_PROGRAM_SYNC] Failed to save sync server url.', err);
  }
};

export const getProgramRoomId = explicitRoom => {
  if (explicitRoom) return normalizeRoomId(explicitRoom);

  if (!isBrowser()) return DEFAULT_ROOM_ID;

  try {
    const fromQuery =
      getSearchParam('room') ||
      getSearchParam('roomId') ||
      getSearchParam('match') ||
      getSearchParam('matchId');

    if (fromQuery) return normalizeRoomId(fromQuery);
  } catch {}

  return DEFAULT_ROOM_ID;
};

export const setProgramRoomId = roomId => {
  if (!isBrowser()) return;

  try {
    const normalizedRoomId = normalizeRoomId(roomId);
    const url = new URL(window.location.href);
    url.searchParams.set('room', normalizedRoomId);
    window.history.replaceState(null, '', url.toString());
  } catch (err) {
    console.warn('[FCUP_PROGRAM_SYNC] Failed to set room id in current URL.', err);
  }
};

export const getProgramSyncToken = explicitToken => {
  if (explicitToken) return String(explicitToken).trim();

  if (!isBrowser()) return '';

  try {
    const fromQuery = getSearchParam('token') || getSearchParam('syncToken');
    if (fromQuery) return String(fromQuery).trim();
  } catch {}

  try {
    const fromWindow = window.__FCUP_SYNC_TOKEN__;
    if (fromWindow) return String(fromWindow).trim();
  } catch {}

  try {
    return String(window.localStorage.getItem(TOKEN_STORAGE_KEY) || '').trim();
  } catch {}

  return '';
};

export const setProgramSyncToken = token => {
  if (!isBrowser()) return;

  try {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, String(token || '').trim());
  } catch (err) {
    console.warn('[FCUP_PROGRAM_SYNC] Failed to save sync token.', err);
  }
};

export const getLocalSyncChannelName = roomId => {
  return `${LOCAL_SYNC_CHANNEL_PREFIX}:${normalizeRoomId(roomId)}`;
};

export const getLocalSyncStorageKey = roomId => {
  return `${LOCAL_SYNC_STORAGE_PREFIX}:${normalizeRoomId(roomId)}`;
};

export const normalizeProgramPayload = (payload, options = {}) => {
  const incoming = payload && typeof payload === 'object' ? payload : {};
  const roomId = normalizeRoomId(
    options.roomId ||
    options.room ||
    incoming.roomId ||
    incoming.room ||
    getProgramRoomId()
  );

  const programScene =
    incoming.programScene ||
    incoming.globalScene ||
    incoming.matchData?.globalScene ||
    'LIVE';

  const matchData = incoming.matchData && typeof incoming.matchData === 'object'
    ? {
        ...incoming.matchData,
        globalScene: programScene
      }
    : {
        globalScene: programScene
      };

  return {
    type: 'FCUP_PROGRAM_STATE',
    ...incoming,
    roomId,
    room: roomId,
    matchData,
    programScene,
    globalScene: programScene,
    timestamp: Number(incoming.timestamp || 0) || now(),
    source: incoming.source || 'console'
  };
};

const buildUrl = (path, options = {}) => {
  const serverUrl = getProgramSyncServerUrl(options.serverUrl);
  const roomId = getProgramRoomId(options.roomId || options.room);
  const token = getProgramSyncToken(options.token);

  const url = new URL(path, `${serverUrl}/`);
  url.searchParams.set('room', roomId);

  if (token) url.searchParams.set('token', token);

  if (options.cacheBust !== false) {
    url.searchParams.set('t', String(Date.now()));
  }

  return url.toString();
};

const publishLocalFallback = (payload, options = {}) => {
  if (!isBrowser()) return;

  const normalized = normalizeProgramPayload(payload, options);
  const storageKey = getLocalSyncStorageKey(normalized.roomId);
  const channelName = getLocalSyncChannelName(normalized.roomId);

  try {
    window.localStorage.setItem(storageKey, safeStringify(normalized));
  } catch (err) {
    console.warn('[FCUP_PROGRAM_SYNC] localStorage fallback publish failed.', err);
  }

  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel(channelName);
      channel.postMessage(normalized);
      channel.close();
    }
  } catch (err) {
    console.warn('[FCUP_PROGRAM_SYNC] BroadcastChannel fallback publish failed.', err);
  }
};

export const publishProgramState = async (payload, options = {}) => {
  const normalized = normalizeProgramPayload(payload, options);
  const serverUrl = getProgramSyncServerUrl(options.serverUrl);
  const roomId = normalized.roomId;
  const token = getProgramSyncToken(options.token);

  publishLocalFallback(normalized, {
    ...options,
    roomId
  });

  if (!isBrowser() || typeof fetch !== 'function') {
    return {
      ok: false,
      mode: 'local-only',
      error: 'FETCH_UNAVAILABLE',
      roomId,
      payload: normalized
    };
  }

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutMs = Number(options.timeoutMs || 1200);
  const timeout = controller
    ? window.setTimeout(() => controller.abort(), timeoutMs)
    : null;

  try {
    const url = buildUrl('/state', {
      serverUrl,
      roomId,
      token,
      cacheBust: false
    });

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'X-FCUP-Room': roomId,
        ...(token ? { 'X-FCUP-Token': token } : {})
      },
      body: safeStringify(normalized),
      signal: controller?.signal
    });

    const json = await res.json().catch(() => null);

    return {
      ok: res.ok,
      mode: 'sync-server',
      status: res.status,
      roomId,
      response: json,
      payload: normalized
    };
  } catch (err) {
    console.warn('[FCUP_PROGRAM_SYNC] sync-server publish failed, local fallback already written.', err);

    return {
      ok: false,
      mode: 'fallback',
      roomId,
      error: err?.name || 'PUBLISH_FAILED',
      message: err?.message || String(err),
      payload: normalized
    };
  } finally {
    if (timeout) window.clearTimeout(timeout);
  }
};

export const getProgramState = async (options = {}) => {
  const roomId = getProgramRoomId(options.roomId || options.room);
  const token = getProgramSyncToken(options.token);

  if (!isBrowser() || typeof fetch !== 'function') {
    return null;
  }

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutMs = Number(options.timeoutMs || 1200);
  const timeout = controller
    ? window.setTimeout(() => controller.abort(), timeoutMs)
    : null;

  try {
    const url = buildUrl('/state', {
      ...options,
      roomId,
      token
    });

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-store',
        'X-FCUP-Room': roomId,
        ...(token ? { 'X-FCUP-Token': token } : {})
      },
      signal: controller?.signal
    });

    const json = await res.json().catch(() => null);
    const state = json?.state || null;

    return state
      ? normalizeProgramPayload(state, { roomId })
      : null;
  } catch (err) {
    console.warn('[FCUP_PROGRAM_SYNC] getProgramState failed.', err);
    return null;
  } finally {
    if (timeout) window.clearTimeout(timeout);
  }
};

export const listProgramRooms = async (options = {}) => {
  const token = getProgramSyncToken(options.token);

  if (!isBrowser() || typeof fetch !== 'function') {
    return [];
  }

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutMs = Number(options.timeoutMs || 1200);
  const timeout = controller
    ? window.setTimeout(() => controller.abort(), timeoutMs)
    : null;

  try {
    const serverUrl = getProgramSyncServerUrl(options.serverUrl);
    const url = new URL('/rooms', `${serverUrl}/`);

    if (token) url.searchParams.set('token', token);
    url.searchParams.set('t', String(Date.now()));

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-store',
        ...(token ? { 'X-FCUP-Token': token } : {})
      },
      signal: controller?.signal
    });

    const json = await res.json().catch(() => null);
    return Array.isArray(json?.rooms) ? json.rooms : [];
  } catch (err) {
    console.warn('[FCUP_PROGRAM_SYNC] listProgramRooms failed.', err);
    return [];
  } finally {
    if (timeout) window.clearTimeout(timeout);
  }
};

export const checkProgramSyncHealth = async (options = {}) => {
  const serverUrl = getProgramSyncServerUrl(options.serverUrl);

  if (!isBrowser() || typeof fetch !== 'function') {
    return {
      ok: false,
      error: 'FETCH_UNAVAILABLE',
      serverUrl
    };
  }

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutMs = Number(options.timeoutMs || 1000);
  const timeout = controller
    ? window.setTimeout(() => controller.abort(), timeoutMs)
    : null;

  try {
    const url = new URL('/health', `${serverUrl}/`);
    url.searchParams.set('t', String(Date.now()));

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-store'
      },
      signal: controller?.signal
    });

    const json = await res.json().catch(() => null);

    return {
      ok: res.ok,
      status: res.status,
      serverUrl,
      data: json
    };
  } catch (err) {
    return {
      ok: false,
      serverUrl,
      error: err?.name || 'HEALTH_CHECK_FAILED',
      message: err?.message || String(err)
    };
  } finally {
    if (timeout) window.clearTimeout(timeout);
  }
};

export const subscribeProgramState = (callback, options = {}) => {
  if (!isBrowser()) return () => {};

  const roomId = getProgramRoomId(options.roomId || options.room);
  const token = getProgramSyncToken(options.token);
  const serverUrl = getProgramSyncServerUrl(options.serverUrl);

  const pollIntervalMs = Number(options.pollIntervalMs || 1000);
  const reconnectDelayMs = Number(options.reconnectDelayMs || 1500);

  const storageKey = getLocalSyncStorageKey(roomId);
  const channelName = getLocalSyncChannelName(roomId);

  let disposed = false;
  let eventSource = null;
  let broadcastChannel = null;
  let pollTimer = null;
  let reconnectTimer = null;
  let lastSeenKey = '';
  let lastSeenTimestamp = 0;

  const emit = rawPayload => {
    if (disposed || !rawPayload) return;

    const payload = normalizeProgramPayload(rawPayload, { roomId });
    const payloadTimestamp = Number(payload.timestamp || 0);

    if (
      payloadTimestamp > 0 &&
      lastSeenTimestamp > 0 &&
      payloadTimestamp < lastSeenTimestamp
    ) {
      console.warn('[FCUP_PROGRAM_SYNC] Ignored stale payload.', {
        roomId,
        scene: payload.globalScene,
        payloadTimestamp,
        lastSeenTimestamp
      });
      return;
    }

    const key = [
      payload.roomId,
      payload.sequence || '',
      payloadTimestamp || '',
      payload.globalScene || ''
    ].join(':');

    if (key === lastSeenKey) return;
    lastSeenKey = key;

    if (payloadTimestamp > 0) {
      lastSeenTimestamp = Math.max(lastSeenTimestamp, payloadTimestamp);
    }

    callback(payload);
  };

  const readLocalStorage = () => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      const payload = safeParseJson(raw);
      if (payload) emit(payload);
    } catch (err) {
      console.warn('[FCUP_PROGRAM_SYNC] localStorage read failed.', err);
    }
  };

  const connectSSE = () => {
    if (disposed || typeof EventSource === 'undefined') return;

    try {
      const url = buildUrl('/events', {
        serverUrl,
        roomId,
        token,
        cacheBust: false
      });

      eventSource = new EventSource(url);

      eventSource.addEventListener('program-state', event => {
        const payload = safeParseJson(event.data);
        if (payload) emit(payload);
      });

      eventSource.onerror = () => {
        if (disposed) return;

        try {
          eventSource.close();
        } catch {}

        eventSource = null;

        if (!reconnectTimer) {
          reconnectTimer = window.setTimeout(() => {
            reconnectTimer = null;
            connectSSE();
          }, reconnectDelayMs);
        }
      };
    } catch (err) {
      console.warn('[FCUP_PROGRAM_SYNC] SSE subscribe failed.', err);

      if (!reconnectTimer) {
        reconnectTimer = window.setTimeout(() => {
          reconnectTimer = null;
          connectSSE();
        }, reconnectDelayMs);
      }
    }
  };

  const connectBroadcastChannel = () => {
    try {
      if (typeof BroadcastChannel === 'undefined') return;

      broadcastChannel = new BroadcastChannel(channelName);
      broadcastChannel.onmessage = event => emit(event.data);
    } catch (err) {
      console.warn('[FCUP_PROGRAM_SYNC] BroadcastChannel subscribe failed.', err);
    }
  };

  const handleStorage = event => {
    if (event.key !== storageKey) return;

    const payload = safeParseJson(event.newValue);
    if (payload) emit(payload);
  };

  connectSSE();
  connectBroadcastChannel();

  window.addEventListener('storage', handleStorage);

  getProgramState({
    serverUrl,
    roomId,
    token
  })
    .then(state => {
      if (state) emit(state);
      else readLocalStorage();
    })
    .catch(() => readLocalStorage());

  pollTimer = window.setInterval(async () => {
    if (disposed) return;

    const state = await getProgramState({
      serverUrl,
      roomId,
      token,
      timeoutMs: 800
    });

    if (state) {
      emit(state);
      return;
    }

    readLocalStorage();
  }, pollIntervalMs);

  return () => {
    disposed = true;

    window.removeEventListener('storage', handleStorage);

    if (pollTimer) window.clearInterval(pollTimer);
    if (reconnectTimer) window.clearTimeout(reconnectTimer);

    if (eventSource) {
      try {
        eventSource.close();
      } catch {}
    }

    if (broadcastChannel) {
      try {
        broadcastChannel.close();
      } catch {}
    }
  };
};

const programSyncClient = {
  DEFAULT_SYNC_SERVER_URL,
  DEFAULT_ROOM_ID,

  getProgramSyncServerUrl,
  setProgramSyncServerUrl,

  getProgramRoomId,
  setProgramRoomId,

  getProgramSyncToken,
  setProgramSyncToken,

  getLocalSyncChannelName,
  getLocalSyncStorageKey,

  normalizeProgramPayload,
  publishProgramState,
  subscribeProgramState,
  getProgramState,
  listProgramRooms,
  checkProgramSyncHealth
};

export default programSyncClient;