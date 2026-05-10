import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { defaultData } from '../constants/defaultData';
import { getSafeCasters } from '../utils';

const LEGACY_DATA_KEY = 'fries_cup_data';
const LEGACY_VIDEO_PROGRESS_KEY = 'fries_cup_video_progress';
const LEGACY_TICKER_COMMAND_KEY = 'fries_cup_ticker_command';

const GLOBAL_PROFILE_KEY = 'fries_cup_profile_v1';

const GLOBAL_PROFILE_FIELDS = [
  'rosterPresetLibrary',
  'teamPresets',
  'casters',
  'staffMembers',
  'shortcuts',
  'videoLibrary',
  'highlightLibrary',
  'coverCasters',
  'coverAdmins'
];

const normalizeRoomId = value => {
  const raw = String(value || '').trim();

  if (!raw) return 'local-draft';

  const normalized = raw
    .replace(/[^\w.-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);

  return normalized || 'local-draft';
};

const getExplicitRoomId = () => {
  if (typeof window === 'undefined') return 'local-draft';

  const url = new URL(window.location.href);

  return normalizeRoomId(
    url.searchParams.get('room') ||
    url.searchParams.get('roomId') ||
    url.searchParams.get('match') ||
    url.searchParams.get('matchId') ||
    ''
  );
};

const getScopedStorageKeys = roomId => {
  const safeRoomId = normalizeRoomId(roomId);

  return {
    roomId: safeRoomId,
    data: `${LEGACY_DATA_KEY}:${safeRoomId}`,
    videoProgress: `${LEGACY_VIDEO_PROGRESS_KEY}:${safeRoomId}`,
    tickerCommand: `${LEGACY_TICKER_COMMAND_KEY}:${safeRoomId}`
  };
};

const isPlainObject = value => {
  return value && typeof value === 'object' && !Array.isArray(value);
};

const cloneJsonSafe = value => {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return value;
  }
};

const pickGlobalProfileFields = data => {
  const source = data || {};
  const picked = {};

  GLOBAL_PROFILE_FIELDS.forEach(key => {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      picked[key] = source[key];
    }
  });

  return picked;
};

const stripGlobalProfileFields = data => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return data;

  const next = { ...data };

  GLOBAL_PROFILE_FIELDS.forEach(key => {
    delete next[key];
  });

  return next;
};

const mergeProfiles = (...profiles) => {
  return profiles.reduce((acc, profile) => {
    if (!isPlainObject(profile)) return acc;

    GLOBAL_PROFILE_FIELDS.forEach(key => {
      if (Object.prototype.hasOwnProperty.call(profile, key)) {
        acc[key] = profile[key];
      }
    });

    return acc;
  }, {});
};

// 🧹 专门用来清理本地缓存中已失效的 blob 临时体验卡
const cleanDeadBlobs = data => {
  if (!data) return data;

  const cleanedData = { ...data };

  // 1. 清理 StatsEditor 战绩 OCR 图
  if (cleanedData.statsImageTempUrl && cleanedData.statsImageTempUrl.startsWith('blob:')) {
    cleanedData.statsImageTempUrl = '';
  }

  // 2. 清理 RosterEditor A 队选手头像
  if (Array.isArray(cleanedData.rosterPlayersA)) {
    cleanedData.rosterPlayersA = cleanedData.rosterPlayersA.map(p =>
      p?.heroImage?.startsWith('blob:') ? { ...p, heroImage: '' } : p
    );
  }

  // 3. 清理 RosterEditor B 队选手头像
  if (Array.isArray(cleanedData.rosterPlayersB)) {
    cleanedData.rosterPlayersB = cleanedData.rosterPlayersB.map(p =>
      p?.heroImage?.startsWith('blob:') ? { ...p, heroImage: '' } : p
    );
  }

  // 4. 清理 CasterEditor 解说头像
  if (Array.isArray(cleanedData.casters)) {
    cleanedData.casters = cleanedData.casters.map(c =>
      c?.avatar?.startsWith('blob:') ? { ...c, avatar: '' } : c
    );
  }

  return cleanedData;
};

const saveDataToLocalStorage = (storageKey, data) => {
  try {
    localStorage.setItem(storageKey, JSON.stringify(data));
  } catch (err) {
    console.error(`[FCUP_STATE] Failed to save ${storageKey}:`, err);
  }
};

const readJsonFromLocalStorage = storageKey => {
  try {
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : null;
  } catch (err) {
    console.error(`[FCUP_STATE] Failed to read ${storageKey}:`, err);
    return null;
  }
};

const saveRoomAndProfileToLocalStorage = (storageKey, data) => {
  const safeData = data || {};
  const roomPayload = stripGlobalProfileFields(safeData);
  const existingProfile = readJsonFromLocalStorage(GLOBAL_PROFILE_KEY) || {};
  const nextProfile = mergeProfiles(existingProfile, pickGlobalProfileFields(safeData));

  saveDataToLocalStorage(storageKey, roomPayload);
  saveDataToLocalStorage(GLOBAL_PROFILE_KEY, nextProfile);
};

const mergeObject = (base, value) => ({
  ...(base || {}),
  ...(value && typeof value === 'object' && !Array.isArray(value) ? value : {})
});

const normalizeActivePlayers = players => {
  if (!Array.isArray(players)) return ['PLAYER1', 'PLAYER2', 'PLAYER3', 'PLAYER4', 'PLAYER5'];

  const oldDefault = ['P1', 'P2', 'P3', 'P4', 'P5'];
  const isOldDefault =
    players.length === oldDefault.length &&
    players.every((name, index) => String(name || '').trim().toUpperCase() === oldDefault[index]);

  if (isOldDefault) return ['PLAYER1', 'PLAYER2', 'PLAYER3', 'PLAYER4', 'PLAYER5'];

  return players;
};

const normalizeMapLineup = lineup => {
  const source = Array.isArray(lineup) && lineup.length ? lineup : defaultData.mapLineup;

  return source.map((map, index) => {
    const base = defaultData.mapLineup?.[index] || {};

    return {
      ...base,
      ...(map || {}),
      type: map?.type || base.type || 'CONTROL',
      name: map?.name || base.name || '',
      bansA: Array.isArray(map?.bansA) ? map.bansA : Array.isArray(base.bansA) ? base.bansA : [],
      bansB: Array.isArray(map?.bansB) ? map.bansB : Array.isArray(base.bansB) ? base.bansB : [],
      winner: map?.winner || '',
      winnerSide: map?.winnerSide || ''
    };
  });
};

const normalizeRosterStaff = (base, value) => {
  const merged = mergeObject(base, value);

  return {
    ...merged,
    manager: mergeObject(base?.manager, merged.manager),
    coaches: Array.isArray(merged.coaches) ? merged.coaches : []
  };
};

export function useMatchState() {
  const storageKeys = useMemo(() => getScopedStorageKeys(getExplicitRoomId()), []);

  const [matchData, setMatchData] = useState(defaultData);
  const [videoProgress, setVideoProgress] = useState({ currentTime: 0, duration: 0 });

  const matchDataRef = useRef(matchData);
  const saveTimeoutRef = useRef(null);

  const getNormalizedData = useCallback(input => {
    const merged = { ...defaultData, ...(input || {}) };

    const normalized = {
      ...merged,

      playersA: normalizeActivePlayers(merged.playersA),
      playersB: normalizeActivePlayers(merged.playersB),

      winnerScene: mergeObject(defaultData.winnerScene, merged.winnerScene),

      statsTemplateVisibility: mergeObject(
        defaultData.statsTemplateVisibility,
        merged.statsTemplateVisibility
      ),

      statsTemplateData: mergeObject(
        defaultData.statsTemplateData,
        merged.statsTemplateData
      ),

      eventMapPool: mergeObject(defaultData.eventMapPool, merged.eventMapPool),

      enabledMapTypes: mergeObject(defaultData.enabledMapTypes, merged.enabledMapTypes),

      rosterStaffA: normalizeRosterStaff(defaultData.rosterStaffA, merged.rosterStaffA),
      rosterStaffB: normalizeRosterStaff(defaultData.rosterStaffB, merged.rosterStaffB),

      mapLineup: normalizeMapLineup(merged.mapLineup)
    };

    return { ...normalized, casters: getSafeCasters(normalized) };
  }, []);

  const buildInitialData = useCallback(() => {
    const savedScopedData = readJsonFromLocalStorage(storageKeys.data);
    const savedLegacyData = readJsonFromLocalStorage(LEGACY_DATA_KEY);
    const savedProfileData = readJsonFromLocalStorage(GLOBAL_PROFILE_KEY);

    const legacyProfileSeed = pickGlobalProfileFields(savedLegacyData || {});
    const scopedProfileSeed = pickGlobalProfileFields(savedScopedData || {});

    const profileData = mergeProfiles(
      legacyProfileSeed,
      scopedProfileSeed,
      savedProfileData || {}
    );

    const shouldUseLegacyAsRoomData = !savedScopedData && storageKeys.roomId === 'local-draft';
    const rawRoomData = savedScopedData || (shouldUseLegacyAsRoomData ? savedLegacyData : null);
    const roomOnlyData = stripGlobalProfileFields(rawRoomData || {});

    return {
      profileData: cleanDeadBlobs(profileData),
      roomOnlyData: cleanDeadBlobs(roomOnlyData),
      hasScopedData: !!savedScopedData,
      hasLegacyRoomData: shouldUseLegacyAsRoomData && !!savedLegacyData
    };
  }, [storageKeys.data, storageKeys.roomId]);

  const scheduleSave = useCallback(data => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      saveRoomAndProfileToLocalStorage(storageKeys.data, data);
      saveTimeoutRef.current = null;
    }, 300);
  }, [storageKeys.data]);

  const flushSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    saveRoomAndProfileToLocalStorage(storageKeys.data, matchDataRef.current);
  }, [storageKeys.data]);

  const updateData = useCallback(nextInput => {
    setMatchData(prev => {
      const resolvedInput = typeof nextInput === 'function' ? nextInput(prev) : nextInput;
      const safeData = getNormalizedData({ ...prev, ...(resolvedInput || {}) });

      matchDataRef.current = safeData;
      scheduleSave(safeData);

      return safeData;
    });
  }, [getNormalizedData, scheduleSave]);

  useEffect(() => {
    const { profileData, roomOnlyData, hasScopedData, hasLegacyRoomData } = buildInitialData();

    const initialData = getNormalizedData({
      ...profileData,
      ...roomOnlyData
    });

    matchDataRef.current = initialData;
    setMatchData(initialData);

    if (!hasScopedData && hasLegacyRoomData) {
      saveRoomAndProfileToLocalStorage(storageKeys.data, initialData);
    } else if (Object.keys(profileData || {}).length) {
      saveRoomAndProfileToLocalStorage(storageKeys.data, initialData);
    }

    const savedScopedProgress = readJsonFromLocalStorage(storageKeys.videoProgress);
    const savedLegacyProgress = savedScopedProgress ? null : readJsonFromLocalStorage(LEGACY_VIDEO_PROGRESS_KEY);

    if (savedScopedProgress || savedLegacyProgress) {
      setVideoProgress(savedScopedProgress || savedLegacyProgress);
    }

    const handleStorage = e => {
      if (!e.newValue) return;

      try {
        if (e.key === storageKeys.data) {
          if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = null;
          }

          const parsedRoomData = JSON.parse(e.newValue);
          const cleanedRoomData = cleanDeadBlobs(stripGlobalProfileFields(parsedRoomData));
          const profileData = cleanDeadBlobs(readJsonFromLocalStorage(GLOBAL_PROFILE_KEY) || {});
          const normalized = getNormalizedData({
            ...profileData,
            ...cleanedRoomData
          });

          matchDataRef.current = normalized;
          setMatchData(normalized);
        } else if (e.key === GLOBAL_PROFILE_KEY) {
          const parsedProfileData = cleanDeadBlobs(JSON.parse(e.newValue));
          const currentRoomData = cleanDeadBlobs(stripGlobalProfileFields(matchDataRef.current));
          const normalized = getNormalizedData({
            ...parsedProfileData,
            ...currentRoomData
          });

          matchDataRef.current = normalized;
          setMatchData(normalized);
        } else if (e.key === storageKeys.videoProgress) {
          setVideoProgress(JSON.parse(e.newValue));
        } else if (e.key === storageKeys.tickerCommand && e.newValue === 'OFF') {
          updateData(prev => ({ ...prev, showTicker: false }));
          localStorage.removeItem(storageKeys.tickerCommand);
        } else if (e.key === LEGACY_TICKER_COMMAND_KEY && e.newValue === 'OFF' && storageKeys.roomId === 'local-draft') {
          updateData(prev => ({ ...prev, showTicker: false }));
          localStorage.removeItem(LEGACY_TICKER_COMMAND_KEY);
        }
      } catch (err) {
        console.error('Storage sync error:', err);
      }
    };

    const handleBeforeUnload = () => {
      flushSave();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      flushSave();
    };
  }, [
    storageKeys.data,
    storageKeys.videoProgress,
    storageKeys.tickerCommand,
    storageKeys.roomId,
    getNormalizedData,
    buildInitialData,
    updateData,
    flushSave
  ]);

  return { matchData, matchDataRef, videoProgress, updateData };
}